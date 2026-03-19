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

## Screenshots

### Viewer Dashboard
![Viewer Dashboard](C:/Users/bilal/.gemini/antigravity/brain/d3a96ab7-1efe-453b-8604-7862290bca62/viewer_dashboard_full_1773314392514.png)

### Admin Login
![Admin Login](C:/Users/bilal/.gemini/antigravity/brain/d3a96ab7-1efe-453b-8604-7862290bca62/admin_login_page_1773314402260.png)

### Admin Panel (Dashboard)
![Admin Panel](C:/Users/bilal/.gemini/antigravity/brain/d3a96ab7-1efe-453b-8604-7862290bca62/admin_panel_dashboard_1773314417249.png)

### Capital Visibility Toggle
![Capital Toggle](C:/Users/bilal/.gemini/antigravity/brain/d3a96ab7-1efe-453b-8604-7862290bca62/capital_expenditure_toggle_1773345260617.png)

---

## What Was Built

### Pages
- **`/view`** – Full read-only viewer dashboard with summary cards, financial table, charts, notes, CSV export, and print.
- **`/admin/login`** – Secure login page (green gradient theme, show/hide password).
- **`/admin`** – Full admin panel with dark green sidebar and 5 tabs:
  - **Dashboard** – Summary cards + charts + full expense table with edit/delete
  - **Monthly Records** – Full CRUD for managing monthly financial summaries (Opening Balance, Collection)
  - **Expenses** – CRUD form (date auto-detects month), expense list table with total row
  - **Capital** – CCTV capital expense management with **Visibility Toggle**
  - **Reports** – Monthly report view with CSV export + print
  - **Settings** – Defaults for new months, CCTV, Currency, Categories, Roles

### Features Verified ✅
- ✅ Role-based access (viewer read-only, admin full CRUD)
- ✅ Per-month financial records (Opening Balance & Collection managed individually)
- ✅ **Capital Visibility Toggle:** Hide/Show CCTV from front-end.
- ✅ **Dynamic Formula:** Calculation footer updates based on CCTV visibility state.
- ✅ Date auto-detects month when adding expenses
- ✅ Calculations: `Saving = Collection - Expense`, `Total Saving = (Opening + Saving) - (CCTV if visible)`
- ✅ Financial table: Operational + Miscellaneous expenses, TOTAL rows, Notes
- ✅ Dark green / gold theme, responsive layout
- ✅ Pie chart (expense by category) + Line chart (monthly trend)
- ✅ CSV export and Print report
- ✅ Toast notifications on CRUD actions
- ✅ Data persisted via localStorage

### File Structure
```
src/
  pages/
    ViewerDashboard.jsx / .css
    AdminLogin.jsx / .css
    AdminPanel.jsx / .css
  components/
    Header.jsx / .css
    SummaryCards.jsx / .css
    ExpenseTable.jsx / .css
    Charts.jsx / .css
    ProtectedRoute.jsx
  utils/
    storage.js   (CRUD, localStorage, calculations)
    export.js    (CSV, Print)
```
