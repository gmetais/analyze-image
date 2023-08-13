const debug = require("debug")("analyze-image"),
  path = require("path"),
  VERSION = require("./../package").version;


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

  if (typeof options === 'object') {
    // Overwrite defaults with provided options
    options = {...defaultOptions, ...options};
  }

  debug("Options + defaults: %j", options);

  return new Promise(async (resolve, reject) => {

    if (!Buffer.isBuffer(image) && typeof image !== "string") {
      reject(
        error(
          "image parameter passed is not a buffer or a string!",
          analyze.EXIT_IMAGE_PASSED_IS_INVALID
        )
      );
      return;
    }

    const ModulesRunner = require("./modulesRunner");
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
      generator: "analyze-image v" + VERSION,
      ...res
    };

    debug("Promise resolved");
    resolve(result);
  });
}

analyze.version = VERSION;

// @see https://github.com/macbre/phantomas/issues/664
analyze.path = path.normalize(__dirname + "/..");
analyze.pathBin = analyze.path + "/bin/analyze-image.js";

// exit codes
analyze.EXIT_INVALID_OPTION = 2;
analyze.EXIT_EMPTY_IMAGE = 252;
analyze.EXIT_IMAGE_PASSED_IS_INVALID = 253;
// analyze.EXIT_URL_LOADING_FAILED = 254;
// analyze.EXIT_FILE_LOADING_FAILED = 255;

module.exports = analyze;