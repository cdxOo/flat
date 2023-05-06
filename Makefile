.PHONY: test publish

# see https://stackoverflow.com/a/14061796
# If the first argument is "run"...
ifeq (test,$(firstword $(MAKECMDGOALS)))
  # use the rest as arguments for "run"
  TEST_ARGS := $(wordlist 2,$(words $(MAKECMDGOALS)),$(MAKECMDGOALS))
  # ...and turn them into do-nothing targets
  $(eval $(TEST_ARGS):;@:)
endif


test:
	npm test $(TEST_ARGS)

bump-patch: test
	npm version patch

bump-minor: test
	npm version minor

bump-major: test
	npm version major

publish: test
	git push --tags origin HEAD:main
	npm publish --access public
