document.addEventListener("DOMContentLoaded", () => {
  
  // --- 1. KIỂM TRA ĐĂNG NHẬP (Chạy ngay khi load trang) ---
  checkLoginStatus();

  // --- 2. XỬ LÝ SỰ KIỆN NÚT LỌC (SEARCH) ---
  const btnFilter = document.getElementById("btnFilter");
  const inputKeyword = document.getElementById("keyword");
  const selectGame = document.getElementById("game");

  if (btnFilter) {
    btnFilter.addEventListener("click", () => {
      const keyword = inputKeyword.value.trim().toLowerCase();
      const gameType = selectGame.value.trim().toLowerCase(); // Lấy value từ thẻ select (lmht, tft, lq...)

      // Lấy tất cả các thẻ game đang có trên màn hình
      const cards = document.querySelectorAll(".game-card");

      cards.forEach((card) => {
        // Lấy tiêu đề game trong thẻ h3
        const titleElement = card.querySelector("h3");
        if (!titleElement) return;
        
        const title = titleElement.textContent.toLowerCase();

        // Logic kiểm tra từ khóa
        const matchKeyword = keyword === "" || title.includes(keyword);

        // Logic kiểm tra loại game (Dùng hàm phụ trợ checkGameType)
        // Nếu không chọn game (gameType === "") thì mặc định là đúng
        const matchGame =
          gameType === "" ||
          title.includes(gameType) ||
          checkGameType(title, gameType);

        // Ẩn/Hiện thẻ
        if (matchKeyword && matchGame) {
            // Dùng display flex hoặc block tùy theo css của bạn, ở đây để rỗng để nó về mặc định của CSS
            card.style.display = ""; 
        } else {
            card.style.display = "none";
        }
      });
    });
  }
});

// --- HÀM PHỤ TRỢ: KIỂM TRA LOẠI GAME ---
function checkGameType(title, type) {
  // Map các từ khóa viết tắt sang tên đầy đủ trong tiêu đề
  if (type === "lmht" && (title.includes("liên minh") || title.includes("lmht"))) return true;
  if (type === "tft" && (title.includes("đtcl") || title.includes("tft") || title.includes("đấu trường"))) return true;
  if (type === "lq" && (title.includes("liên quân") || title.includes("lq"))) return true;
  if (type === "ff" && (title.includes("free fire") || title.includes("ff"))) return true;
  if (type === "tc" && (title.includes("tốc chiến") || title.includes("tc"))) return true;
  if (type === "val" && (title.includes("valorant") || title.includes("val"))) return true;
  return false;
}

// --- HÀM XỬ LÝ ĐĂNG NHẬP / ĐĂNG XUẤT ---
function checkLoginStatus() {
  const userStr = localStorage.getItem("user");
  const authSection = document.getElementById("auth-section");

  if (userStr && authSection) {
    const user = JSON.parse(userStr);
    const moneyFormat = new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(user.balance || 0);

    authSection.innerHTML = `
        <div class="user-info-display">
            <span class="user-name">Hi, ${user.username}</span>
            <span class="user-balance">${moneyFormat}</span>
            <button class="btn-logout" onclick="logout()">Thoát</button>
        </div>
    `;
  }
}

function logout() {
  if (confirm("Bạn có chắc chắn muốn đăng xuất?")) {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.location.reload();
  }
}

// --- CÁC HÀM XỬ LÝ MODAL MUA HÀNG (GIỮ NGUYÊN NẾU CẦN DÙNG) ---
// Lưu ý: Các hàm này cần biến 'currentAccounts' nếu bạn dùng dữ liệu động.
// Nếu bạn chỉ dùng HTML tĩnh thì các hàm openDetail/openBuy bên dưới có thể không chạy được
// trừ khi bạn khai báo mảng currentAccounts.
// Tuy nhiên, phần lọc ở trên đã hoạt động độc lập với DOM.