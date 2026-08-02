# Engineering Debugging Report

No files were modified during this inspection.

## 1. Project Structure

- Backend root contains `server.js`, `seed.js`, `.env`, `.env.example`, `package.json`, `Dockerfile`, plus these real code folders: `middleware`, `models`, `routes`, `sandbox`.
- Frontend root code lives under `frontend/src` with these real folders: `api`, `assets`, `components`, `context`, `pages`.
- Important backend files:
  - [server.js](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/backend/server.js:1)
  - [routes/auth.js](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/backend/routes/auth.js:1)
  - [models/User.js](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/backend/models/User.js:1)
  - [middleware/auth.js](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/backend/middleware/auth.js:1)
- Important frontend files:
  - [api/index.js](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/frontend/src/api/index.js:1)
  - [pages/Register.jsx](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/frontend/src/pages/Register.jsx:1)
  - [pages/Login.jsx](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/frontend/src/pages/Login.jsx:1)
  - [pages/VerifyEmail.jsx](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/frontend/src/pages/VerifyEmail.jsx:1)
  - [context/AuthContext.jsx](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/frontend/src/context/AuthContext.jsx:1)
  - [App.jsx](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/frontend/src/App.jsx:1)
- There is no actual `controllers` layer in use.
- There is no `utils` folder.
- There is no `mail` folder.
- There is no dedicated backend configuration module beyond `.env` and direct `dotenv.config()` in [server.js](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/backend/server.js:6).

## 2. Authentication Flow

- Register starts in [Register.jsx](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/frontend/src/pages/Register.jsx:13): `handleSubmit()` posts to `/auth/register`.
- Frontend API base URL is correctly pointed at `http://127.0.0.1:5000/api` in [api/index.js](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/frontend/src/api/index.js:3).
- Backend register handler is in [auth.js](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/backend/routes/auth.js:45). It validates required fields, normalizes email, checks duplicates, hashes password, and creates the user.
- MongoDB save happens at [auth.js](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/backend/routes/auth.js:59) via `User.create(...)`.
- Verification payload generation happens in [auth.js](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/backend/routes/auth.js:10) through `createVerificationPayload()`.
- After register, the backend returns `verificationPreview` in [auth.js](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/backend/routes/auth.js:67). It does not send an email.
- Verification by code or token is handled in [auth.js](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/backend/routes/auth.js:77).
- Successful verification clears verification fields and issues JWT at [auth.js](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/backend/routes/auth.js:109) and [auth.js](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/backend/routes/auth.js:116).
- Login starts in [Login.jsx](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/frontend/src/pages/Login.jsx:13) and posts to `/auth/login`.
- Backend login route is in [auth.js](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/backend/routes/auth.js:156). It checks email/password, blocks unverified users, and returns JWT for verified users.
- JWT persistence is handled in [AuthContext.jsx](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/frontend/src/context/AuthContext.jsx:11).
- JWT validation middleware is in [middleware/auth.js](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/backend/middleware/auth.js:3).

## 3. Verification Flow

- `verificationPreview` is generated only in [auth.js](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/backend/routes/auth.js:38).
- It is returned from register in [auth.js](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/backend/routes/auth.js:70).
- It is returned from resend in [auth.js](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/backend/routes/auth.js:149).
- It is returned from login for unverified users in [auth.js](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/backend/routes/auth.js:175).
- Frontend register reads it in [Register.jsx](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/frontend/src/pages/Register.jsx:22) and passes it through router state.
- Frontend login reads it in [Login.jsx](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/frontend/src/pages/Login.jsx:26) and passes it through router state.
- Verify page stores it in component state in [VerifyEmail.jsx](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/frontend/src/pages/VerifyEmail.jsx:13).
- Verify page renders `Dev code` in [VerifyEmail.jsx](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/frontend/src/pages/VerifyEmail.jsx:105).
- Verify page renders `Dev link` in [VerifyEmail.jsx](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/frontend/src/pages/VerifyEmail.jsx:108).
- The frontend explicitly documents this as a dev-only flow in [VerifyEmail.jsx](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/frontend/src/pages/VerifyEmail.jsx:75).

## 4. `token=undefined` Investigation

