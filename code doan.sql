-- ==================================================================================
-- 1. KHỞI TẠO DATABASE (Làm sạch và tạo mới)
-- ==================================================================================
USE master;
GO

-- !!! QUAN TRỌNG: Hủy bỏ mọi giao dịch đang bị treo trước đó !!!
IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
GO

IF EXISTS (SELECT * FROM sys.databases WHERE name = 'ShopGame')
BEGIN
    ALTER DATABASE ShopGame SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE ShopGame;
END
GO

CREATE DATABASE ShopGame;
GO
USE ShopGame;
GO

-- ==================================================================================
-- 2. TẠO BẢNG (TABLES)
-- ==================================================================================

-- 2.1. Bảng Người Dùng
CREATE TABLE Users (
    UserID INT IDENTITY(1,1) PRIMARY KEY,
    Username VARCHAR(50) NOT NULL UNIQUE,
    Password VARCHAR(255) NOT NULL,
    Fullname NVARCHAR(100),
    Email VARCHAR(100),
    Balance DECIMAL(18, 0) DEFAULT 0,
    Role VARCHAR(20) DEFAULT 'User' CHECK (Role IN ('Admin', 'User')), 
    CreatedAt DATETIME DEFAULT GETDATE()
);
GO

-- 2.2. Bảng Danh Mục Game
CREATE TABLE Categories (
    CategoryID INT IDENTITY(1,1) PRIMARY KEY,
    CategoryName NVARCHAR(100) NOT NULL,
    CategoryCode VARCHAR(20) NOT NULL UNIQUE,
    ImageURL VARCHAR(MAX)
);
GO

-- 2.3. Bảng Sản Phẩm
CREATE TABLE Products (
    ProductID INT IDENTITY(1,1) PRIMARY KEY,
    CategoryID INT,
    Title NVARCHAR(255) NOT NULL,
    Price DECIMAL(18, 0) NOT NULL,
    Description NVARCHAR(MAX),
    ImageURL VARCHAR(MAX),
    GameAccount VARCHAR(100), 
    GamePassword VARCHAR(100), 
    IsSold BIT DEFAULT 0,
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (CategoryID) REFERENCES Categories(CategoryID)
);
GO

-- 2.4. Bảng Lịch Sử Mua Hàng
CREATE TABLE Orders (
    OrderID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT,
    ProductID INT,
    Price DECIMAL(18, 0) NOT NULL,
    OrderDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID)
);
GO

-- 2.5. Bảng Lịch Sử Nạp Thẻ
CREATE TABLE Deposits (
    DepositID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT,
    CardType NVARCHAR(50),
    Serial VARCHAR(50) NOT NULL,
    Code VARCHAR(50) NOT NULL,
    Amount DECIMAL(18, 0) NOT NULL,
    Status VARCHAR(20) DEFAULT 'Pending',
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);
GO

-- 2.6. Bảng Kho Đồ
CREATE TABLE Inventory (
    InvID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT,
    GameName NVARCHAR(50), 
    AccUser VARCHAR(50),    
    AccPass VARCHAR(50),    
    Price DECIMAL(18,0),
    ImageURL VARCHAR(MAX),
    RankInfo NVARCHAR(100),
    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);
GO

-- 2.7. Bảng Lịch Sử Giao Dịch
CREATE TABLE Transactions (
    TransID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT,
    Content NVARCHAR(200),
    Amount DECIMAL(18,0),  
    Status NVARCHAR(50),
    CreatedDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);
GO

-- ==================================================================================
-- 3. NẠP DỮ LIỆU MẪU (MỖI LOẠI 8 SẢN PHẨM)
-- ==================================================================================

-- A. Thêm User
INSERT INTO Users (Username, Password, Fullname, Balance, Role, Email) 
VALUES 
('admin', '123', N'Admin Shop', 0, 'Admin', 'admin@shop.com'),
('khach', '123', N'Khách Hàng Vip', 50000000, 'User', 'khachhangvip@gmail.com'); -- Cho nhiều tiền để test

