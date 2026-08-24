# ProcureFlow Frontend

Frontend application for the **ProcureFlow Enterprise Procurement System**, developed for the ITS 2130 - Enterprise Cloud Architecture final project.

## Student Information

- **Student Name:** Thenuri Nethangi Nanayakkara
- **Student ID:** 241711017
- **Module:** ITS 2130 - Enterprise Cloud Architecture

## Google Cloud Project

- **Project Name:** ProcureFlow ECA
- **Project ID:** `procureflow-eca`
- **Primary Region:** `us-central1`

## Live Application

https://procureflow-frontend-7vni4yihhq-uc.a.run.app

## Technology

- Next.js
- React
- TypeScript
- Docker
- Google Cloud Run

## Application Features

The frontend provides interfaces for:

- Dashboard
- Purchase Requests
- Suppliers
- Supplier Catalog
- Purchase Orders
- Activity / Audit Events
- Purchase Request Attachments

## Deployment

The frontend is containerized and deployed to **Google Cloud Run**.

Application API requests are routed through the deployed backend architecture:

## Setup / Getting Started

### Prerequisites

- Node.js 24
- npm

### Install Dependencies

```bash
npm ci
```

### Run Locally

```bash
npm run dev
```

The local application is available at:

```text
http://localhost:3000
```

### Test and Lint

```bash
npm test
npm run lint
```

### Production Build

```bash
npm run build
npm start
```

The production application is containerized using Docker and deployed to Google Cloud Run through GitHub Actions.

```text
Browser
   |
   v
Cloud Run Frontend
   |
   v
External Load Balancer
   |
   v
API Gateway
   |
   v
Eureka Service Discovery
   |
   v
Procurement / Supplier / Order Services
