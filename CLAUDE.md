# CLAUDE.md

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
- There is no test suite
- To test locally without IIS: open `web/index.html` directly in a browser; it falls back to `localStorage`/seed data
- For IIS testing: copy files to the IIS site root; Windows Auth must be enabled in IIS Manager
