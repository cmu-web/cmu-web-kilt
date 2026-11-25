# The everyday commands; `make` lists them. Written for GNU Make 3.81, the
# version macOS ships. PORT changes the docs server's port.
.DEFAULT_GOAL := help
.PHONY: help setup run check

PORT ?= 3100

help: ## List the targets
	@awk 'BEGIN {FS = ":.*## "} /^[a-z]+:.*## / {printf "  make %-8s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

setup: ## Install the dependencies and the Git hooks
	npm ci
	npx prek install

run: ## Serve the docs, with the Kilt's css/ and js/, on PORT (3100)
	npm run docs -- $(PORT)

check: ## The everyday check: lint, format, versions, tables and tests
	npm run check
