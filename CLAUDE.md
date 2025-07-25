# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the AngularJS repository - a JavaScript MV* framework for building client-side web applications. AngularJS reached end-of-life in January 2022 and this repository is primarily in maintenance mode for security fixes and CVE remediation.

## Development Commands

### Dependencies
- Node.js v12.14.1+ (check with `node --version`)
- Yarn 1.21.1+ (check with `yarn --version`)
- Grunt CLI 1.2.0+ (check with `grunt --version`)
- Java 7+ (required for Closure Tools minification)

### Setup
開發測試使用 docker 環境進行打包測試
```bash
docker build --platform linux/amd64 -t angularjs-dev .

```

```bash
docker run --platform linux/amd64 -it --rm -v $(pwd):/app angularjs-dev npx yarn install --frozen-lockfile.  # Install dependencies
```

### Build Commands
```bash
docker run --platform linux/amd64 -it --rm -v $(pwd):/app angularjs-dev npx yarn grunt package    # Build complete distribution (creates build/ directory)
docker run --platform linux/amd64 -it --rm -v $(pwd):/app angularjs-dev npx yarn grunt build      # Build core files without packaging
docker run --platform linux/amd64 -it --rm -v $(pwd):/app angularjs-dev npx yarn grunt compile    # Compile and minify files
```

### Testing
```bash
docker run --platform linux/amd64 -it --rm -v $(pwd):/app angularjs-dev npx yarn test             # Run all unit tests (uses Karma)
docker run --platform linux/amd64 -it --rm -v $(pwd):/app angularjs-dev npx yarn grunt autotest   # Run tests in watch mode
docker run --platform linux/amd64 -it --rm -v $(pwd):/app angularjs-dev npx yarn grunt test:unit  # Run specific unit tests

# Test specific modules
docker run --platform linux/amd64 -it --rm -v $(pwd):/app angularjs-dev npx yarn grunt test:jqlite          # Test jqLite only
docker run --platform linux/amd64 -it --rm -v $(pwd):/app angularjs-dev npx yarn grunt test:modules         # Test all modules
docker run --platform linux/amd64 -it --rm -v $(pwd):/app angularjs-dev npx yarn grunt test:docs            # Test documentation examples

```bash
docker run --platform linux/amd64 -it --rm -v $(pwd):/app angularjs-dev npx yarn test             # Run all unit tests (uses Karma)
docker run --platform linux/amd64 -it --rm -v $(pwd):/app angularjs-dev npx yarn grunt autotest   # Run tests in watch mode
docker run --platform linux/amd64 -it --rm -v $(pwd):/app angularjs-dev npx yarn grunt test:unit  # Run specific unit tests

# Test specific modules
docker run --platform linux/amd64 -it --rm -v $(pwd):/app angularjs-dev npx yarn grunt test:jqlite          # Test jqLite only
docker run --platform linux/amd64 -it --rm -v $(pwd):/app angularjs-dev npx yarn grunt test:modules         # Test all modules
docker run --platform linux/amd64 -it --rm -v $(pwd):/app angularjs-dev npx yarn grunt test:docs            # Test documentation examples

# Integration tests
docker run --platform linux/amd64 -it --rm -v $(pwd):/app angularjs-dev npx yarn grunt test:protractor      # Run e2e tests
docker run --platform linux/amd64 -it --rm -v $(pwd):/app angularjs-dev npx yarn grunt test:e2e             # Alternative e2e command
```

### Development Server
```bash
docker run --platform linux/amd64 -it --rm -v $(pwd):/app angularjs-dev npx yarn grunt webserver   # Start local development server (port 8000)
```

### Linting and Code Quality
```bash
docker run --platform linux/amd64 -it --rm -v $(pwd):/app angularjs-dev npx yarn grunt lint        # ESLint code validation
docker run --platform linux/amd64 -it --rm -v $(pwd):/app angularjs-dev npx yarn grunt ddescribe-iit  # Check for focused tests (ddescribe/iit)
```

### Documentation
```bash
docker run --platform linux/amd64 -it --rm -v $(pwd):/app angularjs-dev npx yarn grunt docs        # Generate documentation
docker run --platform linux/amd64 -it --rm -v $(pwd):/app angularjs-dev npx yarn grunt docs:serve  # Serve docs locally
```

## Architecture and Code Structure

### Core Architecture
AngularJS follows a modular architecture with these key components:

- **src/Angular.js** - Main Angular object and framework initialization
- **src/auto/injector.js** - Dependency injection system
- **src/ng/** - Core framework modules (directives, services, providers)
- **src/jqLite.js** - Lightweight jQuery-compatible DOM manipulation library

### Module Organization
- **src/ng/** - Core AngularJS module with essential services and directives
- **src/ngAnimate/** - Animation support module
- **src/ngAria/** - Accessibility features
- **src/ngCookies/** - Cookie management utilities
- **src/ngMessages/** - Form validation messaging
- **src/ngMock/** - Testing utilities and mocks
- **src/ngResource/** - RESTful resource abstraction
- **src/ngRoute/** - Client-side routing
- **src/ngSanitize/** - HTML sanitization
- **src/ngTouch/** - Touch/mobile gesture support

### Build System
- **Gruntfile.js** - Primary build configuration using Grunt
- **angularFiles.js** - Defines file lists and build dependencies
- **karma-*.conf.js** - Test runner configurations for different scenarios

### Key File Patterns
- Source files are in `src/` with module-specific subdirectories
- Tests are in `test/` mirroring the `src/` structure
- Built files go to `build/` directory  
- Locale files are auto-generated in `src/ngLocale/`

### Testing Strategy
- Unit tests use Jasmine with Karma runner
- Multiple Karma configurations for different test scenarios (jqLite vs jQuery, different jQuery versions)
- E2E tests use Protractor
- Mock utilities in ngMock module for dependency injection testing

### CVE and Security
- **CVE/** directory contains test cases and fixes for security vulnerabilities
- Regular expression patterns require careful review for ReDoS vulnerabilities
- HTML sanitization handled by ngSanitize module

### Development Notes
- Build output requires elevated permissions on Windows (symbolic links)
- Grunt is used as the primary task runner
- ESLint configuration enforces coding standards
- The framework uses custom build process combining multiple source files

## Common Workflows

When working with this codebase:

1. **Making Changes**: Edit source files in `src/`, never edit files in `build/`
2. **Testing Changes**: Run `yarn test` to verify unit tests pass
3. **Building**: Use `yarn grunt package` to create distribution files
4. **Security Fixes**: Add test cases to `CVE/` directory when addressing vulnerabilities
5. **Documentation**: Update `.ngdoc` files in `docs/content/` for API changes

## Important Constraints

- This project is in maintenance mode - focus on security fixes and critical bugs only
- Maintain backward compatibility for all changes
- Regular expressions must be carefully reviewed for ReDoS vulnerabilities
- All changes require comprehensive test coverage