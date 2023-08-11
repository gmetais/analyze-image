const { describe, it } = require("@jest/globals");

const ModulesRunner = require('../lib/modulesRunner'),
    sizesAttribute = require('../lib/modules/responsive')
    assert = require('assert');


describe('Sizes HTML attribute checker', () => {
    it('should fail if no HTML code is provided', async () => {
        const result = await ModulesRunner.execModuleForTest('responsive', '', {
            displayWidth: 100,
            displayHeight: 100,
            viewportWidth: 1200,
            viewportHeight: 800
        });
        assert.deepEqual(result.offenders, {});
    });
    it('should fail silently if the HTML code is not real HTML', async () => {
        const result = await ModulesRunner.execModuleForTest('responsive', '', {
            displayWidth: 100,
            displayHeight: 100,
            viewportWidth: 1200,
            viewportHeight: 800,
            html: 'foo'
        });
        assert.deepEqual(result.offenders, {});
    });
    it('should fail if viewport width is not provided', async () => {
        const result = await ModulesRunner.execModuleForTest('responsive', '', {
            displayWidth: 100,
            displayHeight: 100,
            viewportWidth: 1200,
            html: '<img src="image.jpg" sizes="100vw">'
        });
        assert.deepEqual(result.offenders, {});
    });
    it('should fail if viewport height is not provided', async () => {
        const result = await ModulesRunner.execModuleForTest('responsive', '', {
            displayWidth: 100,
            displayHeight: 100,
            viewportheight: 800,
            html: '<img src="image.jpg" sizes="100vw">'
        });
        assert.deepEqual(result.offenders, {});
    });
});

describe('parse a srcset attribute and check that it is a valid w type', () => {
    it('succeeds with a single url', async () => {
        const validated = sizesAttribute.validateSrcset('image1.jpg 1w');
        assert.strictEqual(validated, 'image1.jpg 1w');
    });
    it('succeeds with 2 urls', async () => {
        const validated = sizesAttribute.validateSrcset(' image1.jpg 1w ,  image2.jpg 2w ');
        assert.strictEqual(validated, 'image1.jpg 1w, image2.jpg 2w');
    });
    it('succeeds with 3 urls', async () => {
        const validated = sizesAttribute.validateSrcset('image1.jpg  1w, image2.jpg 2w  , image3.jpg 3w,');
        assert.strictEqual(validated, 'image1.jpg 1w, image2.jpg 2w, image3.jpg 3w');
    });
    it('fails without w', async () => {
        const validated = sizesAttribute.validateSrcset('image1.jpg 1');
        assert.strictEqual(validated, false);
    });
    it('fails without w', async () => {
        const validated = sizesAttribute.validateSrcset('image1.jpg');
        assert.strictEqual(validated, false);
    });
    it('fails with x url', async () => {
        const validated = sizesAttribute.validateSrcset('image1.jpg 1x');
        assert.strictEqual(validated, false);
    });
    it('fails with multiple x url', async () => {
        const validated = sizesAttribute.validateSrcset('image1.jpg 1x, image2.jpg 2x');
        assert.strictEqual(validated, false);
    });
    it('fails with mixed urls', async () => {
        const validated = sizesAttribute.validateSrcset('image1.jpg 1x, image2.jpg 2w');
        assert.strictEqual(validated, false);
    });
    it('fails with mixed urls', async () => {
        const validated = sizesAttribute.validateSrcset('image1.jpg 1w, image2.jpg 2x');
        assert.strictEqual(validated, false);
    });
    it('fails if empty', async () => {
        const validated = sizesAttribute.validateSrcset('');
        assert.strictEqual(validated, false);
    });
    it('fails if no x and no w', async () => {
        const validated = sizesAttribute.validateSrcset('image.jpg');
        assert.strictEqual(validated, false);
    });
    it('fails if srcset is undefined', async () => {
        const validated = sizesAttribute.validateSrcset(undefined);
        assert.strictEqual(validated, false);
    });
});

