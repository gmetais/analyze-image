const analyze = require("."),
  debug = require("debug")("analyze-image:modulesRunner");


class ModulesRunner {

  constructor(options) {
    this.options = options;
    this.result = {
      stats: {},
      transforms: {},
      improvements: {}
    };
  }

  async startAnalysis(image, browserData) {
    this.image = image;
    this.browserData = browserData;

    const then = Date.now();

    // load and run all modules
    await this.runModules();

    debug("Completed in %d ms", Date.now() - then);
    return this.result;
  }

  async runModules() {
    const debug = require("debug")("analyze-image:modules");

    const modules = [
        'contentType',
        'dimensions',
        'animated',
        'optimize',
        'resize'
        // TODO: 'exif' module that checks size of EXIF/ICC/IPTC/XMP metadata
      ];

    let mod, then;

    debug("Modules to be loaded: %s", modules.join(", "));

    for (const name of modules) {
      mod = require("./modules/" + name);
      then = Date.now();

      debug('Module %s started: %s', name, mod.description);      
      
      try {
        // Execute module
        await mod(this);

      } catch(error) {
        debug('Error while executing module %s!', name);
        debug(error);
      }

      debug('Module "%s" completed in %dms', name, Date.now() - then);
    }
  }

  addStat(name, value) {
    debug('Stat "%s" added to result object', name);
    this.result.stats[name] = value;
  }

  addTransform(name, value) {
    debug('Transform "%s" added to result object', name);
    this.result.transforms[name] = value;
  }

  addImprovement(name, value) {
    debug('Improvement "%s" added to result object', name);
    this.result.improvements[name] = value;
  }
}

module.exports = ModulesRunner;

// For testing purpose: loads a module, executes it with correct parameters and returns the result object
module.exports.execModuleForTest = async function(moduleName, image, browserData = {}, options = {}, partialResultObject = {}) {
  const modulesRunner = new ModulesRunner(options);
  modulesRunner.image = modulesRunner.body = image;
  modulesRunner.browserData = browserData;
  modulesRunner.result = {...modulesRunner.result, ...partialResultObject};

  const mod = require("./modules/" + moduleName);
  
  try {
    await mod(modulesRunner);
  } catch(error) {
    debug('Error while executing module %s!', moduleName);
    debug(error);
  }
  return modulesRunner.result;
};