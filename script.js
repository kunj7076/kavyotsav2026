

// =================================================================
// ⚙️ EVENT & REGISTRATION CONTROLLER (MASTER SWITCHES)
// =================================================================
const CONFIG = {
    // 1. रजिस्ट्रेशन चालू/बंद स्विच (true = चालू, false = बंद)
    isRegistrationOpen: true, 

    // 2. इवेंट पूरा होने का स्विच (true = अगला इवेंट Coming Soon दिखेगा, false = काव्योत्सव 2026 लाइव दिखेगा)
    isEventCompleted: false,

    // अगले इवेंट का विवरण (जब isEventCompleted = true होगा तब यह दिखेगा)
    upcomingEvent: {
        badge: "✨ आगामी कार्यक्रम ✨",
        title: "काव्य कट्टा ",
        subtitle: "काव्य प्रेमियों के लिए एक अद्वितीय मंच",
        date: "शीघ्र घोषित किया जाएगा (Coming Soon)",
        venue: "शीघ्र घोषित किया जाएगा (Coming Soon)"
    }
};

// =================================================================
// DYNAMIC HERO & REGISTRATION HANDLER
// =================================================================
document.addEventListener("DOMContentLoaded", function() {
    applyEventStatus();
});

function applyEventStatus() {
    // (A) जब इवेंट समाप्त हो जाए और अगला इवेंट Coming Soon दिखाना हो
    if (CONFIG.isEventCompleted) {
        // 1. बैज (Badge)
        const heroBadge = document.querySelector(".badge, .hero-badge");
        if (heroBadge) heroBadge.innerText = CONFIG.upcomingEvent.badge;

        // 2. मुख्य टाइटल (काव्य कट्टा / अभिव्यक्ति काव्योत्सव)
        const heroTitle = document.querySelector(".hero h1, .hero-title");
        if (heroTitle) heroTitle.innerText = CONFIG.upcomingEvent.title;

        // 3. सबटाइटल
        const heroSubtitle = document.querySelector(".hero p, .hero-subtitle");
        if (heroSubtitle) heroSubtitle.innerText = CONFIG.upcomingEvent.subtitle;

        // 4. तीनों चिप्स (स्थान, तारीख, समय) को Coming Soon में बदलना
        const infoChips = document.querySelectorAll(".hero-info-chips span, .hero-info-chips div, .hero-pills span, .hero-meta span");
        
        // यदि अलग-अलग बॉक्सेस बने हैं:
        if (infoChips.length >= 3) {
            infoChips[0].innerHTML = `📍 ${CONFIG.upcomingEvent.venue || "शीघ्र घोषित"}`;
            infoChips[1].innerHTML = `📅 ${CONFIG.upcomingEvent.date || "शीघ्र घोषित"}`;
            infoChips[2].innerHTML = `⏳ Coming Soon`;
        } else {
            // अगर कोई अलग कंटेनर हो
            const metaContainer = document.querySelector(".hero-info-chips, .hero-pills, .hero-meta");
            if (metaContainer) {
                metaContainer.innerHTML = `
                    <span style="background: rgba(255,255,255,0.08); padding: 8px 16px; border-radius: 20px; border: 1px solid rgba(212,175,55,0.3); color: #FFF; font-size: 14px;">📍 स्थान: शीघ्र घोषित</span>
                    <span style="background: rgba(255,255,255,0.08); padding: 8px 16px; border-radius: 20px; border: 1px solid rgba(212,175,55,0.3); color: #FFF; font-size: 14px;">📅 दिनांक: शीघ्र घोषित (Coming Soon)</span>
                    <span style="background: rgba(255,255,255,0.08); padding: 8px 16px; border-radius: 20px; border: 1px solid rgba(212,175,55,0.3); color: #FFF; font-size: 14px;">⏳ पंजीकरण शीघ्र</span>
                `;
            }

        // 5. मुख्य बटन का टेक्स्ट
        const heroBtn = document.querySelector(".hero .btn-primary");
        if (heroBtn) {
            heroBtn.innerHTML = `🔔 आगामी इवेंट हेतु सूचना प्राप्त करें`;
        }
    }
}

    // (B) रजिस्ट्रेशन बंद होने पर बैनर/बटन स्टेटस
    if (!CONFIG.isRegistrationOpen) {
        const regButtons = document.querySelectorAll(".btn-nav-gold, .btn-primary");
        regButtons.forEach(btn => {
            if (btn.innerText.includes("पास बुक") || btn.innerText.includes("पंजीकरण")) {
                btn.style.opacity = "0.85";
            }
        });
    }
}

