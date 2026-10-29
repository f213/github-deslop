XPI = $(shell ls -t web-ext-artifacts/*.xpi 2>/dev/null | head -1)

.PHONY: install
install:  ## Open the newest signed .xpi in the running Firefox, which prompts to add it
	@test -n "$(XPI)" || (echo "No signed .xpi in web-ext-artifacts/; run npm run sign first" && exit 1)
	open -a Firefox "$(XPI)"