-- B. Thêm Danh Mục
INSERT INTO Categories (CategoryName, CategoryCode, ImageURL) VALUES 
(N'Liên Minh Huyền Thoại', 'LMHT', 'images/lmht1.jpg'),
(N'LMHT Giảm Giá', 'LMHT_SALE', 'images/lmht2.jpg'),
(N'LMHT Thông Thạo', 'LMHT_ZIN', 'images/lmht3.jpg'),
(N'LMHT Server Nước Ngoài', 'LMHT_FOREIGN', 'images/lmht4.jpg'),
(N'Đấu Trường Chân Lý', 'DTCL', 'images/dtcl1.jpg'),
(N'DTCL Pet Tím', 'DTCL_PET', 'images/dtcl2.jpg'),
(N'Liên Quân Mobile', 'LQ', 'images/lienquan.jpg'),
(N'Free Fire', 'FF', 'images/freefire.jpg'),
(N'Tốc Chiến', 'TC', 'images/tocchien.jpg'),
(N'Valorant', 'VAL', 'images/valorant.jpg');

-- C. Thêm Sản Phẩm (Mỗi mục 8 ACC)

-- 1. LMHT Giảm Giá (8 Acc)
DECLARE @SaleID INT = (SELECT CategoryID FROM Categories WHERE CategoryCode = 'LMHT_SALE');
INSERT INTO Products (CategoryID, Title, Price, Description, ImageURL, GameAccount, GamePassword, IsSold) VALUES 
(@SaleID, N'Acc Yasuo 9k Trắng Thông Tin', 9000, N'Lv30, chưa rank, trắng thông tin', 'images/lmht2.jpg', 'sale1', 'p1', 0),
(@SaleID, N'Xả Kho Acc Skin Tối Thượng', 50000, N'Có Lux Thập Đại Nguyên Tố', 'images/lmht1.jpg', 'sale2', 'p2', 0),
(@SaleID, N'Acc Học Sinh Giá Rẻ', 15000, N'Ngẫu nhiên 10-20 tướng', 'images/lmht4.jpg', 'sale3', 'p3', 0),
(@SaleID, N'Acc Smurf Rank Bạc', 20000, N'Rank Bạc, 30 tướng, skin ngẫu nhiên', 'images/lmht2.jpg', 'sale4', 'p4', 0),
(@SaleID, N'Acc Luyện Tập', 10000, N'Level 30, đủ tinh hoa mua tướng', 'images/lmht2.jpg', 'sale5', 'p5', 0),
(@SaleID, N'Acc Aram God', 25000, N'Full xúc xắc, nhiều tướng Aram', 'images/lmht1.jpg', 'sale6', 'p6', 0),
(@SaleID, N'Acc Đồng Đoàn', 15000, N'Rank Đồng, dành cho anh em thích hành gà', 'images/lmht3.jpg', 'sale7', 'p7', 0),
(@SaleID, N'Acc Full Tướng Giá Rẻ', 80000, N'Full tướng, không skin, giá thanh lý', 'images/lmht4.jpg', 'sale8', 'p8', 0);

