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

describe('unflatten mixed in non-objects', () => {
    it('throws useful error by default', () => {
        var error = undefined;
        try {
            unflatten({
                'foo.bar': 'none',
                'foo.bar.baz': true
            }, { handleNonObjectProperties: ''});
        } catch (e) {
            error = e;
        }
        
        expect(error.message).to.eql(`
            Cannot create property 'baz' on string 'none'
            (path: 'foo.bar.baz' in {"foo":{"bar":"none"}})
        `.replace(/(^\s+|\s+$)/g, '').replace(/\s+/g, ' '))
    })
    
    it('user can pass custom handler', () => {
        var out = unflatten({
            'quux.x': 42,
            'foo.bar': 'none',
            'foo.bar.baz': true
        }, { handlePropertiesOnNonObjects: (bag) => {
            var {
                parent,
                erroneousKey,
                erroneousValue,
                currentKey,
                currentValue
            } = bag;

            parent[erroneousKey] = { [currentKey]: currentValue };
        }});

        expect(out).to.eql({
            quux: { x: 42 },
            foo: { bar: { baz: true }},
        })
    })
})
