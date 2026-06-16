# Firebase Auth — radhikatmosphere

GCP project: **radhikatmosphere**

## Authorized domains (Firebase Console)

Authentication → Settings → Authorized domains — add:

- `radhikachain.xyz`
- `www.radhikachain.xyz`
- `axiom-stem.pages.dev`
- `axiom.radhikachain.xyz`
- `localhost`

## Google OAuth (Google Cloud Console)

Credentials → OAuth Web client:

- **JavaScript origins:** `https://radhikachain.xyz`, `https://www.radhikachain.xyz`, `https://axiom-stem.pages.dev`
- **Redirect URI:** `https://radhikatmosphere.firebaseapp.com/__/auth/handler`

## Flow

1. User clicks **Google** on AXIOM or `/login` on radhikachain.xyz
2. Firebase SDK → Google popup → `idToken`
3. Worker verifies: `POST https://radhikachain.xyz/api/auth/firebase`
4. Session stored locally (AXIOM) or redirected (main site)

## Deploy main site worker

```bash
cd radhikachain-site && npm run deploy
# Requires wrangler auth on the account that owns radhikachain.xyz zone
```

## Deploy AXIOM

```bash
cd axiom && npm run pages:deploy
```