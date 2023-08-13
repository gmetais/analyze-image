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

  debug('Image has %dx%d pixels and is displayed on %dx%d with a DPR of %d, ratio is %dx', 
    runner.result.stats.width,
    runner.result.stats.height,
    displayWidth,
    displayHeight,
    dpr,
    sizeRatio);

  if (sizeRatio < 1) {
    debug('Image is smaller than the number of pixels it is displayed on');
  } else if (sizeRatio === 1) {
    debug('Image has the exact same number of pixels as it is displayed on');
  } else {

    if (sizeRatio > RESIZE_IF_RATIO_MORE_THAN) {
      debug('Ratio exceeds resize threshold of %d, trying to resize image', RESIZE_IF_RATIO_MORE_THAN);
      const newWidth = displayWidth * dpr;
      const newHeight = displayHeight * dpr;

      let newFile = await sharp(runner.body, {animated: runner.result.stats.animated})
        .resize(newWidth, newHeight)
        .toBuffer();

      debug('Resized image generated, it is %d bytes. Now re-optimizing it.', newFile.length);
      
      newFile = await optimizeModule.optimizeImage(newFile, runner.result.stats.format, runner.options);
      debug('Resized image re-optimized, it is %d bytes.', newFile.length);

      if (newFile && newFile.length > 0) {
        debug('This is %d% of original', newFile.length / runner.result.stats.fileSize * 100);
        
        // If the original image was correctly optimized, we use use the optimized size as reference,
        // because it makes no sense comparing rescaled+optimized vs unoptimized.
        let referenceWeight = runner.result.stats.fileSize;
        if (runner.result.transforms.optimized && runner.result.transforms.optimized.newFileSize < referenceWeight) {
          referenceWeight = runner.result.transforms.optimized.newFileSize
        }
        
        const ratio = newFile.length / referenceWeight;
        const gain = referenceWeight - newFile.length;
        
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
}

main.description = "Checks if image can be resized";
module.exports = main;