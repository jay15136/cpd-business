# CPD Business Directory Deployment Runbook (Windows Server 2012 + IIS)

Environment: Internal LAN only  
App type: Static web + Classic ASP API + server-side JSON storage

Use this as an execution checklist. Fill in `Actual Result` and mark each checkbox.

---

## Runbook Metadata

- `Run Date:` ____________________
- `Change Ticket:` ____________________
- `Executed By:` ____________________
- `Validated By:` ____________________
- `Server Name:` ____________________
- `Server IP:` ____________________
- `Site URL:` ____________________
- `Deployment Package Version/Commit:` ____________________

---

## 1. Pre-Deployment Readiness

- [ ] **1.1 Confirm server is domain-joined and accessible**  
Expected Result: Server is in AD domain and reachable on LAN.  
Actual Result: ______________________________________________

- [ ] **1.2 Confirm operator has local admin rights**  
Expected Result: Can install roles/features and edit IIS config.  
Actual Result: ______________________________________________

- [ ] **1.3 Confirm AD group `CPD-Supervisors` exists**  
Expected Result: Group exists and supervisor accounts are members.  
Actual Result: ______________________________________________

- [ ] **1.4 Confirm deployment path selected (e.g., `C:\inetpub\cpd-business`)**  
Expected Result: Path exists or can be created.  
Actual Result: ______________________________________________

- [ ] **1.5 Confirm deployment package integrity**  
Expected Result: Package is complete and approved for release.  
Actual Result: ______________________________________________

---

## 2. IIS and Role Services

- [ ] **2.1 Install IIS Web Server role**  
Expected Result: IIS role installed successfully.  
Actual Result: ______________________________________________

- [ ] **2.2 Enable required Role Services**  
Expected Result: `ASP`, `Windows Authentication`, `Request Filtering`, `IP and Domain Restrictions`, `ISAPI Extensions`, `ISAPI Filters`, `Default Document`, `Static Content` are installed.  
Actual Result: ______________________________________________

- [ ] **2.3 Install IIS URL Rewrite module**  
Expected Result: URL Rewrite appears in IIS Manager features.  
Actual Result: ______________________________________________

---

## 3. File Deployment

- [ ] **3.1 Create/prepare site root folder**  
Expected Result: Root folder exists at planned location.  
Actual Result: ______________________________________________

- [ ] **3.2 Copy application files to server**  
Expected Result: `web`, `api`, `data`, `docs`, and `web.config` are present.  
Actual Result: ______________________________________________

- [ ] **3.3 Validate no unresolved merge markers**  
Expected Result: No `<<<<<<<`, `=======`, `>>>>>>>` in deployed files.  
Actual Result: ______________________________________________

- [ ] **3.4 Validate required data files exist**  
Expected Result: `data\businesses.json`, `data\audit_log.json`, `data\categories.json` exist.  
Actual Result: ______________________________________________

---

## 4. IIS Site and App Pool Configuration

- [ ] **4.1 Create app pool `CPD-Business-AppPool`**  
Expected Result: App pool created with `No Managed Code`, `Integrated`.  
Actual Result: ______________________________________________

- [ ] **4.2 Create IIS website**  
Expected Result: Site created with correct physical path and HTTP binding.  
Actual Result: ______________________________________________

- [ ] **4.3 Assign app pool to site**  
Expected Result: Site uses `CPD-Business-AppPool`.  
Actual Result: ______________________________________________

- [ ] **4.4 Start site and app pool**  
Expected Result: Both show status `Started`.  
Actual Result: ______________________________________________

---

## 5. Authentication and Access Controls

- [ ] **5.1 Disable Anonymous Authentication**  
Expected Result: Anonymous = Disabled.  
Actual Result: ______________________________________________

- [ ] **5.2 Enable Windows Authentication**  
Expected Result: Windows Authentication = Enabled.  
Actual Result: ______________________________________________

- [ ] **5.3 Confirm auth providers**  
Expected Result: `Negotiate` and `NTLM` configured per policy.  
Actual Result: ______________________________________________

- [ ] **5.4 Confirm IP restrictions applied**  
Expected Result: Non-private/public sources blocked, LAN allowed.  
Actual Result: ______________________________________________

---

## 6. NTFS Permissions (Server-Side Data Writes)

- [ ] **6.1 Grant read access to app pool identity on site root**  
Expected Result: `IIS AppPool\CPD-Business-AppPool` has Read/Execute on root.  
Actual Result: ______________________________________________

- [ ] **6.2 Grant modify access to app pool identity on `data` folder**  
Expected Result: App pool identity can write/update JSON files in `data`.  
Actual Result: ______________________________________________