- Exact source of the token in the preview link is [auth.js](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/backend/routes/auth.js:41): ``token=${user.verificationToken}``.
- The frontend does not transform or repair this value. It renders whatever backend returns in [VerifyEmail.jsx](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/frontend/src/pages/VerifyEmail.jsx:108).
- The preview object reaches the verify page through [Login.jsx](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/frontend/src/pages/Login.jsx:23) or [Register.jsx](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/frontend/src/pages/Register.jsx:19), then is stored in [VerifyEmail.jsx](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/frontend/src/pages/VerifyEmail.jsx:13).
- The exact backend reason is data-level: the existing MongoDB user record for `deonlearning5050@gmail.com` initially had no `verificationToken`, no `verificationCode`, no `isVerified`, no `verificationExpiresAt`, and no `verifiedAt`.
- That means when `verificationPreview(user)` was called for that legacy/incomplete record, string interpolation produced `token=undefined`.
- This is not a frontend bug first. It is a backend data consistency issue combined with direct rendering of raw preview data.
- Evidence from runtime inspection: before resend, the live MongoDB user document contained only `_id`, `fullName`, `email`, `password`, `dob`, `createdAt`, `__v`. After hitting `/resend-verification`, the backend correctly backfilled `verificationCode`, `verificationToken`, `verificationExpiresAt`, and `isVerified: false`.
- Therefore the precise chain is:
  - Missing verification fields in MongoDB user record
  - [auth.js](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/backend/routes/auth.js:38) builds preview from missing fields
  - [Login.jsx](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/frontend/src/pages/Login.jsx:26) forwards preview unchanged
  - [VerifyEmail.jsx](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/frontend/src/pages/VerifyEmail.jsx:108) renders raw link
  - Result: `token=undefined`

## 5. Email System Investigation

- No real email provider is configured.
- Backend dependencies in [backend/package.json](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/backend/package.json:14) include no `nodemailer`, no Brevo SDK, no Resend SDK.
- Repo search found no mail utility, no SMTP config, no provider keys, and no send-email function.
- The only “email verification” implementation is the dev preview returned by [auth.js](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/backend/routes/auth.js:38).
- Conclusion: current project has **no outbound email delivery system at all**.

## 6. MongoDB Investigation

- User schema is in [User.js](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/backend/models/User.js:3).
- Relevant fields exist in schema:
  - `isVerified` at [User.js](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/backend/models/User.js:9)
  - `verificationCode` at [User.js](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/backend/models/User.js:10)
  - `verificationToken` at [User.js](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/backend/models/User.js:11)
  - `verificationExpiresAt` at [User.js](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/backend/models/User.js:12)
  - `verifiedAt` at [User.js](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/backend/models/User.js:13)
- MongoDB connection is configured in [server.js](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/backend/server.js:20) and `.env` at [backend/.env](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/backend/.env:2).
- These fields are saved correctly when register or resend uses `createVerificationPayload()`:
  - register save path at [auth.js](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/backend/routes/auth.js:64)
  - resend save path at [auth.js](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/backend/routes/auth.js:144)
- They were **not** present in at least two existing user records before resend. Because the fields are optional in schema, old documents remain valid and silently incomplete.

## 7. Route Inspection

### `POST /register`

- Implemented in [auth.js](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/backend/routes/auth.js:45).
- Bug: returns `verificationPreview` containing secret verification material in API response.
- Bug: no email format validation.
- Bug: no password strength validation.
- Bug: no rate limiting despite `express-rate-limit` dependency existing in [backend/package.json](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/backend/package.json:19).
- Security issue: duplicate-email response leaks account existence.

### `POST /verify-email`

- Implemented in [auth.js](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/backend/routes/auth.js:77).
- Bug: accepts either token or code without validating token format or code length.
- Bug: if user already verified, it immediately issues JWT in [auth.js](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/backend/routes/auth.js:90). This may be acceptable UX, but it also acts as an alternate login path if email is known and verification request is sent from an already-verified state.
- Logic issue: verification fields are removed by assigning `undefined` in [auth.js](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/backend/routes/auth.js:111). Mongoose usually omits these on save, but explicit `$unset` would be clearer and safer.

### `POST /resend-verification`

- Implemented in [auth.js](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/backend/routes/auth.js:127).
- Works in current runtime.
- Bug: still returns `verificationPreview`, exposing code/token.
- Bug: leaks whether email exists via `User not found`.
- Missing rate limiting and anti-abuse protection.
- Positive note: this route successfully repairs legacy users missing verification fields.

### `POST /login`

