# ScriptHub.id

ScriptHub.id is a comprehensive platform for indexing, viewing, and managing Roblox and other game scripts. It features a Next.js 15 (App Router) Frontend and a scalable Node.js/Express Backend with PostgreSQL and Redis.

## 🚀 Production Deployment Architecture

This project is built to be deployed across **two separate servers** using Docker to ensure high availability, security, and performance.

### 1. Server Architecture Overview

-   **Server 1 (Frontend Edge):** Hosts the Next.js application frontend. Exposed to the internet via Cloudflare.
-   **Server 2 (Backend Engine):** Hosts the Node.js API, PostgreSQL database, and Redis cache. Exposed securely to the frontend and specific incoming API routes.

---

## 💻 Server 1: Frontend Deployment

This server runs the user-facing Next.js application.

### Prerequisites (Server 1)

-   Docker and Docker Compose installed.
-   Git installed.
-   A `.env` file containing your production frontend variables.

### Environment (.env)

Create a `.env` file in the root directory of the frontend server:

```env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://scripthub.id
# Point this to Server 2's IP or Domain
NEXT_PUBLIC_API_URL=https://api.scripthub.id
NEXT_PUBLIC_API_BASE_URL=https://api.scripthub.id/api
NEXT_PUBLIC_CDN_BASE_URL=https://api.scripthub.id/v1
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_cloudflare_turnstile_site_key
NEXT_PUBLIC_DISCORD_CLIENT_ID=your_discord_client_id
# ... add other necessary keys from .env.example
```

### Build & Run (Server 1)

The frontend uses a Next.js multi-stage Docker build for a highly optimized standalone Next.js server.

1.  **Clone the repository on Server 1:**
    ```bash
    git clone https://github.com/valincia19/sh.id-v1.git
    cd sh.id-v1
    ```
2.  **Build and start the container:**
    ```bash
    docker build -t scripthub-frontend:latest .
    docker run -d -p 3000:3000 --name sh-frontend --restart unless-stopped --env-file .env scripthub-frontend:latest
    ```
3.  **Proxying:** Setup an NGINX reverse proxy (or Cloudflare Tunnel) to route `443/80` traffic to `localhost:3000`.

---

## ⚙️ Server 2: Backend & Database Deployment

This server runs the `openapi` (backend API), PostgreSQL, and Redis.

### Prerequisites (Server 2)

-   Docker and Docker Compose installed.
-   Git installed.

### Environment (backend/.env)

Navigate to the `backend` directory and configure your backend environment variables securely. Make sure to generate secure random strings for secrets.

```bash
cd sh.id-v1/backend
cp .env.example .env
nano .env # Edit the configuration
```

Make sure your database connection strings, JWT secrets, Discord client secrets, and S3 credentials are correct. **Ensure the CORS settings allow traffic from Server 1's domain (`https://scripthub.id`).**

### Build & Run (Server 2)

The backend runs entirely off `docker-compose.yml`. It will automatically spin up the PostgreSQL database, Redis instance, and Node.js API container.

1.  **Clone the repository on Server 2 (or pull latest):**
    ```bash
    git clone https://github.com/valincia19/sh.id-v1.git
    cd sh.id-v1/backend
    ```
2.  **Start all services using Docker Compose:**
    ```bash
    # This detaches the process and automatically builds the node image if missing
    docker-compose up -d --build
    ```
3.  **Verify Services are running:**
    ```bash
    docker-compose ps
    docker-compose logs -f api
    ```

### Database Migration

On first startup or when updating the database schema, run the migrations inside the running backend container:

```bash
docker-compose exec api npm run migrate
# Optional: To seed the database with initial required data (e.g. Roles/Permissions)
docker-compose exec api npm run seed
```

### Exposing the API

Set up an NGINX proxy on Server 2 to point to the backend container's exposed port (usually `4000` or `3001` depending on `docker-compose.yml`) and map it to your API subdomain (`api.scripthub.id`).

---

## 🛠️ Maintenance & Updating

### Updating Frontend (Server 1)
```bash
cd sh.id-v1
git pull origin main
docker build -t scripthub-frontend:latest .
docker stop sh-frontend
docker rm sh-frontend
docker run -d -p 3000:3000 --name sh-frontend --restart unless-stopped --env-file .env scripthub-frontend:latest
```

### Updating Backend (Server 2)
```bash
cd sh.id-v1/backend
git pull origin main
docker-compose up -d --build
```
