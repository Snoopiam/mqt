# MQT — Task List

**Started:** 2026-01-02
**Progress:** 0 of 10 complete

---

## Critical

- [ ] **Fix security vulnerability**
  Location: `package-lock.json`
  Action: Run `npm audit fix`
  Effort: 5 min

- [ ] **Add test infrastructure**
  Location: Project root
  Action: Install vitest, create test config, add npm scripts
  Effort: 1 hr

- [ ] **Write initial component tests**
  Location: `src/`
  Action: Create App.test.jsx, Uploader.test.jsx with basic render tests
  Effort: 2 hrs

---

## High Priority

- [ ] **Remove console statements from frontend**
  Location: `src/App.jsx`, `src/services/api.js`, `src/main.jsx`
  Action: Remove 20 console.log/warn/error statements
  Effort: 30 min

- [ ] **Add logging library to server**
  Location: `server/`
  Action: Install pino, replace 71 console statements with logger
  Effort: 1 hr

- [ ] **Update outdated dependencies**
  Location: `package.json`
  Action: Run `npm update`, update major versions carefully
  Effort: 30 min

---

## Medium Priority

- [ ] **Fix ESLint configuration**
  Location: `eslint.config.js`
  Action: Add Node.js globals for server files
  Effort: 15 min

- [ ] **Complete refinement logic TODO**
  Location: `server/index.js:156`
  Action: Implement the refinement feature
  Effort: 2 hrs

- [ ] **Add server API tests**
  Location: `server/`
  Action: Create tests for /api/generate, /api/extract endpoints
  Effort: 2 hrs

- [ ] **Archive unused documentation**
  Location: `docs/`
  Action: Review and consolidate old planning docs
  Effort: 30 min

---

## Completed

| Date | Task | Notes |
|------|------|-------|
| 2026-01-02 | Codebase humanization | Renamed icons and motion imports |
| 2026-01-02 | File cleanup | Archived old files, moved docs |

---

## Metrics

**Current:** 63/100
**Target:** 80/100

| Metric | Now | Goal |
|--------|-----|------|
| Test Coverage | 0% | 60% |
| Vulnerabilities | 1 | 0 |
| Console Statements | 91 | <10 |
| Outdated Packages | 14 | 0 |

---

*Generated from Audit Report (2026-01-02)*
