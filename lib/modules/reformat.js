const debug = require("debug")("analyze-image:reformat"),
  sharp = require('sharp');

// Disable sharp cache to reduce disk usage
sharp.cache(false);

async function main(runner) {
  if (!runner.result.stats.format) {
    debug('Unknown image format, reformat step skipped');
    return;
  }

  if (!runner.result.stats.format === 'svg') {
    debug('SVG format ignored');
    return;
  }

  let newFile, webpReport, avifReport;

  // Start with WebP
  if (['jpg', 'png', 'gif'].includes(runner.result.stats.format)) {
    debug('Trying to convert to WebP...');

    newFile = await sharp(runner.body, {animated: runner.result.stats.animated})
      .webp({quality: runner.options.webpQuality, alphaQuality: runner.options.webpQuality})
      .toBuffer();

    webpReport = createReport(newFile, runner, 'webp');
    if (webpReport) {
      runner.addTransform('webpEncoded', webpReport);
    }
  }

  // Now AVIF
  if (['jpg', 'png', 'webp'].includes(runner.result.stats.format) && !runner.result.stats.animated) {
    debug('Trying to convert to AVIF...');

    newFile = await sharp(runner.body)
      .avif({quality: runner.options.avifQuality})
      .toBuffer();

    avifReport = createReport(newFile, runner, 'avif');
    if (avifReport) {
      runner.addTransform('avifEncoded', avifReport);
    }
  }

  // Prepare offender
  if (webpReport || avifReport) {
    const offender = {
      currentFormat: runner.result.stats.format,
      fileSize: runner.result.stats.fileSize
    }

    if (webpReport) {
      offender.newFileSize = webpReport.newFileSize;
      offender.webpSize = webpReport.newFileSize;
    }

    if (avifReport) {
      if (!webpReport || webpReport.newFileSize > avifReport.newFileSize) {
        offender.newFileSize = avifReport.newFileSize;
      }
      offender.avifSize = avifReport.newFileSize;
    }

    const ratio = newFile.length / runner.result.stats.fileSize;
    const gain = runner.result.stats.fileSize - newFile.length;

    if (gain > 2048 || (ratio < 0.8 && gain > 100)) {
      debug('New file is smaller enough to be an offender');
      runner.addOffender('imageOldFormat', offender);
    } else {
      debug('New file is not much smaller, no offender');
    }
  }
}

function createReport(newFile, runner, newFormat) {
  if (newFile && newFile.length > 0) {

    debug('The %s is %d bytes. This is %d% of original', 
      newFormat, 
      newFile.length, 
      newFile.length / runner.result.stats.fileSize * 100);

    return {
      currentFormat: runner.result.stats.format,
      fileSize: runner.result.stats.fileSize,
      newFileSize: newFile.length,
      body: newFile
    };

  } else {
    debug('Invalid new file');
  }
}

main.description = "Checks if image can be lighter in new formats (WebP & AVIF)";
module.exports = main;