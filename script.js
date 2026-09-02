// =================================================================
// ⚙️ 1. CENTRAL EVENT MASTER CONFIGURATION
// =================================================================
const EVENT_CONFIG = {
  currentEvent: {
    name: "काव्योत्सव 2026",
    tagline: "साहित्यिक चेतना एवं भव्य युवा काव्य सभा",
    regNo: "REG. NO: UDYAM-UP-03-0155035",
    date: "8 सितंबर 2026",
    time: "सुबह 11:00 बजे",
    timeSlotDetails: "सुबह 11:00 बजे से",
    venue: "इलाहाबाद विश्वविद्यालय",
    fullAddress: "सीनेट हॉल, प्रयागराज, उत्तर प्रदेश",
    mapUrl: "https://goo.gl/maps/your-location",
    performerFee: "₹299",
    razorpayAmount: 29900
  },
  upcomingEvent: {
    badge: "✨ आगामी कार्यक्रम (Coming Soon) ✨",
    title: "काव्योत्सव (आगामी सत्र)",
    tagline: "काव्य प्रेमियों के लिए एक अद्वितीय मंच • शीघ्र आ रहा है",
    date: "शीघ्र घोषित (Coming Soon)",
    time: "शीघ्र घोषित",
    venue: "प्रयागराज, उत्तर प्रदेश",
    fullAddress: "स्थान शीघ्र घोषित किया जाएगा",
    mapUrl: "javascript:void(0)"
  }
};

const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyWiS60UTLK6IeEFjrfnkBm7YUgeU7eiLjF651GaPjdileehBxFeiyc0j_TXQuGyn7R/exec";
const SHEET_ID = "1ZT-rXXm9lU6s5kF3ohvB7NqOggOki73BBjOFRmisNmQ";

let html5QrCode = null;
let isScanning = false;
let scannedCount = 0;
let currentMatchedUser = null;
let currentRegStatus = "ON";

// -------------------------------------------------------------------
// 2. CENTRAL EVENT DATA INJECTOR
// -------------------------------------------------------------------
function injectDynamicEventData() {
  const ev = (currentRegStatus === "OFF") ? EVENT_CONFIG.upcomingEvent : EVENT_CONFIG.currentEvent;

  const abtTime = document.getElementById("dynAboutTime");
  const abtVenue = document.getElementById("dynAboutVenue");
  const abtMap = document.getElementById("dynAboutMapLink");
  
  if (abtTime) abtTime.innerText = ev.timeSlotDetails || ev.time;
  if (abtVenue) abtVenue.innerText = ev.venue || ev.fullAddress;
  if (abtMap) {
    abtMap.href = ev.mapUrl || "https://maps.google.com";
    abtMap.target = (ev.mapUrl && ev.mapUrl.startsWith("http")) ? "_blank" : "_self";
  }

  const formTitle = document.getElementById("dynFormEventTitle");
  if (formTitle) formTitle.innerText = `${EVENT_CONFIG.currentEvent.name} पास बुकिंग`;
}

// -------------------------------------------------------------------
// 3. REGISTRATION ON/OFF STATUS
// -------------------------------------------------------------------
function checkGlobalRegistrationStatus() {
  const cb = 'cb_reg_stat_' + Date.now();
  window[cb] = function(res) {
    delete window[cb];
    if (res && res.status === "success") {
      currentRegStatus = res.regStatus || "ON";

      if (res.activeEvent) {
        EVENT_CONFIG.currentEvent = Object.assign(EVENT_CONFIG.currentEvent, res.activeEvent);
      }

      if (document.getElementById("admEvName")) document.getElementById("admEvName").value = EVENT_CONFIG.currentEvent.name;
      if (document.getElementById("admEvDate")) document.getElementById("admEvDate").value = EVENT_CONFIG.currentEvent.date;
      if (document.getElementById("admEvTime")) document.getElementById("admEvTime").value = EVENT_CONFIG.currentEvent.time;
      if (document.getElementById("admEvVenue")) document.getElementById("admEvVenue").value = EVENT_CONFIG.currentEvent.fullAddress || EVENT_CONFIG.currentEvent.venue;
      if (document.getElementById("admEvMapUrl")) document.getElementById("admEvMapUrl").value = EVENT_CONFIG.currentEvent.mapUrl || "";
      if (document.getElementById("admEvFee")) document.getElementById("admEvFee").value = EVENT_CONFIG.currentEvent.performerFee;
      if (document.getElementById("admEvRzp")) document.getElementById("admEvRzp").value = EVENT_CONFIG.currentEvent.razorpayAmount;

      applyRegistrationUI(currentRegStatus);
    }
  };

  const s = document.createElement("script");
  s.src = `${WEB_APP_URL}?action=getRegistrationStatus&callback=${cb}&t=${Date.now()}`;
  document.body.appendChild(s);
}

