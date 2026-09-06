COMPOSE = docker compose -f platform/docker-compose.yml

all: up

up:
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

studio:
	$(COMPOSE) exec backend npm exec prisma studio -- --browser none

prisma-generate:
	$(COMPOSE) exec backend npx prisma generate

prisma-migrate:
	$(COMPOSE) exec backend npx prisma migrate deploy

prisma-migrate-dev:
	$(COMPOSE) exec backend npx prisma migrate dev

prisma-validate:
	$(COMPOSE) exec backend npx prisma validate

.PHONY: all up down stop start restart logs ps clean fclean re prisma-generate prisma-migrate