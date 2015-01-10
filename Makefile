# Code optimization.
MINIFIER     = ./$(NODE_MODULES)/.bin/uglifyjs
MINIFIED     = $(PATH_BASE)index.js

# GNU tools.
RM           = rm -f
MKDIR        = mkdir -p
CP           = cp

# Other utilities.
NPM          = npm
NODE         = node

GARBAGE      = $(shell find build/ -type f)
NODE_MODULES = node_modules
PATH_BASE    = build/
PATH_RELEASE = build/release/
SOURCE_MAIN  = index.js
NPM_PACKAGE  = package.json
DB_CONFIG    = dataBase.json

ifeq (,$(shell which $(NPM)))
$(error Cannot find "npm" in PATH. Please install node.js and try again)
endif

# User commands.

release:
	@$(MAKE) auto-release PATH_BASE="$(PATH_RELEASE)" --no-print-directory

clean:
	@$(MAKE) auto-clean --no-print-directory

run: $(NODE_MODULES)
	$(NODE) $(SOURCE_MAIN)

help:
	@echo "make release - Builds using release configuration."
	@echo "make clean   - Removes existing builds."
	@echo "make run     - Starts server in debug mode."
	@echo "make help    - Displays this help message."

# Automatic commands. Don't use these directly.

auto-release: $(MINIFIED) $(PATH_BASE)$(NPM_PACKAGE) $(PATH_BASE)$(DB_CONFIG)
	cd $(PATH_BASE) && $(NPM) install --production

auto-clean:
	$(foreach FILE,$(wildcard $(GARBAGE)),$(RM) $(FILE)$(\n))

$(PATH_BASE):
	@$(MKDIR) $@

$(PATH_BASE)$(DB_CONFIG): $(DB_CONFIG)
	$(CP) $< $@

$(PATH_BASE)$(NPM_PACKAGE): $(NPM_PACKAGE)
	$(CP) $< $@

$(NODE_MODULES): $(NPM_PACKAGE)
	$(NPM) install

$(MINIFIER): $(NODE_MODULES)

$(MINIFIED): $(SOURCE_MAIN) $(MINIFIER) 
	$(MINIFIER) $(SOURCE_MAIN) --mangle --compress "warnings=false" -o $@

.PHONY: auto-clean release clean run help

define \n


endef

