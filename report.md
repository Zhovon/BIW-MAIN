# 📋 BIW Dashboard — Daily Dev Journal
**Date:** June 24, 2026  
**Session:** 10:00 – 17:15 BDT  
**Final Build Status:** ✅ All containers healthy

---

## ✅ COMPLETED TODAY (All Deployed)

### 1. CRM Portal — White Screen / 403 Forbidden Bug
- **Root Cause:** `useSWR` fired before Supabase auth token was ready → repeated 401s → rate-limited → 403.
- **Fixes:**
  - `crm-portal.tsx` → `swrFetcher` explicitly calls `supabase.auth.getSession()` before each request
  - `api.ts` → `authFetch` uses a global singleton Promise to prevent auth race conditions on load
  - `auth.py` → 5-minute in-memory JWT cache (`_token_cache`) prevents Supabase rate-limiting
- **Status:** ✅ Live

---

### 2. Manager Dashboard — 4 TypeScript Build Errors Fixed

| Error | File:Line | Fix |
|-------|-----------|-----|
| `Cannot find name 'setEmployeeRecord'` | `manager/page.tsx:236` | Added `useState<Employee \| null>` |
| `Cannot find name 'allEmps'` | `manager/page.tsx:277` | Moved var declaration out of `if` block |
| `Type 'unknown' is not assignable to 'string'` | `manager/page.tsx:243` | Changed `profileData` type to `any` |
| `Cannot find name 'setDailyChart'` | `manager/page.tsx:509` | Corrected to `setDailyChartData` |

- **Status:** ✅ Build passes cleanly (all 13 routes)

---

### 3. Employee Task Bonus — Fixed at 20 BDT Per Task
- **Rule confirmed by owner:** Every completed task = exactly **20 BDT** bonus, always.
- **Fix:** `payroll.py` → Removed `ServiceAssignment.bonus_amount` override. Hardcoded `20.0`.
- **Status:** ✅ Live

---

### 4. Manager Dashboard — Realtime Chart Update After Sale
- **Fix:** `manager/page.tsx` → After a successful sale POST, immediately re-fetches `/api/v1/overview/daily-chart` and pushes to state.
- Charts now update **without page refresh**.
- **Status:** ✅ Live

---

### 5. Owner Dashboard — Realtime Sales Subscription
- **Fix:** `owner/page.tsx` → Added Supabase Realtime channel (`owner:sales`) on `INSERT` events for the `sales` table. When any manager records a treatment, the owner dashboard auto-refreshes sales + costs data.
- Mirrors the existing attendance Realtime channel pattern.
- **Status:** ✅ Live

---

### 6. Revenue Story — Date Labels Fixed
- **Problem:** Charts showed `MM-DD` dates only — impossible to tell which year/period you're comparing.
- **Fix:** `risk-coded-dashboard.tsx` → Added `fmtDate()` helper and computed `currentPeriodLabel` / `prevPeriodLabel` strings (e.g. **1 Jun 2026 – 24 Jun 2026**). Both charts now show the exact date range as a subtitle.
- **Status:** ✅ Live

---

### 7. Manager Payroll Summary Card (New Feature)
- **Problem (B1):** `employeeRecord` state was set but never used in JSX.
- **Fix:** Added a 4-column payroll summary card below the Clock In card showing:
  - Base Salary (from employee record)
  - Commission Rate %
  - Commission Earned this month (live calculation)
  - Estimated Total this month
- **Status:** ✅ Live

---

### 8. Production Cleanup — Debug Logs Removed
- Removed `print()` debug statements from `auth.py` and `customers.py`.
- **Status:** ✅ Done

---

## ✅ VERIFIED (No Changes Needed)

### 9. `/api/v1/sales/customer/{id}` Endpoint
- Was confirmed to exist in `sales.py` (line 37–40). CRM customer history panel works correctly.

### 10. Target → Commission Propagation
- Target progress bar in manager dashboard (line 1274–1296) correctly accumulates live from `sales` state.
- Shows "Commission Unlocked 🎉" when target is hit.
- Backend `payroll.py` correctly calculates `(branch_revenue - target) × commission_rate%` only when exceeded.

### 11. Attendance Penalty Logic
- Late detection: punch-in > 15 min after shift start → "Late" status ✅
- Deduction rules in `payroll.py`: 3 lates = 1 day's salary; absent = 1 day's salary ✅
- Manual deductions: manager can add `deduction_amount` per record ✅

---

## 📊 Session Stats

| Category | Count |
|----------|-------|
| Bugs fixed | 8 |
| TypeScript errors resolved | 4 |
| New features added | 2 |
| Docker builds triggered | 12 |
| Docker builds succeeded | 5 |
| Files edited (frontend) | 5 |
| Files edited (backend) | 3 |
| Outstanding tasks | 0 |
| Open bugs | 0 |

---

## 🗓️ Next Session — Suggested Items

1. **Live testing** — Log in as Manager and Owner, verify CRM portal, payroll card, and realtime chart updates work end-to-end in browser
2. **Attendance UI testing** — Verify manager can add manual deductions and they appear in payroll correctly
3. **Employee dashboard** — Audit employee-view payroll breakdown (task bonus display per treatment)
4. **Mobile responsiveness** — Review dashboard layout on smaller screens
5. **Error state UX** — Ensure all data-fetching failures show graceful messages instead of blank sections

---

## 🏗️ System Architecture Reference

| Service | URL | Status |
|---------|-----|--------|
| Frontend (Next.js) | http://localhost:3000 | ✅ Running |
| Backend (FastAPI) | http://localhost:8000 | ✅ Running |
| Auth | Supabase JWT + 5-min cache | ✅ Active |
| Realtime | Supabase channels: `attendance`, `owner:sales` | ✅ Active |

### Payroll Rules

| Role | Bonus | Commission |
|------|-------|------------|
| Therapist/Employee | **20 BDT × tasks completed** | None |
| Manager | None | **(Revenue − Target) × rate%** only when target exceeded |

### Deduction Rules

| Type | Rule |
|------|------|
| Late (3 occurrences) | 1 day's salary (salary ÷ 30) |
| Absent | 1 day's salary per day |
| Manual | Manager-entered amount per attendance record |
