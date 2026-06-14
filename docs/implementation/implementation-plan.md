# Beauty Intelligent Wellness Implementation Plan

## Goal
Build a fully automated clinic platform for Beauty Intelligent Wellness, an aesthetic clinic in Bashundhara. The first delivery should focus on a production-ready core: role-based dashboards, branch operations, finance reporting, employee bonus tracking, and permissioned data entry for managers and owners.

## Final Stack Decision
- Backend: FastAPI
- Frontend: Next.js
- Database: Supabase
- Backend hosting: Render
- Frontend hosting: Vercel
- UI direction: clean, dynamic, premium, and minimal with an "antigravity" style

## Deployment Model
- Backend API runs on Render
- Frontend runs on Vercel
- Database runs on Supabase
- Use environment variables for API URLs, auth secrets, and database access
- Keep branch, revenue, and payroll data isolated by branch while still supporting owner-wide rollups
- Use Supabase Auth as the only login and credential system for this app
- Store user identity, session state, and role claims in Supabase rather than in local app storage
- Treat backend authorization as JWT/session verification backed by Supabase

## Delivery Principles
- Do not build placeholder screens without data flow unless a backend contract is explicitly missing.
- Every dashboard must answer a role-specific question: owner, manager, or employee.
- Every financial card should reconcile to a branch-level or owner-level source.
- Every employee-facing screen should expose salary, bonus, assigned services, and current status.
- Every manager-facing action should be an input workflow, not just a read-only summary.
- Every owner-facing action should allow edit, approval, or oversight of roles and permissions.
- Authentication must come from Supabase sign-in and sign-out flows.
- Authorization must be derived from Supabase user metadata or a Supabase-backed profiles table.
- Role-based UI should hide or disable actions before server-side authorization is added.

## Recommended Folder Structure

```text
BIW main /
  backend/
    src/
      common/
      config/
      database/
      jobs/
      modules/
        appointments/
        automation/
        billing/
        branches/
        crm/
        costs/
        erp/
        employees/
        integrations/
        notifications/
        patients/
        payroll/
        reports/
        revenue/
        sales/
        stock/
      tests/
  frontend/
    src/
      app/
      components/
      features/
        appointments/
        automation/
        billing/
        branches/
        crm/
        costs/
        erp/
        employees/
        patients/
        payroll/
        reports/
        revenue/
        settings/
        sales/
        stock/
      hooks/
      lib/
      services/
      store/
      styles/
  docs/
    implementation/
```

## Roles And Responsibilities

### Owner
- View all branches, revenue, cost, payroll, and employee summaries.
- Edit employee role, manager role, and permission assignments.
- Approve or override manager-entered operational data when needed.
- Review daily, monthly, and yearly finance trends.

### Manager
- Enter daily operational data for services, revenue, costs, and employee assignments.
- Maintain branch-level records and ensure service activity is captured.
- Track attendance, service completion, and bonus eligibility.
- Escalate exceptions to the owner.

### Employee
- View personal salary, bonus, assigned services, and service history.
- See current role, branch, and commission-related activity.
- No access to owner edit screens or branch-wide sensitive finance data.

## Scope Checklist

### Must Have
- Role-based dashboard routing for owner, manager, and employee.
- Navigation and landing behavior for each role.
- Manager data entry screens for daily business operations.
- Owner permission management for role and access changes.
- Employee personal dashboard with salary and bonus visibility.
- Finance charts for daily, monthly, and yearly revenue and cost.
- Branch comparison cards and overall roll-up reporting.
- Service-to-employee assignment tracking.
- Audit-friendly data flow for edits and approvals.
- Responsive UI that works on desktop and mobile.

### Should Have
- Status chips and empty states for each role dashboard.
- Drill-down from charts into branch or service detail.
- Summary KPIs for revenue, cost, profit, salary, bonus, and commissions.
- Basic search or filter for branches, employees, and services.

### Out Of Scope For This 3-Week Window
- Full authentication system with SSO or MFA.
- SMS/WhatsApp automation.
- Complex payroll runs with tax rules.
- Multi-tenant branch isolation beyond the current clinic.
- External accounting integration.

## Core Modules To Build First

1. CRM
   - Lead capture
   - Patient profiles
   - Follow-up pipeline
   - Treatment history
   - Loyalty and referral tracking

2. ERP
   - Staff and role management
   - Clinic operations workflow
   - Purchase and vendor management
   - Service catalog
   - Finance and invoice handling

3. Stock
   - Product inventory
   - Stock in/out tracking
   - Low-stock alerts
   - Batch and expiry tracking
   - Consumption per treatment

4. Automation
   - Appointment reminders
   - Follow-up reminders
   - Payment reminders
   - Stock reorder alerts
   - Lead-to-booking workflows

5. Sales
  - Package and service sales
  - Lead conversion tracking
  - Discount and promotion handling
  - Sales performance tracking

6. Revenue
  - Daily revenue summaries
  - Source-wise revenue tracking
  - Treatment-wise income reporting
  - Outstanding and collected payments

7. Costs
  - Branch-level cost tracking
  - Shared and direct expense allocation
  - Cost derived from sales and revenue activity
  - Profit and loss summaries by branch and overall

