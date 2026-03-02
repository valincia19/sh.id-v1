# SOP Production Maintenance & Best Practices

Dokumen ini berisi Standard Operating Procedure (SOP) dan praktik terbaik untuk menjaga stabilitas, kebersihan, dan keamanan sistem ScriptHub di environment produksi.

## 1. Manajemen Dependency (Rutin Bulanan)
- **Frontend & Backend**: Jalankan audit rutin menggunakan `npm audit` untuk mendeteksi kerentanan keamanan pada package.
- **Pembersihan**: Gunakan `npx depcheck` setiap akhir sprint/bulan untuk menemukan dependency yang tidak terpakai. 
  - *Catatan:* Periksa ulang hasil depcheck, karena beberapa package (seperti `tailwindcss` atau `@types/node`) mungkin terdeteksi tidak dipakai padahal dibutuhkan saat build-time.
- **Update**: Lakukan update minor/patch secara berkala (`npm update`). Untuk update mayor, lakukan pengujian menyeluruh di staging sebelum ke produksi.

## 2. Pembersihan Aset & Dead Code
- **Aset Statik**: Pastikan folder `public/` hanya berisi gambar/aset yang direferensikan di dalam kode. Hapus file template bawaan framework (seperti `vercel.svg`, `next.svg` bawaan Next.js) jika menggunakan branding sendiri.
- **Dead Code**: Gunakan fitur IDE (seperti "Find all references") atau tool linting untuk mendeteksi komponen atau endpoint API yang tidak lagi dipanggil. Hapus kode tersbut daripada mengumpulkan hutang teknis (technical debt).

## 3. Prosedur Deployment & Backup (Zero Downtime)
- **Backup Database**: Sebelum menjalankan migrasi skema database yang destruktif (ALTER/DROP), selalu buat dump database:
  ```bash
  docker exec scripthub_postgres pg_dump -U scripthub_user scripthub > backup_YYYYMMDD.sql
  ```
- **Backup File System**: Jika melakukan perombakan besar pada struktur file atau menghapus aset, buat arsip lokal sementara:
  ```bash
  tar -czvf backup_app_YYYYMMDD.tar.gz src/ public/
  ```
- **Rollback**: Jika deployment gagal atau menyebabkan 500 Internal Server Error, segera revert commit terakhir (`git revert`) atau pulihkan docker container ke image/tag versi sebelumnya, lalu restore database dump jika ada migrasi yang bermasalah.

## 4. Keamanan & Rate Limiting (Stabilitas Server)
- **Monitoring Limit**: Pastikan middleware rate limiter (`express-rate-limit`) aktif di endpoint krusial (seperti validasi Get Key, Login, dan Register) untuk mencegah brute-force dan serangan DDoS skala kecil.
- **CORS & Origin**: Pastikan konfigurasi CORS di backend ketat dan hanya mengizinkan `frontendUrl` dan `getkeyUrl` yang sah (`localhost:3000` / `getfreekey.localhost:3000` di dev, atau URL `.scripthub.id` di prod).
- **Environment Variables**: Jangan pernah hardcode secret key (Turnstile secret, JWT secret) di dalam kode sumber repositori. Selalu gunakan file `.env`.

## 5. Pemeriksaan Kesehatan Sistem (Health Checks)
- Gunakan endpoint GET `/health` (jika ada) untuk memicu ping dari platform monitoring (seperti UptimeRobot) agar bisa segera tahu jika backend mati.
- Cek log backend minimal seminggu sekali (`docker logs backend-scripthub --tail 100`) untuk memantau error tersembunyi ("Unhandled Promise Rejection" dll).
