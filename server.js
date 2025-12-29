const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const path = require('path');
const app = express();

// --- CẤU HÌNH KẾT NỐI SQL SERVER ---
// QUAN TRỌNG: Bạn hãy thay đổi '123' thành mật khẩu SA của bạn
const config = {
    user: 'sa',
    password: '123456',             // <--- THAY MẬT KHẨU CỦA BẠN VÀO ĐÂY
    server: 'localhost',         // Nếu lỗi, hãy thử: 'localhost\\SQLEXPRESS'
    database: 'ShopGame',
    options: {
        encrypt: true,
        trustServerCertificate: true // Bắt buộc true khi chạy Local
    }
};

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cấu hình thư mục chứa file giao diện (HTML/CSS/JS)
app.use(express.static(path.join(__dirname, 'public')));

// Kiểm tra kết nối Database khi khởi động
sql.connect(config).then(pool => {
    if (pool.connected) {
        console.log("✅ Đã kết nối SQL Server thành công!");
    }
}).catch(err => {
    console.error("❌ Lỗi kết nối SQL Server:", err.message);
    console.log("👉 Gợi ý: Kiểm tra lại mật khẩu trong file server.js hoặc bật TCP/IP trong SQL Configuration.");
});

// --- CÁC API XỬ LÝ ---

// 1. API Đăng Ký
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const pool = await sql.connect(config);

        // Kiểm tra trùng tên
        const checkUser = await pool.request()
            .input('u', sql.VarChar, username)
            .query("SELECT * FROM Users WHERE Username = @u");

        if (checkUser.recordset.length > 0) {
            return res.json({ success: false, message: 'Tên tài khoản đã tồn tại!' });
        }

        // Thêm User mới (Mặc định Role là User, Balance là 0)
        await pool.request()
            .input('u', sql.VarChar, username)
            .input('e', sql.VarChar, email)
            .input('p', sql.VarChar, password)
            .query("INSERT INTO Users (Username, Email, Password, Role, Balance) VALUES (@u, @e, @p, 'User', 0)");

        res.json({ success: true, message: 'Đăng ký thành công!' });
    } catch (err) {
        console.error("Lỗi đăng ký:", err);
        res.status(500).json({ success: false, message: 'Lỗi Server' });
    }
});

// 2. API Đăng Nhập
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const pool = await sql.connect(config);

        const result = await pool.request()
            .input('u', sql.VarChar, username)
            .input('p', sql.VarChar, password)
            .query("SELECT * FROM Users WHERE Username = @u AND Password = @p");

        if (result.recordset.length > 0) {
            const user = result.recordset[0];
            // Trả về thông tin User bao gồm cả Role để Frontend xử lý
            res.json({
                success: true,
                message: 'Đăng nhập thành công',
                token: 'fake-jwt-token', 
                user: {
                    username: user.Username,
                    balance: user.Balance,
                    role: user.Role // Quan trọng cho việc phân quyền
                }
            });
        } else {
            res.json({ success: false, message: 'Sai tài khoản hoặc mật khẩu!' });
        }
    } catch (err) {
        console.error("Lỗi đăng nhập:", err);
        res.status(500).json({ success: false, message: 'Lỗi Server' });
    }
});

// 3. API Nạp Tiền
app.post('/api/topup', async (req, res) => {
    try {
        const { username, cardType, amount, code, serial } = req.body;
        const pool = await sql.connect(config);

        // Lấy UserID
        const userRes = await pool.request().input('u', sql.VarChar, username).query("SELECT UserID FROM Users WHERE Username = @u");
        if (userRes.recordset.length === 0) return res.json({ success: false, message: "User không xác định" });
        
        const userId = userRes.recordset[0].UserID;

        // Lưu lịch sử nạp
        await pool.request()
            .input('uid', sql.Int, userId)
            .input('type', sql.NVarChar, cardType)
            .input('ser', sql.VarChar, serial)
            .input('cod', sql.VarChar, code)
            .input('amt', sql.Decimal, amount)
            .query("INSERT INTO Deposits (UserID, CardType, Serial, Code, Amount, Status) VALUES (@uid, @type, @ser, @cod, @amt, 'Pending')");

        res.json({ success: true, message: "Gửi thẻ thành công, chờ Admin duyệt!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Lỗi Server" });
    }
});
// --- API 3: LẤY KHO ĐỒ (NICK ĐÃ MUA) ---
app.get('/api/inventory', async (req, res) => {
    try {
        const pool = await connectDB();
        // Lấy danh sách nick của UserID = 1
        const result = await pool.request()
            .query("SELECT * FROM Inventory WHERE UserID = 1");
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// --- API 4: LẤY LỊCH SỬ GIAO DỊCH ---
app.get('/api/history', async (req, res) => {
    try {
        const pool = await connectDB();
        // Lấy lịch sử của UserID = 1, sắp xếp mới nhất lên đầu
        const result = await pool.request()
            .query("SELECT * FROM Transactions WHERE UserID = 1 ORDER BY CreatedDate DESC");
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});
// Chạy Server
const PORT = 3000;
// Trong file server.js
// API lấy danh sách sản phẩm theo Mã Game (VD: LMHT, FF, LQ)
app.get('/api/products/:categoryCode', async (req, res) => {
    try {
        const code = req.params.categoryCode; 
        const pool = await sql.connect(config);
        
        // Lấy sản phẩm dựa trên CategoryCode trong bảng Categories
        const result = await pool.request()
            .input('code', sql.VarChar, code)
            .query(`
                SELECT p.* FROM Products p
                JOIN Categories c ON p.CategoryID = c.CategoryID
                WHERE c.CategoryCode = @code AND p.IsSold = 0
            `);

        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).send("Lỗi Server");
    }
});
app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
});
