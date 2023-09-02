import { describe, it } from '@jest/globals';

import {execModuleForTest} from '../lib/modulesRunner.js';
import assert from 'assert';
import fs from 'node:fs/promises';
import * as path from 'path';
import sharp from 'sharp';
import {fileURLToPath} from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));


describe('Reformat module', () => {
    it ('should not reformat an SVG', async () => {
        const image = await fs.readFile(path.resolve(__dirname, './images/svg-image.svg'));
        const result = await execModuleForTest('reformat', image, {}, {}, {stats: {
            format: 'svg',
            fileSize: image.length
        }});
        assert.ok(!result.transforms.reformat, 'Should not reformat image');
    });
    it ('should not reformat an AVIF', async () => {
        const image = await fs.readFile(path.resolve(__dirname, './images/avif-image.avif'));
        const result = await execModuleForTest('reformat', image, {}, {}, {stats: {
            format: 'avif',
            fileSize: image.length
        }});
        assert.ok(!result.transforms.reformat, 'Should not reformat image');
    });
    it ('should not reformat an animated WebP', async () => {
        const image = await fs.readFile(path.resolve(__dirname, './images/animated.webp'));
        const result = await execModuleForTest('reformat', image, {}, {}, {stats: {
            format: 'webp',
            fileSize: image.length,
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
            const result = await execModuleForTest('reformat', image, {}, {removeBuffersFromTransforms: false}, {stats: {
                format: file.format,
                fileSize: image.length,
                animated: file.animated
            }});

            assert.ok(result.transforms.webpEncoded.currentFormat, files.format);
            assert.ok(result.transforms.webpEncoded.newFileSize > 0, 'New file weight is provided');
            assert.strictEqual(result.transforms.webpEncoded.body.length, result.transforms.webpEncoded.newFileSize);
            assert.ok(result.transforms.webpEncoded.fileSize > 0);

            const newContentType = await execModuleForTest('contentType', result.transforms.webpEncoded.body);
            assert.strictEqual(newContentType.stats.format, 'webp', 'Content type is webp');

            assert.ok(result.offenders.imageOldFormat.currentFormat, files.format);
            assert.strictEqual(result.offenders.imageOldFormat.fileSize, image.length);
            assert.ok(result.offenders.imageOldFormat.newFileSize > 0);
            assert.ok(result.offenders.imageOldFormat.newFileSize < result.offenders.imageOldFormat.fileSize);
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
            const result = await execModuleForTest('reformat', image, {}, {removeBuffersFromTransforms: false}, {stats: {
                format: file.format,
                fileSize: image.length,
                animated: file.animated
            }});

            assert.ok(result.transforms.avifEncoded.currentFormat, files.format);
            assert.ok(result.transforms.avifEncoded.newFileSize > 0, 'New file weight is provided');
            assert.strictEqual(result.transforms.avifEncoded.body.length, result.transforms.avifEncoded.newFileSize);
            assert.ok(result.transforms.avifEncoded.fileSize > 0);

            const newContentType = await execModuleForTest('contentType', result.transforms.avifEncoded.body);
            assert.strictEqual(newContentType.stats.format, 'avif', 'Content type is webp');

            assert.ok(result.offenders.imageOldFormat.currentFormat, files.format);
            assert.strictEqual(result.offenders.imageOldFormat.fileSize, image.length);
            assert.ok(result.offenders.imageOldFormat.newFileSize > 0);
            assert.ok(result.offenders.imageOldFormat.newFileSize < result.offenders.imageOldFormat.fileSize);
        });
    });
});