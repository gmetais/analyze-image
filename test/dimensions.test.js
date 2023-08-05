const { describe, it } = require("@jest/globals");

const dimensionsModule = require('../lib/modules/dimensions'),
    assert = require('assert'),
    fs = require('fs').promises,
    path = require('path');


describe('Image type detection', () => {

    const files = [
        {name: 'svg-image.svg', format: 'svg', width: undefined, height: undefined},
        {name: 'jpeg-image.jpg', format: 'jpg', width: 285, height: 427},
        {name: 'png-image.png', format: 'png', width: 664, height: 314},
        {name: 'animated.gif', format: 'gif', width: 50, height: 50},
        {name: 'webp-image.webp', format: 'webp', width: 628, height: 444},
        {name: 'animated.webp', format: 'webp', width: 400, height: 400},
        {name: 'avif-image.avif', format: 'avif', width: 200, height: 200}
    ];

    files.forEach(file => {
        it('should detect the dimensions of a ' + file.format + ' image', async () => {
            const image = await fs.readFile(path.resolve(__dirname, './images/', file.name));
            const res = await dimensionsModule({
                body: image, 
                result: {
                    format: file.format
                }
            });
            assert.strictEqual(res.width, file.width, 'Width is correct');
            assert.strictEqual(res.height, file.height, 'Height is correct');
        });
    });
});