-- 2. LMHT Thông Thạo (8 Acc)
DECLARE @ZinID INT = (SELECT CategoryID FROM Categories WHERE CategoryCode = 'LMHT_ZIN');
INSERT INTO Products (CategoryID, Title, Price, Description, ImageURL, GameAccount, GamePassword, IsSold) VALUES 
(@ZinID, N'Best Zed 1 Triệu Điểm', 250000, N'Rank Bạch Kim, Zed 1tr thông thạo', 'images/lmht3.jpg', 'zin1', 'p1', 0),
(@ZinID, N'Lee Sin Thông Thạo 7', 150000, N'Múa cực khét, skin Nộ Long Cước', 'images/lmht1.jpg', 'zin2', 'p2', 0),
(@ZinID, N'Thresh Madlife 2tr Điểm', 300000, N'Kéo là trúng, best Support VN', 'images/lmht3.jpg', 'zin3', 'p3', 0),
(@ZinID, N'Riven Combo Fast Q', 180000, N'Thông thạo 7, skin Thần Kiếm', 'images/lmht1.jpg', 'zin4', 'p4', 0),
(@ZinID, N'Master Yi Q to Win', 50000, N'Thông thạo 7, chuyên vét mạng', 'images/lmht2.jpg', 'zin5', 'p5', 0),
(@ZinID, N'Vayne Gosu', 220000, N'Acc chuyên AD, thả diều cực mượt', 'images/lmht4.jpg', 'zin6', 'p6', 0),
(@ZinID, N'Teemo Global Taunt', 100000, N'Thông thạo 7, skin Ong Mật cực ngứa mắt', 'images/lmht3.jpg', 'zin7', 'p7', 0),
(@ZinID, N'Yasuo Gank Team 20p', 120000, N'Thông thạo 7, 0/10/0 vẫn múa', 'images/lmht1.jpg', 'zin8', 'p8', 0);

-- 3. Liên Quân Mobile (8 Acc)
DECLARE @LqID INT = (SELECT CategoryID FROM Categories WHERE CategoryCode = 'LQ');
INSERT INTO Products (CategoryID, Title, Price, Description, ImageURL, GameAccount, GamePassword, IsSold) VALUES 
(@LqID, N'Acc LQ Full Tướng', 200000, N'Ngọc chuẩn, rank Cao Thủ', 'images/lienquan.jpg', 'lq1', 'p1', 0),
(@LqID, N'Acc Florentino Giám Sát', 500000, N'Skin SS hữu hạn, múa bao mượt', 'images/lienquan.jpg', 'lq2', 'p2', 0),
(@LqID, N'Acc Nakroth Lôi Quang', 350000, N'Skin SS cực đẹp, Rank Cao Thủ', 'images/lienquan.jpg', 'lq3', 'p3', 0),
(@LqID, N'Acc Raz Muay Thái', 450000, N'Full hiệu ứng, đấm cực thốn', 'images/lienquan.jpg', 'lq4', 'p4', 0),
(@LqID, N'Acc Clone Rank Vàng', 20000, N'Acc giá rẻ tập luyện, đủ ngọc', 'images/lienquan.jpg', 'lq5', 'p5', 0),
(@LqID, N'Acc Full Tướng Ngọc 90', 150000, N'Đủ ngọc chuẩn, vào là chiến', 'images/lienquan.jpg', 'lq6', 'p6', 0),
(@LqID, N'Acc Tulen Tân Thần', 600000, N'Skin SSS Tuyệt Sắc, acc VIP', 'images/lienquan.jpg', 'lq7', 'p7', 0),
(@LqID, N'Acc Murad Siêu Việt', 250000, N'Skin bậc SS, Rank Tinh Anh', 'images/lienquan.jpg', 'lq8', 'p8', 0);

