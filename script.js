// ==========================================
// 1. CONFIGURATION & CREDENTIALS
// ==========================================
const ADMIN_CREDENTIALS = {
    user: "8528537076",
    email: "abhivyaktikavypith@gmail.com",
    pass: "kavypith@123"
};

// APNA GOOGLE APPS SCRIPT WEBHOOK URL YAHAN PASTE KAREIN
const GOOGLE_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbzdfT03vf_CLORuq2wULroVn0mceiwgjED3VzaYYHw1efR4bOWlhrBxCW8NB5iQyVcO/exec";
let html5QrCode;
let isScanning = false;
let scannedCount = 0;

// ==========================================
// 2. DYNAMIC FEE & FORM TOGGLE LOGIC
// ==========================================
function updateTicketPrice() {
    const role = document.getElementById('userRole').value;
    const priceDisplay = document.getElementById('priceDisplay');
    const performerFields = document.getElementById('performerFields');

    if (role === 'Performer') {
        priceDisplay.innerText = '₹299';
        if (performerFields) performerFields.style.display = 'block';
    } else {
        priceDisplay.innerText = '₹01';
        if (performerFields) performerFields.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    updateTicketPrice();
});

// ==========================================
// 3. RAZORPAY PAYMENT & AUTO PDF GENERATOR
// ==========================================
document.getElementById('ticketForm').addEventListener('submit', function(e) {
    e.preventDefault();

    if (typeof Razorpay === 'undefined') {
        alert("Razorpay SDK load nahi hua hai.");
        return;
    }

    const role = document.getElementById('userRole').value;
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    
    let vidha = "N/A";
    let poetrySample = "";
    if (role === 'Performer') {
        vidha = document.getElementById('vidha') ? document.getElementById('vidha').value : "N/A";
        poetrySample = document.getElementById('poetrySample') ? document.getElementById('poetrySample').value : "";
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

            // 1. Instant Screen Par PDF Receipt Download
            generateAndDownloadPDF(paymentId, name, email, phone, role, vidha);

            // 2. Email & Google Sheet Sync
            sendDataToGoogleSheet(paymentId, name, email, phone, role, vidha, poetrySample);
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

// PDF Generation & Auto-Download Function (With Transparent Stamp)
function generateAndDownloadPDF(paymentId, name, email, phone, role, vidha) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // 1. Stamp Image (Transparent BG) Link
    // Note: Agar aapka apna link ho toh niche "YOUR_TRANSPARENT_STAMP_URL" ki jagah paste kar dein
    const STAMP_URL = "https://i.postimg.cc/zf0zvnKb/Gemini-Generated-Image-u2nl7zu2nl7zu2nl.png"; 

    // Generate Hidden QR Code
    const qrDiv = document.createElement('div');
    qrDiv.style.display = 'none';
    document.body.appendChild(qrDiv);
    
    new QRCode(qrDiv, {
        text: paymentId,
        width: 128,
        height: 128
    });

    // Stamp Image Load karne ke liye Image Object
    const stampImg = new Image();
    stampImg.crossOrigin = "Anonymous";
    stampImg.src = STAMP_URL;

    stampImg.onload = function() {
        setTimeout(() => {
            const qrCanvas = qrDiv.querySelector('canvas');
            const qrImgData = qrCanvas ? qrCanvas.toDataURL("image/png") : "";

            // --- HEADER DESIGN ---
            doc.setFillColor(120, 53, 15);
            doc.rect(0, 0, 210, 30, "F");

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(16);
            doc.text("KAVYOTSAV 2026 - OFFICIAL ENTRY TICKET", 15, 20);

            // --- TICKET DETAILS ---
            doc.setTextColor(34, 34, 34);
            doc.setFontSize(11);
            doc.text(`Ticket / Payment ID: ${paymentId}`, 15, 45);
            doc.text(`Name: ${name}`, 15, 53);
            doc.text(`Email: ${email}`, 15, 61);
            doc.text(`Phone: ${phone}`, 15, 69);
            doc.text(`Role: ${role}`, 15, 77);
            doc.text(`Vidha: ${vidha}`, 15, 85);
            doc.text(`Venue: University of Allahabad, Prayagraj`, 15, 93);
            doc.text(`Date: 23 August 2026`, 15, 101);

            // --- 2. ADD STAMP (Neeche Right Side Par) ---
            // doc.addImage(Image, Format, X-axis, Y-axis, Width, Height)
            doc.addImage(stampImg, "PNG", 145, 105, 45, 45); 

            // --- ADD QR CODE (Upar Right Side Par) ---
            if (qrImgData) {
                doc.addImage(qrImgData, "PNG", 145, 42, 45, 45);
                doc.setFontSize(8);
                doc.text("Gate Entry QR Pass", 153, 90);
            }

            // --- FOOTER DIVIDER LINE ---
            doc.setDrawColor(184, 134, 11);
            doc.line(15, 155, 195, 155);

            doc.setFontSize(9);
            doc.setTextColor(100, 100, 100);
            doc.text("Abhivyakti Kavypith | Govt Reg. UDYAM-UP-03-0155035", 15, 163);
            doc.text("Official Digital Verified Stamp & Entry Pass", 15, 169);

            // Auto Download PDF
            doc.save(`Kavyotsav_Ticket_${name.replace(/\s+/g, '_')}.pdf`);
            document.body.removeChild(qrDiv);
        }, 500);
    };

    // Fallback: Agar Image load na ho paye toh bina stamp ke PDF download kar dega
    stampImg.onerror = function() {
        console.log("Stamp image failed to load, generating PDF without stamp.");
        doc.save(`Kavyotsav_Ticket_${name.replace(/\s+/g, '_')}.pdf`);
    };
}

// Data Sender to Google Sheet & Email
function sendDataToGoogleSheet(paymentId, name, email, phone, role, vidha, poetrySample) {
    fetch(GOOGLE_WEBHOOK_URL, {
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
            sample: poetrySample
        })
    });
}