function applyRegistrationUI(status) {
  const regBtns = document.querySelectorAll(".btn-nav-gold, #btnNavPassBook, #btnOpenRegisterModal, .btn-primary.btn-book");
  const heroBadge = document.querySelector(".hero .badge");
  const heroH1 = document.querySelector(".hero h1");
  const heroTagline = document.querySelector(".hero .tagline");
  const heroMeta = document.querySelector(".hero-meta");
  const heroMainBtn = document.querySelector(".hero .btn-primary");
  
  const statusText = document.getElementById("adminRegStatusText");
  const toggleBtn = document.getElementById("btnAdminToggleReg");

  if (status === "OFF") {
    const up = EVENT_CONFIG.upcomingEvent;
    if (heroBadge) heroBadge.innerText = up.badge;
    if (heroH1) heroH1.innerText = up.title;
    if (heroTagline) heroTagline.innerText = up.tagline;
    
    if (heroMeta) {
      heroMeta.innerHTML = `
        <span><i class="fas fa-map-marker-alt"></i> ${up.venue}</span>
        <span><i class="fas fa-calendar-alt"></i> ${up.date}</span>
        <span><i class="fas fa-clock"></i> ${up.time}</span>
      `;
    }

    if (heroMainBtn) {
      heroMainBtn.innerHTML = `🔔 आगामी इवेंट सूचना प्राप्त करें`;
      heroMainBtn.onclick = function(e) {
        if (e) e.preventDefault();
        openNotifyModal();
      };
    }

    regBtns.forEach(btn => {
      if (btn) {
        btn.innerText = "🚫 पंजीकरण बंद है";
        btn.style.opacity = "0.75";
      }
    });

    if (statusText) statusText.innerText = "वर्तमान स्थिति: बंद (OFF) - पोस्टर सक्रिय";
    if (toggleBtn) {
      toggleBtn.innerText = "पंजीकरण चालू करें (Turn ON)";
      toggleBtn.style.background = "#22C55E";
      toggleBtn.style.color = "#FFF";
    }
  } else {
    const cur = EVENT_CONFIG.currentEvent;
    if (heroBadge) heroBadge.innerText = cur.regNo;
    if (heroH1) heroH1.innerText = cur.name;
    if (heroTagline) heroTagline.innerText = cur.tagline;

    if (heroMeta) {
      heroMeta.innerHTML = `
        <span><i class="fas fa-map-marker-alt"></i> ${cur.venue}</span>
        <span><i class="fas fa-calendar-alt"></i> ${cur.date}</span>
        <span><i class="fas fa-clock"></i> ${cur.time}</span>
      `;
    }

    if (heroMainBtn) {
      heroMainBtn.innerText = "पास बुक करें";
      heroMainBtn.onclick = function(e) {
        openRegisterModal(e);
      };
    }

    regBtns.forEach(btn => {
      if (btn) {
        btn.innerText = "पास बुक करें";
        btn.style.opacity = "1";
      }
    });

    if (statusText) statusText.innerText = "वर्तमान स्थिति: चालू (ON)";
    if (toggleBtn) {
      toggleBtn.innerText = "पंजीकरण बंद करें (Turn OFF)";
      toggleBtn.style.background = "#EF4444";
      toggleBtn.style.color = "#FFF";
    }
  }

  injectDynamicEventData();
}

// 🔒 [PROTECTED] ADMIN REG TOGGLE
function toggleRegistrationState() {
  const token = sessionStorage.getItem("admin_auth_token");
  if (!token) { alert("सत्र समाप्त हो गया है! कृपया दोबारा एडमिन लॉगिन करें।"); return; }

  const toggleBtn = document.getElementById("btnAdminToggleReg");
  const targetStatus = (currentRegStatus === "ON") ? "OFF" : "ON";
  
  if (toggleBtn) {
    toggleBtn.innerText = "⏳ अपडेट हो रहा है...";
    toggleBtn.disabled = true;
  }

  const cb = 'cb_toggle_reg_' + Date.now();
  window[cb] = function(res) {
    delete window[cb];
    if (toggleBtn) toggleBtn.disabled = false;

    if (res && res.status === "success") {
      currentRegStatus = res.regStatus;
      applyRegistrationUI(res.regStatus);
      alert(res.regStatus === "ON" ? "✅ पंजीकरण चालू हो गया है!" : "🛑 पंजीकरण बंद कर दिया गया है!");
    } else {
      alert("❌ " + (res.message || "त्रुटि हुई!"));
    }
  };

  const s = document.createElement("script");
  s.src = `${WEB_APP_URL}?action=toggleRegistrationStatus&status=${targetStatus}&token=${encodeURIComponent(token)}&callback=${cb}&t=${Date.now()}`;
  document.body.appendChild(s);
}

// 🔒 [PROTECTED] ADMIN EVENT SAVE
function saveAdminNewEvent() {
  const token = sessionStorage.getItem("admin_auth_token");
  if (!token) { alert("कृपया पहले एडमिन लॉगिन करें!"); return; }

  const name   = document.getElementById("admEvName").value.trim();
  const date   = document.getElementById("admEvDate").value.trim();
  const time   = document.getElementById("admEvTime").value.trim();
  const venue  = document.getElementById("admEvVenue").value.trim();
  const mapUrl = document.getElementById("admEvMapUrl") ? document.getElementById("admEvMapUrl").value.trim() : "https://goo.gl/maps/your-location";
  const fee    = document.getElementById("admEvFee").value.trim() || "₹299";
  const rzp    = parseInt(document.getElementById("admEvRzp").value) || 29900;

  if (!name || !date || !venue) {
    alert("कृपया इवेंट का नाम, तारीख और स्थान अवश्य दर्ज करें!");
    return;
  }

  const newEventData = {
    name: name, date: date, time: time, venue: venue,
    fullAddress: venue, mapUrl: mapUrl, performerFee: fee, razorpayAmount: rzp
  };

  const cb = 'cb_save_ev_' + Date.now();
  window[cb] = function(res) {
    delete window[cb];
    if (res && res.status === "success") {
      EVENT_CONFIG.currentEvent = Object.assign(EVENT_CONFIG.currentEvent, newEventData);
      currentRegStatus = "ON";
      applyRegistrationUI("ON");
      alert(`🎉 नया इवेंट "${name}" सफलतापूर्वक लागू हो गया है!`);
      loadAdminStats();
    } else {
      alert("❌ " + (res.message || "त्रुटि हुई!"));
    }
  };

  const s = document.createElement("script");
  s.src = `${WEB_APP_URL}?action=toggleRegistrationStatus&status=ON&eventData=${encodeURIComponent(JSON.stringify(newEventData))}&token=${encodeURIComponent(token)}&callback=${cb}&t=${Date.now()}`;
  document.body.appendChild(s);
}

