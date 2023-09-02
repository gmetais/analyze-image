import debugModule from 'debug';
const debug = debugModule('analyze-image:modulesRunner');


class ModulesRunner {

  constructor(options) {
    this.options = options;
    this.result = {
      stats: {},
      transforms: {},
      offenders: {}
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

    const modules = [
        'contentType',
        'dimensions',
        'animated',
        'optimize',
        'resize',
        'reformat',
        'responsive'
        // TODO: 'exif' module that checks size of EXIF/ICC/IPTC/XMP metadata
      ];

    let mainFn, description, then;

    debug("Modules to be loaded: %s", modules.join(", "));

    for (const name of modules) {
      ({default: mainFn, description} = await import('./modules/' + name + '.js'));
      then = Date.now();

      debug('Module %s started: %s', name, description);      
      
      try {
        // Execute module
        await mainFn(this);

      } catch(error) {
        debug('Error while executing module %s!', name);
        debug(error);
      }

      debug('Module "%s" completed in %dms', name, Date.now() - then);
    }
  }

  addStat(name, value) {
    debug('Stat "%s" added to result object with value %s', name, value);
    this.result.stats[name] = value;
  }

  addTransform(name, value) {
    debug('Transform "%s" added to result object', name);
    this.result.transforms[name] = value;
  }

  addOffender(name, value) {
    debug('Offender "%s" added to result object: %j', name, value);
    this.result.offenders[name] = value;
  }
}

export default ModulesRunner;

// For testing purpose: loads a module, executes it with correct parameters and returns the result object
export async function execModuleForTest(moduleName, image, browserData = {}, options = {}, partialResultObject = {}) {
  const modulesRunner = new ModulesRunner(options);
  modulesRunner.image = modulesRunner.body = image;
  modulesRunner.browserData = browserData;
  modulesRunner.result = {...modulesRunner.result, ...partialResultObject};

  const {default: mainFn, description} = await import('./modules/' + moduleName + '.js');
  
  try {
    await mainFn(modulesRunner);
  } catch(error) {
    debug('Error while executing module %s!', moduleName);
    debug(error);
  }
  return modulesRunner.result;
};