const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Car Registration API',
      version: '1.0.0',
      description:
        'REST API for managing vehicle registrations, documents, users, and admin analytics. ' +
        'All protected routes require a Bearer JWT token obtained from `POST /api/auth/login`.',
    },
    servers: [
      {
        url: 'http://localhost:{port}',
        description: 'Local development server',
        variables: {
          port: { default: '5000' },
        },
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Paste the token returned by POST /api/auth/login',
        },
      },
      schemas: {
        // ── User ──────────────────────────────────────────────────────────
        User: {
          type: 'object',
          properties: {
            id:        { type: 'string', example: '664f1a2b3c4d5e6f7a8b9c0d' },
            fullName:  { type: 'string', example: 'John Doe' },
            email:     { type: 'string', format: 'email', example: 'john@example.com' },
            phone:     { type: 'string', example: '08012345678' },
            address:   { type: 'string', example: '123 Main Street, Lagos' },
            nin:       { type: 'string', example: '12345678901' },
            role:      { type: 'string', enum: ['user', 'staff', 'admin'], example: 'user' },
            isActive:  { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },

        // ── Registration ──────────────────────────────────────────────────
        VehicleInfo: {
          type: 'object',
          required: ['vin', 'make', 'model', 'year', 'color', 'vehicleClass'],
          properties: {
            vin:            { type: 'string', minLength: 5, maxLength: 17, example: '1HGBH41JXMN109186' },
            make:           { type: 'string', example: 'Toyota' },
            model:          { type: 'string', example: 'Camry' },
            year:           { type: 'integer', example: 2022 },
            color:          { type: 'string', example: 'Black' },
            engineCapacity: { type: 'number', example: 2000 },
            vehicleClass: {
              type: 'string',
              enum: ['motorcycle', 'private', 'commercial', 'heavy_duty', 'government'],
              example: 'private',
            },
            chassisNumber: { type: 'string', example: 'CH-1234567' },
          },
        },
        OwnerInfo: {
          type: 'object',
          required: ['fullName', 'address', 'phone'],
          properties: {
            fullName:   { type: 'string', example: 'John Doe' },
            address:    { type: 'string', example: '123 Main Street, Lagos' },
            phone:      { type: 'string', example: '08012345678' },
            email:      { type: 'string', format: 'email', example: 'john@example.com' },
            nationalId: { type: 'string', example: '12345678901' },
          },
        },
        Registration: {
          type: 'object',
          properties: {
            _id:         { type: 'string', example: '664f1a2b3c4d5e6f7a8b9c0d' },
            applicantId: { type: 'string', example: '664f1a2b3c4d5e6f7a8b9c0d' },
            vehicle:     { $ref: '#/components/schemas/VehicleInfo' },
            owner:       { $ref: '#/components/schemas/OwnerInfo' },
            status: {
              type: 'string',
              enum: ['draft', 'submitted', 'under_review', 'recommended', 'approved', 'rejected', 'issued'],
              example: 'draft',
            },
            plateNumber: { type: 'string', example: 'LG-123-ABC', nullable: true },
            expiresAt:   { type: 'string', format: 'date-time', nullable: true },
            createdAt:   { type: 'string', format: 'date-time' },
            updatedAt:   { type: 'string', format: 'date-time' },
          },
        },

        // ── Document ──────────────────────────────────────────────────────
        Document: {
          type: 'object',
          properties: {
            _id:          { type: 'string', example: '664f1a2b3c4d5e6f7a8b9c0e' },
            vehicleId:    { type: 'string', example: '664f1a2b3c4d5e6f7a8b9c0d' },
            documentType: {
              type: 'string',
              enum: ['proof_of_ownership', 'national_id', 'insurance', 'inspection_report', 'tax_clearance', 'other'],
              example: 'proof_of_ownership',
            },
            fileUrl:      { type: 'string', format: 'uri', example: 'https://example.com/doc.pdf' },
            fileName:     { type: 'string', example: 'ownership.pdf' },
            fileSize:     { type: 'integer', example: 204800 },
            mimeType:     { type: 'string', example: 'application/pdf' },
            status:       { type: 'string', enum: ['pending', 'verified', 'rejected'], example: 'pending' },
            notes:        { type: 'string', example: 'Original title document' },
            submittedBy:  { type: 'string', example: '664f1a2b3c4d5e6f7a8b9c0d' },
            createdAt:    { type: 'string', format: 'date-time' },
          },
        },

        // ── Shared response envelopes ─────────────────────────────────────
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operation completed successfully' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error description' },
          },
        },
        PaginatedMeta: {
          type: 'object',
          properties: {
            page:       { type: 'integer', example: 1 },
            limit:      { type: 'integer', example: 10 },
            total:      { type: 'integer', example: 42 },
            totalPages: { type: 'integer', example: 5 },
          },
        },
      },

      // Reusable parameters
      parameters: {
        idParam: {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string' },
          description: 'MongoDB ObjectId',
          example: '664f1a2b3c4d5e6f7a8b9c0d',
        },
        pageQuery: {
          in: 'query',
          name: 'page',
          schema: { type: 'integer', default: 1 },
          description: 'Page number',
        },
        limitQuery: {
          in: 'query',
          name: 'limit',
          schema: { type: 'integer', default: 10 },
          description: 'Results per page',
        },
      },

      // Reusable responses
      responses: {
        Unauthorized: {
          description: 'Missing or invalid JWT token',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { success: false, message: 'No token, access denied' },
            },
          },
        },
        Forbidden: {
          description: 'Authenticated but insufficient role',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { success: false, message: 'Forbidden — requires one of: [admin]' },
            },
          },
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { success: false, message: 'Not found' },
            },
          },
        },
        ValidationError: {
          description: 'Request body failed validation',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { success: false, message: 'Validation error details' },
            },
          },
        },
      },
    },
    // Apply bearerAuth globally — individual public routes override with security: []
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth',              description: 'Register, login, profile, password management' },
      { name: 'Registrations',     description: 'Vehicle registration lifecycle (draft → approved)' },
      { name: 'Documents',         description: 'Document submission and verification' },
      { name: 'Expiry',            description: 'Registration expiry tracking and notifications' },
      { name: 'Activities',        description: 'Audit trail and activity logs' },
      { name: 'Admin',             description: 'Analytics, exports, system health (admin only)' },
      { name: 'Admin Dashboard',   description: 'Dashboard overview and charts (admin only)' },
      { name: 'Error Logs',        description: 'Server error log management (admin only)' },
    ],
  },
  // Glob patterns — swagger-jsdoc scans these files for @swagger JSDoc blocks
  apis: [path.join(process.cwd(), 'src/routes/*.js').replace(/\\/g, '/')],
};

const swaggerSpec = swaggerJsdoc(options);

const resolvedPath = path.join(__dirname, '../routes/*.js');
console.log('Resolved glob path:', resolvedPath);
console.log('Does the directory exist?', require('fs').existsSync(path.dirname(resolvedPath)));
console.log('Files in that directory:', require('fs').readdirSync(path.dirname(resolvedPath)));

console.log('Number of API files found:', swaggerSpec.paths ? Object.keys(swaggerSpec.paths).length : 0);
console.log('Paths:', Object.keys(swaggerSpec.paths || {}));

// const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
