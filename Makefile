.PHONY: start stop

# Lance l'environnement complet (postgres + back + front)
start:
	docker compose up --build

# Arrête back, front et base de données (les données sont conservées)
stop:
	docker compose down
