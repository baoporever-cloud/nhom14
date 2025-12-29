document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".topup-tab");
  const form = document.getElementById("topupForm");
  const momoBox = document.getElementById("topupMomoBox");

  // Chuyển tab
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");

      const type = tab.dataset.type;
      if (type === "card") {
        form.classList.remove("hidden");
        momoBox.classList.add("hidden");
      } else {
        form.classList.add("hidden");
        momoBox.classList.remove("hidden");
      }
    });
  });

  // Submit nạp thẻ (demo)
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const telco = document.getElementById("telco").value;
      const amount = document.getElementById("amount").value;
      const cardCode = document.getElementById("cardCode").value.trim();
      const serial = document.getElementById("serial").value.trim();

      if (!telco || !amount || !cardCode || !serial) {
        alert("Vui lòng nhập đầy đủ thông tin nạp thẻ.");
        return;
      }

      // TODO: gọi API backend thực tế ở đây
      // ví dụ: fetch("/api/topup/card", { method: "POST", body: JSON.stringify({...}) })

      alert("Đã gửi yêu cầu nạp thẻ (demo). Sau này nối API thật ở đây.");
      form.reset();
    });
  }
});
