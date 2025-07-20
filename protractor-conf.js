'use strict';

var config = require('./protractor-shared-conf').config;

config.specs = [
  'test/e2e/tests/**/*.js',
  'build/docs/ptore2e/**/*.js',
  'docs/app/e2e/**/*.scenario.js'
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

config.directConnect = true;

// 指定 ChromeDriver 路徑
config.chromeDriver = './node_modules/webdriver-manager/selenium/chromedriver_138.0.7204.157.exe';

exports.config = config;
