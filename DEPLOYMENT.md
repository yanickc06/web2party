# Web2Party - Deployment auf Plesk mit PM2

## Voraussetzungen auf dem Server
- Node.js 18+ (über Plesk Extensions installieren)
- MySQL Datenbank
- PM2 (`npm install -g pm2`)

---

## 1. Datenbank erstellen

In Plesk unter "Datenbanken":
1. Neue MySQL-Datenbank erstellen (z.B. `web2party`)
2. Datenbankbenutzer erstellen
3. Zugangsdaten notieren

---

## 2. Projekt auf Server hochladen

```bash
# Option A: Git Clone
cd /var/www/vhosts/deine-domain.de/
git clone DEIN_REPO_URL web2party
cd web2party

# Option B: Dateien per SFTP hochladen
```

---

## 3. Environment-Variablen einrichten

```bash
# .env Datei erstellen
cp .env.production.example .env

# Datei bearbeiten und Werte anpassen:
nano .env
```

**Wichtige Werte:**
- `DATABASE_URL`: Deine MySQL-Zugangsdaten
- `AUTH_SECRET`: Generieren mit `openssl rand -base64 32`
- `NEXTAUTH_URL`: Deine Domain (mit https://)

---

## 4. Dependencies installieren & Build

```bash
# Dependencies installieren
npm install

# Datenbank-Tabellen erstellen
npm run db:push

# Production-Build erstellen
npm run build
```

---

## 5. Mit PM2 starten

```bash
# App starten
pm2 start ecosystem.config.js --env production

# Auto-Start bei Server-Neustart
pm2 save
pm2 startup
```

---

## 6. Nginx/Apache Proxy einrichten (in Plesk)

In Plesk unter "Apache & nginx Einstellungen":

### Nginx Proxy (empfohlen):
```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
}
```

---

## Nützliche PM2 Befehle

```bash
# Status prüfen
pm2 status

# Logs anzeigen
pm2 logs web2party

# Neustarten
pm2 restart web2party

# Stoppen
pm2 stop web2party

# Nach Code-Änderungen
npm run build
pm2 restart web2party
```

---

## Datenbank-Befehle

```bash
# Schema pushen (ohne Migrations)
npm run db:push

# Prisma Studio (Datenbank-GUI)
npm run db:studio

# Migration erstellen (für Production)
npx prisma migrate dev --name beschreibung
npm run db:migrate
```

---

## Troubleshooting

### App startet nicht
```bash
pm2 logs web2party --lines 50
```

### Datenbank-Verbindungsfehler
- Prüfe DATABASE_URL in .env
- Prüfe ob MySQL läuft
- Prüfe Firewall-Einstellungen

### 502 Bad Gateway
- Prüfe ob PM2 läuft: `pm2 status`
- Prüfe Port in Nginx-Config