describe('Look for sizes and srcset attributes on a simple <img> tag', () => {
    it('should not find sizes if there is no srcset', async () => {
        const html = '<img src="image.jpg" sizes="100vw">';
        const {sizes, srcset} = sizesAttribute.findSizesAndSrcsetAttributes(html);
        assert.strictEqual(sizes, undefined);
        assert.strictEqual(srcset, undefined);
    });
    it('should not find sizes if it is not there, but should find "w" type srcset', async () => {
        const html = '<img src="image.jpg" srcset="image1.jpg 1w, image2.jpg 2w">';
        const {sizes, srcset} = sizesAttribute.findSizesAndSrcsetAttributes(html);
        assert.strictEqual(sizes, undefined);
        assert.strictEqual(srcset, 'image1.jpg 1w, image2.jpg 2w');
    });
    it('should not find sizes if the srcset is not of "w" type', async () => {
        const html = '<img src="image.jpg" sizes="100vw" srcset="image1.jpg 1x, image2.jpg 2x">';
        const {sizes, srcset} = sizesAttribute.findSizesAndSrcsetAttributes(html);
        assert.strictEqual(sizes, undefined);
        assert.strictEqual(srcset, undefined);
    });
    it('should not find sizes if the srcset has an error', async () => {
        const html = '<img src="image.jpg" sizes="100vw" srcset="image1.jpg 1w, image2.jpg 2x">';
        const {sizes, srcset} = sizesAttribute.findSizesAndSrcsetAttributes(html);
        assert.strictEqual(sizes, undefined);
        assert.strictEqual(srcset, undefined);
    });
    it('should not find sizes if the srcset has an error', async () => {
        const html = '<img src="image.jpg" sizes="100vw" srcset="image1.jpg 1x, image2.jpg 2w">';
        const {sizes, srcset} = sizesAttribute.findSizesAndSrcsetAttributes(html);
        assert.strictEqual(sizes, undefined);
        assert.strictEqual(srcset, undefined);
    });
    it('should find sizes if we have a "w" type srcset', async () => {
        const html = '<img src="image.jpg" sizes="100vw" srcset="image1.jpg 1w, image2.jpg 2w">';
        const {sizes, srcset} = sizesAttribute.findSizesAndSrcsetAttributes(html);
        assert.strictEqual(sizes, '100vw');
        assert.strictEqual(srcset, 'image1.jpg 1w, image2.jpg 2w');
    });
     
});

describe('Quickly checks the media query matcher', () => {
    it('should correctly check resolution x unit', async () => {
        const matches = sizesAttribute.matchMediaQuery('(min-resolution: 2.5x)', 300, 300, 2);
        assert.strictEqual(matches, false);
    });
    it('should correctly check resolution x unit', async () => {
        const matches = sizesAttribute.matchMediaQuery('(min-resolution: 2.5x)', 300, 300, 3);
        assert.strictEqual(matches, true);
    });
    it('should fail silently', async () => {
        const matches = sizesAttribute.matchMediaQuery('foo: 333px', 300, 300, 3);
        assert.strictEqual(matches, false);
    });
});

describe('Look for sizes and srcset attributes on a <picture> tag', () => {
    it('should not find sizes if there is no srcset', async () => {
        const html = '<picture><source media="(min-width: 600px)" src="image.jpg"><img src="image.jpg" sizes="100vw"></picture>';
        const {sizes, srcset} = sizesAttribute.findSizesAndSrcsetAttributes(html, 700, 700, 2);
        assert.strictEqual(sizes, undefined);
        assert.strictEqual(srcset, undefined);
    });
    it('should not find sizes if there is no srcset', async () => {
        const html = '<picture><source media="(min-width: 600px)" src="image.jpg"><img src="image.jpg" sizes="100vw"></picture>';
        const {sizes, srcset} = sizesAttribute.findSizesAndSrcsetAttributes(html, 700, 700, 2);
        assert.strictEqual(sizes, undefined);
        assert.strictEqual(srcset, undefined);
    });
    it('should find sizes in a matching source', async () => {
        const html = '<picture><source media="(min-width: 600px)" srcset="image1.jpg 1w" sizes="100vw"><img src="image.jpg"></picture>';
        const {sizes, srcset} = sizesAttribute.findSizesAndSrcsetAttributes(html, 700, 700, 2);
        assert.strictEqual(sizes, '100vw');
        assert.strictEqual(srcset, 'image1.jpg 1w');
    });
    it('should find sizes in the img tag', async () => {
        const html = '<picture><source media="(min-width: 600px)" srcset="image1.jpg 1w"><img src="image.jpg" sizes="100vw"></picture>';
        const {sizes, srcset} = sizesAttribute.findSizesAndSrcsetAttributes(html, 700, 700, 2);
        assert.strictEqual(sizes, '100vw');
        assert.strictEqual(srcset, 'image1.jpg 1w');
    });
    it('should choose in priority the source sizes attribute', async () => {
        const html = '<picture><source media="(min-width: 600px)" srcset="image1.jpg 1w" sizes="50vw"><img src="image.jpg" sizes="100vw"></picture>';
        const {sizes, srcset} = sizesAttribute.findSizesAndSrcsetAttributes(html, 700, 700, 2);
        assert.strictEqual(sizes, '50vw');
        assert.strictEqual(srcset, 'image1.jpg 1w');
    });
    it('should not match a x srcset', async () => {
        const html = '<picture><source media="(min-width: 600px)" srcset="image1.jpg 1x" sizes="100vw"><img src="image.jpg"></picture>';
        const {sizes, srcset} = sizesAttribute.findSizesAndSrcsetAttributes(html, 700, 700, 2);
        assert.strictEqual(sizes, undefined);
        assert.strictEqual(srcset, undefined);
    });
    it('should not match a unknow image type', async () => {
        const html = '<picture><source media="(min-width: 600px)" srcset="image1.jpg 1x" sizes="100vw" type="image/foo"><img src="image.jpg"></picture>';
        const {sizes, srcset} = sizesAttribute.findSizesAndSrcsetAttributes(html, 700, 700, 2);
        assert.strictEqual(sizes, undefined);
        assert.strictEqual(srcset, undefined);
    });
    it('should choose the right source', async () => {
        const html = '<picture><source media="(min-width: 800px)" srcset="image1.jpg 1x" sizes="1vw"><source media="(min-width: 600px)" srcset="image2.jpg 2w" sizes="2vw"><source media="(min-width: 400px)" srcset="image3.jpg 3x" sizes="3vw"><img src="image.jpg"></picture>';
        const {sizes, srcset} = sizesAttribute.findSizesAndSrcsetAttributes(html, 700, 700, 2);
        assert.strictEqual(sizes, '2vw');
        assert.strictEqual(srcset, 'image2.jpg 2w');
    });
});

