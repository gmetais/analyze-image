import { describe, it } from '@jest/globals';

import {execModuleForTest} from '../lib/modulesRunner.js';
import assert from 'assert';
import fs from 'node:fs/promises';
import * as path from 'path';
import sharp from 'sharp';
import {fileURLToPath} from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));


describe('Resize module', () => {
    it ('should not resize if display dimensions are not set', async () => {
        const image = await fs.readFile(path.resolve(__dirname, './images/jpeg-image.jpg'));
        
        let result;

        result = await execModuleForTest('resize', image, {}, {}, {stats: {
            format: 'jpg',
            fileSize: image.length
        }});
        assert.ok(!result.transforms.resized, 'Should not resize image');

        result = await execModuleForTest('resize', image, {
            displayWidth: 100,
            displayHeight: undefined
        }, {}, {stats: {
            format: 'jpg',
            fileSize: image.length
        }});
        assert.ok(!result.transforms.resized, 'Should not resize image');

        result = await execModuleForTest('resize', image, {
            displayWidth: 0,
            displayHeight: 600
        }, {}, {stats: {
            format: 'jpg',
            fileSize: image.length
        }});
        assert.ok(!result.transforms.resized, 'Should not resize image');

        result = await execModuleForTest('resize', image, {
            displayWidth: null,
            displayHeight: 100
        }, {}, {stats: {
            format: 'jpg',
            fileSize: image.length
        }});
        assert.ok(!result.transforms.resized, 'Should not resize image');
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
            const resizeResult = await execModuleForTest('resize', image, {
                displayWidth: file.width / 10,
                displayHeight: file.height / 10
            }, {
                removeBuffersFromTransforms: false
            }, {stats: {
                format: file.format,
                fileSize: image.length,
                width: file.width,
                height: file.height
            }});

            assert.strictEqual(resizeResult.transforms.resized.naturalWidth, file.width);
            assert.strictEqual(resizeResult.transforms.resized.naturalHeight, file.height);
            assert.ok(resizeResult.transforms.resized.fileSize > 0);
            assert.strictEqual(resizeResult.transforms.resized.newWidth, Math.round(file.width / 10));
            assert.strictEqual(resizeResult.transforms.resized.newHeight, Math.round(file.height / 10));
            assert.strictEqual(resizeResult.transforms.resized.dpr, 1);
            assert.ok(resizeResult.transforms.resized.newFileSize < image.length);
            assert.strictEqual(resizeResult.transforms.resized.body.length, resizeResult.transforms.resized.newFileSize);

            const newContentType = await execModuleForTest('contentType', resizeResult.transforms.resized.body);
            assert.strictEqual(newContentType.stats.format, file.format);

            assert.strictEqual(resizeResult.offenders.imageScaledDown.naturalWidth, file.width);
            assert.strictEqual(resizeResult.offenders.imageScaledDown.naturalHeight, file.height);
            assert.ok(resizeResult.offenders.imageScaledDown.fileSize > 0);
            assert.strictEqual(resizeResult.offenders.imageScaledDown.newWidth, Math.round(file.width / 10));
            assert.strictEqual(resizeResult.offenders.imageScaledDown.newHeight, Math.round(file.height / 10));
            assert.strictEqual(resizeResult.offenders.imageScaledDown.dpr, 1);
            assert.ok(resizeResult.offenders.imageScaledDown.newFileSize < image.length);
        });
    });

    it ('should not resize an SVG file', async () => {
        const image = await fs.readFile(path.resolve(__dirname, './images/svg-image.svg'));
        
        const result = await execModuleForTest('resize', image, {
            displayWidth: 200,
            displayHeight: 200
        }, {}, {stats: {
            format: 'svg',
            fileSize: image.length
        }});

        assert.ok(!result.transforms.resized, 'Should not resize image');

        assert.strictEqual(result.offenders.imageScaledDown, undefined);
    });

    it('should multiply display size with DPR', async () => {
        const image = await fs.readFile(path.resolve(__dirname, './images/jpeg-image.jpg'));
        const resizeResult = await execModuleForTest('resize', image, {
            displayWidth: 28,
            displayHeight: 43,
            dpr: 2
        }, {
            removeBuffersFromTransforms: false
        }, {stats: {
            format: 'jpg',
            fileSize: image.length,
            width: 285,
            height: 427
        }});

        assert.ok(resizeResult.transforms.resized.newFileSize < image.length);
        assert.ok(resizeResult.transforms.resized.newFileSize < resizeResult.transforms.resized.fileSize);
        assert.strictEqual(resizeResult.transforms.resized.body.length, resizeResult.transforms.resized.newFileSize, 'New buffer saved');

        const newContentType = await execModuleForTest('contentType', resizeResult.transforms.resized.body);
        assert.strictEqual(newContentType.stats.format, 'jpg', 'Content type is still the same');

        assert.ok(resizeResult.offenders.imageScaledDown.newFileSize > 0);
        assert.ok(resizeResult.offenders.imageScaledDown.newFileSize < resizeResult.offenders.imageScaledDown.fileSize);
        assert.strictEqual(resizeResult.offenders.imageScaledDown.newWidth, 28 * 2);
        assert.strictEqual(resizeResult.offenders.imageScaledDown.newHeight, 43 * 2);
    });

    it('should report excessive image density and resize further', async () => {
        const image = await fs.readFile(path.resolve(__dirname, './images/jpeg-image.jpg'));
        const res = await execModuleForTest('resize', image, {
            displayWidth: 28,
            displayHeight: 43,
            dpr: 3
        }, {}, {
            stats: {
                format: 'jpg',
                displayDensity: 10.05440,
                width: 285,
                height: 427,
                fileSize: image.length
            }
        });
        assert.strictEqual(res.offenders.imageExcessiveDensity.referenceDensity, 3);
        assert.strictEqual(res.offenders.imageExcessiveDensity.recommendedMaxDensity, 2);
        assert.strictEqual(res.offenders.imageExcessiveDensity.recommendedWidth, 56);
        assert.strictEqual(res.offenders.imageExcessiveDensity.recommendedHeight, 86);
        assert.ok(res.offenders.imageExcessiveDensity.fileSize < image.length);
        assert.ok(res.offenders.imageExcessiveDensity.newFileSize < res.offenders.imageExcessiveDensity.fileSize);
        assert.ok(res.offenders.imageExcessiveDensity.newFileSize > 0);
    });
});