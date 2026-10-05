# Environnement de développement Docker

Ce dépôt contient un back NestJS (`back/`), un front Angular (`front/`) et une base PostgreSQL. Tout se lance avec Docker Compose pour développer en local, sans rien installer d'autre que Docker.

## Prérequis

- Docker et Docker Compose v2

## Lancer l'environnement

```bash
cp .env.example .env   # optionnel : des valeurs par défaut existent
make start
```

`make start` exécute `docker compose up --build`. Pour tout arrêter (back, front et base) : `make stop` (équivalent de `docker compose down`, les données sont conservées). Voir le `Makefile`.

| Service  | Accès                 |
| -------- | --------------------- |
| front    | http://localhost:4200 |
| back     | http://localhost:3002 |
| postgres | `localhost:5432`      |
| adminer  | http://localhost:8081 |

Le premier lancement construit les images : comptez quelques minutes.

## Base de données

Un container PostgreSQL 17 est créé au lancement, avec une base `app` (utilisateur `postgres`, mot de passe `postgres`). Les valeurs se changent dans `.env`. Les données sont conservées dans le volume `pgdata`.

Les migrations TypeORM s'exécutent automatiquement au démarrage du back.

Interface web (type phpMyAdmin) : Adminer, sur http://localhost:8081. Connexion : système `PostgreSQL`, serveur `postgres`, utilisateur `postgres`, mot de passe `postgres`, base `app` (valeurs du `.env`).

En ligne de commande :

```bash
docker compose exec postgres psql -U postgres -d app
```

> `DB_USER`, `DB_PASSWORD` et `DB_NAME` ne sont pris en compte qu'à la création du volume. Après modification : `docker compose down -v`.

## Développer

Les dossiers `back/` et `front/` sont montés dans les containers : chaque modification du code est prise en compte automatiquement (watch NestJS, rechargement Angular).

### Commandes courantes

```bash
docker compose up -d           # démarrer en arrière-plan
docker compose logs -f back    # logs d'un service (back, front, postgres)
docker compose ps              # état des services
docker compose restart back    # redémarrer un service
docker compose down            # arrêter (données conservées)
docker compose down -v         # arrêter et supprimer les données
```

### Dépendances npm

Les `node_modules` vivent dans des volumes Docker. Installez les paquets dans le container :

```bash
docker compose exec back npm install <paquet>
docker compose exec front npm install <paquet>
```

Si `package.json` est modifié à la main (ou après un `git pull`), relancez simplement `make start` : les dépendances sont synchronisées (`npm install`) à chaque démarrage des containers.

### Qualité de code (format, lint, analyse statique)

Équivalent de php-cs-fixer (Prettier) et de PHPStan (oxlint type-aware + `tsc`, `strictTemplates` côté Angular), pour `back` et `front` :

```bash
docker compose exec back npm run check        # format:check + lint + typecheck
docker compose exec back npm run format       # corrige le formatage (Prettier)
docker compose exec back npm run lint:fix     # corrige le lint automatiquement
docker compose exec front npm run check
docker compose exec front npm run format
docker compose exec front npm run lint:fix
```

### Migrations, tests, lint

```bash
docker compose exec back npm run migration:generate -- src/database/migrations/NomMigration
docker compose exec back npm run migration:run
docker compose exec back npm run migration:revert
docker compose exec back npm test
docker compose exec back npm run lint
docker compose exec front npm test
```

## Configuration (`.env`)

| Variable      | Défaut     | Rôle                        |
| ------------- | ---------- | --------------------------- |
| `FRONT_PORT`  | `4200`     | Port du front sur l'hôte    |
| `BACK_PORT`   | `3002`     | Port du back sur l'hôte     |
| `ADMINER_PORT`| `8081`     | Port d'Adminer sur l'hôte   |
| `DB_PORT`     | `5432`     | Port de Postgres sur l'hôte |
| `DB_USER`     | `postgres` | Utilisateur Postgres        |
| `DB_PASSWORD` | `postgres` | Mot de passe Postgres       |
| `DB_NAME`     | `app`      | Nom de la base              |

En cas d'erreur `port is already allocated`, changez le port concerné dans `.env`.
