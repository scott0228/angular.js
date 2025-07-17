// Comprehensive test for CVE-2024-21490 fix
// This test validates that the sanitizeSrcset function correctly handles
// various edge cases and attack patterns without falling into ReDoS

function comprehensiveTest() {
  console.log('=== Comprehensive CVE-2024-21490 Fix Test ===\n');

  // Mock the necessary dependencies for isolated testing
  function trim(str) {
    return str.replace(/^\s+|\s+$/g, '');
  }

  function mockSce() {
    return {
      getTrustedMediaUrl: function(url) {
        // Simple mock that marks unsafe URLs
        if (url.indexOf('javascript:') === 0 || url.indexOf('evil:') === 0) {
          return 'unsafe:' + url;
        }
        return url;
      }
    };
  }

  var $sce = mockSce();

  // Fixed sanitizeSrcset implementation
  function sanitizeSrcset(value, invokeType) {
    if (!value) {
      return value;
    }
    if (typeof value !== 'string') {
      throw new Error('Can\'t pass trusted values to `' + invokeType + '`: "' + value.toString() + '"');
    }

    var result = '';
    var trimmedSrcset = trim(value);
    var candidates = trimmedSrcset.split(',');
    
    for (var i = 0; i < candidates.length; i++) {
      var candidate = trim(candidates[i]);
      if (!candidate) continue;
      
      var lastSpaceIndex = -1;
      for (var j = candidate.length - 1; j >= 0; j--) {
        if (/\s/.test(candidate[j])) {
          lastSpaceIndex = j;
          break;
        }
      }
      
      var url, descriptor = '';
      if (lastSpaceIndex !== -1) {
        var potentialDescriptor = trim(candidate.substring(lastSpaceIndex + 1));
        if (/^\d+(\.\d+)?[wx]$/.test(potentialDescriptor) || /^\d+(\.\d+)?$/.test(potentialDescriptor)) {
          url = trim(candidate.substring(0, lastSpaceIndex));
          descriptor = potentialDescriptor;
        } else {
          url = candidate;
        }
      } else {
        url = candidate;
      }
      
      if (result) {
        result += ',';
      }
      
      result += $sce.getTrustedMediaUrl(url);
      
      if (descriptor) {
        result += ' ' + descriptor;
      }
    }
    
    return result;
  }

  // Test Cases
  var testCases = [
    // Basic functionality
    {
      name: 'Single image with descriptor',
      input: 'image.jpg 1x',
      expected: 'image.jpg 1x'
    },
    {
      name: 'Multiple images',
      input: 'image1.jpg 1x, image2.jpg 2x',
      expected: 'image1.jpg 1x,image2.jpg 2x'
    },
    {
      name: 'Width descriptors',
      input: 'small.jpg 300w, large.jpg 600w',
      expected: 'small.jpg 300w,large.jpg 600w'
    },
    {
      name: 'Mixed descriptors',
      input: 'small.jpg 1x, medium.jpg 300w, large.jpg 2x',
      expected: 'small.jpg 1x,medium.jpg 300w,large.jpg 2x'
    },
    
    // Edge cases
    {
      name: 'Empty string',
      input: '',
      expected: ''
    },
    {
      name: 'Only spaces',
      input: '   ',
      expected: ''
    },
    {
      name: 'No descriptor',
      input: 'image.jpg',
      expected: 'image.jpg'
    },
    {
      name: 'Trailing comma',
      input: 'image.jpg 1x,',
      expected: 'image.jpg 1x'
    },
    {
      name: 'Leading comma',
      input: ',image.jpg 1x',
      expected: 'image.jpg 1x'
    },
    {
      name: 'Multiple commas',
      input: 'image1.jpg 1x,,image2.jpg 2x',
      expected: 'image1.jpg 1x,image2.jpg 2x'
    },
    {
      name: 'Extra spaces',
      input: '  image1.jpg   1x  ,  image2.jpg   2x  ',
      expected: 'image1.jpg 1x,image2.jpg 2x'
    },
    
    // Security tests
    {
      name: 'JavaScript URL (should be marked unsafe)',
      input: 'javascript:alert(1) 1x',
      expected: 'unsafe:javascript:alert(1) 1x'
    },
    {
      name: 'Evil URL (should be marked unsafe)',
      input: 'evil:payload 1x',
      expected: 'unsafe:evil:payload 1x'
    },
    {
      name: 'Mixed safe and unsafe URLs',
      input: 'safe.jpg 1x, javascript:evil() 2x',
      expected: 'safe.jpg 1x,unsafe:javascript:evil() 2x'
    }
  ];

  // Performance test cases (potential ReDoS patterns)
  var performanceTests = [
    {
      name: 'Long spaces before descriptor',
      input: 'image.jpg' + ' '.repeat(1000) + '1x'
    },
    {
      name: 'Many spaces with comma',
      input: 'a' + ' '.repeat(500) + 'x,' + ' '.repeat(500) + 'b.jpg'
    },
    {
      name: 'Alternating spaces and commas',
      input: ('a' + ' '.repeat(10) + ',').repeat(100) + 'final.jpg'
    },
    {
      name: 'Very long URL',
      input: 'http://example.com/' + 'a'.repeat(10000) + '.jpg 1x'
    }
  ];

  // Run functionality tests
  console.log('1. Functionality Tests:');
  var functionalityPassed = 0;
  testCases.forEach(function(testCase) {
    try {
      var start = performance.now();
      var result = sanitizeSrcset(testCase.input, 'test');
      var end = performance.now();
      
      if (result === testCase.expected) {
        console.log('✓ ' + testCase.name + ' (took ' + (end - start).toFixed(2) + 'ms)');
        functionalityPassed++;
      } else {
        console.log('✗ ' + testCase.name);
        console.log('  Expected: "' + testCase.expected + '"');
        console.log('  Got:      "' + result + '"');
      }
    } catch (e) {
      console.log('✗ ' + testCase.name + ' - Error: ' + e.message);
    }
  });
  
  console.log('\n2. Performance Tests (ReDoS resistance):');
  var performancePassed = 0;
  performanceTests.forEach(function(testCase) {
    try {
      var start = performance.now();
      var result = sanitizeSrcset(testCase.input, 'test');
      var end = performance.now();
      var timeTaken = end - start;
      
      if (timeTaken < 100) { // Should complete in less than 100ms
        console.log('✓ ' + testCase.name + ' (took ' + timeTaken.toFixed(2) + 'ms, length: ' + testCase.input.length + ')');
        performancePassed++;
      } else {
        console.log('✗ ' + testCase.name + ' - Too slow: ' + timeTaken.toFixed(2) + 'ms');
      }
    } catch (e) {
      console.log('✗ ' + testCase.name + ' - Error: ' + e.message);
    }
  });

  console.log('\n=== Test Results ===');
  console.log('Functionality tests: ' + functionalityPassed + '/' + testCases.length + ' passed');
  console.log('Performance tests: ' + performancePassed + '/' + performanceTests.length + ' passed');
  
  var totalPassed = functionalityPassed + performancePassed;
  var totalTests = testCases.length + performanceTests.length;
  
  if (totalPassed === totalTests) {
    console.log('🎉 All tests passed! CVE-2024-21490 fix is working correctly.');
  } else {
    console.log('❌ Some tests failed. Please review the implementation.');
  }
  
  return totalPassed === totalTests;
}

// Run the test
if (typeof module !== 'undefined') {
  comprehensiveTest();
}
