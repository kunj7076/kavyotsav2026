// ==========================================
// 1. CONFIGURATION & CREDENTIALS
// ==========================================
const ADMIN_CREDENTIALS = {
    user: "8528537076",
    email: "abhivyaktikavypith@gmail.com",
    pass: "kavypith@123"
};

// APNA GOOGLE APPS SCRIPT WEBHOOK URL
const GOOGLE_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbyWiS60UTLK6IeEFjrfnkBm7YUgeU7eiLjF651GaPjdileehBxFeiyc0j_TXQuGyn7R/exec";
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
        priceDisplay.innerText = '₹49';
        if (performerFields) performerFields.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    updateTicketPrice();
});

// ==========================================
// 3. MENU & MODAL POPUP CONTROLS
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
    if (typeof stopCamera === 'function') stopCamera();
}

// Click Outside to Close Modals & Menu
window.addEventListener('click', function(event) {
    const regModal = document.getElementById('registerModal');
    const adminModal = document.getElementById('adminModal');
    const navMenu = document.getElementById('navMenu');
    const hamburger = document.querySelector('.hamburger');

    if (regModal && event.target === regModal) regModal.style.display = 'none';
    if (adminModal && event.target === adminModal) adminModal.style.display = 'none';
    if (navMenu && navMenu.classList.contains('active')) {
        if (!navMenu.contains(event.target) && hamburger && !hamburger.contains(event.target)) {
            navMenu.classList.remove('active');
        }
    }
});

// ==========================================
// 4. RAZORPAY PAYMENT & AUTO PDF GENERATOR
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

            // 1. Download PDF Ticket
            generateAndDownloadPDF(paymentId, name, email, phone, role, vidha);

            // 2. Google Sheet Sync
            sendDataToGoogleSheet(paymentId, name, email, phone, role, vidha, title);

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

