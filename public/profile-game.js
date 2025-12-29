const API_URL = 'http://localhost:3000';

document.addEventListener("DOMContentLoaded", () => {
    // Gọi các hàm tải dữ liệu ngay khi vào trang
    loadUserProfile();
    loadInventory();
    loadHistory();
});

// 1. Tải thông tin User
function loadUserProfile() {
    fetch(`${API_URL}/api/info`)
        .then(res => res.json())
        .then(user => {
            // Cập nhật Header & Sidebar
            // Lưu ý: SQL của bạn dùng cột 'Fullname' và 'Balance'
            document.getElementById('header-username').innerText = user.Fullname;
            document.getElementById('sidebar-username').innerText = user.Fullname;
            document.getElementById('sidebar-balance').innerText = formatMoney(user.Balance);
            
            // Cập nhật Form
            document.getElementById('inpName').value = user.Fullname;
            document.getElementById('inpEmail').value = user.Email;
        })
        .catch(err => console.error(err));
}

// 2. Tải Kho Đồ (Inventory)
function loadInventory() {
    fetch(`${API_URL}/api/inventory`)
        .then(res => res.json())
        .then(data => {
            const tbody = document.getElementById('inventory-body');
            tbody.innerHTML = ''; 

            if (data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align:center">Chưa có tài khoản nào.</td></tr>';
                return;
            }

            data.forEach((acc, index) => {
                const row = `
                    <tr>
                        <td>
                            <div class="acc-info">
                                <img src="${acc.ImageURL || 'https://via.placeholder.com/50'}" class="game-thumb" alt="Game">
                                <div>
                                    <div style="font-weight: bold; color: #fff;">${acc.GameName}</div>
                                    <div style="font-size: 0.85rem; color: #a4b0be;">${acc.RankInfo || 'Rank: Chưa rõ'}</div>
                                </div>
                            </div>
                        </td>
                        <td>
                            <div class="credential-box">
                                <span>TK: <strong id="u${index}">${acc.AccUser}</strong></span>
                                <button class="copy-btn" onclick="copyToClipboard('u${index}')"><i class="fas fa-copy"></i></button>
                            </div>
                            <div class="credential-box">
                                <span>MK: <strong id="p${index}">${acc.AccPass}</strong></span>
                                <button class="copy-btn" onclick="copyToClipboard('p${index}')"><i class="fas fa-copy"></i></button>
                            </div>
                        </td>
                        <td style="color: #2ed573; font-weight: bold;">${formatMoney(acc.Price)}</td>
                        <td><button class="btn" style="background: #3d4a5d; color: #fff; font-size: 0.8rem;">Chi tiết</button></td>
                    </tr>
                `;
                tbody.innerHTML += row;
            });
        });
}

// 3. Tải Lịch Sử Giao Dịch
function loadHistory() {
    fetch(`${API_URL}/api/history`)
        .then(res => res.json())
        .then(data => {
            const tbody = document.getElementById('history-body');
            tbody.innerHTML = '';

            data.forEach(trans => {
                const color = trans.Amount < 0 ? '#ff4757' : '#2ed573';
                const row = `
                    <tr>
                        <td>#TX${trans.TransID}</td>
                        <td>${trans.Content}</td>
                        <td style="color: ${color}; font-weight: bold;">${formatMoney(trans.Amount)}</td>
                        <td>${new Date(trans.CreatedDate).toLocaleString('vi-VN')}</td>
                        <td><span style="color: #2ed573;">${trans.Status}</span></td>
                    </tr>
                `;
                tbody.innerHTML += row;
            });
        });
}

// 4. Lưu Tên Mới
function saveProfile() {
    const newName = document.getElementById('inpName').value.trim();
    if (!newName) return alert("Vui lòng nhập tên!");

    fetch(`${API_URL}/api/update-name`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newName })
    })
    .then(res => res.text())
    .then(data => {
        if (data === 'success') {
            alert("Lưu thành công!");
            loadUserProfile(); // Load lại để thấy tên mới ngay
        }
    });
}

// Tiện ích
function switchTab(event, tabId) {
    event.preventDefault();
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    event.currentTarget.classList.add('active');
}

function copyToClipboard(id) {
    var copyText = document.getElementById(id).innerText;
    navigator.clipboard.writeText(copyText).then(() => alert('Đã copy: ' + copyText));
}

function formatMoney(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}
