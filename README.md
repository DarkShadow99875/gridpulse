# GridPulse - Guida Rapida

## Come avviare l'app (Windows)

### 1. Configurazione Environment (`.env`)

Il progetto supporta la configurazione del database **tramite variabili d'ambiente** in base al profilo.

1. Copia il file di esempio:
   ```powershell
   cd C:\Users\micke\Documents\progetti\gridpulse
   copy .env.example .env
   ```

2. Apri `.env` e modifica le credenziali se necessario (soprattutto per produzione).

> **Importante**: il file `.env` è ignorato da Git (contiene password).

### 2. Migrazioni Database (Flyway)

Il progetto usa **Flyway** per gestire lo schema del database in modo versionato e sicuro.

- Gli script SQL si trovano in: `backend/src/main/resources/db/migration/`
- Il primo script (`V1__Create_initial_tables.sql`) crea le tabelle `energy_plants` e `metrics` + indici.
- Flyway tiene traccia delle migrazioni eseguite nella tabella `flyway_schema_history`.

**Non serve fare nulla manualmente** — Flyway viene eseguito automaticamente all'avvio dell'applicazione.

Se vuoi creare nuove tabelle/colonne in futuro, basta aggiungere un nuovo file:
`V2__Descrizione_della_modifica.sql`

### 3. Database (PostgreSQL via Docker)

Avvia il database:

```powershell
docker compose up -d
```

Controlla lo stato:
```powershell
docker compose ps
```

Docker Compose legge automaticamente le variabili da `.env` (se presente).

### 4. Backend (Spring Boot) — con Profili

Il profilo determina **quale database** viene usato:

| Profilo   | Comando (PowerShell)                                      | Quando usarlo                     |
|-----------|-----------------------------------------------------------|-----------------------------------|
| `local`   | `mvn spring-boot:run -Dspring-boot.run.profiles=local`    | **Sviluppo quotidiano** (consigliato) |
| `prod`    | `mvn spring-boot:run -Dspring-boot.run.profiles=prod`     | Simulazione ambiente produzione   |
| `h2`      | `mvn spring-boot:run -Dspring-boot.run.profiles=h2`       | Demo rapidissima senza Docker     |

**Esempio di avvio normale (locale):**

```powershell
cd C:\Users\micke\Documents\progetti\gridpulse\backend
mvn clean install -DskipTests
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

Oppure usa lo script helper che carica automaticamente `.env`:

```powershell
cd C:\Users\micke\Documents\progetti\gridpulse
.\start-local.ps1
```

Aspetta `Started GridpulseApplication...`

> Con il profilo `local` (o default) i dati demo vengono creati **solo la prima volta**. Ai riavvii successivi restano i tuoi dati.

### 5. Frontend (Vite + React)

Apri un **nuovo PowerShell** e fai:

```powershell
cd C:\Users\micke\Documents\progetti\gridpulse\frontend
npm install
npm run dev
```

Poi apri il browser su: **http://localhost:5173**

---

## Struttura del progetto (adesso completa)

```
gridpulse/
├── backend/
│   ├── pom.xml
│   └── src/main/resources/
│       ├── application.yml        ← Config base con placeholder ${VAR}
│       ├── application-local.yml  ← Profilo sviluppo (PostgreSQL)
│       ├── application-prod.yml   ← Profilo produzione (sicuro)
│       ├── application-h2.yml     ← Profilo demo zero-config (H2)
│       └── db/migration/
│           └── V1__Create_initial_tables.sql  ← Schema gestito con Flyway
│
├── docker-compose.yml             ← PostgreSQL + supporto .env
├── .env.example                   ← Variabili d'ambiente (da copiare in .env)
├── .gitignore
├── start-local.ps1                ← Script helper che carica .env + profilo local
│
│ Flyway gestisce le migrazioni (db/migration)
│
├── backend/target/...             ← (generato)
│
├── frontend/
│   ├── package.json               ← Dipendenze React + Vite
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx                ← Navigazione completa
│       ├── pages/
│       │   ├── Dashboard.tsx
│       │   ├── AiInsights.tsx
│       │   ├── AiChat.tsx
│       │   └── EsgReport.tsx
│       └── index.css
│
└── README.md
```

Il database viene scelto in base al profilo Spring attivo (`local`, `prod` o `h2`).  
Lo schema è gestito da **Flyway** (script SQL versionati in `db/migration`). Usa `.env` per le credenziali.
