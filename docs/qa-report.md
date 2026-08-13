# Preliminary Release QA Report

**Date:** 2026-08-13  
**Environment:** Managed development preview with project MySQL  
**Status:** Passed for the preliminary release

## Automated Validation

The definitive validation run completed TypeScript checking, 19 Vitest cases across seven files, Drizzle migration metadata validation, administrator bootstrap syntax validation, and the production Vite/esbuild build. The build completed successfully. The rich Markdown viewer is loaded only when written teaching or lesson content is opened, reducing the initial portal bundle.

## Visual Verification

The dashboard, teachings, courses, connected apps, and administrator overview were captured at `1440 × 1000` and `390 × 844`. Desktop layouts preserved the navy left navigation and spacious ivory content canvas. Mobile layouts replaced the sidebar with a compact header and menu, stacked feature cards without horizontal page overflow, retained readable type sizes, and preserved accessible contrast. The administrator tabs intentionally scroll within their own container on narrow screens.

A malformed HTML patch tail discovered in the first screenshots was removed. Repeat mobile captures confirmed that no stray footer content remained.

## Authentication Verification

The branded signed-out login screen loaded with email/password controls and the development-only preview control. The preview control now uses the same opaque server session, secure cookie, database user, and administrator authorization path as the real application rather than redirecting to an external identity service. The sign-in completed successfully and opened the personalized authenticated dashboard as an administrator.

## Authenticated Administrator Checks

The administrator route loaded under a real development session and displayed the administrator-only navigation, live overview counts, and management tabs. The Members tab loaded its search control, invitation action, and table. The preview administrator was correctly labeled as an administrator and did not expose member lifecycle editing actions against an administrator account.

The invitation dialog opened without mutating data and exposed required name and email fields, tier selection, initial membership state, and the optional access end-date control. Escape closed the modal and restored focus to the member workspace.

The Teachings tab loaded the correct empty state plus category and teaching actions. The new-teaching dialog opened with title, introduction, category, text/image/audio/video/mixed format, draft/published/archived state, uploaded-media selection, Markdown body, order, and featured controls. No content record was created during verification.

The teaching dialog closed cleanly and the Courses tab loaded its empty-state workspace and course-creation action under the same authenticated administrator session.

The new-course dialog opened with course title, short and full descriptions, draft/published/archived state, cover selection, estimated duration, and display order. It closed without creating test content. Section and lesson controls are covered by the compiled course editor and authorization tests; they become available after a real course shell is created.

The Media tab loaded its administrator-only image, audio, video, and PDF upload form, accessibility note, 64 MB request limit guidance, and private-library empty state. No test file was uploaded.

The authenticated Apps route displayed all three destinations and correctly kept each launch disabled with “Connection not configured” because no production callback credentials are present. The page disclosed the one-time-code behavior without exposing any client identifier or secret.

The authenticated Teachings and Courses routes both loaded successfully through the active administrator session. Each showed the correct protected hero, navigation state, and purposeful no-content message sourced from the empty database. No draft content was exposed to the member-facing routes.

Authenticated full-page captures at `390 × 844` verified the dashboard, teachings, courses, connected apps, and administrator overview after the deterministic sign-in was added. The mobile shell remained readable, the app cards stacked correctly, and the administrator tab strip stayed contained as a horizontal control rather than widening the page.

The desktop sign-out control revoked the preview session and returned the browser to the branded login page. The email/password form and development-only preview action were restored, confirming the authenticated shell was no longer available in that browser session.

Attempting to reopen `/admin` after logout redirected back to `/login`. This completed the signed-out protected-route check. No test member, teaching, course, lesson, review, rating, testimonial, or media record was created during interactive verification.

## Result

The preliminary release passed automated type, unit, migration, syntax, and production-build checks; authenticated desktop route and administrator-dialog checks; authenticated mobile route captures; logout; and signed-out administrator protection. Live payment synchronization, outbound invitation email, and destination-app callbacks remain explicitly outside this preliminary release until the corresponding production credentials and integration contracts are supplied.
