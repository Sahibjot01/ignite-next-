# Hotfix log

Running log of small, urgent fixes that don't warrant a full feature branch.
Branch `hotfix` stays alive across entries — don't delete it.

## 2026-08-16 — Raw crypto error on expired PSN refresh token

**Symptom:** Visiting `/library` with an expired PSN refresh token showed a raw
Node.js crash instead of a real message:

> Couldn't load your library: The "data" argument must be of type string or an
> instance of Buffer, TypedArray, or DataView. Received undefined

**Root cause:**

1. `psn_accounts.refresh_token_expires_at` had passed (refresh tokens die if
   unused for ~10 days — expected behavior, not itself a bug).
2. `node_modules/psn-api`'s `exchangeRefreshTokenForAuthTokens` calls
   `res.json()` on Sony's response and maps fields with **no `res.ok` check**.
   When Sony rejects an expired refresh token, the error payload has no
   `refresh_token` field, so the library returns
   `{ accessToken: undefined, refreshToken: undefined, ... }` instead of
   throwing.
3. [`getFreshAccessToken()`](src/lib/actions.ts) then called
   `encrypt(authTokenResp.refreshToken)` with `undefined`, which throws
   Node's raw crypto `TypeError` from inside `encrypt()`
   ([src/lib/psn.ts](src/lib/psn.ts)). That error got caught and surfaced via
   `getErrorMessage(err)` — but the message was the crypto internals, not
   anything about an expired session.

**Fix:**

- [`src/lib/actions.ts`](src/lib/actions.ts) — `getFreshAccessToken()` now
  checks `authTokenResp.accessToken` / `authTokenResp.refreshToken` right
  after the exchange call and returns
  `{ success: false, error: "Your PlayStation session expired — please relink your account in Settings." }`
  before ever reaching `encrypt()`.
- [`src/app/library/page.tsx`](src/app/library/page.tsx) — when the error is
  the session-expired message, it's shown as-is instead of being wrapped in
  the generic "Couldn't load your library: ..." prefix, since it's already a
  complete, actionable sentence.

**Verification:** Reproduced the exact crash message in isolation by
simulating psn-api's undefined-field response and feeding it through the old
`encrypt(undefined)` path (matches the live error verbatim), then confirmed
the new guard in `getFreshAccessToken` returns the clear message instead.
`npx tsc --noEmit` passes. Real end-to-end confirmation (letting a linked
account's token actually expire and reloading `/library`) still pending —
do that before fully trusting this in prod.
