# 🔧 Auth0 Authentication Troubleshooting Guide

## 🚨 "This site can't be reached" Error

If you're seeing "This site can't be reached" when trying to access the login page, this is typically a **browser-side issue**, not a server problem.

### ✅ **Quick Verification**

1. **Test the login route directly:**
   ```bash
   curl -I http://localhost:3000/auth/login
   ```
   Should return: `HTTP/1.1 307 Temporary Redirect`

2. **Test Auth0 domain accessibility:**
   ```bash
   curl -I https://dev-fg65k1u7uepw2hma.us.auth0.com
   ```
   Should return: `HTTP/2 200` or `HTTP/2 302`

### 🔍 **Root Cause Analysis**

The error occurs when:
1. **Browser tries to follow redirect** to Auth0
2. **Network connectivity issues** prevent reaching Auth0
3. **DNS resolution problems** with Auth0 domain
4. **Browser security settings** blocking the redirect
5. **Firewall/proxy blocking** the Auth0 domain

### 🛠️ **Comprehensive Solutions**

#### **Solution 1: Browser Troubleshooting**
```bash
# Clear browser cache and cookies
# Try different browsers:
- Chrome (recommended)
- Firefox
- Safari
- Edge

# Test in incognito/private mode
# Disable browser extensions temporarily
```

#### **Solution 2: Network Troubleshooting**
```bash
# Check internet connectivity
ping google.com

# Test DNS resolution
nslookup dev-fg65k1u7uepw2hma.us.auth0.com

# Test Auth0 domain directly
curl -v https://dev-fg65k1u7uepw2hma.us.auth0.com
```

#### **Solution 3: Environment Configuration**
```bash
# Check if environment variables are set
curl http://localhost:3000/auth/debug

# Verify Auth0 configuration
echo $AUTH0_ISSUER_BASE_URL
echo $AUTH0_CLIENT_ID
echo $AUTH0_BASE_URL
```

#### **Solution 4: Alternative Access Methods**

1. **Direct Auth0 Access:**
   - Visit: `https://dev-fg65k1u7uepw2hma.us.auth0.com`
   - If this works, the issue is with the redirect

2. **Manual Login URL:**
   ```
   https://dev-fg65k1u7uepw2hma.us.auth0.com/authorize?response_type=code&client_id=hMTvpVvI1QDqutJu5OUzHORu6x8zNVny&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fauth%2Fcallback&scope=openid+profile+email&state=random-state
   ```

3. **Use Diagnostic Tool:**
   - Visit: `http://localhost:3000/auth/diagnostic`
   - Run comprehensive diagnostics

### 🔧 **Advanced Troubleshooting**

#### **Check Server Logs**
```bash
# Look for errors in the terminal where you ran `npm run dev`
# Check for any Auth0-related errors
```

#### **Verify Auth0 Configuration**
1. **Auth0 Dashboard Settings:**
   - Application Login URI: `http://localhost:3000/auth/login` (or leave empty)
   - Allowed Callback URLs: `http://localhost:3000/auth/callback`
   - Allowed Logout URLs: `http://localhost:3000`
   - Allowed Web Origins: `http://localhost:3000`

2. **Environment Variables:**
   ```env
   AUTH0_SECRET=your-secret-key-here
   AUTH0_BASE_URL=http://localhost:3000
   AUTH0_ISSUER_BASE_URL=https://dev-fg65k1u7uepw2hma.us.auth0.com
   AUTH0_CLIENT_ID=hMTvpVvI1QDqutJu5OUzHORu6x8zNVny
   AUTH0_CLIENT_SECRET=your-client-secret-here
   ```

#### **Network-Specific Issues**
```bash
# If behind corporate firewall:
# - Check if Auth0 domains are whitelisted
# - Try from different network (mobile hotspot)
# - Contact IT department about Auth0 access

# If using VPN:
# - Try disconnecting VPN
# - Try different VPN server location
```

### 🚀 **Quick Fixes**

#### **Fix 1: Restart Everything**
```bash
# Stop the development server (Ctrl+C)
# Clear Next.js cache
rm -rf .next
# Restart
npm run dev
```

#### **Fix 2: Use Different Port**
```bash
# Try running on different port
PORT=3001 npm run dev
# Then visit: http://localhost:3001/auth/login
```

#### **Fix 3: Check Browser Console**
1. Open browser Developer Tools (F12)
2. Go to Console tab
3. Look for any JavaScript errors
4. Check Network tab for failed requests

### 📊 **Diagnostic Commands**

```bash
# Test all authentication routes
curl -I http://localhost:3000/
curl -I http://localhost:3000/auth/login
curl -I http://localhost:3000/auth/callback
curl -I http://localhost:3000/auth/profile

# Test Auth0 connectivity
curl -I https://dev-fg65k1u7uepw2hma.us.auth0.com
curl -I https://dev-fg65k1u7uepw2hma.us.auth0.com/.well-known/openid_configuration

# Check environment
curl http://localhost:3000/auth/debug
```

### 🆘 **Still Having Issues?**

1. **Run the diagnostic tool:** `http://localhost:3000/auth/diagnostic`
2. **Check the server logs** for any error messages
3. **Try a different device/network** to isolate the issue
4. **Verify Auth0 dashboard configuration** matches your environment variables

### ✅ **Expected Behavior**

When everything is working correctly:
1. Visit `http://localhost:3000` → Redirects to `/dashboard`
2. Visit `/dashboard` → Redirects to `/auth/login` (if not authenticated)
3. Visit `/auth/login` → Redirects to Auth0 login page
4. After Auth0 login → Redirects back to `/dashboard`

The "This site can't be reached" error typically means step 3 is failing due to browser/network issues, not server issues.
