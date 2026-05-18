# CPD Business Directory Project Documentation

## Project Overview
The CPD Business Directory is a Coraopolis Borough Police Department intranet web application used by patrol officers and dispatch personnel to quickly look up business contact information, key holders, alarm details, camera contacts, security notes, and hazardous materials information. It is intended as a LAN-only operational reference tool that replaces paper business files and reduces the need to search other systems for routine response information.

This merged document uses `CLAUDE.md` as the primary source because it was identified as the most recent and most accurate version. Useful non-conflicting details from `project_cpd_directory.md` and `README.md` have been added where they expand file structure, field coverage, or implementation notes.

## Purpose and Users
- Primary users: patrol officers and dispatch personnel.
- Main use case: fast operational lookup during calls for service, follow-up activity, and routine patrol reference.
- Typical information includes business contacts, ownership and management details, key holders, alarm systems, security camera contacts, hazmat notes, and patrol-specific operational notes.

## Mandatory Deployment Requirements
These constraints are core project requirements:

- Production target: Windows Server 2012 R2 running Microsoft IIS with Classic ASP.
- Test environment: Windows 11 running IIS.
- Authentication: Windows Authentication only, handled by IIS using Active Directory.
- No application-level login system for production use.
- Network scope: LAN-only access.
- IP restrictions: `web.config` should block all non-RFC-1918 addresses while allowing localhost and private/internal ranges.
- No Node.js, npm, CDN dependencies, or modern frontend build frameworks.
- All assets must be local and self-contained.
- Data storage is file-based only. No database is used.

## Technology Stack
- Frontend: Vanilla HTML, CSS, and JavaScript.
- Frontend architecture: single `CPD` namespace using the IIFE pattern in `web/app.js`.
- Backend: Classic ASP using JScript.
- Data layer: JSON flat files.
- Non-deployed code area: Java placeholder content under `src/`.

## Project Structure
```text
/ (root)
├── web.config                     — Root IIS configuration: auth, rewrite, MIME types, IP restrictions, blocking rules, static caching
├── web/
│   ├── index.html                 — Main business directory with tile/list toggle, search, and category filters
│   ├── admin.html                 — Administrative interface for add/edit functions, audit viewing, and data management
│   ├── dashboard.html             — Summary dashboard with stats, category breakdowns, trends, and incomplete-record visibility
│   ├── response-card.html         — Printable officer response cards
│   ├── app.js                     — All frontend logic in a single CPD namespace
│   └── styles.css                 — Application styling
├── api/
│   ├── user.asp                   — GET endpoint for Windows identity, display name, domain, and supervisor flag
│   ├── businesses.asp             — GET/POST endpoint for `data/businesses.json`; regenerates `businesses.js`; creates `.bak` backup before save
│   ├── audit.asp                  — GET/POST endpoint for `data/audit_log.json`; GET access is supervisor-only
│   └── web.config                 — API-specific IIS configuration; disables caching and restricts handler access to Read + Script
├── data/
│   ├── businesses.json            — Primary flat-file business data store
│   ├── businesses.json.bak        — Backup created during save operations
│   ├── businesses.js              — JavaScript seed wrapper for offline/file fallback; includes `CPD_SEED_DATA` and PDF map data
│   ├── categories.json            — Category-to-business-type reference data
│   ├── audit_log.json             — Audit trail store, capped at 2000 entries
│   ├── batch_import_template.csv  — CSV template for bulk import
│   ├── images/                    — Business photos and department logo assets
│   ├── intake-forms/              — Uploaded intake-form PDFs
│   └── intake-form-blank.docx     — Blank intake form template
├── docs/                          — Deployment guides and supporting documentation (.docx, .pdf)
└── src/                           — Vestigial Java placeholder area; not deployed and not used in production
```

## Backend Endpoints
### `api/user.asp`
- Method: GET
- Purpose: returns Windows identity information.
- Expected properties include username, display name, domain, and `isSupervisor`.
- Intended for Active Directory / IIS-integrated identity use.

### `api/businesses.asp`
- Methods: GET and POST
- Purpose: reads from and writes to `data/businesses.json`.
- On POST, regenerates `data/businesses.js` for seed/fallback use.
- Creates a `.bak` backup before writing changes.

### `api/audit.asp`
- Methods: GET and POST
- Purpose: reads from and writes to `data/audit_log.json`.
- Audit log GET access is restricted to supervisors via Active Directory group checks.
- Audit log size is capped at 2000 entries.

## Frontend Pages and Behavior
All client-side logic is contained in `web/app.js` under the `CPD` namespace using an immediately invoked function expression.

Primary pages:
- `index.html`: business lookup interface with search, filtering, and tile/list presentation.
- `admin.html`: business add/edit functions, audit review, and import/export or broader data-management features.
- `dashboard.html`: category counts, trend information, and incomplete-record reporting.
- `response-card.html`: printable quick-reference output for officers.

## Data Loading Model
The application supports two data-loading paths:

1. **IIS deployment mode**
- The frontend communicates with the ASP endpoints for live reads and writes.
- This is the expected operational mode.

2. **Direct file / offline fallback mode**
- When the project is opened via `file://`, the frontend falls back to local storage and the `CPD_SEED_DATA` array in `data/businesses.js`.
- This allows limited local testing without IIS.