-- 4. Tốc Chiến (8 Acc)
DECLARE @TcID INT = (SELECT CategoryID FROM Categories WHERE CategoryCode = 'TC');
INSERT INTO Products (CategoryID, Title, Price, Description, ImageURL, GameAccount, GamePassword, IsSold) VALUES 
(@TcID, N'Acc Tốc Chiến Full Tướng', 200000, N'Rank Lục Bảo, skin Tiệc Bể Bơi', 'https://via.placeholder.com/300?text=TocChien1', 'tc1', 'p1', 0),
(@TcID, N'Acc Yasuo Ma Kiếm', 150000, N'Rank Vàng, chuyên Yasuo', 'https://via.placeholder.com/300?text=TocChien2', 'tc2', 'p2', 0),
(@TcID, N'Acc Rank Cao Thủ', 500000, N'Win rate 60%, skin xịn', 'https://via.placeholder.com/300?text=TocChien3', 'tc3', 'p3', 0),
(@TcID, N'Acc Lee Sin Quyền Thái', 180000, N'Insec bao mượt, Rank Bạch Kim', 'https://via.placeholder.com/300?text=TocChien4', 'tc4', 'p4', 0),
(@TcID, N'Acc Zed Tử Thần', 220000, N'Skin Huyền Thoại, One champ Zed', 'https://via.placeholder.com/300?text=TocChien5', 'tc5', 'p5', 0),
(@TcID, N'Acc Full Skin Lux', 300000, N'Dành cho các bạn nữ, Rank Vàng', 'https://via.placeholder.com/300?text=TocChien6', 'tc6', 'p6', 0),
(@TcID, N'Acc Smurf Rank Sắt', 30000, N'Acc mới lập, hành gà cực đã', 'https://via.placeholder.com/300?text=TocChien7', 'tc7', 'p7', 0),
(@TcID, N'Acc Akali K/DA All Out', 250000, N'Skin KDA cực chất, combo chuẩn', 'https://via.placeholder.com/300?text=TocChien8', 'tc8', 'p8', 0);

-- 5. Valorant (8 Acc)
DECLARE @ValID INT = (SELECT CategoryID FROM Categories WHERE CategoryCode = 'VAL');
INSERT INTO Products (CategoryID, Title, Price, Description, ImageURL, GameAccount, GamePassword, IsSold) VALUES 
(@ValID, N'Acc Vandal Prime', 250000, N'Aim bao dính, tiếng bắn giòn', 'https://via.placeholder.com/300?text=Valorant1', 'val1', 'p1', 0),
(@ValID, N'Acc Sheriff Reaver', 180000, N'One tap cực sướng, full kĩ năng', 'https://via.placeholder.com/300?text=Valorant2', 'val2', 'p2', 0),
(@ValID, N'Acc Dao Karambit Prime', 600000, N'Múa dao cực đẹp, acc tâm huyết', 'https://via.placeholder.com/300?text=Valorant3', 'val3', 'p3', 0),
(@ValID, N'Acc Full Agent', 100000, N'Đã mở khóa hết tướng, chưa skin', 'https://via.placeholder.com/300?text=Valorant4', 'val4', 'p4', 0),
(@ValID, N'Acc Vandal RGX 11z Pro', 300000, N'Rank Kim Cương, full kĩ năng', 'https://via.placeholder.com/300?text=Valorant5', 'val5', 'p5', 0),
(@ValID, N'Acc Operator Elderflame', 450000, N'Súng rồng lửa cực đẹp', 'https://via.placeholder.com/300?text=Valorant6', 'val6', 'p6', 0),
(@ValID, N'Acc Giá Rẻ Cho Newbie', 50000, N'Rank Sắt, có vài skin battlepass', 'https://via.placeholder.com/300?text=Valorant7', 'val7', 'p7', 0),
(@ValID, N'Acc Phantom Oni', 350000, N'Acc ngon, Phantom Oni thiết kế đẹp', 'https://via.placeholder.com/300?text=Valorant8', 'val8', 'p8', 0);

