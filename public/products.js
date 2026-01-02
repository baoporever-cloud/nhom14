document.addEventListener("DOMContentLoaded", () => {
    checkLoginStatus();

    let categoryCode = '';
    
    // Ưu tiên lấy từ HTML trước (cho chắc chắn)
    const container = document.getElementById("product-list");
    if (container && container.getAttribute("data-category") !== "ALL") {
        categoryCode = container.getAttribute("data-category");
    } 
    // Nếu HTML không có hoặc để ALL thì mới tự đoán qua đường dẫn
    else {
        const path = window.location.pathname;

        // --- QUAN TRỌNG: CÁC MỤC CON PHẢI ĐỂ TRÊN ---
        if (path.includes('lmht_giamgia')) categoryCode = 'LMHT_SALE';
        else if (path.includes('lmht_thongthao')) categoryCode = 'LMHT_ZIN'; // <--- Dòng này phải đứng trước
        else if (path.includes('lmht_svnuocngoai')) categoryCode = 'LMHT_FOREIGN';
        
        // --- MỤC CHUNG (TỰ CHỌN) PHẢI ĐỂ CUỐI CÙNG ---
        else if (path.includes('lmht')) categoryCode = 'LMHT'; 
        
        // Các game khác
        else if (path.includes('dtcl_pettim')) categoryCode = 'DTCL_PET';
        else if (path.includes('sanpettim')) categoryCode = 'DTCL_HUNT';
        else if (path.includes('thuvanmay')) categoryCode = 'DTCL_LUCK';
        else if (path.includes('dtcl')) categoryCode = 'DTCL';
    }

    if (categoryCode) {
        loadProducts(categoryCode);
    }
});

// --- HÀM 1: TẢI SẢN PHẨM ---
// --- HÀM 1: TẢI SẢN PHẨM (ĐÃ SỬA LẠI HTML CHO KHỚP VỚI CSS) ---
async function loadProducts(code) {
    const grid = document.getElementById("product-list");
    if (!grid) return;

    // Thêm hiệu ứng loading
    grid.innerHTML = '<p style="color:#aaa; width:100%; text-align:center;">Đang tải dữ liệu...</p>';

    try {
        const res = await fetch(`/api/products/${code}`);
        const products = await res.json();

        grid.innerHTML = ""; // Xóa loading

        if (products.length === 0) {
            grid.innerHTML = "<p style='color:#aaa; text-align:center; width:100%'>Chưa có acc nào trong mục này.</p>";
            return;
        }

        products.forEach(acc => {
            // Định dạng giá tiền
            const price = new Intl.NumberFormat('vi-VN').format(acc.Price);
            const oldPrice = new Intl.NumberFormat('vi-VN').format(acc.Price * 1.3); // Giá ảo để gạch ngang

            // Tạo thẻ div bao ngoài
            const card = document.createElement("div");
            card.className = "product-card"; // [QUAN TRỌNG] Tên class phải là product-card

            // Nội dung HTML bên trong (Khớp với CSS lmht_tuchon.css)
            card.innerHTML = `
                <div class="card-image">
                    <span class="badge-discount">-30%</span>
                    <img src="${acc.ImageURL}" alt="${acc.Title}" onerror="this.src='https://via.placeholder.com/300?text=No+Image'">
                </div>
                
                <div class="card-details">
                    <div class="product-title" title="${acc.Title}">${acc.Title}</div>
                    
                    <div class="tags-row">
                        <span class="tag-id">#${acc.ProductID}</span>
                        <span class="tag-status"><i class="fa-solid fa-circle-check"></i> SẴN SÀNG</span>
                    </div>

                    <div class="price-row">
                        <span class="price-old">${oldPrice} đ</span>
                        <span class="price-new">${price} đ</span>
                    </div>

                    <div class="action-row">
                        <button class="btn-cart"><i class="fa-solid fa-cart-shopping"></i></button>
                        <a href="javascript:void(0)" class="btn-buy" onclick="buyNow(${acc.ProductID})">
                            <i class="fa-regular fa-credit-card"></i> Mua ngay
                        </a>
                    </div>
                </div>
            `;
            
            grid.appendChild(card);
        });

    } catch (err) {
        console.error(err);
        grid.innerHTML = "<p style='color:red; text-align:center;'>Lỗi kết nối Server! Hãy kiểm tra 'node server.js'</p>";
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
