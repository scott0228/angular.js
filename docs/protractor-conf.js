'use strict';

var config = require('../protractor-shared-conf').config;

config.specs = [
  'app/e2e/**/*.scenario.js'
];

config.capabilities = {
  browserName: 'chrome',
  chromeOptions: {
    args: [
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--headless',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor',
      '--window-size=1920,1080'
    ]
  }
};

// 指定 ChromeDriver 路徑
config.chromeDriver = '../node_modules/webdriver-manager/selenium/chromedriver_138.0.7204.157';

exports.config = config;
