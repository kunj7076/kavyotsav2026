// ==========================================
// 1. CONFIGURATION & CREDENTIALS
// ==========================================
const ADMIN_CREDENTIALS = {
    user: "8528537076",
    email: "abhivyaktikavypith@gmail.com",
    pass: "kavypith@123"
};

// अपना Apps Script Web App URL यहाँ डालें:
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyWiS60UTLK6IeEFjrfnkBm7YUgeU7eiLjF651GaPjdileehBxFeiyc0j_TXQuGyn7R/exec";

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
        priceDisplay.innerText = '₹00';
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
// 4. RAZORPAY PAYMENT & TICKET
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

            sendDataToGoogleSheet(paymentId, name, email, phone, role, vidha, title);

            currentMatchedUser = {
                ticketId: paymentId,
                name: name,
                type: role === 'Performer' ? 'कवि / मंच प्रस्तुतकर्ता' : 'श्रोता / दर्शक'
            };
            generateAndDownloadTicketPDF();

            document.getElementById('ticketForm').reset();
            closeRegisterModal();
        },
        "prefill": { "name": name, "email": email, "contact": phone },
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
// 5. DOWNLOAD PORTAL & HIGH-RES PDF
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
        if (document.body.contains(scriptTag)) document.body.removeChild(scriptTag);
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

function generateAndDownloadTicketPDF() {
    if (!currentMatchedUser) return;

    const u = currentMatchedUser;
    const btn = document.getElementById('btnDownloadTicket');
    const originalText = btn ? btn.innerText : "";
    if (btn) {
        btn.innerText = "⏳ टिकट तैयार हो रहा है...";
        btn.style.pointerEvents = "none";
    }

    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    document.body.appendChild(tempDiv);

    new QRCode(tempDiv, {
        text: u.ticketId,
        width: 240,
        height: 240,
        correctLevel: QRCode.CorrectLevel.H
    });

    setTimeout(() => {
        let qrDataUrl = "";
        const qrCanvas = tempDiv.querySelector('canvas');
        if (qrCanvas) qrDataUrl = qrCanvas.toDataURL('image/png');

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a5" });

        doc.setFillColor(10, 25, 49);
        doc.rect(0, 0, 148, 210, "F");
        doc.setDrawColor(212, 175, 55);
        doc.setLineWidth(1.2);
        doc.roundedRect(6, 6, 136, 198, 4, 4, "D");

        doc.setTextColor(212, 175, 55);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.text("ABHIVYAKTI KAVYAPITH", 74, 20, { align: "center" });

        doc.setTextColor(203, 213, 225);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        doc.text("KAVYOTSAV 2026 - OFFICIAL ENTRY PASS", 74, 26, { align: "center" });

        doc.setDrawColor(212, 175, 55);
        doc.setLineWidth(0.4);
        doc.line(18, 30, 130, 30);

        doc.setFillColor(255, 255, 255);
        doc.roundedRect(12, 35, 124, 70, 3, 3, "F");

        doc.setTextColor(15, 23, 42);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("Name:", 18, 46);
        doc.setFont("helvetica", "normal");
        doc.text(`${u.name}`, 42, 46);

        doc.setFont("helvetica", "bold");
        doc.text("Pass Type:", 18, 55);
        doc.setFont("helvetica", "normal");
        doc.text(`${u.type}`, 42, 55);

        doc.setFont("helvetica", "bold");
        doc.text("Ticket ID:", 18, 64);
        doc.setTextColor(180, 83, 9);
        doc.setFont("helvetica", "bold");
        doc.text(`${u.ticketId}`, 42, 64);

        doc.setTextColor(15, 23, 42);
        doc.setFont("helvetica", "bold");
        doc.text("Date & Time:", 18, 73);
        doc.setFont("helvetica", "normal");
        doc.text("23 August 2026 (05:00 PM)", 46, 73);

        doc.setFont("helvetica", "bold");
        doc.text("Venue:", 18, 82);
        doc.setFont("helvetica", "normal");
        doc.text("Senate Hall, Prayagraj", 36, 82);

        doc.setFont("helvetica", "bold");
        doc.text("Reg No:", 18, 91);
        doc.setFont("helvetica", "normal");
        doc.text("UDYAM-UP-03-0155035", 38, 91);

        doc.setFillColor(15, 35, 65);
        doc.roundedRect(12, 110, 124, 76, 3, 3, "F");

        if (qrDataUrl) {
            doc.setFillColor(255, 255, 255);
            doc.roundedRect(48, 115, 52, 52, 2, 2, "F");
            doc.addImage(qrDataUrl, "PNG", 50, 117, 48, 48);
        }

        doc.setTextColor(212, 175, 55);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        doc.text("GATE ENTRY QR PASS", 74, 173, { align: "center" });

        doc.setTextColor(203, 213, 225);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.text("Scan this QR code at the entrance gate using Admin Scanner.", 74, 179, { align: "center" });

        doc.save(`Kavyotsav_Pass_${u.ticketId}.pdf`);

        if (document.body.contains(tempDiv)) document.body.removeChild(tempDiv);
        if (btn) {
            btn.innerText = originalText;
            btn.style.pointerEvents = "auto";
        }
    }, 300);
}