describe('Parse and match a sizes value', () => {
    it('should fail silently on an incorrect sizes attribute', async () => {
        const value = sizesAttribute.computeOneSizeValue('foo', 300, 700);
        assert.strictEqual(value, undefined);
    });
    it('should fail silently on an empty sizes attribute', async () => {
        const value = sizesAttribute.computeOneSizeValue('', 300, 700);
        assert.strictEqual(value, undefined);
    });
    it('parse correctly vw', async () => {
        const value = sizesAttribute.computeOneSizeValue('100vw', 300, 700);
        assert.strictEqual(value, 300);
    });
    it('parse correctly vw', async () => {
        const value = sizesAttribute.computeOneSizeValue('50vw', 300, 700);
        assert.strictEqual(value, 150);
    });
    it('parse correctly vh', async () => {
        const value = sizesAttribute.computeOneSizeValue('10vw', 300, 700);
        assert.strictEqual(value, 30);
    });
    it('work with extra whitespaces', async () => {
        const value = sizesAttribute.computeOneSizeValue(' 100vw ', 300, 700);
        assert.strictEqual(value, 300);
    });
    it('parse correctly calculate complicated stuff', async () => {
        const value = sizesAttribute.computeOneSizeValue('calc(100vw + (2 * 50vw) - 10em + 3px)', 300, 700);
        assert.strictEqual(value, 443);
    });
    it('work with decimal numbers', async () => {
        const value = sizesAttribute.computeOneSizeValue('calc(((100vw - 8.4vw) / 2) - 1.94vw)', 300, 700);
        assert.strictEqual(value, 131.58);
    });
});

