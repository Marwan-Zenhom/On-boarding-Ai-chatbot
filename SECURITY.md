# 🔐 Security Implementation

This document outlines the security measures implemented in the On-boarding AI Chatbot application.

---

## ✅ Phase 3: Critical Security Fixes Implemented

### 1. Input Validation & Sanitization

**File**: `backend/middleware/validationMiddleware.js`

All user inputs are validated and sanitized to prevent attacks:

#### Message Validation
- ✅ **Length limits**: 1-5000 characters
- ✅ **Type checking**: Must be string
- ✅ **XSS prevention**: Removes script tags
- ✅ **SQL injection prevention**: Blocks SQL keywords
- ✅ **Whitespace handling**: Trims and validates

#### Email Validation
- ✅ **Format validation**: Regex pattern matching
- ✅ **Normalization**: Converts to lowercase
- ✅ **Type checking**: Must be string

#### Password Validation
- ✅ **Minimum length**: 6 characters
- ✅ **Maximum length**: 100 characters
- ✅ **Type checking**: Must be string

### 2. Rate Limiting

**File**: `backend/server.js`

Protection against brute force and DDoS attacks:

#### General API Rate Limit
```javascript
- Window: 15 minutes
- Max requests: 100 per IP
- Applies to: All /api/* endpoints
```

#### Authentication Rate Limit (Stricter)
```javascript
- Window: 15 minutes  
- Max requests: 10 per IP
- Applies to: /api/auth/* endpoints
- Skip successful requests: Yes
```

### 3. Security Headers

**Implemented via Helmet.js**

#### Content Security Policy (CSP)
- `default-src`: 'self' only
- `style-src`: 'self' + inline styles
- `script-src`: 'self' only
- `img-src`: 'self' + data URLs + HTTPS

#### HTTP Strict Transport Security (HSTS)
- Max age: 1 year
- Include subdomains: Yes
- Preload: Yes

#### Cross-Origin Resource Policy
- Policy: cross-origin (for API access)

### 4. CORS Configuration

**Allowed Origins**:
- Production frontend URL (from env)
- localhost:3000
- localhost:3001
- localhost:3002

**Allowed Methods**:
- GET, POST, PUT, DELETE, OPTIONS

**Allowed Headers**:
- Content-Type
- Authorization

**Credentials**: Enabled

### 5. Request Body Limits

- JSON payload: **1MB maximum** (reduced from 10MB)
- URL-encoded: **1MB maximum**
- Prevents memory exhaustion attacks

---

## 🛡️ Authentication Security

### JWT Token Management

**Token Generation**:
- Algorithm: HS256
- Expiration: 7 days
- Payload includes: userId, email, role

**Token Verification**:
- Middleware: `authenticateUser`
- Location: Authorization header (Bearer token)
- Invalid/expired tokens: Rejected with 401/403

### Password Security

**Hashing**:
- Algorithm: bcrypt
- Salt rounds: 10
- Never stored in plain text

**OAuth Security**:
- Provider: Supabase Auth
- Supported: Google OAuth 2.0
- Session management: Supabase handles it

### Row Level Security (RLS)

**Database-level isolation**:
- Users can only access their own data
- Enforced at PostgreSQL level
- Cannot be bypassed via API

---

## 🚨 Attack Prevention

### 1. Cross-Site Scripting (XSS)
✅ **Prevented by**:
- Input sanitization (removes `<script>` tags)
- CSP headers block inline scripts
- React escapes output by default

### 2. SQL Injection
✅ **Prevented by**:
- Supabase uses parameterized queries
- Validation blocks SQL keywords
- No raw SQL construction from user input

### 3. Brute Force Attacks
✅ **Prevented by**:
- Auth endpoint rate limiting (10 req/15min)
- Account lockout on Supabase side
- Failed login tracking

### 4. Denial of Service (DoS)
✅ **Prevented by**:
- Global rate limiting (100 req/15min)
- Request body size limits (1MB)
- Connection timeouts

