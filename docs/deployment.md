# Ghid Deployment Producție — AEP Instruire Online

## Cerințe infrastructură

- Server Linux (Ubuntu 22.04+ recomandat)
- Node.js 20+
- PostgreSQL 16+
- Nginx (reverse proxy)
- SSL/TLS certificat (Let's Encrypt sau corporativ)
- SMTP server pentru email

## Variabile de mediu producție (.env)

```env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://instruire.aep.ro

# Baza de date
DATABASE_PROVIDER=postgresql
DATABASE_URL=postgresql://aep_prod:PAROLA_PUTERNICA@localhost:5432/aep_instruire_prod

# Securitate — SCHIMBAȚI OBLIGATORIU!
JWT_SECRET=<openssl rand -hex 32>
SESSION_MAX_AGE=86400

# Email producție
EMAIL_HOST=smtp.aep.ro
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=noreply@aep.ro
EMAIL_PASS=<parola_smtp>
EMAIL_FROM=noreply@aep.ro
EMAIL_FROM_NAME=AEP Instruire Online

# Stocare fișiere (MinIO sau S3)
STORAGE_TYPE=minio
S3_ENDPOINT=https://minio.aep.ro
S3_BUCKET=aep-uploads
S3_ACCESS_KEY=<access_key>
S3_SECRET_KEY=<secret_key>

# OTP
OTP_EXPIRES_MINUTES=10
OTP_MAX_ATTEMPTS=5
AUTH_MAX_FAILED_ATTEMPTS=5
AUTH_LOCKOUT_MINUTES=15
```

## Pași deployment

```bash
# 1. Clonați repository-ul
git clone https://github.com/your-org/aep-instruire-online.git
cd aep-instruire-online

# 2. Instalați dependențele (fără dev)
npm ci --only=production

# 3. Generați Prisma Client
npx prisma generate

# 4. Rulați migrările
npx prisma migrate deploy

# 5. Seed date inițiale (prima dată)
npm run db:seed

# 6. Build producție
npm run build

# 7. Porniți cu PM2
pm2 start npm --name "aep-instruire" -- start
pm2 save
pm2 startup
```

## Configurare Nginx

```nginx
server {
    listen 443 ssl http2;
    server_name instruire.aep.ro;

    ssl_certificate /etc/ssl/certs/aep.crt;
    ssl_certificate_key /etc/ssl/private/aep.key;

    # Securitate headers
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;

    # Upload limite
    client_max_body_size 60M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }

    # Fișiere statice cache
    location /_next/static {
        proxy_pass http://localhost:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}

server {
    listen 80;
    server_name instruire.aep.ro;
    return 301 https://$host$request_uri;
}
```

## Backup baza de date

```bash
# Backup zilnic (crontab)
0 2 * * * pg_dump aep_instruire_prod | gzip > /backups/aep_$(date +%Y%m%d).sql.gz

# Restore
gunzip -c backup.sql.gz | psql aep_instruire_prod
```

## Actualizare aplicație

```bash
git pull origin main
npm ci --only=production
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 restart aep-instruire
```

## Monitorizare

```bash
# Loguri aplicație
pm2 logs aep-instruire

# Status
pm2 status

# Monitoring real-time
pm2 monit
```
