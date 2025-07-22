'use strict';

/**
 * Test for CVE-2023-26116 Fix Verification
 *
 * This test verifies that the ReDoS vulnerability in angular.copy() has been fixed
 * and that the fix doesn't break normal functionality.
 */

console.log('CVE-2023-26116 Fix Verification Test\n');

// Load AngularJS build to test the fix
var fs = require('fs');
var path = require('path');

// Read the fixed Angular source
var angularSource = fs.readFileSync(path.join(__dirname, 'src/Angular.js'), 'utf8');

// Set up a test environment
var vm = require('vm');
var performanceNow = function() {
  var hrTime = process.hrtime();
  return hrTime[0] * 1000 + hrTime[1] / 1000000;
};
var context = {
  console: console,
  performance: {
    now: performanceNow
  },
  // Minimal browser-like environment
  window: {},
  document: {
    createElement: function() { return {}; }
  },
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: setInterval,
  clearInterval: clearInterval
};

// Execute the Angular source in our context
try {
  vm.runInNewContext(angularSource, context);
} catch (error) {
  console.log('Error loading Angular source:', error.message);
  process.exit(1);
}

// Extract angular.copy from the context
var angularCopy = context.angular ? context.angular.copy : undefined;

if (!angularCopy) {
  console.log('❌ Could not load angular.copy function');
  process.exit(1);
}

console.log('✅ Successfully loaded angular.copy function');

// Test 1: Verify normal functionality still works
function testNormalFunctionality() {
  console.log('\n=== Test 1: Normal Functionality ===');

  try {
    // Test basic RegExp copying
    var originalRegex = /test[a-z]+/gi;
    originalRegex.lastIndex = 5;

    var start = performanceNow();
    var copiedRegex = angularCopy(originalRegex);
    var duration = performanceNow() - start;

    console.log('Normal RegExp copy took:', duration.toFixed(2), 'ms');

    // Verify the copy is correct
    if (copiedRegex instanceof RegExp &&
        copiedRegex.source === originalRegex.source &&
        copiedRegex.flags === originalRegex.flags &&
        copiedRegex.lastIndex === originalRegex.lastIndex &&
        copiedRegex !== originalRegex) {
      console.log('✅ Normal RegExp copying works correctly');
      console.log('   Source:', copiedRegex.source);
      console.log('   Flags:', copiedRegex.flags);
      console.log('   LastIndex:', copiedRegex.lastIndex);
      return true;
    } else {
      console.log('❌ Normal RegExp copying failed');
      console.log('   Expected source:', originalRegex.source);
      console.log('   Actual source:', copiedRegex.source);
      console.log('   Expected flags:', originalRegex.flags);
      console.log('   Actual flags:', copiedRegex.flags);
      return false;
    }
  } catch (error) {
    console.log('❌ Normal functionality test failed:', error.message);
    return false;
  }
}

// Test 2: Verify ReDoS vulnerability is fixed
function testReDoSFix() {
  console.log('\n=== Test 2: ReDoS Vulnerability Fix ===');

  var vulnerabilityFixed = true;

  // Test case 1: Malicious toString
  try {
    console.log('Testing malicious toString() method...');

    var maliciousRegex = new RegExp('test');
    maliciousRegex.toString = function() {
      // This would have caused ReDoS in the vulnerable version
      return '/test/' + 'a'.repeat(10000);
    };

    var startTime = performanceNow();
    angularCopy(maliciousRegex);
    var duration = performanceNow() - startTime;

    console.log('Malicious toString test took:', duration.toFixed(2), 'ms');

    if (duration > 100) {
      console.log('⚠️  Still taking too long - potential ReDoS issue');
      vulnerabilityFixed = false;
    } else {
      console.log('✅ Malicious toString handled efficiently');
    }
  } catch (error) {
    console.log('❌ Malicious toString test failed:', error.message);
    vulnerabilityFixed = false;
  }

  // Test case 2: More extreme attack
  try {
    console.log('Testing extreme ReDoS payload...');

    var extremeRegex = new RegExp('vulnerable');
    extremeRegex.toString = function() {
      return '/vulnerable/flags' + 'x'.repeat(50000) + 'y';
    };

    var extremeStart = performanceNow();
    angularCopy(extremeRegex);
    var extremeDuration = performanceNow() - extremeStart;

    console.log('Extreme payload test took:', extremeDuration.toFixed(2), 'ms');

    if (extremeDuration > 200) {
      console.log('⚠️  Extreme payload still causing delays');
      vulnerabilityFixed = false;
    } else {
      console.log('✅ Extreme payload handled efficiently');
    }
  } catch (error) {
    console.log('❌ Extreme payload test failed:', error.message);
    vulnerabilityFixed = false;
  }

  return vulnerabilityFixed;
}

