# Comprehensive User Management API Documentation

## Overview

This document describes the comprehensive user management API built on top of Auth0 Management API. The API provides full CRUD operations, advanced filtering, bulk operations, statistics, and audit logging.

## Base URL
```
/api/users
```

## Authentication

All endpoints require authentication via Auth0 session. The API uses role-based access control (RBAC) to determine user permissions.

## Endpoints

### 1. Get Users (GET /api/users)

Retrieve a paginated list of users with advanced filtering and sorting.

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 10) - Number of users per page
- `search` (string) - Search by name or email
- `status` (string) - Filter by status (active, blocked)
- `role` (string) - Filter by role name
- `sortBy` (string, default: createdAt) - Sort field (name, email, createdAt, status)
- `sortOrder` (string, default: desc) - Sort order (asc, desc)
- `includeInactive` (boolean, default: false) - Include inactive users

**Example Request:**
```bash
GET /api/users?page=1&limit=10&search=john&status=active&sortBy=name&sortOrder=asc
```

**Response:**
```json
{
  "users": [
    {
      "id": "auth0|user123",
      "email": "john.doe@example.com",
      "name": "John Doe",
      "status": "active",
      "createdAt": "2024-01-15T10:00:00Z",
      "roles": [
        {
          "id": "rol_admin123",
          "name": "Admin",
          "description": "Full access",
          "assignment": "Direct"
        }
      ],
      "permissions": [
        {
          "id": "users:read",
          "name": "users:read",
          "description": "View user information",
          "assignment": "Direct"
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  },
  "stats": {
    "total": 25,
    "active": 20,
    "blocked": 5,
    "byRole": {
      "Admin": 3,
      "User": 17,
      "Manager": 5
    }
  }
}
```

### 2. Create User (POST /api/users)

Create a new user with optional role assignment.

**Request Body:**
```json
{
  "action": "create",
  "email": "newuser@example.com",
  "name": "New User",
  "password": "SecurePassword123!",
  "roles": ["rol_admin123", "rol_manager456"]
}
```

**Response:**
```json
{
  "user": {
    "id": "auth0|newuser123",
    "email": "newuser@example.com",
    "name": "New User",
    "status": "active",
    "createdAt": "2024-01-15T10:00:00Z",
    "roles": [...],
    "permissions": [...]
  }
}
```

### 3. Bulk Operations (POST /api/users)

#### Bulk Create Users
```json
{
  "action": "bulk-create",
  "users": [
    {
      "email": "user1@example.com",
      "name": "User One",
      "password": "Password123!",
      "roles": ["rol_user123"]
    },
    {
      "email": "user2@example.com",
      "name": "User Two",
      "password": "Password456!",
      "roles": ["rol_manager456"]
    }
  ]
}
```

#### Bulk Update Users
```json
{
  "action": "bulk-update",
  "userIds": ["auth0|user1", "auth0|user2"],
  "updates": {
    "blocked": false,
    "email_verified": true
  }
}
```

#### Bulk Delete Users
```json
{
  "action": "bulk-delete",
  "userIds": ["auth0|user1", "auth0|user2"]
}
```

#### Export Users
```json
{
  "action": "export",
  "format": "csv",
  "includeInactive": false
}
```

### 4. User Statistics (GET /api/users/stats)

Get comprehensive user statistics.

**Response:**
```json
{
  "stats": {
    "overview": {
      "total": 100,
      "active": 85,
      "blocked": 15,
      "emailVerified": 80,
      "emailUnverified": 20
    },
    "byRole": {
      "Admin": 5,
      "Manager": 15,
      "User": 80
    },
    "byStatus": {
      "active": 85,
      "blocked": 15
    },
    "recentActivity": {
      "last24Hours": 3,
      "last7Days": 12,
      "last30Days": 45
    },
    "growth": {
      "daily": 2.5,
      "weekly": 15.3,
      "monthly": 45.7
    }
  }
}
```

### 5. User Search (GET /api/users/search)

Advanced search functionality with multiple filters.

**Query Parameters:**
- `q` (string, required) - Search query
- `filters` (object) - Additional filters
- `limit` (number, default: 10) - Maximum results

