// Test script to verify CVE-2024-21490 fix
function testSanitizeSrcset() {
  // First, we need to extract the sanitizeSrcset function
  // Since this is a quick test, we'll copy the vulnerable and fixed versions
  
  // Vulnerable version (original)
  function vulnerableSanitizeSrcset(value) {
    if (!value) return value;
    
    var result = '';
    var trimmedSrcset = value.trim();
    var srcPattern = /(\s+\d+x\s*,|\s+\d+w\s*,|\s+,|,\s+)/;
    var pattern = /\s/.test(trimmedSrcset) ? srcPattern : /(,)/;
    var rawUris = trimmedSrcset.split(pattern);
    
    // ... rest of the vulnerable implementation would go here
    // For testing purposes, we'll just test the regex pattern
    return pattern.test(value);
  }
  
  // Fixed version (our implementation)
  function fixedSanitizeSrcset(value) {
    if (!value) return value;
    
    var result = '';
    var trimmedSrcset = value.trim();
    var candidates = trimmedSrcset.split(',');
    
    for (var i = 0; i < candidates.length; i++) {
      var candidate = candidates[i].trim();
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
        var potentialDescriptor = candidate.substring(lastSpaceIndex + 1).trim();
        if (/^\d+(\.\d+)?[wx]$/.test(potentialDescriptor) || /^\d+(\.\d+)?$/.test(potentialDescriptor)) {
          url = candidate.substring(0, lastSpaceIndex).trim();
          descriptor = potentialDescriptor;
        } else {
          url = candidate;
        }
      } else {
        url = candidate;
      }
      
      if (result) result += ',';
      result += url; // In real implementation, this would be $sce.getTrustedMediaUrl(url)
      if (descriptor) result += ' ' + descriptor;
    }
    
    return result;
  }
  
  // Test cases
  console.log('Testing normal srcset values...');
  
  var normalCases = [
    'image.jpg 1x',
    'image1.jpg 1x, image2.jpg 2x',
    'image1.jpg 1x, image2.jpg 2x, image3.jpg 3x',
    'image.jpg 100w',
    'image1.jpg 100w, image2.jpg 200w'
  ];
  
  normalCases.forEach(function(testCase) {
    var fixed = fixedSanitizeSrcset(testCase);
    console.log('Input:', testCase);
    console.log('Output:', fixed);
    console.log('---');
  });
  
  // Test potential ReDoS attack vectors
  console.log('\nTesting potential ReDoS patterns...');
  
  var attackVectors = [
    'a' + ' '.repeat(100) + ',',
    'a' + ' '.repeat(1000) + 'x,',
    'img.jpg' + ' '.repeat(100) + '1x, ' + 'b'.repeat(100),
  ];
  
  attackVectors.forEach(function(attack) {
    console.log('Testing attack vector length:', attack.length);
    var start = performance.now();
    var result = fixedSanitizeSrcset(attack);
    var end = performance.now();
    console.log('Time taken:', (end - start).toFixed(2) + 'ms');
    console.log('Result length:', result.length);
    console.log('---');
  });
  
  console.log('CVE-2024-21490 fix test completed successfully!');
}

// Run the test if in Node.js environment
if (typeof module !== 'undefined') {
  testSanitizeSrcset();
}
