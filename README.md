# NestJS + Angular — environnement de développement local

Monorepo avec un back NestJS (`back/`), un front Angular (`front/`) et une base PostgreSQL, le tout lancé par Docker Compose.

## Prérequis

- Docker et Docker Compose v2

Aucune installation locale de Node n'est nécessaire pour faire tourner l'environnement.

## Démarrage rapide

```bash
cp .env.example .env   # optionnel : des valeurs par défaut existent
docker compose up --build
```

| Service    | URL / accès                    | Description                         |
| ---------- | ------------------------------ | ----------------------------------- |
| front      | http://localhost:4200          | Angular (`ng serve`)                |
| back       | http://localhost:3002          | NestJS en mode watch                |
| postgres   | `localhost:5432`               | PostgreSQL 17                       |

Le premier lancement construit les images (installation des dépendances) : comptez quelques minutes.

## Base de données

Au premier démarrage du container `postgres`, la base est créée automatiquement avec les valeurs du `.env` :

| Variable      | Défaut     |
| ------------- | ---------- |
| `DB_USER`     | `postgres` |
| `DB_PASSWORD` | `postgres` |
| `DB_NAME`     | `app`      |
| `DB_PORT`     | `5432`     |

- Les données sont conservées dans le volume Docker `pgdata`.
- Les migrations TypeORM s'exécutent automatiquement au démarrage du back (`migrationsRun: true`).
- Connexion depuis l'hôte : `psql -h localhost -U postgres -d app`
- Ou dans le container : `docker compose exec postgres psql -U postgres -d app`

> Les variables `DB_USER`, `DB_PASSWORD` et `DB_NAME` ne sont prises en compte qu'à la **création** du volume. Après les avoir modifiées, repartez de zéro : `docker compose down -v`.

## Utilisation au quotidien

```bash
docker compose up -d              # démarrer en arrière-plan
docker compose logs -f back       # suivre les logs d'un service (back, front, postgres)
docker compose ps                 # état des services
docker compose restart back       # redémarrer un service
docker compose down               # arrêter (les données sont conservées)
docker compose down -v            # arrêter et supprimer les données (base + node_modules)
```

### Rechargement à chaud

Les dossiers `back/` et `front/` sont montés dans les containers : toute modification du code est prise en compte automatiquement (watch NestJS, rechargement Angular).

### Ajouter une dépendance npm

Les `node_modules` vivent dans des volumes Docker, pas sur votre machine. Installez donc les paquets dans le container, puis reconstruisez :

```bash
docker compose exec back npm install <paquet>
docker compose exec front npm install <paquet>
docker compose up -d --build     # si le package.json a changé
```

Si vous modifiez `package.json` à la main, lancez `docker compose up --build -V` pour renouveler le volume `node_modules`.

### Migrations TypeORM

À exécuter dans le container `back` :

```bash
docker compose exec back npm run migration:generate -- src/database/migrations/NomMigration
docker compose exec back npm run migration:create -- src/database/migrations/NomMigration
docker compose exec back npm run migration:run
docker compose exec back npm run migration:revert
docker compose exec back npm run migration:show
```

### Tests et lint

```bash
docker compose exec back npm test
docker compose exec back npm run test:e2e
docker compose exec back npm run lint
docker compose exec front npm test
```

## Configuration

Toutes les variables se définissent dans `.env` (voir `.env.example`) :

| Variable      | Défaut     | Rôle                         |
| ------------- | ---------- | ---------------------------- |
| `FRONT_PORT`  | `4200`     | Port du front sur l'hôte     |
| `BACK_PORT`   | `3002`     | Port du back sur l'hôte      |
| `DB_PORT`     | `5432`     | Port de Postgres sur l'hôte  |
| `DB_USER`     | `postgres` | Utilisateur Postgres         |
| `DB_PASSWORD` | `postgres` | Mot de passe Postgres        |
| `DB_NAME`     | `app`      | Nom de la base               |

Si un port est déjà utilisé sur votre machine (erreur `port is already allocated`), changez-le dans `.env`.

Le back autorise les appels CORS depuis l'URL du front (`http://localhost:${FRONT_PORT}`).

## Structure

```
.
├── docker-compose.yml   # postgres + back + front
├── .env.example
├── back/                # NestJS + TypeORM (Dockerfile)
└── front/               # Angular (Dockerfile)
```

## Développer sans Docker pour le back / front

Il est possible de ne lancer que la base dans Docker et le reste en local :

```bash
cd back && npm run db:up      # démarre uniquement postgres
cd back && cp .env.example .env && npm install && npm run start:dev
cd front && npm install && npm start
```
