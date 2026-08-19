# CloudProcure Frontend

Next.js 16.2.11, React 19 and TypeScript application for the CloudProcure academic baseline. The browser communicates only with the API Gateway; it never calls a business service directly.

## Submission identity

- Student Name: `<STUDENT_NAME>`
- Student Number: `<STUDENT_NUMBER>`
- Slack Handle: `<SLACK_HANDLE>`
- GCP Project ID: `<GCP_PROJECT_ID>`
- Deployed Application URL: `<CLOUD_RUN_FRONTEND_URL>`

## Local development

```powershell
Copy-Item .env.example .env.local
npm ci
npm run dev
```

The local/demo profile shows a seeded actor selector so lifecycle actions retain `requestedBy`, `approvedBy`, `uploadedBy` and activity `actor` values without implementing authentication.

## Verification

```powershell
npm test
npm run lint
npm run build
```

## Build-time configuration

`NEXT_PUBLIC_API_BASE_URL` and `NEXT_PUBLIC_APP_PROFILE` are public build-time values. They must be set before `next build` or supplied as Docker build arguments. Changing a Cloud Run runtime variable does not modify values already compiled into the browser bundle.

For production builds, set `NEXT_PUBLIC_APP_PROFILE=production`. This removes the development actor selector and prevents the API client from attaching development actor headers.

```powershell
docker build `
  --build-arg NEXT_PUBLIC_API_BASE_URL=https://gateway.example.com `
  --build-arg NEXT_PUBLIC_APP_PROFILE=production `
  -t cloudprocure-frontend .
```

The multi-stage image copies the standalone server, `.next/static`, and `public`, then runs as the non-root `nextjs` user on port 8080.
