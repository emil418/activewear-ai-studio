## What Already Exists
- Landing page with hero, how-it-works, pricing ✅
- Auth flow (login, signup, forgot/reset password) ✅
- Dashboard layout with sidebar ✅
- Pages: DashboardHome, Create, AthleteLibrary, Templates, FitTesting, Billing, BrandSettings ✅
- Database schema (brands, athletes, assets, templates, generation_jobs, etc.) ✅
- Edge functions for generation ✅
- Model routing, consistency engine, fail-safe system ✅

## What Needs To Be Added

### New Pages
1. **Garment Library** — upload/manage garment assets (currently missing as standalone page)
2. **Environment Library** — browse/select locked environments
3. **Campaign Pack** — package outputs into branded deliverables
4. **History** — view all past generation jobs with details
5. **Admin Panel** — job inspector, error logs, quality monitoring (admin-only)

### Navigation Update
- Update sidebar to include all sections: Dashboard, Athletes, Garments, Environments, Templates, Create, Fit Testing, Campaign Pack, History, Billing, Settings, Admin Panel

### Approach
- Build each new page as a clean, premium component
- Wire up routing in App.tsx and sidebar in DashboardLayout.tsx
- Keep existing generation logic untouched
- Focus on UI structure and navigation — data integration can follow