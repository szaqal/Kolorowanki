.DEFAULT_GOAL := help

APP_DIR := app

.PHONY: help install dev build start lint typecheck test clean pdf-deps

help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies
	cd $(APP_DIR) && npm install

dev: ## Start development server
	cd $(APP_DIR) && npm run dev

build: ## Build for production
	cd $(APP_DIR) && npm run build

start: ## Start production server (requires build first)
	cd $(APP_DIR) && npm run start

lint: ## Run ESLint
	cd $(APP_DIR) && npm run lint

typecheck: ## Run TypeScript type checker
	cd $(APP_DIR) && npx tsc --noEmit

test: ## Run tests
	cd $(APP_DIR) && npm test

pdf-deps: ## Install Puppeteer browser (run once after install)
	cd $(APP_DIR) && npx puppeteer browsers install chrome

clean: ## Remove build artifacts and node_modules
	rm -rf $(APP_DIR)/.next $(APP_DIR)/node_modules
