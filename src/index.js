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
        handlePropertiesOnNonObjects = 'throw',
        initArrayOnNumericToken = false,
    } = options;

    var wrapper = { ROOT: undefined };
    for (var key of Object.keys(that)) {
        var path = key.split(delimiter);
        
        var route = [{
            token: '#ROOT#',
            getValue: () => wrapper.ROOT,
            setValue: (override) => { wrapper.ROOT = override },
        }];

        // NOTE: theese "let" initializaions are important with for
        path.forEach((token, i) => {
        //for (let i = 0; i < path.length; i += 1) {
            //let token = path[i];
            //let currentPath = [ ...path.slice(0,i), token ];
            var currentPath = [ ...path.slice(0,i), token ];

            var isLast = i === path.length - 1;
            var [ container, parent ] = route;

            if (container.getValue() === undefined) {
                if (initArrayOnNumericToken && /^\d+$/.test(String(token))) {
                    container.setValue([]);
                } 
                else {
                    container.setValue({});
                }
            }

            var precheckValue = container.getValue();
            if (precheckValue === null || precheckValue === undefined) {
                throw new Error(inlineErrorMsg(`
                    Cannot create property '${token}'
                    on ${typeof precheckValue} '${precheckValue}'
                    (path: '${path.join('.')}')
                `));
            }


            var value = (
                isLast
                ? that[key]
                : container.getValue()[token]
            );

            //let containerValue = container.getValue();
            var containerValue = container.getValue();

            if (!Object.keys(containerValue).includes(token)) {
                // NOTE: arrays will be detected as object as well
                if (typeof containerValue !== 'object') {
                    if (handlePropertiesOnNonObjects !== 'throw') {
                        handlePropertiesOnNonObjects({
                            route,
                            path: currentPath,
                            token,
                            value
                        })
                    }
                    else {
                        throw new Error(inlineErrorMsg(`
                            Cannot create property '${token}'
                            on ${typeof containerValue} '${containerValue}'
                            (path: '${path.join('.')}'
                            in ${JSON.stringify(wrapper.ROOT)})
                        `))
                    }
                }
                else {
                    if (containerValue[token] === containerValue.__proto__) {
                        throw new Error(inlineErrorMsg(`
                            Cannot create property '${token}'
                            on ${typeof containerValue} '${containerValue}'
                            (path: '${path.join('.')}'
                            in ${JSON.stringify(wrapper.ROOT)})
                        `))
                    }
                    containerValue[token] = value;
                }
            }

            route.unshift({
                path: currentPath,
                token,
                getValue: () => {
                    //console.log({ i })
                    return getValue(wrapper.ROOT, currentPath)
                },
                setValue: (override) => {
                    setValue(wrapper.ROOT, currentPath, override);
                }
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