- [ ] **6.3 Validate least privilege**  
Expected Result: Write access limited to `data` (not whole root).  
Actual Result: ______________________________________________

---

## 7. Configuration Validation

- [ ] **7.1 Validate `web.config` loads without IIS error**  
Expected Result: No `500.19` / invalid section errors.  
Actual Result: ______________________________________________

- [ ] **7.2 Validate `api\web.config` applies**  
Expected Result: API folder enforces expected handler/cache behavior.  
Actual Result: ______________________________________________

- [ ] **7.3 Validate Classic ASP execution**  
Expected Result: `.asp` endpoints execute (not downloaded as text).  
Actual Result: ______________________________________________

---

## 8. Functional Smoke Test

- [ ] **8.1 Browse site root URL**  
Expected Result: Site loads and redirects to dashboard/directory as configured.  
Actual Result: ______________________________________________

- [ ] **8.2 Test `/api/user.asp`**  
Expected Result: Returns authenticated Windows identity JSON.  
Actual Result: ______________________________________________

- [ ] **8.3 Test `/api/businesses.asp` GET**  
Expected Result: Returns business array JSON.  
Actual Result: ______________________________________________

- [ ] **8.4 Test `/api/audit.asp` GET with supervisor account**  
Expected Result: Returns audit log JSON with `ok:true`.  
Actual Result: ______________________________________________

- [ ] **8.5 Test `/api/audit.asp` GET with non-supervisor account**  
Expected Result: Access denied/forbidden behavior as designed.  
Actual Result: ______________________________________________

---

## 9. Server-Side Persistence Validation

- [ ] **9.1 Add test business via Admin UI**  
Expected Result: Save succeeds; record appears in directory.  
Actual Result: ______________________________________________

- [ ] **9.2 Confirm `data\businesses.json` timestamp updates**  
Expected Result: File modified time changes on save.  
Actual Result: ______________________________________________

- [ ] **9.3 Edit test business via Admin UI**  
Expected Result: Edit persists and is visible after page reload.  
Actual Result: ______________________________________________

- [ ] **9.4 Confirm `data\audit_log.json` updates**  
Expected Result: Audit entries written for login/view/edit actions.  
Actual Result: ______________________________________________

- [ ] **9.5 Validate multi-client consistency**  
Expected Result: Changes made on one LAN client visible on another.  
Actual Result: ______________________________________________

---

## 10. LAN and Security Verification

- [ ] **10.1 Validate LAN client access**  
Expected Result: Domain user on LAN can access site successfully.  
Actual Result: ______________________________________________

- [ ] **10.2 Validate disallowed source behavior**  
Expected Result: Requests from blocked network scope are denied.  
Actual Result: ______________________________________________

- [ ] **10.3 Confirm no anonymous browsing**  
Expected Result: Unauthenticated access does not succeed.  
Actual Result: ______________________________________________

---

## 11. Backup and Recovery Setup

- [ ] **11.1 Configure backup for `data` JSON files**  
Expected Result: Scheduled backup includes `businesses.json`, `audit_log.json`, `categories.json`.  
Actual Result: ______________________________________________

- [ ] **11.2 Validate backup retention policy**  
Expected Result: Retention meets policy (e.g., 7/30 days).  
Actual Result: ______________________________________________

- [ ] **11.3 Run restore test (non-production or controlled)**  
Expected Result: Data restore succeeds and app reads restored data.  
Actual Result: ______________________________________________

---

## 12. Go-Live Decision

- [ ] **12.1 All critical checks passed**  
Expected Result: No open blocker defects.  
Actual Result: ______________________________________________

- [ ] **12.2 Stakeholder sign-off received**  
Expected Result: Technical and business owners approve go-live.  
Actual Result: ______________________________________________

- [ ] **12.3 Go-live approved**  
Expected Result: Deployment marked complete and operational.  
Actual Result: ______________________________________________

---

## Rollback Plan (If Needed)

- [ ] **R1 Stop IIS site**  
Expected Result: Site stopped cleanly.  
Actual Result: ______________________________________________

- [ ] **R2 Restore previous deployment files**  
Expected Result: Prior known-good package restored.  
Actual Result: ______________________________________________

- [ ] **R3 Restore previous `data` backups**  
Expected Result: JSON files restored to last good snapshot.  
Actual Result: ______________________________________________

- [ ] **R4 Start site and validate smoke test**  
Expected Result: Service restored to previous stable state.  
Actual Result: ______________________________________________

---

## Final Sign-Off

- `Deployment Status (Pass/Fail):` ____________________
- `Production URL Verified:` ____________________
- `Notes / Exceptions:` ______________________________________________________
- `Executor Signature:` ____________________
- `Approver Signature:` ____________________

