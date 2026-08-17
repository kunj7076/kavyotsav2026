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

// Pure jsPDF Bulletproof Ticket Generator (Never Blank)
function generateAndDownloadTicketPDF() {
    if (!currentMatchedUser) return;

    const u = currentMatchedUser;
    const btn = document.getElementById('btnDownloadTicket');
    const originalText = btn ? btn.innerText : "";
    if (btn) {
        btn.innerText = "⏳ टिकट तैयार हो रहा है...";
        btn.style.pointerEvents = "none";
    }

    const verifyUrl = `${WEB_APP_URL}?id=${encodeURIComponent(u.ticketId)}`;

    // Generate QR using QRCode library (Pre-loaded in index.html)
    const tempQrDiv = document.createElement("div");
    tempQrDiv.style.display = "none";
    document.body.appendChild(tempQrDiv);

    new QRCode(tempQrDiv, {
        text: verifyUrl,
        width: 200,
        height: 200,
        correctLevel: QRCode.CorrectLevel.H
    });

    setTimeout(() => {
        const qrCanvas = tempQrDiv.querySelector('canvas');
        let qrDataUrl = "";
        if (qrCanvas) {
            qrDataUrl = qrCanvas.toDataURL("image/png");
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a5" // 148 x 210 mm
        });

        // 1. Navy Blue Background
        doc.setFillColor(10, 25, 49);
        doc.rect(0, 0, 148, 210, "F");

        // 2. Gold Border
        doc.setDrawColor(212, 175, 55);
        doc.setLineWidth(1.5);
        doc.roundedRect(6, 6, 136, 198, 4, 4, "D");

        // 3. Header
        doc.setTextColor(212, 175, 55);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(20);
        doc.text("ABHIVYAKTI KAVYAPITH", 74, 22, { align: "center" });

        doc.setTextColor(203, 213, 225);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text("KAVYOTSAV 2026 - OFFICIAL ENTRY PASS", 74, 28, { align: "center" });

        // Header Line
        doc.setDrawColor(212, 175, 55);
        doc.setLineWidth(0.5);
        doc.line(15, 33, 133, 33);

        // 4. White Details Card
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(14, 38, 120, 68, 3, 3, "F");

        doc.setTextColor(15, 23, 42);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("Name:", 20, 48);
        doc.setFont("helvetica", "normal");
        doc.text(`${u.name}`, 45, 48);

        doc.setFont("helvetica", "bold");
        doc.text("Pass Type:", 20, 57);
        doc.setFont("helvetica", "normal");
        doc.text(`${u.type}`, 45, 57);

        doc.setFont("helvetica", "bold");
        doc.text("Ticket ID:", 20, 66);
        doc.setTextColor(180, 83, 9);
        doc.setFont("helvetica", "bold");
        doc.text(`${u.ticketId}`, 45, 66);

        doc.setTextColor(15, 23, 42);
        doc.setFont("helvetica", "bold");
        doc.text("Date & Time:", 20, 75);
        doc.setFont("helvetica", "normal");
        doc.text("23 August 2026, 05:00 PM", 48, 75);

        doc.setFont("helvetica", "bold");
        doc.text("Venue:", 20, 84);
        doc.setFont("helvetica", "normal");
        doc.text("Senate Hall, University of Allahabad", 38, 84);

        doc.setFont("helvetica", "bold");
        doc.text("Reg. No:", 20, 93);
        doc.setFont("helvetica", "normal");
        doc.text("UDYAM-UP-03-0155035", 40, 93);

        // 5. QR Code Card
        doc.setFillColor(15, 35, 65);
        doc.roundedRect(14, 112, 120, 75, 3, 3, "F");

        if (qrDataUrl) {
            doc.setFillColor(255, 255, 255);
            doc.roundedRect(49, 118, 50, 50, 2, 2, "F");
            doc.addImage(qrDataUrl, "PNG", 51, 120, 46, 46);
        }

        doc.setTextColor(212, 175, 55);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text("GATE ENTRY VERIFICATION QR CODE", 74, 175, { align: "center" });

        doc.setTextColor(203, 213, 225);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text("Scan this QR Code at the entrance gate for single entry.", 74, 180, { align: "center" });

        // 6. Footer
        doc.setTextColor(148, 163, 184);
        doc.setFontSize(7.5);
        doc.text("This is an authorized computer-generated pass. Valid for 1 person only.", 74, 198, { align: "center" });

        // Save PDF
        doc.save(`Kavyotsav_Pass_${u.ticketId}.pdf`);

        // Clean up
        if (document.body.contains(tempQrDiv)) {
            document.body.removeChild(tempQrDiv);
        }
        if (btn) {
            btn.innerText = originalText;
            btn.style.pointerEvents = "auto";
        }
    }, 400);
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