// रजिस्ट्रेशन मोडल खोलने का मुख्य फ़ंक्शन
function openRegisterModal() {
    if (!CONFIG.isRegistrationOpen) {
        openNoticeModal(
            "पंजीकरण समाप्त", 
            "काव्योत्सव 2026 के लिए सभी सीटों का पंजीकरण पूर्ण हो चुका है। आयोजन स्थल पर केवल पूर्व-पंजीकृत पास धारकों को ही प्रवेश दिया जाएगा। आगामी कार्यक्रमों की सूचना हेतु हमारे साथ जुड़े रहें।"
        );
        return;
    }

    // रजिस्ट्रेशन चालू होने पर फॉर्म मोडल खोलें
    const regModal = document.getElementById("registerModal");
    if (regModal) {
        regModal.style.setProperty("display", "flex", "important");
    }
}

// नोटिस पॉपअप खोलने का फ़ंक्शन
function openNoticeModal(title, msg) {
    let modal = document.getElementById("statusNoticeModal");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "statusNoticeModal";
        modal.className = "modal-overlay";
        modal.innerHTML = `
            <div class="modal-box" style="text-align: center; max-width: 440px;">
                <button type="button" class="modal-close" onclick="closeNoticeModal()">&times;</button>
                <div style="font-size: 3rem; margin-bottom: 10px;">⏳</div>
                <h2 id="noticeTitle" style="color: #D4AF37; margin-bottom: 12px; font-family: 'Yatra One', cursive;">${title}</h2>
                <p id="noticeMessage" style="color: #475569; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">${msg}</p>
                <button type="button" class="btn-primary w-100" onclick="closeNoticeModal()">समझ गया</button>
            </div>
        `;
        document.body.appendChild(modal);
    } else {
        document.getElementById("noticeTitle").innerText = title;
        document.getElementById("noticeMessage").innerText = msg;
    }
    modal.style.setProperty("display", "flex", "important");
}

function closeNoticeModal() {
    const modal = document.getElementById("statusNoticeModal");
    if (modal) {
        modal.style.setProperty("display", "none", "important");
    }
}

// ==========================================
// BULLETPROOF DIRECT ADMIN LOGIN
// ==========================================
function openAdminModal() {
    const modal = document.getElementById('adminModal');
    if (modal) {
        modal.style.setProperty('display', 'flex', 'important');
    }
}

function closeAdminModal() {
    const modal = document.getElementById('adminModal');
    if (modal) {
        modal.style.setProperty('display', 'none', 'important');
    }
}

