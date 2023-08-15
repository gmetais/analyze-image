const debug = require("debug")("analyze-image:resize")
  optimizeModule = require('./optimize'),
  sharp = require("sharp");

// Disable sharp cache to reduce disk usage
sharp.cache(false);

async function main(runner) {
  // We only try to resize an image if the number of pixels in the file 
  // is >1.2x the number of pixels it is displayed on.
  // Ex: an image of 110x110 (=12100px) displayed on 100x100 (=10000px) makes a 1.21 ratio.
  const RESIZE_IF_RATIO_MORE_THAN = 1.2;

  // Over this image density, the human eye will hardly see the difference
  const MAX_DISPLAY_DENSITY = 2;


  if (!runner.browserData || !runner.browserData.displayWidth || !runner.browserData.displayHeight) {
    debug('browserData.displayWidth and browserData.displayHeight not provided, resizing skipped');
    return;
  }

  // Round numbers, because the image resizer requires integers
  const displayWidth = Math.round(runner.browserData.displayWidth);
  const displayHeight = Math.round(runner.browserData.displayHeight);

  if ((runner.browserData.dpr && Number.isNaN(runner.browserData.dpr)) || runner.browserData.dpr < 1 || runner.browserData.dpr > 10) {
    debug('Abnormal browserData.dpr value %d provided', runner.browserData.dpr);
    return;
  }

  const dpr = runner.browserData.dpr || 1;
  debug('DPR used for calculation is %d', dpr);

  if (!runner.result.stats.width || !runner.result.stats.height || !runner.result.stats.fileSize) {
    debug('Current image dimensions not found, can\'t resize');
    return;
  }

  const displayedPixels = displayWidth * displayHeight * dpr * dpr;
  const imagePixels = runner.result.stats.width * runner.result.stats.height;
  const sizeRatio = imagePixels / displayedPixels;
  let referenceWeight = runner.result.stats.fileSize;
  let newFile, ratio, gain;

  debug('Image has %dx%d pixels and is displayed on %dx%d with a DPR of %d, ratio is %dx', 
    runner.result.stats.width,
    runner.result.stats.height,
    displayWidth,
    displayHeight,
    dpr,
    sizeRatio);

  if (sizeRatio < 1) {
    debug('Image is smaller than the number of pixels it is displayed on');
    // That's quite OK, except on 1x DPR screens and maybe if image density is < 1.5 on 2x screens or more.
    // Maybe a new offender?
  } else if (sizeRatio === 1) {
    debug('Image has the exact same number of pixels as it is displayed on');
  } else {

    if (sizeRatio > RESIZE_IF_RATIO_MORE_THAN) {
      const newWidth = displayWidth * dpr;
      const newHeight = displayHeight * dpr;
      debug('Ratio exceeds resize threshold of %d, trying to resize image to %dx%d',
        RESIZE_IF_RATIO_MORE_THAN,
        newWidth,
        newHeight);

      let newFile = await sharp(runner.body, {animated: runner.result.stats.animated})
        .resize(newWidth, newHeight)
        .toBuffer();

      debug('Resized image generated, it is %d bytes. Now re-optimizing it.', newFile.length);
      
      newFile = await optimizeModule.optimizeImage(newFile, runner.result.stats.format, runner.options);
      debug('Resized image re-optimized, it is %d bytes.', newFile.length);

      if (newFile && newFile.length > 0) {
        // If the original image was correctly optimized, we use use the optimized size as reference,
        // because it makes no sense comparing rescaled+optimized vs unoptimized.
        if (runner.result.transforms.optimized && runner.result.transforms.optimized.newFileSize < referenceWeight) {
          referenceWeight = runner.result.transforms.optimized.newFileSize
        }

        debug('This is %d% of reference weight', newFile.length / referenceWeight * 100);
        
        ratio = newFile.length / referenceWeight;
        gain = referenceWeight - newFile.length;
        
        const report = {
          naturalWidth: runner.result.stats.width,
          naturalHeight: runner.result.stats.height,
          fileSize: referenceWeight,
          newWidth,
          newHeight,
          dpr,
          newFileSize: newFile.length,
        };

        runner.addTransform('resized', {
          ...report,
          body: newFile
        });

        if (gain > 2048 || (ratio < 0.8 && gain > 100)) {
          debug('New file is smaller enough to be an offender');
          runner.addOffender('imageScaledDown', report);
        } else {
          debug('New file is not much smaller, no offender');
        }

      } else {
        debug('Failed to resize image');
      }

    } else {
      debug('Ratio is within resize threshold, resizing skipped.');
    }
  }


  // Report if image density is > 2 + 10% margin (2.2), only on very high dpr screens (>2.2)
  if (runner.result.stats.displayDensity > MAX_DISPLAY_DENSITY * 1.1 && (dpr || 1) >= MAX_DISPLAY_DENSITY * 1.1) {
    debug('The human eye hardly sees a difference when image density is > %d', MAX_DISPLAY_DENSITY);

    const recomWidth = Math.round(displayWidth * MAX_DISPLAY_DENSITY);
    const recomHeight = Math.round(displayHeight * MAX_DISPLAY_DENSITY);
    debug('Excessive density was detected, now trying to resize further to %dx%d', recomWidth, recomHeight);

    newFile = await sharp(runner.body, {animated: runner.result.stats.animated})
      .resize(recomWidth, recomHeight)
      .toBuffer();

    newFile = await optimizeModule.optimizeImage(newFile, runner.result.stats.format, runner.options);
    debug('Resized image re-optimized, it is %d bytes.', newFile.length);

    if (newFile && newFile.length > 0) {
      // If the original image was already resized, we use use the resized size as reference,
      // because the idea of this offender is to resize FURTHER.
      if (runner.result.transforms.resized && runner.result.transforms.resized.newFileSize < referenceWeight) {
        referenceWeight = runner.result.transforms.resized.newFileSize
      }
      
      ratio = newFile.length / referenceWeight;
      gain = referenceWeight - newFile.length;

      if (gain > 2048 || (ratio < 0.8 && gain > 100)) {
        debug('New file is smaller enough to be an offender');
        runner.addOffender('imageExcessiveDensity', {
          displayDensity: runner.result.stats.displayDensity,
          fileSize: referenceWeight,
          recommendedMaxDensity: MAX_DISPLAY_DENSITY,
          recommendedWidth: recomWidth,
          recommendedHeight: recomHeight,
          newFileSize: newFile.length
        });
      } else {
        debug('Failed to resize image');
      }
    } else {
      debug('New file is not much smaller, no offender');
    }
  } else {
    debug('No excessive density detected');
  }
}

main.description = "Checks if image can be resized, skipping.";
module.exports = main;