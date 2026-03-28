---
session_id: "session-ci-pipeline"
title: "Fix CI pipeline flaky tests"
branch: "fix/ci-flaky"
status: "blocked"
started_at: "2026-03-28T08:00:00Z"
updated_at: "2026-03-28T10:15:00Z"
agent_model: "claude-opus-4-6"
repository: "myorg/webapp"
update_mode: "budget"
tracking_start: "mid_project"
tags: ["ci", "testing", "devops"]
progress: 35
---

## Objective
Identify and fix flaky tests causing CI failures on the main branch.

## Project Summary
> Tracking started mid-project. This summarizes the state when tracking began.

- **What this project is:** Full-stack web application with Express API and React frontend
- **What's been done:**
  - Core API with 45+ endpoints (complete)
  - React frontend with auth, dashboard, settings (complete)
  - CI/CD pipeline with GitHub Actions (complete but flaky)
  - 180+ unit tests, 25 integration tests (mostly passing)
  - Deployment to AWS ECS (complete)
- **Current state:** App is in production. CI pipeline fails ~30% of runs due to 3 flaky test files. Team is blocked on merging PRs reliably.
- **Tech stack:** Express, React, PostgreSQL, Jest, GitHub Actions, AWS ECS

## Tasks
- [x] Core API and frontend (pre-existing)
- [x] CI/CD pipeline setup (pre-existing)
- [x] Identified 3 flaky test files
- [x] Fixed race condition in `auth.test.ts`
- [ ] Fix timeout issue in `api-integration.test.ts`
- [ ] Fix mock cleanup in `notifications.test.ts`
- [ ] Verify CI passes 5 consecutive times

## Changes Made
- `tests/auth.test.ts` — Added proper async/await and cleanup to fix race condition

## Key Decisions
- Will increase test timeout from 5s to 15s for integration tests

## Blockers
- `api-integration.test.ts` depends on external service that is currently down. Waiting for infra team to restore staging endpoint.

## Activity Log
### [2026-03-28 08:00:00] Tracking started (mid-project)
Joined existing webapp project to fix flaky CI tests. 3 test files identified as problematic from recent CI run history.

### [2026-03-28 09:30:00] Completed: Fix auth.test.ts race condition
Root cause was missing `await` on async cleanup in `afterEach`. Added proper teardown.

### [2026-03-28 10:15:00] Blocked: External service down
Cannot reproduce or fix `api-integration.test.ts` failures — staging API endpoint is unreachable. Contacted infra team.

## Notes
The auth test fix looks solid. Blocked on the external service for the integration test fixes. Once staging is back, the timeout issue should be straightforward.
