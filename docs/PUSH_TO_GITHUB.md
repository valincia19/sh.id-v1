# Push to GitHub

## ⚠️ Important Rules

- **JANGAN** pakai `git push` langsung — itu akan push seluruh monorepo
- Gunakan **branch khusus** per-repo supaya file yang masuk benar

---

## 🔧 Backend (sh-val)

Push hanya `backend/` dan `openapi/` ke https://github.com/valinciaeunha/sh-val

### Step 1: Checkout branch lama dari remote
```bash
git fetch deploy
git checkout -b push-val deploy/main
```

### Step 2: Apply perubahan dari branch kerja
```bash
# Ganti file yang berubah saja, contoh:
git checkout temp-deploy-backend -- openapi/src/modules/keys/keys.controller.js
git checkout temp-deploy-backend -- backend/src/modules/admin/admin.controller.js
```

### Step 3: Commit & Push
```bash
git commit -m "fix: deskripsi perubahan"
git push deploy push-val:main
```

### Step 4: Kembali ke branch kerja
```bash
git checkout temp-deploy-backend
git branch -D push-val
```

---

## 🌐 Frontend (sh-frontend)

Push hanya file frontend ke https://github.com/valinciaeunha/sh-frontend

### Step 1: Checkout branch lama dari remote
```bash
git fetch frontend
git checkout -b push-frontend frontend/main
```

### Step 2: Apply perubahan dari branch kerja
```bash
# Ganti file yang berubah saja, contoh:
git checkout temp-deploy-backend -- "src/app/(main)/api-docs/page.tsx"
git checkout temp-deploy-backend -- src/components/SomeComponent.tsx
```

### Step 3: Commit & Push
```bash
git commit -m "fix: deskripsi perubahan"
git push frontend push-frontend:main
```

### Step 4: Kembali ke branch kerja
```bash
git checkout temp-deploy-backend
git branch -D push-frontend
```

---

## 🚀 Quick Reference (Copy-Paste)

### Push backend changes:
```bash
git fetch deploy && git checkout -b push-val deploy/main
git checkout temp-deploy-backend -- path/to/changed/file.js
git commit -m "fix: description"
git push deploy push-val:main
git checkout temp-deploy-backend && git branch -D push-val
```

### Push frontend changes:
```bash
git fetch frontend && git checkout -b push-frontend frontend/main
git checkout temp-deploy-backend -- "path/to/changed/file.tsx"
git commit -m "fix: description"
git push frontend push-frontend:main
git checkout temp-deploy-backend && git branch -D push-frontend
```
