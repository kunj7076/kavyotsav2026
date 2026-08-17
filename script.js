// ==========================================
// 1. CONFIGURATION & CREDENTIALS
// ==========================================
const ADMIN_CREDENTIALS = {
    user: "8528537076",
    email: "abhivyaktikavypith@gmail.com",
    pass: "kavypith@123"
};

// Apps Script Web App URL
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzdfT03vf_CLORuq2wULroVn0mceiwgjED3VzaYYHw1efR4bOWlhrBxCW8NB5iQyVcO/exec";

let html5QrCode;
let isScanning = false;
let scannedCount = 0;
let currentMatchedUser = null;

// ==========================================
// 2. DYNAMIC FEE & FORM TOGGLE LOGIC
// ==========================================
function updateTicketPrice() {
    const roleElem = document.getElementById('userRole');
    const priceDisplay = document.getElementById('priceDisplay');
    const performerFields = document.getElementById('performerFields');

    if (!roleElem || !priceDisplay) return;

    if (roleElem.value === 'Performer') {
        priceDisplay.innerText = '₹299';
        if (performerFields) performerFields.style.display = 'block';
    } else {
        priceDisplay.innerText = '₹49';
        if (performerFields) performerFields.style.display = 'none';
    }
}

// ==========================================
// 3. MENU & MODAL CONTROLS
// ==========================================
function toggleNavMenu(e) {
    if (e) e.stopPropagation();
    const navMenu = document.getElementById('navMenu');
    if (navMenu) navMenu.classList.toggle('active');
}

function closeNavMenu() {
    const navMenu = document.getElementById('navMenu');
    if (navMenu) navMenu.classList.remove('active');
}

function openRegisterModal(e) {
    if (e) e.stopPropagation();
    const modal = document.getElementById('registerModal');
    if (modal) {
        modal.style.display = 'flex';
        updateTicketPrice();
    }
}

function closeRegisterModal() {
    const modal = document.getElementById('registerModal');
    if (modal) modal.style.display = 'none';
}

function openAdminModal(e) {
    if (e) e.stopPropagation();
    const modal = document.getElementById('adminModal');
    if (modal) modal.style.display = 'flex';
}

function closeAdminModal() {
    const modal = document.getElementById('adminModal');
    if (modal) modal.style.display = 'none';
}

function closeAdminDashboard() {
    const dashboard = document.getElementById('adminDashboard');
    if (dashboard) dashboard.style.display = 'none';
    stopCamera();
}

function openDownloadModal() {
    const modal = document.getElementById('downloadModal');
    if (modal) {
        modal.style.display = 'flex';
        document.getElementById('portalResult').style.display = 'none';
        document.getElementById('portalNotFound').style.display = 'none';
        document.getElementById('searchQuery').value = '';
    }
}

function closeDownloadModal() {
    const modal = document.getElementById('downloadModal');
    if (modal) modal.style.display = 'none';
}

// Click Outside to Close
window.addEventListener('click', function(event) {
    const regModal = document.getElementById('registerModal');
    const adminModal = document.getElementById('adminModal');
    const downloadModal = document.getElementById('downloadModal');
    const navMenu = document.getElementById('navMenu');
    const hamburger = document.querySelector('.hamburger');

    if (regModal && event.target === regModal) regModal.style.display = 'none';
    if (adminModal && event.target === adminModal) adminModal.style.display = 'none';
    if (downloadModal && event.target === downloadModal) downloadModal.style.display = 'none';
    
    if (navMenu && navMenu.classList.contains('active')) {
        if (!navMenu.contains(event.target) && hamburger && !hamburger.contains(event.target)) {
            navMenu.classList.remove('active');
        }
    }
});

