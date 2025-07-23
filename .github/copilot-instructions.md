# AngularJS Copilot Instructions

## Project Overview
This is AngularJS 1.x (legacy version, support ended January 2022), currently focused on security vulnerability fixes. The codebase follows a monolithic architecture with distinct service boundaries and a comprehensive test-driven development approach.

## Architecture & Code Organization

### Core Architecture
- **Entry Point**: `src/Angular.js` - main module loader and utilities
- **Compilation Pipeline**: `src/ng/compile.js` - DOM compilation, directive processing (4300+ lines, security-critical)  
- **Module System**: Each feature in separate folders (`src/ng/`, `src/ngRoute/`, etc.) with index files
- **Build Pipeline**: `angularFiles.js` defines file concatenation order for builds

### Key Service Boundaries
- **Core (`src/ng/`)**: Fundamental services (compile, scope, http, etc.)
- **Modules (`src/ngRoute/`, `src/ngAnimate/`, etc.)**: Optional feature modules
- **Utilities (`src/jqLite.js`, `src/apis.js`)**: DOM manipulation and helper functions
- **I18n (`src/ngLocale/`)**: Localization files with currency/date formats

### Security-Critical Areas
This branch contains CVE fixes - security reviews required for these files:
- `src/ng/compile.js` - CVE-2024-8372 srcset sanitization  
- `src/ng/directive/input.js` - CVE-2023-26118 ReDoS in URL validation
- `src/Angular.js` - CVE-2023-26116 ReDoS in angular.copy
- `src/ng/filter/filters.js` - CVE-2022-25844 ReDoS prevention

## Development Workflows

### Essential Commands
```bash
yarn install                    # Install dependencies
grunt package                   # Full build (creates build/ directory)
grunt test                      # Run all tests
grunt test:unit                 # Unit tests only
grunt autotest                  # Continuous testing
grunt webserver                 # Local dev server (localhost:8000)
grunt eslint                    # Linting checks
```

### Testing Patterns
- **Jasmine + Karma**: All tests use Jasmine syntax with Karma runner
- **Test Structure**: `test/ng/directive/inputSpec.js` style - mirrors src structure
- **CVE Testing**: Security tests include timing assertions (< 100ms for ReDoS prevention)
- **Cross-browser**: Use `--browsers=Chrome,Firefox` flag for multi-browser testing

### Build System Details
- **Grunt-based**: `Gruntfile.js` orchestrates all tasks
- **File Order**: `angularFiles.js` defines precise concatenation order (order matters!)
- **Output**: `build/` contains minified/unminified versions plus docs
- **Version Management**: `lib/versions/version-info.js` handles version numbering

## Code Patterns & Conventions

### Module Definition Pattern
```javascript
// Standard service definition
angular.module('ng').provider('$service', function ServiceProvider() {
  this.$get = function() { /* implementation */ };
});
```

### Directive Structure
- Follow `src/ng/directive/input.js` pattern for form controls
- Security: Always sanitize user inputs, especially in compile.js
- Testing: Each directive needs comprehensive spec file with edge cases

### Security Patterns
- **RegEx Safety**: Avoid nested quantifiers (causes ReDoS) - see URL_REGEXP fix
- **DOM Sanitization**: Use `$$sanitizeUri` for URL attributes
- **Input Validation**: Time-based assertions in tests to prevent performance regressions

### Error Handling
- **minErr**: Use `src/minErr.js` pattern for consistent error formatting
- **Global Handlers**: Errors flow through `$exceptionHandler` service

## Testing Strategy
- **Unit Tests**: Mirror src structure in test/
- **Performance Tests**: Include timing assertions for security-critical regex patterns  
- **Browser Matrix**: Support IE9+ through modern browsers via Karma configs
- **CVE Regression Tests**: Each CVE fix includes specific test cases preventing regression

## Integration Points
- **Build Process**: Closure Compiler for minification (requires Java)
- **Documentation**: Dgeni-based doc generation from JSDoc comments
- **CI/CD**: CircleCI configuration for automated testing
- **Package Management**: Yarn (not npm) for dependency management

## Common Gotchas
- **File Order**: Dependency injection requires specific file loading order in angularFiles.js
- **Security Reviews**: Changes to compile.js require 2 core member reviews
- **Cross-browser**: IE-specific workarounds throughout codebase (see sniffer.js)
- **RegEx Performance**: Always test complex regex patterns for ReDoS vulnerabilities
