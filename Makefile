.PHONY: test publish

test:
	npm test

bump-patch: test
	npm version patch

bump-minor: test
	npm version minor

bump-major: test
	npm version major

publish: test
	git push --tags origin HEAD:main
	npm publish --access public