function performDirectLogin() {
    const userInput = document.getElementById('adminUser') ? document.getElementById('adminUser').value.trim() : '';
    const passInput = document.getElementById('adminPass') ? document.getElementById('adminPass').value.trim() : '';
    const loginError = document.getElementById('loginError');
    const submitBtn = document.getElementById('adminSubmitBtn');

    if (!userInput || !passInput) {
        if (loginError) {
            loginError.innerText = "कृपया यूज़रनेम और पासवर्ड दोनों दर्ज करें।";
            loginError.style.display = 'block';
        }
        return;
    }

    if (loginError) loginError.style.display = 'none';
    if (submitBtn) {
        submitBtn.innerText = "⏳ सत्यापन हो रहा है...";
        submitBtn.disabled = true;
    }

    const callbackName = 'loginCb_' + Date.now();

    window[callbackName] = function(data) {
        delete window[callbackName];
        const elem = document.getElementById('admin_login_script');
        if (elem && elem.parentNode) elem.parentNode.removeChild(elem);

        if (submitBtn) {
            submitBtn.innerText = "लॉगिन करें";
            submitBtn.disabled = false;
        }

        if (data && data.status === "success") {
            sessionStorage.setItem("admin_auth_token", data.token);
            document.getElementById('adminUser').value = '';
            document.getElementById('adminPass').value = '';
            closeAdminModal();
            const dashboard = document.getElementById('adminDashboard');
            if (dashboard) {
                dashboard.style.display = 'flex';
            }
        } else {
            if (loginError) {
                loginError.innerText = "❌ अमान्य यूज़रनेम/मोबाइल या पासवर्ड!";
                loginError.style.display = 'block';
            }
        }
    };

    const old = document.getElementById('admin_login_script');
    if (old && old.parentNode) old.parentNode.removeChild(old);

    const s = document.createElement('script');
    s.id = 'admin_login_script';
    s.src = `${WEB_APP_URL}?action=adminLogin&user=${encodeURIComponent(userInput)}&pass=${encodeURIComponent(passInput)}&callback=${callbackName}&t=${Date.now()}`;
    s.onerror = function() {
        if (submitBtn) {
            submitBtn.innerText = "लॉगिन करें";
            submitBtn.disabled = false;
        }
        if (loginError) {
            loginError.innerText = "❌ नेटवर्क त्रुटि! Apps Script URL जाँचें।";
            loginError.style.display = 'block';
        }
    };
    document.body.appendChild(s);
}
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyWiS60UTLK6IeEFjrfnkBm7YUgeU7eiLjF651GaPjdileehBxFeiyc0j_TXQuGyn7R/exec";
const SHEET_ID = "1ZT-rXXm9lU6s5kF3ohvB7NqOggOki73BBjOFRmisNmQ";

let html5QrCode = null;
let isScanning = false;
let scannedCount = 0;
let currentMatchedUser = null;

// ==========================================
// 2. SMOOTH INTRO ANIMATION TIMEOUT (2.5 Secs)
// ==========================================
function removeSplashScreen() {
    const splash = document.getElementById("introSplash");
    if (splash && !splash.classList.contains("hide-splash")) {
        splash.classList.add("hide-splash");
        setTimeout(() => {
            splash.style.display = "none";
        }, 800); // एनिमेशन स्मूद फेड-आउट होने के बाद पूरी तरह हटेगा
    }
}

// 2.5 सेकंड तक सिनेमाटिक एनिमेशन दिखेगा
setTimeout(removeSplashScreen, 2500);

// क्लिक करने पर तुरंत स्किप करने की सुविधा
document.addEventListener("DOMContentLoaded", () => {
    const splash = document.getElementById("introSplash");
    if (splash) splash.addEventListener("click", removeSplashScreen);
});

