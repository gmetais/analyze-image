const debug = require("debug")("analyze-image:animated")
  sharp = require("sharp");

// Disable sharp cache to reduce disk usage
sharp.cache(false);

async function main(analyzer) {
  if (!analyzer.result.format) {
    debug('Image format not recognized');
    return;
  }

  if (['gif', 'webp'].includes(analyzer.result.format)) {
    debug('Image format %s might be animated, checking the file...', analyzer.result.format);
    
    const metadata = await sharp(analyzer.body).metadata();
    debug('Number of pages inside image is %d...', metadata.pages);
    debug('... therefore it is %s animated', (metadata.pages > 1) ? '' : 'NOT');

    return {
      animated: (metadata.pages > 1)
    };
  }

  if (['svg', 'avif'].includes(analyzer.result.format)) {
    debug('Image format %s might be animated, but analyze-image is unable to detect');
    return {
      animated: undefined
    };
  }

  return {
    animated: false
  }
}

main.description = "Detects the width and height";
module.exports = main;