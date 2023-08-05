const { describe, it } = require("@jest/globals");

const contentTypeModule = require('../lib/modules/contentType'),
    assert = require('assert'),
    fs = require('fs').promises,
    path = require('path');


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
            const res = await contentTypeModule({image: image});
            assert.strictEqual(res.mimeType, file.mimeType, 'Mime type is correct');
            assert.strictEqual(res.format, file.format, 'Format is correct');
        });
    });

    it('should return undefined on unknown file format', async () => {
        let res = await (contentTypeModule({image: 'foo'}));
        assert.strictEqual(res.mimeType, undefined, 'Mime type is undefined');
        assert.strictEqual(res.format, undefined, 'Format is undefined');

        const file = await fs.readFile(path.resolve(__dirname, './images/pdf-file.pdf'));
        res = await contentTypeModule({image: file});
        assert.strictEqual(res.mimeType, undefined, 'Mime type is undefined');
        assert.strictEqual(res.format, undefined, 'Format is undefined');
    });
});