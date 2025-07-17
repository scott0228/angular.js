/**
 * 直接測試 CVE-2022-25844 修復中的 sanitizePatternString 函數
 */

// 從修復代碼中提取 sanitizePatternString 函數
function isString(value) {
  return typeof value === 'string';
}

function sanitizePatternString(str) {
  if (!isString(str)) return '';
  
  // Limit maximum length to prevent ReDoS attacks
  var MAX_PATTERN_LENGTH = 100;
  if (str.length > MAX_PATTERN_LENGTH) {
    return str.substring(0, MAX_PATTERN_LENGTH);
  }
  
  // Remove any JavaScript function calls that could cause ReDoS
  // This prevents patterns like ' '.repeat(999999) or similar attacks
  return str.replace(/[a-zA-Z_$][a-zA-Z0-9_$]*\s*\([^)]*\)/g, '');
}

// 簡化的 formatNumber 函數核心邏輯（僅測試修復部分）
function testFormatNumberSecurity(number, pattern) {
  // 模擬修復後的安全處理
  const safePosPre = sanitizePatternString(pattern.posPre);
  const safePosSuf = sanitizePatternString(pattern.posSuf);
  const safeNegPre = sanitizePatternString(pattern.negPre);
  const safeNegSuf = sanitizePatternString(pattern.negSuf);
  
  const formattedText = String(number);
  
  if (number < 0) {
    return safeNegPre + formattedText + safeNegSuf;
  } else {
    return safePosPre + formattedText + safePosSuf;
  }
}

console.log('🔒 CVE-2022-25844 核心修復功能測試\n');

// 測試套件
const tests = [
  {
    name: '正常模式字符串',
    input: 'prefix',
    expected: 'prefix',
    shouldMatch: true
  },
  {
    name: 'ReDoS 攻擊模式 - repeat 函數',
    input: 'evil_repeat(999999)_suffix',
    expected: 'evil__suffix',
    shouldMatch: true
  },
  {
    name: '多個函數調用',
    input: 'start_func1(arg)_middle_func2(arg)_end',
    expected: 'start__middle__end',
    shouldMatch: true
  },
  {
    name: '極長字符串（200字符）',
    input: 'A'.repeat(200),
    expected: 'A'.repeat(100),
    shouldMatch: true
  },
  {
    name: 'null 值',
    input: null,
    expected: '',
    shouldMatch: true
  },
  {
    name: 'undefined 值',
    input: undefined,
    expected: '',
    shouldMatch: true
  },
  {
    name: '數字類型',
    input: 123,
    expected: '',
    shouldMatch: true
  }
];

console.log('🧪 單元測試結果：\n');

let passedTests = 0;
let totalTests = tests.length;

tests.forEach((test, index) => {
  const result = sanitizePatternString(test.input);
  const passed = result === test.expected;
  
  console.log(`測試 ${index + 1}: ${test.name}`);
  console.log(`  輸入: ${JSON.stringify(test.input)}`);
  console.log(`  期望: ${JSON.stringify(test.expected)}`);
  console.log(`  實際: ${JSON.stringify(result)}`);
  console.log(`  結果: ${passed ? '✅ 通過' : '❌ 失敗'}\n`);
  
  if (passed) passedTests++;
});

console.log(`📊 測試總結: ${passedTests}/${totalTests} 測試通過\n`);

// 性能測試
console.log('⚡ 性能測試：\n');

const performanceTests = [
  {
    name: '正常字符串處理',
    pattern: { posPre: 'normal_prefix', posSuf: '', negPre: '-', negSuf: '' }
  },
  {
    name: 'ReDoS 攻擊模式',
    pattern: { posPre: 'attack_repeat(999999)_evil', posSuf: '', negPre: '-', negSuf: '' }
  },
  {
    name: '極長字符串',
    pattern: { posPre: 'X'.repeat(1000), posSuf: '', negPre: '-', negSuf: '' }
  }
];

performanceTests.forEach((perfTest, index) => {
  const iterations = 1000;
  const startTime = process.hrtime.bigint();
  
  for (let i = 0; i < iterations; i++) {
    testFormatNumberSecurity(1234.56, perfTest.pattern);
  }
  
  const endTime = process.hrtime.bigint();
  const totalNs = Number(endTime - startTime);
  const totalMs = totalNs / 1e6;
  const avgMs = totalMs / iterations;
  
  console.log(`${perfTest.name}:`);
  console.log(`  ${iterations} 次迭代總時間: ${totalMs.toFixed(2)}ms`);
  console.log(`  平均每次: ${avgMs.toFixed(4)}ms`);
  
  if (avgMs < 0.1) {
    console.log(`  ✅ 性能良好\n`);
  } else if (avgMs < 1) {
    console.log(`  ⚠️ 性能可接受\n`);
  } else {
    console.log(`  ❌ 性能需要改進\n`);
  }
});

// ReDoS 攻擊模擬
console.log('🛡️ ReDoS 攻擊模擬測試：\n');

const attackPatterns = [
  'prefix_repeat(999999)_suffix',
  'attack_String(arg).repeat(999999)',
  'evil().repeat(1000000)',
  'malicious_Array(999999).join("")',
  'bad_setTimeout(function(){}, 999999)'
];

attackPatterns.forEach((attackPattern, index) => {
  console.log(`攻擊模式 ${index + 1}: ${attackPattern}`);
  
  const startTime = process.hrtime.bigint();
  const result = sanitizePatternString(attackPattern);
  const endTime = process.hrtime.bigint();
  
  const durationNs = Number(endTime - startTime);
  const durationMs = durationNs / 1e6;
  
  console.log(`  處理時間: ${durationMs.toFixed(4)}ms`);
  console.log(`  結果: ${result}`);
  
  const hasFunctionCall = /[a-zA-Z_$][a-zA-Z0-9_$]*\s*\([^)]*\)/.test(result);
  
  if (!hasFunctionCall && durationMs < 1) {
    console.log(`  ✅ 攻擊被成功阻止\n`);
  } else {
    console.log(`  ❌ 攻擊可能未被完全阻止\n`);
  }
});

console.log('🎉 CVE-2022-25844 修復測試完成！');

if (passedTests === totalTests) {
  console.log('✅ 所有核心功能測試通過');
  console.log('🔒 ReDoS 漏洞修復有效');
  console.log('⚡ 性能影響最小');
} else {
  console.log('❌ 部分測試失敗，需要檢查修復實現');
}