// ==========================================
// 3. DIRECT GOOGLE SHEET GUEST LOADER
// ==========================================
async function loadGuestsDirectly() {
    const grid = document.getElementById('guestGrid');
    if (!grid) return;

    try {
        const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Guest&t=${Date.now()}`;
        const response = await fetch(csvUrl);
        const text = await response.text();

        const rows = text.split("\n").map(row => {
            return row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(val => val.replace(/^"|"$/g, '').trim());
        });

        if (!rows || rows.length <= 1) {
            grid.innerHTML = `<p style="text-align:center; grid-column:1/-1; color:#64748B;">अतिथियों की सूची शीघ्र ही प्रकाशित की जाएगी।</p>`;
            return;
        }

        let html = "";
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
        grid.innerHTML = `<p style="text-align:center; grid-column:1/-1; color:#64748B;">अतिथियों की सूची लोड करने में समस्या हुई।</p>`;
    }
}

// ==========================================
// 4. MODALS & PRICING
// ==========================================
function updateTicketPrice() {
    const role = document.getElementById('userRole').value;
    const priceDisplay = document.getElementById('priceDisplay');
    const performerFields = document.getElementById('performerFields');
    const submitBtn = document.getElementById('submitRegBtn');

    if (role === 'Performer') {
        priceDisplay.innerText = '₹299';
        performerFields.style.display = 'block';
        submitBtn.innerText = '₹299 भुगतान करें एवं पास प्राप्त करें';
    } else {
        priceDisplay.innerText = '₹00';
        performerFields.style.display = 'none';
        submitBtn.innerText = 'निःशुल्क पास बुक करें';
    }
}

function toggleNavMenu(e) {
    if (e) e.stopPropagation();
    document.getElementById('navMenu').classList.toggle('active');
}

function closeNavMenu() {
    document.getElementById('navMenu').classList.remove('active');
}

function openRegisterModal(e) {
    if (e) e.stopPropagation();
    document.getElementById('registerModal').style.display = 'flex';
    updateTicketPrice();
}

function closeRegisterModal() {
    document.getElementById('registerModal').style.display = 'none';
}

function openDownloadModal() {
    document.getElementById('downloadModal').style.display = 'flex';
    document.getElementById('portalResult').style.display = 'none';
    document.getElementById('portalNotFound').style.display = 'none';
    document.getElementById('searchQuery').value = '';
}

function closeDownloadModal() {
    document.getElementById('downloadModal').style.display = 'none';
}

function openAdminModal(e) {
    if (e) e.stopPropagation();
    document.getElementById('adminModal').style.display = 'flex';
}

function closeAdminModal() {
    document.getElementById('adminModal').style.display = 'none';
}

function closeAdminDashboard() {
    document.getElementById('adminDashboard').style.display = 'none';
    stopCamera();
}

window.addEventListener('click', function(event) {
    ['registerModal', 'adminModal', 'downloadModal'].forEach(id => {
        const el = document.getElementById(id);
        if (el && event.target === el) el.style.display = 'none';
    });
});

// ==========================================
// 5. REGISTRATION & RAZORPAY PAYMENT
// ==========================================
document.getElementById('ticketForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const role = document.getElementById('userRole').value;
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    
    let vidha = "N/A";
    let title = "";
    if (role === 'Performer') {
        vidha = document.getElementById('vidha').value;
        title = document.getElementById('title').value;
    }

    // अगर श्रोता (Audience) है तो डायरेक्ट Free Registration
    if (role === 'Audience') {
        const freeId = "AUD-" + Math.floor(100000 + Math.random() * 900000);
        processSuccessfulRegistration(freeId, name, email, phone, role, vidha, title);
        return;
    }

    // Performer के लिए Razorpay Gateway
    if (typeof Razorpay === 'undefined') {
        alert("Razorpay लोड नहीं हो सका। कृपया इंटरनेट चेक करें।");
        return;
    }

    var options = {
        "key": "rzp_live_TSAArVlVekqxXd",
        "amount": 29900, // ₹299.00
        "currency": "INR",
        "name": "अभिव्यक्ति काव्यपीठ",
        "description": "Kavyotsav 2026 Performer Pass",
        "image": "https://i.postimg.cc/BvCpXsBY/file-000000004b2c82119a54e5fe960f91e8.png",
        "handler": function (response) {
            processSuccessfulRegistration(response.razorpay_payment_id, name, email, phone, role, vidha, title);
        },
        "prefill": { "name": name, "email": email, "contact": phone },
        "theme": { "color": "#78350f" }
    };

    var rzp = new Razorpay(options);
    rzp.open();
});

function processSuccessfulRegistration(ticketId, name, email, phone, role, vidha, sample) {
    // Sheet में डाटा भेजना
    fetch(WEB_APP_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: "register",
            paymentId: ticketId,
            name: name,
            email: email,
            phone: phone,
            role: role,
            vidha: vidha,
            sample: sample
        })
    });

    currentMatchedUser = {
        ticketId: ticketId,
        name: name,
        type: role === 'Performer' ? 'कवि / मंच प्रस्तुतकर्ता' : 'श्रोता / दर्शक'
    };
    
    generateAndDownloadTicketPDF();
    document.getElementById('ticketForm').reset();
    closeRegisterModal();
    alert(`पंजीकरण सफल! आपका टिकट ID: ${ticketId} है। ई-पास डाउनलोड हो रहा है।`);
}

// ==========================================
// 6. SEARCH PORTAL & PDF PASS GENERATOR
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
            ticketBtn.style.display = "block";

            const certBtn = document.getElementById('btnDownloadCert');
            if (data.user.certificateUrl && data.user.certificateUrl.startsWith("http")) {
                certBtn.href = data.user.certificateUrl;
                certBtn.style.pointerEvents = 'auto';
                certBtn.style.opacity = '1';
                certBtn.innerText = '📜 ई-सर्टिफिकेट PDF डाउनलोड करें';
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
// 7. ADMIN SCANNER & ATTENDANCE VERIFICATION
// ==========================================
function handleAdminLogin(event) {
    if (event) event.preventDefault();

    const userInput = document.getElementById('adminUser').value.trim();
    const passInput = document.getElementById('adminPass').value.trim();
    const loginError = document.getElementById('loginError');

    if ((userInput === ADMIN_CREDENTIALS.user || userInput === ADMIN_CREDENTIALS.email) && passInput === ADMIN_CREDENTIALS.pass) {
        loginError.style.display = 'none';
        document.getElementById('adminLoginForm').reset();
        closeAdminModal(); 
        document.getElementById('adminDashboard').style.display = 'flex'; 
    } else {
        loginError.innerText = "❌ अमान्य Email/Phone या Password!";
        loginError.style.display = 'block';
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
    }).catch(err => alert("Camera Error: " + err));
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

window.handleScanResult = function(data) {
    const resultBox = document.getElementById('scanResultBox');
    if (!resultBox) return;

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
            <p style="margin:4px 0;">डेटाबेस में टिकट आईडी नहीं मिली।</p>
        `;
    }
};