-- 6. Free Fire (8 Acc)
DECLARE @FfID INT = (SELECT CategoryID FROM Categories WHERE CategoryCode = 'FF');
INSERT INTO Products (CategoryID, Title, Price, Description, ImageURL, GameAccount, GamePassword, IsSold) VALUES 
(@FfID, N'Acc Scar Titan', 800000, N'Súng tăng tốc bắn cực mạnh', 'https://via.placeholder.com/300?text=FreeFire1', 'ff1', 'p1', 0),
(@FfID, N'Acc Nhân vật Alok', 50000, N'Full cấp, kỹ năng hồi máu bá đạo', 'https://via.placeholder.com/300?text=FreeFire2', 'ff2', 'p2', 0),
(@FfID, N'Acc Set Hip Hop', 1500000, N'Đồ hiếm từ mùa đầu, cực chất', 'https://via.placeholder.com/300?text=FreeFire3', 'ff3', 'p3', 0),
(@FfID, N'Acc AK Rồng Xanh', 400000, N'Skin súng lv max, hiệu ứng đẹp', 'https://via.placeholder.com/300?text=FreeFire4', 'ff4', 'p4', 0),
(@FfID, N'Acc FF Quỷ Dạ Xoa', 120000, N'Nhiều đồ thời trang hiếm', 'https://via.placeholder.com/300?text=FreeFire5', 'ff5', 'p5', 0),
(@FfID, N'Acc Súng MP40 Mãng Xà', 250000, N'Acc cực vip, bao ngầu', 'https://via.placeholder.com/300?text=FreeFire6', 'ff6', 'p6', 0),
(@FfID, N'Acc Cày Thuê Rank', 500000, N'Rank cao nhất, top server', 'https://via.placeholder.com/300?text=FreeFire7', 'ff7', 'p7', 0),
(@FfID, N'Acc Sơn Tinh Thủy Tinh', 600000, N'Skin sự kiện Việt Nam, cực hiếm', 'https://via.placeholder.com/300?text=FreeFire8', 'ff8', 'p8', 0);

-- D. Thêm Dữ Liệu Cho Trang Profile (User: khach - ID: 2)
INSERT INTO Inventory (UserID, GameName, AccUser, AccPass, Price, ImageURL, RankInfo) VALUES 
(2, N'Liên Minh Huyền Thoại', 'yasuo_gank_20gg', 'password123', 500000, 'images/lmht1.jpg', N'Rank: Cao Thủ'),
(2, N'Valorant', 'valo_pro_99', 'headshot1', 800000, 'images/valorant.jpg', N'Rank: Ascendant');

INSERT INTO Transactions (UserID, Content, Amount, Status) VALUES 
(2, N'Nạp tiền qua Momo', 50000000, N'Thành công'),
(2, N'Mua Acc Yasuo Cao Thủ', -500000, N'Hoàn tất'),
(2, N'Mua Acc Valorant Ascendant', -800000, N'Hoàn tất');
GO

USE ShopGame;
GO

-- 1. Xóa thủ tục cũ nếu bị lỗi hoặc đã tồn tại
IF OBJECT_ID('sp_MuaNgay', 'P') IS NOT NULL
    DROP PROCEDURE sp_MuaNgay;
GO

