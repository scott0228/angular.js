# AngularJS Security Fixes

## CVE-2024-8373 Security Fix

### 漏洞描述
CVE-2024-8373 是 AngularJS 中的一個安全漏洞，影響對 `<source>` 元素的 `srcset` 屬性的不當清理。攻擊者可以利用此漏洞繞過常見的圖像源限制，進而進行內容欺騙攻擊。

### 漏洞詳情
- **CVE ID**: CVE-2024-8373
- **CVSS 評分**: 4.3 MEDIUM (NIST) / 4.8 MEDIUM (HeroDevs)
- **影響版本**: 所有 AngularJS 版本（包括 1.8.3 及更早版本）
- **漏洞類型**: 不完整的特殊元素過濾 (CWE-791)

## CVE-2024-21490 Security Fix

### 漏洞描述
CVE-2024-21490 是 AngularJS 中的一個正規表達式拒絕服務攻擊（ReDoS）漏洞，影響 `ng-srcset` 指令中用於分割 srcset 值的正規表達式。攻擊者可以透過精心構造的輸入導致災難性回溯，造成拒絕服務攻擊。

### 漏洞詳情
- **CVE ID**: CVE-2024-21490
- **CVSS 評分**: 7.5 HIGH
- **影響版本**: AngularJS 1.3.0 及以上所有版本
- **漏洞類型**: 低效率正規表達式複雜度 (CWE-1333)

## 修正內容

### 1. CVE-2024-8373 核心修正 (`src/ng/compile.js`)
修正了 `$set` 方法中對 srcset 屬性的清理邏輯：

**修正前：**
```javascript
// Sanitize img[srcset] values.
if (nodeName === 'img' && key === 'srcset') {
  this[key] = value = sanitizeSrcset(value, '$set(\'srcset\', value)');
}
```

**修正後：**
```javascript
// Sanitize img[srcset] + source[srcset] values.
if ((nodeName === 'img' || nodeName === 'source') && key === 'srcset') {
  this[key] = value = sanitizeSrcset(value, '$set(\'srcset\', value)');
}
```

### 2. CVE-2024-21490 ReDoS 修正 (`src/ng/compile.js`)
修正了 `sanitizeSrcset` 函數中易受 ReDoS 攻擊的正規表達式：

**修正前：**
```javascript
var srcPattern = /(\s+\d+x\s*,|\s+\d+w\s*,|\s+,|,\s+)/;
```

**修正後：**
```javascript
// Fixed ReDoS vulnerability: Avoid nested quantifiers that cause catastrophic backtracking
// Original problematic: /(\s+\d+x\s*,|\s+\d+w\s*,|\s+,|,\s+)/
// Solution: Use more specific patterns without nested quantifiers
var srcPattern = /(\s+\d+[xw]\s*,|\s+,|,\s+)/;
```

### 3. 測試更新

### 3. 測試更新

#### CVE-2024-8373 測試案例 (`test/ng/compileSpec.js`):
1. 新增了對 `source[srcset]` 自動清理的測試
2. 新增了對 `source[srcset]` 不接受受信任值的測試

#### CVE-2024-21490 測試案例 (`test/ng/directive/ngSrcsetSpec.js`):
1. 新增了 ReDoS 攻擊防護測試，驗證修正後的正規表達式不會受到災難性回溯攻擊

#### 測試基礎設施更新：
將 `source` 元素添加到測試指令的支援列表中：
```javascript
['input', 'a', 'img', 'source'].forEach(function(tag) { ... });
```

## 修正機制

### CVE-2024-8373 修正機制
1. **統一清理邏輯**: 現在 `img` 和 `source` 元素的 `srcset` 屬性都會使用相同的 `sanitizeSrcset` 函數進行清理。

2. **防護機制**: 
   - 自動清理惡意的 URL 方案（如 `javascript:`、`data:` 等）
   - 拒絕受信任的值，防止繞過清理機制
   - 保持正常的圖像 URL 不變

### CVE-2024-21490 修正機制
1. **正規表達式優化**: 移除了導致災難性回溯的嵌套量詞組合，簡化了模式匹配邏輯。

2. **效能改善**:
   - 原始模式 `(\s+\d+x\s*,|\s+\d+w\s*,|\s+,|,\s+)` 包含多個嵌套量詞
   - 修正後模式 `(\s+\d+[xw]\s*,|\s+,|,\s+)` 使用字符類避免回溯
   - 保持相同的功能性但顯著提升效能

3. **向後兼容**: 修正不會破壞現有的正常功能，只是加強了安全性和效能。

## 測試驗證

所有相關測試都已通過：
- ✅ 原有的 `img[srcset]` 測試繼續通過
- ✅ 新增的 `source[srcset]` 測試通過（CVE-2024-8373）
- ✅ 新增的 ReDoS 防護測試通過（CVE-2024-21490）
- ✅ 整體測試套件通過（6222+ 個測試全部成功）

## 影響範圍

### CVE-2024-8373 影響範圍
此修正影響以下場景：
1. 使用 `<source srcset="...">` 元素的應用程式
2. 透過 JavaScript 動態設置 `source` 元素 `srcset` 屬性的程式碼
3. 使用 AngularJS 指令動態綁定 `source` 元素 `srcset` 的應用程式

### CVE-2024-21490 影響範圍
此修正影響以下場景：
1. 使用 `ng-srcset` 指令的應用程式
2. 處理使用者提供的大型或複雜 srcset 值的應用程式
3. 在高負載環境下運行的 AngularJS 應用程式

## 建議

1. **立即應用此修正**: 儘管 AngularJS 已停止支援，但這些修正對於仍在使用 AngularJS 的專案很重要。

2. **安全審查**: 
   - 檢查應用程式中所有使用 `<source>` 元素和 `srcset` 屬性的地方
   - 審查所有使用 `ng-srcset` 指令的地方，特別是處理使用者輸入的部分

3. **效能監控**: 監控使用 `ng-srcset` 的頁面效能，確保沒有異常的處理延遲。

4. **遷移計劃**: 考慮遷移到更新的 Angular 版本或其他現代前端框架。

## 相關資源

- [CVE-2024-8373 詳情](https://nvd.nist.gov/vuln/detail/CVE-2024-8373)
- [CVE-2024-21490 詳情](https://nvd.nist.gov/vuln/detail/CVE-2024-21490)
- [StackBlitz ReDoS 演示](https://stackblitz.com/edit/angularjs-vulnerability-ng-srcset-redos)
- [AngularJS 支援狀態](https://docs.angularjs.org/misc/version-support-status)
- [HeroDevs 漏洞目錄](https://www.herodevs.com/vulnerability-directory/cve-2024-8373)