// 🔒 [PROTECTED] ADMIN ANALYTICS & CSV EXPORT
function loadAdminStats() {
  const token = sessionStorage.getItem("admin_auth_token");
  if (!token) return;

  const cb = 'cb_stats_' + Date.now();
  window[cb] = function(res) {
    delete window[cb];
    if (res && res.status === "success" && res.stats) {
      if (document.getElementById("statTotalReg")) document.getElementById("statTotalReg").innerText = res.stats.totalReg;
      if (document.getElementById("statTotalPresent")) document.getElementById("statTotalPresent").innerText = `${res.stats.presentTotal} / ${res.stats.totalReg}`;
      if (document.getElementById("statPerformersPresent")) document.getElementById("statPerformersPresent").innerText = `${res.stats.presentPerformers} / ${res.stats.totalPerformers}`;
    }
  };

  const s = document.createElement("script");
  s.src = `${WEB_APP_URL}?action=getEventStats&token=${encodeURIComponent(token)}&callback=${cb}&t=${Date.now()}`;
  document.body.appendChild(s);
}

function exportEventDataCSV() {
  const token = sessionStorage.getItem("admin_auth_token");
  if (!token) { alert("अनधिकृत! कृपया एडमिन लॉगिन करें।"); return; }

  const cb = 'cb_export_' + Date.now();
  window[cb] = function(res) {
    delete window[cb];
    if (res && res.status === "success" && res.csv) {
      const csvStr = atob(res.csv);
      const blob = new Blob(["\uFEFF" + csvStr], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${res.eventName}_Participants_List.csv`;
      link.click();
    } else {
      alert("❌ " + (res.message || "डेटा एक्सपोर्ट असफल!"));
    }
  };

  const s = document.createElement("script");
  s.src = `${WEB_APP_URL}?action=exportEventCSV&token=${encodeURIComponent(token)}&callback=${cb}&t=${Date.now()}`;
  document.body.appendChild(s);
}

// 🔒 [PROTECTED] SPONSORS MANAGER
function saveAdminSponsor() {
  const token = sessionStorage.getItem("admin_auth_token");
  if (!token) { alert("कृपया पहले एडमिन लॉगिन करें!"); return; }

  const name  = document.getElementById("admSpName").value.trim();
  const tag   = document.getElementById("admSpTag").value.trim() || "Associate Partner";
  const photo = document.getElementById("admSpPhoto").value.trim();
  const insta = document.getElementById("admSpInsta").value.trim() || "#";
  const btn   = document.getElementById("btnAdminAddSp");

  if (!name) { alert("कृपया प्रायोजक का नाम दर्ज करें!"); return; }

  if (btn) { btn.innerText = "⏳ सुरक्षित हो रहा है..."; btn.disabled = true; }

  const cb = 'cb_sp_add_' + Date.now();
  window[cb] = function(res) {
    delete window[cb];
    if (btn) { btn.innerText = "➕ प्रायोजक जोड़ें व लाइव करें"; btn.disabled = false; }

    if (res && res.status === "success") {
      alert("✅ नया प्रायोजक सफलतापूर्वक जोड़ दिया गया है!");
      document.getElementById("admSpName").value = '';
      document.getElementById("admSpPhoto").value = '';
      document.getElementById("admSpInsta").value = '';
      loadSponsorsDirectly();
    } else {
      alert("❌ " + (res.message || "त्रुटि हुई!"));
    }
  };

  const s = document.createElement("script");
  s.src = `${WEB_APP_URL}?action=addSponsor&name=${encodeURIComponent(name)}&tag=${encodeURIComponent(tag)}&photo=${encodeURIComponent(photo)}&insta=${encodeURIComponent(insta)}&token=${encodeURIComponent(token)}&callback=${cb}&t=${Date.now()}`;
  document.body.appendChild(s);
}

function loadSponsorsDirectly() {
  const grid = document.getElementById("sponsorsGrid");
  if (!grid) return;

  const cb = 'cb_get_sp_' + Date.now();
  window[cb] = function(res) {
    delete window[cb];
    if (res && res.status === "success" && res.sponsors && res.sponsors.length > 0) {
      grid.innerHTML = res.sponsors.map(sp => `
        <a href="${sp.insta || '#'}" target="_blank" class="sponsor-card">
          <img src="${sp.photo || 'image/sponsor1.png'}" alt="${sp.name}" onerror="this.src='https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(sp.name)}'"> 
          <span>${sp.name}</span>
          <small style="font-size:10px; color:#B45309; font-weight:bold;">${sp.tag}</small>
        </a>
      `).join('');
    }
  };

  const s = document.createElement("script");
  s.src = `${WEB_APP_URL}?action=getSponsors&callback=${cb}&t=${Date.now()}`;
  document.body.appendChild(s);
}

// 🔒 [PROTECTED] VOLUNTEER SCANNER CONTROLLER (WITH SESSION TOKEN)
function openVolunteerModal(e) {
  if (e) {
    if (e.preventDefault) e.preventDefault();
    if (e.stopPropagation) e.stopPropagation();
  }

  const modal = document.getElementById("volunteerScanModal");
  if (modal) {
    modal.style.setProperty("display", "flex", "important");
    document.body.style.overflow = "hidden";

    if (sessionStorage.getItem("vol_scanner_token")) {
      document.getElementById("volLoginView").style.display = "none";
      document.getElementById("volScannerView").style.display = "block";
    } else {
      document.getElementById("volLoginView").style.display = "block";
      document.getElementById("volScannerView").style.display = "none";
    }
  }
}

function closeVolunteerModal() {
  const modal = document.getElementById("volunteerScanModal");
  if (modal) modal.style.setProperty("display", "none", "important");
  document.body.style.overflow = "auto";
  stopCamera();
}

function performVolunteerLogin() {
  const pass = document.getElementById("volPassInput").value.trim();
  const err  = document.getElementById("volLoginErr");
  const btn  = document.getElementById("btnVolLogin");

  if (!pass) {
    if (err) { err.innerText = "कृपया पासवर्ड दर्ज करें!"; err.style.display = "block"; }
    return;
  }

  btn.innerText = "⏳ सत्यापन हो रहा है...";
  btn.disabled = true;

  const cb = 'cb_vol_log_' + Date.now();
  window[cb] = function(res) {
    delete window[cb];
    btn.innerText = "स्कैनर शुरू करें";
    btn.disabled = false;

    if (res && res.status === "success") {
      sessionStorage.setItem("vol_scanner_token", res.token);
      document.getElementById("volPassInput").value = '';
      if (err) err.style.display = "none";

      document.getElementById("volLoginView").style.display = "none";
      document.getElementById("volScannerView").style.display = "block";
    } else {
      if (err) {
        err.innerText = "❌ अमान्य वालंटियर पासवर्ड!";
        err.style.display = "block";
      }
    }
  };

  const s = document.createElement("script");
  s.src = `${WEB_APP_URL}?action=volunteerLogin&pass=${encodeURIComponent(pass)}&callback=${cb}&t=${Date.now()}`;
  document.body.appendChild(s);
}

function toggleCamera() {
  if (!isScanning) startCamera();
  else stopCamera();
}

function startCamera() {
  if (typeof Html5Qrcode === 'undefined') {
    alert("QR स्कैनर लाइब्रेरी लोड नहीं हो सकी।");
    return;
  }
  html5QrCode = new Html5Qrcode("reader");
  const config = { fps: 20, qrbox: { width: 260, height: 260 } };

  html5QrCode.start({ facingMode: "environment" }, config, onScanSuccess)
  .then(() => {
    isScanning = true;
    if (document.getElementById('camToggleBtn')) document.getElementById('camToggleBtn').innerText = "🛑 Stop Camera";
    if (document.getElementById('scannerStatus')) document.getElementById('scannerStatus').innerText = "Scanning Active";
  }).catch(err => alert("Camera Error: " + err));
}

function stopCamera() {
  if (html5QrCode && isScanning) {
    html5QrCode.stop().then(() => {
      isScanning = false;
      if (document.getElementById('camToggleBtn')) document.getElementById('camToggleBtn').innerText = "📷 Start Camera Scanner";
      if (document.getElementById('scannerStatus')) document.getElementById('scannerStatus').innerText = "Stopped";
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
  if (resultBox) {
    resultBox.style.display = 'block';
    resultBox.innerHTML = `⏳ <strong>सत्यापन जारी है...</strong><br><small>Ticket: ${scannedId}</small>`;
  }

  // वालंटियर / एडमिन सुरक्षा टोकन अनिवार्य
  const volToken = sessionStorage.getItem("vol_scanner_token") || sessionStorage.getItem("admin_auth_token") || "";

  const cb = 'scanCallback_' + Math.round(100000 * Math.random());
  window[cb] = function(data) {
    delete window[cb];
    if (resultBox) {
      if (data && data.status === "approved") {
        scannedCount++;
        if (document.getElementById('scannedCount')) document.getElementById('scannedCount').innerText = scannedCount;
        resultBox.style.borderTop = "5px solid #10B981";
        resultBox.innerHTML = `
          <div style="background:#DCFCE7; color:#166534; padding:4px 10px; border-radius:12px; display:inline-block; font-weight:bold; font-size:12px;">✓ ENTRY APPROVED</div>
          <h4 style="color:#065F46; margin:5px 0;">प्रवेश मान्य</h4>
          <p style="margin:2px 0;"><strong>प्रतिभागी:</strong> ${data.name}</p>
          <p style="margin:0; font-size:11px; color:#64748B;">ID: ${data.ticketId} • समय: ${data.time}</p>
        `;
      } else if (data && data.status === "already_scanned") {
        resultBox.style.borderTop = "5px solid #DC2626";
        resultBox.innerHTML = `
          <div style="background:#FEE2E2; color:#991B1B; padding:4px 10px; border-radius:12px; display:inline-block; font-weight:bold; font-size:12px;">❌ ALREADY SCANNED</div>
          <h4 style="color:#991B1B; margin:5px 0;">पहले ही स्कैन हो चुका है</h4>
          <p style="margin:2px 0;"><strong>प्रतिभागी:</strong> ${data.name}</p>
          <p style="margin:0; font-size:11px; color:#64748B;">प्रथम स्कैन: ${data.time}</p>
        `;
      } else {
        resultBox.style.borderTop = "5px solid #DC2626";
        resultBox.innerHTML = `<h4 style="color:#DC2626; margin:0;">⚠️ अमान्य टिकट</h4><p style="margin:2px 0; font-size:12px;">${data.message || 'डेटाबेस में टिकट आईडी नहीं मिली।'}</p>`;
      }
    }
  };

  const scriptTag = document.createElement('script');
  scriptTag.src = `${WEB_APP_URL}?action=markAttendance&ticketId=${encodeURIComponent(scannedId)}&token=${encodeURIComponent(volToken)}&callback=${cb}&t=${Date.now()}`;
  document.body.appendChild(scriptTag);
}

// -------------------------------------------------------------------
// 7. REGISTRATION SUBMISSION (SERVER-SIDE VALIDATED)
// -------------------------------------------------------------------
function updateTicketPrice() {
  const roleEl = document.getElementById('userRole');
  if (!roleEl) return;
  const role = roleEl.value;
  const priceDisplay = document.getElementById('priceDisplay');
  const performerFields = document.getElementById('performerFields');
  const submitBtn = document.getElementById('submitRegBtn');
  const fee = EVENT_CONFIG.currentEvent.performerFee;

  if (role === 'Performer') {
    if (priceDisplay) priceDisplay.innerText = fee;
    if (performerFields) performerFields.style.display = 'block';
    if (submitBtn) submitBtn.innerText = `${fee} भुगतान करें एवं पास प्राप्त करें`;
  } else {
    if (priceDisplay) priceDisplay.innerText = '₹00';
    if (performerFields) performerFields.style.display = 'none';
    if (submitBtn) submitBtn.innerText = 'निःशुल्क पास बुक करें';
  }
}

const ticketForm = document.getElementById('ticketForm');
if (ticketForm) {
  ticketForm.addEventListener('submit', function(e) {
    e.preventDefault();

    if (currentRegStatus === "OFF") {
      alert("⚠️ पंजीकरण वर्तमान में बंद कर दिया गया है।");
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

    if (role === 'Audience') {
      processSuccessfulRegistration("AUD_PENDING", name, email, phone, role, vidha, title);
      return;
    }

    if (typeof Razorpay === 'undefined') {
      alert("Razorpay लोड नहीं हो सका। कृपया इंटरनेट चेक करें।");
      return;
    }

    const cur = EVENT_CONFIG.currentEvent;
    const options = {
      "key": "rzp_live_TX8fmhfY8L2MJV",
      "amount": cur.razorpayAmount,
      "currency": "INR",
      "name": "अभिव्यक्ति काव्यपीठ",
      "description": `${cur.name} Performer Pass`,
      "image": "https://i.postimg.cc/BvCpXsBY/file-000000004b2c82119a54e5fe960f91e8.png",
      "handler": function (response) {
        processSuccessfulRegistration(response.razorpay_payment_id, name, email, phone, role, vidha, title);
      },
      "prefill": { "name": name, "email": email, "contact": phone },
      "theme": { "color": "#78350f" }
    };

    const rzp = new Razorpay(options);
    rzp.open();
  });
}

function processSuccessfulRegistration(ticketId, name, email, phone, role, vidha, sample) {
  const submitBtn = document.getElementById('submitRegBtn');
  if (submitBtn) { submitBtn.innerText = "⏳ सत्यापन व पास जारी हो रहा है..."; submitBtn.disabled = true; }

  fetch(WEB_APP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({
      action: "register",
      paymentId: ticketId,
      name: name,
      email: email,
      phone: phone,
      role: role,
      vidha: vidha,
      sample: sample,
      eventName: EVENT_CONFIG.currentEvent.name
    })
  })
  .then(res => res.json())
  .then(data => {
    if (submitBtn) { submitBtn.innerText = "पास प्राप्त करें"; submitBtn.disabled = false; }
    
    if (data.result === "success") {
      const generatedPassId = data.ticketId || ticketId;
      if (document.getElementById('ticketForm')) document.getElementById('ticketForm').reset();
      closeRegisterModal();

      launchTicketDispenser({
        paymentId: generatedPassId,
        name: name,
        role: role === 'Performer' ? 'Performer' : 'Audience',
        vidha: vidha || "सामान्य",
        eventName: EVENT_CONFIG.currentEvent.name
      });
    } else {
      alert("❌ पंजीकरण त्रुटि: " + (data.message || "विवरण सुरक्षित नहीं हो सका!"));
    }
  })
  .catch(err => {
    if (submitBtn) { submitBtn.innerText = "पास प्राप्त करें"; submitBtn.disabled = false; }
    alert("सर्वर से संपर्क नहीं हो सका। कृपया पुनः प्रयास करें।");
  });
}

// -------------------------------------------------------------------
// 8. 3D TICKET DISPENSER
// -------------------------------------------------------------------
function playPrinterSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const now = audioCtx.currentTime;
    
    for (let i = 0; i < 24; i++) {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = (i % 2 === 0) ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(160 + (i * 12), now + (i * 0.11));
      gain.gain.setValueAtTime(0.08, now + (i * 0.11));
      gain.gain.exponentialRampToValueAtTime(0.001, now + (i * 0.11) + 0.08);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now + (i * 0.11));
      osc.stop(now + (i * 0.11) + 0.08);
    }
  } catch(e) {}
}

function launchTicketDispenser(passData) {
  const modal = document.getElementById("ticketDispenserModal");
  const ticket = document.getElementById("printablePassCard");
  const actions = document.getElementById("dispenserActions");

  if (!modal || !ticket) return;

  const cur = EVENT_CONFIG.currentEvent;
  const evTitle = passData.eventName || cur.name;

  if (document.getElementById("tDispEventTitle")) {
    document.getElementById("tDispEventTitle").innerText = `${evTitle} | ${cur.regNo.replace('REG. NO: ', '')}`;
  }
  if (document.getElementById("tDispDateTime")) {
    document.getElementById("tDispDateTime").innerText = `${cur.date}, ${cur.time}`;
  }
  if (document.getElementById("tDispVenue")) {
    document.getElementById("tDispVenue").innerText = cur.fullAddress;
  }

  if (document.getElementById("tDispName")) document.getElementById("tDispName").innerText = passData.name || "प्रतिभागी";
  if (document.getElementById("tDispId")) document.getElementById("tDispId").innerText = passData.paymentId || "AKP-PASS";
  if (document.getElementById("tDispRole")) document.getElementById("tDispRole").innerText = passData.role || "Audience";
  if (document.getElementById("tDispVidha")) document.getElementById("tDispVidha").innerText = "विधा: " + (passData.vidha || "सामान्य");

  const qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=" + encodeURIComponent(passData.paymentId);
  if (document.getElementById("tDispQR")) document.getElementById("tDispQR").src = qrUrl;

  ticket.classList.remove("printing-done");
  if (actions) actions.style.opacity = "0";
  modal.style.setProperty("display", "flex", "important");

  playPrinterSound();

  setTimeout(() => { ticket.classList.add("printing-done"); }, 300);
  setTimeout(() => { if (actions) actions.style.opacity = "1"; }, 2900);
}

function closeDispenserModal() {
  const modal = document.getElementById("ticketDispenserModal");
  if (modal) modal.style.setProperty("display", "none", "important");
}

function downloadPassAs(format) {
  const element = document.getElementById("printablePassCard");
  const passId = document.getElementById("tDispId") ? document.getElementById("tDispId").innerText.trim() : "PASS";

  if (!element || typeof html2canvas === 'undefined') {
    alert("डाउनलोड इंजन लोड हो रहा है, कृपया पुनः प्रयास करें।");
    return;
  }

  html2canvas(element, { scale: 3, useCORS: true, backgroundColor: null }).then(canvas => {
    if (format === 'png') {
      const link = document.createElement('a');
      link.download = `E-Pass_${passId}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } else if (format === 'pdf') {
      const { jsPDF } = window.jspdf;
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [canvas.width / 3, canvas.height / 3] });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 3, canvas.height / 3);
      pdf.save(`E-Pass_${passId}.pdf`);
    }
  });
}

