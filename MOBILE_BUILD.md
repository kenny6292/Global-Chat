# Global Chat — Mobile Build

Global Chat is structured as a responsive web app that can be packaged for Android and iOS with Capacitor.

## Build flow

1. Install dependencies.
2. Build the web app with `npm run build`.
3. Install Capacitor CLI/core and platform packages.
4. Run `npx cap add android` and/or `npx cap add ios`.
5. Run `npx cap sync`.
6. Open the native project with `npx cap open android` or `npx cap open ios`.
7. Build and test on physical devices.

## Production requirements

- Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
- Configure the dedicated Global Chat Supabase backend and execute the schema files.
- Configure Storage bucket/policies for chat media.
- Enable Realtime for messaging, communities, notifications and call signaling.
- Add production WebRTC/STUN/TURN infrastructure for reliable calls.
- Add real PWA icon assets at `public/icon-192.png` and `public/icon-512.png`.
- Test microphone, camera, file uploads, push notifications, authentication and background/foreground transitions on physical Android and iOS devices.
- Never ship a Supabase service-role or secret key inside the app.

## Current status

The repository contains the Capacitor configuration and mobile-ready web architecture. Native Android/iOS projects should be generated only after the backend environment is connected and the web build passes.
