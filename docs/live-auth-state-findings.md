# Live authentication-state QA findings

Date: 2026-08-17

## Curriculum

Route: `/curriculum`

The live route rendered the curriculum map with one current stage and later stages visibly locked behind prerequisite progress. The page exposed lesson, editor, tutor, and quiz actions. The route did not show a misleading login prompt in the inspected session; progress controls were present and the page used the current progress state returned by the application.

## Workspace

Route: `/workspace`

The live route rendered the editor and tutor surface. HTML preview rendered successfully. CSS, JavaScript, and Python modes were switchable. Python initially showed a loading state, then the Pyodide Web Worker returned the learner program's three printed lines. Runtime errors are rendered as a visible `Python error` message rather than silently failing.

## Profile

Route: `/profile`

With no session cookie, the route rendered an explicit login-required state: “Профайлаа нээхийн тулд нэвтэрнэ үү”. It explained that progress, badges, and certificates are tied to the account and provided a Login action. No sample learner, badge, or certificate data was shown while signed out.

## Scope note

These are live manual route checks. Server-side auth-boundary, OAuth callback, database round-trip, achievement, tutor, and workspace contract tests provide automated coverage for the underlying behavior. A dedicated browser automation runner is not part of this project template.
