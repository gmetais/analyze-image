const debug = require("debug")("analyze-image:reformat"),
  sharp = require('sharp');

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

    newFile = await sharp(runner.body, {animated: runner.result.animated})
      .webp({quality: runner.options.webpQuality, alphaQuality: runner.options.webpQuality})
      .toBuffer();

    webpReport = await createReport(newFile, runner, 'webp');
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

    avifReport = await createReport(newFile, runner, 'avif');
    if (avifReport) {
      runner.addTransform('avifEncoded', avifReport);
    }
  }

  // Prepare offender
  if (webpReport || avifReport) {
    const offender = {
      beforeWeight: runner.result.stats.weight
    }

    if (webpReport) {
      offender.afterWeight = webpReport.weight;
      offender.webpWeight = webpReport.weight;
    }

    if (avifReport) {
      if (!webpReport || webpReport.weight > avifReport.weight) {
        offender.afterWeight = avifReport.weight;
      }
      offender.avifWeight = avifReport.weight;
    }

    const ratio = newFile.length / runner.result.stats.weight;
    const gain = runner.result.stats.weight - newFile.length;

    if (gain > 2048 || (ratio < 0.8 && gain > 100)) {
      debug('New file is smaller enough to be an offender');
      runner.addOffender('imageOldFormat', offender);
    } else {
      debug('New file is not much smaller, no offender');
    }
  }
}

async function createReport(newFile, runner, newFormat) {
  if (newFile && newFile.length > 0) {

    debug('The %s is %d bytes. This is %d% of original)', 
      newFormat, 
      newFile.length, 
      newFile.length / runner.result.stats.weight * 100);

    return {
      weight: newFile.length,
      gain: runner.result.stats.weight - newFile.length,
      body: newFile
    };

  } else {
    debug('Invalid new file');
  }
}

main.description = "Checks if image can be lighter in new formats (WebP & AVIF)";
module.exports = main;