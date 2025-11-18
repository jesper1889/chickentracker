const NodeEnvironment = require('jest-environment-node').TestEnvironment;

class CustomEnvironment extends NodeEnvironment {
  constructor(config, context) {
    // Pass environment options to bypass localStorage check
    super({
      ...config,
      testEnvironmentOptions: {
        ...config.testEnvironmentOptions,
        'node-addons': true,
      }
    }, context);
  }

  async setup() {
    await super.setup();
    // Make localStorage available but as a no-op
    if (!this.global.localStorage) {
      this.global.localStorage = {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
        clear: () => {},
      };
    }
  }
}

module.exports = CustomEnvironment;
