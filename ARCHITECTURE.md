# 🏗️ **Refactored Architecture Documentation**

## **Overview**

This document outlines the comprehensive refactoring of the Next.js RBAC application, implementing industry best practices and clean architecture principles.

## **Architecture Layers**

### **1. Presentation Layer (UI Components)**
- **Location**: `components/`, `app/`
- **Purpose**: User interface and user interactions
- **Key Features**:
  - React components with proper TypeScript typing
  - Custom hooks for data fetching (`hooks/use-api.ts`, `hooks/use-users.ts`)
  - Error boundaries for graceful error handling
  - Responsive design with Tailwind CSS

### **2. API Layer (Next.js API Routes)**
- **Location**: `app/api/v2/`
- **Purpose**: HTTP endpoints and request/response handling
- **Key Features**:
  - RESTful API design
  - Request validation using Zod schemas
  - Authentication and authorization middleware
  - Comprehensive error handling
  - Request/response logging

### **3. Service Layer (Business Logic)**
- **Location**: `lib/services/`
- **Purpose**: Business logic and orchestration
- **Key Features**:
  - `UserService`: User management operations
  - `RoleService`: Role management operations
  - `PermissionService`: Permission management operations
  - Input validation and business rules
  - Error handling and logging

### **4. Repository Layer (Data Access)**
- **Location**: `lib/repositories/`
- **Purpose**: Data access abstraction
- **Key Features**:
  - `UserRepository`: Auth0 user data access
  - `RoleRepository`: Auth0 role data access
  - `PermissionRepository`: Auth0 permission data access
  - Consistent interface across all repositories
  - Error handling and data transformation

### **5. Infrastructure Layer**
- **Location**: `lib/auth0-management.ts`, `lib/auth0.ts`
- **Purpose**: External service integration
- **Key Features**:
  - Auth0 Management API integration
  - Authentication provider setup
  - External service error handling

## **Key Improvements**

### **✅ Type Safety**
- Comprehensive TypeScript interfaces in `lib/types/index.ts`
- Strict typing for all API requests/responses
- Type-safe error handling with custom error classes

### **✅ Error Handling**
- Custom error classes in `lib/errors/index.ts`
- Consistent error responses across all API endpoints
- Proper HTTP status codes and error messages
- Error boundaries in React components

### **✅ Validation**
- Zod schemas in `lib/validation/schemas.ts`
- Request validation for all API endpoints
- Type-safe validation with proper error messages
- Client and server-side validation

### **✅ Authentication & Authorization**
- Middleware-based auth in `lib/middleware/auth.middleware.ts`
- Permission-based access control
- Role-based access control
- Secure API endpoint protection

### **✅ Logging & Monitoring**
- Centralized logging in `lib/logging/logger.ts`
- Request/response logging middleware
- Performance monitoring
- Structured logging with context

### **✅ Testing**
- Jest configuration with React Testing Library
- Comprehensive test utilities in `__tests__/utils/`
- Service layer unit tests
- Mock data and API responses

## **File Structure**

```
lib/
├── types/
│   └── index.ts                 # Central type definitions
├── errors/
│   └── index.ts                 # Custom error classes
├── validation/
│   └── schemas.ts               # Zod validation schemas
├── repositories/
│   ├── base.repository.ts       # Base repository interface
│   ├── user.repository.ts       # User data access
│   ├── role.repository.ts       # Role data access
│   └── permission.repository.ts # Permission data access
├── services/
│   ├── base.service.ts          # Base service class
│   ├── user.service.ts          # User business logic
│   ├── role.service.ts          # Role business logic
│   └── permission.service.ts    # Permission business logic
├── middleware/
│   ├── auth.middleware.ts       # Auth & authorization
│   └── logging.middleware.ts    # Request/response logging
└── logging/
    └── logger.ts                # Centralized logging

hooks/
├── use-api.ts                   # Generic API hooks
└── use-users.ts                 # User-specific hooks

app/api/v2/
├── users/
│   ├── route.ts                 # Users API endpoints
│   └── [id]/route.ts            # User by ID endpoints
└── ...

__tests__/
├── utils/
│   └── test-utils.tsx           # Test utilities
└── lib/
    └── services/
        └── user.service.test.ts # Service tests
```

## **Usage Examples**

### **API Route with Authentication**
```typescript
import { withPermission } from '@/lib/middleware/auth.middleware'
import { UserService } from '@/lib/services/user.service'

export const GET = withPermission('users:read')(async (request) => {
  const userService = new UserService()
  const result = await userService.getUsers()
  return NextResponse.json(result)
})
```

### **Service Layer Usage**
```typescript
const userService = new UserService()
const result = await userService.createUser({
  email: 'user@example.com',
  name: 'User Name',
  password: 'securepassword'
})
```

### **Custom Hook Usage**
```typescript
const { data: users, loading, error, refetch } = useUsers({
  page: 1,
  limit: 10,
  search: 'john'
})
```

### **Error Handling**
```typescript
try {
  const result = await userService.createUser(userData)
} catch (error) {
  if (error instanceof ValidationError) {
    // Handle validation error
  } else if (error instanceof ConflictError) {
    // Handle conflict error
  }
}
```

## **Migration Guide**

### **From Old API to New API**
1. Update API endpoints from `/api/users` to `/api/v2/users`
2. Use new custom hooks instead of direct fetch calls
3. Implement proper error handling with custom error classes
4. Add authentication middleware to protected routes

### **Testing**
1. Run tests: `npm test`
2. Run tests with coverage: `npm run test:coverage`
3. Run tests in watch mode: `npm run test:watch`

## **Best Practices Implemented**

1. **Separation of Concerns**: Each layer has a single responsibility
2. **Dependency Injection**: Services depend on abstractions, not concretions
3. **Error Handling**: Consistent error handling across all layers
4. **Type Safety**: Comprehensive TypeScript typing
5. **Validation**: Input validation at API boundaries
6. **Logging**: Structured logging with context
7. **Testing**: Comprehensive test coverage
8. **Security**: Proper authentication and authorization
9. **Performance**: Optimized data fetching and caching
10. **Maintainability**: Clean, readable, and well-documented code

## **Next Steps**

1. **Gradual Migration**: Migrate existing API routes to new architecture
2. **Enhanced Testing**: Add integration and E2E tests
3. **Performance Monitoring**: Implement APM tools
4. **Documentation**: Add API documentation with OpenAPI/Swagger
5. **CI/CD**: Set up automated testing and deployment pipelines

---

This refactored architecture provides a solid foundation for scalable, maintainable, and secure user management with proper separation of concerns and industry best practices.
