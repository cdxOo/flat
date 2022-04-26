'use strict';
var traverse = require('@cdxoo/traverse');

var flatten = (that, options = {}) => {
    var {
        delimiter = '.',
        maxDepth = 0,
    } = options;

    var out = {};
    
    traverse(that, (context) => {
        var { isLeaf, path, value } = context;
        if (maxDepth) {
            if (path.length === maxDepth) {
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
    var { delimiter = '.' } = options;
    var out = {};
    for (var key of Object.keys(that)) {
        var path = key.split(delimiter);
        var current = out;
        for (var i = 0; i < path.length; i += 1) {
            var token = path[i];
            var isLast = i === path.length - 1;
            current[token] = (
                isLast ? that[key] : {}
            );
            current = current[token];
        }
    }
    return out;
}

flatten.flatten = flatten;
flatten.unflatten = unflatten;

module.exports = flatten;
