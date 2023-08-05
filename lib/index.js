const debug = require("debug")("analyze-image"),
  path = require("path"),
  VERSION = require("./../package").version;


function error(msg, code) {
  var err = new Error(msg);
  err.code = code;

  return err;
}

// Promise-based public endpoint
function analyze(image, options) {
  // options can be omitted
  options = options || {};

  debug("opts: %j", options);

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

    const ImageAnalyzer = require("./imageAnalyzer");
    const instance = new ImageAnalyzer(options);
    const res = await instance.analyze(image);

    // error handling
    if (res instanceof Error) {
      debug("Rejecting a promise with an error: " + res);
      reject(res);
      return;
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
analyze.EXIT_EMPTY_IMAGE = 252;
analyze.EXIT_IMAGE_PASSED_IS_INVALID = 253;
// analyze.EXIT_URL_LOADING_FAILED = 254;
// analyze.EXIT_FILE_LOADING_FAILED = 255;

module.exports = analyze;