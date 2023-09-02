import { describe, it } from '@jest/globals';

import {execModuleForTest} from '../lib/modulesRunner.js';
import assert from 'assert';
import fs from 'node:fs/promises';
import * as path from 'path';
import {fileURLToPath} from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));


describe('Animated image detection', () => {

    const files = [
        {name: 'svg-image.svg', format: 'svg', animated: undefined},
        {name: 'jpeg-image.jpg', format: 'jpg', animated: false},
        {name: 'png-image.png', format: 'png', animated: false},
        {name: 'animated.gif', format: 'gif', animated: true},
        {name: 'webp-image.webp', format: 'webp', animated: false},
        {name: 'animated.webp', format: 'webp', animated: true},
        {name: 'avif-image.avif', format: 'avif', animated: undefined}
    ];

    files.forEach(file => {
        it('should detect if the ' + file.format + ' image is animated', async () => {
            const image = await fs.readFile(path.resolve(__dirname, './images/', file.name));
            const res = await execModuleForTest('animated', image, {}, {}, {stats: {format: file.format}});
            assert.strictEqual(res.stats.animated, file.animated, 'Animated property is correct');
        });
    });
});