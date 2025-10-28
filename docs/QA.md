# Waternity QA Guide

## Overview
This guide provides step-by-step testing procedures for the Waternity platform, designed for QA testing and demo day preparation.

## Prerequisites
- Server running at `http://localhost:3000` (or your target environment)
- `curl` command available
- `jq` for JSON formatting (optional but recommended)

## Quick Start

### Automated Testing
```bash
# Run the complete smoke test suite
./scripts/smoke.sh

# Run with verbose output
./scripts/smoke.sh -v

# Run against different environment
BASE_URL=https://staging.waternity.com ./scripts/smoke.sh
```

## Manual Testing Procedures

### 1. Health Check
**Purpose:** Verify system is operational

```bash
# Basic health check
curl -X GET "http://localhost:3000/api/health"

# Expected: HTTP 200
# Response:
{
  "ok": true,
  "hedera": {
    "env": true,
    "network": true,
    "sdkReady": true
  },
  "db": {
    "connected": true
  }
}
```

### 2. CSRF Protection Testing

#### 2.1 Get CSRF Token
```bash
# Fetch CSRF token
curl -X GET "http://localhost:3000/api/auth/csrf" \
  -c cookies.txt

# Expected: HTTP 200
# Response:
{
  "csrfToken": "abc123def456..."
}
```

#### 2.2 Test CSRF Protection
```bash
# Extract CSRF token (save this value)
CSRF_TOKEN=$(curl -s "http://localhost:3000/api/auth/csrf" | jq -r '.csrfToken')

# Test protected endpoint without CSRF token (should fail)
curl -X POST "http://localhost:3000/api/hcs/events" \
  -H "Content-Type: application/json" \
  -d '{"type": "TEST", "wellId": "test-001", "payload": {}}'

# Expected: HTTP 403
# Response:
{
  "error": "csrf",
  "message": "CSRF token validation failed"
}

# Test with valid CSRF token (should pass CSRF but fail auth)
curl -X POST "http://localhost:3000/api/hcs/events" \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  -b cookies.txt \
  -d '{"type": "TEST", "wellId": "test-001", "payload": {}}'

# Expected: HTTP 401 (CSRF passed, authentication required)
```

### 3. Authentication Testing

#### 3.1 Login Attempt
```bash
# Test login endpoint
curl -X POST "http://localhost:3000/api/auth/login" \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  -b cookies.txt \
  -d '{
    "email": "test@example.com",
    "password": "testpassword"
  }'

# Expected: HTTP 401 (invalid credentials) or HTTP 200 (valid credentials)
```

#### 3.2 Protected Endpoint Access
```bash
# Test accessing protected endpoint without authentication
curl -X GET "http://localhost:3000/api/auth/me"

# Expected: HTTP 401
# Response:
{
  "error": "unauthorized",
  "message": "Authentication required"
}
```

### 4. HCS Events Testing

#### 4.1 Publish Event
```bash
# Publish HCS event (requires authentication)
curl -X POST "http://localhost:3000/api/hcs/events" \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  -H "X-Idempotency-Key: test-$(date +%s)" \
  -b cookies.txt \
  -d '{
    "type": "WATER_QUALITY_TEST",
    "wellId": "test-well-001",
    "payload": {
      "ph": 7.2,
      "turbidity": 1.5,
      "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'"
    }
  }'

# Expected: HTTP 401 (no auth) or HTTP 200 (authenticated)
# Success Response:
{
  "success": true,
  "data": {
    "messageId": "0.0.123456-1234567890-123",
    "transactionId": "0.0.123456@1234567890.123456789"
  }
}
```

