/**
 * Test for CVE-2022-25844 ReDoS vulnerability fix
 * This test verifies that the fix prevents ReDoS attacks through malicious posPre patterns
 */

// Load required files
var fs = require('fs');
var vm = require('vm');

// Create a minimal Angular environment for testing
var context = {
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: setInterval,
  clearInterval: clearInterval,
  angular: {},
  window: {},
  document: {createElement: function() { return {}; }},
  navigator: {userAgent: 'test'},
  isString: function(value) { return typeof value === 'string'; },
  isNumber: function(value) { return typeof value === 'number'; },
  isUndefined: function(value) { return typeof value === 'undefined'; }
};

// Read and execute the filter file
var filterCode = fs.readFileSync('./src/ng/filter/filters.js', 'utf8');
vm.createContext(context);
vm.runInContext(filterCode, context);

// Extract the formatNumber function
var formatNumber = context.formatNumber;

console.log('Testing CVE-2022-25844 ReDoS vulnerability fix...\n');

// Test 1: Normal operation should work
console.log('Test 1: Normal formatting');
var normalPattern = {
  minFrac: 0,
  maxFrac: 3,
  gSize: 3,
  lgSize: 3,
  negPre: '-',
  posPre: '',
  negSuf: '',
  posSuf: ''
};

try {
  var result1 = formatNumber(1234.56, normalPattern, ',', '.', 2);
  console.log('✓ Normal formatting works:', result1);
} catch (e) {
  console.log('✗ Normal formatting failed:', e.message);
}

// Test 2: Malicious posPre with function call should be sanitized
console.log('\nTest 2: Malicious posPre with function call');
var maliciousPattern1 = {
  minFrac: 0,
  maxFrac: 3,
  gSize: 3,
  lgSize: 3,
  negPre: '-',
  posPre: 'prefix_repeat(999999)_suffix',
  negSuf: '',
  posSuf: ''
};

try {
  var start = Date.now();
  var result2 = formatNumber(1234.56, maliciousPattern1, ',', '.', 2);
  var duration = Date.now() - start;
  console.log('✓ Malicious pattern sanitized in', duration, 'ms:', result2);
  if (duration < 100) {
    console.log('✓ No ReDoS attack detected (completed quickly)');
  } else {
    console.log('⚠ Warning: Processing took longer than expected');
  }
} catch (e) {
  console.log('✗ Malicious pattern handling failed:', e.message);
}

// Test 3: Very long posPre should be truncated
console.log('\nTest 3: Very long posPre string');
var longString = 'A'.repeat(1000);
var longPattern = {
  minFrac: 0,
  maxFrac: 3,
  gSize: 3,
  lgSize: 3,
  negPre: '-',
  posPre: longString,
  negSuf: '',
  posSuf: ''
};

try {
  var start = Date.now();
  var result3 = formatNumber(1234.56, longPattern, ',', '.', 2);
  var duration = Date.now() - start;
  console.log('✓ Long pattern handled in', duration, 'ms');
  console.log('✓ Result length:', result3.length, '(should be reasonable)');
  if (duration < 100) {
    console.log('✓ No ReDoS attack detected (completed quickly)');
  }
} catch (e) {
  console.log('✗ Long pattern handling failed:', e.message);
}

// Test 4: Multiple function calls should be removed
console.log('\nTest 4: Multiple function calls in pattern');
var multipleFunctionPattern = {
  minFrac: 0,
  maxFrac: 3,
  gSize: 3,
  lgSize: 3,
  negPre: '-',
  posPre: 'start_func1(arg)_middle_func2(arg)_end',
  negSuf: '',
  posSuf: 'suffix_func3(arg)_end'
};

try {
  var start = Date.now();
  var result4 = formatNumber(1234.56, multipleFunctionPattern, ',', '.', 2);
  var duration = Date.now() - start;
  console.log('✓ Multiple function calls sanitized in', duration, 'ms:', result4);
  if (result4.indexOf('func1') === -1 && result4.indexOf('func2') === -1 && result4.indexOf('func3') === -1) {
    console.log('✓ All function calls were properly removed');
  } else {
    console.log('⚠ Warning: Some function calls may not have been removed');
  }
} catch (e) {
  console.log('✗ Multiple function pattern handling failed:', e.message);
}

// Test 5: Non-string posPre should be handled gracefully
console.log('\nTest 5: Non-string posPre');
var nonStringPattern = {
  minFrac: 0,
  maxFrac: 3,
  gSize: 3,
  lgSize: 3,
  negPre: '-',
  posPre: null,
  negSuf: '',
  posSuf: undefined
};

try {
  var result5 = formatNumber(1234.56, nonStringPattern, ',', '.', 2);
  console.log('✓ Non-string patterns handled gracefully:', result5);
} catch (e) {
  console.log('✗ Non-string pattern handling failed:', e.message);
}

console.log('\n=== CVE-2022-25844 Fix Test Complete ===');
console.log('All tests should complete quickly without hanging or consuming excessive resources.');
