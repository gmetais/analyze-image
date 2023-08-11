const { describe, it } = require("@jest/globals");

const ModulesRunner = require('../lib/modulesRunner'),
    assert = require('assert'),
    fs = require('fs').promises,
    path = require('path')
    sharp = require('sharp');


describe('Reformat module', () => {
    it ('should not reformat an SVG', async () => {
        const image = await fs.readFile(path.resolve(__dirname, './images/svg-image.svg'));
        const result = await ModulesRunner.execModuleForTest('reformat', image, {}, {}, {stats: {
            format: 'svg',
            weight: image.length
        }});
        assert.ok(!result.transforms.reformat, 'Should not reformat image');
    });
    it ('should not reformat an AVIF', async () => {
        const image = await fs.readFile(path.resolve(__dirname, './images/avif-image.avif'));
        const result = await ModulesRunner.execModuleForTest('reformat', image, {}, {}, {stats: {
            format: 'avif',
            weight: image.length
        }});
        assert.ok(!result.transforms.reformat, 'Should not reformat image');
    });
    it ('should not reformat an animated WebP', async () => {
        const image = await fs.readFile(path.resolve(__dirname, './images/animated.webp'));
        const result = await ModulesRunner.execModuleForTest('reformat', image, {}, {}, {stats: {
            format: 'webp',
            weight: image.length,
            animated: true
        }});
        assert.ok(!result.transforms.reformat, 'Should not reformat image');
    });


    let files = [
        {name: 'jpeg-image.jpg', format: 'jpg', animated: false},
        {name: 'png-image.png', format: 'png', animated: false},
        {name: 'animated.gif', format: 'gif', animated: true}
    ];

    files.forEach(file => {
        it('should succesfully reformat a ' + file.format + ' to webp', async () => {
            const image = await fs.readFile(path.resolve(__dirname, './images/', file.name));
            const result = await ModulesRunner.execModuleForTest('reformat', image, {}, {}, {stats: {
                format: file.format,
                weight: image.length,
                animated: file.animated
            }});

            assert.ok(result.transforms.webpEncoded, 'Reformatting object exists');
            assert.ok(result.transforms.webpEncoded.weight > 0, 'New file weight is provided');
            assert.strictEqual(result.transforms.webpEncoded.body.length, result.transforms.webpEncoded.weight, 'New buffer saved');
            assert.ok(result.transforms.webpEncoded.gain > 0, 'Gain is provided');

            const newContentType = await ModulesRunner.execModuleForTest('contentType', result.transforms.webpEncoded.body);
            assert.strictEqual(newContentType.stats.format, 'webp', 'Content type is webp');

            assert.strictEqual(result.offenders.imageOldFormat.beforeWeight, image.length);
            assert.ok(result.offenders.imageOldFormat.afterWeight > 0);
        });
    });

    files = [
        {name: 'jpeg-image.jpg', format: 'jpg', animated: false},
        {name: 'png-image.png', format: 'png', animated: false},
        {name: 'webp-image.webp', format: 'webp', animated: false}
    ];

    files.forEach(file => {
        it('should succesfully reformat a ' + file.format + ' to avif', async () => {
            const image = await fs.readFile(path.resolve(__dirname, './images/', file.name));
            const result = await ModulesRunner.execModuleForTest('reformat', image, {}, {}, {stats: {
                format: file.format,
                weight: image.length,
                animated: file.animated
            }});

            assert.ok(result.transforms.avifEncoded, 'Reformatting object exists');
            assert.ok(result.transforms.avifEncoded.weight > 0, 'New file weight is provided');
            assert.strictEqual(result.transforms.avifEncoded.body.length, result.transforms.avifEncoded.weight, 'New buffer saved');
            assert.ok(result.transforms.avifEncoded.gain > 0, 'Gain is provided');

            const newContentType = await ModulesRunner.execModuleForTest('contentType', result.transforms.avifEncoded.body);
            assert.strictEqual(newContentType.stats.format, 'avif', 'Content type is webp');

            assert.strictEqual(result.offenders.imageOldFormat.beforeWeight, image.length);
            assert.ok(result.offenders.imageOldFormat.afterWeight > 0);
        });
    });
});