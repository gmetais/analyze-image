const debug = require("debug")("analyze-image:sizesAttribute"),
  htmlparser = require("htmlparser2"),
  srcsetParser = require("srcset"),
  mediaQueryParser = require('media-query-fns'),
  cssCalc = require('css-calc-transform');


async function main(runner) {
  if (!runner.browserData || !runner.browserData.html || runner.browserData.html.length < 1) {
    debug('The HTML code related to the image is not provided');
    return;
  }
  debug('HTML code provided: %s', runner.browserData.html);

  if (!runner.browserData.viewportWidth || ! runner.browserData.viewportHeight) {
    debug('Missing browserData.viewportWidth and browserData.viewportHeight parameters');
    return;
  }
  const dpr = runner.browserData.dpr || 1;
  debug('Viewport dimensions are %dx%d with a DPR of %d', 
    runner.browserData.viewportWidth, 
    runner.browserData.viewportHeight, 
    dpr);

  const {sizes, srcset} = findSizesAndSrcsetAttributes(
    runner.browserData.html,
    runner.browserData.viewportWidth,
    runner.browserData.viewportHeight,
    dpr);

  if (!srcset) {
    return;
  }
  runner.addStat('srcsetAttribute', srcset);

  let widthFromSizes;

  if (!sizes) {
    debug('No sizes attribute found, using the browser default value 100vw');
    runner.addStat('sizesAttribute', '100vw (default)');
    widthFromSizes = runner.browserData.viewportWidth;
  } else {
    runner.addStat('sizesAttribute', sizes);
    // Parse the sizes attribute and calculates the value in px
    widthFromSizes = computeSizeFromAttribute(
      sizes,
      runner.browserData.viewportWidth,
      runner.browserData.viewportHeight,
      dpr);
  }
  
  if (widthFromSizes) {
    const ratio = widthFromSizes / runner.browserData.displayWidth;
    debug('Calculated value from sizes %d, real display size %d', widthFromSizes, runner.browserData.displayWidth);
    
    if (ratio < 0.9 || ratio > 1.1) {
      debug('The ratio of %d is not in the 10% threshold, alerting!', ratio);

      runner.addOffender('imageWithIncorrectSizesParam', {
        sizesAttribute: sizes || '100vw (default)',
        convertedInPx: widthFromSizes,
        displayWidth: runner.browserData.displayWidth
      });

    } else {
      debug('The ratio of %d is within the 10% threshold, it\'s ok', ratio);
    }
  }
}

function findSizesAndSrcsetAttributes(html, viewportWidth, viewportHeight, dpr) {
  debug('Parsing the HTML...');
  const dom = htmlparser.parseDocument(html);
  const element = dom.children[0];
  debug('Element of type <%s> found.', element.name);

  let sizes, srcset;

  // First, we need to determine if a srcset "w" attribute was set 

  // The sizes attribute can be:
  //  - on the <img> if we have a simple <img> tag
  //  - if we have a <picture> tag
  //      - on the each <source> children (chosen in priority by the browser)
  //      - on the <img> child

  const isSingleImgTag = (element.name === 'img');
  const isPictureTag = (element.name === 'picture');

  if (isSingleImgTag) {
    const sizesAttr = element.attribs.sizes;
    const srcsetAttr = element.attribs.srcset;

    const validatedSrcsetAttr = validateSrcset(srcsetAttr);

    if (!validatedSrcsetAttr) {
      debug('No valid srcset found, ignoring sizes attribute.');
    } else {
      srcset = validatedSrcsetAttr;
      debug('Valid srcset found.');
      sizes = sizesAttr;
    }

  } else if (isPictureTag) {
    debug('It is a picture tag, let\'s find the first child that fits the screen');
    const usedChild = element.children.find(childElement => {
      if (childElement.name === 'source' || childElement.name === 'img') {
        
        const validTypes = [
            'image/jpeg', 
            'image/png', 
            'image/gif', 
            'image/webp',
            'image/avif',
            'image/svg+xml'
          ];
        if (childElement.attribs.type && !validTypes.includes(childElement.attribs.type)) {
          debug('Source attribute type %s is not understood by the browser', childElement.attribs.type); 
          return false; 
        }

        const mediaquery = childElement.attribs.media;
        debug ('Checking if mediaquery %s is matched by the screen (%sx%s and DRP %s)',
          mediaquery,
          viewportWidth, 
          viewportHeight, 
          dpr);
        if (mediaquery && !matchMediaQuery(mediaquery, viewportWidth, viewportHeight, dpr)) {
          debug('Not matched');
          return false;
        }
        debug('Matched');

        const validatedSrcsetAttr = validateSrcset(childElement.attribs.srcset);

        if (!validatedSrcsetAttr) {
          debug('No valid srcset found, ignoring the source');
          return false;
        }
        
        srcset = validatedSrcsetAttr;
        debug('Valid srcset found. Let\'s return sizes even if undefined');
        sizes = childElement.attribs.sizes;
        return true;
      }

      return false;
    });

    // Wait wait wait. If we found a srcset but not a sizes, let's check the <img> tag's sizes attribute.
    if (srcset && ! sizes) {
      const imgTag = element.children.find(childElement => {
        if (childElement.name === 'img' && childElement.attribs.sizes) {
          sizes = childElement.attribs.sizes;
          return true;
        }
        return false;
      });
    }
  }

  debug('Matching sizes attribute is %s', sizes);
  debug('Matching srcset attribute is %s', srcset);
  return {sizes, srcset};
}

