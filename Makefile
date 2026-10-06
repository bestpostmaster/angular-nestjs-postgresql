.PHONY: build start build\:start stop

# Construit les images Docker
build:
	docker compose build

# Lance l'environnement complet (postgres + back + front)
start:
	docker compose up

# Construit les images avant de lancer l'environnement
build\:start: build
	docker compose up

# Arrête back, front et base de données (les données sont conservées)
stop:
	docker compose down