// -------------------------------------------------------------------
// 9. MULTI-EVENT SEARCH PORTAL
// -------------------------------------------------------------------
function handlePortalSearch(event) {
  if (event && event.preventDefault) event.preventDefault();

  const query = document.getElementById('searchQuery').value.trim();
  const loader = document.getElementById('portalLoader');
  const resultBox = document.getElementById('portalResult');
  const errorBox = document.getElementById('portalNotFound');
  const searchBtn = document.getElementById('portalSearchBtn');

  if (!query) return;

  if (resultBox) resultBox.style.display = 'none';
  if (errorBox) errorBox.style.display = 'none';
  if (loader) loader.style.display = 'block';
  if (searchBtn) searchBtn.disabled = true;

  const callbackName = 'portalCallback_' + Math.round(100000 * Math.random());
  
  window[callbackName] = function(data) {
    delete window[callbackName];
    if (loader) loader.style.display = 'none';
    if (searchBtn) searchBtn.disabled = false;

    if (data && data.status === 'success' && data.allPasses && data.allPasses.length > 0) {
      resultBox.innerHTML = `
        <h4 style="color:#D4AF37; margin:0 0 10px 0; font-size:14px; border-bottom:1px solid rgba(212,175,55,0.3); padding-bottom:6px;">
          कुल ${data.allPasses.length} पास / रिकॉर्ड प्राप्त हुए:
        </h4>
      `;

      data.allPasses.forEach((pass, index) => {
        const isLatest = (index === 0);
        const passCard = document.createElement("div");
        passCard.style.cssText = "background:#0A1931; border:1px solid #D4AF37; border-radius:8px; padding:12px; margin-bottom:10px; text-align:left;";
        
        const displayEventName = (pass.eventName && pass.eventName !== "Participant's details") 
          ? pass.eventName : EVENT_CONFIG.currentEvent.name;

        passCard.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <strong style="color:#FFF; font-size:14px;">${displayEventName}</strong>
            <span style="font-size:10px; padding:2px 8px; border-radius:10px; background:${isLatest ? '#166534' : '#334155'}; color:#FFF;">
              ${isLatest ? 'नवीनतम (Active)' : 'पूर्व इवेंट'}
            </span>
          </div>
          <p style="margin:2px 0; font-size:12px; color:#CBD5E1;">प्रतिभागी: <strong>${pass.name}</strong> (${pass.type})</p>
          <p style="margin:2px 0; font-size:11px; color:#94A3B8;">Pass ID: <strong style="color:#F59E0B;">${pass.ticketId}</strong></p>
          
          <div style="display:flex; gap:8px; margin-top:10px;" id="actionBox_${index}"></div>
        `;

        resultBox.appendChild(passCard);

        const actionBox = passCard.querySelector(`#actionBox_${index}`);
        const ticketBtn = document.createElement("button");
        ticketBtn.type = "button";
        ticketBtn.className = "btn-primary";
        ticketBtn.style.cssText = "flex:1; padding:8px 6px; font-size:12px; font-weight:bold; cursor:pointer;";
        ticketBtn.innerHTML = "🎟️ ई-पास देखें / डाउनलोड";
        
        ticketBtn.onclick = function() {
          closeDownloadModal();
          setTimeout(() => {
            launchTicketDispenser({
              paymentId: pass.ticketId,
              name: pass.name,
              role: pass.type.includes("कवि") ? "Performer" : "Audience",
              vidha: pass.vidha || "सामान्य",
              eventName: displayEventName
            });
          }, 150);
        };
        actionBox.appendChild(ticketBtn);

        if (pass.certificateUrl && pass.certificateUrl.startsWith('http')) {
          const certLink = document.createElement("a");
          certLink.href = pass.certificateUrl;
          certLink.target = "_blank";
          certLink.className = "btn-outline-gold";
          certLink.style.cssText = "flex:1; padding:8px 6px; font-size:12px; text-align:center; text-decoration:none; font-weight:bold;";
          certLink.innerText = "📜 सर्टिफिकेट";
          actionBox.appendChild(certLink);
        }
      });

      resultBox.style.display = 'block';
    } else {
      if (errorBox) {
        errorBox.innerText = '⚠️ कोई विवरण नहीं मिला! कृपया सही 10 अंकों का मोबाइल नंबर या ईमेल दर्ज करें।';
        errorBox.style.display = 'block';
      }
    }
  };

  const scriptTag = document.createElement('script');
  scriptTag.src = `${WEB_APP_URL}?action=searchUser&query=${encodeURIComponent(query)}&callback=${callbackName}`;
  scriptTag.onerror = function() {
    if (loader) loader.style.display = 'none';
    if (searchBtn) searchBtn.disabled = false;
    if (errorBox) {
      errorBox.innerText = '⚠️ सर्वर से कनेक्ट करने में समस्या हुई।';
      errorBox.style.display = 'block';
    }
  };
  document.body.appendChild(scriptTag);
}

