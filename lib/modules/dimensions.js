const debug = require("debug")("analyze-image:dimensions")
  sharp = require("sharp");

// Disable sharp cache to reduce disk usage
sharp.cache(false);

async function main(runner) {

  const MAX_DISPLAY_DENSITY = 2;

  if (!runner.result.stats.format) {
    debug('Image format not recognized');
    return;
  }

  if (runner.result.stats.format === 'svg') {
    debug('SVG images are considered as having no width and no height');
    
    runner.addStat('width', undefined);
    runner.addStat('height', undefined);
    return;
  }

  let dpr = runner.browserData.dpr;
  const displayWidth = runner.browserData.displayWidth;
  const displayHeight = runner.browserData.displayHeight;


  if ((dpr && Number.isNaN(dpr)) || dpr < 1 || dpr > 10) {
    debug('Abnormal browserData.dpr value %d provided.', dpr);
    return;
  }

  const metadata = await sharp(runner.body).metadata();
  debug('Image width is %dpx and image height is %dpx', metadata.width, metadata.height);
  runner.addStat('width', metadata.width);
  runner.addStat('height', metadata.height);


  if (displayWidth && displayHeight) {
    
    // The two following metrics are not about dividing the number of pixels, they are about diving the dimensions.
    // For example, a 200x200 image has 4x more pixels than a 100x100 image, but we want the ratio to equal 2x.

    // What difference between display ratio and display density?
    // Display ratio includes the screen density, display density doesn't.

    const displayRatio = ((metadata.width / displayWidth) + (metadata.height / displayHeight)) / (dpr || 1) / 2;
    debug('The loaded image dimensions are %dx the display dimensions (%dx%d on a %dx screen)',
      displayRatio,
      displayWidth,
      displayHeight,
      (dpr || 1));
    runner.addStat('displayRatio', displayRatio);


    const displayDensity = ((metadata.width / displayWidth) + (metadata.height / displayHeight)) / 2;
    debug('The display density is %d', displayDensity);
    runner.addStat('displayDensity', displayDensity);
    
    // Report if image density is > 2 + 10% margin (2.2), only on very high dpr screens (>2.2)
    if (displayDensity > MAX_DISPLAY_DENSITY * 1.1 && (dpr || 1) >= MAX_DISPLAY_DENSITY * 1.1) {
      debug('The human eye hardly sees a difference when image density is > %d', MAX_DISPLAY_DENSITY);
      runner.addOffender('imageExcessiveDensity', {
        displayDensity,
        recommendedMaxDensity: MAX_DISPLAY_DENSITY
      });
    }
  }
}

main.description = "Detects the width and height";
module.exports = main;