describe('Parse and match an entire sizes attribute', () => {
    it('should fail silently on an incorrect sizes attribute', async () => {
        const value = sizesAttribute.computeSizeFromAttribute('foo', 300, 700, 1);
        assert.strictEqual(value, undefined);
    });
    it('should fail silently on an empty sizes attribute', async () => {
        const value = sizesAttribute.computeSizeFromAttribute('', 300, 700, 1);
        assert.strictEqual(value, undefined);
    });
    it('parse a single value', async () => {
        const value = sizesAttribute.computeSizeFromAttribute('100vw', 300, 700, 1);
        assert.strictEqual(value, 300);
    });
    it('parse a simple value with calc', async () => {
        const value = sizesAttribute.computeSizeFromAttribute('calc(50vw + 3px)', 300, 700, 1);
        assert.strictEqual(value, 153);
    });
    it('parse multiple values and pick the right one', async () => {
        const value = sizesAttribute.computeSizeFromAttribute('(max-width: 400px) 10vw, 20vw', 300, 700, 1);
        assert.strictEqual(value, 30);
    });
    it('parse multiple values and pick the right one', async () => {
        const value = sizesAttribute.computeSizeFromAttribute('(max-width: 200px) 5vw, (max-width: 400px) 10vw, 20vw', 300, 700, 1);
        assert.strictEqual(value, 30);
    });
    it('pick correctly the default value when mediaqueries are not good', async () => {
        const value = sizesAttribute.computeSizeFromAttribute('(max-width: 100px) 5vw, (max-width: 200px) 6vw, 10vw', 300, 700, 1);
        assert.strictEqual(value, 30);
    });
    it('work with extra whitespaces', async () => {
        const value = sizesAttribute.computeSizeFromAttribute(' ( max-width : 100px )  5vw ,  ( max-width :  200px )   6vw, 10vw ', 300, 700, 1);
        assert.strictEqual(value, 30);
    });
    it('work without whitespaces', async () => {
        const value = sizesAttribute.computeSizeFromAttribute('(max-width:100px) 5vw,(max-width:200px) 6vw,10vw', 300, 700, 2);
        assert.strictEqual(value, 30);
    });
});

