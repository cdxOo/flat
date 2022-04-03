'use strict';

var isPlainObject = (that) => {
    var type = Object.prototype.toString.call(that).slice(8, -1);
    return (
        type === 'Object' && 
        that.constructor === Object &&
        Object.getPrototypeOf(that) === Object.prototype
    )
}

var isObject = (that) => {
    var type = Object.prototype.toString.call(that).slice(8, -1);
    return type === 'Object';
}

var isArray = (that) => {
    var type = Object.prototype.toString.call(that).slice(8, -1);
    return type === 'Array';
}

var TNode = (context) => {
    var { key, value, parentNode, options } = context;
    var { onlyPlainObjects, traverseArrays } = options;

    var shouldTraverse = (
        isObject(value) && onlyPlainObjects === false ||
        isPlainObject(value) && onlyPlainObjects === true ||
        isArray(value) && traverseArrays === true
    );

    var childKeys = [];
    var isLeaf = true;
    if (shouldTraverse) {
        var childKeys = Object.keys(value);
        var isLeaf = childKeys.length === 0;
    }

    var path = [];
    var isRoot = true;
    if (parentNode) {
        isRoot = false;
        path.push(...parentNode.path);
    }
    if (key !== undefined) {
        isRoot = false;
        path.push(key);
    }

    var node = {
        parentNode,
        childKeys,
        shouldTraverse,
        isRoot,
        isLeaf,
        path,
        key,
        value,
    }

    return node;
}

var _traverse = (context) => {
    var { key, value, parentNode, lambda, options } = context;
    var {
        onlyPlainObjects = true,
        traverseArrays = false,
    } = options;
    
    var node = TNode({
        key,
        value,
        parentNode,
        options: {
            onlyPlainObjects,
            traverseArrays
        }
    });
    
    lambda(node);
    if (node.shouldTraverse) {
        for (var key of node.childKeys) {
            var childValue = value[key];
            _traverse({
                key,
                value: childValue,
                parentNode: node,
                lambda,
                options
            })
        }
    }
}

var traverse = (that, lambda, options) => {
    _traverse({ key: undefined, value: that, lambda, options });
}

module.exports = traverse;
