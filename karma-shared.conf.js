'use strict';

module.exports = function(config, specificOptions) {
  config.set({
    frameworks: ['jasmine'],
    autoWatch: true,
    logLevel: config.LOG_INFO,
    logColors: true,
    browsers: ['ChromeHeadless'],
    browserDisconnectTimeout: 10000,
    browserDisconnectTolerance: 2,
    browserNoActivityTimeout: 30000,
    reporters: ['dots'],
    specReporter: {
      maxLogLines: 5,             // limit number of lines logged per test
      suppressErrorSummary: true, // do not print error summary
      suppressFailed: false,      // do not print information about failed tests
      suppressPassed: true,      // do not print information about passed tests
      suppressSkipped: false,      // do not print information about skipped tests
      showSpecTiming: false,      // print the time elapsed for each spec
      failFast: false              // test would finish with error when a first fail occurs.
    },
    // SauceLabs config for local development.
    sauceLabs: {
      testName: specificOptions.testName || 'AngularJS',
      startConnect: true
    },

    // BrowserStack config for local development.
    browserStack: {
      project: 'AngularJS',
      name: specificOptions.testName,
      startTunnel: true,
      timeout: 600 // 10min
    },

    // For more browsers on Sauce Labs see:
    // https://saucelabs.com/docs/platforms/webdriver
    customLaunchers: {
      'ChromeHeadless': {
        base: 'Chrome',
        flags: [
          '--no-sandbox',
          '--headless',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--remote-debugging-port=9222'
        ]
      },
      'SL_Chrome': {
        base: 'SauceLabs',
        browserName: 'chrome',
        version: 'latest'
      },
      'SL_Chrome-1': {
        base: 'SauceLabs',
        browserName: 'chrome',
        version: 'latest-1'
      },
      'SL_Firefox': {
        base: 'SauceLabs',
        browserName: 'firefox',
        version: 'latest'
      },
      'SL_Firefox-1': {
        base: 'SauceLabs',
        browserName: 'firefox',
        version: 'latest-1'
      },
      'SL_Safari-1': {
        base: 'SauceLabs',
        browserName: 'safari',
        version: 'latest-1'
      },
      'SL_Safari': {
        base: 'SauceLabs',
        browserName: 'safari',
        version: 'latest'
      },
      'SL_IE_9': {
        base: 'SauceLabs',
        browserName: 'internet explorer',
        platform: 'Windows 2008',
        version: '9'
      },
      'SL_IE_10': {
        base: 'SauceLabs',
        browserName: 'internet explorer',
        platform: 'Windows 2012',
        version: '10'
      },
      'SL_IE_11': {
        base: 'SauceLabs',
        browserName: 'internet explorer',
        platform: 'Windows 8.1',
        version: '11'
      },
      'SL_EDGE': {
        base: 'SauceLabs',
        browserName: 'microsoftedge',
        platform: 'Windows 10',
        version: 'latest'
      },
      'SL_EDGE-1': {
        base: 'SauceLabs',
        browserName: 'microsoftedge',
        platform: 'Windows 10',
        version: 'latest-1'
      },
      'SL_iOS': {
        base: 'SauceLabs',
        browserName: 'iphone',
        version: 'latest'
      },
      'SL_iOS-1': {
        base: 'SauceLabs',
        browserName: 'iphone',
        version: 'latest-1'
      },

      'BS_Chrome': {
        base: 'BrowserStack',
        browser: 'chrome',
        os: 'OS X',
        os_version: 'Sierra'
      },
      'BS_Safari': {
        base: 'BrowserStack',
        browser: 'safari',
        os: 'OS X',
        os_version: 'Sierra'
      },
      'BS_Firefox': {
        base: 'BrowserStack',
        browser: 'firefox',
        os: 'Windows',
        os_version: '10'
      },
      'BS_IE_9': {
        base: 'BrowserStack',
        browser: 'ie',
        browser_version: '9.0',
        os: 'Windows',
        os_version: '7'
      },
      'BS_IE_10': {
        base: 'BrowserStack',
        browser: 'ie',
        browser_version: '10.0',
        os: 'Windows',
        os_version: '8'
      },
      'BS_IE_11': {
        base: 'BrowserStack',
        browser: 'ie',
        browser_version: '11.0',
        os: 'Windows',
        os_version: '8.1'
      },
      'BS_EDGE': {
        base: 'BrowserStack',
        browser: 'edge',
        os: 'Windows',
        os_version: '10'
      },
      'BS_iOS_10': {
        base: 'BrowserStack',
        device: 'iPhone 7',
        os: 'ios',
        os_version: '10.0'
      },
      'BS_iOS_11': {
        base: 'BrowserStack',
        device: 'iPhone 8',
        os: 'ios',
        os_version: '11.0'
      }
    }
  });


  // Terrible hack to workaround inflexibility of log4js:
  // - ignore web-server's 404 warnings,
  // - ignore DEBUG logs (on CI), we log them into a file instead.
  var IGNORED_404 = [
    '/favicon.ico',
    '/%7B%7BtestUrl%7D%7D',
    '/someSanitizedUrl',
    '/{{testUrl}}'
  ];
  var log4js = require('log4js');
  var layouts = require('log4js/lib/layouts');
  var originalConfigure = log4js.configure;
  log4js.configure = function(log4jsConfig) {
    var consoleAppender = log4jsConfig.appenders.shift();
    var originalResult = originalConfigure.call(log4js, log4jsConfig);
    var layout = layouts.layout(consoleAppender.layout.type, consoleAppender.layout);



    log4js.addAppender(function(log) {
      var msg = log.data[0];

      // ignore web-server's 404s
      if (log.categoryName === 'web-server' && log.level.levelStr === config.LOG_WARN &&
          IGNORED_404.some(function(ignoredLog) {return msg.indexOf(ignoredLog) !== -1;})) {
        return;
      }

      // on CI, ignore DEBUG statements
      if (process.env.CI && log.level.levelStr === config.LOG_DEBUG) {
        return;
      }

      console.log(layout(log));
    });

    return originalResult;
  };
};
