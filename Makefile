.PHONY: build start build\:start test stop

# Construit les images Docker
build:
	docker compose build

# Lance l'environnement complet (postgres + back + front)
start:
	docker compose up

# Construit les images avant de lancer l'environnement
build\:start: build
	docker compose up

# Lance les tests du back puis du front
test:
	docker compose run --rm --no-deps back sh -c "npm ci --no-audit --no-fund && npm test"
	docker compose run --rm --no-deps front sh -c "npm ci --legacy-peer-deps --no-audit --no-fund && npm test -- --watch=false"

# Arrête back, front et base de données (les données sont conservées)
stop:
	docker compose down