// ==========================================
// 4. ADMIN LOGIN (NO PAGE REFRESH)
// ==========================================
function openAdminModal() {
    const modal = document.getElementById('adminModal');
    if (modal) modal.style.display = 'flex';
}

function closeAdminModal() {
    const modal = document.getElementById('adminModal');
    if (modal) modal.style.display = 'none';
}

function handleAdminLogin(event) {
    if (event) event.preventDefault();

    const userInput = document.getElementById('adminUser').value.trim();
    const passInput = document.getElementById('adminPass').value.trim();
    const loginError = document.getElementById('loginError');

    if ((userInput === ADMIN_CREDENTIALS.user || userInput === ADMIN_CREDENTIALS.email) && passInput === ADMIN_CREDENTIALS.pass) {
        if(loginError) loginError.style.display = 'none';
        document.getElementById('adminLoginForm').reset();
        closeAdminModal(); 
        document.getElementById('adminDashboard').style.display = 'block'; 
    } else {
        if(loginError) {
            loginError.innerText = "❌ अमान्य Email/Phone या Password!";
            loginError.style.display = 'block';
        }
    }
    return false;
}

// ==========================================
// 5. LIVE QR ATTENDANCE SCANNER
// ==========================================
function toggleCamera() {
    if (!isScanning) {
        startCamera();
    } else {
        stopCamera();
    }
}

function startCamera() {
    html5QrCode = new Html5Qrcode("reader");
    const config = { fps: 10, qrbox: { width: 220, height: 220 } };

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

    const scannedId = decodedText.trim();
    const resultBox = document.getElementById('scanResultBox');
    resultBox.style.display = 'block';

    resultBox.className = "result-box";
    resultBox.innerHTML = `⏳ <strong>Verifying Ticket...</strong><br><small>ID: ${scannedId}</small>`;

    markAttendanceInGoogleSheet(scannedId);
}

function markAttendanceInGoogleSheet(ticketId) {
    const resultBox = document.getElementById('scanResultBox');

    fetch(GOOGLE_WEBHOOK_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: "markAttendance", ticketId: ticketId })
    })
    .then(() => {
        scannedCount++;
        document.getElementById('scannedCount').innerText = scannedCount;
        
        resultBox.className = "scan-result-box scan-success";
        resultBox.innerHTML = `
            ✅ <strong>प्रवेश स्वीकृत (Entry Sent to Sheet)!</strong><br>
            <strong>Ticket ID:</strong> ${ticketId}<br>
            <small>Status: Updated in Google Sheet</small>
        `;
    })
    .catch(err => {
        resultBox.className = "scan-result-box scan-error";
        resultBox.innerHTML = `❌ Connection Error`;
    });
}
// MENU & POPUP CONTROLS
function toggleNavMenu() {
    document.getElementById('navMenu').classList.toggle('active');
}

function closeNavMenu() {
    document.getElementById('navMenu').classList.remove('active');
}

function openRegisterModal() {
    document.getElementById('registerModal').style.display = 'flex';
    if (typeof updateTicketPrice === 'function') updateTicketPrice();
}

function closeRegisterModal() {
    document.getElementById('registerModal').style.display = 'none';
}
function toggleNavMenu() {
    const menu = document.getElementById('navMenu');
    if (menu) menu.classList.toggle('active');
}

function closeNavMenu() {
    const menu = document.getElementById('navMenu');
    if (menu) menu.classList.remove('active');
}

function openRegisterModal() {
    const modal = document.getElementById('registerModal');
    if (modal) modal.style.display = 'flex';
}

function closeRegisterModal() {
    const modal = document.getElementById('registerModal');
    if (modal) modal.style.display = 'none';
}
// 3-Lines Hamburger Menu Toggle Function
function toggleNavMenu() {
    const navMenu = document.getElementById('navMenu');
    if (navMenu) {
        navMenu.classList.toggle('active');
    }
}

// Menu Link par click karne par dropdown band ho jaye
function closeNavMenu() {
    const navMenu = document.getElementById('navMenu');
    if (navMenu) {
        navMenu.classList.remove('active');
    }
}
// Admin Dashboard / Scanner Popup ko band karne ke liye
function closeAdminDashboard() {
    const dashboard = document.getElementById('adminDashboard');
    if (dashboard) {
        dashboard.style.display = 'none';
    }
    // Agar camera chal raha ho toh usko bhi stop kar dega
    if (typeof stopCamera === 'function') {
        stopCamera();
    }
}
// Screen par kahin bhi touch/click karne par Nav Menu band ho jaye
window.addEventListener('click', function(event) {
    const navMenu = document.getElementById('navMenu');
    const hamburger = document.querySelector('.hamburger');

    // Agar menu khula hai AUR click menu ya hamburger ke bahar hua hai
    if (navMenu && navMenu.classList.contains('active')) {
        if (!navMenu.contains(event.target) && !hamburger.contains(event.target)) {
            navMenu.classList.remove('active');
        }
    }
});