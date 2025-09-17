# ProgressMark API

> **A comprehensive project management API with AI-powered task evaluation capabilities**

[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.0-blue.svg)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5.0-2D3748.svg)](https://prisma.io/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 🚀 Overview

ProgressMark API is a modern, scalable backend service designed for project management with integrated AI evaluation capabilities. Built with Node.js, Express, and Prisma, it provides a robust foundation for building project management applications with advanced features like AI-powered task evaluation, multi-tenant architecture, and comprehensive audit logging.

## ✨ Key Features

### 🔐 **Authentication & Security**
- JWT-based authentication with access/refresh token system
- Role-based access control (RBAC) with granular permissions
- Multi-tenant architecture with group-based organization
- Rate limiting and security headers
- Comprehensive input validation with Zod

### 🤖 **AI Integration**
- **Gemini 2.5 Flash** integration for intelligent task evaluation
- Automated scoring and feedback generation
- Structured AI responses with validation
- Rate limiting for AI requests (10/hour)
- Webhook support for async processing

### 📊 **Project Management**
- Multi-level organization: Groups → Teams → Projects → Tasks
- Advanced task management with status tracking
- Work logging and time tracking
- Comment system and collaboration features
- File upload and attachment support

### 💰 **Business Features**
- Subscription and billing management
- Support ticket system
- Comprehensive reporting and analytics
- Email notifications
- Audit logging for compliance

## 🛠 Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| **Runtime** | Node.js | 20+ |
| **Framework** | Express.js | 5.0 |
| **Database** | MySQL/MariaDB | Latest |
| **ORM** | Prisma | 5.0 |
| **Authentication** | JWT | 9.0 |
| **Validation** | Zod | 3.22 |
| **AI Service** | Google Gemini | 2.5 Flash |
| **File Upload** | Multer | 2.0 |
| **Logging** | Winston | 3.10 |
| **Security** | Helmet, CORS | Latest |

## 📚 API Documentation

### 🌐 Interactive Documentation
- **📖 API Docs**: `http://localhost:3000/docs` - Beautiful Swagger-style documentation
- **🧪 API Tester**: `http://localhost:3000/docs/tester` - Interactive testing tool
- **🏗️ Architecture**: `http://localhost:3000/docs/architecture` - System architecture overview
- **🔄 Workflow**: `http://localhost:3000/docs/workflow` - Business process analysis

### 📋 Base Information
- **Base URL**: `http://localhost:3000/api/v1`
- **Content-Type**: `application/json`
- **Authentication**: Bearer Token (JWT)
- **Response Format**: Envelope format with `ok`, `data`, `error`, `meta`

## 🔗 API Endpoints

### 🔐 Authentication (`/auth`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/auth/register` | Register new user | ❌ |
| `POST` | `/auth/login` | User login | ❌ |
| `POST` | `/auth/refresh` | Refresh access token | ❌ |
| `POST` | `/auth/forgot` | Request password reset | ❌ |
| `POST` | `/auth/reset` | Reset password | ❌ |
| `POST` | `/auth/logout` | User logout | ✅ |

### 👥 Groups (`/groups`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/groups` | Get user's groups | ✅ |
| `POST` | `/groups` | Create new group | ✅ |
| `GET` | `/groups/:gid` | Get group details | ✅ |
| `PATCH` | `/groups/:gid` | Update group (ADMIN) | ✅ |
| `DELETE` | `/groups/:gid` | Delete group (OWNER) | ✅ |
| `GET` | `/groups/:gid/members` | Get group members | ✅ |
| `POST` | `/groups/:gid/members` | Add member (ADMIN) | ✅ |
| `PATCH` | `/groups/:gid/members/:memberId` | Update member role (ADMIN) | ✅ |
| `DELETE` | `/groups/:gid/members/:memberId` | Remove member (ADMIN) | ✅ |

### 📋 Tasks (`/tasks`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/projects/:pid/tasks` | Get project tasks | ✅ |
| `POST` | `/projects/:pid/tasks` | Create new task | ✅ |
| `GET` | `/tasks/:tkid` | Get task details | ✅ |
| `PATCH` | `/tasks/:tkid` | Update task | ✅ |
| `DELETE` | `/tasks/:tkid` | Delete task | ✅ |
| `POST` | `/tasks/:tkid/assignees` | Add assignee | ✅ |
| `DELETE` | `/tasks/:tkid/assignees/:user_id` | Remove assignee | ✅ |
| `POST` | `/tasks/:tkid/status` | Change task status | ✅ |
| `GET` | `/tasks/:tkid/status-history` | Get status history | ✅ |
| `POST` | `/tasks/:tkid/worklogs` | Add work log | ✅ |
| `GET` | `/tasks/:tkid/worklogs` | Get work logs | ✅ |
| `POST` | `/tasks/:tkid/comments` | Add comment | ✅ |
| `GET` | `/tasks/:tkid/comments` | Get comments | ✅ |

### 🤖 AI Evaluations (`/evaluations`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/tasks/:tkid/evaluations` | Get task evaluations | ✅ |
| `POST` | `/tasks/:tkid/evaluations/manager` | Create manager evaluation | ✅ |
| `POST` | `/tasks/:tkid/evaluations/ai` | Create AI evaluation | ✅ |
| `GET` | `/evaluations/:eid` | Get evaluation details | ✅ |
| `GET` | `/evaluations/:eid/runs` | Get evaluation runs | ✅ |

### 🧪 Testing (`/test`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/test/gemini` | Test Gemini AI connection | ✅ |

## 🔧 Quick Start

### Prerequisites
- Node.js 20 or higher
- MySQL or MariaDB database
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd progressmark-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env
   ```
   
   Update the `.env` file:
   ```env
   # Database
   DATABASE_URL="mysql://username:password@localhost:3306/progressmark"
   
   # JWT Secrets
   JWT_SECRET="your-super-secret-jwt-key-here"
   JWT_REFRESH_SECRET="your-super-secret-refresh-key-here"
   
   # Server
   PORT=3000
   NODE_ENV="development"
   
   # CORS
   CORS_ORIGIN="http://localhost:3000"
   
   # AI Service
   GEMINI_API_KEY="your-gemini-api-key"
   
   # Email (Optional)
   SMTP_HOST="smtp.gmail.com"
   SMTP_USER="your-email@gmail.com"
   SMTP_PASS="your-app-password"
   ```

4. **Database Setup**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Push database schema
   npm run db:push
   
   # Seed database with demo data
   npm run db:seed
   ```

5. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

The API will be available at `http://localhost:3000`

## 📖 API Usage Examples

### Authentication
```bash
# Register new user
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securepassword123"
  }'

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securepassword123"
  }'
```

### Create Group and Task
```bash
# Create group
curl -X POST http://localhost:3000/api/v1/groups \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Project Group",
    "slug": "my-project-group"
  }'

# Create task
curl -X POST http://localhost:3000/api/v1/projects/PROJECT_ID/tasks \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Implement user authentication",
    "description": "Add JWT-based authentication system",
    "priority": "HIGH",
    "status": "TODO"
  }'
```

### AI Evaluation
```bash
# Create AI evaluation
curl -X POST http://localhost:3000/api/v1/tasks/TASK_ID/evaluations/ai \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: unique-key-123" \
  -d '{
    "context": "Task completion context and requirements",
    "criteria": "Quality, completeness, and adherence to standards"
  }'
```

## 🔐 Security Features

### Authentication & Authorization
- **JWT Tokens**: Access tokens (15min) + Refresh tokens (7 days)
- **RBAC System**: OWNER, ADMIN, MEMBER, VIEWER roles
- **Multi-tenant**: Group-based data isolation
- **Password Security**: bcrypt hashing with salt rounds

### Rate Limiting
| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Authentication | 5 requests | 1 minute |
| AI Evaluation | 10 requests | 1 hour |
| General API | 100 requests | 1 hour |

### Security Headers
- Helmet.js for security headers
- CORS protection
- Input validation with Zod
- SQL injection prevention via Prisma
- XSS protection

## 📊 Database Schema

### Core Entities
- **Users**: User accounts and authentication
- **Groups**: Multi-tenant organization units
- **Teams**: Sub-organizations within groups
- **Projects**: Project containers
- **Tasks**: Individual work items with status tracking
- **Evaluations**: AI and manager evaluations
- **AuditLogs**: Complete activity tracking

### Key Relationships
```
User → GroupMember → Group
Group → Team → Project → Task
Task → Evaluation (AI/Manager)
All Entities → AuditLog
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Test database connection
npm run db:test

# Test AI service
curl http://localhost:3000/api/v1/test/gemini
```

## 📈 Monitoring & Logging

### Health Checks
- **Health Endpoint**: `GET /health`
- **Database Status**: Connection and query performance
- **AI Service Status**: Gemini API connectivity

### Logging Strategy
- **Request/Response Logs**: All API calls
- **Error Logs**: Detailed error tracking
- **Audit Logs**: User actions and data changes
- **Performance Logs**: Response times and bottlenecks
- **Security Logs**: Authentication and authorization events

### Metrics Tracked
- Response time
- Request rate
- Error rate
- Database query performance
- Memory usage
- AI evaluation success rate

## 🚀 Deployment

### Environment Variables
```env
# Required
DATABASE_URL="mysql://user:pass@host:port/db"
JWT_SECRET="your-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret"
GEMINI_API_KEY="your-gemini-key"

# Optional
PORT=3000
NODE_ENV="production"
CORS_ORIGIN="https://your-frontend.com"
SMTP_HOST="smtp.gmail.com"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

### Production Checklist
- [ ] Set up production database
- [ ] Configure environment variables
- [ ] Set up reverse proxy (nginx)
- [ ] Configure SSL certificates
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy
- [ ] Set up CI/CD pipeline
- [ ] Configure rate limiting
- [ ] Set up error tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [http://localhost:3000/docs](http://localhost:3000/docs)
- **API Tester**: [http://localhost:3000/docs/tester](http://localhost:3000/docs/tester)
- **Issues**: Create an issue in the repository
- **Email**: Contact the development team

## 🎯 Roadmap

### Phase 1 (Current)
- ✅ Core API functionality
- ✅ Authentication & RBAC
- ✅ Task management
- ✅ AI evaluation integration
- ✅ Documentation & testing tools

### Phase 2 (Planned)
- 🔄 Team management
- 🔄 Project management
- 🔄 Billing & subscriptions
- 🔄 Advanced reporting
- 🔄 Mobile API optimization

### Phase 3 (Future)
- 📋 Advanced AI features
- 📋 Real-time notifications
- 📋 Advanced analytics
- 📋 Third-party integrations
- 📋 Mobile SDK

---

**ProgressMark API v1.0** - Built with ❤️ for modern project management

*Last updated: December 2024*