The seed wrapper also preserves a PDF map so intake-form PDF links remain associated with business IDs when `businesses.js` is regenerated.

## Authentication and Security Model
The authoritative production model is:
- IIS-managed Windows Authentication integrated with Active Directory.
- Anonymous access disabled.
- LAN-only access enforced by IP restrictions.
- No standalone application login in production.

Older documentation mentions a simple session-based `user` name prompt stored in session storage for audit attribution. That should be treated as a legacy or supplemental UI behavior only, not as the real security model. The correct production authentication model is Windows Authentication handled by IIS.

## IIS Configuration
Root `web.config` is responsible for:
- URL rewrite from `/` to `web/dashboard.html`
- Enabling Windows Authentication and disabling anonymous access
- Allowlisting localhost and RFC 1918 network ranges
- Blocking unsafe or sensitive file extensions such as `.bak`, `.bat`, `.java`, and `.config`
- Blocking query strings containing `../`
- Applying static file caching for CSS, JavaScript, and images

`api/web.config` is responsible for:
- Disabling API response caching
- Restricting the API subfolder to Read + Script handler access

## Data Schema
Business records in `data/businesses.json` contain more than 60 fields. Consolidated field groups include:

### Core fields
- `id`
- `businessName`
- `category`
- `businessType`
- `tags[]`

### Contact and location
- `address`, `city`, `state`, `zip`
- `phone`, `email`, `website`
- `hoursOfOperation`

### Ownership and management
- `ownerName`, `ownerPhone`, `ownerEmail`
- `onSiteManagerName`, `onSiteManagerPhone`, `onSiteManagerEmail`
- `propertyOwner`, `propertyMgmtPhone`

### Key holders and access
- `keyHolder1Name` through `keyHolder3Name`
- Corresponding key holder phone fields
- `rearDoorsAccess`
- `gateAccessNotes`
- Entry-point and access details

### Alarm and security
- `alarmPresent`
- `alarmType`
- `alarmCompany`
- `alarmPhone`
- `securityCameras`
- `cameraCoverage`
- `videoRetention`
- `videoContactName`, `videoContactPhone`

### Hazmat and special concerns
- `hazardousMaterials`
- Hazardous material storage locations
- `guardDog`
- `specialConcerns`

### Certification and follow-up
- `certName`
- `certTitle`
- `certDate`
- `followUp`
- `followUpNotes`

### Audit and lifecycle tracking
- `createdDate`, `createdBy`
- `lastUpdated`, `updatedBy`
- Last verified / verification-related tracking fields
- Patrol notes and related operational notes

## Categories and Taxonomy
- The application uses 20 top-level categories.
- Approximately 170 business types are supported.
- The active taxonomy is embedded in `CATEGORY_REF_DATA` in `web/app.js`.
- `data/categories.json` mirrors this reference structure.

## Key Design Decisions
- Classic ASP with JScript is used for compatibility with the Windows Server 2012 R2 / IIS deployment target.
- ASP JSON parsing intentionally uses `eval()` because this Classic ASP JScript environment does not provide `JSON.parse`.
- The system uses flat JSON files instead of a database to keep deployment simple and self-contained.
- `businesses.js` exists to support direct file access and seed-data fallback.
- PDF mapping must be preserved when regenerating `businesses.js` so linked intake forms remain associated with business IDs.
- Audit logging is capped server-side at 2000 records.
- The Java code under `src/` is vestigial and should be ignored for deployment and operational decisions.

## Local Testing and Deployment Notes
### Local testing without IIS
- Open `web/index.html` directly in a browser.
- The application should fall back to local storage and seed data from `data/businesses.js`.
- This mode is suitable for interface review and limited functional testing.

### IIS testing and deployment
- Copy project files to the IIS site root.
- Enable Windows Authentication in IIS Manager.
- Disable anonymous authentication.
- Confirm both root and API `web.config` files are applied.
- Verify LAN/IP restrictions before operational use.

## Known Issues and Cleanup Items
The current source notes unresolved merge conflicts in the following files. These should be resolved before meaningful testing or deployment:
- `api/web.config`
- `data/categories.json`
- `data/businesses.js`
- `data/batch_import_template.csv`
- `api/audit.asp`
- `api/businesses.asp`

## Reconciled Notes
The three source documents were mostly consistent, but these points required reconciliation:

- `CLAUDE.md` is treated as the newest and most authoritative source.
- Older files describe the project as having “no authentication system” and mention a session user prompt. That conflicts with the newer requirement for IIS Windows Authentication. The corrected documentation treats Windows Authentication as authoritative, and any session-based user attribution as legacy or supplemental only.
- The newer source adds `api/user.asp`, `docs/`, stricter IIS restrictions, and clearer production constraints. Those details are included in this merged version.
- `src/main/` in older files and the `src/` Java placeholder note in the newer file describe the same non-deployed vestigial source area.
- References to an admin “tracking log” and “audit log viewer” were combined into a broader administrative/data-management description.

## Testing Status
- No automated test suite is documented.
- Validation appears to be manual through browser-based fallback testing and IIS deployment testing.
- Because several files reportedly contain merge conflicts, conflict resolution is required before reliable testing can occur.
