/**
 * Test suite to verify the fix for CVE-2024-8373
 * 
 * This vulnerability allowed bypassing image source restrictions via ng-attr-srcset
 * and interpolation on <source> elements.
 */

describe('CVE-2024-8373 Fix', function() {
  var $compile, $rootScope, $sce, $compileProvider;
  
  beforeEach(function() {
    module('ng', function(_$compileProvider_) {
      $compileProvider = _$compileProvider_;
      // Configure img source sanitization to only allow images from angularjs.org
      $compileProvider.imgSrcSanitizationTrustedUrlList(/^https:\/\/angularjs\.org\//);
    });
    
    inject(function(_$compile_, _$rootScope_, _$sce_) {
      $compile = _$compile_;
      $rootScope = _$rootScope_;
      $sce = _$sce_;
    });
  });

  describe('ng-attr-srcset vulnerability tests', function() {
    
    it('should sanitize ng-attr-srcset on source elements', function() {
      var html = '<picture><source ng-attr-srcset="{{maliciousUrl}}" /><img src="" /></picture>';
      $rootScope.maliciousUrl = 'https://malicious.example.com/evil.jpg';
      
      var element = $compile(html)($rootScope);
      $rootScope.$digest();
      
      var sourceElement = element.find('source');
      var srcsetValue = sourceElement.attr('srcset');
      
      // Should be sanitized and prefixed with "unsafe:"
      expect(srcsetValue).toMatch(/^unsafe:/);
      expect(srcsetValue).toContain('malicious.example.com');
    });
    
    it('should sanitize ng-attr-srcset on img elements', function() {
      var html = '<img ng-attr-srcset="{{maliciousUrl}}" src="" />';
      $rootScope.maliciousUrl = 'https://malicious.example.com/evil.jpg';
      
      var element = $compile(html)($rootScope);
      $rootScope.$digest();
      
      var srcsetValue = element.attr('srcset');
      
      // Should be sanitized and prefixed with "unsafe:"
      expect(srcsetValue).toMatch(/^unsafe:/);
      expect(srcsetValue).toContain('malicious.example.com');
    });
    
    it('should allow trusted URLs in ng-attr-srcset', function() {
      var html = '<picture><source ng-attr-srcset="{{trustedUrl}}" /><img src="" /></picture>';
      $rootScope.trustedUrl = 'https://angularjs.org/img/logo.png';
      
      var element = $compile(html)($rootScope);
      $rootScope.$digest();
      
      var sourceElement = element.find('source');
      var srcsetValue = sourceElement.attr('srcset');
      
      // Should not be prefixed with "unsafe:"
      expect(srcsetValue).not.toMatch(/^unsafe:/);
      expect(srcsetValue).toBe('https://angularjs.org/img/logo.png');
    });
    
    it('should handle complex srcset values with descriptors in ng-attr-srcset', function() {
      var html = '<picture><source ng-attr-srcset="{{complexSrcset}}" /><img src="" /></picture>';
      $rootScope.complexSrcset = 'https://malicious.example.com/small.jpg 480w, https://angularjs.org/img/large.png 800w';
      
      var element = $compile(html)($rootScope);
      $rootScope.$digest();
      
      var sourceElement = element.find('source');
      var srcsetValue = sourceElement.attr('srcset');
      
      // The malicious URL should be sanitized, but the trusted one should remain
      expect(srcsetValue).toContain('unsafe:https://malicious.example.com/small.jpg 480w');
      expect(srcsetValue).toContain('https://angularjs.org/img/large.png 800w');
    });
  });

  describe('interpolation vulnerability tests', function() {
    
    it('should sanitize interpolated srcset on source elements', function() {
      var html = '<picture><source srcset="{{maliciousUrl}}" /><img src="" /></picture>';
      $rootScope.maliciousUrl = 'https://malicious.example.com/evil.jpg';
      
      var element = $compile(html)($rootScope);
      $rootScope.$digest();
      
      var sourceElement = element.find('source');
      var srcsetValue = sourceElement.attr('srcset');
      
      // Should be sanitized and prefixed with "unsafe:"
      expect(srcsetValue).toMatch(/^unsafe:/);
      expect(srcsetValue).toContain('malicious.example.com');
    });
    
    it('should sanitize interpolated srcset on img elements', function() {
      var html = '<img srcset="{{maliciousUrl}}" src="" />';
      $rootScope.maliciousUrl = 'https://malicious.example.com/evil.jpg';
      
      var element = $compile(html)($rootScope);
      $rootScope.$digest();
      
      var srcsetValue = element.attr('srcset');
      
      // Should be sanitized and prefixed with "unsafe:"
      expect(srcsetValue).toMatch(/^unsafe:/);
      expect(srcsetValue).toContain('malicious.example.com');
    });
    
    it('should allow trusted URLs in interpolated srcset', function() {
      var html = '<picture><source srcset="{{trustedUrl}}" /><img src="" /></picture>';
      $rootScope.trustedUrl = 'https://angularjs.org/img/logo.png';
      
      var element = $compile(html)($rootScope);
      $rootScope.$digest();
      
      var sourceElement = element.find('source');
      var srcsetValue = sourceElement.attr('srcset');
      
      // Should not be prefixed with "unsafe:"
      expect(srcsetValue).not.toMatch(/^unsafe:/);
      expect(srcsetValue).toBe('https://angularjs.org/img/logo.png');
    });
    
    it('should prevent data: URL injection in interpolated srcset', function() {
      var html = '<picture><source srcset="{{dataUrl}}" /><img src="" /></picture>';
      $rootScope.dataUrl = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjx0ZXh0PkV2aWwgU1ZHPC90ZXh0Pjwvc3ZnPg==';
      
      var element = $compile(html)($rootScope);
      $rootScope.$digest();
      
      var sourceElement = element.find('source');
      var srcsetValue = sourceElement.attr('srcset');
      
      // Should be sanitized and prefixed with "unsafe:"
      expect(srcsetValue).toMatch(/^unsafe:/);
      expect(srcsetValue).toContain('data:image/svg+xml');
    });
  });

  describe('ngSrcset directive (should continue to work)', function() {
    
    it('should properly sanitize ngSrcset directive', function() {
      var html = '<img ng-srcset="maliciousUrl" src="" />';
      $rootScope.maliciousUrl = 'https://malicious.example.com/evil.jpg';
      
      var element = $compile(html)($rootScope);
      $rootScope.$digest();
      
      var srcsetValue = element.attr('srcset');
      
      // Should be sanitized and prefixed with "unsafe:"
      expect(srcsetValue).toMatch(/^unsafe:/);
      expect(srcsetValue).toContain('malicious.example.com');
    });
    
    it('should allow trusted URLs in ngSrcset directive', function() {
      var html = '<img ng-srcset="trustedUrl" src="" />';
      $rootScope.trustedUrl = 'https://angularjs.org/img/logo.png';
      
      var element = $compile(html)($rootScope);
      $rootScope.$digest();
      
      var srcsetValue = element.attr('srcset');
      
      // Should not be prefixed with "unsafe:"
      expect(srcsetValue).not.toMatch(/^unsafe:/);
      expect(srcsetValue).toBe('https://angularjs.org/img/logo.png');
    });
  });

  describe('non-vulnerable elements (should not be affected)', function() {
    
    it('should not apply srcset sanitization to non-img/source elements', function() {
      // This is a hypothetical case - srcset doesn't make sense on div, but we test the logic
      var html = '<div ng-attr-srcset="{{someUrl}}"></div>';
      $rootScope.someUrl = 'https://malicious.example.com/evil.jpg';
      
      var element = $compile(html)($rootScope);
      $rootScope.$digest();
      
      var srcsetValue = element.attr('srcset');
      
      // Should not be sanitized for non-img/source elements
      expect(srcsetValue).toBe('https://malicious.example.com/evil.jpg');
    });
  });
});
