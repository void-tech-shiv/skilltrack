# Known Issues & Considerations

## 1. Skill Gap Demand Aggregation
- **Observation:** Currently, labor market demand is modeled against active courses with synthetic proxy multipliers since an external state-wide job market scraper is pending Phase 6 roadmap integration.
- **Impact:** Informational visualization on the Analyst/Admin dashboard.

## 2. Vite Config Native Warning
- **Observation:** `Vite` emits an informational warning regarding `__dirname` in `vite.config.ts`.
- **Impact:** Non-breaking warning in Vite 6/8 bundler during build. Output bundle compiles cleanly with code 0.
