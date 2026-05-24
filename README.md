# DriveCore

### Enterprise Vehicle Registration & Compliance Infrastructure

DriveCore is a production-oriented backend platform engineered to manage the full lifecycle of vehicle registration and compliance workflows.

The platform handles identity management, registration processing, multi-role approval workflows, document verification, payment tracking, expiry monitoring, operational analytics, audit logging, and automated notifications through a modular and scalable backend architecture.

Unlike conventional CRUD-based registration systems, DriveCore was designed as a workflow-driven compliance infrastructure capable of simulating how modern digital governance systems operate at scale.

---

## Live API Documentation

**Production Swagger Docs:**
[https://drivecore-hjkf.onrender.com/api-docs](https://drivecore-hjkf.onrender.com/api-docs)

**Repository:**
[https://github.com/Daleemah/car-registration-system](https://github.com/Daleemah/car-registration-system)

---

## Team

| GitHub | Role |
|---|---|
| [Idongesit Inyang](https://github.com/ID-Inyang) | Team Lead |
<img width="1254" height="1254" alt="Idongesit Inyang" src="https://github.com/user-attachments/assets/57fa58e6-192a-4626-bc46-df393dc42014" />

| [Olaoluwa Odebela](https://github.com/olexxy410) | Team Lead & Core Contributor|
| [Adelani Halimah Ayobami](https://github.com/Daleemah) | Team Lead |
| [Faith Akinsuyi](https://github.com/suyill) | Team Member |
| [Ayobami Ata](https://github.com/Ayobamiata) | Team Member |
<img width="1122" height="1402" alt="Ata Ayobami" src="https://github.com/user-attachments/assets/741eb3c4-534e-4e20-8931-dcbe1a47465e" />

| [Ridwan Balogun](https://github.com/asyncridwan) | Team Member |
| [Ojo Folarin](https://github.com/folsman) | Team Member |
| [Sobowale Elijah Adedayo](https://github.com/eliyhung) | Team Member |

---
<img width="1919" height="886" alt="brave_screenshot_meet google com (5)" src="https://github.com/user-attachments/assets/a9b7b0a4-56a5-40ca-878e-7802335ffe2d" />



## System Overview

DriveCore manages the complete registration lifecycle:

- User onboarding and authentication
- Vehicle registration processing
- Role-based approval orchestration
- Document verification
- Payment recording
- Expiry tracking and renewal workflows
- Administrative analytics
- Operational logging and observability
- Automated notifications and reminders

The platform was architected with scalability, maintainability, and operational transparency in mind.

---

## Architecture

```text
                        ┌──────────────────────┐
                        │      Client Apps     │
                        │  Web / Mobile / API  │
                        └──────────┬───────────┘
                                   │
                                   ▼
                     ┌──────────────────────────┐
                     │      Express API Layer   │
                     └──────────┬───────────────┘
                                │
           ┌────────────────────┼────────────────────┐
           ▼                    ▼                    ▼
  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐
  │ Authentication │  │  Authorization │  │ Validation     │
  │ Middleware     │  │ Middleware     │  │ Layer (Zod)    │
  └────────────────┘  └────────────────┘  └────────────────┘
                                │
                                ▼
                     ┌──────────────────────────┐
                     │       Controllers        │
                     └──────────┬───────────────┘
                                │
                                ▼
                     ┌──────────────────────────┐
                     │       Service Layer      │
                     │ Business Logic Engine    │
                     └──────────┬───────────────┘
                                │
         ┌──────────────────────┼──────────────────────┐
         ▼                      ▼                      ▼
┌─────────────────┐   ┌──────────────────┐   ┌─────────────────┐
│ Notification    │   │ Activity Logging │   │ Expiry Scheduler│
│ Service         │   │ Service          │   │ (Cron Jobs)     │
└─────────────────┘   └──────────────────┘   └─────────────────┘
                                │
                                ▼
                     ┌──────────────────────────┐
                     │        MongoDB           │
                     │ Persistence & Indexing   │
                     └──────────────────────────┘
```

---

## Core System Capabilities

### Identity & Access Management

- JWT-based authentication
- Secure password hashing with bcrypt
- Role-based access control (RBAC)
- Protected route middleware
- Session-aware authorization flows
- User profile management

### Registration Workflow Engine

- Draft registration creation
- Submission workflow orchestration
- Multi-stage approval pipeline
- Administrative approval controls
- Automatic plate generation
- Workflow audit trail

### Compliance & Verification

- Vehicle document verification
- VIN uniqueness enforcement
- Registration validation policies
- Expiry tracking and renewal processing
- Registration status enforcement

### Operational Intelligence

- Administrative analytics dashboard
- Revenue and registration insights
- Activity monitoring
- System health visibility
- Exportable operational reports

### Observability & Auditability

- Centralized activity logging
- Error logging infrastructure
- Request tracking
- Workflow traceability
- Administrative diagnostics

### Notification Infrastructure

- Email notification system
- Approval/rejection alerts
- Expiry reminders
- Payment confirmations
- Weekly administrative reports

---

## Why DriveCore Exists

Vehicle registration systems are often fragmented, difficult to audit, and operationally inefficient.

DriveCore was designed to simulate how a modern digital vehicle registration infrastructure could be architected using scalable backend engineering principles.

The platform focuses on:

- workflow reliability
- operational transparency
- administrative accountability
- automation of repetitive compliance tasks
- centralized lifecycle management
- maintainable service-oriented architecture

Rather than functioning as a basic CRUD application, DriveCore behaves as a workflow orchestration platform capable of handling real-world administrative processes.

---

## Technology Stack

| Category | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Database | MongoDB |
| ODM | Mongoose |
| Authentication | JWT |
| Password Security | bcryptjs |
| Validation | Zod |
| Email Infrastructure | Nodemailer |
| Task Scheduling | node-cron |
| Security | Helmet, CORS, Rate Limiting |
| Logging | Morgan + Custom Logging Services |
| API Documentation | Swagger (swagger-jsdoc + swagger-ui-express) |
| Development Environment | Nodemon, Dotenv |

---

## Engineering Decisions

### Layered Architecture

Business logic is separated from controllers using a service-oriented structure. This improves maintainability, scalability, testability, and separation of concerns.

### Centralized Error Logging

Operational failures are persisted to MongoDB for debugging and observability. This enables issue tracing, operational diagnostics, audit support, and production monitoring.

### RBAC Enforcement

Authorization policies are enforced using middleware-based role guards. Different permission scopes exist for administrators, staff reviewers, and standard users.

### Automated Expiry Monitoring

Background cron jobs automate compliance monitoring and expiry notifications without requiring manual intervention.

### Immutable Workflow Tracking

Critical actions are logged to maintain workflow traceability and accountability across every registration lifecycle stage.

---

## Workflow Lifecycle

### Registration Workflow

```text
Draft
  ↓
Submitted
  ↓
Under Review
  ↓
Recommended
  ↓
Approved
  ↓
Issued
```

### Rejection Flow

```text
Submitted / Under Review
  ↓
Rejected
```

### Workflow Rules

| Stage | Responsible Role |
|---|---|
| Draft Creation | User |
| Submission | User |
| Review Initiation | Staff |
| Recommendation | Staff |
| Final Approval | Admin |
| Plate Issuance | System (Automatic) |

All transitions are validated and logged for auditability.

---

## Security Architecture

### Authentication Security

- JWT-based token authentication
- Password hashing using bcrypt
- Protected middleware guards
- Expiration-aware session validation

### Authorization Security

- Role-based access control
- Ownership-aware resource protection
- Administrative route isolation

### Request Security

- Input validation using Zod
- Request rate limiting
- Helmet security headers
- Controlled CORS configuration

### Operational Security

- Sanitized error responses
- Centralized logging
- Audit trail generation
- Controlled workflow transitions

---

## API Overview

### Base URL

```
http://localhost:5000/api
```

### Swagger Documentation (Local)

```
http://localhost:5000/api-docs
```

### Authentication Header

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## API Modules

| Module | Route Prefix | Responsibility |
|---|---|---|
| Authentication | `/api/auth` | User authentication and identity management |
| Registrations | `/api/registrations` | Vehicle registration workflows |
| Documents | `/api/documents` | Document submission and verification |
| Admin | `/api/admin` | Administrative analytics and controls |
| Admin Dashboard | `/api/admin/dashboard` | Dashboard overview and charts |
| Expiry | `/api/expiry` | Expiry monitoring and notifications |
| Activities | `/api/activities` | Operational activity tracking |
| Error Logs | `/api/error-logs` | System diagnostics and error records |

---

## Example API Requests

### Register a User

```http
POST /api/auth/register
Content-Type: application/json
```

```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "Password123@",
  "phone": "08012345678"
}
```

### Login

```http
POST /api/auth/login
Content-Type: application/json
```

```json
{
  "email": "john@example.com",
  "password": "Password123@"
}
```

### Create a Vehicle Registration

```http
POST /api/registrations
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

```json
{
  "vehicle": {
    "vin": "1HGBH41JXMN109186",
    "make": "Toyota",
    "model": "Camry",
    "year": 2022,
    "color": "Black",
    "engineCapacity": 2500,
    "vehicleClass": "private"
  },
  "owner": {
    "fullName": "John Doe",
    "address": "123 Lagos Street",
    "phone": "08012345678",
    "email": "john@example.com"
  }
}
```

### Submit Registration for Review

```http
POST /api/registrations/:id/submit
Authorization: Bearer YOUR_JWT_TOKEN
```

### Staff Recommendation

```http
POST /api/registrations/:id/staff-approve
Authorization: Bearer YOUR_JWT_TOKEN
```

### Administrative Approval

```http
POST /api/registrations/:id/admin-approve
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

```json
{
  "notes": "Registration approved"
}
```

---

## Project Structure

```text
car-registration-system/
│
├── src/
│   ├── config/
│   │   └── swagger.js
│   ├── controllers/
│   │   ├── adminController.js
│   │   ├── adminDashboardControllers.js
│   │   ├── documentController.js
│   │   ├── registrationController.js
│   │   └── userAuthController.js
│   ├── middlewares/
│   │   ├── authMiddleware.js
│   │   ├── errorHandler.js
│   │   ├── errorLoggerMiddleware.js
│   │   └── requestLogger.js
│   ├── models/
│   │   ├── Document.js
│   │   ├── errorLogModel.js
│   │   ├── registrationModel.js
│   │   └── userModel.js
│   ├── routes/
│   │   ├── activityRoutes.js
│   │   ├── adminDashboardRoutes.js
│   │   ├── adminRoutes.js
│   │   ├── authRoutes.js
│   │   ├── documentRoutes.js
│   │   ├── errorLogRoutes.js
│   │   ├── expiryRoutes.js
│   │   └── registrationRoutes.js
│   ├── services/
│   │   ├── activityLogService.js
│   │   ├── adminDashboardService.js
│   │   ├── authService.js
│   │   ├── emailService.js
│   │   ├── errorLogService.js
│   │   ├── expiryNotificationService.js
│   │   └── registrationService.js
│   ├── utils/
│   │   ├── ApiError.js
│   │   ├── asyncHandler.js
│   │   ├── db.js
│   │   ├── paginate.js
│   │   ├── plate.js
│   │   ├── requestId.js
│   │   ├── schemas.js
│   │   └── validate.js
│   └── app.js
│
├── .env.example
├── .gitignore
├── package.json
├── server.js
└── README.md
```

---

## User Roles

| Role | Responsibilities |
|---|---|
| Admin | System oversight, analytics, final approvals, configuration |
| Staff | Registration review and recommendations |
| User | Registration creation and submission |

---

## Environment Variables

Create a `.env` file in the root directory using `.env.example` as a template.

```env
PORT=5000
NODE_ENV=development

MONGO_URI=mongodb://127.0.0.1:27017/drivecore

JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password

CLIENT_URL=http://localhost:3000
```

> **Note:** The token expiry variable is `JWT_EXPIRES_IN`. Using `JWT_EXPIRE` will be silently ignored and the server will default to a 24-hour expiry.

---

## Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Daleemah/car-registration-system.git
cd car-registration-system
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

```bash
cp .env.example .env
```

Then open `.env` and fill in your values.

### 4. Start MongoDB

**Local MongoDB:**

```bash
mongod
```

**MongoDB Atlas:**

Update `MONGO_URI` in your `.env` with your Atlas connection string.

### 5. Run the Development Server

```bash
npm run dev
```

### 6. Production Mode

```bash
npm start
```

---

## API Documentation

Once the server is running, Swagger UI is available at:

```
http://localhost:5000/api-docs
```

The raw OpenAPI JSON spec (for Postman import or code generation) is available at:

```
http://localhost:5000/api-docs.json
```

To authenticate in Swagger UI:

1. Call `POST /api/auth/login` and copy the `token` from the response
2. Click the **Authorize** button at the top of the page
3. Paste the token and click **Authorize**
4. All subsequent requests will include the token automatically

---

## Database Collections

DriveCore automatically initializes the following collections:

| Collection | Purpose |
|---|---|
| `users` | User accounts and roles |
| `registrations` | Vehicle registration records |
| `activities` | Workflow activity logs |
| `errorlogs` | System error records |
| `documents` | Uploaded vehicle documents |

Indexes are created automatically for query optimization.

---

## Automated Background Jobs

| Job | Schedule | Responsibility |
|---|---|---|
| Expiry Monitoring | Daily | Detect registrations nearing expiry |
| Notification Dispatch | Daily | Send expiry warning emails |
| Weekly Reports | Weekly | Administrative reporting digest |

---

## Testing Workflow

DriveCore supports manual API testing via Swagger UI or any HTTP client such as Postman or curl.

**Recommended test sequence:**

1. Register a user — `POST /api/auth/register`
2. Login and copy the JWT token — `POST /api/auth/login`
3. Create a vehicle registration draft — `POST /api/registrations`
4. Submit it for review — `POST /api/registrations/:id/submit`
5. Login as staff and start review — `POST /api/registrations/:id/staff-review`
6. Staff recommends approval — `POST /api/registrations/:id/staff-approve`
7. Login as admin and final-approve — `POST /api/registrations/:id/admin-approve`
8. Verify plate number was issued — `GET /api/registrations/:id`

---

## Common Issues

### MongoDB Connection Failure

```
MongooseServerSelectionError
```

Ensure MongoDB is running locally or verify your Atlas credentials and IP whitelist settings.

---

### JWT Authentication Failure

```
TokenExpiredError
```

Re-authenticate to obtain a fresh token. Ensure `JWT_EXPIRES_IN` (not `JWT_EXPIRE`) is set in your `.env`.

---

### SMTP Authentication Failure

```
Invalid login: Username and Password not accepted
```

Use a Gmail App Password rather than your standard Gmail password. Standard passwords will not work with SMTP when 2FA is enabled.

---

### Port Conflict

```
EADDRINUSE
```

Update the `PORT` value in `.env` or terminate the process occupying the port.

---

## Observability

### Logging Infrastructure

- Activity logging per user and per registration
- Workflow state transition tracking
- HTTP request monitoring via Morgan
- Centralized error persistence to MongoDB

### Administrative Visibility

- Registration metrics and status breakdowns
- Revenue analytics
- Approval pipeline statistics
- System health endpoint at `GET /api/admin/health`

---

## Scalability Considerations

### Current Features

- Modular service architecture
- Stateless JWT authentication
- Separation of concerns across layers
- Centralized Zod validation
- Indexed MongoDB queries
- Asynchronous notification workflows
- Scheduled background processing via cron

### Potential Future Enhancements

- Redis caching layer
- Queue-based event processing (BullMQ / RabbitMQ)
- Horizontal scaling behind a load balancer
- Container orchestration with Kubernetes
- Distributed notification services
- Microservice decomposition
- CI/CD pipeline with automated tests

---

## Deployment

DriveCore is environment-configured and deployment-ready. It can be deployed to:

- **Render** (currently live at [drivecore-hjkf.onrender.com](https://drivecore-hjkf.onrender.com))
- Railway
- Docker / Docker Compose
- Any VPS (Ubuntu + PM2 recommended)
- Cloud container services (AWS ECS, GCP Cloud Run)

---

## Roadmap

- Mobile application support
- Digital registration certificates
- QR-based registration verification
- Payment gateway integrations
- Multi-region deployments
- Real-time notification channels (WebSocket / SSE)
- Advanced analytics dashboard
- Queue-based workflow orchestration
- CI/CD automation
- Full integration test suite

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes with descriptive messages
4. Push to your branch (`git push origin feature/your-feature`)
5. Open a pull request

### Development Standards

- Maintain modular architecture
- Preserve separation of concerns
- Add Zod validation for all new endpoints
- Add Swagger annotations for all new routes
- Update documentation consistently
- Keep services testable and isolated

---

## Final Notes

DriveCore was built to demonstrate backend engineering principles beyond traditional CRUD application development.

The platform focuses on workflow orchestration, compliance infrastructure, operational transparency, scalable architecture, and maintainable backend design.

It represents a systems-oriented approach to backend development with emphasis on reliability, traceability, and extensibility.