function onScanSuccess(decodedText) {
    stopCamera();
    if (navigator.vibrate) navigator.vibrate(200);

    let scannedId = decodedText.trim();
    if (scannedId.includes('id=')) {
        scannedId = scannedId.split('id=')[1].split('&')[0];
    }

    const resultBox = document.getElementById('scanResultBox');
    resultBox.style.display = 'block';
    resultBox.innerHTML = `⏳ <strong>सत्यापन जारी है...</strong><br><small>Ticket: ${scannedId}</small>`;

    const callbackName = 'scanCallback_' + Math.round(100000 * Math.random());

    // कॉलबैक फ़ंक्शन
    window[callbackName] = function(data) {
        delete window[callbackName];
        if (scriptTag && scriptTag.parentNode) scriptTag.parentNode.removeChild(scriptTag);
        window.handleScanResult(data);
    };

    const scriptTag = document.createElement('script');
    scriptTag.src = `${WEB_APP_URL}?action=markAttendance&ticketId=${encodeURIComponent(scannedId)}&callback=${callbackName}&t=${Date.now()}`;
    
    scriptTag.onerror = function() {
        resultBox.style.borderTop = "6px solid #DC2626";
        resultBox.innerHTML = `❌ <strong>कनेक्शन एरर</strong><br><small>सर्वर से संपर्क नहीं हो सका।</small>`;
    };

    document.body.appendChild(scriptTag);
}
// ==========================================
// 8. COUNTDOWN & FAQ INITIALIZATION
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
    loadGuestsDirectly();
    initCountdown();
    initFaq();
});

