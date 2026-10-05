COMPOSE = docker compose -f platform/docker-compose.yml
ENV_FILE = platform/.env

all: up

$(ENV_FILE):
	cp platform/.env.example $(ENV_FILE)
	@echo "platform/.env cree a partir de .env.example : remplis les valeurs puis relance make"
	@exit 1

up: $(ENV_FILE)
	$(COMPOSE) up --build -d

down:
	$(COMPOSE) down --remove-orphans

stop:
	$(COMPOSE) stop

start:
	$(COMPOSE) start

restart:
	$(COMPOSE) restart

logs:
	$(COMPOSE) logs -f

ps:
	$(COMPOSE) ps

clean:
	$(COMPOSE) down -v --remove-orphans

fclean:
	$(COMPOSE) down --rmi all -v --remove-orphans
	docker builder prune -af

re: fclean up

prisma-generate:
	$(COMPOSE) exec backend npx prisma generate

prisma-migrate:
	$(COMPOSE) exec backend npx prisma migrate deploy



.PHONY: all up down stop start restart logs ps clean fclean re prisma-generate prisma-migrate