- Implemented in [auth.js](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/backend/routes/auth.js:156).
- Bug: for unverified users it returns `verificationPreview`, again exposing secret verification material.
- Bug: if an old user record has missing verification fields, this route can produce `token=undefined` in returned preview.
- Missing rate limiting and brute-force protection.
- Missing explicit validation for absent email/password before DB lookup and bcrypt compare.

## 8. Frontend Inspection

- Backend URL is correct in [api/index.js](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/frontend/src/api/index.js:4): `http://127.0.0.1:5000/api`.
- Register page correctly posts to backend in [Register.jsx](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/frontend/src/pages/Register.jsx:18).
- Login page correctly posts to backend in [Login.jsx](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/frontend/src/pages/Login.jsx:17).
- Verify page correctly posts verify and resend in [VerifyEmail.jsx](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/frontend/src/pages/VerifyEmail.jsx:44) and [VerifyEmail.jsx](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/frontend/src/pages/VerifyEmail.jsx:59).
- Error handling is basic but functional: backend message or generic fallback.
- Frontend state issue: verify preview is initialized only from `location.state` in [VerifyEmail.jsx](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/frontend/src/pages/VerifyEmail.jsx:13). If the page is refreshed, that state is lost.
- Frontend rendering issue: verify page renders preview blindly and never checks whether `preview.code` or `preview.verificationLink` are defined in [VerifyEmail.jsx](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/frontend/src/pages/VerifyEmail.jsx:102).
- This means malformed backend preview data becomes visible exactly as-is.
- The auto-verification by query string is implemented in [VerifyEmail.jsx](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/frontend/src/pages/VerifyEmail.jsx:18), which is fine for dev links but also couples frontend UX to raw token-in-URL behavior.

## 9. Root Cause Analysis

Ranked by severity:

- **Severity 1: No real email delivery exists**
  - This is the true reason no verification code is “received” in Gmail.
  - The project is dev-preview only, not email-enabled.

- **Severity 2: Legacy/incomplete user records exist without verification fields**
  - This causes `token=undefined` when `verificationPreview(user)` is built before resend regenerates fields.

- **Severity 3: Secrets are exposed in API responses**
  - `verificationCode` and `verificationToken` are intentionally returned to frontend.
  - This is okay only for local debugging, not production.

- **Severity 4: Frontend trusts malformed preview data**
  - It renders whatever backend sends, including broken links.

- **Severity 5: Account enumeration and abuse controls are missing**
  - `Email already registered`, `User not found`, and no rate limiting all leak too much.

What actually prevents real email verification:

- The primary blocker is **absence of any mail provider integration**.
- `token=undefined` is a secondary bug affecting dev preview links for old users.
- MongoDB itself is functioning and is not the main blocker.

## 10. Minimal Fix

Only these files must change for the minimum practical fix:

- [backend/routes/auth.js](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/backend/routes/auth.js:1)
- [backend/package.json](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/backend/package.json:1)
- [backend/.env](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/backend/.env:1)
- One new backend mail utility file would be needed because none exists today.
- [frontend/src/pages/VerifyEmail.jsx](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/frontend/src/pages/VerifyEmail.jsx:1)
- Optionally [frontend/src/pages/Login.jsx](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/frontend/src/pages/Login.jsx:1) and [frontend/src/pages/Register.jsx](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/frontend/src/pages/Register.jsx:1) if the dev preview should be removed from UI entirely.

## 11. Production Improvements

- Replace dev preview with real mail sending.
- Stop returning OTP/token to frontend.
- Add validation library for email/password/body schemas.
- Add auth route rate limiting and login brute-force throttling.
- Replace fallback JWT secret with required env validation.
- Add password reset flow.
- Normalize auth error responses to avoid user enumeration.
- Use dedicated config/mail modules instead of inline auth route helpers.
- Backfill legacy users missing verification fields with a one-time migration or resend-on-demand logic.
- Add audit logging around registration, resend, verify, and login failures.

## 12. Issue Log

### Issue A

- Problem: No real email is ever sent.
- Evidence: No email provider dependency in [backend/package.json](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/backend/package.json:14); no mail utility/config files in repo; verify UI explicitly says local build in [VerifyEmail.jsx](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/frontend/src/pages/VerifyEmail.jsx:75).
- File: [backend/package.json](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/backend/package.json:14)
- Line number: 14-22
- Why it happens: project only returns preview data; it never integrates SMTP or provider SDK.
- Recommended fix: add a real provider and move verification delivery server-side.

### Issue B

