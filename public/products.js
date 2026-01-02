document.addEventListener("DOMContentLoaded", () => {
    
    // --- 1. KIỂM TRA ĐĂNG NHẬP NGAY LẬP TỨC ---
    checkLoginStatus();

    // --- 2. LOGIC TẢI SẢN PHẨM (Code cũ của bạn) ---
    let categoryCode = '';
    const path = window.location.pathname;

    // Phân loại trang
    if (path.includes('lmht_giamgia')) categoryCode = 'LMHT_SALE';
    else if (path.includes('lmht_thongthao')) categoryCode = 'LMHT_ZIN';
    else if (path.includes('lmht_svnuocngoai')) categoryCode = 'LMHT_FOREIGN';
    else if (path.includes('lmht')) categoryCode = 'LMHT'; 
    else if (path.includes('lienquan')) categoryCode = 'LQ';
    else if (path.includes('freefire')) categoryCode = 'FF';
    else if (path.includes('dtcl')) categoryCode = 'DTCL';
    else if (path.includes('tocchien')) categoryCode = 'TC';
    else if (path.includes('valorant')) categoryCode = 'VAL';

    // Gọi hàm tải dữ liệu nếu xác định được mã game
    if (categoryCode) {
        loadProducts(categoryCode);
    }
});

// --- HÀM 1: TẢI SẢN PHẨM ---
async function loadProducts(code) {
    const grid = document.getElementById("product-list");
    if (!grid) return;

    try {
        // Nếu là mã LMHT_SALE nhưng trong DB bạn chưa tạo CategoryCode này thì nó sẽ không tìm thấy.
        // Tạm thời nếu test lỗi, bạn có thể thử đổi code thành 'LMHT' để xem nó hiện gì không.
        const res = await fetch(`/api/products/${code}`);
        const products = await res.json();

        grid.innerHTML = "";

        if (products.length === 0) {
            grid.innerHTML = "<p style='color:white; text-align:center; width:100%'>Hiện chưa có acc nào.</p>";
            return;
        }

        products.forEach(acc => {
            const price = new Intl.NumberFormat('vi-VN').format(acc.Price);
            
            const card = document.createElement("div");
            card.className = "game-card"; // Class này sẽ nhận CSS bạn vừa thêm
            
            card.innerHTML = `
                <div class="card-img-wrap">
                    <img src="${acc.ImageURL}" alt="${acc.Title}" onerror="this.src='https://via.placeholder.com/300'">
                </div>
                <h3>${acc.Title}</h3>
                <p>Mã số: #${acc.ProductID}</p>
                <p style="color: #ffc107; font-weight: bold; font-size: 16px;">${price} VNĐ</p>
                <button onclick="buyNow(${acc.ProductID})">MUA NGAY</button>
            `;
            
            grid.appendChild(card);
        });

    } catch (err) {
        console.error(err);
        grid.innerHTML = "<p style='color:red; text-align:center;'>Lỗi kết nối Server!</p>";
    }
}

// --- HÀM 2: KIỂM TRA ĐĂNG NHẬP (MỚI THÊM) ---
function checkLoginStatus() {
    // Lấy thông tin user từ bộ nhớ trình duyệt
    const userStr = localStorage.getItem("user");
    const authSection = document.getElementById("auth-section");

    if (userStr && authSection) {
        const user = JSON.parse(userStr);
        // Định dạng tiền tệ
        const moneyFormat = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(user.balance || 0);

        // Thay đổi giao diện Header
        authSection.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px; font-size: 13px;">
                <span style="color: white; font-weight: 600;">Hi, ${user.username}</span>
                <span style="color: #ffc107; font-weight: bold;">(${moneyFormat})</span>
                <button onclick="logout()" style="background: #e53935; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;">Thoát</button>
            </div>
        `;
    }
}

// --- HÀM 3: ĐĂNG XUẤT ---
function logout() {
    if(confirm("Bạn muốn đăng xuất?")) {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        window.location.reload(); // Tải lại trang
    }
}

// --- HÀM 4: MUA HÀNG (ĐÃ HOÀN THIỆN) ---
function buyNow(productID) {
    // 1. Kiểm tra dữ liệu đăng nhập trong LocalStorage
    const userStr = localStorage.getItem("user");
    
    // Nếu chưa đăng nhập
    if (!userStr) {
        alert("Vui lòng đăng nhập để mua tài khoản!");
        // Lưu ý: Kiểm tra lại đường dẫn file login của bạn cho đúng
        window.location.href = "/user/login.html"; 
        return;
    }

    // 2. Phân tích chuỗi JSON để lấy User ID
    try {
        const user = JSON.parse(userStr);
        
        // Cố gắng lấy ID (phòng trường hợp bạn lưu là 'id', 'UserID' hay 'userid')
        const userId = user.id || user.UserID || user.userid;

        if (!userId) {
            alert("Lỗi phiên đăng nhập: Không tìm thấy ID người dùng. Vui lòng đăng nhập lại.");
            // Xóa dữ liệu lỗi và tải lại
            localStorage.removeItem("user");
            window.location.reload();
            return;
        }

        // 3. Hỏi xác nhận mua hàng (Tránh bấm nhầm)
        const xacNhan = confirm(`Bạn có chắc chắn muốn mua Acc mã số #${productID} không?`);
        
        if (xacNhan) {
            // 4. Chuyển hướng sang trang xử lý giao dịch (buy.html)
            // Truyền ID sản phẩm và ID người dùng lên thanh địa chỉ
            window.location.href = `/buy.html?id=${productID}&userid=${userId}`;
        }

    } catch (e) {
        console.error("Lỗi phân tích dữ liệu user:", e);
        alert("Có lỗi xảy ra với thông tin tài khoản. Vui lòng đăng nhập lại.");
    }
}
