'use strict';
var { expect } = require('chai');
var { flatten, unflatten } = require('../src/');

class Cat {
    name = 'Cosmonaut';
    meow () {
        console.log('meow!');
    }
}

describe('basics', () => {
    var cosmo = new Cat();
    var pairs = [
        [
            { bar: 42, baz: 9001 },
            { 'bar': 42, 'baz': 9001 }
        ],
        [
            { foo: { bar: 42 }},
            { 'foo.bar': 42 }
        ],
        [
            { foo: { bar: 42, baz: 9001 }},
            { 'foo.bar': 42, 'foo.baz': 9001 }
        ],
        [
            { foo: { bar: [ { quux: 42 } ]}},
            { 'foo.bar': [ { quux: 42 } ]},
        ],
        [
            { foo: { bar: cosmo }},
            { 'foo.bar':  cosmo }
        ]
    ];

    it('flatten', () => {
        for (var it of pairs) {
            expect(flatten(it[0])).to.deep.eql(it[1]);
        }
    });

    it('unflatten', () => {
        for (var it of pairs) {
            expect(unflatten(it[1])).to.deep.eql(it[0]);
        }
    });
});

describe('cats', () => {
    it('meows', () => {
        var cosmo = new Cat();
        var out = flatten({ foo: { bar: cosmo }});
        expect(out['foo.bar'].meow).to.be.a('function');
    })
})

describe('flatten() maxDepth', () => {
    var pairs = [
        [
            3,
            { foo: { bar: { baz: { quux: 42 }}}},
            { 'foo.bar.baz': { quux: 42 }}
        ],
        [
            3,
            {
                foo: { bar: { baz: { quux: 42 }}},
                a: { b: 1 }
            },
            { 'foo.bar.baz': { quux: 42 }, 'a.b':1 }
        ]
    ];
    
    it('flatten', () => {
        for (var it of pairs) {
            var [ maxDepth, raw, flat ] = it;
            expect(flatten(raw, { maxDepth })).to.deep.eql(flat);
        }
    });

    it('unflatten', () => {
        for (var it of pairs) {
            var [ maxDepth, raw, flat ] = it;
            expect(unflatten(flat)).to.deep.eql(raw);
        }
    })
    
})

describe('flatten array key indication', () => {
    it('no indication by default', () => {
        var out = flatten({ foo: ['a', 'b', 'c'] }, {
            traverseArrays: true
        });
        expect(out).to.eql({
            'foo.0': 'a',
            'foo.1': 'b',
            'foo.2': 'c',
        });
    })

    it('user can add custom indication', () => {
        var out = flatten({ foo: ['a', 'b', 'c'] }, {
            traverseArrays: true,
            createPathToken: (bag) => {
                var { parentNode, key, value } = bag;
                if (Array.isArray(parentNode.value)) {
                    return `[${key}]`
                }
                else {
                    return String(key);
                }
            }
        });
        expect(out).to.eql({
            'foo.[0]': 'a',
            'foo.[1]': 'b',
            'foo.[2]': 'c',
        });
    })
})

describe('unflatten mixed in non-objects', () => {
    it('throws useful error by default (simple case)', () => {
        var error = undefined;
        try {
            unflatten({
                'foo.bar': 'none',
                'foo.bar.baz': true
            });
        } catch (e) {
            error = e;
        }
        
        expect(error.message).to.eql(`
            Cannot create property 'baz' on string 'none'
            (path: 'foo.bar.baz' in {"foo":{"bar":"none"}})
        `.replace(/(^\s+|\s+$)/g, '').replace(/\s+/g, ' '))
    })

    it('throws useful error by default (wierd case)', () => {
        var error;
        try {
            unflatten({
                'quux.x': 42,
                'foo.bar': null,
                'foo.bar.0.baz': true
            });
        } catch (e) {
            error = e;
        }
        
        expect(error.message).to.eql(`
            Cannot create property '0' on object 'null'
            (path: 'foo.bar.0.baz')
        `.replace(/(^\s+|\s+$)/g, '').replace(/\s+/g, ' '))
    })
    
    it('user can handle simple mixing', () => {
        var out = unflatten({
            'quux.x': 42,
            'foo.bar': 'none',
            'foo.bar.baz': true
        }, { handlePropertiesOnNonObjects: (bag) => {
            var { route, token, value } = bag;
            var [ container, parent ] = route;
            parent.getValue()[container.token] = { [token]: value  };
        }});

        expect(out).to.eql({
            quux: { x: 42 },
            foo: { bar: { baz: true }},
        })
    })

    it('user can handle weird mixing', () => {
        var out = unflatten({
            'quux.x': 42,
            'foo.bar': 'none',
            'foo.bar.0.baz': true
        }, { handlePropertiesOnNonObjects: (bag) => {
            var { route, path, token, value } = bag;
            var [ root ] = route.slice(-1);
            var [ container, parent ] = route;
            
            if (typeof parent.getValue() !== 'object') {
                var current = root.getValue();
                for (var it of path.slice(0, -1)) {
                    if (typeof current[it] !== 'object') {
                        current[it] = {};
                    }
                    current = current[it];
                }
                current[token] = value;
            }
            else {
                parent.getValue()[container.token] = { [token]: value  };
            }
        }});

        expect(out).to.eql({
            quux: { x: 42 },
            foo: { bar: { '0': { baz: true }}},
        })
    })
})

describe('unflatten array keys', () => {
    it('can unflatten to array via custom extra handling', () => {
        var out = unflatten({
            'foo': [],
            'foo.0': 'a',
            'foo.1': 'b',
            'foo.2.x': 'c',
        });
        expect(out).to.eql({
            foo: [ 'a', 'b', { x: 'c' }]
        });
    })
})