-- 2. Tạo lại thủ tục xử lý mua hàng (Phiên bản tương thích mọi SQL Server)
CREATE PROCEDURE sp_MuaNgay
    @UserID INT,
    @ProductID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Khai báo biến
    DECLARE @IsSold BIT;
    DECLARE @Price DECIMAL(18,0);
    DECLARE @Title NVARCHAR(255);
    DECLARE @AccUser VARCHAR(100);
    DECLARE @AccPass VARCHAR(100);
    DECLARE @Img VARCHAR(MAX);
    DECLARE @Desc NVARCHAR(MAX);
    DECLARE @CurrentBalance DECIMAL(18,0);
    DECLARE @Err INT; -- Biến dùng để bắt lỗi

    -- Bắt đầu giao dịch
    BEGIN TRANSACTION;

    -- A. KIỂM TRA SẢN PHẨM (Dùng UPDLOCK để khóa dòng)
    SELECT @IsSold = IsSold, 
           @Price = Price, 
           @Title = Title,
           @AccUser = GameAccount,
           @AccPass = GamePassword,
           @Img = ImageURL,
           @Desc = Description
    FROM Products WITH (UPDLOCK) 
    WHERE ProductID = @ProductID;

    -- Kiểm tra tồn tại
    IF @IsSold IS NULL
    BEGIN
        ROLLBACK TRANSACTION;
        SELECT N'Lỗi' AS TrangThai, N'Sản phẩm không tồn tại.' AS ThongBao;
        RETURN;
    END

    -- Kiểm tra đã bán chưa
    IF @IsSold = 1
    BEGIN
        ROLLBACK TRANSACTION;
        SELECT N'Lỗi' AS TrangThai, N'Sản phẩm này đã bị người khác mua mất rồi!' AS ThongBao;
        RETURN;
    END

    -- B. KIỂM TRA TIỀN
    SELECT @CurrentBalance = Balance FROM Users WHERE UserID = @UserID;

    IF @CurrentBalance < @Price
    BEGIN
        ROLLBACK TRANSACTION;
        SELECT N'Lỗi' AS TrangThai, N'Số dư không đủ. Vui lòng nạp thêm tiền.' AS ThongBao;
        RETURN;
    END

    -- C. THỰC HIỆN GIAO DỊCH (Kiểm tra lỗi sau mỗi bước)
    
    -- 1. Trừ tiền
    UPDATE Users SET Balance = Balance - @Price WHERE UserID = @UserID;
    SET @Err = @@ERROR; IF @Err <> 0 GOTO ErrorHandler;

    -- 2. Đánh dấu đã bán
    UPDATE Products SET IsSold = 1 WHERE ProductID = @ProductID;
    SET @Err = @@ERROR; IF @Err <> 0 GOTO ErrorHandler;

    -- 3. Lưu lịch sử Order
    INSERT INTO Orders (UserID, ProductID, Price) VALUES (@UserID, @ProductID, @Price);
    SET @Err = @@ERROR; IF @Err <> 0 GOTO ErrorHandler;

    -- 4. Lưu lịch sử Giao dịch
    INSERT INTO Transactions (UserID, Content, Amount, Status) VALUES (@UserID, N'Mua Acc: ' + @Title, -@Price, N'Hoàn tất');
    SET @Err = @@ERROR; IF @Err <> 0 GOTO ErrorHandler;

    -- 5. Lưu vào Kho đồ
    INSERT INTO Inventory (UserID, GameName, AccUser, AccPass, Price, ImageURL, RankInfo) VALUES (@UserID, @Title, @AccUser, @AccPass, @Price, @Img, @Desc);
    SET @Err = @@ERROR; IF @Err <> 0 GOTO ErrorHandler;

    -- D. HOÀN TẤT
    COMMIT TRANSACTION;
    SELECT 'ThanhCong' AS TrangThai, N'Mua hàng thành công!' AS ThongBao, @AccUser AS GameAccount, @AccPass AS GamePassword;
    RETURN;

-- E. XỬ LÝ KHI GẶP LỖI (Nhảy xuống đây nếu GOTO ErrorHandler được gọi)
ErrorHandler:
    ROLLBACK TRANSACTION;
    SELECT N'Lỗi' AS TrangThai, N'Lỗi hệ thống SQL (Mã lỗi: ' + CAST(@Err AS VARCHAR) + N')' AS ThongBao;
    RETURN;
END;
GO
EXEC sp_MuaNgay @UserID = 2, @ProductID = 1;
USE ShopGame;
GO

-- Thêm danh mục Săn Pet và Thử Vận May
INSERT INTO Categories (CategoryName, CategoryCode, ImageURL) VALUES 
(N'Săn Pet Tím', 'DTCL_HUNT', 'images/dtcl3.jpg'),
(N'Thử Vận May Pet', 'DTCL_LUCK', 'images/dtcl4.jpg');

-- Thêm vài sản phẩm mẫu cho 2 mục này để test web
DECLARE @HuntID INT = (SELECT CategoryID FROM Categories WHERE CategoryCode = 'DTCL_HUNT');
INSERT INTO Products (CategoryID, Title, Price, Description, ImageURL, IsSold) VALUES 
(@HuntID, N'Vé Săn Pet Gwen', 50000, N'Cơ hội nhận Gwen Tí Nị', 'images/dtcl3.jpg', 0);

