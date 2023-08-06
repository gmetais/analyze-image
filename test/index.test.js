const { describe, it } = require("@jest/globals");

const analyzeImage = require('../.'),
    assert = require('assert'),
    fs = require('fs').promises,
    path = require('path');


describe('Image parameter', () => {
    describe('Wrong image parameter', () => {
        it('should fail loading anything else than string or buffer', async () => {
            try {
                await analyzeImage(42);
            } catch(error) {
                assert.strictEqual(error.code, analyzeImage.EXIT_IMAGE_PASSED_IS_INVALID, 'Error code 253 is returned');
            }

            try {
                await analyzeImage(true);
            } catch(error) {
                assert.strictEqual(error.code, analyzeImage.EXIT_IMAGE_PASSED_IS_INVALID, 'Error code 253 is returned');
            }

            try {
                await analyzeImage({});
            } catch(error) {
                assert.strictEqual(error.code, analyzeImage.EXIT_IMAGE_PASSED_IS_INVALID, 'Error code 253 is returned');
            }

            try {
                await analyzeImage(undefined);
            } catch(error) {
                assert.strictEqual(error.code, analyzeImage.EXIT_IMAGE_PASSED_IS_INVALID, 'Error code 253 is returned');
            }
        });

        it('should fail loading improper format in a Promise way', async () => {
            analyzeImage(42).catch(function(error) {
                assert.strictEqual(error.code, analyzeImage.EXIT_IMAGE_PASSED_IS_INVALID, 'Error code 253 is returned');
            });
        });
    });

    describe('Empty image', () => {
        it('should fail loading an empty string', async () => {
            try {
                await analyzeImage('');
            } catch(error) {
                assert.strictEqual(error.code, analyzeImage.EXIT_EMPTY_IMAGE, 'Error code 252 is returned');
            }
        });

        it('should fail loading an empty buffer', async () => {
            try {
                await analyzeImage(Buffer.from([]));
            } catch(error) {
                assert.strictEqual(error.code, analyzeImage.EXIT_EMPTY_IMAGE, 'Error code 252 is returned');
            }
        });
    });

    describe('Image as a string', () => {
        it('should load an SVG image', async () => {
            const image = await fs.readFile(path.resolve(__dirname, './images/svg-image.svg'));
            const res = await analyzeImage(image.toString());
            assert.strictEqual(res.stats.mimeType, 'image/svg+xml', 'Mime type is correct');
            assert.strictEqual(res.stats.format, 'svg', 'Format is correct');
        });

        it('should load a base64 encoded JPEG image', async () => {
            const image = await fs.readFile(path.resolve(__dirname, './images/jpeg-image.jpg'), {encoding: 'base64'});
            const res = await analyzeImage(image);
            assert.strictEqual(res.stats.mimeType, 'image/jpeg', 'Mime type is correct');
            assert.strictEqual(res.stats.format, 'jpg', 'Format is correct');
        });
    });

    describe('Image as a buffer', () => {
        it('should load a PNG image', async () => {
            const image = await fs.readFile(path.resolve(__dirname, './images/png-image.png'));
            const res = await analyzeImage(image);
            assert.strictEqual(res.stats.mimeType, 'image/png', 'Mime type is correct');
            assert.strictEqual(res.stats.format, 'png', 'Format is correct');
        });

        it('should load an SVG inside a buffer', async () => {
            const image = await fs.readFile(path.resolve(__dirname, './images/svg-image.svg'));
            const buffer = Buffer.from(image, 'base64');
            const res = await analyzeImage(buffer);
            assert.strictEqual(res.stats.mimeType, 'image/svg+xml', 'Mime type is correct');
            assert.strictEqual(res.stats.format, 'svg', 'Format is correct');
        });
    });

    describe('Output format', () => {
        it('should be respected', async () => {
            const image = await fs.readFile(path.resolve(__dirname, './images/png-image.png'));
            const res = await analyzeImage(image, {
                displayWidth: 200,
                displayHeight: 100
            });
            
            assert.strictEqual(res.stats.format, 'png');
            assert.strictEqual(res.stats.mimeType, 'image/png');
            assert.strictEqual(res.stats.weight, image.length);
            assert.strictEqual(res.stats.width, 664);
            assert.strictEqual(res.stats.height, 314);
            assert.strictEqual(res.stats.animated, false);
            assert.ok(res.transforms.optimize.weight < image.length);
            assert.ok(res.transforms.optimize.gainFromOriginal > 0);
            assert.strictEqual(res.transforms.optimize.gainFromOriginal, image.length - res.transforms.optimize.weight);
            assert.strictEqual(Buffer.isBuffer(res.transforms.optimize.body), true);
            assert.strictEqual(res.transforms.optimize.body.length, res.transforms.optimize.weight);
            assert.ok(res.transforms.resize.weight < image.length);
            assert.strictEqual(res.transforms.resize.width, 200);
            assert.strictEqual(res.transforms.resize.height, 100);
            assert.ok(res.transforms.resize.gainFromOriginal > 0);
            assert.strictEqual(res.transforms.resize.gainFromOriginal, image.length - res.transforms.resize.weight);
            assert.strictEqual(Buffer.isBuffer(res.transforms.resize.body), true);
            assert.strictEqual(res.transforms.resize.body.length, res.transforms.resize.weight);
        });
    });
});