#### 4.2 Test Idempotency
```bash
# Use same idempotency key twice
IDEMPOTENCY_KEY="test-idempotency-$(date +%s)"

# First request
curl -X POST "http://localhost:3000/api/hcs/events" \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  -H "X-Idempotency-Key: $IDEMPOTENCY_KEY" \
  -b cookies.txt \
  -d '{"type": "TEST", "wellId": "test-001", "payload": {}}'

# Second request (should return same result)
curl -X POST "http://localhost:3000/api/hcs/events" \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  -H "X-Idempotency-Key: $IDEMPOTENCY_KEY" \
  -b cookies.txt \
  -d '{"type": "TEST", "wellId": "test-001", "payload": {}}'

# Expected: Both requests should return identical responses
```

### 5. Settlement Workflow Testing

#### 5.1 Settlement Request
```bash
# Create settlement request
curl -X POST "http://localhost:3000/api/settlements/request" \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  -b cookies.txt \
  -d '{
    "wellId": "test-well-001",
    "periodStart": "2024-01-01",
    "periodEnd": "2024-01-31",
    "kwhTotal": 1500.5,
    "grossRevenue": 750.25
  }'

# Expected: HTTP 401 (no auth) or HTTP 200 (authenticated)
```

#### 5.2 Settlement Approval
```bash
# Approve settlement (requires OPERATOR/AGENT/ADMIN role)
curl -X POST "http://localhost:3000/api/settlements/approve" \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  -b cookies.txt \
  -d '{
    "settlementId": "settlement-id-from-previous-step"
  }'

# Expected: HTTP 401 (no auth) or HTTP 403 (insufficient role)
```

#### 5.3 Settlement Execution
```bash
# Execute settlement (requires OPERATOR/ADMIN role)
curl -X POST "http://localhost:3000/api/settlements/execute" \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  -b cookies.txt \
  -d '{
    "settlementId": "settlement-id-from-previous-step"
  }'

# Expected: HTTP 401 (no auth) or HTTP 403 (insufficient role)
```

### 6. Rate Limiting Testing

#### 6.1 Test Rate Limits
```bash
# Test rate limiting on system/pull-topic endpoint
# This endpoint has a limit of 10 requests per minute per user

for i in {1..15}; do
  echo "Request $i:"
  curl -X POST "http://localhost:3000/api/system/pull-topic" \
    -H "Content-Type: application/json" \
    -H "X-CSRF-Token: $CSRF_TOKEN" \
    -b cookies.txt \
    -d '{"wellId": "test-well-001"}' \
    -w "HTTP Status: %{http_code}\n" \
    -o /dev/null -s
  sleep 0.1
done

# Expected: First ~10 requests return 401/403, then 429 (rate limited)
# Response for 429:
{
  "error": "Rate limit exceeded",
  "retryAfter": 60
}
```

### 7. Wells API Testing

#### 7.1 List Wells (Public Read)
```bash
# Get wells list (no authentication required for GET)
curl -X GET "http://localhost:3000/api/wells"

# Expected: HTTP 200
# Response:
{
  "wells": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

#### 7.2 Create Well (Protected)
```bash
# Create new well (requires authentication)
curl -X POST "http://localhost:3000/api/wells" \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  -b cookies.txt \
  -d '{
    "name": "Test Well",
    "location": "Test Location",
    "coordinates": {
      "lat": -1.2921,
      "lng": 36.8219
    }
  }'

# Expected: HTTP 401 (no auth) or HTTP 200 (authenticated)
```

### 8. Document Anchoring Testing

```bash
# Anchor document hash to Hedera
curl -X POST "http://localhost:3000/api/documents/anchor" \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  -b cookies.txt \
  -d '{
    "type": "WATER_QUALITY_REPORT",
    "cid": "QmTestCID123456789",
    "wellId": "test-well-001",
    "metadata": {
      "title": "Water Quality Report",
      "date": "'$(date -u +%Y-%m-%d)'"
    }
  }'

