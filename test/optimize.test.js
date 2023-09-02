import { describe, it } from '@jest/globals';

import {execModuleForTest} from '../lib/modulesRunner.js';
import {optimizeImage} from '../lib/modules/optimize.js';
import assert from 'assert';
import fs from 'node:fs/promises';
import * as path from 'path';
import sharp from 'sharp';
import {fileURLToPath} from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));


describe('Image optimization tools', () => {
    const files = [
        {name: 'svg-image.svg', format: 'svg'},
        {name: 'jpeg-image.jpg', format: 'jpg'},
        {name: 'png-image.png', format: 'png'},
        {name: 'animated.gif', format: 'gif'},
        {name: 'webp-image.webp', format: 'webp'},
        {name: 'animated.webp', format: 'webp'},
        {name: 'avif-image.avif', format: 'avif'}
    ];

    files.forEach(file => {
        it('should re-encode a ' + file.format + ' image', async () => {
            const image = await fs.readFile(path.resolve(__dirname, './images/', file.name));
            const newImage = await optimizeImage(image, file.format, {});
            assert.ok(newImage.length > 1, 'Image was re-encoded');

            const newContentType = await execModuleForTest('contentType', newImage);
            assert.strictEqual(file.format, newContentType.stats.format, 'Content type is still the same');
        });
    });
});

describe('Optimize module', () => {
    it('should succeed optimizing a jpg', async () => {
        const image = await fs.readFile(path.resolve(__dirname, './images/jpeg-image.jpg'));
        const result = await execModuleForTest('optimize', image, {}, {}, {stats: {
            format: 'jpg',
            width: 285,
            height: 427,
            fileSize: image.length
        }});
        assert.ok(result.transforms.optimized.newFileSize < image.length, 'New file is smaller than original file');
        assert.strictEqual(result.offenders.imageNotOptimized.fileSize, image.length);
        assert.strictEqual(result.offenders.imageNotOptimized.newFileSize, result.transforms.optimized.newFileSize);
    });

    it('should not add an offender if gain is not good enough', async () => {
        const image = await fs.readFile(path.resolve(__dirname, './images/jpeg-image.jpg'));
        const result = await execModuleForTest('optimize', image, {}, {jpgQuality: 100}, {stats: {
            format: 'jpg',
            fileSize: image.length
        }});
        assert.ok(result.transforms.optimized);
        assert.strictEqual(result.offenders.imageNotOptimized, undefined);
    });

    it('should succeed optimizing a png', async () => {
        const image = await fs.readFile(path.resolve(__dirname, './images/png-image.png'));
        const result = await execModuleForTest('optimize', image, {}, {}, {stats: {
            format: 'png',
            fileSize: image.length
        }});
        assert.ok(result.transforms.optimized.newFileSize < image.length, 'New file is smaller than original file');
        assert.strictEqual(result.offenders.imageNotOptimized.fileSize, image.length);
        assert.strictEqual(result.offenders.imageNotOptimized.newFileSize, result.transforms.optimized.newFileSize);
    });

    it('should succeed optimizing a webp', async () => {
        const image = await fs.readFile(path.resolve(__dirname, './images/webp-image.webp'));
        const result = await execModuleForTest('optimize', image, {}, {}, {stats: {
            format: 'webp',
            fileSize: image.length
        }});
        assert.ok(result.transforms.optimized.newFileSize < image.length, 'New file is smaller than original file');
        assert.strictEqual(result.offenders.imageNotOptimized.fileSize, image.length);
        assert.strictEqual(result.offenders.imageNotOptimized.newFileSize, result.transforms.optimized.newFileSize);
    });

    it('should succeed optimizing an animated webp', async () => {
        const image = await fs.readFile(path.resolve(__dirname, './images/animated.webp'));
        const result = await execModuleForTest('optimize', image, {}, {webpQuality: 1}, {stats: {
            format: 'webp',
            fileSize: image.length
        }});
        assert.ok(result.transforms.optimized.newFileSize < image.length, 'New file is smaller than original file');
        const sharpMetadata = await sharp(image).metadata();
        assert.strictEqual(sharpMetadata.pages, 12, 'The image is still animated');
        assert.strictEqual(result.offenders.imageNotOptimized.fileSize, image.length);
        assert.strictEqual(result.offenders.imageNotOptimized.newFileSize, result.transforms.optimized.newFileSize);
    });

    // TODO find an unoptimized test GIF!
    /*it('should succeed optimizing a gif', async () => {
        const image = await fs.readFile(path.resolve(__dirname, './images/animated.webp'));
        const result = await execModuleForTest('optimize', image, {}, {}, {stats: {
            format: 'gif',
            fileSize: image.length
        }});
        assert.ok(result.transforms.optimized.newFileSize < image.length, 'New file is smaller than original file');
        const sharpMetadata = await sharp(image).metadata();
        assert.strictEqual(sharpMetadata.pages, 10, 'The image is still animated');
    });*/

    it('should succeed optimizing an svg', async () => {
        const image = await fs.readFile(path.resolve(__dirname, './images/svg-image.svg'));
        const result = await execModuleForTest('optimize', image.toString(), {}, {}, {stats: {
            format: 'svg',
            fileSize: image.length
        }});
        assert.ok(result.transforms.optimized.newFileSize < image.length, 'New file is smaller than original file');
        assert.strictEqual(result.offenders.imageNotOptimized.fileSize, image.length);
        assert.strictEqual(result.offenders.imageNotOptimized.newFileSize, result.transforms.optimized.newFileSize);
    });
});