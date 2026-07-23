# CorpusGuard — common demo/dev tasks.
# Compose CLI autodetect (Docker v2 "docker compose" vs legacy "docker-compose").
DC := $(shell docker compose version >/dev/null 2>&1 && echo "docker compose" || echo "docker-compose")

.PHONY: help up down reset demo test build logs

help:
	@echo "CorpusGuard make targets:"
	@echo "  make up      - build + launch the full stack (API + UI + Redis)"
	@echo "  make down    - stop and remove the stack"
	@echo "  make reset   - one-command demo reset (tear down, rebuild, relaunch, smoke test)"
	@echo "  make demo    - run the bank compliance demo (produces a PDF in ./reports)"
	@echo "  make test    - run the pytest suite"
	@echo "  make build   - build images only"
	@echo "  make logs    - follow stack logs"

up:
	$(DC) up -d --build

down:
	$(DC) down --remove-orphans

reset:
	./scripts/demo-reset.sh

demo:
	python examples/bank_compliance_demo.py

test:
	python -m pytest -q

build:
	$(DC) build

logs:
	$(DC) logs -f
