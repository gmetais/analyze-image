const { describe, it } = require("@jest/globals");

const ModulesRunner = require('../lib/modulesRunner'),
    assert = require('assert'),
    fs = require('fs').promises,
    path = require('path')
    sharp = require('sharp');


describe('Resize module', () => {
    it ('should not resize if display dimensions are not set', async () => {
        const image = await fs.readFile(path.resolve(__dirname, './images/jpeg-image.jpg'));
        
        let result;

        result = await ModulesRunner.execModuleForTest('resize', image, {}, {}, {stats: {
            format: 'jpg',
            weight: image.length
        }});
        assert.ok(!result.transforms.resize, 'Should not resize image');

        result = await ModulesRunner.execModuleForTest('resize', image, {
            displayWidth: 100,
            displayHeight: undefined
        }, {}, {stats: {
            format: 'jpg',
            weight: image.length
        }});
        assert.ok(!result.transforms.resize, 'Should not resize image');

        result = await ModulesRunner.execModuleForTest('resize', image, {
            displayWidth: 0,
            displayHeight: 600
        }, {}, {stats: {
            format: 'jpg',
            weight: image.length
        }});
        assert.ok(!result.transforms.resize, 'Should not resize image');

        result = await ModulesRunner.execModuleForTest('resize', image, {
            displayWidth: null,
            displayHeight: 100
        }, {}, {stats: {
            format: 'jpg',
            weight: image.length
        }});
        assert.ok(!result.transforms.resize, 'Should not resize image');
    });


    const files = [
        {name: 'jpeg-image.jpg', format: 'jpg', width: 285, height: 427},
        {name: 'png-image.png', format: 'png', width: 664, height: 314},
        {name: 'animated.gif', format: 'gif', width: 50, height: 50},
        {name: 'webp-image.webp', format: 'webp', width: 628, height: 444},
        {name: 'animated.webp', format: 'webp', width: 400, height: 400},
        {name: 'avif-image.avif', format: 'avif', width: 200, height: 200}
    ];

    files.forEach(file => {
        it('should succeed resizing a ' + file.format, async () => {
            const image = await fs.readFile(path.resolve(__dirname, './images/', file.name));
            const resizeResult = await ModulesRunner.execModuleForTest('resize', image, {
                displayWidth: file.width / 10,
                displayHeight: file.height / 10
            }, {}, {stats: {
                format: file.format,
                weight: image.length,
                width: file.width,
                height: file.height
            }});

            assert.ok(resizeResult.transforms.resize.weight < image.length, 'New file is smaller than original file');
            assert.ok(resizeResult.transforms.resize.gainFromOriginal > 0, 'Gain is provided');
            assert.strictEqual(resizeResult.transforms.resize.body.length, resizeResult.transforms.resize.weight, 'New buffer saved');

            const newContentType = await ModulesRunner.execModuleForTest('contentType', resizeResult.transforms.resize.body);
            assert.strictEqual(newContentType.stats.format, file.format, 'Content type is still the same');
        });
    });

    it ('should not resize an SVG file', async () => {
        const image = await fs.readFile(path.resolve(__dirname, './images/svg-image.svg'));
        
        const result = await ModulesRunner.execModuleForTest('resize', image, {
            displayWidth: 200,
            displayHeight: 200
        }, {}, {stats: {
            format: 'svg',
            weight: image.length
        }});

        assert.ok(!result.transforms.resize, 'Should not resize image');
    });
});