DECLARE @LuckID INT = (SELECT CategoryID FROM Categories WHERE CategoryCode = 'DTCL_LUCK');
INSERT INTO Products (CategoryID, Title, Price, Description, ImageURL, IsSold) VALUES 
(@LuckID, N'Hòm May Mắn 20k', 20000, N'Hên xui ra Pet xịn', 'images/dtcl4.jpg', 0);
USE ShopGame;
GO

-- Lấy ID của danh mục "Liên Minh Huyền Thoại" (Mã LMHT)
DECLARE @LmhtID INT = (SELECT CategoryID FROM Categories WHERE CategoryCode = 'LMHT');

-- Thêm 4 acc mẫu vào danh mục này
INSERT INTO Products (CategoryID, Title, Price, Description, ImageURL, GameAccount, GamePassword, IsSold) VALUES 
(@LmhtID, N'Acc Yasuo Ma Kiếm VIP', 150000, N'Rank Vàng, Full thông tin', 'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Yasuo_3.jpg', 'yasuo1', '123', 0),
(@LmhtID, N'Acc Zed Tử Thần', 200000, N'Rank Bạch Kim, Skin đẹp', 'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Zed_2.jpg', 'zed1', '123', 0),
(@LmhtID, N'Acc Leesin Quyền Thái', 50000, N'Giá rẻ cho học sinh', 'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/LeeSin_4.jpg', 'lee1', '123', 0),
(@LmhtID, N'Acc Lux Thập Đại', 300000, N'Full Skin Lux, Rank Kim Cương', 'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Lux_6.jpg', 'lux1', '123', 0);
USE ShopGame;
GO

-- =======================================================
-- 1. THÊM ACC LIÊN MINH - THÔNG THẠO CAO (LMHT_ZIN)
-- =======================================================
DECLARE @ZinID INT = (SELECT CategoryID FROM Categories WHERE CategoryCode = 'LMHT_ZIN');

INSERT INTO Products (CategoryID, Title, Price, Description, ImageURL, GameAccount, GamePassword, IsSold) VALUES 
(@ZinID, N'Acc Yasuo 2 Triệu Thông Thạo', 250000, N'Múa cực mượt, không mua phí đời', 'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Yasuo_10.jpg', 'yasuo_2m', '123456', 0),
(@ZinID, N'Best Zed Galaxy - One Champ', 300000, N'Zed Tử Thần Không Gian, Combo bao chuẩn', 'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Zed_15.jpg', 'zed_onechamp', '123456', 0),
(@ZinID, N'Lee Sin Quyền Thái - Insec God', 150000, N'Lee Sin 500k điểm, đá là trúng', 'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/LeeSin_4.jpg', 'lee_god', '123456', 0),
(@ZinID, N'Riven Thần Kiếm - Combo Fast Q', 200000, N'Acc chuyên Top, Riven trùm sever', 'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Riven_9.jpg', 'riven_top', '123456', 0);


-- =======================================================
-- 2. THÊM ACC SERVER NƯỚC NGOÀI (LMHT_FOREIGN)
-- =======================================================
DECLARE @ForeignID INT = (SELECT CategoryID FROM Categories WHERE CategoryCode = 'LMHT_FOREIGN');

INSERT INTO Products (CategoryID, Title, Price, Description, ImageURL, GameAccount, GamePassword, IsSold) VALUES 
(@ForeignID, N'Acc Server Bắc Mỹ (NA) Full Champ', 500000, N'Ping 200, Full tướng, Rank Vàng', 'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Ashe_11.jpg', 'na_user', '123', 0),
(@ForeignID, N'Acc Server Hàn (KR) Rank Kim Cương', 1200000, N'Acc xịn, cần Fake IP để chơi', 'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Ahri_14.jpg', 'kr_faker', '123', 0),
(@ForeignID, N'Acc Server Nhật Bản (JP) Voice Anime', 300000, N'Full Voice Nhật cực hay', 'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Ezreal_20.jpg', 'jp_voice', '123', 0);