// ==========================================
// 4. RAZORPAY PAYMENT & AUTO TICKET
// ==========================================
document.getElementById('ticketForm').addEventListener('submit', function(e) {
    e.preventDefault();

    if (typeof Razorpay === 'undefined') {
        alert("Razorpay SDK लोड नहीं हो सका।");
        return;
    }

    const role = document.getElementById('userRole').value;
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    
    let vidha = "N/A";
    let title = "";
    if (role === 'Performer') {
        vidha = document.getElementById('vidha') ? document.getElementById('vidha').value : "N/A";
        title = document.getElementById('title') ? document.getElementById('title').value : "";
    }

    const priceText = document.getElementById('priceDisplay').innerText;
    const amount = parseInt(priceText.replace('₹', '').trim());

    var options = {
        "key": "rzp_live_TO8bx7fvQmzQ5w",
        "amount": amount * 100,
        "currency": "INR",
        "name": "अभिव्यक्ति काव्यपीठ",
        "description": `Kavyotsav 2026 Ticket (${role})`,
        "image": "https://i.postimg.cc/BvCpXsBY/file-000000004b2c82119a54e5fe960f91e8.png",
        "handler": function (response) {
            const paymentId = response.razorpay_payment_id;

            // 1. Google Sheet Sync
            sendDataToGoogleSheet(paymentId, name, email, phone, role, vidha, title);

            // 2. Direct Ticket PDF Download
            currentMatchedUser = {
                ticketId: paymentId,
                name: name,
                type: role === 'Performer' ? 'कवि / मंच प्रस्तुतकर्ता' : 'श्रोता / दर्शक'
            };
            generateAndDownloadTicketPDF();

            // Reset & Close
            document.getElementById('ticketForm').reset();
            closeRegisterModal();
        },
        "prefill": {
            "name": name,
            "email": email,
            "contact": phone
        },
        "theme": { "color": "#78350f" }
    };

    try {
        var rzp1 = new Razorpay(options);
        rzp1.open();
    } catch (err) {
        alert("Payment Error: " + err.message);
    }
});

function sendDataToGoogleSheet(paymentId, name, email, phone, role, vidha, sampleTitle) {
    fetch(WEB_APP_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: "register",
            paymentId: paymentId,
            name: name,
            email: email,
            phone: phone,
            role: role,
            vidha: vidha,
            sample: sampleTitle
        })
    });
}

// ==========================================
// 5. DOWNLOAD PORTAL (SEARCH & PDF PASS)
// ==========================================
function handlePortalSearch(event) {
    event.preventDefault();

    const query = document.getElementById('searchQuery').value.trim();
    const loader = document.getElementById('portalLoader');
    const resultBox = document.getElementById('portalResult');
    const errorBox = document.getElementById('portalNotFound');
    const searchBtn = document.getElementById('portalSearchBtn');

    if (!query) return;

    resultBox.style.display = 'none';
    errorBox.style.display = 'none';
    loader.style.display = 'block';
    searchBtn.disabled = true;

    const callbackName = 'portalCallback_' + Math.round(100000 * Math.random());
    
    window[callbackName] = function(data) {
        delete window[callbackName];
        if (document.body.contains(scriptTag)) {
            document.body.removeChild(scriptTag);
        }
        loader.style.display = 'none';
        searchBtn.disabled = false;

        if (data && data.status === 'success' && data.user) {
            currentMatchedUser = data.user;
            document.getElementById('resUserName').innerText = data.user.name;
            document.getElementById('resUserType').innerText = `${data.user.type} • ID: ${data.user.ticketId}`;

            const ticketBtn = document.getElementById('btnDownloadTicket');
            ticketBtn.onclick = generateAndDownloadTicketPDF;
            ticketBtn.innerText = "🎟️ E-Ticket PDF डाउनलोड करें";
            ticketBtn.style.display = "block";

            const certBtn = document.getElementById('btnDownloadCert');
            if (data.user.certificateUrl && data.user.certificateUrl.startsWith("http")) {
                certBtn.href = data.user.certificateUrl;
                certBtn.target = "_blank";
                certBtn.innerText = '📜 ई-सर्टिफिकेट PDF डाउनलोड करें';
                certBtn.style.pointerEvents = 'auto';
                certBtn.style.opacity = '1';
            } else {
                certBtn.href = 'javascript:void(0)';
                certBtn.innerText = '📜 सर्टिफिकेट कार्यक्रम के बाद उपलब्ध होगा';
                certBtn.style.opacity = '0.6';
                certBtn.style.pointerEvents = 'none';
            }

            resultBox.style.display = 'block';
        } else {
            errorBox.innerText = '⚠️ कोई विवरण नहीं मिला! कृपया सही मोबाइल नंबर या ईमेल दर्ज करें।';
            errorBox.style.display = 'block';
        }
    };

    const scriptTag = document.createElement('script');
    scriptTag.src = `${WEB_APP_URL}?action=searchUser&query=${encodeURIComponent(query)}&callback=${callbackName}`;
    scriptTag.onerror = function() {
        loader.style.display = 'none';
        searchBtn.disabled = false;
        errorBox.innerText = '⚠️ सर्वर से कनेक्ट करने में समस्या हुई।';
        errorBox.style.display = 'block';
    };
    document.body.appendChild(scriptTag);
}

