---
name: CPD Business Directory Project
description: Core project facts — stack, structure, deployment target, and purpose for the CPD business directory website
type: project
originSessionId: 5fe4edeb-ffd8-4824-a581-4f91d18c29f3
---
# CPD Business Directory — Project Overview

Police department intranet web application for Coraopolis Borough Police Department. Allows officers and dispatch to look up local businesses, key holders, alarm info, camera contacts, and hazmat notes.

**Why:** Operational reference tool for patrol — faster than paper files or RMS lookups for business contact/security info during calls for service.

**How to apply:** All code decisions must be compatible with the deployment stack below. No Node.js, no modern framework build steps, no npm, no CDN dependencies that require internet access.

## Deployment Stack

- **Production server:** Windows Server 2012 running Microsoft IIS
- **Test server:** Windows 11 running Microsoft IIS
- **Network:** Local network only (LAN/intranet) — IP restriction in web.config blocks all non-RFC-1918 addresses
- **Backend:** Classic ASP (JScript) — chosen for IIS on Server 2012 compatibility
- **Frontend:** Vanilla HTML/CSS/JS — no frameworks, no build tools
- **Data storage:** Flat-file JSON (no database) — businesses.json, audit_log.json written by ASP endpoints

## Project Structure

```text
/ (root)
  web.config              — IIS config: MIME types, IP restrictions, security headers, URL rewrite
  web/
    index.html            — Business directory main view (tiles + list toggle)
    admin.html            — Admin panel: add/edit, tracking log, audit log, data management
    dashboard.html        — Stats/summary dashboard
    response-card.html    — Printable officer response cards
    app.js                — All frontend logic (~91KB, single IIFE namespace: CPD)
    styles.css            — All styles (~21KB)
  api/
    businesses.asp        — GET/POST endpoint for businesses.json
    audit.asp             — GET/POST endpoint for audit_log.json
    web.config            — API subfolder IIS config
  data/
    businesses.json       — Primary data store (array of business records)
    businesses.json.bak   — Auto-backup created on each save
    businesses.js         — JS seed wrapper (CPD_SEED_DATA + CPD_PDF_MAP) loaded by HTML
    categories.json       — Category → business type reference
    audit_log.json        — Audit trail (capped at 2000 entries)
    batch_import_template.csv — CSV template for bulk import
    images/               — Business photos / PD logo
    intake-forms/         — Uploaded intake form PDFs
    intake-form-blank.docx — Blank intake form template
  src/main/               — Currently empty (placeholder)
```

## Key Design Decisions

- **eval() for JSON parsing** in ASP endpoints — Server 2012 Classic ASP JScript has no JSON.parse. Known and intentional.
- **Dual data load path:** businesses.js (static seed) loaded at page load for offline/file:// use; ASP endpoints used when running under IIS for live reads/writes.
- **No authentication system** — security relies on network-level IP restriction (LAN only).
- **PDF map preserved** on regenerateBizJS — intake form PDFs linked by business ID.
- **Audit log capped at 2000 entries** server-side in audit.asp.
- **Session "user"** is a simple name prompt (no real auth) — stored in sessionStorage for audit trail attribution.

## Business Record Fields (key ones)

businessName, category, businessType, tags[], address, city, state, zip, phone, email, website, hoursOfOperation, ownerName/Phone/Email, onSiteManagerName/Phone/Email, propertyOwner, propertyMgmtPhone, keyHolder1-3 Name/Phone, alarmPresent, alarmType, alarmCompany, alarmPhone, securityCameras, cameraCoverage, videoRetention, videoContactName/Phone, rearDoorsAccess, gateAccessNotes, hazardousMaterials, guardDog, specialConcerns, certName, certTitle, certDate, followUp (bool), followUpNotes, lastUpdated, updatedBy, createdDate, createdBy, id

## 20 Categories, ~170 Business Types

Full taxonomy embedded in app.js (CATEGORY_REF_DATA) and mirrored in data/categories.json.
