# Next.js Auth0 RBAC Application

A comprehensive user management system built with Next.js, Auth0, and role-based access control (RBAC).

## Features

- **Auth0 Authentication**: Secure authentication using Auth0
- **Role-Based Access Control**: Six role types with granular permissions
  - Admin (full access)
  - Sales Senior (read/write sales data)
  - Sales Junior (read-only sales data)
  - Marketing Senior (read/write marketing data)
  - Marketing Junior (read-only marketing data)
  - Client (limited access)
- **User Management**: Full CRUD operations for managing users
- **Role-Based Dashboards**: Personalized views based on user roles
- **Real Auth0 Integration**: Creates, updates, and deletes users directly in Auth0

## Prerequisites

- Node.js 18+ installed
- An Auth0 account (free tier works)
- Auth0 application configured

## Auth0 Setup

⚠️ **IMPORTANT**: You must complete Step 4 (Enable Management API) for the application to work properly.

### 1. Create Auth0 Application

1. Go to [Auth0 Dashboard](https://manage.auth0.com/)
2. Create a new "Regular Web Application"
3. Note your Domain, Client ID, and Client Secret

### 2. Configure Auth0 Application Settings

In your Auth0 application settings:

- **Allowed Callback URLs**: `http://localhost:3000/api/auth/callback`
- **Allowed Logout URLs**: `http://localhost:3000`
- **Allowed Web Origins**: `http://localhost:3000`

### 3. Enable Database Connection

1. Go to **Authentication** > **Database** in Auth0 Dashboard
2. Ensure you have a database connection (default is "Username-Password-Authentication")
3. Make sure your application is enabled for this connection

### 4. Enable Management API ⚠️ **REQUIRED**

**This step is critical - the application will not work without it.**

1. Go to **Applications** > **APIs** in Auth0 Dashboard
2. Click on **Auth0 Management API**
3. Go to the **Machine to Machine Applications** tab
4. Find your application in the list
5. Toggle the switch to **Authorized**
6. Click the dropdown arrow to expand permissions
7. Enable these scopes:
   - ✅ `read:users`
   - ✅ `create:users`
   - ✅ `update:users`
   - ✅ `delete:users`
   - ✅ `read:user_idp_tokens`
8. Click **Update**

**If you skip this step**, you will see an error: "Client is not authorized to access the Management API"

### 5. Configure Environment Variables

The `.env.local` file is already configured with your credentials:

\`\`\`env
AUTH0_SECRET=your-secret-here
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=https://your-domain.auth0.com
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret
\`\`\`

## Installation

\`\`\`bash
# Install dependencies
npm install

# Run development server
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Creating Users

1. Navigate to the **Users** page (requires admin permissions)
2. Click **Create User**
3. Fill in the form:
   - **Name**: User's full name
   - **Email**: User's email address
   - **Password**: Initial password (minimum 8 characters)
   - **Role**: Select from available roles
   - **Status**: Active or Inactive
4. Click **Create**

The user will be created in Auth0 with the role stored in `app_metadata`.

### Managing Users

- **Edit**: Click the edit icon to update user information
- **Delete**: Click the delete icon to remove a user from Auth0
- **Search**: Use the search bar to filter users by name or email

### Role Permissions

Each role has specific permissions defined in `lib/rbac/permissions.ts`:

- **Admin**: All permissions
- **Sales Senior**: `users:read`, `users:create`, `users:update`, `dashboard:view_sales`, `reports:generate`
- **Sales Junior**: `users:read`, `dashboard:view_sales`
- **Marketing Senior**: `users:read`, `users:create`, `users:update`, `dashboard:view_marketing`, `reports:generate`
- **Marketing Junior**: `users:read`, `dashboard:view_marketing`
- **Client**: `dashboard:view_own`

## Project Structure

\`\`\`
├── app/
│   ├── api/
│   │   ├── auth/[auth0]/     # Auth0 authentication routes
│   │   └── users/             # User management API
│   ├── dashboard/             # Role-based dashboard
│   ├── users/                 # User management UI
│   └── profile/               # User profile page
├── components/
│   ├── auth0/                 # Auth0 setup components
│   ├── rbac/                  # RBAC components (PermissionGate, RoleGate)
│   ├── users/                 # User management components
│   └── dashboard/             # Dashboard components
├── lib/
│   ├── auth0-management.ts    # Auth0 Management API client
│   ├── rbac/                  # RBAC permissions and guards
│   ├── services/              # API service layer
│   └── mock-auth/             # Mock auth for preview (development only)
└── hooks/
    └── use-users.ts           # TanStack Query hooks for user operations
\`\`\`

## Important Notes

### Mock Auth vs Real Auth0

- **Development (v0 preview)**: Uses mock authentication for preview purposes
- **Production**: Uses real Auth0 authentication

To switch from mock to real Auth0:

1. Replace imports in `app/layout.tsx`:
   \`\`\`tsx
   // Change from:
   import { MockAuthProvider } from "@/lib/mock-auth/mock-auth-provider"
   
   // To:
   import { UserProvider } from "@auth0/nextjs-auth0/client"
   \`\`\`

2. Update API routes to use real Auth0 session:
   \`\`\`tsx
   // Change from:
   import { getSession } from "@/lib/mock-auth/mock-session"
   
   // To:
   import { getSession } from "@auth0/nextjs-auth0"
   \`\`\`

### Database Connection Name

The default database connection name is `"Username-Password-Authentication"`. If your Auth0 database connection has a different name, update it in `lib/auth0-management.ts`:

\`\`\`tsx
connection: "Your-Connection-Name"
\`\`\`

### User Metadata

User roles and status are stored in Auth0's `app_metadata`:

\`\`\`json
{
  "app_metadata": {
    "role": "admin",
    "status": "active"
  }
}
\`\`\`

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the repository in Vercel
3. Add environment variables in Vercel project settings
4. Update `AUTH0_BASE_URL` to your production URL
5. Update Auth0 application settings with production URLs

## Troubleshooting

### "Access denied" or "Client is not authorized" errors

**This is the most common issue.** It means you haven't completed Step 4 of the Auth0 setup.

**Solution:**
1. Go to Auth0 Dashboard → Applications → APIs
2. Click "Auth0 Management API"
3. Go to "Machine to Machine Applications" tab
4. Find your application and toggle it to "Authorized"
5. Enable the required permissions: `read:users`, `create:users`, `update:users`, `delete:users`
6. Click "Update"

The application will display a helpful banner with these instructions if this error occurs.

### "Unauthorized" errors

- Ensure your Auth0 application has Management API permissions
- Check that environment variables are correctly set
- Verify the database connection name matches your Auth0 setup

### Users not appearing

- Check Auth0 Dashboard > User Management to verify users were created
- Ensure the Management API client has proper permissions
- Check browser console for API errors

### Password requirements

Auth0 requires passwords to meet certain criteria:
- Minimum 8 characters
- At least one lowercase letter
- At least one uppercase letter
- At least one number

## Additional Resources

- [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Detailed step-by-step setup instructions
- [Auth0 Documentation](https://auth0.com/docs)
- [Auth0 Management API](https://auth0.com/docs/api/management/v2)

## License

MIT
