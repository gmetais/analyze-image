const debug = require("debug")("analyze-image:dimensions")
  sharp = require("sharp");

// Disable sharp cache to reduce disk usage
sharp.cache(false);

async function main(runner) {
  if (!runner.result.stats.format) {
    debug('Image format not recognized');
    return;
  }

  if (runner.result.stats.format === 'svg') {
    debug('SVG images are considered as having no width and no height');
    
    runner.addStat('width', undefined);
    runner.addStat('height', undefined);
    runner.addStat('displayRatio', undefined);
    return;
  }

  if ((runner.browserData.dpr && Number.isNaN(runner.browserData.dpr)) || runner.browserData.dpr < 1 || runner.browserData.dpr > 10) {
    debug('Abnormal browserData.dpr value %d provided.', runner.browserData.dpr);
    return;
  }

  const metadata = await sharp(runner.body).metadata();
  debug('Image width is %dpx and image height is %dpx', metadata.width, metadata.height);
  runner.addStat('width', metadata.width);
  runner.addStat('height', metadata.height);

  if (runner.browserData.displayWidth && runner.browserData.displayHeight) {
    const pixelsInImage = metadata.width * metadata.height;
    const pixelsOnScreen = runner.browserData.displayWidth * runner.browserData.displayHeight * (runner.browserData.dpr || 1);
    const displayRatio = pixelsInImage / pixelsOnScreen;
    debug('In comparison with display dimensions (%dx%d), the loaded image has %dx the number of pixels', runner.browserData.displayWidth, runner.browserData.displayHeight, displayRatio);
    runner.addStat('displayRatio', displayRatio);
  }
}

main.description = "Detects the width and height";
module.exports = main;