/* ============================================================
   CPD Business Directory - Application Logic
   Coraopolis Borough Police Department
   ============================================================ */

const CPD = (() => {
  // ---- Constants ----
  const STORAGE_KEY = 'cpd_business_directory';

  // Category-to-BusinessType reference (embedded for file:// compatibility)
  const CATEGORY_REF_DATA = [
    { category: 'Retail', businessTypes: ['Convenience Store','Clothing Store','Hardware Store','Florist','Gift Shop','Jewelry Store','Thrift Store','Vape/Smoke Shop','Dollar Store','Grocery Store','Furniture Store','Electronics Store','Sporting Goods','Antiques','General Retail'] },
    { category: 'Food and Beverage', businessTypes: ['Restaurant','Bar/Tavern','Café/Coffee Shop','Bakery','Pizza Shop','Caterer','Deli/Sub Shop','Ice Cream/Frozen Treats','Food Truck','Brewery/Distillery','Fast Food','Banquet Hall','General Food Service'] },
    { category: 'Health and Medical', businessTypes: ['Physician/Doctor','Dentist','Pharmacy','Chiropractor','Clinic/Urgent Care','Hospital','Optometrist/Vision','Physical Therapy','Mental Health/Counseling','Home Health Agency','Medical Equipment/Supply','Laboratory','General Medical'] },
    { category: 'Beauty and Personal Care', businessTypes: ['Hair Salon','Barbershop','Nail Salon','Spa/Massage','Tattoo/Piercing','Tanning Salon','General Beauty Services'] },
    { category: 'Automotive', businessTypes: ['Auto Repair/Mechanic','Body Shop/Collision','Towing Service','Tire Shop','Auto Dealer','Car Wash','Auto Parts','Gas Station','Oil Change/Quick Lube','General Automotive'] },
    { category: 'Professional Services', businessTypes: ['Attorney/Law Firm','Accountant/CPA','Architect','Consultant','Engineer','Marketing/Advertising','Staffing/Employment Agency','Notary','General Professional Services'] },
    { category: 'Financial Services', businessTypes: ['Bank','Credit Union','Insurance Agency','Tax Preparation','Financial Advisor','Mortgage/Lending','Check Cashing','General Financial Services'] },
    { category: 'Real Estate and Property', businessTypes: ['Real Estate Office','Property Management','Apartment Leasing','Surveyor','Title Company','General Real Estate'] },
    { category: 'Construction and Trades', businessTypes: ['Plumber','Electrician','HVAC','Roofing','Paving/Concrete','General Contractor','Painter','Carpenter/Woodwork','Masonry','Excavation','Handyman','General Construction/Trades'] },
    { category: 'Manufacturing and Industrial', businessTypes: ['Machine Shop','Fabricator/Welder','Printer/Print Shop','Wholesaler/Distributor','Industrial Supplier','Warehouse/Storage','General Manufacturing'] },
    { category: 'Transportation and Logistics', businessTypes: ['Trucking Company','Delivery Service','Warehousing/Logistics','Taxi/Rideshare','Shuttle Service','Moving Company','Courier','General Transportation'] },
    { category: 'Lodging and Travel', businessTypes: ['Hotel','Motel','Inn/Bed & Breakfast','Travel Agency','Short-Term Rental','General Lodging'] },
    { category: 'Education and Child Services', businessTypes: ['School','Daycare/Childcare','Tutoring Center','Training Center','After-School Program','Dance/Music School','General Education'] },
    { category: 'Arts, Entertainment, and Recreation', businessTypes: ['Gym/Fitness Center','Theater/Cinema','Gallery','Sports Facility','Event Venue','Bowling Alley','Arcade/Gaming','Park/Recreation Center','General Entertainment'] },
    { category: 'Religious and Nonprofit', businessTypes: ['Church','Ministry','Charity/Foundation','Community Organization','Fraternal Organization','General Nonprofit'] },
    { category: 'Public and Community Services', businessTypes: ['Utility Provider','Postal/Shipping','Social Services','Civic/Government Office','Library','General Public Services'] },
    { category: 'Technology and Communications', businessTypes: ['Telecom Provider','IT Services','Computer Repair','Software/Web Services','Data/Cloud Services','General Technology'] },
    { category: 'Agriculture and Environmental', businessTypes: ['Landscaping','Nursery/Garden Center','Pest Control','Waste Services','Recycling','Tree Service','General Environmental'] },
    { category: 'Pet and Animal Services', businessTypes: ['Veterinarian','Pet Groomer','Kennel/Boarding','Pet Supply Store','Dog Trainer','General Pet Services'] },
    { category: 'Other Services', businessTypes: ['Repair Service','Laundromat/Dry Cleaner','Tailor/Alterations','Locksmith','Cleaning Service','Funeral Home','Storage Facility','Other'] }
  ];
  let categoryRef = CATEGORY_REF_DATA;

  // Field map: form element id -> JSON key
  const FORM_FIELDS = {
    fBusinessName: 'businessName',
    fCategory: 'category',
    fBusinessType: 'businessType',
    fAddress: 'address',
    fSuiteUnitFloor: 'suiteUnitFloor',
    fMailingAddress: 'mailingAddress',
    fCity: 'city',
    fState: 'state',
    fZip: 'zip',
    fPhone: 'phone',
    fEmail: 'email',
    fWebsite: 'website',
    fHours: 'hoursOfOperation',
    fOwnerName: 'ownerName',
    fOwnerPhone: 'ownerPhone',
    fOwnerEmail: 'ownerEmail',
    fOnSiteManagerName: 'onSiteManagerName',
    fOnSiteManagerPhone: 'onSiteManagerPhone',
    fOnSiteManagerEmail: 'onSiteManagerEmail',
    fPropertyOwner: 'propertyOwner',
    fPropertyMgmtPhone: 'propertyMgmtPhone',
    fKey1Name: 'keyHolder1Name',
    fKey1Phone: 'keyHolder1Phone',
    fKey2Name: 'keyHolder2Name',
    fKey2Phone: 'keyHolder2Phone',
    fKey3Name: 'keyHolder3Name',
    fKey3Phone: 'keyHolder3Phone',
    fAlarmPresent: 'alarmPresent',
    fAlarmType: 'alarmType',
    fAlarmCompany: 'alarmCompany',
    fAlarmPhone: 'alarmPhone',
    fSecurityCameras: 'securityCameras',
    fCameraCoverage: 'cameraCoverage',
    fVideoRetention: 'videoRetention',
    fVideoContactName: 'videoContactName',
    fVideoContactPhone: 'videoContactPhone',
    fRearDoorsAccess: 'rearDoorsAccess',
    fGateAccessNotes: 'gateAccessNotes',
    fHazardousMaterials: 'hazardousMaterials',
    fGuardDog: 'guardDog',
    fSpecialConcerns: 'specialConcerns',
    fCertName: 'certName',
    fCertTitle: 'certTitle',
    fCertDate: 'certDate',
    fNotes: 'notes',
    fFollowUpNotes: 'followUpNotes',
    fStatus: 'status'
  };

  let currentMode = 'directory';
  let businesses = [];
  let sortField = 'businessName';
  let sortDir = 'asc';
  let currentView = 'tiles'; // 'tiles' or 'list'
  let contactsView = 'tiles';

  // ---- IIS Shared Data Layer ----
  // Reads: GET from ASP endpoints (returns shared server data)
  // Writes: POST to ASP endpoints (persists to server JSON files)
  // localStorage is a fast local cache; server is the source of truth.

  var API_BASE = '../api/';
  var serverWritable = true; // set false if ASP POST fails (fallback to local-only)

  // ---- Windows Auth Identity ----
  // Populated by fetchWindowsUser() on every page init.
  var currentUser = {
    username:     '',   // just the samAccountName, e.g. "jsmith"
    displayName:  '',   // DOMAIN\username
    isSupervisor: false,
    ip:           ''
  };

  // Inactivity timeout in milliseconds (20 minutes).
  var INACTIVITY_TIMEOUT_MS = 20 * 60 * 1000;
  var inactivityTimer = null;

  function fetchSharedData(callback) {
    var xhr = new XMLHttpRequest();
    xhr.timeout = 5000;
    xhr.open('GET', API_BASE + 'businesses.asp?_=' + Date.now(), true);
    xhr.onload = function() {
      if (xhr.status === 200) {
        try {
          var resp = JSON.parse(xhr.responseText);
          if (resp.ok && Array.isArray(resp.businesses) && resp.businesses.length > 0) {
            businesses = resp.businesses;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(businesses));
            if (callback) callback(true);
            return;
          }
        } catch(e) {}
      }
      if (callback) callback(false);
    };
    xhr.onerror = xhr.ontimeout = function() { if (callback) callback(false); };
    xhr.send();
  }

  function fetchSharedAuditLog(callback) {
    var xhr = new XMLHttpRequest();
    xhr.timeout = 5000;
    xhr.open('GET', API_BASE + 'audit.asp?_=' + Date.now(), true);
    xhr.onload = function() {
      if (xhr.status === 403) {
        // Non-supervisor: audit log is restricted. Fail silently — the
        // Audit Log tab is already hidden for this user; no action needed.
        if (callback) callback(null);
        return;
      }
      if (xhr.status === 200) {
        try {
          var resp = JSON.parse(xhr.responseText);
          if (resp.ok && Array.isArray(resp.log)) {
            localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(resp.log));
            if (callback) callback(resp.log);
            return;
          }
        } catch(e) {}
      }
      if (callback) callback(null);
    };
    xhr.onerror = xhr.ontimeout = function() { if (callback) callback(null); };
    xhr.send();
  }

  function postToServer(endpoint, data, callback) {
    var xhr = new XMLHttpRequest();
    xhr.timeout = 8000;
    xhr.open('POST', API_BASE + endpoint, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = function() {
      if (xhr.status === 200) {
        try {
          var resp = JSON.parse(xhr.responseText);
          if (resp.ok) { serverWritable = true; if (callback) callback(true); return; }
        } catch(e) {}
      }
      serverWritable = false;
      if (callback) callback(false);
    };
    xhr.onerror = xhr.ontimeout = function() {
      serverWritable = false;
      if (callback) callback(false);
    };
    xhr.send(JSON.stringify(data));
  }

  function updateSyncStatus() {
    var el = document.getElementById('syncIndicator');
    if (!el) {
      var header = document.querySelector('.site-header');
      if (!header) return;
      el = document.createElement('div');
      el.id = 'syncIndicator';
      el.className = 'sync-indicator';
      header.appendChild(el);
    }
    if (serverWritable) {
      el.className = 'sync-indicator sync-connected';
      var refreshBtn = '<button class="sync-refresh-btn" id="btnSyncRefresh" title="Refresh now">&#8635;</button>';
      var autoLabel = pollTimer ? ' Auto' : '';
      el.innerHTML = '<span class="sync-dot"></span> Synced' + autoLabel + ' ' + refreshBtn;
      el.title = 'Connected to server. Auto-refreshes every ' + POLL_INTERVAL + 's. Click refresh for immediate update.';
      // Bind refresh button
      var btn = document.getElementById('btnSyncRefresh');
      if (btn) {
        btn.onclick = function(e) {
          e.stopPropagation();
          manualRefresh();
        };
      }
    } else {
      el.className = 'sync-indicator sync-local';
      el.innerHTML = '<span class="sync-dot"></span> Local Only <button class="sync-refresh-btn" id="btnSyncRefresh" title="Retry server connection">&#8635;</button>';
      el.title = 'Server write failed — changes saved locally only. Click refresh to retry.';
      var btn = document.getElementById('btnSyncRefresh');
      if (btn) {
        btn.onclick = function(e) {
          e.stopPropagation();
          manualRefresh();
        };
      }
    }
  }

  // ---- Auto-Refresh Polling ----
  // Polls the server every POLL_INTERVAL seconds for updated data.
  // Only re-renders if the data actually changed (hash comparison).
  // Pauses while admin form fields have focus to avoid disrupting edits.

  var POLL_INTERVAL = 45; // seconds between polls
  var pollTimer = null;
  var lastDataHash = '';
  var lastAuditHash = '';
  var pollPaused = false;

  function simpleHash(str) {
    // DJB2 hash — fast, good enough for change detection
    var hash = 5381;
    for (var i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) + str.charCodeAt(i);
      hash = hash & hash; // Convert to 32-bit int
    }
    return hash.toString(36);
  }

  function startAutoRefresh() {
    // Snapshot current data hash
    lastDataHash = simpleHash(JSON.stringify(businesses));
    var auditRaw = localStorage.getItem(AUDIT_STORAGE_KEY) || '[]';
    lastAuditHash = simpleHash(auditRaw);

    // Pause polling when form inputs are focused (admin editing)
    document.addEventListener('focusin', function(e) {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT')) {
        pollPaused = true;
      }
    });
    document.addEventListener('focusout', function(e) {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT')) {
        // Small delay so rapid tab-between-fields doesn't trigger a poll
        setTimeout(function() {
          if (!document.activeElement || (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA' && document.activeElement.tagName !== 'SELECT')) {
            pollPaused = false;
          }
        }, 500);
      }
    });

    // Start the interval
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(pollForUpdates, POLL_INTERVAL * 1000);

    // Update sync indicator with refresh info
    updateSyncStatus();
  }

  function stopAutoRefresh() {
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
  }

  function pollForUpdates() {
    if (pollPaused) return;

    fetchSharedData(function(ok) {
      if (ok) {
        var newHash = simpleHash(JSON.stringify(businesses));
        if (newHash !== lastDataHash) {
          lastDataHash = newHash;
          refreshCurrentView();
          showToast('Data updated from server.', 'info');
        }
      }
      updateSyncStatus();
    });

    fetchSharedAuditLog(function(log) {
      if (log) {
        var newAuditHash = simpleHash(JSON.stringify(log));
        if (newAuditHash !== lastAuditHash) {
          lastAuditHash = newAuditHash;
          if (currentMode === 'admin') renderAuditLog();
          else if (currentMode === 'dashboard') renderDashAuditFeed();
        }
      }
    });
  }

  function manualRefresh() {
    showToast('Refreshing...', 'info');
    fetchSharedData(function(ok) {
      if (ok) {
        lastDataHash = simpleHash(JSON.stringify(businesses));
        refreshCurrentView();
        showToast('Data refreshed from server.', 'success');
      } else {
        showToast('Could not reach server.', 'warning');
      }
      updateSyncStatus();
    });
    fetchSharedAuditLog(function(log) {
      if (log) {
        lastAuditHash = simpleHash(JSON.stringify(log));
        if (currentMode === 'admin') renderAuditLog();
        else if (currentMode === 'dashboard') renderDashAuditFeed();
      }
    });
  }

  function refreshCurrentView() {
    if (currentMode === 'directory') {
      populateCategoryFilter();
      renderDirectory();
    } else if (currentMode === 'admin') {
      populateEditSelector();
      renderTrackingTable();
      renderAdminStats();
    } else if (currentMode === 'dashboard') {
      renderDashboard();
    }
  }

  // ---- Session & Audit Trail ----

  const AUDIT_STORAGE_KEY = 'cpd_audit_log';
  const SESSION_KEY = 'cpd_session_user'; // kept for fallback only

  function getSessionUser() {
    // Always prefer the Windows-authenticated identity.
    return currentUser.username || sessionStorage.getItem(SESSION_KEY) || 'Unknown';
  }

  function loadAuditLog() {
    var raw = localStorage.getItem(AUDIT_STORAGE_KEY);
    if (raw) {
      try { return JSON.parse(raw); } catch (e) { return []; }
    }
    return [];
  }

  function saveAuditLog(log) {
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(log));
    // Update hash so auto-refresh doesn't re-trigger on our own save
    lastAuditHash = simpleHash(JSON.stringify(log));
    // Push audit log to server
    postToServer('audit.asp', { log: log });
  }

  function logAudit(action, businessId, businessName, details) {
    var log = loadAuditLog();
    log.unshift({
      timestamp:    new Date().toISOString(),
      user:         getSessionUser(),
      action:       action,
      businessId:   businessId   || '',
      businessName: businessName || '',
      details:      details      || '',
      ip:           currentUser.ip || ''
    });
    // Keep max 2000 entries
    if (log.length > 2000) log = log.slice(0, 2000);
    saveAuditLog(log);
  }

  // logAuditAndSync: used during beforeunload/inactivity where we must push
  // to the server immediately without relying on the normal saveAuditLog XHR.
  function logAuditAndSync(action, businessId, businessName, details) {
    var log = loadAuditLog();
    log.unshift({
      timestamp:    new Date().toISOString(),
      user:         getSessionUser(),
      action:       action,
      businessId:   businessId   || '',
      businessName: businessName || '',
      details:      details      || '',
      ip:           currentUser.ip || ''
    });
    if (log.length > 2000) log = log.slice(0, 2000);
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(log));
    lastAuditHash = simpleHash(JSON.stringify(log));

    // sendBeacon is designed for reliable delivery during page unload.
    var payload = JSON.stringify({ log: log });
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      try {
        var blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon(API_BASE + 'audit.asp', blob);
        return;
      } catch(e) {}
    }
    // Synchronous XHR fallback (deprecated but functional).
    try {
      var xhr = new XMLHttpRequest();
      xhr.open('POST', API_BASE + 'audit.asp', false);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(payload);
    } catch(e) {}
  }

  // fetchWindowsUser: calls /api/user.asp to get the IIS-authenticated
  // Windows identity and supervisor status. Callback fires when complete.
  function fetchWindowsUser(callback) {
    var xhr = new XMLHttpRequest();
    xhr.timeout = 6000;
    xhr.open('GET', API_BASE + 'user.asp?_=' + Date.now(), true);
    xhr.onload = function() {
      if (xhr.status === 200) {
        try {
          var resp = JSON.parse(xhr.responseText);
          if (resp.ok) {
            currentUser.username     = resp.username     || '';
            currentUser.displayName  = resp.displayName  || '';
            currentUser.isSupervisor = !!resp.isSupervisor;
            currentUser.ip           = resp.ip            || '';
          }
        } catch(e) {}
      }
      if (callback) callback();
    };
    xhr.onerror = xhr.ontimeout = function() {
      // Graceful degradation: mark as unknown, non-supervisor.
      currentUser.username    = 'Unknown';
      currentUser.displayName = 'Unknown';
      if (callback) callback();
    };
    xhr.send();
  }

  function updateSessionDisplay() {
    var display = document.getElementById('sessionUserDisplay');
    var bar     = document.getElementById('sessionUserBar');
    // Show full DOMAIN\username in the session bar.
    var label = currentUser.displayName || currentUser.username || '--';
    if (display) display.textContent = label;
    if (bar)     bar.style.display = (label && label !== '--') ? 'flex' : 'none';
    // Remove "Change" button — identity is locked to Windows Auth.
    var btnChange = document.getElementById('btnChangeUser');
    if (btnChange) btnChange.style.display = 'none';
  }

  // applyAuditTabVisibility: show or hide the Audit Log tab based on
  // whether the current user is in the supervisor AD group.
  function applyAuditTabVisibility() {
    var tabBtn     = document.getElementById('auditLogTabBtn');
    var tabContent = document.getElementById('tab-auditLog');
    if (tabBtn) {
      tabBtn.style.display = currentUser.isSupervisor ? '' : 'none';
    }
    if (tabContent && !currentUser.isSupervisor) {
      // Guard: hide content in case someone navigates to #auditLog directly.
      tabContent.style.display = 'none';
    }
  }

  // bindLogoffEvents: attaches inactivity timer and beforeunload handler.
  // Call once per page after the Windows user has been identified.
  function bindLogoffEvents(pageName) {
    // Reset inactivity timer on any user interaction.
    function resetTimer() {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(function() {
        logAuditAndSync('logoff', '', '', pageName + ' — session timed out after 20 minutes of inactivity');
      }, INACTIVITY_TIMEOUT_MS);
    }

    ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach(function(evt) {
      document.addEventListener(evt, resetTimer, { passive: true });
    });
    resetTimer();

    // Log logoff when the tab/browser is closed.
    window.addEventListener('beforeunload', function() {
      clearTimeout(inactivityTimer);
      logAuditAndSync('logoff', '', '', pageName + ' — user closed browser/tab');
    });
  }

  function renderAuditLog() {
    var tbody = document.getElementById('auditTableBody');
    var countEl = document.getElementById('auditCount');
    if (!tbody) return;

    var log = loadAuditLog();
    var query = (document.getElementById('auditSearch')?.value || '').toLowerCase().trim();
    var actionFilter = document.getElementById('auditActionFilter')?.value || '';
    var userFilter = document.getElementById('auditUserFilter')?.value || '';
    var dateFilter = document.getElementById('auditDateFilter')?.value || '';

    var now = Date.now();
    var filtered = log.filter(function(entry) {
      if (actionFilter && entry.action !== actionFilter) return false;
      if (userFilter && entry.user !== userFilter) return false;
      if (dateFilter) {
        var entryTime = new Date(entry.timestamp).getTime();
        if (dateFilter === 'today') {
          var todayStart = new Date(); todayStart.setHours(0,0,0,0);
          if (entryTime < todayStart.getTime()) return false;
        } else if (dateFilter === '7days') {
          if (now - entryTime > 7 * 86400000) return false;
        } else if (dateFilter === '30days') {
          if (now - entryTime > 30 * 86400000) return false;
        }
      }
      if (query) {
        var searchStr = (entry.user + ' ' + entry.action + ' ' + entry.businessName + ' ' + entry.details).toLowerCase();
        if (searchStr.indexOf(query) === -1) return false;
      }
      return true;
    });

    if (countEl) countEl.textContent = filtered.length + ' of ' + log.length + ' entries';

    // Populate user filter dropdown
    var userSelect = document.getElementById('auditUserFilter');
    if (userSelect) {
      var currentVal = userSelect.value;
      var users = [...new Set(log.map(function(e) { return e.user; }))].sort();
      while (userSelect.options.length > 1) userSelect.remove(1);
      users.forEach(function(u) {
        var opt = document.createElement('option');
        opt.value = u;
        opt.textContent = u;
        userSelect.appendChild(opt);
      });
      userSelect.value = currentVal;
    }

    var actionClasses = {
      login:     'audit-action-login',
      logoff:    'audit-action-logoff',
      page_view: 'audit-action-page_view',
      view:      'audit-action-view',
      add:       'audit-action-add',
      edit:      'audit-action-edit',
      'delete':  'audit-action-delete',
      'import':  'audit-action-import'
    };

    tbody.innerHTML = filtered.slice(0, 500).map(function(entry) {
      var cls = actionClasses[entry.action] || '';
      return '<tr>' +
        '<td style="white-space:nowrap;">' + formatDate(entry.timestamp) + '</td>' +
        '<td>' + escHtml(entry.user) + '</td>' +
        '<td><span class="audit-action ' + cls + '">' + escHtml(entry.action) + '</span></td>' +
        '<td>' + escHtml(entry.businessName) + '</td>' +
        '<td style="max-width:260px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="' + escHtml(entry.details) + '">' + escHtml(entry.details) + '</td>' +
        '<td style="white-space:nowrap; color:var(--cpd-silver); font-size:0.78rem;">' + escHtml(entry.ip || '') + '</td>' +
        '</tr>';
    }).join('');
  }

  function exportAuditLog() {
    var log = loadAuditLog();
    var csvHeaders = ['Timestamp','User','Action','Business ID','Business Name','Details','IP Address'];
    var csvRows = [csvHeaders.join(',')];
    log.forEach(function(entry) {
      csvRows.push([
        '"' + (entry.timestamp || '') + '"',
        '"' + (entry.user || '').replace(/"/g,'""') + '"',
        '"' + (entry.action || '') + '"',
        '"' + (entry.businessId || '') + '"',
        '"' + (entry.businessName || '').replace(/"/g,'""') + '"',
        '"' + (entry.details || '').replace(/"/g,'""') + '"',
        '"' + (entry.ip || '') + '"'
      ].join(','));
    });
    var blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'cpd_audit_log_' + new Date().toISOString().slice(0,10) + '.csv';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported ' + log.length + ' audit entries.', 'success');
  }

  function bindAuditEvents() {
    var debounce;
    document.getElementById('auditSearch')?.addEventListener('input', function() {
      clearTimeout(debounce);
      debounce = setTimeout(renderAuditLog, 200);
    });
    document.getElementById('auditActionFilter')?.addEventListener('change', renderAuditLog);
    document.getElementById('auditUserFilter')?.addEventListener('change', renderAuditLog);
    document.getElementById('auditDateFilter')?.addEventListener('change', renderAuditLog);
    document.getElementById('btnExportAudit')?.addEventListener('click', exportAuditLog);
    document.getElementById('btnClearAudit')?.addEventListener('click', async function() {
      var confirmed = await showConfirm('Clear Audit Log', 'This will permanently delete all audit log entries. Continue?');
      if (!confirmed) return;
      saveAuditLog([]);
      renderAuditLog();
      showToast('Audit log cleared.', 'warning');
    });
  }

  // ---- Data Layer ----

  function loadData() {
    // Always load from localStorage first (instant)
    var raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try { businesses = JSON.parse(raw); } catch (e) { businesses = []; }
    } else {
      businesses = [];
    }
    return businesses;
  }

  function saveData() {
    // Save to localStorage (instant local cache)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(businesses));
    // Update hash so auto-refresh doesn't re-trigger on our own save
    lastDataHash = simpleHash(JSON.stringify(businesses));
    // Push to server so all PCs on the network see the update
    postToServer('businesses.asp', { businesses: businesses }, function(ok) {
      updateSyncStatus();
      if (!ok) { showToast('Warning: Changes saved locally only. Server write failed.', 'warning'); }
    });
  }

  function generateId() {
    const maxNum = businesses.reduce((max, b) => {
      const match = b.id && b.id.match(/^biz-(\d+)$/);
      return match ? Math.max(max, parseInt(match[1], 10)) : max;
    }, 0);
    return 'biz-' + String(maxNum + 1).padStart(3, '0');
  }

  function findBusiness(id) {
    return businesses.find(b => b.id === id);
  }

  function formatDate(dateStr) {
    if (!dateStr) return '--';
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString('en-US', {
      month: '2-digit', day: '2-digit', year: 'numeric'
    }) + ' ' + d.toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', hour12: true
    });
  }

  function formatDateShort(dateStr) {
    if (!dateStr) return '--';
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString('en-US', {
      month: '2-digit', day: '2-digit', year: 'numeric'
    });
  }

  function escHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ---- Categories Reference ----

  function loadCategories() {
    categoryRef = CATEGORY_REF_DATA;
    return categoryRef;
  }

  function getCategoryNames() {
    return categoryRef.map(c => c.category);
  }

  function getBusinessTypesForCategory(categoryName) {
    var cat = categoryRef.find(c => c.category === categoryName);
    return cat ? cat.businessTypes : [];
  }

  function populateCategoryDropdown(selectId) {
    var sel = document.getElementById(selectId);
    if (!sel) return;
    // Keep first option
    while (sel.options.length > 1) sel.remove(1);
    getCategoryNames().forEach(name => {
      var opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      sel.appendChild(opt);
    });
  }

  function populateBusinessTypeDropdown(categoryName) {
    var sel = document.getElementById('fBusinessType');
    if (!sel) return;
    while (sel.options.length > 1) sel.remove(1);
    if (!categoryName) {
      sel.options[0].textContent = '-- Select Category first --';
      return;
    }
    sel.options[0].textContent = '-- Select Type --';
    var types = getBusinessTypesForCategory(categoryName);
    types.forEach(t => {
      var opt = document.createElement('option');
      opt.value = t;
      opt.textContent = t;
      sel.appendChild(opt);
    });
  }

  function formatTags(tags) {
    if (!tags) return '';
    if (Array.isArray(tags)) return tags.join(', ');
    return String(tags);
  }

  function parseTags(str) {
    if (!str) return [];
    if (Array.isArray(str)) return str;
    return str.split(',').map(s => s.trim()).filter(Boolean);
  }

  // ---- PDF Lookup ----

  function getPdfPath(businessName) {
    if (!businessName) return '';
    // 1. Exact match in the map
    if (typeof CPD_PDF_MAP !== 'undefined' && CPD_PDF_MAP[businessName]) {
      return CPD_PDF_MAP[businessName];
    }
    // 2. Auto-detect: try common path patterns by naming convention
    //    Generates candidate paths the PDF might live at
    var baseName = businessName.trim();
    var candidates = [
      '../data/intake-forms/' + baseName + '.pdf',
      '../data/intake-forms/completed/' + baseName + '.pdf'
    ];
    // Also try without common prefixes/suffixes
    var stripped = baseName
      .replace(/^The\s+/i, '')
      .replace(/,?\s*(Inc\.?|LLC|PC|Ltd\.?|Corp\.?)$/i, '')
      .trim();
    if (stripped !== baseName) {
      candidates.push('../data/intake-forms/' + stripped + '.pdf');
      candidates.push('../data/intake-forms/completed/' + stripped + '.pdf');
    }
    // Check if the PDF map has a case-insensitive or partial match
    if (typeof CPD_PDF_MAP !== 'undefined') {
      var nameLC = baseName.toLowerCase();
      var strippedLC = stripped.toLowerCase();
      var keys = Object.keys(CPD_PDF_MAP);
      for (var i = 0; i < keys.length; i++) {
        var kLC = keys[i].toLowerCase();
        if (kLC === nameLC || kLC === strippedLC ||
            nameLC.indexOf(kLC) !== -1 || kLC.indexOf(nameLC) !== -1 ||
            strippedLC.indexOf(kLC) !== -1 || kLC.indexOf(strippedLC) !== -1) {
          return CPD_PDF_MAP[keys[i]];
        }
      }
    }
    // 3. Return best-guess path (file may or may not exist)
    return candidates[0];
  }

  // ---- Toast Notifications ----

  function showToast(message, type) {
    type = type || 'info';
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      toast.style.transition = '0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // ---- Confirm Dialog ----

  function showConfirm(title, message) {
    return new Promise(resolve => {
      const overlay = document.getElementById('confirmDialog');
      document.getElementById('confirmTitle').textContent = title;
      document.getElementById('confirmMessage').textContent = message;
      overlay.classList.add('active');
      const yesBtn = document.getElementById('confirmYes');
      const noBtn = document.getElementById('confirmNo');
      function cleanup() {
        overlay.classList.remove('active');
        yesBtn.removeEventListener('click', onYes);
        noBtn.removeEventListener('click', onNo);
      }
      function onYes() { cleanup(); resolve(true); }
      function onNo()  { cleanup(); resolve(false); }
      yesBtn.addEventListener('click', onYes);
      noBtn.addEventListener('click', onNo);
    });
  }

  // ===========================================================
  //  DIRECTORY PAGE
  // ===========================================================

  function initDirectory() {
    loadCategories();
    loadData();
    populateCategoryFilter();
    renderDirectory();
    bindDirectoryEvents();

    if (businesses.length === 0) {
      loadSeedData(true);
    }

    // Identify the Windows user, then log the page view and start logoff tracking.
    fetchWindowsUser(function() {
      updateSessionDisplay();
      logAudit('page_view', '', '', 'Viewed: Directory');
      bindLogoffEvents('Directory');
    });

    // Load shared data from IIS
    fetchSharedData(function(ok) {
      updateSyncStatus();
      if (ok) renderDirectory();
      startAutoRefresh();
    });
  }

  function populateCategoryFilter() {
    const sel = document.getElementById('categoryFilter');
    if (!sel) return;
    // Clear existing options except the first "All Categories"
    while (sel.options.length > 1) sel.remove(1);
    // Add all categories from reference table
    const catNames = getCategoryNames();
    catNames.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      sel.appendChild(opt);
    });
    // Add any categories in use that aren't in the reference (legacy data)
    const usedCats = [...new Set(businesses.map(b => b.category).filter(Boolean))];
    usedCats.forEach(cat => {
      if (!catNames.includes(cat)) {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        sel.appendChild(opt);
      }
    });
  }

  function getFilteredBusinesses() {
    const query = (document.getElementById('searchInput')?.value || '').toLowerCase().trim();
    const catFilter = document.getElementById('categoryFilter')?.value || '';
    const fuFilter = document.getElementById('followUpFilter')?.value || '';

    return businesses.filter(b => {
      const bCat = b.category || '';
      if (catFilter && bCat !== catFilter) return false;
      if (fuFilter === 'yes' && !b.followUpNeeded) return false;
      if (fuFilter === 'no' && b.followUpNeeded) return false;
      if (query) {
        const tagStr = Array.isArray(b.tags) ? b.tags.join(' ') : (b.tags || '');
        const searchable = [
          b.businessName, b.address, b.city, b.phone, b.email,
          b.ownerName, b.ownerPhone, b.category, b.businessType, tagStr, b.notes,
          b.emergencyContactName, b.onSiteManagerName,
          b.alarmCompany, b.keyHolder1Name, b.keyHolder2Name, b.keyHolder3Name,
          b.suiteUnitFloor
        ].map(v => (v || '').toLowerCase()).join(' ');
        return searchable.includes(query);
      }
      return true;
    });
  }

  function renderDirectory() {
    const grid = document.getElementById('businessGrid');
    const list = document.getElementById('businessList');
    const noResults = document.getElementById('noResults');
    const countEl = document.getElementById('resultCount');
    if (!grid || !list) return;

    const filtered = getFilteredBusinesses();
    filtered.sort((a, b) => (a.businessName || '').localeCompare(b.businessName || ''));

    // Update stats
    const totalEl = document.getElementById('statTotal');
    const catEl = document.getElementById('statCategories');
    const fuEl = document.getElementById('statFollowUp');
    if (totalEl) totalEl.textContent = businesses.length;
    if (catEl) catEl.textContent = new Set(businesses.map(b => b.category).filter(Boolean)).size;
    if (fuEl) fuEl.textContent = businesses.filter(b => b.followUpNeeded).length;
    if (countEl) countEl.textContent = filtered.length;

    if (filtered.length === 0) {
      grid.innerHTML = '';
      list.innerHTML = '';
      if (noResults) noResults.style.display = 'block';
      return;
    }
    if (noResults) noResults.style.display = 'none';

    // Render tiles view
    grid.innerHTML = filtered.map(b => {
      const addressParts = [b.address];
      if (b.suiteUnitFloor) addressParts[0] += ', ' + b.suiteUnitFloor;
      addressParts.push(b.city, b.state, b.zip);
      const addressLine = addressParts.filter(Boolean).join(', ');
      const bCat = b.category || '';
      const followUpBadge = b.followUpNeeded ? '<div class="follow-up-badge">Follow-Up</div>' : '';
      var catChip = bCat ? '<div class="biz-filter-chips"><span class="filter-chip cat-chip" data-search="' + escHtml(bCat) + '">' + escHtml(bCat) + '</span></div>' : '';
      var tagsHtml = '';
      if (Array.isArray(b.tags) && b.tags.length > 0) {
        tagsHtml = '<div class="biz-filter-chips">' +
          b.tags.map(t => '<span class="filter-chip tag-chip-btn" data-search="' + escHtml(t) + '">' + escHtml(t) + '</span>').join('') +
        '</div>';
      }
      var pdfPath = getPdfPath(b.businessName);
      var pdfBtn = pdfPath ? '<a href="' + encodeURI(pdfPath) + '" target="_blank" class="btn-pdf" title="Open original intake form PDF" onclick="event.stopPropagation();">Original PDF</a>' : '';
      return '<div class="business-card" data-id="' + b.id + '">' +
        followUpBadge +
        '<div class="card-header">' +
          '<div class="biz-name">' + escHtml(b.businessName || 'Unnamed') + '</div>' +
        '</div>' +
        (addressLine ? '<div class="biz-address">' + escHtml(addressLine) + '</div>' : '') +
        (b.phone ? '<div class="biz-phone">' + escHtml(b.phone) + '</div>' : '') +
        (b.ownerName ? '<div class="biz-owner">Owner: ' + escHtml(b.ownerName) + '</div>' : '') +
        catChip +
        tagsHtml +
        pdfBtn +
      '</div>';
    }).join('');

    // Render list view
    var listHtml = '<div class="list-row list-row-header">' +
      '<div>Business</div><div>Phone</div><div>Address</div><div>Owner</div><div>Follow-Up</div><div>PDF</div>' +
      '</div>';
    listHtml += filtered.map(b => {
      const addr = [b.address, b.city].filter(Boolean).join(', ');
      const bCat = b.category || '';
      var listCatTag = bCat ? '<span class="filter-chip cat-chip" data-search="' + escHtml(bCat) + '">' + escHtml(bCat) + '</span>' : '';
      var listTagsHtml = '';
      if (Array.isArray(b.tags) && b.tags.length > 0) {
        listTagsHtml = b.tags.slice(0, 4).map(t => '<span class="filter-chip tag-chip-btn" data-search="' + escHtml(t) + '">' + escHtml(t) + '</span>').join('') +
          (b.tags.length > 4 ? '<span class="filter-chip tag-chip-btn">+' + (b.tags.length - 4) + '</span>' : '');
      }
      var chipsRow = (listCatTag || listTagsHtml) ? '<div class="list-chips">' + listCatTag + listTagsHtml + '</div>' : '';
      var listPdf = getPdfPath(b.businessName);
      var listPdfBtn = listPdf ? '<a href="' + encodeURI(listPdf) + '" target="_blank" class="btn-pdf btn-pdf-sm" onclick="event.stopPropagation();">Original PDF</a>' : '';
      return '<div class="list-row" data-id="' + b.id + '">' +
        '<div class="list-name">' + escHtml(b.businessName || 'Unnamed') + chipsRow + '</div>' +
        '<div class="list-phone">' + escHtml(b.phone || '--') + '</div>' +
        '<div class="list-address">' + escHtml(addr || '--') + '</div>' +
        '<div class="list-owner">' + escHtml(b.ownerName || '--') + '</div>' +
        '<div class="list-follow-up ' + (b.followUpNeeded ? 'follow-up-yes' : 'follow-up-no') + '">' +
          (b.followUpNeeded ? 'YES' : 'No') + '</div>' +
        '<div class="list-pdf">' + listPdfBtn + '</div>' +
      '</div>';
    }).join('');
    list.innerHTML = listHtml;

    // Show correct view
    updateViewDisplay();
  }

  function updateViewDisplay() {
    const grid = document.getElementById('businessGrid');
    const list = document.getElementById('businessList');
    if (currentView === 'tiles') {
      grid.style.display = '';
      list.style.display = 'none';
    } else {
      grid.style.display = 'none';
      list.style.display = '';
    }
  }

  // ---- Detail Modal ----

  function showDetailModal(id) {
    const b = findBusiness(id);
    if (!b) return;
    const modal = document.getElementById('detailModal');
    document.getElementById('modalTitle').textContent = b.businessName || 'Business Details';

    const addrParts = [b.address];
    if (b.suiteUnitFloor) addrParts[0] = (addrParts[0] || '') + ', ' + b.suiteUnitFloor;
    addrParts.push(b.city, b.state, b.zip);
    const addressLine = addrParts.filter(Boolean).join(', ');

    const sections = [
      { title: 'Business Information', fields: [
        { label: 'Physical Address', value: addressLine },
        { label: 'Category', value: b.category },
        { label: 'Business Type', value: b.businessType },
        { label: 'Tags', value: formatTags(b.tags) },
        { label: 'Mailing Address', value: b.mailingAddress },
        { label: 'Main Phone', value: b.phone },
        { label: 'Main Email', value: b.email },
        { label: 'Website', value: b.website },
        { label: 'Business Hours', value: b.hoursOfOperation, fullWidth: true },
      ]},
      { title: 'Owner / Manager Information', fields: [
        { label: 'Owner Name', value: b.ownerName },
        { label: 'Owner Phone', value: b.ownerPhone },
        { label: 'Owner Email', value: b.ownerEmail },
        { label: '', value: '' },
        { label: 'On-Site Manager', value: b.onSiteManagerName },
        { label: 'Manager Phone', value: b.onSiteManagerPhone },
        { label: 'Manager Email', value: b.onSiteManagerEmail },
        { label: '', value: '' },
        { label: 'Property Owner / Mgmt Co.', value: b.propertyOwner },
        { label: 'Property Mgmt Phone', value: b.propertyMgmtPhone },
      ]},
      { title: 'Emergency Keyholders', fields: [
        { label: 'Keyholder 1', value: [b.keyHolder1Name, b.keyHolder1Phone].filter(Boolean).join(' - ') },
        { label: 'Keyholder 2', value: [b.keyHolder2Name, b.keyHolder2Phone].filter(Boolean).join(' - ') },
        { label: 'Keyholder 3', value: [b.keyHolder3Name, b.keyHolder3Phone].filter(Boolean).join(' - ') },
      ]},
      { title: 'Alarm & Security Systems', fields: [
        { label: 'Alarm Present', value: b.alarmPresent },
        { label: 'Alarm Type', value: b.alarmType },
        { label: 'Alarm Company', value: b.alarmCompany },
        { label: 'Alarm 24/7 Phone', value: b.alarmPhone },
        { label: 'Security Cameras', value: b.securityCameras },
        { label: 'Camera Coverage', value: b.cameraCoverage },
        { label: 'Video Retention', value: b.videoRetention },
        { label: 'Video Contact', value: [b.videoContactName, b.videoContactPhone].filter(Boolean).join(' - ') },
      ]},
      { title: 'Site & Hazard Information', fields: [
        { label: 'Rear Doors / Alt. Access', value: b.rearDoorsAccess, fullWidth: true },
        { label: 'Gate / Lot Access Notes', value: b.gateAccessNotes, fullWidth: true },
        { label: 'Hazardous Materials', value: b.hazardousMaterials, fullWidth: true },
        { label: 'Guard Dog / Security Animal', value: b.guardDog },
        { label: 'Special Response Concerns', value: b.specialConcerns, fullWidth: true },
      ]},
      { title: 'Certification', fields: [
        { label: 'Printed Name', value: b.certName },
        { label: 'Title', value: b.certTitle },
        { label: 'Date Signed', value: b.certDate },
      ]},
      { title: 'Notes & Status', fields: [
        { label: 'Status', value: b.status ? b.status.charAt(0).toUpperCase() + b.status.slice(1) : '' },
        { label: 'Follow-Up Needed', value: b.followUpNeeded ? 'YES' : 'No' },
        { label: 'Follow-Up Notes', value: b.followUpNotes, fullWidth: true },
        { label: 'General Notes', value: b.notes, fullWidth: true },
      ]},
    ];

    var html = '';
    sections.forEach(sec => {
      html += '<div class="detail-section-title">' + sec.title + '</div>';
      sec.fields.forEach(f => {
        if (!f.label && !f.value) return; // skip spacers with no label
        var cls = f.fullWidth ? ' full-width' : '';
        var val = f.value
          ? '<div class="detail-value">' + escHtml(f.value) + '</div>'
          : '<div class="detail-value empty">Not provided</div>';
        html += '<div class="detail-group' + cls + '">' +
          '<div class="detail-label">' + f.label + '</div>' + val + '</div>';
      });
    });

    document.getElementById('modalDetails').innerHTML = html;

    document.getElementById('modalAdminInfo').innerHTML =
      '<span><span class="label">Created:</span> ' + formatDate(b.createdDate) + '</span>' +
      '<span><span class="label">Created By:</span> ' + escHtml(b.createdBy || '--') + '</span>' +
      '<span><span class="label">Updated:</span> ' + formatDate(b.updatedDate) + '</span>' +
      '<span><span class="label">Updated By:</span> ' + escHtml(b.updatedBy || '--') + '</span>';

    var editLink = document.getElementById('modalEditLink');
    if (editLink) editLink.href = 'admin.html?edit=' + b.id;

    // PDF preview toggle in modal footer
    var pdfToggle = document.getElementById('modalPdfToggle');
    var pdfNewTab = document.getElementById('modalPdfNewTab');
    var pdfPreview = document.getElementById('modalPdfPreview');
    var pdfFrame = document.getElementById('modalPdfFrame');
    var pdfPath = getPdfPath(b.businessName);
    // Reset preview state
    if (pdfPreview) pdfPreview.style.display = 'none';
    if (pdfFrame) pdfFrame.src = 'about:blank';
    if (modal) modal.querySelector('.modal').classList.remove('modal-wide');
    if (pdfPath) {
      if (pdfToggle) { pdfToggle.style.display = ''; pdfToggle.dataset.pdfSrc = encodeURI(pdfPath); pdfToggle.textContent = 'Original PDF'; }
      if (pdfNewTab) { pdfNewTab.href = encodeURI(pdfPath); pdfNewTab.style.display = ''; }
    } else {
      if (pdfToggle) pdfToggle.style.display = 'none';
      if (pdfNewTab) pdfNewTab.style.display = 'none';
    }

    modal.classList.add('active');
  }

  // ---- All Contacts Overlay ----

  function showContactsOverlay() {
    const overlay = document.getElementById('contactsOverlay');
    if (!overlay) return;
    renderContactsContent();
    overlay.classList.add('active');
  }

  function renderContactsContent() {
    const container = document.getElementById('contactsContent');
    if (!container) return;
    const query = (document.getElementById('contactsSearch')?.value || '').toLowerCase().trim();

    var filtered = businesses.filter(b => {
      if (!query) return true;
      var tagStr = Array.isArray(b.tags) ? b.tags.join(' ') : (b.tags || '');
      return [b.businessName, b.phone, b.ownerName, b.ownerPhone,
              b.onSiteManagerName, b.onSiteManagerPhone,
              b.keyHolder1Name, b.keyHolder2Name, b.keyHolder3Name,
              b.category, b.businessType, tagStr]
        .map(v => (v || '').toLowerCase()).join(' ').includes(query);
    });

    filtered.sort((a, b) => (a.businessName || '').localeCompare(b.businessName || ''));

    if (filtered.length === 0) {
      container.innerHTML = '<div class="no-results"><p>No contacts match your filter.</p></div>';
      return;
    }

    if (contactsView === 'tiles') {
      container.innerHTML = '<div class="contacts-tiles">' + filtered.map(b => {
        var bType = b.businessType || b.category || 'N/A';
        var lines = '';
        if (b.phone) lines += '<div class="ct-line phone">' + escHtml(b.phone) + '</div>';
        if (b.ownerName) lines += '<div class="ct-line">Owner: ' + escHtml(b.ownerName) +
          (b.ownerPhone ? ' - ' + escHtml(b.ownerPhone) : '') + '</div>';
        if (b.onSiteManagerName) lines += '<div class="ct-line">Mgr: ' + escHtml(b.onSiteManagerName) +
          (b.onSiteManagerPhone ? ' - ' + escHtml(b.onSiteManagerPhone) : '') + '</div>';
        if (b.keyHolder1Name) lines += '<div class="ct-line">KH1: ' + escHtml(b.keyHolder1Name) +
          (b.keyHolder1Phone ? ' - ' + escHtml(b.keyHolder1Phone) : '') + '</div>';
        if (b.keyHolder2Name) lines += '<div class="ct-line">KH2: ' + escHtml(b.keyHolder2Name) +
          (b.keyHolder2Phone ? ' - ' + escHtml(b.keyHolder2Phone) : '') + '</div>';
        if (b.keyHolder3Name) lines += '<div class="ct-line">KH3: ' + escHtml(b.keyHolder3Name) +
          (b.keyHolder3Phone ? ' - ' + escHtml(b.keyHolder3Phone) : '') + '</div>';
        if (b.alarmPhone) lines += '<div class="ct-line">Alarm: ' + escHtml(b.alarmCompany || '') +
          ' - ' + escHtml(b.alarmPhone) + '</div>';
        var ctTagsHtml = '';
        if (Array.isArray(b.tags) && b.tags.length > 0) {
          ctTagsHtml = '<div class="biz-tags" style="margin-top:0.35rem;">' +
            b.tags.map(t => '<span class="tag-chip">' + escHtml(t) + '</span>').join('') +
          '</div>';
        }
        return '<div class="contact-tile" data-id="' + b.id + '">' +
          '<div class="ct-name">' + escHtml(b.businessName || 'Unnamed') + '</div>' +
          '<div class="ct-type">' + escHtml(bType || 'N/A') + '</div>' +
          ctTagsHtml +
          lines +
        '</div>';
      }).join('') + '</div>';
    } else {
      var html = '<div class="contacts-list-detail">' +
        '<div class="contact-list-row contact-list-header">' +
          '<div>Business</div><div>Main Phone</div><div>Owner / Manager</div><div>Emergency KH</div>' +
        '</div>';
      html += filtered.map(b => {
        var ownerMgr = b.ownerName || '';
        if (b.onSiteManagerName) ownerMgr += (ownerMgr ? ' / ' : '') + b.onSiteManagerName;
        var kh = b.keyHolder1Name || '';
        if (b.keyHolder1Phone) kh += kh ? ' (' + b.keyHolder1Phone + ')' : b.keyHolder1Phone;
        return '<div class="contact-list-row" data-id="' + b.id + '">' +
          '<div style="color:var(--cpd-white); font-weight:600;">' + escHtml(b.businessName || '--') + '</div>' +
          '<div style="color:var(--cpd-accent);">' + escHtml(b.phone || '--') + '</div>' +
          '<div>' + escHtml(ownerMgr || '--') + '</div>' +
          '<div>' + escHtml(kh || '--') + '</div>' +
        '</div>';
      }).join('');
      html += '</div>';
      container.innerHTML = html;
    }
  }

  // ---- Directory Event Bindings ----

  function bindDirectoryEvents() {
    // Search
    var searchInput = document.getElementById('searchInput');
    if (searchInput) {
      var debounce;
      searchInput.addEventListener('input', () => {
        clearTimeout(debounce);
        debounce = setTimeout(renderDirectory, 200);
      });
    }

    // Filters
    document.getElementById('categoryFilter')?.addEventListener('change', renderDirectory);
    document.getElementById('followUpFilter')?.addEventListener('change', renderDirectory);

    // Filter chip click -> set search and re-render
    function handleFilterChipClick(e) {
      var chip = e.target.closest('.filter-chip');
      if (chip && chip.dataset.search) {
        e.stopPropagation();
        var searchInput = document.getElementById('searchInput');
        if (searchInput) {
          searchInput.value = chip.dataset.search;
          renderDirectory();
          searchInput.focus();
        }
        return true;
      }
      return false;
    }

    // Card / list row click -> modal (filter chips intercept first)
    document.getElementById('businessGrid')?.addEventListener('click', (e) => {
      if (handleFilterChipClick(e)) return;
      var card = e.target.closest('.business-card');
      if (card) showDetailModal(card.dataset.id);
    });
    document.getElementById('businessList')?.addEventListener('click', (e) => {
      if (handleFilterChipClick(e)) return;
      var row = e.target.closest('.list-row:not(.list-row-header)');
      if (row) showDetailModal(row.dataset.id);
    });

    // View toggle
    document.getElementById('viewToggle')?.addEventListener('click', (e) => {
      var btn = e.target.closest('.view-toggle-btn');
      if (!btn) return;
      currentView = btn.dataset.view;
      document.querySelectorAll('#viewToggle .view-toggle-btn').forEach(b =>
        b.classList.toggle('active', b.dataset.view === currentView));
      updateViewDisplay();
    });

    // All Contacts button
    document.getElementById('btnAllContacts')?.addEventListener('click', showContactsOverlay);

    // Contacts overlay close
    document.getElementById('contactsClose')?.addEventListener('click', () => {
      document.getElementById('contactsOverlay').classList.remove('active');
    });
    document.getElementById('contactsOverlay')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) e.currentTarget.classList.remove('active');
    });

    // Contacts search
    var contactsSearch = document.getElementById('contactsSearch');
    if (contactsSearch) {
      var cDebounce;
      contactsSearch.addEventListener('input', () => {
        clearTimeout(cDebounce);
        cDebounce = setTimeout(renderContactsContent, 200);
      });
    }

    // Contacts view toggle
    document.getElementById('contactsViewToggle')?.addEventListener('click', (e) => {
      var btn = e.target.closest('.view-toggle-btn');
      if (!btn) return;
      contactsView = btn.dataset.view;
      document.querySelectorAll('#contactsViewToggle .view-toggle-btn').forEach(b =>
        b.classList.toggle('active', b.dataset.view === contactsView));
      renderContactsContent();
    });

    // Contact tile/row click -> detail modal
    document.getElementById('contactsContent')?.addEventListener('click', (e) => {
      var tile = e.target.closest('.contact-tile, .contact-list-row:not(.contact-list-header)');
      if (tile && tile.dataset.id) {
        document.getElementById('contactsOverlay').classList.remove('active');
        showDetailModal(tile.dataset.id);
      }
    });

    // Modal close
    document.getElementById('modalClose')?.addEventListener('click', () => {
      document.getElementById('detailModal').classList.remove('active');
    });
    document.getElementById('modalCloseBtn')?.addEventListener('click', () => {
      document.getElementById('detailModal').classList.remove('active');
    });
    document.getElementById('detailModal')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) e.currentTarget.classList.remove('active');
    });

    // PDF preview toggle
    document.getElementById('modalPdfToggle')?.addEventListener('click', function() {
      var preview = document.getElementById('modalPdfPreview');
      var frame = document.getElementById('modalPdfFrame');
      var modalEl = document.getElementById('detailModal')?.querySelector('.modal');
      if (!preview || !frame) return;
      var isVisible = preview.style.display !== 'none';
      if (isVisible) {
        preview.style.display = 'none';
        frame.src = 'about:blank';
        this.textContent = 'Original PDF';
        if (modalEl) modalEl.classList.remove('modal-wide');
      } else {
        frame.src = this.dataset.pdfSrc || '';
        preview.style.display = '';
        this.textContent = 'Hide PDF';
        if (modalEl) modalEl.classList.add('modal-wide');
      }
    });

    // Keyboard
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.getElementById('detailModal')?.classList.remove('active');
        document.getElementById('contactsOverlay')?.classList.remove('active');
      }
    });
  }

  // ===========================================================
  //  ADMIN PAGE
  // ===========================================================

  function initAdmin() {
    loadCategories();
    loadData();
    bindAdminEvents();
    bindBatchImportEvents();
    bindAuditEvents();
    populateEditSelector();
    renderTrackingTable();
    renderAuditLog();
    renderAdminStats();

    // Identify the Windows user, then gate the Audit Log tab and log the login.
    fetchWindowsUser(function() {
      updateSessionDisplay();
      applyAuditTabVisibility();
      logAudit('login', '', '', 'Logged in — IP: ' + (currentUser.ip || 'unknown'));
      bindLogoffEvents('Admin');
      // Auto-populate Entry By with the authenticated username.
      var entryBy = document.getElementById('fEntryBy');
      if (entryBy && !entryBy.value) entryBy.value = currentUser.username;
    });

    // Populate the category dropdown on the form
    populateCategoryDropdown('fCategory');

    // Wire up cascading: category change -> populate businessType
    var catSel = document.getElementById('fCategory');
    if (catSel) {
      catSel.addEventListener('change', function() {
        populateBusinessTypeDropdown(this.value);
      });
    }

    var params = new URLSearchParams(window.location.search);
    var editId = params.get('edit');
    if (editId) {
      loadBusinessIntoForm(editId);
    }

    if (businesses.length === 0) {
      loadSeedData(true);
    }

    // Load shared data from IIS
    fetchSharedData(function(ok) {
      updateSyncStatus();
      if (ok) {
        populateEditSelector();
        renderTrackingTable();
        renderAdminStats();
      }
    });
    fetchSharedAuditLog(function(log) {
      if (log) renderAuditLog();
      startAutoRefresh();
    });
  }

  function populateEditSelector() {
    var sel = document.getElementById('editSelector');
    if (!sel) return;
    while (sel.options.length > 1) sel.remove(1);
    var sorted = [...businesses].sort((a, b) =>
      (a.businessName || '').localeCompare(b.businessName || '')
    );
    sorted.forEach(b => {
      var opt = document.createElement('option');
      opt.value = b.id;
      opt.textContent = b.businessName || ('(Unnamed - ' + b.id + ')');
      sel.appendChild(opt);
    });
  }

  function clearForm() {
    document.getElementById('formId').value = '';
    document.getElementById('formTitle').textContent = 'New Business Entry';

    Object.keys(FORM_FIELDS).forEach(fieldId => {
      var el = document.getElementById(fieldId);
      if (!el) return;
      if (fieldId === 'fCity') el.value = 'Coraopolis';
      else if (fieldId === 'fState') el.value = 'PA';
      else if (fieldId === 'fZip') el.value = '15108';
      else if (fieldId === 'fStatus') el.value = 'active';
      else el.value = '';
    });

    // Reset tags and cascading dropdown
    var tagsEl = document.getElementById('fTags');
    if (tagsEl) tagsEl.value = '';
    populateBusinessTypeDropdown(''); // reset to "select category first"

    document.getElementById('fFollowUp').checked = false;
    document.getElementById('followUpLabel').textContent = 'No';
    document.getElementById('fEntryBy').value = currentUser.username || '';
    document.getElementById('formAdminInfo').style.display = 'none';
    document.getElementById('btnDelete').style.display = 'none';
    document.getElementById('editSelector').value = '';
  }

  function loadBusinessIntoForm(id) {
    var b = findBusiness(id);
    if (!b) {
      showToast('Business not found.', 'error');
      return;
    }

    // Log the view action
    logAudit('view', b.id, b.businessName, 'Opened record for viewing/editing');

    switchTab('addEdit');
    document.getElementById('formId').value = b.id;
    document.getElementById('formTitle').textContent = 'Edit: ' + b.businessName;

    // Set category first, then populate cascading businessType
    var catEl = document.getElementById('fCategory');
    if (catEl) catEl.value = b.category || '';
    populateBusinessTypeDropdown(b.category || '');

    Object.keys(FORM_FIELDS).forEach(fieldId => {
      if (fieldId === 'fCategory') return; // already set above
      var el = document.getElementById(fieldId);
      if (el) el.value = b[FORM_FIELDS[fieldId]] || '';
    });

    // Set tags field (convert array to comma-separated string)
    var tagsEl = document.getElementById('fTags');
    if (tagsEl) tagsEl.value = formatTags(b.tags);

    document.getElementById('fFollowUp').checked = !!b.followUpNeeded;
    document.getElementById('followUpLabel').textContent = b.followUpNeeded ? 'Yes' : 'No';
    document.getElementById('fEntryBy').value = currentUser.username || b.updatedBy || b.createdBy || '';

    var adminInfo = document.getElementById('formAdminInfo');
    adminInfo.style.display = 'grid';
    document.getElementById('infoCreated').textContent = formatDate(b.createdDate);
    document.getElementById('infoCreatedBy').textContent = b.createdBy || '--';
    document.getElementById('infoUpdated').textContent = formatDate(b.updatedDate);
    document.getElementById('infoUpdatedBy').textContent = b.updatedBy || '--';

    document.getElementById('btnDelete').style.display = 'inline-flex';
    document.getElementById('editSelector').value = id;
  }

  function saveEntry() {
    var name = document.getElementById('fBusinessName').value.trim();
    if (!name) {
      document.getElementById('fBusinessName').classList.add('invalid');
      showToast('Business Name is required.', 'error');
      document.getElementById('fBusinessName').focus();
      return;
    }
    document.getElementById('fBusinessName').classList.remove('invalid');

    var existingId = document.getElementById('formId').value;
    var now = new Date().toISOString();
    // Use session user if available, fall back to Entry By field
    var sessionUser = getSessionUser();
    var entryBy = sessionUser || document.getElementById('fEntryBy').value.trim() || 'Unknown';

    var data = {};
    Object.keys(FORM_FIELDS).forEach(fieldId => {
      var el = document.getElementById(fieldId);
      if (el) data[FORM_FIELDS[fieldId]] = el.value.trim();
    });
    data.followUpNeeded = document.getElementById('fFollowUp').checked;

    // Parse tags from comma-separated input to array
    var tagsEl = document.getElementById('fTags');
    data.tags = tagsEl ? parseTags(tagsEl.value) : [];

    if (existingId) {
      var idx = businesses.findIndex(b => b.id === existingId);
      if (idx === -1) {
        showToast('Entry not found for update.', 'error');
        return;
      }
      var existing = businesses[idx];
      businesses[idx] = Object.assign({}, existing, data, {
        updatedDate: now,
        updatedBy: entryBy
      });
      logAudit('edit', existingId, data.businessName, 'Record updated by ' + entryBy);
      showToast('"' + data.businessName + '" updated successfully.', 'success');
    } else {
      var newId = generateId();
      var newBiz = Object.assign({ id: newId }, data, {
        createdDate: now,
        createdBy: entryBy,
        updatedDate: now,
        updatedBy: entryBy
      });
      businesses.push(newBiz);
      logAudit('add', newId, data.businessName, 'New record created by ' + entryBy);
      showToast('"' + data.businessName + '" added successfully.', 'success');
    }

    saveData();
    populateEditSelector();
    renderTrackingTable();
    renderAdminStats();
    clearForm();
  }

  async function deleteEntry() {
    var id = document.getElementById('formId').value;
    if (!id) return;
    var biz = findBusiness(id);
    if (!biz) return;

    var confirmed = await showConfirm(
      'Delete Business',
      'Are you sure you want to permanently delete "' + biz.businessName + '"?'
    );
    if (!confirmed) return;

    logAudit('delete', id, biz.businessName, 'Record permanently deleted');
    businesses = businesses.filter(b => b.id !== id);
    saveData();
    populateEditSelector();
    renderTrackingTable();
    renderAdminStats();
    clearForm();
    showToast('"' + biz.businessName + '" deleted.', 'warning');
  }

  // ---- Tracking Table ----

  function getTrackingFiltered() {
    var query = (document.getElementById('trackingSearch')?.value || '').toLowerCase().trim();
    var filter = document.getElementById('trackingFilter')?.value || '';
    var now = Date.now();
    var sevenDays = 7 * 24 * 60 * 60 * 1000;

    return businesses.filter(b => {
      if (filter === 'followup' && !b.followUpNeeded) return false;
      if (filter === 'recent') {
        var updated = new Date(b.updatedDate).getTime();
        if (now - updated > sevenDays) return false;
      }
      if (filter === 'incomplete') {
        if (b.phone && (b.ownerName || b.onSiteManagerName) && b.keyHolder1Name) return false;
      }
      if (query) {
        var tagStr = Array.isArray(b.tags) ? b.tags.join(' ') : (b.tags || '');
        var searchable = [
          b.businessName, b.category, b.businessType, tagStr, b.phone, b.status,
          b.createdBy, b.updatedBy
        ].map(v => (v || '').toLowerCase()).join(' ');
        return searchable.includes(query);
      }
      return true;
    });
  }

  function renderTrackingTable() {
    var tbody = document.getElementById('trackingBody');
    if (!tbody) return;

    var filtered = getTrackingFiltered();

    filtered.sort((a, b) => {
      var va = a[sortField] || '';
      var vb = b[sortField] || '';
      // Use category as fallback for businessType sort
      if (sortField === 'businessType') {
        va = a.businessType || a.category || '';
        vb = b.businessType || b.category || '';
      }
      if (sortField === 'followUpNeeded') {
        va = va ? 1 : 0;
        vb = vb ? 1 : 0;
      }
      if (sortField === 'createdDate' || sortField === 'updatedDate') {
        va = new Date(va).getTime() || 0;
        vb = new Date(vb).getTime() || 0;
      }
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; padding:2rem; color:var(--cpd-silver);">' +
        'No entries match your filter.</td></tr>';
      return;
    }

    tbody.innerHTML = filtered.map(b => {
      var typeDisplay = b.businessType || '--';
      return '<tr>' +
        '<td><strong style="color:var(--cpd-white)">' + escHtml(b.businessName || '--') + '</strong></td>' +
        '<td>' + escHtml(b.category || '--') + '</td>' +
        '<td>' + escHtml(typeDisplay) + '</td>' +
        '<td>' + escHtml(b.phone || '--') + '</td>' +
        '<td>' + escHtml(b.status ? b.status.charAt(0).toUpperCase() + b.status.slice(1) : '--') + '</td>' +
        '<td class="' + (b.followUpNeeded ? 'follow-up-yes' : 'follow-up-no') + '">' +
          (b.followUpNeeded ? 'YES' : 'No') + '</td>' +
        '<td>' + formatDateShort(b.createdDate) + '</td>' +
        '<td>' + formatDateShort(b.updatedDate) + '</td>' +
        '<td>' + escHtml(b.updatedBy || '--') + '</td>' +
        '<td><button class="btn btn-primary btn-sm tracking-edit" data-id="' + b.id + '">Edit</button></td>' +
      '</tr>';
    }).join('');
  }

  function renderAdminStats() {
    var container = document.getElementById('adminStats');
    if (!container) return;
    var total = businesses.length;
    var active = businesses.filter(b => b.status === 'active').length;
    var followUp = businesses.filter(b => b.followUpNeeded).length;
    var incomplete = businesses.filter(b => !b.phone || (!b.ownerName && !b.onSiteManagerName) || !b.keyHolder1Name).length;
    var cats = new Set(businesses.map(b => b.category).filter(Boolean)).size;

    container.innerHTML =
      '<div class="stat-card active-count"><div class="stat-value">' + total + '</div><div class="stat-label">Total Entries</div></div>' +
      '<div class="stat-card"><div class="stat-value">' + active + '</div><div class="stat-label">Active</div></div>' +
      '<div class="stat-card"><div class="stat-value">' + cats + '</div><div class="stat-label">Categories</div></div>' +
      '<div class="stat-card follow-up"><div class="stat-value">' + followUp + '</div><div class="stat-label">Need Follow-Up</div></div>' +
      '<div class="stat-card"><div class="stat-value" style="color:var(--cpd-warning)">' + incomplete + '</div><div class="stat-label">Missing Info</div></div>';
  }

  // ---- Tabs ----

  function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
    document.querySelectorAll('.tab-content').forEach(tab => {
      tab.classList.toggle('active', tab.id === 'tab-' + tabId);
    });
    // Refresh audit log when switching to that tab
    if (tabId === 'auditLog') renderAuditLog();
  }

  // ---- Data Import/Export ----

  function exportJSON() {
    var blob = new Blob([JSON.stringify(businesses, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'cpd_business_directory_' + new Date().toISOString().slice(0, 10) + '.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported ' + businesses.length + ' entries.', 'success');
  }

  function importJSON(file) {
    var reader = new FileReader();
    reader.onload = (e) => {
      try {
        var imported = JSON.parse(e.target.result);
        if (!Array.isArray(imported)) {
          showToast('Invalid JSON: expected an array of businesses.', 'error');
          return;
        }
        var added = 0, updated = 0;
        imported.forEach(entry => {
          if (!entry.id) entry.id = generateId();
          var idx = businesses.findIndex(b => b.id === entry.id);
          if (idx >= 0) {
            businesses[idx] = Object.assign({}, businesses[idx], entry);
            updated++;
          } else {
            businesses.push(entry);
            added++;
          }
        });
        saveData();
        populateEditSelector();
        renderTrackingTable();
        renderAdminStats();
        showToast('Import complete: ' + added + ' added, ' + updated + ' updated.', 'success');
      } catch (err) {
        showToast('Failed to parse JSON file.', 'error');
      }
    };
    reader.readAsText(file);
  }

  function exportCSV() {
    var headers = [
      'Business Name', 'Category', 'Business Type', 'Tags', 'Address', 'Suite/Unit/Floor', 'Mailing Address',
      'City', 'State', 'ZIP', 'Phone', 'Email', 'Website', 'Hours',
      'Owner Name', 'Owner Phone', 'Owner Email',
      'On-Site Manager', 'Manager Phone', 'Manager Email',
      'Property Owner/Mgmt', 'Property Mgmt Phone',
      'Keyholder 1', 'KH1 Phone', 'Keyholder 2', 'KH2 Phone', 'Keyholder 3', 'KH3 Phone',
      'Alarm Present', 'Alarm Type', 'Alarm Company', 'Alarm 24/7 Phone',
      'Security Cameras', 'Camera Coverage', 'Video Retention', 'Video Contact', 'Video Phone',
      'Rear Doors/Access', 'Gate/Lot Notes', 'Hazardous Materials', 'Guard Dog', 'Special Concerns',
      'Cert Name', 'Cert Title', 'Cert Date',
      'Status', 'Follow-Up', 'Follow-Up Notes', 'Notes',
      'Created', 'Created By', 'Updated', 'Updated By'
    ];
    var keys = [
      'businessName', 'category', 'businessType', 'tags', 'address', 'suiteUnitFloor', 'mailingAddress',
      'city', 'state', 'zip', 'phone', 'email', 'website', 'hoursOfOperation',
      'ownerName', 'ownerPhone', 'ownerEmail',
      'onSiteManagerName', 'onSiteManagerPhone', 'onSiteManagerEmail',
      'propertyOwner', 'propertyMgmtPhone',
      'keyHolder1Name', 'keyHolder1Phone', 'keyHolder2Name', 'keyHolder2Phone',
      'keyHolder3Name', 'keyHolder3Phone',
      'alarmPresent', 'alarmType', 'alarmCompany', 'alarmPhone',
      'securityCameras', 'cameraCoverage', 'videoRetention', 'videoContactName', 'videoContactPhone',
      'rearDoorsAccess', 'gateAccessNotes', 'hazardousMaterials', 'guardDog', 'specialConcerns',
      'certName', 'certTitle', 'certDate',
      'status', 'followUpNeeded', 'followUpNotes', 'notes',
      'createdDate', 'createdBy', 'updatedDate', 'updatedBy'
    ];

    var csvRows = [headers.join(',')];
    businesses.forEach(b => {
      var row = keys.map(k => {
        var val = b[k];
        if (k === 'tags' && Array.isArray(val)) val = val.join(', ');
        if (typeof val === 'boolean') val = val ? 'Yes' : 'No';
        val = String(val || '').replace(/"/g, '""');
        return '"' + val + '"';
      });
      csvRows.push(row.join(','));
    });

    var blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'cpd_business_directory_' + new Date().toISOString().slice(0, 10) + '.csv';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported ' + businesses.length + ' entries as CSV.', 'success');
  }

  function loadSeedData(silent) {
    try {
      // Read from global CPD_SEED_DATA loaded via <script src="../data/businesses.js">
      // This avoids fetch/XHR which fail on file:// protocol
      if (typeof CPD_SEED_DATA === 'undefined' || !Array.isArray(CPD_SEED_DATA)) {
        throw new Error('Seed data not loaded — ensure businesses.js is included.');
      }
      var seed = CPD_SEED_DATA;
      var added = 0, updated = 0;
      seed.forEach(entry => {
        if (!entry.id) entry.id = generateId();
        var idx = businesses.findIndex(b => b.id === entry.id);
        if (idx >= 0) {
          businesses[idx] = Object.assign({}, businesses[idx], entry);
          updated++;
        } else {
          businesses.push(entry);
          added++;
        }
      });
      saveData();
      if (currentMode === 'directory') {
        renderDirectory();
      } else {
        populateEditSelector();
        renderTrackingTable();
        renderAdminStats();
      }
      if (!silent) {
        showToast('Seed loaded: ' + added + ' added, ' + updated + ' updated.', 'success');
      }
    } catch (err) {
      if (!silent) showToast('Could not load seed data: ' + err.message, 'error');
    }
  }

  async function resetAllData() {
    var confirmed = await showConfirm(
      'Reset All Data',
      'This will permanently delete ALL business entries. This cannot be undone. Continue?'
    );
    if (!confirmed) return;
    businesses = [];
    saveData();
    populateEditSelector();
    renderTrackingTable();
    renderAdminStats();
    clearForm();
    showToast('All data has been reset.', 'warning');
  }

  // ---- Admin Event Bindings ----

  // ---- Batch CSV Import ----

  var batchParsed = []; // staged records waiting for import

  // CSV header → JSON key map (matches exportCSV column order)
  const CSV_HEADER_MAP = {
    'business name': 'businessName',
    'category': 'category',
    'business type': 'businessType',
    'tags': 'tags',
    'address': 'address',
    'suite/unit/floor': 'suiteUnitFloor',
    'mailing address': 'mailingAddress',
    'city': 'city',
    'state': 'state',
    'zip': 'zip',
    'phone': 'phone',
    'email': 'email',
    'website': 'website',
    'hours': 'hoursOfOperation',
    'owner name': 'ownerName',
    'owner phone': 'ownerPhone',
    'owner email': 'ownerEmail',
    'on-site manager': 'onSiteManagerName',
    'manager phone': 'onSiteManagerPhone',
    'manager email': 'onSiteManagerEmail',
    'property owner/mgmt': 'propertyOwner',
    'property mgmt phone': 'propertyMgmtPhone',
    'keyholder 1': 'keyHolder1Name',
    'kh1 phone': 'keyHolder1Phone',
    'keyholder 2': 'keyHolder2Name',
    'kh2 phone': 'keyHolder2Phone',
    'keyholder 3': 'keyHolder3Name',
    'kh3 phone': 'keyHolder3Phone',
    'alarm present': 'alarmPresent',
    'alarm type': 'alarmType',
    'alarm company': 'alarmCompany',
    'alarm 24/7 phone': 'alarmPhone',
    'security cameras': 'securityCameras',
    'camera coverage': 'cameraCoverage',
    'video retention': 'videoRetention',
    'video contact': 'videoContactName',
    'video phone': 'videoContactPhone',
    'rear doors/access': 'rearDoorsAccess',
    'gate/lot notes': 'gateAccessNotes',
    'hazardous materials': 'hazardousMaterials',
    'guard dog': 'guardDog',
    'special concerns': 'specialConcerns',
    'cert name': 'certName',
    'cert title': 'certTitle',
    'cert date': 'certDate',
    'status': 'status',
    'follow-up': 'followUpNeeded',
    'follow-up notes': 'followUpNotes',
    'notes': 'notes'
  };

  function parseCSVLine(line) {
    var result = [];
    var current = '';
    var inQuotes = false;
    for (var i = 0; i < line.length; i++) {
      var ch = line[i];
      if (inQuotes) {
        if (ch === '"') {
          if (i + 1 < line.length && line[i + 1] === '"') {
            current += '"'; i++;
          } else {
            inQuotes = false;
          }
        } else {
          current += ch;
        }
      } else {
        if (ch === '"') { inQuotes = true; }
        else if (ch === ',') { result.push(current.trim()); current = ''; }
        else { current += ch; }
      }
    }
    result.push(current.trim());
    return result;
  }

  function parseCSVFile(text) {
    // Split into lines, filter empties
    var lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length < 2) return { headers: [], rows: [], errors: ['CSV file must have a header row and at least one data row.'] };

    var rawHeaders = parseCSVLine(lines[0]);
    var normalHeaders = rawHeaders.map(h => h.toLowerCase().trim());

    // Map headers to JSON keys
    var keyMap = [];
    var unmappedHeaders = [];
    normalHeaders.forEach((h, i) => {
      var jsonKey = CSV_HEADER_MAP[h];
      if (jsonKey) {
        keyMap.push({ index: i, key: jsonKey, header: rawHeaders[i] });
      } else if (h && h !== 'created' && h !== 'created by' && h !== 'updated' && h !== 'updated by') {
        unmappedHeaders.push(rawHeaders[i]);
      }
    });

    if (keyMap.length === 0) {
      return { headers: [], rows: [], errors: ['No recognized column headers found. Export a CSV from the Tracking Log to get the correct format.'] };
    }

    var errors = [];
    var warnings = [];
    if (unmappedHeaders.length > 0) {
      warnings.push('Skipped unrecognized columns: ' + unmappedHeaders.join(', '));
    }

    var rows = [];
    for (var r = 1; r < lines.length; r++) {
      var fields = parseCSVLine(lines[r]);
      var record = {
        city: 'Coraopolis',
        state: 'PA',
        zip: '15108',
        status: 'active',
        followUpNeeded: false
      };

      keyMap.forEach(km => {
        var val = fields[km.index] || '';
        // Special handling
        if (km.key === 'tags') {
          record.tags = val ? val.split(',').map(t => t.trim()).filter(Boolean) : [];
        } else if (km.key === 'followUpNeeded') {
          record.followUpNeeded = (val.toLowerCase() === 'yes' || val.toLowerCase() === 'true');
        } else {
          record[km.key] = val;
        }
      });

      // Validate: must have businessName
      if (!record.businessName) {
        errors.push('Row ' + (r + 1) + ': Missing Business Name — skipped.');
        continue;
      }

      // Check for duplicates in existing data
      record._isDuplicate = businesses.some(b =>
        b.businessName && b.businessName.toLowerCase() === record.businessName.toLowerCase()
      );

      record._rowNum = r + 1;
      rows.push(record);
    }

    return {
      headers: keyMap.map(km => km.header),
      keys: keyMap.map(km => km.key),
      rows: rows,
      errors: errors,
      warnings: warnings
    };
  }

  function handleBatchFile(file) {
    if (!file) return;
    var ext = file.name.split('.').pop().toLowerCase();
    if (!['csv', 'tsv', 'txt'].includes(ext)) {
      showToast('Please use a CSV file (.csv, .tsv, or .txt).', 'error');
      return;
    }

    var reader = new FileReader();
    reader.onload = function (e) {
      var result = parseCSVFile(e.target.result);
      batchParsed = result.rows || [];
      renderBatchPreview(result);
    };
    reader.readAsText(file);
  }

  function renderBatchPreview(result) {
    var preview = document.getElementById('batchPreview');
    var errDiv = document.getElementById('batchErrors');
    var warnDiv = document.getElementById('batchWarnings');
    var thead = document.getElementById('batchTableHead');
    var tbody = document.getElementById('batchTableBody');
    var summary = document.getElementById('batchSummary');

    // Show preview area
    preview.style.display = 'block';

    // Errors
    if (result.errors && result.errors.length > 0) {
      errDiv.innerHTML = '<strong>Errors:</strong><br>' + result.errors.map(e => escHtml(e)).join('<br>');
      errDiv.style.display = 'block';
    } else {
      errDiv.style.display = 'none';
    }

    // Warnings
    var dupCount = batchParsed.filter(r => r._isDuplicate).length;
    var allWarnings = (result.warnings || []).slice();
        if (dupCount > 0) {
      allWarnings.push(dupCount + ' record(s) match existing business names (marked DUP).');
    }
    if (allWarnings.length > 0) {
      warnDiv.innerHTML = '<strong>Warnings:</strong><br>' + allWarnings.map(w => escHtml(w)).join('<br>');
      warnDiv.style.display = 'block';
    } else {
      warnDiv.style.display = 'none';
    }

    // Summary line
    summary.textContent = batchParsed.length + ' record(s) ready to import';

    // Table header
    var cols = ['Row', 'Flags', 'Business Name', 'Category', 'Type', 'Address', 'Phone', 'Owner'];
    thead.innerHTML = cols.map(c => '<th>' + c + '</th>').join('');

    // Table body
    tbody.innerHTML = '';
    batchParsed.forEach(rec => {
      var flags = [];
      if (rec._isDuplicate) flags.push('<span class="badge badge-warning" title="Duplicate name">DUP</span>');
      if (rec.followUpNeeded) flags.push('<span class="badge badge-danger" title="Needs follow-up">F/U</span>');

      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + rec._rowNum + '</td>' +
        '<td>' + (flags.length ? flags.join(' ') : '—') + '</td>' +
        '<td>' + escHtml(rec.businessName || '') + '</td>' +
        '<td>' + escHtml(rec.category || '') + '</td>' +
        '<td>' + escHtml(rec.businessType || '') + '</td>' +
        '<td>' + escHtml(rec.address || '') + '</td>' +
        '<td>' + escHtml(rec.phone || '') + '</td>' +
        '<td>' + escHtml(rec.ownerName || '') + '</td>';
      tbody.appendChild(tr);
    });
  }

  function executeBatchImport() {
    if (!batchParsed.length) {
      showToast('No records to import.', 'error');
      return;
    }

    var now = new Date().toISOString();
    var sessionUser = getSessionUser() || 'CSV Import';
    var imported = 0;
    var skipped = 0;

    batchParsed.forEach(rec => {
      // Remove internal tracking fields
      var clean = Object.assign({}, rec);
      delete clean._isDuplicate;
      delete clean._rowNum;

      // Generate ID and timestamps
      clean.id = generateId();
      clean.createdDate = now;
      clean.createdBy = sessionUser;
      clean.updatedDate = now;
      clean.updatedBy = sessionUser;

      businesses.push(clean);
      imported++;
      logAudit('import', clean.id, clean.businessName, 'Batch CSV import by ' + sessionUser);
    });

    saveData();
    populateEditSelector();
    renderTrackingTable();
    renderAdminStats();
    clearBatchPreview();
    showToast(imported + ' record(s) imported successfully.' + (skipped ? ' ' + skipped + ' skipped.' : ''), 'success');
  }

  function clearBatchPreview() {
    batchParsed = [];
    var preview = document.getElementById('batchPreview');
    if (preview) preview.style.display = 'none';
    var fileInput = document.getElementById('batchFileInput');
    if (fileInput) fileInput.value = '';
    var errDiv = document.getElementById('batchErrors');
    if (errDiv) { errDiv.style.display = 'none'; errDiv.innerHTML = ''; }
    var warnDiv = document.getElementById('batchWarnings');
    if (warnDiv) { warnDiv.style.display = 'none'; warnDiv.innerHTML = ''; }
    var tbody = document.getElementById('batchTableBody');
    if (tbody) tbody.innerHTML = '';
    var summary = document.getElementById('batchSummary');
    if (summary) summary.textContent = '';
  }

  function bindBatchImportEvents() {
    var dropZone = document.getElementById('batchDropZone');
    var fileInput = document.getElementById('batchFileInput');
    var browseBtn = document.getElementById('btnBrowseCSV');

    if (browseBtn && fileInput) {
      browseBtn.addEventListener('click', () => fileInput.click());
    }
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) handleBatchFile(e.target.files[0]);
      });
    }
    if (dropZone) {
      dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
      dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
      dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) handleBatchFile(e.dataTransfer.files[0]);
      });
    }

    var importBtn = document.getElementById('btnBatchImport');
    if (importBtn) importBtn.addEventListener('click', executeBatchImport);

    var clearBtn = document.getElementById('btnBatchClear');
    if (clearBtn) clearBtn.addEventListener('click', clearBatchPreview);
  }

  // ---- Admin Event Bindings ----

  function bindAdminEvents() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Form buttons
    document.getElementById('btnSave')?.addEventListener('click', saveEntry);
    document.getElementById('btnClear')?.addEventListener('click', clearForm);
    document.getElementById('btnDelete')?.addEventListener('click', deleteEntry);
    document.getElementById('btnNewEntry')?.addEventListener('click', () => {
      switchTab('addEdit');
      clearForm();
      document.getElementById('fBusinessName')?.focus();
    });

    // Edit selector
    document.getElementById('editSelector')?.addEventListener('change', function() {
      if (this.value) loadBusinessIntoForm(this.value);
    });

    // Export / Import
    document.getElementById('btnExportJSON')?.addEventListener('click', exportJSON);
    document.getElementById('btnExportCSV')?.addEventListener('click', exportCSV);
    document.getElementById('btnImportJSON')?.addEventListener('click', () => {
      var input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = (e) => { if (e.target.files[0]) importJSON(e.target.files[0]); };
      input.click();
    });

    // Seed & Reset
    document.getElementById('btnLoadSeed')?.addEventListener('click', () => loadSeedData(false));
    document.getElementById('btnResetData')?.addEventListener('click', resetAllData);

    // btnChangeUser is hidden under Windows Auth — identity is fixed to the domain login.

    // Tracking sort headers
    document.querySelectorAll('.sort-header').forEach(th => {
      th.addEventListener('click', () => {
        var field = th.dataset.sort;
        if (sortField === field) {
          sortDir = sortDir === 'asc' ? 'desc' : 'asc';
        } else {
          sortField = field;
          sortDir = 'asc';
        }
        renderTrackingTable();
      });
    });

    // Tracking search
    document.getElementById('trackingSearch')?.addEventListener('input', renderTrackingTable);
  }


  // ===========================================================
  //  DASHBOARD PAGE
  // ===========================================================

  function initDashboard() {
    loadData();
    renderDashboard();

    // Identify the Windows user, then log the page view and start logoff tracking.
    fetchWindowsUser(function() {
      updateSessionDisplay();
      logAudit('login', '', '', 'Logged in — IP: ' + (currentUser.ip || 'unknown'));
      bindLogoffEvents('Dashboard');
    });

    // Load shared data from IIS
    fetchSharedData(function(ok) {
      updateSyncStatus();
      if (ok) renderDashboard();
    });
    fetchSharedAuditLog(function(log) {
      if (log) renderDashAuditFeed();
      startAutoRefresh();
    });
  }

  function renderDashboard() {
    renderDashStats();
    renderDashCategoryBreakdown();
    renderDashRecentAdditions();
    renderDashFollowUps();
    renderDashAuditFeed();
    renderDashAttentionTable();
  }

  function renderDashStats() {
    var total = businesses.length;
    var cats = new Set(businesses.map(function(b) { return b.category; }).filter(Boolean));
    var followUp = businesses.filter(function(b) { return b.followUpNeeded; }).length;
    var now = new Date();
    var monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    var recentCount = businesses.filter(function(b) { return b.createdDate && b.createdDate >= monthStart; }).length;
    var incomplete = businesses.filter(function(b) { return !b.phone || !b.ownerName || !b.address || !b.category; }).length;
    dashSetText('dashTotal', total);
    dashSetText('dashCategories', cats.size);
    dashSetText('dashFollowUp', followUp);
    dashSetText('dashRecentCount', recentCount);
    dashSetText('dashIncomplete', incomplete);
  }

  function dashSetText(id, val) { var el = document.getElementById(id); if (el) el.textContent = val; }

  function renderDashCategoryBreakdown() {
    var container = document.getElementById('dashCategoryBreakdown');
    if (!container) return;
    var counts = {};
    businesses.forEach(function(b) { var cat = b.category || 'Uncategorized'; counts[cat] = (counts[cat] || 0) + 1; });
    var sorted = Object.entries(counts).sort(function(a, b) { return b[1] - a[1]; });
    var max = sorted.length > 0 ? sorted[0][1] : 1;
    if (sorted.length === 0) { container.innerHTML = '<div class="dash-empty">No business data yet.</div>'; return; }
    container.innerHTML = sorted.map(function(pair) { var cat = pair[0], count = pair[1]; var pct = Math.round((count / max) * 100); return '<div class="dash-cat-row"><div class="dash-cat-name" title="' + escHtml(cat) + '">' + escHtml(cat) + '</div><div class="dash-cat-bar-track"><div class="dash-cat-bar-fill" style="width:' + pct + '%"></div></div><div class="dash-cat-count">' + count + '</div></div>'; }).join('');
  }

  function renderDashRecentAdditions() {
    var container = document.getElementById('dashRecentAdditions');
    if (!container) return;
    var sorted = businesses.slice().filter(function(b) { return b.createdDate; }).sort(function(a, b) { return (b.createdDate || '').localeCompare(a.createdDate || ''); }).slice(0, 10);
    if (sorted.length === 0) { container.innerHTML = '<div class="dash-empty">No records with date info.</div>'; return; }
    container.innerHTML = sorted.map(function(b) { var dateStr = formatDateShort(b.createdDate); var cat = b.category || ''; return '<div class="dash-recent-item"><div><div class="dash-recent-name">' + escHtml(b.businessName) + '</div><div class="dash-recent-meta">' + escHtml(cat) + (b.createdBy ? ' &middot; by ' + escHtml(b.createdBy) : '') + '</div></div><div class="dash-recent-date">' + dateStr + '</div></div>'; }).join('');
  }

  function renderDashFollowUps() {
    var container = document.getElementById('dashFollowUpList');
    var badge = document.getElementById('dashFollowUpBadge');
    if (!container) return;
    var followUps = businesses.filter(function(b) { return b.followUpNeeded; });
    if (badge) badge.textContent = followUps.length;
    if (followUps.length === 0) { container.innerHTML = '<div class="dash-empty">No follow-ups pending.</div>'; return; }
    followUps.sort(function(a, b) { return (b.updatedDate || '').localeCompare(a.updatedDate || ''); });
    container.innerHTML = followUps.map(function(b) { var notes = b.followUpNotes || b.notes || ''; var snippet = notes.length > 120 ? notes.substring(0, 120) + '...' : notes; return '<div class="dash-followup-item"><div class="dash-followup-name">' + escHtml(b.businessName) + '</div>' + (snippet ? '<div class="dash-followup-notes">' + escHtml(snippet) + '</div>' : '') + '<div class="dash-followup-added">' + escHtml(b.category || '') + (b.updatedDate ? ' &middot; Updated ' + formatDateShort(b.updatedDate) : '') + '</div></div>'; }).join('');
  }

  function renderDashAuditFeed() {
    var container = document.getElementById('dashAuditFeed');
    if (!container) return;
    var log = loadAuditLog().slice(0, 25);
    if (log.length === 0) { container.innerHTML = '<div class="dash-empty">No activity recorded yet.</div>'; return; }
    container.innerHTML = log.map(function(entry) { var actionClass = (entry.action || '').toLowerCase(); var timeAgo = getTimeAgo(entry.timestamp); return '<div class="dash-activity-item"><span class="dash-activity-action ' + actionClass + '">' + escHtml(entry.action || '') + '</span><div class="dash-activity-body"><div class="dash-activity-text"><strong>' + escHtml(entry.businessName || '—') + '</strong>' + (entry.user ? ' by ' + escHtml(entry.user) : '') + '</div><div class="dash-activity-time">' + timeAgo + '</div></div></div>'; }).join('');
  }

  function getTimeAgo(timestamp) {
    if (!timestamp) return '';
    var then = new Date(timestamp); var now = new Date(); var diff = Math.floor((now - then) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';
    return formatDateShort(timestamp);
  }

  function renderDashAttentionTable() {
    var tbody = document.getElementById('dashAttentionBody');
    var emptyDiv = document.getElementById('dashAttentionEmpty');
    if (!tbody) return;
    var keyFields = [{key:'phone',label:'Phone'},{key:'ownerName',label:'Owner'},{key:'address',label:'Address'},{key:'category',label:'Category'},{key:'email',label:'Email'},{key:'hoursOfOperation',label:'Hours'}];
    var needsAttention = [];
    businesses.forEach(function(b) { var missing = keyFields.filter(function(f) { return !b[f.key] || b[f.key].trim() === ''; }); if (missing.length > 0) needsAttention.push({biz:b,missing:missing}); });
    needsAttention.sort(function(a,b) { return b.missing.length - a.missing.length; });
    if (needsAttention.length === 0) { tbody.innerHTML = ''; if (emptyDiv) emptyDiv.style.display = 'block'; return; }
    if (emptyDiv) emptyDiv.style.display = 'none';
    tbody.innerHTML = needsAttention.map(function(item) { var mh = item.missing.map(function(m) { return '<span class="missing-field">' + m.label + '</span>'; }).join(''); return '<tr><td>' + escHtml(item.biz.businessName) + '</td><td>' + escHtml(item.biz.category || '—') + '</td><td>' + mh + '</td><td><a href="admin.html" class="btn btn-primary btn-sm" style="padding:2px 10px;font-size:0.72rem;">Edit</a></td></tr>'; }).join('');
  }

  // Response Cards page — loads data and auth only; rendering is handled by
  // the page's own inline script via CPD.getAllBusinesses().
  function initResponseCard() {
    loadData();

    fetchWindowsUser(function() {
      logAudit('page_view', '', '', 'Viewed: Response Cards');
      bindLogoffEvents('Response Cards');
    });

    // Pull latest data from server so printed cards are always current.
    fetchSharedData(function(ok) {
      updateSyncStatus();
    });
  }

  // ---- Public API ----

  return {
    init(mode) {
      currentMode = mode;
      if (mode === 'directory')      initDirectory();
      else if (mode === 'admin')     initAdmin();
      else if (mode === 'dashboard') initDashboard();
      else if (mode === 'response-card') initResponseCard();
    },
    getAllBusinesses() {
      loadData();
      return businesses.slice();
    }
  };
})();
