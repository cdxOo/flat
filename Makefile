.PHONY: test publish

test:
	npm test

bump-patch:
	npm version patch

bump-minor:
	npm version minor

bump-major:
	npm version major

publish: test
	git push --tags origin HEAD:main
	npm publish --access public
