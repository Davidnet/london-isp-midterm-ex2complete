# Assemble combined/ from the two submodules' apps plus the site/ launcher page.
#
#   make            # build combined/
#   make serve      # build + serve at http://localhost:8123
#   make zip        # build + package combined/ into a deployable zip
#   make report     # compile the written report to report/report.pdf
#   make clean      # remove combined/ and the zip
#   make submodules # init/update the git submodules

BUILD := combined
SITE  := london-isp-midterm-ex2complete
EX2   := london-isp-midterm-ex2
EX223 := london-isp-midterm-ex223

.PHONY: all submodules build serve zip report clean

all: build

submodules:
	git submodule update --init --recursive

build: submodules clean
	@echo ">> building $(BUILD)/"
	@$(MAKE) -C $(EX2) build
	@mkdir -p "$(BUILD)/captcha"
	@cp -R $(EX2)/build/. "$(BUILD)/captcha/"
	@mkdir -p "$(BUILD)/meyda"
	@cp -R $(EX223)/index.html $(EX223)/sketch.js $(EX223)/style.css \
		$(EX223)/lib $(EX223)/assets $(EX223)/fonts "$(BUILD)/meyda/"
	@cp site/index.html "$(BUILD)/index.html"
	@# inject a "back to units" link into each app, pointing at the launcher
	@for app in captcha meyda; do \
		perl -0pi -e 'BEGIN{local $$/; open F,"site/back-button.html" or die; $$btn=<F>} s/(<body[^>]*>)/$$1\n$$btn/i' "$(BUILD)/$$app/index.html"; \
	done
	@echo ">> done. $(BUILD)/ size: $$(du -sh $(BUILD) | awk '{print $$1}')"

serve: build
	@echo ">> serving $(BUILD)/ at http://localhost:8123"
	@python3 -m http.server 8123 --directory $(BUILD)

zip: build
	@rm -f $(SITE).zip
	@cd $(BUILD) && zip -qr ../$(SITE).zip .
	@echo ">> wrote $(SITE).zip ($$(du -h $(SITE).zip | awk '{print $$1}'))"

report:
	@./report/build.sh

clean:
	@rm -rf $(BUILD) $(SITE).zip
