const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// --- 1. CẤU HÌNH KẾT NỐI SQL SERVER ---
const config = {
    user: 'sa',
    password: '123456',      // <--- Thay mật khẩu của bạn vào đây
    server: 'localhost',  // Hoặc 'localhost\\SQLEXPRESS'
    database: 'ShopGame',
    options: {
        encrypt: true,
        trustServerCertificate: true // Bắt buộc true khi chạy Local
    }
};

// --- 2. MIDDLEWARE ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'))); // Folder chứa HTML/CSS/JS

// --- 3. HÀM KẾT NỐI DÙNG CHUNG (connectDB) ---
// Hàm này giúp tái sử dụng kết nối, tránh lỗi khi gọi API nhiều lần
async function connectDB() {
    try {
        let pool = await sql.connect(config);
        return pool;
    } catch (err) {
        console.error("❌ Lỗi kết nối SQL Server:", err.message);
        throw err;
    }
}

// Kiểm tra kết nối khi khởi động
connectDB().then(() => console.log("✅ Đã kết nối SQL Server thành công!"));


// ==========================================================
//                      DANH SÁCH API
// ==========================================================

// --- API 1: ĐĂNG KÝ ---
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const pool = await connectDB();

        // Kiểm tra trùng tên
        const checkUser = await pool.request()
            .input('u', sql.VarChar, username)
            .query("SELECT * FROM Users WHERE Username = @u");

        if (checkUser.recordset.length > 0) {
            return res.json({ success: false, message: 'Tên tài khoản đã tồn tại!' });
        }

        // Thêm User mới
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

// --- API 2: ĐĂNG NHẬP ---
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const pool = await connectDB();

        const result = await pool.request()
            .input('u', sql.VarChar, username)
            .input('p', sql.VarChar, password)
            .query("SELECT * FROM Users WHERE Username = @u AND Password = @p");

        if (result.recordset.length > 0) {
            const user = result.recordset[0];
            res.json({
                success: true,
                message: 'Đăng nhập thành công',
                token: 'fake-jwt-token',
                user: {
                    username: user.Username,
                    balance: user.Balance,
                    role: user.Role,
                    fullname: user.Fullname // Trả về thêm Fullname để hiển thị
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

// --- API 3: NẠP TIỀN ---
app.post('/api/topup', async (req, res) => {
    try {
        const { username, cardType, amount, code, serial } = req.body;
        const pool = await connectDB();

        const userRes = await pool.request().input('u', sql.VarChar, username).query("SELECT UserID FROM Users WHERE Username = @u");
        if (userRes.recordset.length === 0) return res.json({ success: false, message: "User không xác định" });
        
        const userId = userRes.recordset[0].UserID;

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

// --- API 4: LẤY THÔNG TIN USER (Header & Sidebar) ---
// *Lưu ý: Đang hardcode UserID = 2 theo yêu cầu của bạn. 
// Nếu muốn động, hãy gửi username từ client lên.
app.get('/api/info', async (req, res) => {
    try {
        const pool = await connectDB();
        const result = await pool.request()
            .query("SELECT Fullname, Email, Balance FROM Users WHERE UserID = 2");
        
        if (result.recordset.length > 0) {
            res.json(result.recordset[0]);
        } else {
            res.status(404).send("User not found");
        }
    } catch (err) { res.status(500).send(err.message); }
});

// --- API 5: LẤY KHO ĐỒ (Inventory) ---
app.get('/api/inventory', async (req, res) => {
    try {
        const pool = await connectDB();
        const result = await pool.request()
            .query("SELECT * FROM Inventory WHERE UserID = 2");
        
        res.json(result.recordset);
    } catch (err) { res.status(500).send(err.message); }
});

// --- API 6: LẤY LỊCH SỬ (Transactions) ---
app.get('/api/history', async (req, res) => {
    try {
        const pool = await connectDB();
        const result = await pool.request()
            .query("SELECT * FROM Transactions WHERE UserID = 2 ORDER BY CreatedDate DESC");
        
        res.json(result.recordset);
    } catch (err) { res.status(500).send(err.message); }
});

// --- API 7: CẬP NHẬT TÊN HIỂN THỊ ---
app.post('/api/update-name', async (req, res) => {
    try {
        const { newName } = req.body;
        const pool = await connectDB();
        
        await pool.request()
            .input('name', sql.NVarChar, newName)
            .query("UPDATE Users SET Fullname = @name WHERE UserID = 2");
            
        res.send('success');
    } catch (err) { res.status(500).send(err.message); }
});

// --- API 8: LẤY SẢN PHẨM THEO DANH MỤC ---
app.get('/api/products/:categoryCode', async (req, res) => {
    try {
        const code = req.params.categoryCode; 
        const pool = await connectDB();
        
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

// --- 4. KHỞI ĐỘNG SERVER ---
app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
});
