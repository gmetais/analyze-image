import { describe, it } from '@jest/globals';

import {execModuleForTest} from '../lib/modulesRunner.js';
import assert from 'assert';
import fs from 'node:fs/promises';
import * as path from 'path';
import {fileURLToPath} from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));


describe('Image type detection', () => {

    const files = [
        {name: 'svg-image.svg', mimeType: 'image/svg+xml', format: 'svg'},
        {name: 'jpeg-image.jpg', mimeType: 'image/jpeg', format: 'jpg'},
        {name: 'png-image.png', mimeType: 'image/png', format: 'png'},
        {name: 'animated.gif', mimeType: 'image/gif', format: 'gif'},
        {name: 'webp-image.webp', mimeType: 'image/webp', format: 'webp'},
        {name: 'animated.webp', mimeType: 'image/webp', format: 'webp'},
        {name: 'avif-image.avif', mimeType: 'image/avif', format: 'avif'}
    ];

    files.forEach(file => {
        it('should detect a ' + file.format + ' image', async () => {
            const image = await fs.readFile(path.resolve(__dirname, './images/', file.name));
            const res = await execModuleForTest('contentType', image);
            assert.strictEqual(res.stats.mimeType, file.mimeType, 'Mime type is correct');
            assert.strictEqual(res.stats.format, file.format, 'Format is correct');
        });
    });

    it('should return undefined on unknown file format', async () => {
        let res = await execModuleForTest('contentType', 'foo');
        assert.strictEqual(res.stats.mimeType, undefined, 'Mime type is undefined');
        assert.strictEqual(res.stats.format, undefined, 'Format is undefined');

        const file = await fs.readFile(path.resolve(__dirname, './images/pdf-file.pdf'));
        res = await execModuleForTest('contentType', file);
        assert.strictEqual(res.stats.mimeType, undefined, 'Mime type is undefined');
        assert.strictEqual(res.stats.format, undefined, 'Format is undefined');
    });
});