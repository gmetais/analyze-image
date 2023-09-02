import debugModule from 'debug';
const debug = debugModule('analyze-image');

import fs from 'node:fs/promises';
import * as path from 'path';
import {fileURLToPath} from 'node:url';
import ModulesRunner from './modulesRunner.js';

const packageConfig = JSON.parse(await fs.readFile('package.json'));

function error(msg, code) {
  var err = new Error(msg);
  err.code = code;

  return err;
}

// Promise-based public endpoint
function analyze(image, browserData = {}, options = {}) {
  
  const defaultOptions = {
    jpgQuality: 85,
    pngQuality: 90, // PNG are often used for pixel-perfect results, so let's not reduce too much
    webpQuality: 82, // See https://www.industrialempathy.com/posts/avif-webp-quality-settings)
    avifQuality: 64, // See https://www.industrialempathy.com/posts/avif-webp-quality-settings)
    gifQuality: 3, // See https://github.com/imagemin/imagemin-gifsicle
    removeBuffersFromTransforms: true // Removes/keeps the transformed images from the response
  };

  debug("Provided options: %j", options);

  if (typeof options === "object") {
    // Overwrite defaults with provided options
    options = {...defaultOptions, ...options};
  }

  debug("Options + defaults: %j", options);

  return new Promise(async (resolve, reject) => {

    if (!Buffer.isBuffer(image) && typeof image !== "string") {
      reject(
        error(
          "image parameter passed is not a buffer or a string!",
          EXIT_IMAGE_PASSED_IS_INVALID
        )
      );
      return;
    }

    const instance = new ModulesRunner(options);
    const res = await instance.startAnalysis(image, browserData);

    // error handling
    if (res instanceof Error) {
      debug("Rejecting a promise with an error: " + res);
      reject(res);
      return;
    }

    // remove bodies from results
    if (options.removeBuffersFromTransforms) {
      Object.keys(res.transforms).forEach((name) => delete res.transforms[name].body);
    }

    // return the results
    let result = {
      generator: "analyze-image v" + packageConfig.version,
      ...res
    };

    debug("Promise resolved");
    resolve(result);
  });
}

export default analyze;
export const version = packageConfig.version;
//export const path = path.normalize(path.dirname(fileURLToPath(import.meta.url)) + "/..");
//export const pathBin = path.normalize(path.dirname(fileURLToPath(import.meta.url)) + "/../bin/analyze-image.js");
export const EXIT_INVALID_OPTION = 2;
export const EXIT_EMPTY_IMAGE = 252;
export const EXIT_IMAGE_PASSED_IS_INVALID = 253;