# Monthly Expense Dashboard – Walkthrough

## Run the Application

```
npm run dev
```
App runs at **http://localhost:5173**

---

## Access Links

| Role | URL | Credentials |
|------|-----|-------------|
| **Viewer** (Read-Only) | http://localhost:5173/view | No login required |
| **Admin** | http://localhost:5173/admin | `admin` / `admin123` |

---

## What Was Built

### Pages & Tabs
- **`/view`** – Full read-only viewer dashboard with summary cards, financial table, charts, notes, CSV export, print, and **Water Supply Tracker** status at the bottom.
- **`/admin/login`** – Secure login page (green gradient theme, show/hide password).
- **`/admin`** – Full admin panel with dark green sidebar and 7 tabs:
  - **Dashboard** – Summary cards + charts + full expense table with edit/delete + Water Supply Tracker summary.
  - **Records** – Full CRUD for managing monthly financial summaries (Opening Balance, Collection).
  - **Expenses** – CRUD form (date auto-detects month), expense list table with total row.
  - **Capital** – CCTV capital expense management with **Visibility Toggle**.
  - **Reports** – Monthly report view with CSV export + print.
  - **Water Supply** – Dedicated tab to configure and track when the water supply starts and ends using date-time calendars.
  - **Settings** – Defaults for new months, CCTV, Currency, Categories, Roles.

### Water Supply Tracker Details 💧
- **Calendar Selection:** Admins can set exact start and end dates/times via the "Water Supply" tab.
- **Duration Calculation:** Automatically calculates the elapsed time in days and hours (e.g. "3 Days, 0 Hours").
- **Real-Time Synchronization:** Persists dates globally to Firebase Firestore and displays the calculated duration at the bottom of both the Admin and Viewer dashboards.

### Build & Lint Fixes ✅
- **Duplicate Code Fix:** Resolved a compilation-blocking syntax error in `src/components/ExpenseTable.jsx` where duplicate code blocks were present.
- **Unused Imports Cleaned Up:** Cleaned up unused imports (e.g., `X`, `Download`, `Printer`, `Eye`, `ChevronRight`) across files, ensuring successful strict compilation and building on Vercel.

### File Structure
```
src/
  pages/
    ViewerDashboard.jsx (Render viewer dashboard & water tracker status)
    AdminLogin.jsx / .css (Admin login)
    AdminPanel.jsx (Manage app tabs, sidebar, and config)
  components/
    Header.jsx (Navigation and month-selector)
    SummaryCards.jsx (Financial overview metrics)
    ExpenseTable.jsx (Operational and miscellaneous expenses)
    Charts.jsx (Financial charts)
    ProtectedRoute.jsx (Admin route guard)
    WaterSupplyTracker.jsx (Water supply start/end time display & duration math)
  utils/
    storage.js (Firebase integration, settings management)
    export.js (CSV, Print)
```