// -------------------------------------------------------------------
// 10. MODALS & ADMIN CONTROLLER
// -------------------------------------------------------------------
function toggleNavMenu(e) {
  if (e) e.stopPropagation();
  const nav = document.getElementById('navMenu');
  if (nav) nav.classList.toggle('active');
}

function closeNavMenu() {
  const nav = document.getElementById('navMenu');
  if (nav) nav.classList.remove('active');
}

function handlePassBookClick(e) {
  if (e) {
    if (e.preventDefault) e.preventDefault();
    if (e.stopPropagation) e.stopPropagation();
  }
  openRegisterModal(e);
}

function openRegisterModal(e) {
  if (e) {
    if (e.preventDefault) e.preventDefault();
    if (e.stopPropagation) e.stopPropagation();
  }

  if (currentRegStatus === "OFF") {
    alert("⚠️ वर्तमान में पंजीकरण बंद कर दिया गया है। आगामी कार्यक्रमों की सूचना हेतु हमारे साथ जुड़े रहें।");
    return;
  }

  const regModal = document.getElementById('registerModal');
  if (regModal) {
    regModal.style.setProperty("display", "flex", "important");
    regModal.style.setProperty("z-index", "999999999", "important");
    document.body.style.overflow = "hidden";
    updateTicketPrice();
  }
}