// ==========================================
// LEGAL POLICIES POPUP HANDLER
// ==========================================
const POLICIES_DATA = {
    privacy: {
        title: "गोपनीयता नीति (Privacy Policy)",
        content: `
            <p><strong>1. सूचना संग्रहण:</strong> 'अभिव्यक्ति काव्यपीठ' पंजीकरण के दौरान केवल आवश्यक विवरण (नाम, संपर्क नंबर, ईमेल आईडी एवं रचना विवरण) एकत्रित करता है।</p>
            <p><strong>2. डेटा सुरक्षा:</strong> आपका डेटा केवल प्रवेश सत्यापन एवं प्रमाणपत्र वितरण हेतु सुरक्षित सर्वर पर रखा जाता है। इसे किसी तीसरे पक्ष को साझा या बेचा नहीं जाता।</p>
            <p><strong>3. भुगतान सुरक्षा:</strong> सभी ऑनलाइन लेन-देन 100% सुरक्षित एवं प्रमाणित Razorpay पेमेंट गेटवे के माध्यम से प्रोसेस किए जाते हैं।</p>
        `
    },
    terms: {
        title: "नियम एवं शर्तें (Terms & Conditions)",
        content: `
            <p><strong>1. ई-पास एवं प्रवेश:</strong> प्रवेश द्वार पर वैध ई-पास एवं क्यूआर कोड सत्यापन अनिवार्य है। एक पास पर केवल एक व्यक्ति को प्रवेश दिया जाएगा।</p>
            <p><strong>2. अनुशासन एवं समय:</strong> कार्यक्रम 23 अगस्त 2026 को सायं 05:00 बजे से प्रारंभ होगा। सभी प्रतिभागियों से समयबद्धता की अपेक्षा है।</p>
            <p><strong>3. काव्य विधा:</strong> मंच पर प्रस्तुत की जाने वाली रचना मौलिक एवं साहित्यिक मर्यादा के अनुरूप होनी चाहिए।</p>
        `
    },
    refund: {
        title: "रिफंड एवं निरस्तीकरण नीति (Refund Policy)",
        content: `
            <p><strong>1. श्रोता पंजीकरण:</strong> दर्शकों एवं श्रोताओं हेतु पंजीकरण पूर्णतः निःशुल्क (₹00) है।</p>
            <p><strong>2. प्रस्तुतकर्ता स्लॉट (₹299):</strong> कवि स्लॉट बुकिंग के पश्चात स्लॉट सुरक्षित हो जाता है। यदि अपरिहार्य कारणों से कार्यक्रम संस्था द्वारा रद्द किया जाता है, तो पूर्ण शुल्क 7 कार्यदिवसों के भीतर वापस कर दिया जाएगा।</p>
        `
    }
};

function openPolicyModal(type) {
    const modal = document.getElementById('policyModal');
    const title = document.getElementById('policyTitle');
    const content = document.getElementById('policyContent');

    if (POLICIES_DATA[type]) {
        title.innerText = POLICIES_DATA[type].title;
        content.innerHTML = POLICIES_DATA[type].content;
        modal.style.display = 'flex';
    }
}

function closePolicyModal() {
    const modal = document.getElementById('policyModal');
    if (modal) modal.style.display = 'none';
}

window.addEventListener('click', function(event) {
    const polModal = document.getElementById('policyModal');
    if (polModal && event.target === polModal) polModal.style.display = 'none';
});

// ==========================================
// FRONTEND DEVTOOLS & INSPECT PROTECTION
// ==========================================
document.addEventListener('contextmenu', function(e) {
    e.preventDefault(); // Right Click बंद
});

document.addEventListener('keydown', function(e) {
    // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U को ब्लॉक करना
    if (
        e.key === 'F12' || 
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) || 
        (e.ctrlKey && (e.key === 'u' || e.key === 'U'))
    ) {
        e.preventDefault();
        return false;
    }
});

// ==========================================
// REGISTRATION CLOSURE ENFORCER (100% BLOCK)
// ==========================================
const IS_REGISTRATION_CLOSED = true; // बंद करने के लिए true, चालू करने के लिए false

function enforceRegistrationStatus() {
    if (!IS_REGISTRATION_CLOSED) return;

    // 1. पुराने openRegisterModal फ़ंक्शन को ओवरराइड करना
    window.openRegisterModal = function() {
        showRegistrationClosedPopup();
    };

    // 2. पेज के सभी पास बुक बटन्स पर क्लिक को इंटरसेप्ट करना
    document.querySelectorAll("button, a").forEach(el => {
        const txt = el.innerText.trim();
        const onclickAttr = el.getAttribute("onclick") || "";

        if (
            txt.includes("पास बुक") || 
            txt.includes("पंजीकरण") || 
            onclickAttr.includes("openRegisterModal")
        ) {
            el.removeAttribute("onclick");
            el.onclick = function(e) {
                e.preventDefault();
                e.stopImmediatePropagation();
                showRegistrationClosedPopup();
            };
        }
    });
}