8. Branches
  - Separate data per branch
  - Combined owner-wide reporting
  - Branch comparison dashboards
  - Location-specific performance tracking

9. Employees
  - Employee profiles and roles
  - Service-wise employee assignment
  - Treatment execution tracking
  - Salary, bonus, and commission logic

10. Payroll
  - Monthly salary processing
  - Service-based bonus calculation
  - Commission and incentive payouts
  - Payroll summaries by employee and branch

## 3-Week Delivery Plan

### Week 1: Foundation, Roles, And Data Model
Goal: establish the role model, dashboard routes, core API contracts, and the data foundation that supports owner, manager, and employee views.

- Finalize role matrix for owner, manager, and employee.
- Define permissions for view, create, edit, and approve actions.
- Create or refine database entities for branches, employees, services, service assignments, revenue entries, cost entries, and role permissions.
- Establish the dashboard route structure for each role.
- Introduce a role-aware navigation model.
- Wire backend endpoints for overview, branches, employees, services, revenue, and costs.
- Add empty-state and fallback behavior for missing backend data.
- Standardize currency, dates, and branch labels across UI.
- Confirm deployment env vars for frontend and backend.
- Define the Supabase Auth flow for login, logout, session refresh, and protected routes.
- Define the Supabase profile schema for role, branch, and permission claims.

Deliverables:
- Role matrix document.
- Route map for owner, manager, and employee dashboards.
- Data model draft for finance and operations.
- Working shell for role-based dashboard pages.
- Supabase auth and profile contract.

Acceptance criteria:
- Owner, manager, and employee routes are defined and reachable.
- Backend data contracts exist for dashboard summary, branches, employees, services, revenue, and cost.
- UI renders safely even when backend data is unavailable.
- Login, session, and role ownership are assigned to Supabase, not to a custom app auth layer.

### Week 2: Role Dashboards, Manager Entry, And Owner Control
Goal: turn the shell into usable workflows for each role, with managers entering data and owners controlling access.

- Build owner dashboard with branch rollups, revenue, cost, profit, and finance summaries.
- Build manager dashboard with daily input panels for services completed, revenue captured, cost entries, and employee assignments.
- Build employee dashboard with salary, bonus, commission, assigned services, and service history.
- Add owner controls for role updates, permission changes, and employee position edits.
- Add manager form flows for daily operational entry.
- Add validation for required fields and basic audit metadata.
- Add branch-level filters and a clear separation between branch data and owner rollups.
- Improve empty states, loading states, and error states.
- Add Supabase-backed login UI and protected route behavior for authenticated users.
- Bind manager, owner, and employee screen access to Supabase role claims.

Deliverables:
- Owner dashboard page.
- Manager data-entry dashboard page.
- Employee personal dashboard page.
- Permission editing UI for owner.
- Core CRUD forms for daily clinic activity.
- Supabase sign-in flow and route guard scaffold.

Acceptance criteria:
- Manager can enter operational data without owner intervention.
- Owner can edit employee role and permission state.
- Employee can see salary and bonus-related information only.
- Each role sees only the information appropriate to that role.
- Users sign in through Supabase and keep their session across the app.

### Week 3: Finance Charts, Polish, And Release Hardening
Goal: finish the finance intelligence layer, verify the flows end to end, and harden the app for release.

- Add charts for daily, monthly, and yearly revenue and cost trends.
- Add profit trend visualization and branch comparison charting.
- Add employee bonus and salary summary charts where useful.
- Add drill-down interactions from charts to branch and service detail.
- Verify calculations for revenue, cost, and profit totals.
- Add regression checks for route behavior and data rendering.
- Clean up copy, spacing, and responsive layout issues.
- Confirm Docker, local, staging, and production readiness.
- Document setup, usage, and the data-entry flow for the team.
- Verify that finance data persists to Supabase tables and that chart queries read from Supabase-backed data.

Deliverables:
- Finance dashboard charts.
- Finalized role dashboards.
- Release checklist.
- Updated implementation notes and usage guidance.

Acceptance criteria:
- Daily, monthly, and yearly finance charts render correctly.
- Revenue and cost totals reconcile across dashboards.
- Role-based views remain clean on desktop and mobile.
- The app can be built and run locally with Docker.

## Automation Principles
- Every lead should become a tracked CRM record
- Every appointment should trigger reminders and status updates
- Every treatment should update patient history and stock usage
- Every low inventory event should trigger procurement alerts
- Every payment or due amount should be visible in the ERP layer
- Every service should record the employee who performed it
- Every service should contribute to employee bonus and payroll logic
- Every branch should keep its own cost and revenue trail while feeding the owner summary

## Suggested Build Order
1. Lock role model and permissions.
2. Finish dashboard routes for owner, manager, and employee.
3. Finalize manager data-entry workflows.
4. Add finance charts and summary cards.
5. Harden deployment and local Docker flow.

## Immediate Next Deliverables
- Database schema draft for roles, branches, employees, services, revenue, and costs.
- API route map for role dashboards and finance reporting.
- Frontend page map for owner, manager, and employee experiences.
- Role matrix for owner, manager, employee, and future staff roles.
- Finance chart specification for daily, monthly, and yearly trends.
- Release checklist for the 3-week delivery window.
- Supabase auth contract for login, session, and role claims.