describe('Detect incorrect sizes attributes from HTML', () => {
    it('doesn\'t detect anything on an image without srcset and sizes', async () => {
        const res = await ModulesRunner.execModuleForTest('responsive', '<svg></svg>', {
            displayWidth: 200,
            displayHeight: 100,
            viewportWidth: 300,
            viewportHeight: 700,
            html: '<img src="image1.jpg" />'
        }, {}, {});
        assert.ok(!res.stats.srcsetAttribute);
        assert.ok(!res.stats.sizesAttribute);
        assert.deepEqual(res.offenders, {});
    });
    it('doesn\'t detect anything on an image without a srcset', async () => {
        const res = await ModulesRunner.execModuleForTest('responsive', '<svg></svg>', {
            displayWidth: 200,
            displayHeight: 100,
            viewportWidth: 300,
            viewportHeight: 700,
            html: '<img src="image1.jpg" sizes="23vw" />'
        }, {}, {});
        assert.ok(!res.stats.srcsetAttribute);
        assert.ok(!res.stats.sizesAttribute);
        assert.deepEqual(res.offenders, {});
    });
    it('doesn\'t detect anything with an x srcset', async () => {
        const res = await ModulesRunner.execModuleForTest('responsive', '<svg></svg>', {
            displayWidth: 200,
            displayHeight: 100,
            viewportWidth: 300,
            viewportHeight: 700,
            html: '<img srcset="image1.jpg 1x,image2.jpg 2x" sizes="23vw" />'
        }, {}, {});
        assert.ok(!res.stats.srcsetAttribute);
        assert.ok(!res.stats.sizesAttribute);
        assert.deepEqual(res.offenders, {});
    });
    it('reports a "100vw default" sizes if no sizes attribute is set', async () => {
        const res = await ModulesRunner.execModuleForTest('responsive', '<svg></svg>', {
            displayWidth: 200,
            displayHeight: 100,
            viewportWidth: 300,
            viewportHeight: 700,
            html: '<img srcset="image1.jpg 1w,image2.jpg 2w" />'
        }, {}, {});
        assert.strictEqual(res.stats.srcsetAttribute, 'image1.jpg 1w, image2.jpg 2w');
        assert.strictEqual(res.stats.sizesAttribute, '100vw (default)');
        assert.strictEqual(res.offenders.imageWithIncorrectSizesParam.sizesAttribute, '100vw (default)');
        assert.strictEqual(res.offenders.imageWithIncorrectSizesParam.convertedInPx, 300);
        assert.strictEqual(res.offenders.imageWithIncorrectSizesParam.displayWidth, 200);
    });
    it('calculates the right size', async () => {
        const res = await ModulesRunner.execModuleForTest('responsive', '<svg></svg>', {
            displayWidth: 200,
            displayHeight: 100,
            viewportWidth: 300,
            viewportHeight: 700,
            html: '<img srcset="image1.jpg 1w,image2.jpg 2w" sizes="2vw" />'
        }, {}, {});
        assert.strictEqual(res.stats.srcsetAttribute, 'image1.jpg 1w, image2.jpg 2w');
        assert.strictEqual(res.stats.sizesAttribute, '2vw');
        assert.strictEqual(res.offenders.imageWithIncorrectSizesParam.convertedInPx, 6);
        assert.strictEqual(res.offenders.imageWithIncorrectSizesParam.displayWidth, 200);
    });
    it('calculates the right size and add an offender', async () => {
        const res = await ModulesRunner.execModuleForTest('responsive', '<svg></svg>', {
            displayWidth: 200,
            displayHeight: 100,
            viewportWidth: 300,
            viewportHeight: 700,
            html: '<img srcset="image1.jpg 1w,image2.jpg 2w" sizes="(max-width: 400px) 100vw, 50vw" />'
        }, {}, {});
        assert.strictEqual(res.stats.srcsetAttribute, 'image1.jpg 1w, image2.jpg 2w');
        assert.strictEqual(res.stats.sizesAttribute, '(max-width: 400px) 100vw, 50vw');
        assert.strictEqual(res.offenders.imageWithIncorrectSizesParam.convertedInPx, 300);
        assert.strictEqual(res.offenders.imageWithIncorrectSizesParam.displayWidth, 200);
    });
    it('also add an offender if the displayWidth is higher than calculated sizes', async () => {
        const res = await ModulesRunner.execModuleForTest('responsive', '<svg></svg>', {
            displayWidth: 200,
            displayHeight: 100,
            viewportWidth: 300,
            viewportHeight: 700,
            html: '<img srcset="image1.jpg 1w,image2.jpg 2w" sizes="(max-width: 200px) 100vw, 50vw" />'
        }, {}, {});
        assert.strictEqual(res.stats.srcsetAttribute, 'image1.jpg 1w, image2.jpg 2w');
        assert.strictEqual(res.stats.sizesAttribute, '(max-width: 200px) 100vw, 50vw');
        assert.strictEqual(res.offenders.imageWithIncorrectSizesParam.convertedInPx, 150);
        assert.strictEqual(res.offenders.imageWithIncorrectSizesParam.displayWidth, 200);
    });
    it('also works on a picture element with sizes on the img tag', async () => {
        const res = await ModulesRunner.execModuleForTest('responsive', '<svg></svg>', {
            displayWidth: 200,
            displayHeight: 100,
            viewportWidth: 300,
            viewportHeight: 700,
            html: '<picture><source media="(max-width: 400px)" srcset="image3.jpg 3w" /><img srcset="image1.jpg 1w,image2.jpg 2w" sizes="2vw" /></picture>'
        }, {}, {});
        assert.strictEqual(res.stats.srcsetAttribute, 'image3.jpg 3w');
        assert.strictEqual(res.stats.sizesAttribute, '2vw');
        assert.strictEqual(res.offenders.imageWithIncorrectSizesParam.convertedInPx, 6);
        assert.strictEqual(res.offenders.imageWithIncorrectSizesParam.displayWidth, 200);
    });
    it('also works on a picture element', async () => {
        const res = await ModulesRunner.execModuleForTest('responsive', '<svg></svg>', {
            displayWidth: 200,
            displayHeight: 100,
            viewportWidth: 300,
            viewportHeight: 700,
            html: '<picture><source media="(max-width: 400px)" srcset="image3.jpg 3w" sizes="3vw" /><img srcset="image1.jpg 1w,image2.jpg 2w" sizes="2vw" /></picture>'
        }, {}, {});
        assert.strictEqual(res.stats.srcsetAttribute, 'image3.jpg 3w');
        assert.strictEqual(res.stats.sizesAttribute, '3vw');
        assert.strictEqual(res.offenders.imageWithIncorrectSizesParam.convertedInPx, 9);
        assert.strictEqual(res.offenders.imageWithIncorrectSizesParam.displayWidth, 200);
    });
    it('also works on a picture element with sizes', async () => {
        const res = await ModulesRunner.execModuleForTest('responsive', '<svg></svg>', {
            displayWidth: 200,
            displayHeight: 100,
            viewportWidth: 300,
            viewportHeight: 700,
            html: '<picture><source media="(max-width: 200px)" srcset="image3.jpg 3w" sizes="3vw" /><img srcset="image1.jpg 1w,image2.jpg 2w" sizes="2vw" /></picture>'
        }, {}, {});
        assert.strictEqual(res.stats.srcsetAttribute, 'image1.jpg 1w, image2.jpg 2w');
        assert.strictEqual(res.stats.sizesAttribute, '2vw');
        assert.strictEqual(res.offenders.imageWithIncorrectSizesParam.convertedInPx, 6);
        assert.strictEqual(res.offenders.imageWithIncorrectSizesParam.displayWidth, 200);
    });
});