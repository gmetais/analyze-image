const debug = require("debug")("analyze-image:optimize"),
  sharp = require('sharp'),
  imagemin = require('imagemin'),
  imageminGifsicle = require('imagemin-gifsicle')
  imageminSvgo = require('imagemin-svgo');

// Disable sharp cache to reduce disk usage
sharp.cache(false);

async function main(runner) {
  if (!runner.result.stats.format) {
    debug('Unknown image format, optimize step skipped');
    return;
  }

  const newFile = await optimizeImage(runner.body, runner.result.stats.format, runner.options);
  
  if (newFile) {
    const ratio = newFile.length / runner.result.stats.fileSize;
    const gain = runner.result.stats.fileSize - newFile.length;
    
    if (gain < 0) {
      debug('New file is %d bytes larger, which is %d% of the initial file', -gain, ratio * 100);
    } else {
      debug('New file is %d bytes smaller, which is %d% of the initial file', gain, ratio * 100);
    }
    
    runner.addTransform('optimized', {
      fileSize: runner.result.stats.fileSize,
      newFileSize: newFile.length,
      body: newFile
    });

    if (gain > 2048 || (ratio < 0.8 && gain > 100)) {
      debug('New file is smaller enough to be an offender');
      
      runner.addOffender('imageNotOptimized', {
        fileSize: runner.result.stats.fileSize,
        newFileSize: newFile.length
      });

    } else {
      debug('New file is not much smaller, no offender');
    }
  }
}

async function optimizeImage(body, format, options) {
  let newFile;

  if (format === 'jpg') {
    debug('Optimizing jpg file with Sharp...');
    newFile = await sharp(body)
      .jpeg({quality: options.jpgQuality})
      .toBuffer();
  } else if (format === 'webp') {
    debug('Optimizing webp file with Sharp...');
    newFile = await sharp(body, {animated: true})
      .webp({quality: options.webpQuality, alphaQuality: options.webpQuality})
      .toBuffer();
  } else if (format === 'avif') {
    debug('Optimizing aif file with Sharp...');
    newFile = await sharp(body)
      .avif({quality: options.avifQuality})
      .toBuffer();
  } else if (format === 'png') {
    debug('Optimizing png file with Sharp...');
    newFile = await sharp(body)
      .png({quality: options.pngQuality})
      .toBuffer();
  } else if (format === 'gif') {
    debug('Optimizing gif file with Gifsicle...');
    newFile = await imagemin.buffer(body, {
      plugins: [imageminGifsicle({optimizationLevel: options.gifsicleLevel})]
    });
  } else if (format === 'svg') {
    debug('Optimizing svg file with SVGO...');
    newFile = await imagemin.buffer(Buffer.from(body), {
      plugins: [imageminSvgo({plugins: [{
        name: 'preset-default',
        params: {overrides: {removeUselessDefs: false}}
      }]})]
    });
  }

  return newFile;
}

main.description = "Checks if image can be optimized";
module.exports = main;
module.exports.optimizeImage = optimizeImage;