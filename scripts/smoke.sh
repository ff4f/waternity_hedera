#!/bin/bash
# Waternity Smoke Test Script
# Quick black-box tests for critical API endpoints

set -e

# Configuration
BASE_URL="${BASE_URL:-http://localhost:3000}"
VERBOSE="${VERBOSE:-false}"
TIMEOUT="${TIMEOUT:-30}"
export HEDERA_MOCK_MODE="${HEDERA_MOCK_MODE:-true}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TESTS_TOTAL=0
TESTS_PASSED=0
TESTS_FAILED=0

# Utility functions
log() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[PASS]${NC} $1"
    TESTS_PASSED=$((TESTS_PASSED + 1))
}

error() {
    echo -e "${RED}[FAIL]${NC} $1"
    TESTS_FAILED=$((TESTS_FAILED + 1))
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

run_test() {
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    local test_name="$1"
    log "Running: $test_name"
}

# Check if server is running
check_server() {
    log "Checking if server is running at $BASE_URL"
    if curl -s --max-time $TIMEOUT "$BASE_URL/api/health" > /dev/null; then
        success "Server is running"
        return 0
    else
        error "Server is not running at $BASE_URL"
        exit 1
    fi
}

# Test 1: CSRF Token Fetch
test_csrf_fetch() {
    run_test "CSRF Token Fetch"
    
    local response=$(curl -s --max-time $TIMEOUT \
        -w "HTTPSTATUS:%{http_code}" \
        "$BASE_URL/api/auth/csrf")
    
    local http_code=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
    local body=$(echo "$response" | sed -E 's/HTTPSTATUS:[0-9]*$//')
    
    if [ "$http_code" = "200" ]; then
        local csrf_token=$(echo "$body" | grep -o '"csrfToken":"[^"]*"' | cut -d'"' -f4)
        if [ -n "$csrf_token" ]; then
            success "CSRF token fetched successfully (token: ${csrf_token:0:8}...)"
            echo "$csrf_token" > /tmp/waternity_csrf_token
            # Extract cookies
            curl -s --max-time $TIMEOUT \
                -c /tmp/waternity_cookies \
                "$BASE_URL/api/auth/csrf" > /dev/null
        else
            error "CSRF token not found in response"
        fi
    else
        error "CSRF fetch failed with HTTP $http_code"
        [ "$VERBOSE" = "true" ] && echo "Response: $body"
    fi
}

# Test 2: HCS Publish with Idempotency
test_hcs_idempotency() {
    run_test "HCS Publish with Idempotency"
    
    # Check if we have CSRF token
    if [ ! -f /tmp/waternity_csrf_token ]; then
        warn "No CSRF token available, skipping HCS test"
        return
    fi
    
    local csrf_token=$(cat /tmp/waternity_csrf_token)
    local idempotency_key="smoke-test-$(date +%s)"
    
    # Test data
    local test_data='{
        "type": "WATER_QUALITY_TEST",
        "wellId": "test-well-001",
        "payload": {
            "ph": 7.2,
            "turbidity": 1.5,
            "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'"
        }
    }'
    
    # First call
    log "Making first HCS publish call..."
    local response1=$(curl -s --max-time $TIMEOUT \
        -w "HTTPSTATUS:%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        -H "X-CSRF-Token: $csrf_token" \
        -H "X-Idempotency-Key: $idempotency_key" \
        -b /tmp/waternity_cookies \
        -d "$test_data" \
        "$BASE_URL/api/hcs/events")
    
    local http_code1=$(echo "$response1" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
    local body1=$(echo "$response1" | sed -E 's/HTTPSTATUS:[0-9]*$//')
    
    # Second call (should be idempotent)
    log "Making second HCS publish call (idempotency test)..."
    local response2=$(curl -s --max-time $TIMEOUT \
        -w "HTTPSTATUS:%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        -H "X-CSRF-Token: $csrf_token" \
        -H "X-Idempotency-Key: $idempotency_key" \
        -b /tmp/waternity_cookies \
        -d "$test_data" \
        "$BASE_URL/api/hcs/events")
    
    local http_code2=$(echo "$response2" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
    local body2=$(echo "$response2" | sed -E 's/HTTPSTATUS:[0-9]*$//')
    
    # Evaluate results
    if [ "$http_code1" = "401" ] && [ "$http_code2" = "401" ]; then
        success "HCS endpoint correctly requires authentication (401)"
    elif [ "$http_code1" = "200" ] && [ "$http_code2" = "200" ]; then
        # Check if responses are identical (idempotency)
        if [ "$body1" = "$body2" ]; then
            success "HCS idempotency working correctly"
        else
            warn "HCS responses differ - idempotency may not be working"
        fi
    elif [ "$http_code1" = "403" ] && [ "$http_code2" = "403" ]; then
        # Check if it's CSRF error or auth error
        if echo "$body1" | grep -q "CSRF token validation failed"; then
            error "CSRF validation failed - check token/cookie handling"
            [ "$VERBOSE" = "true" ] && echo "Response 1: $body1"
        else
            success "HCS endpoint correctly requires proper authentication (403)"
        fi
    else
        error "HCS test failed - HTTP codes: $http_code1, $http_code2"
        [ "$VERBOSE" = "true" ] && echo "Response 1: $body1" && echo "Response 2: $body2"
    fi
}

# Test 3: Settlement Workflow (Request/Approve/Execute)
test_settlement_workflow() {
    run_test "Settlement Workflow (Happy Path)"
    
    if [ ! -f /tmp/waternity_csrf_token ]; then
        warn "No CSRF token available, skipping settlement test"
        return
    fi
    
    local csrf_token=$(cat /tmp/waternity_csrf_token)
    
    # Test settlement request
    local settlement_data='{
        "wellId": "test-well-001",
        "periodStart": "2024-01-01",
        "periodEnd": "2024-01-31",
        "kwhTotal": 1500.5,
        "grossRevenue": 750.25
    }'
    
    log "Testing settlement request..."
    local request_response=$(curl -s --max-time $TIMEOUT \
        -w "HTTPSTATUS:%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        -H "X-CSRF-Token: $csrf_token" \
        -b /tmp/waternity_cookies \
        -d "$settlement_data" \
        "$BASE_URL/api/settlements/request")
    
    local request_code=$(echo "$request_response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
    local request_body=$(echo "$request_response" | sed -E 's/HTTPSTATUS:[0-9]*$//')
    
    # Test settlement approval
    log "Testing settlement approval..."
    local approve_response=$(curl -s --max-time $TIMEOUT \
        -w "HTTPSTATUS:%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        -H "X-CSRF-Token: $csrf_token" \
        -b /tmp/waternity_cookies \
        -d '{"settlementId": "test-settlement-001"}' \
        "$BASE_URL/api/settlements/approve")
    
    local approve_code=$(echo "$approve_response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
    
    # Test settlement execution
    log "Testing settlement execution..."
    local execute_response=$(curl -s --max-time $TIMEOUT \
        -w "HTTPSTATUS:%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        -H "X-CSRF-Token: $csrf_token" \
        -b /tmp/waternity_cookies \
        -d '{"settlementId": "test-settlement-001"}' \
        "$BASE_URL/api/settlements/execute")
    
    local execute_code=$(echo "$execute_response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
    
    # Evaluate workflow
    if [ "$request_code" = "401" ] && [ "$approve_code" = "401" ] && [ "$execute_code" = "401" ]; then
        success "Settlement workflow correctly requires authentication (401)"
    elif [ "$request_code" = "403" ] && [ "$approve_code" = "403" ] && [ "$execute_code" = "403" ]; then
        # Check if it's CSRF error or auth error
        if echo "$request_body" | grep -q "CSRF token validation failed"; then
            error "CSRF validation failed in settlement workflow"
            [ "$VERBOSE" = "true" ] && echo "Request: $request_body"
        else
            success "Settlement workflow correctly requires proper authentication (403)"
        fi
    elif [ "$request_code" = "400" ] || [ "$approve_code" = "400" ] || [ "$execute_code" = "400" ]; then
        success "Settlement workflow endpoints accessible (validation errors expected)"
    else
        error "Settlement workflow test failed - codes: $request_code, $approve_code, $execute_code"
        [ "$VERBOSE" = "true" ] && echo "Request: $request_body"
    fi
}

# Test 4: Rate Limit Test
test_rate_limit() {
    run_test "Rate Limit Test (health endpoint)"
    
    log "Making rapid requests to trigger rate limit..."
    
    local rate_limit_hit=false
    local attempts=0
    local max_attempts=20
    
    while [ $attempts -lt $max_attempts ]; do
        local response=$(curl -s --max-time 5 \
            -w "HTTPSTATUS:%{http_code}" \
            -X GET \
            "$BASE_URL/api/health")
        
        local http_code=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
        
        if [ "$http_code" = "429" ]; then
            success "Rate limit triggered after $((attempts + 1)) requests (HTTP 429)"
            rate_limit_hit=true
            break
        elif [ "$http_code" = "401" ]; then
            # Expected for unauthenticated requests
            log "Request $((attempts + 1)): HTTP $http_code (auth required)"
        else
            log "Request $((attempts + 1)): HTTP $http_code"
        fi
        
        ((attempts++))
        sleep 0.1  # Small delay between requests
    done
    
    if [ "$rate_limit_hit" = false ]; then
        warn "Rate limit not triggered after $max_attempts requests"
    fi
}

# Test 5: Basic API Health Check
test_health_check() {
    run_test "Health Check"
    
    local response=$(curl -s --max-time $TIMEOUT \
        -w "HTTPSTATUS:%{http_code}" \
        "$BASE_URL/api/health")
    
    local http_code=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
    local body=$(echo "$response" | sed -E 's/HTTPSTATUS:[0-9]*$//')
    
    if [ "$http_code" = "200" ]; then
        local ok_status=$(echo "$body" | grep -o '"ok":[^,}]*' | cut -d: -f2)
        if [ "$ok_status" = "true" ]; then
            success "Health check passed"
        else
            warn "Health check returned ok:false"
        fi
    else
        error "Health check failed with HTTP $http_code"
    fi
}

# Cleanup function
cleanup() {
    log "Cleaning up temporary files..."
    rm -f /tmp/waternity_csrf_token /tmp/waternity_cookies
}

# Main execution
main() {
    echo "🧪 Waternity Smoke Test Suite"
    echo "=============================="
    echo "Base URL: $BASE_URL"
    echo "Timeout: ${TIMEOUT}s"
    echo ""
    
    # Set up cleanup trap
    trap cleanup EXIT
    
    # Run tests
    check_server
    test_health_check
    test_csrf_fetch
    test_hcs_idempotency
    test_settlement_workflow
    test_rate_limit
    
    # Summary
    echo ""
    echo "📊 Test Summary"
    echo "==============="
    echo "Total tests: $TESTS_TOTAL"
    echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
    echo -e "Failed: ${RED}$TESTS_FAILED${NC}"
    
    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "\n${GREEN}✅ All tests passed!${NC}"
        exit 0
    else
        echo -e "\n${RED}❌ Some tests failed${NC}"
        exit 1
    fi
}

# Help function
show_help() {
    echo "Waternity Smoke Test Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  -v, --verbose  Enable verbose output"
    echo "  -u, --url URL  Set base URL (default: http://localhost:3000)"
    echo "  -t, --timeout  Set timeout in seconds (default: 30)"
    echo ""
    echo "Environment Variables:"
    echo "  BASE_URL       Base URL for the API (default: http://localhost:3000)"
    echo "  VERBOSE        Enable verbose output (true/false)"
    echo "  TIMEOUT        Request timeout in seconds"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Run with defaults"
    echo "  $0 -v                                 # Run with verbose output"
    echo "  $0 -u http://localhost:4000           # Run against different port"
    echo "  BASE_URL=http://staging.example.com $0  # Run against staging"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -u|--url)
            BASE_URL="$2"
            shift 2
            ;;
        -t|--timeout)
            TIMEOUT="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Run main function
main