### 5. Cross-Site Request Forgery (CSRF)
✅ **Prevented by**:
- JWT tokens (not cookies)
- CORS restrictions
- Same-origin policy

---

## 🔑 Environment Variables Security

### Required Environment Variables

**Backend** (`backend/.env`):
```env
# Server
PORT=8000
NODE_ENV=production

# Database (Supabase)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_JWT_SECRET=your_jwt_secret

# Frontend URL (for CORS)
FRONTEND_URL=https://your-frontend-domain.com

# External APIs
GEMINI_API_KEY=your_gemini_key
```

**Frontend** (`frontend/.env`):
```env
# Backend API
REACT_APP_API_URL=https://your-backend-domain.com

# Supabase (for Auth only)
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key
```

### ⚠️ Security Best Practices

1. **Never commit `.env` files**
   - Use `.env.example` as template
   - Add `.env` to `.gitignore`

2. **Rotate secrets regularly**
   - JWT secrets every 90 days
   - API keys on suspicious activity

3. **Use different keys per environment**
   - Development vs Production
   - Never use dev keys in production

4. **Restrict API keys**
   - Supabase: Enable RLS
   - Gemini: Set usage quotas
   - Google OAuth: Restrict to your domains

---

## 🔍 Security Monitoring

### Logging

**Morgan HTTP logging**:
- Format: Combined (Apache style)
- Includes: IP, method, URL, status, user-agent
- Location: Console (can be extended to files)

### Recommended Monitoring

1. **Failed login attempts**
   - Track in database
   - Alert on threshold breach

2. **Rate limit hits**
   - Log when limits are reached
   - Investigate repeated offenders

3. **Unusual activity**
   - Large payloads
   - Rapid conversation creation
   - Suspicious SQL patterns

---

## 🧪 Security Testing

### Manual Testing Checklist

- [ ] Try XSS payloads in messages
- [ ] Test rate limiting (spam requests)
- [ ] Verify JWT expiration works
- [ ] Test invalid tokens are rejected
- [ ] Confirm RLS blocks cross-user access
- [ ] Check large payload rejection
- [ ] Verify CORS blocks unauthorized origins

### Automated Testing (Future)

- [ ] Add security test suite
- [ ] Integrate OWASP ZAP
- [ ] Run penetration tests
- [ ] Dependency vulnerability scanning

---

## 📋 Security Audit Log

### Phase 3 Completed (Current)

| Date | Change | Status |
|------|--------|--------|
| 2025-01-23 | Input validation middleware | ✅ Done |
| 2025-01-23 | Rate limiting (general) | ✅ Done |
| 2025-01-23 | Rate limiting (auth) | ✅ Done |
| 2025-01-23 | Security headers (Helmet) | ✅ Done |
| 2025-01-23 | CORS configuration | ✅ Done |
| 2025-01-23 | Request body limits | ✅ Done |
| 2025-01-23 | Validation on all inputs | ✅ Done |

### Future Enhancements

| Priority | Enhancement | Status |
|----------|-------------|--------|
| High | Add request logging to database | ⏳ Planned |
| High | Implement account lockout | ⏳ Planned |
| Medium | Add security headers to frontend | ⏳ Planned |
| Medium | Implement CSP reporting | ⏳ Planned |
| Medium | Add dependency scanning | ⏳ Planned |
| Low | Two-factor authentication | ⏳ Planned |
| Low | Security audit trail UI | ⏳ Planned |

---

## 🆘 Security Incident Response

If you discover a security vulnerability:

1. **Do NOT** open a public issue
2. **Email** project maintainer (add email here)
3. **Include**:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

---

## 📚 References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Helmet.js Security](https://helmetjs.github.io/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Supabase Security](https://supabase.com/docs/guides/platform/security)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

---

**Last Updated**: January 23, 2025  
**Security Status**: ✅ Phase 3 Complete