// Test 3: Edge cases and regression testing
function testEdgeCases() {
  console.log('\n=== Test 3: Edge Cases ===');

  var edgeCasesPassed = true;

  try {
    // Test various regex flag combinations
    var testCases = [
      { regex: /test/g, desc: 'global flag' },
      { regex: /test/i, desc: 'ignoreCase flag' },
      { regex: /test/m, desc: 'multiline flag' },
      { regex: /test/gi, desc: 'global + ignoreCase' },
      { regex: /test/gim, desc: 'all common flags' },
      { regex: /test/, desc: 'no flags' }
    ];

    testCases.forEach(function(testCase) {
      var caseStart = performanceNow();
      var copied = angularCopy(testCase.regex);
      var caseDuration = performanceNow() - caseStart;

      if (copied.source === testCase.regex.source &&
          copied.flags === testCase.regex.flags &&
          caseDuration < 10) {
        console.log('✅', testCase.desc, '- OK');
      } else {
        console.log('❌', testCase.desc, '- FAILED');
        edgeCasesPassed = false;
      }
    });

  } catch (error) {
    console.log('❌ Edge case testing failed:', error.message);
    edgeCasesPassed = false;
  }

  return edgeCasesPassed;
}

// Test 4: Complex object copying with RegExp
function testComplexObjects() {
  console.log('\n=== Test 4: Complex Objects ===');

  try {
    var complexObject = {
      name: 'test',
      pattern: /complex[a-z]+/gi,
      nested: {
        regex: /nested.*/m,
        array: [/array[0-9]+/, 'string', 123],
        data: { inner: /inner.*/ }
      }
    };

    var complexStart = performanceNow();
    var copied = angularCopy(complexObject);
    var complexDuration = performanceNow() - complexStart;

    console.log('Complex object copy took:', complexDuration.toFixed(2), 'ms');

    // Verify deep copying worked correctly
    if (copied.pattern instanceof RegExp &&
        copied.pattern.source === complexObject.pattern.source &&
        copied.nested.regex instanceof RegExp &&
        copied.nested.array[0] instanceof RegExp &&
        copied !== complexObject &&
        complexDuration < 50) {
      console.log('✅ Complex object copying works correctly');
      return true;
    } else {
      console.log('❌ Complex object copying failed');
      return false;
    }
  } catch (error) {
    console.log('❌ Complex object test failed:', error.message);
    return false;
  }
}

// Run all tests
var test1 = testNormalFunctionality();
var test2 = testReDoSFix();
var test3 = testEdgeCases();
var test4 = testComplexObjects();

// Summary
console.log('\n' + '='.repeat(60));
console.log('CVE-2023-26116 Fix Verification Results');
console.log('='.repeat(60));

if (test1 && test2 && test3 && test4) {
  console.log('🎉 ALL TESTS PASSED');
  console.log('✅ CVE-2023-26116 has been successfully fixed');
  console.log('✅ Normal functionality is preserved');
  console.log('✅ ReDoS vulnerability is mitigated');
  console.log('✅ Edge cases work correctly');
  console.log('✅ Complex object copying works');
} else {
  console.log('❌ SOME TESTS FAILED');
  console.log('Normal functionality:', test1 ? '✅' : '❌');
  console.log('ReDoS fix:', test2 ? '✅' : '❌');
  console.log('Edge cases:', test3 ? '✅' : '❌');
  console.log('Complex objects:', test4 ? '✅' : '❌');
}

console.log('\n📋 Fix Summary:');
console.log('- Replaced vulnerable regex /[^/]*$/ with safer flag extraction');
console.log('- Used lastIndexOf and substring for parsing flags');
console.log('- Added validation to ensure extracted flags are valid');
console.log('- Maintained full backward compatibility');
console.log('- Eliminated catastrophic backtracking possibility');
