const debug = require("debug")("analyze-image:animated")
  sharp = require("sharp");

// Disable sharp cache to reduce disk usage
sharp.cache(false);

async function main(runner) {
  if (!runner.result.stats.format) {
    debug('Image format not recognized');
    return;
  }

  if (['gif', 'webp'].includes(runner.result.stats.format)) {
    debug('Image format %s might be animated, checking the file...', runner.result.stats.format);
    
    const metadata = await sharp(runner.body).metadata();
    debug('Number of pages inside image is %d...', metadata.pages);
    debug('... therefore it is %s animated', (metadata.pages > 1) ? '' : 'NOT');

    runner.addStat('animated', (metadata.pages > 1));
    return;
  }

  if (['svg', 'avif'].includes(runner.result.stats.format)) {
    debug('Image format %s might be animated, but analyze-image is unable to detect');
    runner.addStat('animated', undefined);
    return;
  }

  debug('Image format %s cannot be animated');
  runner.addStat('animated', false);
}

main.description = "Detects if the image is animated";
module.exports = main;