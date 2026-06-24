import type { OpenAPIObject } from '@nestjs/swagger';

const userStatusSchema = {
  type: 'string',
  enum: ['PENDING', 'ACTIVE', 'DISABLED'],
  example: 'ACTIVE',
};

const uuidSchema = {
  type: 'string',
  format: 'uuid',
} as const;

const unauthorizedResponse = {
  description: 'Missing, invalid, or inactive Hydra bearer token.',
} as const;

const forbiddenResponse = {
  description:
    'Token is missing the resource-server audience or the endpoint-specific scope.',
} as const;

export const adminUsersOpenApiDocument: OpenAPIObject = {
  openapi: '3.0.0',
  info: {
    title: 'Resource Server Admin Users API',
    description:
      'Hydra-protected admin endpoints for resource-server user management.',
    version: '1.0',
  },
  tags: [
    {
      name: 'Users Admin',
      description: 'Admin user-management endpoints.',
    },
  ],
  paths: {
    '/users': {
      get: {
        tags: ['Users Admin'],
        summary: 'List admin users',
        description:
          'Requires a Hydra bearer token with audience resource-server and scope users.read. Returns user identity fields, status, service summaries, and pagination metadata. Credentials and password hashes are never returned.',
        security: [{ hydraBearer: [] }],
        parameters: [
          {
            name: 'page',
            in: 'query',
            required: false,
            schema: { type: 'string', example: '1' },
            description: 'One-based page number. Defaults to 1.',
          },
          {
            name: 'pageSize',
            in: 'query',
            required: false,
            schema: { type: 'string', example: '25' },
            description: 'Page size. Defaults to 10 and is capped at 100.',
          },
          {
            name: 'search',
            in: 'query',
            required: false,
            schema: { type: 'string', example: 'jane' },
            description:
              'Case-insensitive partial search over user name, email, and subject.',
          },
          {
            name: 'status',
            in: 'query',
            required: false,
            schema: userStatusSchema,
            description: 'Filters users by exact status.',
          },
          {
            name: 'clientId',
            in: 'query',
            required: false,
            schema: { type: 'string', example: 'clinical-portal' },
            description:
              'Filters users with a membership in the given service client id.',
          },
        ],
        responses: {
          '200': {
            description: 'Paginated users list.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ListUsersResponse' },
              },
            },
          },
          '400': { description: 'Invalid pagination or status filter.' },
          '401': unauthorizedResponse,
          '403': forbiddenResponse,
        },
      },
      post: {
        tags: ['Users Admin'],
        summary: 'Create an admin-managed user',
        description:
          'Requires a Hydra bearer token with audience resource-server and scope users.write. The email is normalized, the subject is generated from the email local part, and both email and subject must be unique. Created admin users default to ACTIVE. The password is stored only as a hash and is never returned.',
        security: [{ hydraBearer: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateUserRequest' },
            },
          },
        },
        responses: {
          '201': {
            description: 'User created successfully.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateUserResponse' },
              },
            },
          },
          '400': { description: 'Invalid request body.' },
          '401': unauthorizedResponse,
          '403': forbiddenResponse,
          '409': { description: 'Email or generated subject already exists.' },
        },
      },
    },
    '/users/{id}': {
      get: {
        tags: ['Users Admin'],
        summary: 'Get an admin user by id',
        description:
          'Requires a Hydra bearer token with audience resource-server and scope users.read. Returns user identity fields, status, and service details. Credentials and password hashes are never returned.',
        security: [{ hydraBearer: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: uuidSchema,
            description: 'Database id of the user returned by GET /users.',
          },
        ],
        responses: {
          '200': {
            description: 'User detail.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UserDetailResponse' },
              },
            },
          },
          '400': { description: 'Invalid UUID path parameter.' },
          '401': unauthorizedResponse,
          '403': forbiddenResponse,
          '404': { description: 'User was not found.' },
        },
      },
      delete: {
        tags: ['Users Admin'],
        summary: 'Delete an admin user by id',
        description:
          'Requires a Hydra bearer token with audience resource-server and scope users.delete. Deletes the user record and cascades related credential data according to the Prisma schema.',
        security: [{ hydraBearer: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: uuidSchema,
            description: 'Database id of the user to delete.',
          },
        ],
        responses: {
          '200': {
            description: 'Deleted user summary.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DeleteUserResponse' },
              },
            },
          },
          '400': { description: 'Invalid UUID path parameter.' },
          '401': unauthorizedResponse,
          '403': forbiddenResponse,
          '404': { description: 'User was not found.' },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      hydraBearer: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'Hydra access token',
        description:
          'Hydra-issued access token with audience resource-server and the endpoint-specific scope.',
      },
    },
    schemas: {
      CreateUserRequest: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: {
            type: 'string',
            example: 'Jane Doe',
            description: 'Display name for the user.',
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'jane.doe@example.com',
            description:
              'Unique email address. It is normalized to lowercase before storage.',
          },
          password: {
            type: 'string',
            minLength: 8,
            writeOnly: true,
            example: 'correct-horse-battery-staple',
            description:
              'Plain-text password used only to create the stored hash.',
          },
        },
      },
      CreateUserResponse: {
        type: 'object',
        required: ['id', 'subject', 'name', 'email', 'status'],
        properties: {
          id: uuidSchema,
          subject: {
            type: 'string',
            example: 'jane.doe',
            description:
              'Subject generated from the normalized email local part. It is unique across users.',
          },
          name: { type: 'string', example: 'Jane Doe' },
          email: {
            type: 'string',
            format: 'email',
            example: 'jane.doe@example.com',
          },
          status: userStatusSchema,
        },
      },
      DeleteUserResponse: {
        type: 'object',
        required: ['id', 'subject', 'name', 'email', 'status', 'message'],
        properties: {
          id: uuidSchema,
          subject: { type: 'string', example: 'jane.doe' },
          name: { type: 'string', example: 'Jane Doe' },
          email: {
            type: 'string',
            format: 'email',
            example: 'jane.doe@example.com',
          },
          status: userStatusSchema,
          message: { type: 'string', example: 'User deleted successfully' },
        },
      },
      ListUsersResponse: {
        type: 'object',
        required: ['items', 'pagination'],
        properties: {
          items: {
            type: 'array',
            items: { $ref: '#/components/schemas/UserListItemResponse' },
          },
          pagination: { $ref: '#/components/schemas/UsersPaginationResponse' },
        },
      },
      UserListItemResponse: {
        type: 'object',
        required: ['id', 'subject', 'name', 'email', 'status', 'services'],
        properties: {
          id: uuidSchema,
          subject: { type: 'string', example: 'jane.doe' },
          name: { type: 'string', example: 'Jane Doe' },
          email: {
            type: 'string',
            format: 'email',
            example: 'jane.doe@example.com',
          },
          status: userStatusSchema,
          services: {
            type: 'array',
            items: { $ref: '#/components/schemas/UserServiceSummary' },
          },
        },
      },
      UserDetailResponse: {
        type: 'object',
        required: ['id', 'subject', 'name', 'email', 'status', 'services'],
        properties: {
          id: uuidSchema,
          subject: { type: 'string', example: 'jane.doe' },
          name: { type: 'string', example: 'Jane Doe' },
          email: {
            type: 'string',
            format: 'email',
            example: 'jane.doe@example.com',
          },
          status: userStatusSchema,
          services: {
            type: 'array',
            items: { $ref: '#/components/schemas/UserServiceSummary' },
          },
        },
      },
      UserServiceSummary: {
        type: 'object',
        required: ['id', 'clientId', 'name', 'type', 'roles'],
        properties: {
          id: uuidSchema,
          clientId: { type: 'string', example: 'clinical-portal' },
          name: { type: 'string', example: 'Clinical Portal' },
          type: { type: 'string', example: 'WEB_APP' },
          roles: {
            type: 'array',
            items: { type: 'string' },
            example: ['admin', 'reader'],
          },
        },
      },
      UsersPaginationResponse: {
        type: 'object',
        required: ['page', 'pageSize', 'totalItems', 'totalPages'],
        properties: {
          page: { type: 'integer', example: 1 },
          pageSize: { type: 'integer', example: 25 },
          totalItems: { type: 'integer', example: 137 },
          totalPages: { type: 'integer', example: 6 },
        },
      },
    },
  },
};
