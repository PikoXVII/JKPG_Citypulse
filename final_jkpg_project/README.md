# CityPulse / JkpgCity course project

CityPulse is a course project for *Web Development - Advanced Concepts* built with:
- Node.js + Express
- PostgreSQL
- Vanilla HTML, CSS and JavaScript
- Docker / docker-compose

The project matches the assignment focus: backend, REST API, database, Docker deployment, frontend with venues/information and interactive design.

## What is included

### Grade 3 requirements
- Node.js backend and frontend setup
- REST API between frontend and backend
- Venues loaded from database and rendered in the frontend

### Grade 4 requirements
- Sort, add, remove and edit venues from frontend forms
- Database runs in Docker

### Grade 5 requirements
- Admin login required before editing venues
- Extended venue dataset
- Backend also runs in Docker

## Main improvements in this version
- Automatic bootstrap on startup
  - creates database tables
  - creates/updates the admin account
  - seeds events
  - seeds venues from an extended dataset
- Extended dataset based on `data/stores.json`
- Better local database fallback in `backend/db.js`
- Unified district naming (`Resecentrum`)
- Added `.gitignore`

## Run with Docker

```bash
docker compose up --build
```

Open:
- Frontend: http://localhost:3000
- Admin: http://localhost:3000/admin.html

Default admin login:
- Email: `admin@citypulse.local`
- Password: `admin123`

These values can be changed in `docker-compose.yml`.

## Run locally

1. Create a local Postgres database
2. Copy `.env.example` to `.env`
3. Update the database values if needed
4. Install dependencies and start

```bash
npm install
npm start
```

The application now bootstraps itself on startup, so you do not need to run a separate migration/seed step.

## API overview

### Auth
- `POST /api/auth/login`

### Venues
- `GET /api/venues`
  - query params: `q`, `category`, `district`, `sort`
- `GET /api/venues/:id`
- `POST /api/venues` (requires Bearer token)
- `PUT /api/venues/:id` (requires Bearer token)
- `DELETE /api/venues/:id` (requires Bearer token)

### Events
- `GET /api/events`
- `POST /api/events` (requires Bearer token)

## Project structure

```text
backend/
  auth.js
  bootstrap.js
  db.js
  migrate.js
  seed.js

data/
  stores.json

public/
  admin.html
  districts.html
  events.html
  index.html
  info.html
  venues.html
  css/
  js/

Dockerfile
docker-compose.yml
server.js
```