function closeRegisterModal() {
  const regModal = document.getElementById('registerModal');
  if (regModal) regModal.style.setProperty("display", "none", "important");
  document.body.style.overflow = "auto";
}

function openDownloadModal(e) {
  if (e) {
    if (e.preventDefault) e.preventDefault();
    if (e.stopPropagation) e.stopPropagation();
  }

  const dlModal = document.getElementById('downloadModal');
  if (dlModal) {
    dlModal.style.setProperty("display", "flex", "important");
    dlModal.style.setProperty("z-index", "999999999", "important");
    const resBox = document.getElementById('portalResult');
    const notFound = document.getElementById('portalNotFound');
    const query = document.getElementById('searchQuery');
    if (resBox) resBox.style.display = 'none';
    if (notFound) notFound.style.display = 'none';
    if (query) query.value = '';
    document.body.style.overflow = "hidden";
  }
}

function closeDownloadModal() {
  const dlModal = document.getElementById('downloadModal');
  if (dlModal) dlModal.style.setProperty("display", "none", "important");
  document.body.style.overflow = "auto";
}

function openAdminModal(e) {
  if (e) {
    if (e.preventDefault) e.preventDefault();
    if (e.stopPropagation) e.stopPropagation();
  }

  const modal = document.getElementById('adminModal');
  if (modal) {
    modal.style.setProperty("display", "flex", "important");
    modal.style.setProperty("z-index", "9999999999", "important");
    document.body.style.overflow = "hidden";
  }
}