# Expected: HTTP 401 (no auth) or HTTP 200 (authenticated)
```

## Demo Day Checklist

### Pre-Demo Setup
- [ ] Server is running and accessible
- [ ] Database is connected and populated with test data
- [ ] Hedera testnet credentials are configured
- [ ] All environment variables are set
- [ ] Run smoke tests to verify system health

### Demo Flow Verification

#### 1. System Health Check
- [ ] Health endpoint returns `ok: true`
- [ ] Hedera connection is established
- [ ] Database connectivity confirmed

#### 2. Security Features
- [ ] CSRF protection is working
- [ ] Authentication is required for protected endpoints
- [ ] Rate limiting is functional
- [ ] Proper error responses are returned

#### 3. Core Functionality
- [ ] HCS events can be published
- [ ] Idempotency is working correctly
- [ ] Settlement workflow endpoints are accessible
- [ ] Document anchoring is functional

#### 4. API Documentation
- [ ] OpenAPI documentation is accessible at `/api/docs`
- [ ] All endpoints are documented
- [ ] Response schemas are accurate

### Performance Benchmarks
- [ ] Health check responds in < 500ms
- [ ] CSRF token generation < 100ms
- [ ] Rate limiting triggers at expected thresholds
- [ ] Error responses are consistent and informative

### Troubleshooting

#### Common Issues

**Server Not Responding**
```bash
# Check if server is running
curl -I http://localhost:3000/api/health

# Check server logs
npm run dev
```

**CSRF Token Issues**
```bash
# Clear cookies and get fresh token
rm cookies.txt
curl -X GET "http://localhost:3000/api/auth/csrf" -c cookies.txt
```

**Rate Limiting Not Working**
```bash
# Check rate limit configuration in environment
echo $RATE_LIMIT_MAX_REQUESTS
echo $RATE_LIMIT_WINDOW_MS
```

**Database Connection Issues**
```bash
# Check database health
curl "http://localhost:3000/api/health" | jq '.db'
```

### Environment-Specific Testing

#### Local Development
```bash
BASE_URL=http://localhost:3000 ./scripts/smoke.sh
```

#### Staging Environment
```bash
BASE_URL=https://staging.waternity.com ./scripts/smoke.sh
```

#### Production Environment
```bash
BASE_URL=https://waternity.com ./scripts/smoke.sh
```

## Expected Response Codes

| Endpoint | Method | No Auth | Invalid Auth | Valid Auth | Rate Limited |
|----------|--------|---------|--------------|------------|--------------|
| `/api/health` | GET | 200 | 200 | 200 | 200 |
| `/api/auth/csrf` | GET | 200 | 200 | 200 | 200 |
| `/api/auth/login` | POST | 403* | 401 | 200 | 429 |
| `/api/hcs/events` | POST | 401 | 401 | 200 | 429 |
| `/api/settlements/request` | POST | 401 | 401 | 200 | 429 |
| `/api/settlements/approve` | POST | 401 | 401 | 200/403** | 429 |
| `/api/settlements/execute` | POST | 401 | 401 | 200/403** | 429 |
| `/api/system/pull-topic` | POST | 401 | 401 | 200/403** | 429 |
| `/api/wells` | GET | 200 | 200 | 200 | 200 |
| `/api/wells` | POST | 401 | 401 | 200 | 429 |

*403 if CSRF token missing  
**403 if insufficient role permissions

## Success Criteria

### Functional Requirements
- ✅ All endpoints respond with expected HTTP status codes
- ✅ CSRF protection prevents unauthorized mutations
- ✅ Authentication is properly enforced
- ✅ Rate limiting prevents abuse
- ✅ Idempotency prevents duplicate operations

### Performance Requirements
- ✅ Health check responds within 500ms
- ✅ CSRF token generation within 100ms
- ✅ Rate limits trigger at configured thresholds

### Security Requirements
- ✅ No sensitive data in error responses
- ✅ Proper CORS headers
- ✅ Secure cookie settings
- ✅ Input validation on all endpoints

---

**Note:** This QA guide is designed for the Hedera Hack Africa hackathon. All tests can be run locally or against deployed environments. For automated testing, use the `./scripts/smoke.sh` script.