'use strict';
var traverse = require('@cdxoo/traverse');

var flatten = (that, options = {}) => {
    var {
        delimiter = '.',
        maxDepth = 0,
        traverseArrays = false,
        initializeArrays = false,
    } = options;

    var out = {};

    if (Array.isArray(that) && !traverseArrays) {
        return that;
    }

    traverse(that, (context) => {
        var { isLeaf, path, value, parentNode } = context;
        var key = path.join(delimiter);
        if (maxDepth) {
            if (path.length <= maxDepth) {
                if (parentNode) {
                    delete out[parentNode.path.join(delimiter)];
                }
                out[key] = value;
            }
        }
        else {
            if (traverseArrays && initializeArrays && Array.isArray(value)) {
                out[key] = [];
            }
            if (isLeaf) {
                out[key] = value;
            }
        }
    }, options)

    return out;
}

var getValue = (that, path = []) => {
    //console.log('getValue()')
    //console.log('=>', that, path);
    var out = that;
    for (var token of path) {
        out = out[token];
    }
    return out;
}

var setValue = (that, path = [], override) => {
    //console.log('getValue()')
    //console.log('=>', that, path);
    var target = that;
    var lasttoken = undefined;
    for (var [ix, token] of path.entries()) {
        if (ix < path.length - 1) {
            target = target[token];
        }
        else {
            lasttoken = token;
        }
    }
    target[lasttoken] = override;
}

var unflatten = (that, options = {}) => {
    var {
        delimiter = '.',
        //handlePropertiesOnNonObjects = 'throw',
        initArrayOnNumericToken = false,
    } = options;

    // FIXME
    var handlePropertiesOnNonObjects = 'throw';

    var wrapper = { ROOT: undefined };
    var current = undefined;
    var initValue = (token, value) => {
        if (wrapper.ROOT === undefined) {
            wrapper.ROOT = current = value;
        }
        else {
            if (current[token] === undefined) {
                current[token] = value;
            }
        }
    }

    for (var [ key, __value ] of Object.entries(that)) {
        current = wrapper.ROOT;

        var path = key.split(delimiter);

        //console.log({ path });
        //console.log({ current });

        var route = [{
            token: '#ROOT#',
            //getValue: () => wrapper.ROOT,
            //setValue: (override) => { wrapper.ROOT = override },
        }];

        var prevToken = undefined;
        path.forEach((token, ix) => {
            var currentPath = [ ...path.slice(0,ix), token ];
            var isLast = ix === path.length - 1;

            if (prevToken || wrapper.ROOT === undefined) {
                var nextContainer = (
                    initArrayOnNumericToken && /^\d+$/.test(String(token))
                    ? [] : {}
                );
                initValue(prevToken, nextContainer);
                if (prevToken) {
                    current = current[prevToken];
                }
            }

            prevToken = token;

            if (current === null || current === undefined) {
                throw new Error(inlineErrorMsg(`
                    Cannot create property '${token}'
                    on ${typeof current} '${current}'
                    (path: '${path.join('.')}')
                `));
            }

            var containerValue = current;
            if (current[token] === current.__proto__) {
                throw new Error(inlineErrorMsg(`
                    Cannot create property '${token}'
                    on ${typeof current} '${current}'
                    (path: '${path.join('.')}'
                    in ${JSON.stringify(wrapper.ROOT)})
                `))
            }
                
            // NOTE: arrays will be detected as object as well
            if (typeof current !== 'object') {
                //if (handlePropertiesOnNonObjects !== 'throw') {
                //    handlePropertiesOnNonObjects({
                //        route,
                //        path: currentPath,
                //        token,
                //        value
                //    })
                //}
                //else {
                    throw new Error(inlineErrorMsg(`
                        Cannot create property '${token}'
                        on ${typeof current} '${current}'
                        (path: '${path.join('.')}'
                        in ${JSON.stringify(wrapper.ROOT)})
                    `))
                //}
            }

            if (isLast) {
                current[token] = __value;
            }

            route.unshift({
                path: currentPath,
                token,
                //getValue: () => {
                //    //console.log({ i })
                //    return getValue(wrapper.ROOT, currentPath)
                //},
                //setValue: (override) => {
                //    setValue(wrapper.ROOT, currentPath, override);
                //}
            });
        })
    }
    return wrapper.ROOT;
}

var inlineErrorMsg = (str) => (
    str.replace(/(^\s+|\s+$)/g, '').replace(/\s+/g, ' ')
);

flatten.flatten = flatten;
flatten.unflatten = unflatten;

module.exports = flatten;
