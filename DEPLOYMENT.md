# Deployment Guide

## Part 1 — Local machine (every time you make changes)

```bash
cd c:/laragon/www/manager_sim1
git add .
git commit -m "your message here"
git push origin main
```

---

## Part 2 — VPS first-time setup (run once only)

**SSH in:**
```bash
ssh root@161.97.86.96
```

**Install Docker:**
```bash
curl -fsSL https://get.docker.com | sh
```

**Clone the repo:**
```bash
git clone https://github.com/TLSZK/manager_sim.git
cd manager_sim
```

**Create the secrets file:**
```bash
nano .env
```

Paste this, fill in your Gemini key, then Ctrl+O > Enter > Ctrl+X to save:
```
APP_KEY=base64:lrJYzNd0Jyh/ibrYzBgevn1sFoxTR4iHQdmeXDfV6TE=
VITE_GEMINI_API_KEY=your_real_gemini_key_here
DB_ROOT_PASSWORD=production_root_password
DB_PASSWORD=production_app_password
```

**Build and start:**
```bash
docker compose up -d --build
```

**Seed the database:**
```bash
docker compose exec backend php artisan db:seed
```

Done. Site is live at http://161.97.86.96

---

## Part 3 — Updating the server after code changes

```bash
ssh root@161.97.86.96
cd manager_sim
git pull
docker compose up -d --build
```

---

## Useful commands

| What                  | Command                                                        |
|-----------------------|----------------------------------------------------------------|
| View live logs        | docker compose logs -f                                         |
| View backend logs     | docker compose logs -f backend                                 |
| Restart everything    | docker compose restart                                         |
| Stop everything       | docker compose down                                            |
| Force full rebuild    | docker compose build --no-cache && docker compose up -d        |
| Run migrations        | docker compose exec backend php artisan migrate                |
| Seed database         | docker compose exec backend php artisan db:seed                |
| Laravel shell         | docker compose exec backend php artisan tinker                 |