function showRegistrationClosedPopup() {
    let modal = document.getElementById("regClosedModal");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "regClosedModal";
        modal.className = "modal-overlay";
        modal.style.cssText = "display:flex !important; position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.85); backdrop-filter:blur(6px); z-index:9999999; justify-content:center; align-items:center; padding:15px;";
        
        modal.innerHTML = `
            <div class="modal-box" style="background:#0A1931; border:2px solid #D4AF37; border-radius:14px; max-width:420px; width:95%; padding:25px; text-align:center; color:#FFF; box-shadow:0 10px 30px rgba(0,0,0,0.8);">
                <div style="font-size:3rem; margin-bottom:10px;">🚫</div>
                <h2 style="color:#D4AF37; margin:0 0 10px 0; font-family:'Yatra One', cursive; font-size:1.5rem;">पंजीकरण बंद है</h2>
                <p style="color:#CBD5E1; font-size:14px; line-height:1.6; margin-bottom:20px;">
                    काव्योत्सव 2026 हेतु सभी सीटों का ऑनलाइन पंजीकरण पूर्ण हो चुका है। अब नए पास जारी नहीं किए जा रहे हैं।
                </p>
                <button type="button" class="btn-primary w-100" onclick="document.getElementById('regClosedModal').style.setProperty('display','none','important');" style="padding:10px; border-radius:8px; font-weight:bold; cursor:pointer;">
                    समझ गया
                </button>
            </div>
        `;
        document.body.appendChild(modal);
    } else {
        modal.style.setProperty("display", "flex", "important");
    }
}

// पेज लोड होते ही और 500ms बाद लागू करें
document.addEventListener("DOMContentLoaded", enforceRegistrationStatus);
setTimeout(enforceRegistrationStatus, 600);

// ==========================================
// NOTIFY ME LOGIC (आगामी इवेंट सूचना)
// ==========================================
function openNotifyModal() {
    const modal = document.getElementById('notifyMeModal');
    if (modal) {
        modal.style.setProperty('display', 'flex', 'important');
    }
}

function closeNotifyModal() {
    const modal = document.getElementById('notifyMeModal');
    if (modal) {
        modal.style.setProperty('display', 'none', 'important');
    }
}

// सूचना बटन पर सीधे openNotifyModal बाइंड करना
document.addEventListener("DOMContentLoaded", function() {
    document.querySelectorAll("button, a").forEach(el => {
        if (el.innerText.includes("सूचना प्राप्त करें")) {
            el.removeAttribute("onclick");
            el.onclick = function(e) {
                e.preventDefault();
                e.stopImmediatePropagation();
                openNotifyModal();
            };
        }
    });
});

// ==========================================
// NOTIFY ME SUBMISSION TO GOOGLE SHEET
// ==========================================
function handleNotifySubmit(event) {
    if (event) event.preventDefault();
    
    const name = document.getElementById('notifyName').value.trim();
    const contact = document.getElementById('notifyContact').value.trim();
    const btn = document.getElementById('notifySubmitBtn');

    if (!name || !contact) return;

    btn.innerText = "⏳ दर्ज किया जा रहा है...";
    btn.disabled = true;

    const callbackName = 'notifyCb_' + Date.now();

    window[callbackName] = function(data) {
        delete window[callbackName];
        const elem = document.getElementById('notify_script_tag');
        if (elem && elem.parentNode) elem.parentNode.removeChild(elem);

        btn.innerText = "सूचना हेतु पंजीकृत करें";
        btn.disabled = false;
        document.getElementById('notifyForm').reset();
        closeNotifyModal();

        alert(`धन्यवाद ${name} जी! आगामी कार्यक्रम की सूचना हेतु आपका विवरण सुरक्षित कर लिया गया है।`);
    };

    const oldScript = document.getElementById('notify_script_tag');
    if (oldScript && oldScript.parentNode) oldScript.parentNode.removeChild(oldScript);

    const scriptTag = document.createElement('script');
    scriptTag.id = 'notify_script_tag';
    scriptTag.src = `${WEB_APP_URL}?action=saveNotification&name=${encodeURIComponent(name)}&contact=${encodeURIComponent(contact)}&callback=${callbackName}&t=${Date.now()}`;
    
    scriptTag.onerror = function() {
        btn.innerText = "सूचना हेतु पंजीकृत करें";
        btn.disabled = false;
        alert("नेटवर्क त्रुटि: कृपया दोबारा प्रयास करें।");
    };

    document.body.appendChild(scriptTag);
}