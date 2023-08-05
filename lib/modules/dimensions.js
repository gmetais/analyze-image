const debug = require("debug")("analyze-image:dimensions")
  sharp = require("sharp");

// Disable sharp cache to reduce disk usage
sharp.cache(false);

async function main(analyzer) {
  if (!analyzer.result.format) {
    debug('Image format not recognized');
    return;
  }

  if (analyzer.result.format === 'svg') {
    debug('SVG images are considered as having no width and no height');
    return {
      width: undefined,
      height: undefined
    };
  }

  const metadata = await sharp(analyzer.body).metadata();
  debug('Image width is %dpx and image height is %dpx', metadata.width, metadata.height);
  return {
    width: metadata.width,
    height: metadata.height
  };
}

main.description = "Detects the width and height";
module.exports = main;