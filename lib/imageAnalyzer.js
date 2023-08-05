const analyze = require("."),
  debug = require("debug")("analyze-image:analyzer");


class ImageAnalyzer {

  constructor(options) {
    this.options = options;
    this.result = {};
  }

  async analyze(image) {
    this.image = image;
    const then = Date.now();

    // load and run all modules
    await this.runModules();

    debug("Completed in %d ms", Date.now() - then);
    return this.result;
  }

  async runModules() {
    const debug = require("debug")("analyze-image:modules"),
      re = /\.js$/,
      modules = [
        'contentType',
        'dimensions',
      ];
    let mod, then, moduleResult;

    debug("Modules to be loaded: %s", modules.join(", "));

    for (const name of modules) {
      mod = require("./modules/" + name);
      then = Date.now();

      debug('Module %s started: %s', name, mod.description);      
      
      moduleResult = await mod(this);
      
      if (moduleResult) {
        debug('%d new properties added to results object: %s', 
          Object.keys(moduleResult).length, Object.keys(moduleResult).join(', '));

        // Merge the module's result with existing result object
        Object.assign(this.result, moduleResult);
      } else {
        debug('Nothing to add to results object');
      }

      debug('Module "%s" completed in %dms', name, Date.now() - then);
    }
  }
}

module.exports = ImageAnalyzer;