function closeAdminModal() {
  const modal = document.getElementById('adminModal');
  if (modal) modal.style.setProperty("display", "none", "important");
  document.body.style.overflow = "auto";
}

function closeAdminDashboard() {
  const dashboard = document.getElementById('adminDashboard');
  if (dashboard) dashboard.style.setProperty("display", "none", "important");
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
    if (submitBtn) {
      submitBtn.innerText = "लॉगिन करें";
      submitBtn.disabled = false;
    }

    if (data && data.status === "success") {
      sessionStorage.setItem("admin_auth_token", data.token);
      if (document.getElementById('adminUser')) document.getElementById('adminUser').value = '';
      if (document.getElementById('adminPass')) document.getElementById('adminPass').value = '';
      
      closeAdminModal();
      
      const dashboard = document.getElementById('adminDashboard');
      if (dashboard) {
        dashboard.style.setProperty('display', 'flex', 'important');
      }

      checkGlobalRegistrationStatus();
      loadAdminStats();
    } else {
      if (loginError) {
        loginError.innerText = "❌ अमान्य यूज़रनेम/मोबाइल या पासवर्ड!";
        loginError.style.display = 'block';
      }
    }
  };

  const s = document.createElement('script');
  s.src = `${WEB_APP_URL}?action=adminLogin&user=${encodeURIComponent(userInput)}&pass=${encodeURIComponent(passInput)}&callback=${callbackName}&t=${Date.now()}`;
  document.body.appendChild(s);
}

