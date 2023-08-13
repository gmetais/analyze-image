const { describe, it } = require("@jest/globals");

const ModulesRunner = require('../lib/modulesRunner'),
    assert = require('assert'),
    fs = require('fs').promises,
    path = require('path');


describe('Image size detection', () => {

    const files = [
        {name: 'svg-image.svg', format: 'svg', width: undefined, height: undefined},
        {name: 'jpeg-image.jpg', format: 'jpg', width: 285, height: 427},
        {name: 'png-image.png', format: 'png', width: 664, height: 314},
        {name: 'animated.gif', format: 'gif', width: 200, height: 197},
        {name: 'webp-image.webp', format: 'webp', width: 628, height: 444},
        {name: 'animated.webp', format: 'webp', width: 400, height: 400},
        {name: 'avif-image.avif', format: 'avif', width: 200, height: 200}
    ];

    files.forEach(file => {
        it('should detect the dimensions of a ' + file.format + ' image', async () => {
            const image = await fs.readFile(path.resolve(__dirname, './images/', file.name));
            const res = await ModulesRunner.execModuleForTest('dimensions', image, {}, {}, {stats: {format: file.format}});
            assert.strictEqual(res.stats.width, file.width, 'Width is correct');
            assert.strictEqual(res.stats.height, file.height, 'Height is correct');
        });
    });
});

describe('Display Ratio detection', () => {
    it('should calculate the displayRatio properly on a 1x DPR', async () => {
        const image = await fs.readFile(path.resolve(__dirname, './images/jpeg-image.jpg'));
        const res = await ModulesRunner.execModuleForTest('dimensions', image, {
            displayWidth: 28,
            displayHeight: 43
        }, {}, {stats: {format: 'jpg'}});
        assert.strictEqual(res.stats.displayRatio.toFixed(5), '10.05440');
    });
    it('should calculate the displayRatio properly on a 3x DPR', async () => {
        const image = await fs.readFile(path.resolve(__dirname, './images/jpeg-image.jpg'));
        const res = await ModulesRunner.execModuleForTest('dimensions', image, {
            displayWidth: 28,
            displayHeight: 43,
            dpr: 3
        }, {}, {stats: {format: 'jpg'}});
        assert.strictEqual(res.stats.displayRatio.toFixed(5), '3.35147');
    });
});

describe('Display Density detection', () => {
    it('should calculate the displayDensity properly', async () => {
        const image = await fs.readFile(path.resolve(__dirname, './images/jpeg-image.jpg'));
        const res = await ModulesRunner.execModuleForTest('dimensions', image, {
            displayWidth: 28,
            displayHeight: 43,
            dpr: 3
        }, {}, {stats: {format: 'jpg'}});
        assert.strictEqual(res.stats.displayDensity.toFixed(5), '10.05440');
        assert.strictEqual(res.offenders.imageExcessiveDensity.displayDensity.toFixed(5), '10.05440');
        assert.strictEqual(res.offenders.imageExcessiveDensity.recommendedMaxDensity, 2);
    });
});
