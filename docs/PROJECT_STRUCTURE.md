# ScriptHub.id — Project Structure

## 📁 Monorepo Layout

```
C:\docker\next-js\scripthub.id\
│
├── backend/          → Express.js backend API (port 4000)
├── openapi/          → OpenAPI/Swagger service (port 4001)  
├── src/              → Next.js frontend (pages, components, hooks, lib)
├── public/           → Frontend static assets
├── docs/             → Project documentation (this folder)
│
├── package.json      → Frontend dependencies
├── next.config.ts    → Next.js configuration
├── tsconfig.json     → TypeScript config
├── Dockerfile        → Frontend Docker build
├── .env.local        → Local environment variables
└── .gitignore
```

## 🔗 Git Remotes

| Remote     | Repository                                          | Purpose           |
|------------|-----------------------------------------------------|--------------------|
| `deploy`   | https://github.com/valinciaeunha/sh-val.git         | Backend + OpenAPI  |
| `frontend` | https://github.com/valinciaeunha/sh-frontend.git    | Frontend (Next.js) |

> **Note:** This is a monorepo with 2 separate deployment repos. Each repo only receives its relevant files.

## 🖥️ Servers

| Server           | Hostname          | Path                    | Containers                                  |
|------------------|-------------------|-------------------------|----------------------------------------------|
| API Backend      | `api-scripthub`   | `/home/sezy/sh-val`     | `backend-scripthub`, `openapi-scripthub`, `scripthub_postgres`, `scripthub_redis` |
| Frontend         | `webscripthub`    | `/home/sh-frontend`     | `scripthub-frontend`                        |

## 🌐 Domains

| App          | Subdomain / URL                | Purpose         | Port |
| :----------- | :----------------------------- | :-------------- | :--- |
| **Frontend** | `https://scripthub.id`         | Main Application| 3000 |
| **Backend**  | `https://api.scripthub.id`     | Core REST API   | 4000 |
| **GetKey**   | `https://getfreekey.scripthub.id`| Get Key System  | 3000 |