window.addEventListener('click', function(event) {
  ['registerModal', 'adminModal', 'adminDashboard', 'volunteerScanModal', 'downloadModal', 'policyModal'].forEach(id => {
    const el = document.getElementById(id);
    if (el && event.target === el) {
      el.style.setProperty("display", "none", "important");
      document.body.style.overflow = "auto";
      if (id === 'volunteerScanModal') stopCamera();
    }
  });
});

// -------------------------------------------------------------------
// 11. GUESTS, POLICIES & NOTIFY
// -------------------------------------------------------------------
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

function initFaq() {
  const faqButtons = document.querySelectorAll(".faq-question");
  faqButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      btn.parentElement.classList.toggle("active");
    });
  });
}

function removeSplashScreen() {
  const splash = document.getElementById("introSplash");
  if (splash && !splash.classList.contains("hide-splash")) {
    splash.classList.add("hide-splash");
    setTimeout(() => { splash.style.display = "none"; }, 800);
  }
}

const POLICIES_DATA = {
  privacy: {
    title: "गोपनीयता नीति (Privacy Policy)",
    content: `<p><strong>1. सूचना संग्रहण:</strong> अभिव्यक्ति काव्यपीठ पंजीकरण के दौरान आवश्यक विवरण ही संकलित करता है।</p><p><strong>2. डेटा सुरक्षा:</strong> डेटा पूर्णतः सुरक्षित रखा जाता है।</p>`
  },
  terms: {
    title: "नियम एवं शर्तें (Terms & Conditions)",
    content: `<p><strong>1. प्रवेश:</strong> कार्यक्रम स्थल पर डिजिटल ई-पास क्यूआर सत्यापन अनिवार्य है।</p>`
  },
  refund: {
    title: "रिफंड एवं निरस्तीकरण नीति (Refund Policy)",
    content: `<p><strong>1. श्रोता पास:</strong> निःशुल्क है।</p><p><strong>2. प्रस्तुतकर्ता स्लॉट:</strong> कार्यक्रम रद्द होने की स्थिति में शुल्क वापस किया जाएगा।</p>`
  }
};

function openPolicyModal(type) {
  const modal = document.getElementById('policyModal');
  const title = document.getElementById('policyTitle');
  const content = document.getElementById('policyContent');

  if (POLICIES_DATA[type] && modal) {
    if (title) title.innerText = POLICIES_DATA[type].title;
    if (content) content.innerHTML = POLICIES_DATA[type].content;
    modal.style.setProperty("display", "flex", "important");
  }
}

function closePolicyModal() {
  const modal = document.getElementById('policyModal');
  if (modal) modal.style.setProperty("display", "none", "important");
}

function openNotifyModal() {
  const modal = document.getElementById('notifyMeModal');
  if (modal) modal.style.setProperty('display', 'flex', 'important');
}

function closeNotifyModal() {
  const modal = document.getElementById('notifyMeModal');
  if (modal) modal.style.setProperty('display', 'none', 'important');
}

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
    btn.innerText = "सूचना हेतु पंजीकृत करें";
    btn.disabled = false;
    document.getElementById('notifyForm').reset();
    closeNotifyModal();
    alert(`धन्यवाद ${name} जी! विवरण सुरक्षित कर लिया गया है।`);
  };

  const scriptTag = document.createElement('script');
  scriptTag.src = `${WEB_APP_URL}?action=saveNotification&name=${encodeURIComponent(name)}&contact=${encodeURIComponent(contact)}&callback=${callbackName}&t=${Date.now()}`;
  document.body.appendChild(scriptTag);
}

document.addEventListener("DOMContentLoaded", () => {
  injectDynamicEventData();
  updateTicketPrice();
  loadGuestsDirectly();
  loadSponsorsDirectly();
  initFaq();
  checkGlobalRegistrationStatus();

  const splash = document.getElementById("introSplash");
  if (splash) splash.addEventListener("click", removeSplashScreen);
  setTimeout(removeSplashScreen, 2500);
});