-- =======================================================
-- 3. THÊM ACC ĐẤU TRƯỜNG CHÂN LÝ (DTCL)
-- =======================================================
DECLARE @DtclID INT = (SELECT CategoryID FROM Categories WHERE CategoryCode = 'DTCL');

INSERT INTO Products (CategoryID, Title, Price, Description, ImageURL, GameAccount, GamePassword, IsSold) VALUES 
(@DtclID, N'Acc DTCL Rank Cao Thủ', 200000, N'Sẵn rank Cao Thủ, về chỉ việc leo Thách Đấu', 'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Pengu_Cosplay_Tristana_0.jpg', 'tft_master', '123', 0),
(@DtclID, N'Acc Full Sàn Đấu + Chưởng Lực', 150000, N'Nhiều sàn đẹp, hiệu ứng kết liễu xịn', 'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Gwen_0.jpg', 'tft_arena', '123', 0);


-- =======================================================
-- 4. THÊM ACC DTCL PET TÍM (DTCL_PET)
-- =======================================================
DECLARE @PetID INT = (SELECT CategoryID FROM Categories WHERE CategoryCode = 'DTCL_PET');

INSERT INTO Products (CategoryID, Title, Price, Description, ImageURL, GameAccount, GamePassword, IsSold) VALUES 
(@PetID, N'Acc Có Yasuo Tí Nị Chiến Binh Rồng', 450000, N'Pet hiếm nhất game, múa sáo cực ngầu', 'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Yasuo_19.jpg', 'pet_yasuo', '123', 0),
(@PetID, N'Acc Có Yone Tí Nị', 350000, N'Pet mới ra mắt, hiệu ứng đẹp', 'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Yone_1.jpg', 'pet_yone', '123', 0),
(@PetID, N'Acc Có Lee Sin Tí Nị', 300000, N'Nộ Long Cước phiên bản cute', 'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/LeeSin_11.jpg', 'pet_lee', '123', 0);


-- =======================================================
-- 5. THÊM SẢN PHẨM SĂN PET & VẬN MAY (DTCL_HUNT, DTCL_LUCK)
-- =======================================================
-- Lưu ý: Nếu chưa có Category này thì Insert trước, nếu có rồi thì bỏ qua 2 dòng INSERT Categories
IF NOT EXISTS (SELECT * FROM Categories WHERE CategoryCode = 'DTCL_HUNT')
   INSERT INTO Categories (CategoryName, CategoryCode, ImageURL) VALUES (N'Săn Pet', 'DTCL_HUNT', 'images/hunt.jpg');

IF NOT EXISTS (SELECT * FROM Categories WHERE CategoryCode = 'DTCL_LUCK')
   INSERT INTO Categories (CategoryName, CategoryCode, ImageURL) VALUES (N'Thử Vận May', 'DTCL_LUCK', 'images/luck.jpg');

DECLARE @HuntID INT = (SELECT CategoryID FROM Categories WHERE CategoryCode = 'DTCL_HUNT');
INSERT INTO Products (CategoryID, Title, Price, Description, ImageURL, GameAccount, GamePassword, IsSold) VALUES 
(@HuntID, N'Vé Săn Pet Gwen Tí Nị', 50000, N'Cơ hội 10% trúng Gwen Tí Nị', 'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Gwen_1.jpg', 'code_gwen', '123', 0);

DECLARE @LuckID INT = (SELECT CategoryID FROM Categories WHERE CategoryCode = 'DTCL_LUCK');
INSERT INTO Products (CategoryID, Title, Price, Description, ImageURL, GameAccount, GamePassword, IsSold) VALUES 
(@LuckID, N'Hòm May Mắn 20k', 20000, N'Random Acc (10% ra acc xịn)', 'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Teemo_8.jpg', 'random_20k', '123', 0);