# Code optimization.
MINIFIER     = ./$(NODE_MODULES)/.bin/uglifyjs
MINIFIED     = $(PATH_BASE)index.js

# Database configuration file.
DB_CONF_IN   = templates/dataBase.t.json
DB_CONF_OUT  = $(PATH_BASE)dataBase.json

# Database SQL setup file.
DB_SETUP_IN  = templates/setup.t.sql
DB_SETUP_OUT = $(PATH_BASE)setup.sql

# Database user/password.
DB_HOST      = localhost
DB_USER      = master
ifeq (,$(shell which $(OPENSSL)))
DB_PASSWORD := $(shell openssl rand -base64 33)
else
DB_PASSWORD := changethis
endif

# GNU tools.
RM           = rm -f
MKDIR        = mkdir -p
CP           = cp
SED          = sed

# Other utilities.
NPM          = npm
NODE         = node
OPENSSL      = openssl

GARBAGE      = $(shell find build/ -type f)
NODE_MODULES = node_modules
PATH_BASE    = build/
PATH_RELEASE = build/release/
SOURCE_MAIN  = index.js
NPM_PACKAGE  = package.json

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

auto-release: $(MINIFIED) $(PATH_BASE)$(NPM_PACKAGE) $(DB_SETUP_OUT) $(DB_CONF_OUT)
	cd $(PATH_BASE) && $(NPM) install --production

auto-clean:
	$(foreach FILE,$(wildcard $(GARBAGE)),$(RM) $(FILE)$(\n))

$(PATH_BASE):
	@$(MKDIR) $@

$(DB_SETUP_OUT): $(DB_SETUP_IN) $(PATH_BASE)
	$(SED) 's/{{db.user}}/$(DB_USER)/' < $< > $@.tmp0
	$(SED) 's/{{db.password}}/$(subst /,0,$(DB_PASSWORD))/' < $@.tmp0 > $@
	$(RM) $@.tmp0

$(DB_CONF_OUT): $(DB_CONF_IN) $(PATH_BASE)
	$(SED) 's/{{db.user}}/$(DB_USER)/' < $< > $@.tmp10
	$(SED) 's/{{db.password}}/$(subst /,0,$(DB_PASSWORD))/' < $@.tmp10 > $@.tmp11
	$(SED) 's/{{db.host}}/$(DB_HOST)/' < $@.tmp11 > $@
	$(RM) $@.tmp1*

$(PATH_BASE)$(NPM_PACKAGE): $(NPM_PACKAGE) $(PATH_BASE)
	$(CP) $< $@

$(NODE_MODULES): $(NPM_PACKAGE)
	$(NPM) install

$(MINIFIER): $(NODE_MODULES)

$(MINIFIED): $(SOURCE_MAIN) $(MINIFIER) $(PATH_BASE)
	$(MINIFIER) $(SOURCE_MAIN) --mangle --compress "warnings=false" -o $@

.PHONY: $(DB_CONF_OUT) $(DB_SETUP_OUT) auto-clean release clean run help

define \n


endef

