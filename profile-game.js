const API_URL = 'http://localhost:3000'; // Đổi port nếu cần

document.addEventListener("DOMContentLoaded", () => {
    // Gọi cả 3 hàm cùng lúc khi tải trang
    loadUserProfile();
    loadInventory();
    loadHistory();
});

// ---------------------------------------------------------
// 1. TẢI THÔNG TIN CÁ NHÂN (Tên, Tiền, Email)
// ---------------------------------------------------------
function loadUserProfile() {
    fetch(`${API_URL}/api/info`)
        .then(res => res.json())
        .then(user => {
            // Cập nhật Header & Sidebar
            document.querySelectorAll('.username, .header-username').forEach(el => el.innerText = user.Fullname);
            document.querySelector('.balance-text').innerText = formatMoney(user.Balance);
            
            // Cập nhật Form
            document.getElementById('inpName').value = user.Fullname;
            const emailInput = document.querySelector('input[type="email"]');
            if(emailInput) emailInput.value = user.Email;
        })
        .catch(err => console.error("Lỗi tải Profile:", err));
}

// ---------------------------------------------------------
// 2. TẢI KHO TÀI KHOẢN (NICK ĐÃ MUA)
// ---------------------------------------------------------
function loadInventory() {
    const tbody = document.querySelector('#acc-list tbody'); // Tìm body của bảng nick
    if (!tbody) return;

    fetch(`${API_URL}/api/inventory`)
        .then(res => res.json())
        .then(data => {
            tbody.innerHTML = ''; // Xóa dữ liệu cũ

            if (data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px;">Chưa mua tài khoản nào</td></tr>';
                return;
            }

            data.forEach((acc, index) => {
                const tr = `
                    <tr>
                        <td>
                            <div class="acc-info">
                                <img src="${acc.ImageURL}" class="game-thumb" alt="Game">
                                <div>
                                    <div style="font-weight: bold; color: #fff;">${acc.GameName}</div>
                                    <div style="font-size: 0.85rem; color: var(--text-gray);">${acc.RankInfo}</div>
                                </div>
                            </div>
                        </td>
                        <td>
                            <div class="credential-box">
                                <span>TK: <strong id="user${index}">${acc.AccUser}</strong></span>
                                <button class="copy-btn" onclick="copyToClipboard('user${index}')"><i class="fas fa-copy"></i></button>
                            </div>
                            <div class="credential-box">
                                <span>MK: <strong id="pass${index}">${acc.AccPass}</strong></span>
                                <button class="copy-btn" onclick="copyToClipboard('pass${index}')"><i class="fas fa-copy"></i></button>
                            </div>
                        </td>
                        <td style="color: var(--secondary-color); font-weight: bold;">${formatMoney(acc.Price)}</td>
                        <td>
                            <button class="btn" style="background: #3d4a5d; color: #fff; font-size: 0.8rem;">Chi tiết</button>
                        </td>
                    </tr>
                `;
                tbody.innerHTML += tr;
            });
        })
        .catch(err => console.error("Lỗi tải Inventory:", err));
}

// ---------------------------------------------------------
// 3. TẢI LỊCH SỬ GIAO DỊCH
// ---------------------------------------------------------
function loadHistory() {
    const tbody = document.querySelector('#history tbody');
    if (!tbody) return;

    fetch(`${API_URL}/api/history`)
        .then(res => res.json())
        .then(data => {
            tbody.innerHTML = '';

            data.forEach(trans => {
                // Đổi màu: Nếu số tiền < 0 là màu đỏ, > 0 là màu xanh
                const color = trans.Amount < 0 ? '#ff4757' : '#2ed573';
                const sign = trans.Amount > 0 ? '+' : ''; // Thêm dấu + nếu là tiền nạp

                const tr = `
                    <tr>
                        <td>#TX${trans.TransID}</td>
                        <td>${trans.Content}</td>
                        <td style="color: ${color}; font-weight:bold;">
                            ${sign}${formatMoney(trans.Amount)}
                        </td>
                        <td>${new Date(trans.CreatedDate).toLocaleString('vi-VN')}</td>
                        <td><span style="color: var(--secondary-color);">${trans.Status}</span></td>
                    </tr>
                `;
                tbody.innerHTML += tr;
            });
        })
        .catch(err => console.error("Lỗi tải History:", err));
}

// ---------------------------------------------------------
// 4. CHỨC NĂNG CẬP NHẬT TÊN (LƯU)
// ---------------------------------------------------------
function saveProfile() {
    const nameInput = document.getElementById('inpName');
    const newName = nameInput.value.trim();

    if (!newName) return alert("Vui lòng nhập tên!");

    fetch(`${API_URL}/api/update-name`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newName: newName })
    })
    .then(res => res.text())
    .then(data => {
        if (data === 'success') {
            alert("Lưu thành công!");
            // Cập nhật lại giao diện ngay lập tức
            document.querySelectorAll('.username, .header-username').forEach(el => el.innerText = newName);
        } else {
            alert("Có lỗi xảy ra!");
        }
    })
    .catch(err => console.error(err));
}

// ---------------------------------------------------------
// 5. CÁC HÀM TIỆN ÍCH (Copy, Chuyển Tab, Format Tiền)
// ---------------------------------------------------------
function switchTab(event, tabId) {
    event.preventDefault();
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    event.currentTarget.classList.add('active');
}

function copyToClipboard(elementId) {
    var copyText = document.getElementById(elementId).innerText;
    navigator.clipboard.writeText(copyText).then(() => {
        alert('Đã copy: ' + copyText);
    });
}

function formatMoney(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}