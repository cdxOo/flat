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