function validateSrcset(str) {
  if (!str) {
    return false;
  }

  debug('Parsing the srcset attribute %s', str);
  const parsed = srcsetParser.parse(str);

  const countWUrls = parsed.filter(value => value.width).length;
  const countXUrls = parsed.filter(value => value.density).length;

  if (countXUrls > 0 && countWUrls === 0) {
    debug('%d x urls found in srcset, ignoring this srcset', countXUrls);
    return false;
  } else if (countWUrls > 0 && countXUrls > 0) {
    debug('Mixed w and x urls found, ignoring this srcset');
    return false;
  } else if (countWUrls === 0 && countXUrls === 0) {
    debug('No urls found in srcset, ignoring this srcset');
    return false;
  }

  debug('%d w urls found in srcset', countWUrls);
  // Prettify the srcset by re-stringifying it
  return srcsetParser.stringify(parsed);
}

function matchMediaQuery(str, viewportWidth, viewportHeight, dpr) {
  if (!str) {
    return false;
  }

  try {
    const compiled = mediaQueryParser.compileQuery(str);

    return mediaQueryParser.matches(compiled, {
      widthPx: viewportWidth,
      heightPx: viewportHeight,
      dppx: dpr,
      deviceWidthPx: viewportWidth,
      deviceHeightPx: viewportHeight,
    });
  } catch(error) {
    debug ('Error while parsing mediaquery %s: %s', str, error.message);
    // Fail silently
    return false;
  }
}

function computeSizeFromAttribute(sizesAttr, viewportWidth, viewportHeight, dpr) {
  if (!sizesAttr || sizesAttr === '') {
    debug('Invalid size in sizes attribute: %s', sizesAttr);
    return undefined;
  }

  debug('Parsing and calculating the sizes attribute %s', sizesAttr);
  const regex = /^(\(.*\))\s+([^\s].*)$/s;

  const chunks = sizesAttr.split(',');
  let result;
  
  // Find the first chunk that matches
  chunks.find(chunk => {
    chunk = chunk.trim();
    const bits = regex.exec(chunk);
    
    if (!bits) {
      debug('No mediaquery found in %s. It is probably the default value.', chunk);
      result = computeOneSizeValue(chunk, viewportWidth, viewportHeight);
      return (result !== undefined);
    }

    const mediaquery = bits[1];
    const value = bits[2];

    if (!matchMediaQuery(mediaquery, viewportWidth, viewportHeight, dpr)) {
      debug('Screen doesn\'t match mediaquery %s', mediaquery);
      return false;
    }

    debug('Screen matches mediaquery %s', mediaquery);
    result = computeOneSizeValue(value, viewportWidth, viewportHeight);
    return (result !== undefined);
  });

  return result || undefined;
}

function computeOneSizeValue(sizeValue, viewportWidth, viewportHeight) {
  if (!sizeValue || sizeValue === '') {
    debug('Invalid size in sizes attribute: %s', sizeValue);
    return undefined;
  }

  debug('Converting %s into px', sizeValue);

  // Transform single value like 100vw into calc(100vw) so that it fits into the css-calc-transform library
  const calc = (sizeValue.indexOf('calc') === -1) ? 'calc(' + sizeValue + ')' : sizeValue

  try {
    const pxValue = cssCalc.transform({
      prop: 'width',
      value: calc,
      win: {
        width: viewportWidth,
        height: viewportHeight
      },
      font: {
        // https://stackoverflow.com/questions/30653280/how-do-responsive-images-work-with-em-supplied-as-a-length-in-sizes
        size: 16
      }
    });

    if (pxValue) {
      debug('%s equals %dpx', sizeValue, pxValue);
      return pxValue;
    }
  } catch(error) {
    debug('Failed to convert %s into px: %s', sizeValue, error.message);
  }

  return undefined;
}

main.description = "Checks the sizes attribute of an HTML <img> or <picture>";
module.exports = main;

// For testing purpose only
module.exports.findSizesAndSrcsetAttributes = findSizesAndSrcsetAttributes;
module.exports.validateSrcset = validateSrcset;
module.exports.matchMediaQuery = matchMediaQuery;
module.exports.computeSizeFromAttribute = computeSizeFromAttribute;
module.exports.computeOneSizeValue = computeOneSizeValue;