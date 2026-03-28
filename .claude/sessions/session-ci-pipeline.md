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
tags: ["ci", "testing", "devops"]
progress: 35
---

## Objective
Identify and fix flaky tests causing CI failures on the main branch.

## Tasks
- [x] Identified 3 flaky test files
- [x] Fixed race condition in `auth.test.ts`
- [ ] Fix timeout issue in `api-integration.test.ts`
- [ ] Fix mock cleanup in `notifications.test.ts`
- [ ] Verify CI passes 5 consecutive times

## Changes Made
- `tests/auth.test.ts` — Added proper async/await and cleanup

## Key Decisions
- Will increase test timeout from 5s to 15s for integration tests

## Blockers
- `api-integration.test.ts` depends on external service that is currently down. Waiting for infra team to restore staging endpoint.

## Activity Log
### [2026-03-28 08:00:00] Session started
Investigating flaky CI tests on main branch.

### [2026-03-28 10:15:00] Blocked: External service down
Fixed auth test race condition but cannot proceed with integration tests. Staging API endpoint is unreachable. Waiting on infra team.

## Notes
The auth test fix looks solid. Blocked on the external service for the integration test fixes.
