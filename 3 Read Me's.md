# 3 Read Me's
    ## 1st Read Me
    ## The 1st Read Me is the most rent and most accurate:
         ### CLAUDE.md:

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Coraopolis Borough Police Department (CPD) intranet business directory. A LAN-only operational reference tool for patrol officers — fast lookup of business contact info, security details, and hazmat data. Replaces paper files.

## Deployment Constraints (Hard Requirements)

- **Target:** Windows Server 2012 R2 running IIS with Classic ASP
- **No Node.js, npm, or CDN dependencies** — all assets must be local, self-contained files
- **No modern build frameworks** (no React, Vue, webpack, etc.)
- **Windows Authentication only** — IIS handles auth via Active Directory; no application-level login
- **LAN-only access** — `web.config` IP whitelist blocks all non-RFC-1918 addresses
- **File-based storage** — data lives in `data/businesses.json` and `data/audit_log.json`; no database

## Architecture

```
web/        — Vanilla HTML/CSS/JS frontend (no frameworks)
api/        — Classic ASP (JScript) backend endpoints
data/       — JSON flat-file data store + seed JS file + images
docs/       — Deployment guides (.docx, .pdf)
src/        — Java placeholder code (NOT deployed, not used)
web.config  — IIS root config (auth, MIME types, URL rewrite, IP security)
```

### Backend: Classic ASP (JScript)

Three endpoints in `api/`:

| File | Method | Purpose |
|------|--------|---------|
| `user.asp` | GET | Returns Windows identity (username, displayName, domain, isSupervisor) |
| `businesses.asp` | GET/POST | Read/write `data/businesses.json`; POST also regenerates `businesses.js` |
| `audit.asp` | GET/POST | Read/write `data/audit_log.json`; GET is supervisor-only (AD group check) |

- JSON parsing uses `eval()` — intentional for Classic ASP JScript compatibility
- `businesses.asp` POST creates `.bak` backup before writing
- Audit log is capped at 2000 entries

### Frontend: Vanilla JS (IIFE namespace)

All frontend logic is in `web/app.js` using the `CPD` namespace (IIFE pattern). Key pages:

- `index.html` — tile/list toggle, search, category filters
- `admin.html` — add/edit businesses, audit log viewer, data import/export
- `dashboard.html` — stats: category breakdown, trends, incomplete records
- `response-card.html` — printable officer response cards

Data loading has two paths:
1. **IIS deployment:** fetches from ASP endpoints
2. **Local file:// fallback:** reads from `localStorage` and the `CPD_SEED_DATA` array in `data/businesses.js`

`CATEGORY_REF_DATA` in `app.js` embeds all 20 categories and ~170 business types directly.

### IIS Configuration

`web.config` at root handles:
- URL Rewrite: `/` → `web/dashboard.html`
- Windows Auth enabled, anonymous disabled
- IP allowlist: localhost + RFC 1918 only
- Blocks `.bak`, `.bat`, `.java`, `.config` extensions and `..`/`:` in query strings
- Static file caching profiles for CSS/JS/images

`api/web.config` disables caching for API responses and restricts to Read + Script handler.

## Data Schema

Business records in `data/businesses.json` have 60+ fields including:
- Core: `id`, `businessName`, `category`, `businessType`
- Contact: address, phone, hours, key contacts
- Security: alarm systems, key holder, entry points
- Hazmat: materials, storage locations
- Notes: patrol notes, last verified date

## Development Notes

- The `src/` Java code is vestigial — ignore it
- Merge conflicts exist in `api/web.config`, `data/categories.json`, `data/businesses.js`, `data/batch_import_template.csv`, and both `api/audit.asp` and `api/businesses.asp` — resolve before testing
- There is no test suite
- To test locally without IIS: open `web/index.html` directly in a browser; it falls back to `localStorage`/seed data
- For IIS testing: copy files to the IIS site root; Windows Auth must be enabled in IIS Manager

---
# Read Me 2
    ## The second Read Me File
        ### project_cpd_directory:
        
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

---

# Read me 3
    ## The third Read Me File
        ##Third read me was generated with /init in claude code
        ### README.MD
        # CPD Business Directory — Project Overview

Police department intranet web application for Coraopolis Borough Police Department. Allows officers and dispatch to create, edit, and look up local businesses, key holders, alarm info, camera contacts, and hazmat notes.

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
```bash
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
