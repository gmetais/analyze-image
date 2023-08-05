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
            assert.strictEqual(res.mimeType, 'image/svg+xml', 'Mime type is correct');
            assert.strictEqual(res.format, 'svg', 'Format is correct');
        });

        it('should load a base64 encoded JPEG image', async () => {
            const image = await fs.readFile(path.resolve(__dirname, './images/jpeg-image.jpg'), {encoding: 'base64'});
            const res = await analyzeImage(image);
            assert.strictEqual(res.mimeType, 'image/jpeg', 'Mime type is correct');
            assert.strictEqual(res.format, 'jpg', 'Format is correct');
        });
    });

    describe('Image as a buffer', () => {
        it('should load a PNG image', async () => {
            const image = await fs.readFile(path.resolve(__dirname, './images/png-image.png'));
            const res = await analyzeImage(image);
            assert.strictEqual(res.mimeType, 'image/png', 'Mime type is correct');
            assert.strictEqual(res.format, 'png', 'Format is correct');
        });

        it('should load an SVG inside a buffer', async () => {
            const image = await fs.readFile(path.resolve(__dirname, './images/svg-image.svg'));
            const buffer = Buffer.from(image, 'base64');
            const res = await analyzeImage(buffer);
            assert.strictEqual(res.mimeType, 'image/svg+xml', 'Mime type is correct');
            assert.strictEqual(res.format, 'svg', 'Format is correct');
        });
    });
});