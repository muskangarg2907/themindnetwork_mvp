# TheMindNetwork Backend

Simple Express backend to store profile data in a local JSON file.

Quick start (recommended: Docker + Postgres)

1) Start Postgres with Docker Compose (from `backend/`):

```powershell
cd backend
docker compose up -d
```

2) Install dependencies and run the server (PowerShell):

```powershell
cd backend
npm install
cp .env.example .env
npm start
```

The server defaults to `http://localhost:4000` and exposes these endpoints:

- `GET /api/health` – health check (also checks DB)
- `GET /api/profiles` – list all profiles
- `GET /api/profiles/:id` – get profile by id
- `POST /api/profiles` – create profile (JSON body)
- `PUT /api/profiles/:id` – update profile (JSON body)
- `DELETE /api/profiles/:id` – delete profile

Example create (PowerShell):

```powershell
curl -X POST http://localhost:4000/api/profiles -H "Content-Type: application/json" -d '{"name":"Alice","role":"provider"}'
```

Notes:
- Data is now stored in Postgres (containerized via `docker-compose.yml`).
- The server will create the `profiles` table automatically if missing.
- CORS is enabled so your frontend can call `http://localhost:4000`.

Next steps I can take for you:
- Add migrations and a small ORM (Knex/TypeORM/Prisma) for more advanced schemas.
- Add authentication (JWT) and validation.
- Update frontend `services/geminiService.ts` or add an `apiService.ts` to send profile data directly to these endpoints.

