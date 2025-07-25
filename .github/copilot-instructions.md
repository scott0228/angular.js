# AngularJS Copilot Instructions

## Project Overview
This is AngularJS 1.8.3 (legacy framework, support ended January 2022), currently in security-fix-only mode. The codebase follows a modular architecture with comprehensive dependency injection, directive-based templating, and extensive security hardening.

## Architecture & Code Organization

### Core Architecture
- **Bootstrap**: `src/Angular.js` - entry point, core utilities, module system (~2000 lines)
- **Dependency Injection**: `src/auto/injector.js` - DI container, service registration, module loading
- **Compilation**: `src/ng/compile.js` - DOM compilation, directive processing (4300+ lines, **security-critical**)
- **Module System**: `src/loader.js` - module definition API, lazy loading support

### Service Boundaries & File Structure
- **Core Services** (`src/ng/`): $scope, $http, $compile, $parse, $q, $location, etc.
- **Optional Modules**: `src/ngRoute/`, `src/ngAnimate/`, `src/ngSanitize/`, etc.
- **jqLite**: `src/jqLite.js` - jQuery subset, DOM manipulation
- **Build Config**: `angularFiles.js` - **critical** concatenation order for DI resolution

### Security-Critical Components (CVE Fixes Present)
This branch contains multiple CVE fixes requiring **security review** for changes:
- **`src/ng/compile.js`**: CVE-2024-8373 (srcset bypass), CVE-2024-21490 (ReDoS in sanitizeSrcset)
- **`src/ng/filter/filters.js`**: CVE-2022-25844 (ReDoS in formatNumber)
- **`src/ng/directive/input.js`**: CVE-2023-26118 (ReDoS in URL validation)

## Development Workflows

### Essential Commands
開發測試使用 docker 環境進行打包測試
```bash
docker build -t angularjs-dev .
docker run -it --rm -v $(pwd):/app angularjs-dev yarn install --frozen-lockfile

```

```bash
yarn install                    # Install dependencies (Yarn required, not npm)
grunt package                   # Full build → creates build/ directory
grunt test                      # Complete test suite (unit + e2e)
grunt autotest                  # Watch mode testing
grunt webserver                 # Dev server on localhost:8000
grunt eslint                    # Code linting
# Targeted testing
npx karma start karma-jqlite.conf.js --single-run --browsers=ChromeHeadless
```

### Dependency Injection Patterns
```javascript
// Provider registration (config phase)
angular.module('myModule', [])
  .provider('myService', function MyServiceProvider() {
    this.configure = function(options) { /* config */ };
    this.$get = ['$http', function($http) { 
      return { /* service instance */ };
    }];
  });

// Service consumption (run phase)
angular.module('myModule')
  .controller('MyCtrl', ['myService', function(myService) {
    // Use service
  }]);
```

### Module Loading & Concatenation Order
- **Critical**: Services must be defined before being injected
- **File Order**: `angularFiles.js` defines load sequence - **DO NOT reorder casually**
- **Module Dependencies**: Listed in module definition, loaded recursively

## Code Patterns & Security

### Security Patterns (Due to CVE History)
```javascript
// ReDoS Prevention - avoid nested quantifiers
var UNSAFE_REGEX = /(\s+\w+\s*)+/;  // ❌ Catastrophic backtracking
var SAFE_REGEX = /\s+\w+(?:\s+\w+)*/;  // ✅ Linear time

// Sanitization in compile.js
function sanitizeSrcset(value) {
  // Manual parsing instead of complex regex (CVE-2024-21490 fix)
  var candidates = value.split(',');
  // ... linear processing
}
```

### Testing Security Fixes
- **Performance Assertions**: ReDoS tests include timing checks (`< 100ms`)
- **Attack Vectors**: Test with pathological inputs that previously caused issues
- **Regression Prevention**: Each CVE fix has dedicated test files

### Directive Architecture
```javascript
// Follow src/ng/directive/input.js pattern
app.directive('myDirective', function() {
  return {
    restrict: 'E',
    scope: { value: '=' },
    link: function(scope, element, attrs) {
      // DOM manipulation logic
    }
  };
});
```

## Testing Strategy

### Test Structure
- **Mirror Source**: `test/ng/directive/inputSpec.js` mirrors `src/ng/directive/input.js`
- **Jasmine + Karma**: Standard testing stack with multiple browser configs
- **Security Tests**: Timing assertions, attack pattern validation
- **Cross-Browser**: IE9+ support requires specific Karma configurations

### Build System
- **Grunt-Based**: `Gruntfile.js` orchestrates all build tasks
- **Java Dependency**: Closure Compiler requires Java for minification
- **Version Management**: `lib/versions/version-info.js` handles semantic versioning
- **Output Structure**: `build/` contains distributable files + documentation

## Critical Considerations

### File Modification Warnings
- **`src/ng/compile.js`**: Requires 2 core member security reviews
- **RegEx Changes**: Always test for ReDoS vulnerabilities with long inputs
- **angularFiles.js**: Changes affect entire build - test thoroughly

### Legacy Browser Support
- **IE9+ Compatibility**: Check `src/ng/sniffer.js` for browser-specific workarounds
- **Polyfills**: Various shims for missing browser APIs in older versions

### Performance & Security Balance
- Prefer explicit parsing over complex regex patterns
- Include performance regression tests for security-critical paths
- Test with both normal and pathological inputs

This codebase prioritizes security fixes while maintaining backward compatibility for legacy applications still using AngularJS.
