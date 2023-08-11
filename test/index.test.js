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
            const image = await fs.readFile(path.resolve(__dirname, './images/jpeg-image.jpg'));
            const res = await analyzeImage(image, {
                displayWidth: 200,
                displayHeight: 100,
                viewportWidth: 1200,
                viewportHeight: 800,
                html: '<picture><source media="(max-width: 600px)" srcset="image3.jpg 30w" sizes="100vw" /><img srcset="image1.jpg 10w,image2.jpg 20w" sizes="5vw" /></picture>'
            });
            console.log(res.stats);
            // Stats
            assert.strictEqual(res.stats.format, 'jpg');
            assert.strictEqual(res.stats.mimeType, 'image/jpeg');
            assert.strictEqual(res.stats.weight, image.length);
            assert.strictEqual(res.stats.width, 285);
            assert.strictEqual(res.stats.height, 427);
            assert.strictEqual(res.stats.animated, false);
            assert.strictEqual(res.stats.sizesAttribute, '5vw');
            assert.strictEqual(res.stats.srcsetAttribute, 'image1.jpg 10w, image2.jpg 20w');
            assert.strictEqual(res.stats.displayDensity.toFixed(4), '2.8475');
            assert.strictEqual(res.stats.displayRatio.toFixed(4), '2.8475');

            // Transforms
            assert.ok(res.transforms.optimized.weight < image.length);
            assert.ok(res.transforms.optimized.gain > 0);
            assert.strictEqual(res.transforms.optimized.gain, image.length - res.transforms.optimized.weight);
            assert.strictEqual(Buffer.isBuffer(res.transforms.optimized.body), true);
            assert.strictEqual(res.transforms.optimized.body.length, res.transforms.optimized.weight);
            
            assert.ok(res.transforms.resized.weight < image.length);
            assert.strictEqual(res.transforms.resized.width, 200);
            assert.strictEqual(res.transforms.resized.height, 100);
            assert.ok(res.transforms.resized.gain > 0);
            assert.strictEqual(res.transforms.resized.gain, res.transforms.optimized.weight - res.transforms.resized.weight);
            assert.strictEqual(Buffer.isBuffer(res.transforms.resized.body), true);
            assert.strictEqual(res.transforms.resized.body.length, res.transforms.resized.weight);

            assert.ok(res.transforms.webpEncoded.weight < image.length);
            assert.ok(res.transforms.webpEncoded.gain > 0);
            assert.strictEqual(res.transforms.webpEncoded.gain, image.length - res.transforms.webpEncoded.weight);

            assert.ok(res.transforms.avifEncoded.weight < image.length);
            assert.ok(res.transforms.avifEncoded.gain > 0);
            assert.strictEqual(res.transforms.avifEncoded.gain, image.length - res.transforms.avifEncoded.weight);

            // Offenders
            assert.strictEqual(res.offenders.imageNotOptimized.beforeWeight, res.stats.weight);
            assert.ok(res.offenders.imageNotOptimized.afterWeight > 0);

            assert.strictEqual(res.offenders.imageScaledDown.beforeWeight, res.transforms.optimized.weight);
            assert.ok(res.offenders.imageScaledDown.afterWeight > 0);
            assert.strictEqual(res.offenders.imageScaledDown.width, 200);
            assert.strictEqual(res.offenders.imageScaledDown.height, 100);

            assert.strictEqual(res.offenders.imageOldFormat.beforeWeight, res.stats.weight);
            assert.ok(res.offenders.imageOldFormat.afterWeight > 0);
            assert.ok(res.offenders.imageOldFormat.webpWeight > 0);
            assert.ok(res.offenders.imageOldFormat.avifWeight > 0);

            assert.strictEqual(res.offenders.imageWithIncorrectSizesParam.convertedInPx, 60);
            assert.strictEqual(res.offenders.imageWithIncorrectSizesParam.displayWidth, 200);

            assert.strictEqual(res.offenders.imageExcessiveDensity.displayDensity.toFixed(4), '2.8475');
            assert.strictEqual(res.offenders.imageExcessiveDensity.recommendedMaxDensity, 2);
        });
    });
});