**Example Request:**
```bash
GET /api/users/search?q=john&filters={"status":"active","role":"admin"}&limit=5
```

**Response:**
```json
{
  "users": [...],
  "total": 3,
  "query": "john",
  "filters": {
    "status": "active",
    "role": "admin"
  }
}
```

### 6. User Import (POST /api/users/import)

Import users from CSV or JSON data.

**Request Body:**
```json
{
  "users": [
    {
      "email": "import1@example.com",
      "name": "Import User 1",
      "password": "Password123!",
      "roles": ["rol_user123"]
    }
  ],
  "options": {
    "skipDuplicates": true,
    "defaultRoles": ["rol_user123"],
    "sendWelcomeEmail": false,
    "validateEmails": true
  }
}
```

**Response:**
```json
{
  "users": [...],
  "errors": [...],
  "skipped": [...],
  "summary": {
    "total": 10,
    "processed": 10,
    "successful": 8,
    "failed": 1,
    "skipped": 1
  }
}
```

### 7. Audit Logs (GET /api/users/audit)

Retrieve user activity audit logs.

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 20) - Logs per page
- `action` (string) - Filter by action type
- `userId` (string) - Filter by user ID
- `startDate` (string) - Start date filter
- `endDate` (string) - End date filter

**Response:**
```json
{
  "logs": [
    {
      "id": "1",
      "userId": "auth0|admin123",
      "userEmail": "admin@example.com",
      "action": "user.created",
      "details": "User created with email john.doe@example.com",
      "timestamp": "2024-01-15T10:00:00Z",
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0..."
    }
  ],
  "pagination": {...},
  "stats": {
    "total": 150,
    "byAction": {
      "user.created": 25,
      "user.updated": 45,
      "user.deleted": 5
    },
    "byUser": {
      "admin@example.com": 50,
      "manager@example.com": 30
    },
    "recentActivity": {
      "last24Hours": 12,
      "last7Days": 45
    }
  }
}
```

## Individual User Operations

### Get User (GET /api/users/[id])
### Update User (PATCH /api/users/[id])
### Delete User (DELETE /api/users/[id])
### Get User Roles (GET /api/users/[id]/roles)
### Assign User Roles (POST /api/users/[id]/roles)
### Remove User Roles (DELETE /api/users/[id]/roles)
### Get User Permissions (GET /api/users/[id]/permissions)

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

Error responses include a descriptive message:

```json
{
  "error": "User not found"
}
```

## Rate Limiting

The API respects Auth0 Management API rate limits. Bulk operations are processed sequentially to avoid rate limit issues.

## Security

- All endpoints require authentication
- Role-based access control (RBAC) is enforced
- User data is validated before processing
- Audit logs track all user management activities
- Sensitive operations require appropriate permissions

## Examples

### Complete User Management Workflow

1. **Get all users with pagination:**
```bash
curl -X GET "http://localhost:3000/api/users?page=1&limit=10"
```

2. **Search for specific users:**
```bash
curl -X GET "http://localhost:3000/api/users/search?q=john&filters={\"status\":\"active\"}"
```

3. **Create a new user:**
```bash
curl -X POST "http://localhost:3000/api/users" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create",
    "email": "newuser@example.com",
    "name": "New User",
    "password": "SecurePassword123!",
    "roles": ["rol_user123"]
  }'
```

4. **Bulk update users:**
```bash
curl -X POST "http://localhost:3000/api/users" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "bulk-update",
    "userIds": ["auth0|user1", "auth0|user2"],
    "updates": {"blocked": false}
  }'
```

5. **Export users to CSV:**
```bash
curl -X POST "http://localhost:3000/api/users" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "export",
    "format": "csv",
    "includeInactive": false
  }'
```

6. **Get user statistics:**
```bash
curl -X GET "http://localhost:3000/api/users/stats"
```

7. **View audit logs:**
```bash
curl -X GET "http://localhost:3000/api/users/audit?page=1&limit=20"
```

This comprehensive user management API provides all the functionality needed for enterprise-level user administration with Auth0 integration.
