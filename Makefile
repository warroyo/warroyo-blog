# Makefile for local development.
# Requires: Hugo extended (>= 0.158.0) and Go (>= 1.24) on your PATH.

.DEFAULT_GOAL := help
.PHONY: help preview serve build new clean update-theme check

## help: list available targets
help:
	@echo "Available targets:"
	@grep -E '^## ' $(MAKEFILE_LIST) | sed 's/## //' | awk -F': ' '{name=$$1; sub(/^[^:]*: /, ""); printf "  \033[36m%-14s\033[0m %s\n", name, $$0}'

## preview: live-reload server with drafts + future posts (http://localhost:1313)
preview:
	hugo server -D --buildFuture --navigateToChanged

## serve: live-reload server, published content only (production-like)
serve:
	hugo server --navigateToChanged

## build: production build into ./public
build:
	hugo --gc --minify

## new: scaffold a new post — usage: make new SLUG=my-post-title
new:
	@test -n "$(SLUG)" || { echo "Usage: make new SLUG=my-post-title"; exit 1; }
	hugo new posts/$(SLUG)/index.md
	@echo "Created content/posts/$(SLUG)/index.md (draft). Edit it, then run 'make preview'."

## check: clean production build as a smoke test (fails on warnings)
check:
	hugo --gc --minify --panicOnWarning --cleanDestinationDir

## update-theme: pull the latest Blowfish release
update-theme:
	hugo mod get -u github.com/nunocoracao/blowfish/v2
	hugo mod tidy

## clean: remove generated build artifacts
clean:
	rm -rf public resources .hugo_build.lock
