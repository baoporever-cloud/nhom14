const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// --- 1. CẤU HÌNH KẾT NỐI SQL SERVER ---
const config = {
    user: 'sa',
    password: '123456',      // <--- Đảm bảo mật khẩu đúng
    server: 'localhost',     // Hoặc 'localhost\\SQLEXPRESS'
    database: 'ShopGame',
    options: {
        encrypt: false,      // Đổi thành false để tránh lỗi SSL certificate ở local
        trustServerCertificate: true 
    }
};

// --- 2. MIDDLEWARE ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'))); 

// --- 3. HÀM KẾT NỐI DÙNG CHUNG (connectDB) ---
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

        const checkUser = await pool.request()
            .input('u', sql.VarChar, username)
            .query("SELECT * FROM Users WHERE Username = @u");

        if (checkUser.recordset.length > 0) {
            return res.json({ success: false, message: 'Tên tài khoản đã tồn tại!' });
        }

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

// --- API 2: ĐĂNG NHẬP (QUAN TRỌNG: Đã thêm UserID) ---
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
                    id: user.UserID,        // <--- ĐÃ SỬA: Trả về ID để lưu localStorage
                    username: user.Username,
                    balance: user.Balance,
                    role: user.Role,
                    fullname: user.Fullname
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

// --- API 4: LẤY THÔNG TIN USER ---
// Đã sửa để nhận userid động từ frontend (nếu có), mặc định là 2 nếu không gửi
app.get('/api/info', async (req, res) => {
    try {
        const userId = req.query.userid || 2; // Nhận ID từ query
        const pool = await connectDB();
        const result = await pool.request()
            .input('uid', sql.Int, userId)
            .query("SELECT Fullname, Email, Balance FROM Users WHERE UserID = @uid");
        
        if (result.recordset.length > 0) {
            res.json(result.recordset[0]);
        } else {
            res.status(404).send("User not found");
        }
    } catch (err) { res.status(500).send(err.message); }
});

// --- API 5: LẤY KHO ĐỒ ---
app.get('/api/inventory', async (req, res) => {
    try {
        const userId = req.query.userid || 2;
        const pool = await connectDB();
        const result = await pool.request()
            .input('uid', sql.Int, userId)
            .query("SELECT * FROM Inventory WHERE UserID = @uid");
        
        res.json(result.recordset);
    } catch (err) { res.status(500).send(err.message); }
});

// --- API 6: LẤY LỊCH SỬ ---
app.get('/api/history', async (req, res) => {
    try {
        const userId = req.query.userid || 2;
        const pool = await connectDB();
        const result = await pool.request()
            .input('uid', sql.Int, userId)
            .query("SELECT * FROM Transactions WHERE UserID = @uid ORDER BY CreatedDate DESC");
        
        res.json(result.recordset);
    } catch (err) { res.status(500).send(err.message); }
});

// --- API 7: CẬP NHẬT TÊN HIỂN THỊ ---
app.post('/api/update-name', async (req, res) => {
    try {
        const { newName, userid } = req.body; // Cần gửi thêm userid từ frontend
        const uid = userid || 2; 

        const pool = await connectDB();
        await pool.request()
            .input('name', sql.NVarChar, newName)
            .input('uid', sql.Int, uid)
            .query("UPDATE Users SET Fullname = @name WHERE UserID = @uid");
            
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

// =============================================================
// API 9: XỬ LÝ MUA HÀNG (Sửa lỗi tên hàm connect)
// =============================================================
app.get('/buy', async (req, res) => {
    try {
        const productId = req.query.id;
        const userId = req.query.userid;

        if (!productId || !userId) {
            return res.status(400).json({ status: 'Loi', message: 'Thiếu thông tin (ID sản phẩm hoặc User).' });
        }

        // --- SỬA LỖI Ở ĐÂY: Dùng connectDB() thay vì connectToDb() ---
        const pool = await connectDB();

        // Gọi Stored Procedure 'sp_MuaNgay'
        const result = await pool.request()
            .input('UserID', sql.Int, userId)
            .input('ProductID', sql.Int, productId)
            .execute('sp_MuaNgay');

        if (result.recordset.length > 0) {
            const data = result.recordset[0];
            res.json({
                status: data.TrangThai,      
                message: data.ThongBao,
                account: data.GameAccount || '',
                password: data.GamePassword || ''
            });
        } else {
            res.json({ status: 'Loi', message: 'Không nhận được phản hồi từ Database.' });
        }

    } catch (err) {
        console.error("Lỗi server:", err);
        res.status(500).json({ status: 'Loi', message: 'Lỗi Server: ' + err.message });
    }
});

// --- 4. KHỞI ĐỘNG SERVER ---
app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
});
