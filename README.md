# node-it

A dockerized monorepo for a node-based notes web app.

## Stack

- **Frontend**: Next.js (App Router) + Zustand
- **Backend**: Node.js + Express + Prisma
- **Database**: PostgreSQL
- **Infra**: Docker Compose

## Project Structure

```text
node-it/
├── docker-compose.yml
├── .env.example
├── frontend/
├── backend/
└── database/
```

## Quick Start

1. Copy env values:

```bash
cp .env.example .env
```

2. Start all services:

```bash
docker compose up --build
```

3. Open apps:

- Frontend: http://localhost:3000
- Backend: http://localhost:4000
- Postgres: localhost:5432

## Core UX Implemented

- Category builder with custom field schema (`text`, `number`, `currency`, `boolean`, `date`)
- Node tree view with collapse/expand behavior
- Click node to select insertion context for child nodes
- Node form shown beside tree to enter typed field values and add nodes with Enter
- Explorer tab for table-style inspection of all nodes

## Backend API

- `GET /health`
- `GET /categories`
- `POST /categories`
- `GET /categories/:id/tree`
- `POST /categories/:id/nodes`
- `PATCH /nodes/:id/collapse`
- `GET /nodes/:id`

## Notes

- Backend container runs `prisma db push` on startup to sync schema in local/dev Docker usage.
- For production, prefer managed migrations (`prisma migrate deploy`) and CI/CD pipeline integration.