// ==========================================
// 6. ADMIN SCANNER (WITH AUDIO & VISUAL FEEDBACK)
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
    if (!isScanning) startCamera();
    else stopCamera();
}

function startCamera() {
    html5QrCode = new Html5Qrcode("reader");
    const config = { fps: 20, qrbox: { width: 260, height: 260 } };

    html5QrCode.start({ facingMode: "environment" }, config, onScanSuccess)
    .then(() => {
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
    if (scannedId.includes('id=')) {
        scannedId = scannedId.split('id=')[1].split('&')[0];
    }

    const resultBox = document.getElementById('scanResultBox');
    resultBox.style.display = 'block';
    resultBox.className = "pro-card";
    resultBox.innerHTML = `⏳ <strong>सत्यापन जारी है...</strong><br><small>Ticket: ${scannedId}</small>`;

    const callbackName = 'gateScanCallback_' + Math.round(100000 * Math.random());

    window[callbackName] = function(data) {
        delete window[callbackName];
        if (document.body.contains(scriptTag)) document.body.removeChild(scriptTag);

        if (data && data.status === "approved") {
            scannedCount++;
            document.getElementById('scannedCount').innerText = scannedCount;
            resultBox.style.borderTop = "6px solid #10B981";
            resultBox.innerHTML = `
                <div style="background:#DCFCE7; color:#166534; padding:5px 12px; border-radius:15px; display:inline-block; font-weight:bold; font-size:13px; margin-bottom:8px;">✓ ENTRY APPROVED</div>
                <h3 style="color:#065F46; margin:0 0 5px 0;">प्रवेश मान्य</h3>
                <p style="margin:4px 0;"><strong>प्रतिभागी:</strong> ${data.name}</p>
                <p style="margin:0; font-size:12px; color:#64748B;">ID: ${data.ticketId} • समय: ${data.time}</p>
            `;
        } else if (data && data.status === "already_scanned") {
            resultBox.style.borderTop = "6px solid #DC2626";
            resultBox.innerHTML = `
                <div style="background:#FEE2E2; color:#991B1B; padding:5px 12px; border-radius:15px; display:inline-block; font-weight:bold; font-size:13px; margin-bottom:8px;">❌ ALREADY SCANNED</div>
                <h3 style="color:#991B1B; margin:0 0 5px 0;">प्रवेश अस्वीकृत</h3>
                <p style="margin:4px 0; color:#DC2626; font-weight:bold;">यह टिकट पहले ही इस्तेमाल हो चुका है!</p>
                <p style="margin:4px 0;"><strong>प्रतिभागी:</strong> ${data.name}</p>
                <p style="margin:0; font-size:12px; color:#64748B;">प्रथम स्कैन समय: ${data.time}</p>
            `;
        } else {
            resultBox.style.borderTop = "6px solid #DC2626";
            resultBox.innerHTML = `
                <h3 style="color:#DC2626; margin:0;">⚠️ अमान्य टिकट</h3>
                <p style="margin:4px 0;">ID: ${scannedId} डेटाबेस में नहीं मिली।</p>
            `;
        }
    };

    const scriptTag = document.createElement('script');
    scriptTag.src = `${WEB_APP_URL}?action=markAttendance&ticketId=${encodeURIComponent(scannedId)}&callback=${callbackName}`;
    scriptTag.onerror = function() {
        resultBox.innerHTML = `❌ नेटवर्क त्रुटि: सर्वर से संपर्क नहीं हो सका।`;
    };
    document.body.appendChild(scriptTag);
}

// ==========================================
// 7. COUNTDOWN & FAQS
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

/// =========================================================
// 100% BULLETPROOF DIRECT CSV GUEST LOADER (NO APPS SCRIPT NEEDED)
// =========================================================
const SHEET_ID = "1ZT-rXXm9lU6s5kF3ohvB7NqOggOki73BBjOFRmisNmQ";

async function loadGuestsDirectly() {
    const grid = document.getElementById('guestGrid');
    if (!grid) return;

    try {
        // Google Sheet से 'Guest' टैब का सीधा डेटा फेच करें
        const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Guest&t=${Date.now()}`;
        const response = await fetch(csvUrl);
        const text = await response.text();

        // CSV की पंक्तियाँ अलग करें
        const rows = text.split("\n").map(row => {
            return row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(val => val.replace(/^"|"$/g, '').trim());
        });

        if (!rows || rows.length <= 1) {
            grid.innerHTML = `<p style="text-align:center; grid-column:1/-1; color:#64748B;">अतिथियों की सूची शीघ्र ही प्रकाशित की जाएगी।</p>`;
            return;
        }

        let html = "";

        // Row 1 (Header: Name, Role, Tag, Link) को छोड़कर लूप चलाएँ
        for (let i = 1; i < rows.length; i++) {
            const cols = rows[i];
            const name = cols[0] || "";
            const role = cols[1] || "विशिष्ट अतिथि";
            const tag  = cols[2] || "";
            let photo  = cols[3] || "";

            if (!name) continue;

            if (!photo || !photo.startsWith("http")) {
                photo = "https://i.postimg.cc/BvCpXsBY/file-000000004b2c82119a54e5fe960f91e8.png";
            }

            html += `
                <div class="guest-card">
                    <div class="guest-img-wrapper">
                        <img src="${photo}" alt="${name}" class="guest-img" onerror="this.src='https://i.postimg.cc/BvCpXsBY/file-000000004b2c82119a54e5fe960f91e8.png'" />
                    </div>
                    <h3 class="guest-name">${name}</h3>
                    <div class="guest-role">${role}</div>
                    <p class="guest-tagline">${tag}</p>
                </div>
            `;
        }

        grid.innerHTML = html || `<p style="text-align:center; grid-column:1/-1; color:#64748B;">अतिथियों की सूची शीघ्र ही प्रकाशित की जाएगी।</p>`;

    } catch (error) {
        console.error("Guest loading failed:", error);
        grid.innerHTML = `<p style="text-align:center; grid-column:1/-1; color:#64748B;">अतिथियों की सूची लोड करने में समस्या हुई।</p>`;
    }
}

// पेज लोड होते ही चलाएँ
document.addEventListener("DOMContentLoaded", () => {
    loadGuestsDirectly();
});
function toggleAudio() {
    const audio = document.getElementById('bgAudio');
    const btn = document.getElementById('musicToggleBtn');
    if (audio.paused) {
        audio.play();
        btn.innerText = '⏸️';
    } else {
        audio.pause();
        btn.innerText = '▶️';
    }
}
function downloadPassAsImage() {
    const passElement = document.getElementById('ticketPassModal') || document.querySelector('.ticket-card');
    if (!passElement) return;

    html2canvas(passElement, { scale: 2 }).then(canvas => {
        const link = document.createElement('a');
        link.download = `Kavyotsav_Pass_${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
}
function generateStoryBadge() {
    const canvas = document.getElementById('badgeCanvas');
    const ctx = canvas.getContext('2d');
    const userName = document.getElementById('userName')?.value || "साहित्य प्रेमी";

    // Background Navy Gradient
    const grad = ctx.createLinearGradient(0, 0, 0, 1280);
    grad.addColorStop(0, '#0F172A');
    grad.addColorStop(1, '#1E293B');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 720, 1280);

    // Gold Border Frame
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 10;
    ctx.strokeRect(30, 30, 660, 1220);

    // Header Titles
    ctx.fillStyle = '#D4AF37';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('अभिव्यक्ति काव्यपीठ प्रस्तुत करता है', 360, 180);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 64px sans-serif';
    ctx.fillText('काव्योत्सव 2026', 360, 270);

    ctx.fillStyle = '#94A3B8';
    ctx.font = '30px sans-serif';
    ctx.fillText('साहित्यिक चेतना एवं युवा काव्य संध्या', 360, 330);

    // Center Badge Circle
    ctx.beginPath();
    ctx.arc(360, 560, 130, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(212, 175, 55, 0.15)';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = '#D4AF37';
    ctx.font = 'bold 44px sans-serif';
    ctx.fillText('PROUD', 360, 540);
    ctx.fillText('ATTENDEE', 360, 590);

    // User Name
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 48px sans-serif';
    ctx.fillText(userName, 360, 780);

    // Venue & Date
    ctx.fillStyle = '#D4AF37';
    ctx.font = '34px sans-serif';
    ctx.fillText('📍 प्रयागराज  |  📅 23 अगस्त 2026', 360, 870);

    ctx.fillStyle = '#64748B';
    ctx.font = '24px sans-serif';
    ctx.fillText('www.abhivyaktikavyapeeth.in', 360, 1150);

    // Trigger Download
    const link = document.createElement('a');
    link.download = `Kavyotsav_Status_${userName}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
}