'use strict';
var traverse = require('@cdxoo/traverse');

var flatten = (that, options = {}) => {
    var {
        delimiter = '.',
        maxDepth = 0,
    } = options;

    var out = {};
    
    traverse(that, (context) => {
        var { isLeaf, path, value, parentNode } = context;
        if (maxDepth) {
            if (path.length <= maxDepth) {
                if (parentNode) {
                    delete out[parentNode.path.join(delimiter)];
                }
                out[path.join(delimiter)] = value;
            }
        }
        else {
            if (isLeaf) {
                out[path.join(delimiter)] = value;
            }
        }
    }, options)

    return out;
}

var unflatten = (that, options = {}) => {
    var {
        delimiter = '.',
        handlePropertiesOnNonObjects = 'throw'
    } = options;

    var out = {};
    var parent = undefined;
    var parentToken = undefined;
    for (var key of Object.keys(that)) {
        var path = key.split(delimiter);
        var current = out;
        for (var i = 0; i < path.length; i += 1) {
            var token = path[i];
            var isLast = i === path.length - 1;
            
            if (current === null || current === undefined) {
                throw new Error(inlineErrorMsg(`
                    Cannot create property '${token}'
                    on ${typeof current} '${current}'
                    (path: '${path.join('.')}')
                `));
            }

            if (!Object.keys(current).includes(token)) {
                var value = isLast ? that[key] : {};

                if (typeof current !== 'object') {
                    if (handlePropertiesOnNonObjects !== 'throw') {
                        handlePropertiesOnNonObjects({
                            root: out,
                            parent,
                            erroneousPath: path.slice(0, i),
                            erroneousKey: parentToken,
                            erroneousValue: current,
                            currentKey: token,
                            currentValue: value
                        })
                    }
                    else {
                        throw new Error(inlineErrorMsg(`
                            Cannot create property '${token}'
                            on ${typeof current} '${current}'
                            (path: '${path.join('.')}'
                            in ${JSON.stringify(out)})
                        `))
                    }
                }
                else {
                    current[token] = value;
                }
            }
            parent = current;
            parentToken = token;
            current = current[token];
        }
    }
    return out;
}

var inlineErrorMsg = (str) => (
    str.replace(/(^\s+|\s+$)/g, '').replace(/\s+/g, ' ')
);

flatten.flatten = flatten;
flatten.unflatten = unflatten;

module.exports = flatten;
