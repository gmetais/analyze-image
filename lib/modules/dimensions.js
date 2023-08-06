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
    return;
  }

  const metadata = await sharp(runner.body).metadata();
  debug('Image width is %dpx and image height is %dpx', metadata.width, metadata.height);
  runner.addStat('width', metadata.width);
  runner.addStat('height', metadata.height);
}

main.description = "Detects the width and height";
module.exports = main;