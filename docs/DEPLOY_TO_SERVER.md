# Deploy to Server

## 🔧 Backend Server (`api-scripthub`)

**SSH:** Login ke server `api-scripthub`

### Update OpenAPI Service
```bash
cd /home/sezy/sh-val
git fetch origin && git reset --hard origin/main

cd /home/sezy/sh-val/backend
docker compose up -d --build openapi-scripthub
```

### Update Backend Service
```bash
cd /home/sezy/sh-val
git fetch origin && git reset --hard origin/main

cd /home/sezy/sh-val/backend
docker compose up -d --build backend-scripthub
```

### Update Semua Backend Services
```bash
cd /home/sezy/sh-val
git fetch origin && git reset --hard origin/main

cd /home/sezy/sh-val/backend
docker compose up -d --build
```

### Cek Status & Logs
```bash
docker ps                                    # Lihat semua container
docker logs -f --tail 100 openapi-scripthub  # Logs OpenAPI (live)
docker logs -f --tail 100 backend-scripthub  # Logs Backend (live)
docker logs --tail 50 scripthub_postgres     # Logs Database
```

### Kalau Container Error (Name Conflict)
```bash
docker stop openapi-scripthub && docker rm openapi-scripthub
cd /home/sezy/sh-val/backend
docker compose up -d openapi-scripthub
```

---

## 🌐 Frontend Server (`webscripthub`)

**SSH:** Login ke server `webscripthub`

### Update Frontend
```bash
cd /home/sh-frontend
git fetch origin && git reset --hard origin/main
docker build -t scripthub-frontend .
docker stop scripthub-frontend && docker rm scripthub-frontend
docker run -d --name scripthub-frontend -p 3000:3000 scripthub-frontend
```

### Cek Status & Logs
```bash
docker ps                                      # Lihat container
docker logs -f --tail 100 scripthub-frontend   # Logs frontend (live)
```

---

## 📋 Full Deploy Flow (End-to-End)

### 1. Push changes dari PC lokal
Lihat → [PUSH_TO_GITHUB.md](./PUSH_TO_GITHUB.md)

### 2. SSH ke server yang relevan

### 3. Pull & rebuild
- Backend: `git reset --hard origin/main` + `docker compose up -d --build`
- Frontend: `git reset --hard origin/main` + `docker build` + `docker run`

### 4. Verifikasi
- Backend API: `curl https://api.scripthub.id/api/health`
- Frontend: Buka `https://scripthub.id`
- Logs: `docker logs -f --tail 50 <container_name>`

---

## ⚠️ Troubleshooting

| Problem | Solution |
|---------|----------|
| `no configuration file provided` | Pastikan `cd` ke folder yang ada `docker-compose.yml` (`/home/sezy/sh-val/backend`) |
| Container name conflict | `docker stop <name> && docker rm <name>`, lalu jalankan ulang |
| `divergent branches` | Gunakan `git reset --hard origin/main` bukan `git pull` |
| Build gagal | Cek `docker logs <container>`, pastikan `package.json` valid |
