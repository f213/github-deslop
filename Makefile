.PHONY: install
install:  ## Download the latest released .xpi and open it in the running Firefox, which prompts to add it
	gh release download --repo f213/github-deslop --pattern '*.xpi' --dir web-ext-artifacts --clobber
	open -a Firefox "$$(ls -t web-ext-artifacts/*.xpi | head -1)"