// Live High-Quality PDF Generator
function generateAndDownloadTicketPDF() {
    if (!currentMatchedUser) return;

    const u = currentMatchedUser;
    const verifyUrl = `${WEB_APP_URL}?id=${encodeURIComponent(u.ticketId)}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=0&data=${encodeURIComponent(verifyUrl)}`;

    const ticketContainer = document.createElement('div');
    ticketContainer.style.position = 'fixed';
    ticketContainer.style.left = '-9999px';
    ticketContainer.style.top = '0';
    ticketContainer.style.width = '420px';
    ticketContainer.style.background = '#0A1931';
    ticketContainer.style.color = '#FFFFFF';
    ticketContainer.style.fontFamily = "'Segoe UI', Arial, sans-serif";
    ticketContainer.style.padding = '25px';
    ticketContainer.style.borderRadius = '16px';
    ticketContainer.style.border = '3px solid #D4AF37';
    ticketContainer.style.boxSizing = 'border-box';
    ticketContainer.style.textAlign = 'center';

    ticketContainer.innerHTML = `
        <div style="border-bottom: 2px solid rgba(212, 175, 55, 0.4); padding-bottom: 12px; margin-bottom: 15px;">
            <h2 style="color: #D4AF37; margin: 0; font-size: 22px; font-weight: bold;">अभिव्यक्ति काव्यपीठ</h2>
            <p style="color: #CBD5E1; margin: 4px 0 0 0; font-size: 13px;">काव्योत्सव 2026 • आधिकारिक ई-प्रवेश पत्र</p>
        </div>

        <div style="background: #FFFFFF; color: #0F172A; border-radius: 12px; padding: 16px; text-align: left; margin-bottom: 15px; font-size: 13px; line-height: 1.6;">
            <div><strong>नाम:</strong> ${u.name}</div>
            <div><strong>पास प्रकार:</strong> ${u.type}</div>
            <div><strong>टिकट ID:</strong> <span style="font-family:monospace; color:#B45309; font-weight:bold;">${u.ticketId}</span></div>
            <div><strong>दिनांक:</strong> 23 अगस्त 2026 (शाम 05:00 बजे)</div>
            <div><strong>स्थान:</strong> सीनेट हॉल, प्रयागराज</div>
        </div>

        <div style="background: rgba(255,255,255,0.06); padding: 12px; border-radius: 10px; display: flex; align-items: center; justify-content: center; gap: 15px;">
            <img id="tempTicketQr" src="${qrUrl}" crossOrigin="anonymous" style="width: 110px; height: 110px; border-radius: 8px; border: 2px solid #D4AF37; background:#fff;" />
            <div style="text-align: left; font-size: 11px; color: #CBD5E1; max-width: 200px;">
                <strong style="color: #D4AF37;">प्रवेश निर्देश:</strong><br>
                यह QR कोड प्रवेश द्वार पर स्कैन किया जाएगा। कृपया इस डिजिटल पास को सुरक्षित रखें।
            </div>
        </div>
    `;

    document.body.appendChild(ticketContainer);

    const qrImg = document.getElementById('tempTicketQr');

    const downloadAction = () => {
        const opt = {
            margin:       10,
            filename:     `Kavyotsav_Pass_${u.ticketId}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true, logging: false },
            jsPDF:        { unit: 'mm', format: 'a5', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(ticketContainer).save().then(() => {
            if (document.body.contains(ticketContainer)) {
                document.body.removeChild(ticketContainer);
            }
        }).catch(() => {
            if (document.body.contains(ticketContainer)) {
                document.body.removeChild(ticketContainer);
            }
        });
    };

    if (qrImg.complete) {
        downloadAction();
    } else {
        qrImg.onload = downloadAction;
        qrImg.onerror = downloadAction;
    }
}

// ==========================================
// 6. ADMIN LOGIN & SCANNER
// ==========================================
function handleAdminLogin(event) {
    if (event) event.preventDefault();

    const userInput = document.getElementById('adminUser').value.trim();
    const passInput = document.getElementById('adminPass').value.trim();
    const loginError = document.getElementById('loginError');

    if ((userInput === ADMIN_CREDENTIALS.user || userInput === ADMIN_CREDENTIALS.email) && passInput === ADMIN_CREDENTIALS.pass) {
        if (loginError) loginError.style.display = 'none';
        document.getElementById('adminLoginForm').reset();
        closeAdminModal(); 
        document.getElementById('adminDashboard').style.display = 'flex'; 
    } else {
        if (loginError) {
            loginError.innerText = "❌ अमान्य Email/Phone या Password!";
            loginError.style.display = 'block';
        }
    }
}

function toggleCamera() {
    if (!isScanning) {
        startCamera();
    } else {
        stopCamera();
    }
}

function startCamera() {
    html5QrCode = new Html5Qrcode("reader");
    const config = { fps: 20, qrbox: { width: 260, height: 260 } };

    html5QrCode.start(
        { facingMode: "environment" }, 
        config, 
        onScanSuccess
    ).then(() => {
        isScanning = true;
        document.getElementById('camToggleBtn').innerText = "🛑 Stop Camera";
        document.getElementById('scannerStatus').innerText = "Scanning Active";
    }).catch(err => {
        alert("Camera Error: " + err);
    });
}

function stopCamera() {
    if (html5QrCode && isScanning) {
        html5QrCode.stop().then(() => {
            isScanning = false;
            document.getElementById('camToggleBtn').innerText = "📷 Start Camera Scanner";
            document.getElementById('scannerStatus').innerText = "Stopped";
        }).catch(err => console.error(err));
    }
}

function onScanSuccess(decodedText) {
    stopCamera();
    if (navigator.vibrate) navigator.vibrate(200);

    let scannedId = decodedText.trim();
    // यदि पूरा URL स्कैन हुआ है तो केवल ID निकालें
    if (scannedId.includes('id=')) {
        scannedId = scannedId.split('id=')[1].split('&')[0];
    }

    const resultBox = document.getElementById('scanResultBox');
    resultBox.style.display = 'block';
    resultBox.innerHTML = `⏳ Verifying Ticket... (${scannedId})`;

    fetch(WEB_APP_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: "markAttendance", ticketId: scannedId })
    })
    .then(() => {
        scannedCount++;
        document.getElementById('scannedCount').innerText = scannedCount;
        resultBox.innerHTML = `✅ <strong>प्रवेश स्वीकृत!</strong><br>Ticket ID: ${scannedId}`;
    })
    .catch(() => {
        resultBox.innerHTML = `❌ Connection Error`;
    });
}

// ==========================================
// 7. COUNTDOWN & FAQS INITIALIZATION
// ==========================================
function initCountdown() {
    const eventDate = new Date("August 23, 2026 17:00:00").getTime();

    setInterval(() => {
        const now = new Date().getTime();
        const difference = eventDate - now;

        if (difference < 0) {
            const timerBox = document.getElementById("countdownTimer");
            if (timerBox) timerBox.innerHTML = "<p style='color:#fff;'>कार्यक्रम प्रारंभ हो चुका है!</p>";
            return;
        }

        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        if (document.getElementById("days")) document.getElementById("days").innerText = days < 10 ? "0" + days : days;
        if (document.getElementById("hours")) document.getElementById("hours").innerText = hours < 10 ? "0" + hours : hours;
        if (document.getElementById("minutes")) document.getElementById("minutes").innerText = minutes < 10 ? "0" + minutes : minutes;
        if (document.getElementById("seconds")) document.getElementById("seconds").innerText = seconds < 10 ? "0" + seconds : seconds;
    }, 1000);
}

function initFaq() {
    const faqButtons = document.querySelectorAll(".faq-question");
    faqButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            btn.parentElement.classList.toggle("active");
        });
    });
}

document.addEventListener("DOMContentLoaded", () => {
    updateTicketPrice();
    initCountdown();
    initFaq();

    setTimeout(() => {
        const intro = document.getElementById('introOverlay');
        if (intro) intro.classList.add('hide-intro');
    }, 2400);
});