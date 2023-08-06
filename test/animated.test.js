const { describe, it } = require("@jest/globals");

const ModulesRunner = require('../lib/modulesRunner'),
    assert = require('assert'),
    fs = require('fs').promises,
    path = require('path');


describe('Animated image detection', () => {

    const files = [
        {name: 'svg-image.svg', format: 'svg', animated: undefined},
        {name: 'jpeg-image.jpg', format: 'jpg', animated: false},
        {name: 'png-image.png', format: 'png', animated: false},
        {name: 'animated.gif', format: 'gif', animated: true},
        {name: 'webp-image.webp', format: 'webp', animated: false},
        {name: 'animated.webp', format: 'webp', animated: true},
        {name: 'avif-image.avif', format: 'avif', animated: undefined}
    ];

    files.forEach(file => {
        it('should detect if the ' + file.format + ' image is animated', async () => {
            const image = await fs.readFile(path.resolve(__dirname, './images/', file.name));
            const res = await ModulesRunner.execModuleForTest('animated', image, {}, {}, {stats: {format: file.format}});
            assert.strictEqual(res.stats.animated, file.animated, 'Animated property is correct');
        });
    });
});