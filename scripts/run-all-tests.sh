#!/bin/bash

# Nero AA Wallet - Comprehensive Test Suite Runner
# This script runs all test categories to ensure security and quality

set -e  # Exit on any error

echo "🔬 Starting Nero AA Wallet Comprehensive Test Suite"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to run test with status reporting
run_test_suite() {
    local test_name="$1"
    local test_command="$2"
    local description="$3"
    
    print_status "Running $test_name..."
    echo "Description: $description"
    echo "Command: $test_command"
    echo "----------------------------------------"
    
    if eval "$test_command"; then
        print_success "$test_name completed successfully"
    else
        print_error "$test_name failed"
        exit 1
    fi
    
    echo ""
}

# Check if dependencies are installed
print_status "Checking dependencies..."

if ! command -v yarn &> /dev/null; then
    print_error "Yarn is not installed. Please install yarn first."
    exit 1
fi

if [ ! -d "node_modules" ]; then
    print_warning "Node modules not found. Installing dependencies..."
    yarn install
fi

print_success "Dependencies are ready"
echo ""

# Run different test categories
echo "🧪 Test Categories:"
echo "1. Security Tests - Validates security measures and prevents vulnerabilities"
echo "2. Unit Tests - Tests individual components and functions"
echo "3. Integration Tests - Tests complete workflows end-to-end"
echo "4. Stress Tests - Tests performance under load"
echo "5. Coverage Report - Generates code coverage metrics"
echo ""

# 1. Security Tests
run_test_suite \
    "Security Tests" \
    "yarn test:security" \
    "Validates account isolation, XSS prevention, and security measures"

# 2. Unit Tests (All tests)
run_test_suite \
    "Unit Tests" \
    "yarn test:run" \
    "Tests all individual components and functions"

# 3. Integration Tests
run_test_suite \
    "Integration Tests" \
    "yarn test:integration" \
    "Tests complete multi-account and consolidation workflows"

# 4. Stress Tests
run_test_suite \
    "Stress Tests" \
    "yarn test:stress" \
    "Tests performance with large numbers of accounts and rapid operations"

# 5. Coverage Report
print_status "Generating coverage report..."
if yarn test:coverage; then
    print_success "Coverage report generated"
    echo "📊 Coverage report available in coverage/ directory"
else
    print_warning "Coverage report generation failed (non-critical)"
fi

echo ""
echo "🎉 All tests completed successfully!"
echo "=================================================="

# Summary
print_status "Test Summary:"
echo "✅ Security validation passed"
echo "✅ Unit tests passed"
echo "✅ Integration tests passed"
echo "✅ Stress tests passed"
echo "✅ System is ready for production"

echo ""
echo "📋 Next Steps:"
echo "1. Review coverage report in coverage/index.html"
echo "2. Check test output for any warnings"
echo "3. Consider running tests in different environments"
echo "4. Set up CI/CD pipeline with these tests"

echo ""
print_success "Nero AA Wallet test suite completed successfully! 🚀" 