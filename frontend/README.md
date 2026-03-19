# Frontend Deployment Guide

This frontend is a Vite + React single-page app.

## 1. Environment Variables
Create a `.env` file from `.env.example` and set:

- `VITE_API_BASE_URL`: Public base URL of your backend API (for example `https://api.example.com/api`).

For local development, if this variable is not set, requests fall back to `/api` and use the Vite dev proxy configured in `vite.config.ts`.

## 2. Build
```bash
npm install
npm run build
```

Build output is generated in `dist/`.

## 3. Production Preview (Optional)
```bash
npm run preview
```

This serves the production build on port `4173` and binds to `0.0.0.0`.

## 4. SPA Routing Support
This app uses client-side routing. The following files are included so deep links work in production:

- `public/_redirects` for Netlify
- `vercel.json` for Vercel

If you deploy with Nginx/Apache/other hosts, configure rewrites to route unknown paths to `index.html`.

## 5. Deploy Dist Folder
Deploy the contents of `dist/` to your static host/CDN.