// PDF Generation
// E-Ticket PDF Generate & Direct Download (Bulletproof)
function generateAndDownloadTicketPDF() {
  if (!currentMatchedUser) return;

  const u = currentMatchedUser;
  const btn = document.getElementById('btnDownloadTicket');
  const originalText = btn.innerText;
  btn.innerText = "⏳ टिकट तैयार हो रहा है...";
  btn.style.pointerEvents = "none";

  const verifyUrl = `${WEB_APP_URL}?id=${encodeURIComponent(u.ticketId)}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(verifyUrl)}`;

  // अस्थायी कंटेनर
  const ticketContainer = document.createElement('div');
  ticketContainer.id = "temp-ticket-container";
  ticketContainer.style.position = "fixed";
  ticketContainer.style.left = "-9999px";
  ticketContainer.style.top = "0";
  ticketContainer.style.width = "400px";
  ticketContainer.style.background = "#0A1931";
  ticketContainer.style.color = "#FFFFFF";
  ticketContainer.style.fontFamily = "'Segoe UI', Arial, sans-serif";
  ticketContainer.style.padding = "25px";
  ticketContainer.style.borderRadius = "16px";
  ticketContainer.style.border = "3px solid #D4AF37";
  ticketContainer.style.boxSizing = "border-box";
  ticketContainer.style.textAlign = "center";

  ticketContainer.innerHTML = `
    <div style="border-bottom: 2px solid rgba(212, 175, 55, 0.4); padding-bottom: 12px; margin-bottom: 15px;">
      <h2 style="color: #D4AF37; margin: 0; font-size: 22px; font-weight: bold;">अभिव्यक्ति काव्यपीठ</h2>
      <p style="color: #CBD5E1; margin: 4px 0 0 0; font-size: 13px;">काव्योत्सव 2026 • आधिकारिक ई-प्रवेश पत्र</p>
    </div>

    <div style="background: #FFFFFF; color: #0F172A; border-radius: 12px; padding: 16px; text-align: left; margin-bottom: 15px; font-size: 14px; line-height: 1.6;">
      <div><strong>नाम:</strong> ${u.name}</div>
      <div><strong>पास प्रकार:</strong> ${u.type}</div>
      <div><strong>टिकट ID:</strong> <span style="font-family:monospace; color:#D4AF37; font-weight:bold;">${u.ticketId}</span></div>
      <div><strong>दिनांक:</strong> 23 अगस्त 2026 (शाम 05:00 बजे)</div>
      <div><strong>स्थान:</strong> सीनेट हॉल, प्रयागराज</div>
    </div>

    <div style="background: rgba(255,255,255,0.06); padding: 12px; border-radius: 10px; display: flex; align-items: center; justify-content: center; gap: 15px;">
      <img id="tempQrImg" src="${qrUrl}" crossOrigin="anonymous" style="width: 110px; height: 110px; border-radius: 8px; border: 2px solid #D4AF37; background:#fff;" />
      <div style="text-align: left; font-size: 11px; color: #CBD5E1; max-width: 200px;">
        <strong style="color: #D4AF37;">प्रवेश निर्देश:</strong><br>
        प्रवेश द्वार पर यह QR कोड स्कैन किया जाएगा। कृपया इस डिजिटल पास को सुरक्षित रखें।
      </div>
    </div>
  `;

  document.body.appendChild(ticketContainer);

  const qrImg = document.getElementById('tempQrImg');

  // QR इमेज लोड होने के बाद PDF बनाएँ
  const createPdf = () => {
    if (typeof html2pdf === 'undefined') {
      alert("PDF लाइब्रेरी लोड नहीं हो सकी। कृपया पेज रीफ्रेश करें।");
      btn.innerText = originalText;
      btn.style.pointerEvents = "auto";
      document.body.removeChild(ticketContainer);
      return;
    }

    const opt = {
      margin:       10,
      filename:     `Kavyotsav_Pass_${u.ticketId}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'mm', format: 'a5', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(ticketContainer).save().then(() => {
      document.body.removeChild(ticketContainer);
      btn.innerText = originalText;
      btn.style.pointerEvents = "auto";
    }).catch(err => {
      console.error(err);
      document.body.removeChild(ticketContainer);
      btn.innerText = originalText;
      btn.style.pointerEvents = "auto";
    });
  };

  if (qrImg.complete) {
    createPdf();
  } else {
    qrImg.onload = createPdf;
    qrImg.onerror = createPdf;
  }
}

    function buildPDF(stampImgData = null) {
        const qrCanvas = qrDiv.querySelector('canvas');
        const qrImgData = qrCanvas ? qrCanvas.toDataURL("image/png") : null;

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
        doc.text(`Vidha: ${vidha || "N/A"}`, 15, 85);
        doc.text(`Venue: University of Allahabad, Prayagraj`, 15, 93);
        doc.text(`Date: 23 August 2026`, 15, 101);

        // --- ADD STAMP (Proper Centered & Non-rotated) ---
        if (stampImgData) {
            try {
                doc.addImage(stampImgData, "PNG", 104, 43, 38, 38);
            } catch (err) {
                console.log("Stamp image error:", err);
            }
        }

        // --- ADD QR CODE ---
        if (qrImgData) {
            try {
                doc.addImage(qrImgData, "PNG", 145, 42, 45, 45);
                doc.setFontSize(8);
                doc.text("Gate Entry QR Pass", 153, 90);
            } catch (err) {
                console.log("QR Code error:", err);
            }
        }

        // --- FOOTER DIVIDER LINE ---
        doc.setDrawColor(184, 134, 11);
        doc.line(15, 155, 195, 155);

        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text("Abhivyakti Kavypith | Govt Reg. UDYAM-UP-03-0155035", 15, 163);
        doc.text("Official Digital Verified Stamp & Entry Pass", 15, 169);

        // Save & Download
        doc.save(`Kavyotsav_Ticket_${name.replace(/\s+/g, '_')}.pdf`);
        if (document.body.contains(qrDiv)) {
            document.body.removeChild(qrDiv);
        }
    }

    const stampImg = new Image();
    stampImg.crossOrigin = "Anonymous";
    
    let isDownloaded = false;
    const fallbackTimer = setTimeout(() => {
        if (!isDownloaded) {
            isDownloaded = true;
            buildPDF(null);
        }
    }, 1500);

    stampImg.onload = function() {
        if (!isDownloaded) {
            isDownloaded = true;
            clearTimeout(fallbackTimer);
            buildPDF(stampImg);
        }
    };

    stampImg.onerror = function() {
        if (!isDownloaded) {
            isDownloaded = true;
            clearTimeout(fallbackTimer);
            buildPDF(null);
        }
    };

    // Transparent Stamp URL
    stampImg.src = "https://i.postimg.cc/X7Mfjsmx/Gemini-Generated-Image-u2nl7zu2nl7zu2nl-removebg-preview.png";


// Data Sender to Google Sheet
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
            sample: poetrySample,
        })
    });
}

// ==========================================
// 5. ADMIN LOGIN & SCANNER
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
    return false;
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
    const config = { fps: 20, qrbox: { width: 290, height: 280, centre: true } };
    

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
// --- INTRO SPLASH SCREEN AUTO CLOSE TIMER ---
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const intro = document.getElementById('introOverlay');
        if (intro) {
            intro.classList.add('hide-intro');
        }
    }, 2400); // 2.4 सेकंड बाद मुख्य वेबसाइट दिखेगी
});
// --- 1. COUNTDOWN TIMER LOGIC ---
function initCountdown() {
    const eventDate = new Date("August 23, 2026 17:00:00").getTime();

    const timer = setInterval(() => {
        const now = new Date().getTime();
        const difference = eventDate - now;

        if (difference < 0) {
            clearInterval(timer);
            document.getElementById("countdownTimer").innerHTML = "<p style='color:#fff; font-size:1.2rem;'>कार्यक्रम प्रारंभ हो चुका है!</p>";
            return;
        }

        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        document.getElementById("days").innerText = days < 10 ? "0" + days : days;
        document.getElementById("hours").innerText = hours < 10 ? "0" + hours : hours;
        document.getElementById("minutes").innerText = minutes < 10 ? "0" + minutes : minutes;
        document.getElementById("seconds").innerText = seconds < 10 ? "0" + seconds : seconds;
    }, 1000);
}

// --- 2. FAQ ACCORDION LOGIC ---
function initFaq() {
    const faqButtons = document.querySelectorAll(".faq-question");
    faqButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const item = btn.parentElement;
            item.classList.toggle("active");
        });
    });
}

// Window Load Handler
window.addEventListener("DOMContentLoaded", () => {
    initCountdown();
    initFaq();
});

// =========================================================
// DOWNLOAD PORTAL (SEARCH TICKET & CERTIFICATE)
// =========================================================
// अपनी Google Sheet की ID यहाँ डालें
// अपनी Google Sheet की ID यहाँ डालें
const SHEET_ID = "1ZT-rXXm9lU6s5kF3ohvB7NqOggOki73BBjOFRmisNmQ";

async function handlePortalSearch(event) {
  event.preventDefault();

  const query = document.getElementById('searchQuery').value.trim().toLowerCase();
  const loader = document.getElementById('portalLoader');
  const resultBox = document.getElementById('portalResult');
  const errorBox = document.getElementById('portalNotFound');
  const searchBtn = document.getElementById('portalSearchBtn');

  if (!query) return;

  // UI Reset
  resultBox.style.display = 'none';
  errorBox.style.display = 'none';
  loader.style.display = 'block';
  searchBtn.disabled = true;

  try {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`;
    const response = await fetch(url);
    const text = await response.text();
    
    // Google JSON Clean
    const json = JSON.parse(text.substring(47).slice(0, -2));
    const rows = json.table.rows;

    let matchedUser = null;

    for (let r of rows) {
      const rowData = r.c;
      if (!rowData) continue;

      // Col A (0): Ticket ID, Col B (1): Name, Col C (2): Phone, Col D (3): Email, Col E (4): Role, Col J (9): Cert Link
      const ticketId = rowData[0] ? String(rowData[0].v).trim() : "";
      const name = rowData[1] ? String(rowData[1].v).trim() : "";
      const phone = rowData[2] ? String(rowData[2].v).toLowerCase().trim() : "";
      const email = rowData[3] ? String(rowData[3].v).toLowerCase().trim() : "";
      const role = rowData[4] ? String(rowData[4].v).trim() : "श्रोता पास";
      const certUrl = rowData[9] ? String(rowData[9].v).trim() : "";

      if ((phone && phone.includes(query)) || (email && email === query) || (ticketId && ticketId.toLowerCase() === query)) {
        matchedUser = { ticketId, name, role, certUrl };
        break;
      }
    }

    loader.style.display = 'none';
    searchBtn.disabled = false;

    if (matchedUser) {
      document.getElementById('resUserName').innerText = matchedUser.name;
      document.getElementById('resUserType').innerText = `${matchedUser.role} • ID: ${matchedUser.ticketId}`;

      // Ticket Action (Auto-Generated QR Pass View)
      const ticketBtn = document.getElementById('btnDownloadTicket');
      const qrPassUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(matchedUser.ticketId)}`;
      ticketBtn.href = qrPassUrl;
      ticketBtn.target = "_blank";
      ticketBtn.innerText = "🎟️ डिजिटल पास (QR Pass) देखें";
      ticketBtn.style.display = "block";

      // Certificate Action
      const certBtn = document.getElementById('btnDownloadCert');
      if (matchedUser.certUrl && matchedUser.certUrl.startsWith("http")) {
        certBtn.href = matchedUser.certUrl;
        certBtn.style.display = 'block';
        certBtn.innerText = '📜 ई-सर्टिफिकेट PDF';
        certBtn.style.pointerEvents = 'auto';
        certBtn.style.opacity = '1';
      } else {
        certBtn.href = '#';
        certBtn.style.display = 'block';
        certBtn.innerText = '📜 सर्टिफिकेट कार्यक्रम के बाद उपलब्ध होगा';
        certBtn.style.opacity = '0.6';
        certBtn.style.pointerEvents = 'none';
      }

      resultBox.style.display = 'block';
    } else {
      errorBox.innerText = '⚠️ कोई विवरण नहीं मिला! कृपया सही मोबाइल नंबर या ईमेल दर्ज करें।';
      errorBox.style.display = 'block';
    }
  } catch (err) {
    loader.style.display = 'none';
    searchBtn.disabled = false;
    errorBox.innerText = '⚠️ शीट से कनेक्ट करने में समस्या हुई। कृपया Sheet ID और Sharing जाँचें।';
    errorBox.style.display = 'block';
  }
}
// =========================================================
// DOWNLOAD MODAL OPEN / CLOSE & SEARCH LOGIC
// =========================================================

// पॉप-अप खोलने के लिए
function openDownloadModal() {
  const modal = document.getElementById('downloadModal');
  if (modal) {
    modal.style.display = 'flex';
    document.getElementById('portalResult').style.display = 'none';
    document.getElementById('portalNotFound').style.display = 'none';
    document.getElementById('searchQuery').value = '';
  }
}

// पॉप-अप बंद करने के लिए
function closeDownloadModal() {
  const modal = document.getElementById('downloadModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// पास व सर्टिफिकेट खोजने और डाउनलोड कराने का मुख्य फ़ंक्शन
async function handlePortalSearch(event) {
  event.preventDefault();

  const query = document.getElementById('searchQuery').value.trim();
  const loader = document.getElementById('portalLoader');
  const resultBox = document.getElementById('portalResult');
  const errorBox = document.getElementById('portalNotFound');
  const searchBtn = document.getElementById('portalSearchBtn');

  if (!query) return;

  // UI Reset
  resultBox.style.display = 'none';
  errorBox.style.display = 'none';
  loader.style.display = 'block';
  searchBtn.disabled = true;

  try {
    // अपनी Google Apps Script Web App URL से कनेक्ट करें
    const response = await fetch(`${SCRIPT_URL}?action=searchUser&query=${encodeURIComponent(query)}`);
    const data = await response.json();

    loader.style.display = 'none';
    searchBtn.disabled = false;

    if (data.status === 'success' && data.user) {
      document.getElementById('resUserName').innerText = data.user.name;
      document.getElementById('resUserType').innerText = data.user.type || 'पंजीकृत प्रतिभागी';

      // Ticket Link Setup
      const ticketBtn = document.getElementById('btnDownloadTicket');
      if (data.user.ticketUrl) {
        ticketBtn.href = data.user.ticketUrl;
        ticketBtn.style.display = 'block';
      } else {
        ticketBtn.style.display = 'none';
      }

      // Certificate Link Setup
      const certBtn = document.getElementById('btnDownloadCert');
      if (data.user.certificateUrl) {
        certBtn.href = data.user.certificateUrl;
        certBtn.style.display = 'block';
        certBtn.innerText = '📜 ई-सर्टिफिकेट PDF';
      } else {
        certBtn.href = '#';
        certBtn.style.display = 'block';
        certBtn.innerText = '📜 सर्टिफिकेट कार्यक्रम के बाद उपलब्ध होगा';
        certBtn.style.opacity = '0.6';
        certBtn.style.pointerEvents = 'none';
      }

      resultBox.style.display = 'block';
    } else {
      errorBox.style.display = 'block';
    }
  } catch (err) {
    loader.style.display = 'none';
    searchBtn.disabled = false;
    errorBox.innerText = '⚠️ सर्वर से कनेक्ट करने में समस्या हुई। कृपया पुनः प्रयास करें।';
    errorBox.style.display = 'block';
  }
}
window.addEventListener('click', (e) => {
  const downloadModal = document.getElementById('downloadModal');
  if (e.target === downloadModal) {
    closeDownloadModal();
  }
});
// 👇 Apps Script से मिला हुआ URL यहाँ पेस्ट करें
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzdfT03vf_CLORuq2wULroVn0mceiwgjED3VzaYYHw1efR4bOWlhrBxCW8NB5iQyVcO/exec";

let currentMatchedUser = null;

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
  if (modal) {
    modal.style.display = 'none';
  }
}

// JSONP Search
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
    document.body.removeChild(scriptTag);
    loader.style.display = 'none';
    searchBtn.disabled = false;

    if (data && data.status === 'success' && data.user) {
      currentMatchedUser = data.user;
      document.getElementById('resUserName').innerText = data.user.name;
      document.getElementById('resUserType').innerText = `${data.user.type} • आईडी: ${data.user.ticketId}`;

      const ticketBtn = document.getElementById('btnDownloadTicket');
      ticketBtn.href = "javascript:void(0)";
      ticketBtn.removeAttribute("target");
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
    errorBox.innerText = '⚠️ सर्वर से कनेक्ट करने में समस्या हुई। कृपया URL जाँचें।';
    errorBox.style.display = 'block';
  };
  document.body.appendChild(scriptTag);
}

// Live E-Ticket PDF Generator
function generateAndDownloadTicketPDF() {
  if (!currentMatchedUser) return;

  const u = currentMatchedUser;
  const verifyUrl = `${WEB_APP_URL}?id=${encodeURIComponent(u.ticketId)}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&margin=0&data=${encodeURIComponent(verifyUrl)}`;

  const ticketElement = document.createElement('div');
  ticketElement.style.width = '450px';
  ticketElement.style.padding = '25px';
  ticketElement.style.background = '#0A1931';
  ticketElement.style.color = '#FFFFFF';
  ticketElement.style.fontFamily = "'Segoe UI', Arial, sans-serif";
  ticketElement.style.borderRadius = '16px';
  ticketElement.style.border = '2px solid #D4AF37';
  ticketElement.style.boxSizing = 'border-box';
  ticketElement.style.textAlign = 'center';

  ticketElement.innerHTML = `
    <div style="border-bottom: 2px solid rgba(212, 175, 55, 0.4); padding-bottom: 12px; margin-bottom: 15px;">
      <h2 style="color: #D4AF37; margin: 0; font-size: 22px;">अभिव्यक्ति काव्यपीठ</h2>
      <p style="color: #CBD5E1; margin: 4px 0 0 0; font-size: 13px;">काव्योत्सव 2026 • आधिकारिक ई-प्रवेश पत्र</p>
    </div>

    <div style="background: #FFFFFF; color: #0F172A; border-radius: 12px; padding: 16px; text-align: left; margin-bottom: 15px; font-size: 13px;">
      <div style="margin-bottom: 8px;"><strong>नाम:</strong> ${u.name}</div>
      <div style="margin-bottom: 8px;"><strong>पास प्रकार:</strong> ${u.type}</div>
      <div style="margin-bottom: 8px;"><strong>टिकट ID:</strong> <span style="font-family:monospace; color:#D4AF37; font-weight:bold;">${u.ticketId}</span></div>
      <div style="margin-bottom: 8px;"><strong>दिनांक:</strong> 23 अगस्त 2026 (शाम 05:00 बजे)</div>
      <div><strong>स्थान:</strong> सीनेट हॉल, प्रयागराज</div>
    </div>

    <div style="background: rgba(255,255,255,0.06); padding: 12px; border-radius: 10px; display: flex; align-items: center; justify-content: center; gap: 15px;">
      <img src="${qrUrl}" crossorigin="anonymous" style="width: 100px; height: 100px; border-radius: 8px; border: 2px solid #D4AF37; background:#fff;" />
      <div style="text-align: left; font-size: 11px; color: #CBD5E1; max-width: 220px;">
        <strong style="color: #D4AF37;">प्रवेश निर्देश:</strong><br>
        यह QR कोड प्रवेश द्वार पर स्कैन किया जाएगा। कृपया इसे सुरक्षित रखें।
      </div>
    </div>
  `;

  const opt = {
    margin:       10,
    filename:     `Kavyotsav_Ticket_${u.ticketId}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true },
    jsPDF:        { unit: 'mm', format: 'a5', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(ticketElement).save();
}