// ==========================================
// 1. CONFIGURATION & CREDENTIALS
// ==========================================
const ADMIN_CREDENTIALS = {
    user: "8528537076",
    email: "abhivyaktikavypith@gmail.com",
    pass: "kavypith@123"
};

// APNA GOOGLE APPS SCRIPT WEBHOOK URL YAHAN PASTE KAREIN
const GOOGLE_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbz1gTTwEBaBA7qohgHAzLOyzBbz-jLOarQxLRkZOW6HEGnyxFI3uNAPVopQy4MyeWxV/exec";
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
        alert("Razorpay SDK load nahi hua hai. Kripya check karein ki index.html me checkout.js script judi hai.");
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

// PDF Generation & Auto-Download Function
function generateAndDownloadPDF(paymentId, name, email, phone, role, vidha) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Generate Hidden QR Code
    const qrDiv = document.createElement('div');
    qrDiv.style.display = 'none';
    document.body.appendChild(qrDiv);
    
    new QRCode(qrDiv, {
        text: paymentId,
        width: 128,
        height: 128
    });

    setTimeout(() => {
        const qrCanvas = qrDiv.querySelector('canvas');
        const qrImgData = qrCanvas ? qrCanvas.toDataURL("image/png") : "";

        // Design PDF
        doc.setFillColor(120, 53, 15);
        doc.rect(0, 0, 210, 30, "F");

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.text("KAVYOTSAV 2026 - OFFICIAL ENTRY TICKET", 15, 20);

        doc.setTextColor(34, 34, 34);
        doc.setFontSize(12);
        doc.text(`Ticket / Payment ID: ${paymentId}`, 15, 45);
        doc.text(`Name: ${name}`, 15, 55);
        doc.text(`Email: ${email}`, 15, 65);
        doc.text(`Phone: ${phone}`, 15, 75);
        doc.text(`Role: ${role}`, 15, 85);
        doc.text(`Vidha: ${vidha}`, 15, 95);
        doc.text(`Venue: University of Allahabad, Prayagraj`, 15, 105);
        doc.text(`Date: 23 August 2026`, 15, 115);

        if (qrImgData) {
            doc.addImage(qrImgData, "PNG", 140, 45, 50, 50);
            doc.setFontSize(9);
            doc.text("Gate Entry QR Pass", 145, 100);
        }

        doc.setDrawColor(184, 134, 11);
        doc.line(15, 125, 195, 125);
        doc.setFontSize(10);
        doc.text("Abhivyakti Kavypith | Govt Reg. UDYAM-UP-03-0155035", 15, 135);

        // Auto Download PDF
        doc.save(`Kavyotsav_Ticket_${name.replace(/\s+/g, '_')}.pdf`);
        document.body.removeChild(qrDiv);
    }, 500);
}

// Data Sender to Google Sheet & Email
function sendDataToGoogleSheet(paymentId, name, email, phone, role, vidha, poetrySample) {
    if (GOOGLE_WEBHOOK_URL !== "https://script.google.com/macros/s/AKfycbz1gTTwEBaBA7qohgHAzLOyzBbz-jLOarQxLRkZOW6HEGnyxFI3uNAPVopQy4MyeWxV/exec") {
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
}

// ==========================================
// 4. ADMIN LOGIN (NO PAGE REFRESH)
// ==========================================
// Admin Modal Toggle Functions
function openAdminModal() {
    document.getElementById('adminModal').style.display = 'flex';
}

function closeAdminModal() {
    document.getElementById('adminModal').style.display = 'none';
}

// Updated Login Success Handler (Admin Login verification success par call hone wala code)
function handleAdminLogin(event) {
    if (event) event.preventDefault();

    const userInput = document.getElementById('adminUser').value.trim();
    const passInput = document.getElementById('adminPass').value.trim();
    const loginError = document.getElementById('loginError');

    if ((userInput === ADMIN_CREDENTIALS.user || userInput === ADMIN_CREDENTIALS.email) && passInput === ADMIN_CREDENTIALS.pass) {
        loginError.style.display = 'none';
        document.getElementById('adminLoginForm').reset();
        closeAdminModal(); // Close login box
        document.getElementById('adminDashboard').style.display = 'flex'; // Open Scanner
    } else {
        loginError.innerText = "❌ अमान्य Email/Phone या Password!";
        loginError.style.display = 'block';
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
    if (html5QrCode) {
        html5QrCode.stop().then(() => {
            isScanning = false;
            document.getElementById('camToggleBtn').innerText = "📷 Start Camera Scanner";
            document.getElementById('scannerStatus').innerText = "Stopped";
        }).catch(err => console.error(err));
    }
}

function onScanSuccess(decodedText) {
    // 1. Instant Camera Stop (Automatic Pause)
    stopCamera();

    // 2. Play Haptic Feedback / Beep
    if (navigator.vibrate) navigator.vibrate(200);

    const scannedId = decodedText.trim();
    const resultBox = document.getElementById('scanResultBox');
    resultBox.style.display = 'block';

    resultBox.className = "result-box";
    resultBox.innerHTML = `⏳ <strong>Verifying Ticket...</strong><br><small>ID: ${scannedId}</small>`;

    // 3. Mark Attendance in Sheet
    markAttendanceInGoogleSheet(scannedId);
}


function markAttendanceInGoogleSheet(ticketId) {
    const resultBox = document.getElementById('scanResultBox');

    if (GOOGLE_WEBHOOK_URL === "https://script.google.com/macros/s/AKfycbxvHjzm3KD5zyoD6s--pITZU8tFI2XmKWJHJodlZMQY5tqQj5HScZMkctqBV2CyWObb/https://script.google.com/macros/s/AKfycbz1gTTwEBaBA7qohgHAzLOyzBbz-jLOarQxLRkZOW6HEGnyxFI3uNAPVopQy4MyeWxV/exec") {
        scannedCount++;
        document.getElementById('scannedCount').innerText = scannedCount;
        resultBox.className = "scan-result-box scan-success";
        resultBox.innerHTML = `
            ✅ <strong>प्रवेश स्वीकृत (Entry Granted)!</strong><br>
            <strong>Ticket ID:</strong> ${ticketId}<br>
            <small>Status: Verified (Test Mode)</small>
        `;
        return;
    }

    fetch(GOOGLE_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: "markAttendance", ticketId: ticketId })
    })
    .then(response => response.json())
    .then(data => {
        if(data.status === "Success") {
            scannedCount++;
            document.getElementById('scannedCount').innerText = scannedCount;
            
            resultBox.className = "scan-result-box scan-success";
            resultBox.innerHTML = `
                ✅ <strong>प्रवेश स्वीकृत (Entry Granted)!</strong><br>
                <strong>Name:</strong> ${data.name}<br>
                <strong>Role:</strong> ${data.role}<br>
                <strong>Phone:</strong> ${data.phone}<br>
                <small>Status: Attendance Marked in Sheet</small>
            `;
        } else if(data.status === "AlreadyMarked") {
            resultBox.className = "scan-result-box scan-error";
            resultBox.innerHTML = `
                ⚠️ <strong>Duplicate Ticket!</strong><br>
                <strong>Name:</strong> ${data.name}<br>
                <small>यह टिकट पहले ही स्कैन हो चुका है!</small>
            `;
        } else {
            resultBox.className = "scan-result-box scan-error";
            resultBox.innerHTML = `❌ <strong>Invalid Ticket!</strong>`;
        }
    })
    .catch(err => {
        resultBox.className = "scan-result-box scan-error";
        resultBox.innerHTML = `❌ Connection Error`;
    });
}