# Auth0 Setup Guide

This guide will walk you through setting up Auth0 for this application.

## Step 1: Create Auth0 Account

1. Go to [auth0.com](https://auth0.com)
2. Sign up for a free account
3. Create a new tenant (or use existing)

## Step 2: Create Application

1. In Auth0 Dashboard, go to **Applications** > **Applications**
2. Click **Create Application**
3. Name it "Next.js RBAC App"
4. Select **Regular Web Applications**
5. Click **Create**

## Step 3: Configure Application Settings

In your application settings page:

### Basic Information
- Copy your **Domain** (e.g., `dev-xxxxx.us.auth0.com`)
- Copy your **Client ID**
- Copy your **Client Secret**

### Application URIs
Add these URLs:

**Allowed Callback URLs:**
\`\`\`
http://localhost:3000/api/auth/callback
\`\`\`

**Allowed Logout URLs:**
\`\`\`
http://localhost:3000
\`\`\`

**Allowed Web Origins:**
\`\`\`
http://localhost:3000
\`\`\`

Click **Save Changes**

## Step 4: Enable Management API Access ⚠️ REQUIRED

**This step is critical for the user management features to work!**

1. Go to **Applications** > **APIs**
2. Click on **Auth0 Management API**
3. Go to **Machine to Machine Applications** tab
4. Find your application in the list
5. Toggle the switch to **Authorized** (it will turn green)
6. Click the dropdown arrow (▼) next to your application to expand permissions
7. Enable these scopes by checking the boxes:
   - ✅ `read:users` - Required to view users
   - ✅ `create:users` - Required to create new users
   - ✅ `update:users` - Required to edit users
   - ✅ `delete:users` - Required to delete users
8. Click **Update** at the bottom

**Without this step, you will get "access_denied" errors when trying to manage users.**

## Step 5: Configure Database Connection

1. Go to **Authentication** > **Database**
2. You should see "Username-Password-Authentication" (default)
3. Click on it to open settings
4. Go to **Applications** tab
5. Ensure your application is enabled
6. Go to **Password Policy** tab (optional)
7. Configure password requirements as needed

## Step 6: Update Environment Variables

Update your `.env.local` file with the values from Step 3:

\`\`\`env
AUTH0_SECRET=use-a-long-random-string-here
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=https://your-domain.auth0.com
AUTH0_CLIENT_ID=your-client-id-here
AUTH0_CLIENT_SECRET=your-client-secret-here
\`\`\`

To generate `AUTH0_SECRET`, run:
\`\`\`bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
\`\`\`

## Step 7: Test the Integration

1. Start your development server:
   \`\`\`bash
   npm run dev
   \`\`\`

2. Open http://localhost:3000

3. Try creating a user through the Users page

4. Verify the user appears in Auth0 Dashboard > User Management > Users

## Common Issues

### Issue: "Access denied" or "Client is not authorized to access Management API"
**Solution**: This is the most common issue! You need to complete **Step 4** above:
- Go to Applications > APIs > Auth0 Management API
- Go to Machine to Machine Applications tab
- Authorize your application and enable the required scopes (read:users, create:users, update:users, delete:users)
- Click Update

### Issue: "Callback URL mismatch"
**Solution**: Ensure `http://localhost:3000/api/auth/callback` is in Allowed Callback URLs

### Issue: "Invalid connection"
**Solution**: Verify your database connection name matches the one in `lib/auth0-management.ts` (default is "Username-Password-Authentication")

### Issue: Password doesn't meet requirements
**Solution**: Ensure password has:
- At least 8 characters
- One uppercase letter
- One lowercase letter
- One number

## Production Deployment

When deploying to production:

1. Update environment variables in your hosting platform
2. Update `AUTH0_BASE_URL` to your production domain
3. Add production URLs to Auth0 application settings:
   - Allowed Callback URLs: `https://yourdomain.com/api/auth/callback`
   - Allowed Logout URLs: `https://yourdomain.com`
   - Allowed Web Origins: `https://yourdomain.com`
4. Ensure Management API access is still enabled for production

## Next Steps

- Customize roles and permissions in `lib/rbac/permissions.ts`
- Add more user fields in `lib/auth0-management.ts`
- Implement email verification flows
- Add password reset functionality
- Configure social login providers (Google, GitHub, etc.)
\`\`\`

```tsx file="" isHidden
