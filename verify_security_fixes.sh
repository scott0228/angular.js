#!/bin/bash

echo "AngularJS 安全修正驗證腳本"
echo "============================"
echo ""

echo "1. 運行 CVE-2024-8373 相關測試..."
npx grunt test:unit --grep="source\[srcset\]" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ CVE-2024-8373 測試通過"
else
    echo "❌ CVE-2024-8373 測試失敗"
fi

echo ""
echo "2. 運行 CVE-2024-21490 相關測試..."
npx grunt test:unit --grep="ReDoS" 2>/dev/null  
if [ $? -eq 0 ]; then
    echo "✅ CVE-2024-21490 測試通過"
else
    echo "❌ CVE-2024-21490 測試失敗"
fi

echo ""
echo "3. 運行完整測試套件..."
npm test >/dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ 完整測試套件通過"
else
    echo "❌ 完整測試套件失敗"
fi

echo ""
echo "安全修正摘要:"
echo "- CVE-2024-8373: 修正了 <source> 元素 srcset 屬性的不當清理"
echo "- CVE-2024-21490: 修正了 ng-srcset 指令中的 ReDoS 漏洞"
echo ""
echo "測試文件:"
echo "- test_cve_fix.html: CVE-2024-8373 測試頁面"
echo "- test_cve_21490_fix.html: CVE-2024-21490 測試頁面"
echo "- SECURITY-FIXES.md: 完整的安全修正文件"