- Problem: `token=undefined` appears in dev verification link.
- Evidence: backend builds preview from `user.verificationToken` in [auth.js](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/backend/routes/auth.js:41); frontend renders raw link in [VerifyEmail.jsx](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/frontend/src/pages/VerifyEmail.jsx:108); live DB inspection showed existing user records missing verification fields until resend.
- File: [backend/routes/auth.js](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/backend/routes/auth.js:38), [frontend/src/pages/VerifyEmail.jsx](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/frontend/src/pages/VerifyEmail.jsx:102)
- Line number: backend 38-42, frontend 102-109
- Why it happens: legacy user record had no `verificationToken`, and template interpolation rendered `undefined`.
- Recommended fix: regenerate missing verification fields before returning preview or stop returning preview entirely.

### Issue C

- Problem: Verification secrets are exposed to frontend.
- Evidence: register returns preview in [auth.js](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/backend/routes/auth.js:70); resend returns preview in [auth.js](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/backend/routes/auth.js:149); login returns preview in [auth.js](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/backend/routes/auth.js:175).
- File: [backend/routes/auth.js](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/backend/routes/auth.js:67)
- Line number: 67-71, 147-150, 170-176
- Why it happens: current implementation is intentionally a dev-only verification flow.
- Recommended fix: remove preview from API responses in production flow.

### Issue D

- Problem: Frontend verify page trusts preview blindly.
- Evidence: preview is stored directly from router state or resend response in [VerifyEmail.jsx](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/frontend/src/pages/VerifyEmail.jsx:13) and [VerifyEmail.jsx](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/frontend/src/pages/VerifyEmail.jsx:60), then rendered directly in [VerifyEmail.jsx](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/frontend/src/pages/VerifyEmail.jsx:105).
- File: [frontend/src/pages/VerifyEmail.jsx](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/frontend/src/pages/VerifyEmail.jsx:13)
- Line number: 13, 60, 102-109
- Why it happens: no guard checks for missing `code` or `verificationLink`.
- Recommended fix: validate preview shape before rendering, or remove preview UI.

### Issue E

- Problem: Verification preview is lost on page refresh.
- Evidence: preview initial state only uses `location.state?.verificationPreview` in [VerifyEmail.jsx](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/frontend/src/pages/VerifyEmail.jsx:13).
- File: [frontend/src/pages/VerifyEmail.jsx](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/frontend/src/pages/VerifyEmail.jsx:13)
- Line number: 13
- Why it happens: router state is not persistent across reloads.
- Recommended fix: rely on backend resend/fetch flow or persist pending verification context safely.

### Issue F

- Problem: Auth routes leak account existence and lack abuse controls.
- Evidence: duplicate email returns explicit message in [auth.js](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/backend/routes/auth.js:55); resend returns `User not found` in [auth.js](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/backend/routes/auth.js:137); no rate limiter is mounted in [server.js](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/backend/server.js:10) even though package exists in [backend/package.json](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/backend/package.json:19).
- File: [backend/routes/auth.js](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/backend/routes/auth.js:53), [backend/server.js](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/backend/server.js:10)
- Line number: 53-56, 135-138, 10-17
- Why it happens: developer-friendly messages and incomplete hardening.
- Recommended fix: normalize responses and apply per-route rate limiting.

### Issue G

- Problem: Legacy MongoDB users may not contain new verification fields.
- Evidence: schema defines fields in [User.js](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/backend/models/User.js:9), but live DB inspection showed older records without those fields until resend repopulated them.
- File: [backend/models/User.js](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/backend/models/User.js:9)
- Line number: 9-13
- Why it happens: schema fields are optional and old records were created before the current verification flow wrote them.
- Recommended fix: migration/backfill job or lazy regeneration on login/resend before preview generation.

### Issue H

- Problem: JWT secret has insecure fallback behavior.
- Evidence: token signing uses fallback secret in [auth.js](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/backend/routes/auth.js:21); middleware verify uses fallback in [middleware/auth.js](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/backend/middleware/auth.js:8).
- File: [backend/routes/auth.js](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/backend/routes/auth.js:18), [backend/middleware/auth.js](/abs/path/C:/Users/user/Downloads/codearena-fixed_2/online-judge/backend/middleware/auth.js:7)
- Line number: backend auth 18-23, middleware 7-12
- Why it happens: convenience fallback for local dev.
- Recommended fix: require `JWT_SECRET` at startup and fail fast if missing.

This report should be enough for another senior engineer to continue directly from auth, verification, and mail integration without re-inspecting the repository.
