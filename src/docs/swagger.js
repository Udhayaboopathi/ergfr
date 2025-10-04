'use strict';

const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Quiz Application API',
    version: '1.0.0',
    description: 'API documentation for interactive quiz application with real-time capabilities',
    contact: {
      name: 'API Support',
      email: 'support@example.com',
    },
  },
  servers: [
    {
      url: '/api',
      description: 'API Server',
    },
  ],
  tags: [
    {
      name: 'Public',
      description: 'Public endpoints',
    },
    {
      name: 'Sessions',
      description: 'Session management endpoints',
    },
    {
      name: 'Admin',
      description: 'Admin-only endpoints (requires JWT authentication)',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string' },
          teamName: { type: 'string' },
          email: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Quiz: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          title: { type: 'string' },
          durationSeconds: { type: 'integer' },
          status: { type: 'string', enum: ['draft', 'running', 'ended'] },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          config: {
            type: 'object',
            properties: {
              shuffleQuestions: { type: 'boolean' },
              shuffleOptions: { type: 'boolean' },
              pointsPerCorrect: { type: 'integer' },
            },
          },
        },
      },
      Question: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          quizId: { type: 'string' },
          text: { type: 'string' },
          options: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                _id: { type: 'string' },
                text: { type: 'string' },
              },
            },
          },
          correctOptionId: { type: 'string' },
        },
      },
      Session: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          quizId: { type: 'string' },
          userId: { type: 'string' },
          joinAt: { type: 'string', format: 'date-time' },
          startAt: { type: 'string', format: 'date-time' },
          endAt: { type: 'string', format: 'date-time' },
          status: { type: 'string', enum: ['waiting', 'active', 'ended'] },
          questionOrder: {
            type: 'array',
            items: { type: 'string' },
          },
          optionOrders: {
            type: 'object',
            additionalProperties: {
              type: 'array',
              items: { type: 'string' },
            },
          },
          score: { type: 'integer' },
          totalTimeMs: { type: 'integer' },
          fullscreenExits: { type: 'integer' },
        },
      },
      Answer: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          sessionId: { type: 'string' },
          quizId: { type: 'string' },
          questionId: { type: 'string' },
          selectedOptionId: { type: 'string' },
          isCorrect: { type: 'boolean' },
          answeredAt: { type: 'string', format: 'date-time' },
          timeTakenMs: { type: 'integer' },
        },
      },
      EventLog: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          sessionId: { type: 'string' },
          quizId: { type: 'string' },
          type: {
            type: 'string',
            enum: [
              'fullscreen_exit',
              'blur',
              'focus',
              'visibility_hidden',
              'visibility_visible',
              'rejoin',
            ],
          },
          at: { type: 'string', format: 'date-time' },
        },
      },
      JoinRequest: {
        type: 'object',
        required: ['quizId', 'name', 'teamName', 'email'],
        properties: {
          quizId: { type: 'string' },
          name: { type: 'string' },
          teamName: { type: 'string' },
          email: { type: 'string', format: 'email' },
        },
      },
      JoinResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          sessionId: { type: 'string' },
          quizId: { type: 'string' },
          user: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              teamName: { type: 'string' },
              email: { type: 'string' },
            },
          },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
      },
      LoginResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          token: { type: 'string' },
        },
      },
      QuizRequest: {
        type: 'object',
        required: ['title', 'durationSeconds'],
        properties: {
          title: { type: 'string' },
          durationSeconds: { type: 'integer' },
          config: {
            type: 'object',
            properties: {
              shuffleQuestions: { type: 'boolean' },
              shuffleOptions: { type: 'boolean' },
              pointsPerCorrect: { type: 'integer' },
            },
          },
        },
      },
      AnswerRequest: {
        type: 'object',
        required: ['questionId', 'selectedOptionId', 'timeTakenMs'],
        properties: {
          questionId: { type: 'string' },
          selectedOptionId: { type: 'string' },
          timeTakenMs: { type: 'integer' },
        },
      },
      AnswerResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          correct: { type: 'boolean' },
        },
      },
      EventRequest: {
        type: 'object',
        required: ['type'],
        properties: {
          type: {
            type: 'string',
            enum: [
              'fullscreen_exit',
              'blur',
              'focus',
              'visibility_hidden',
              'visibility_visible',
              'rejoin',
            ],
          },
        },
      },
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string' },
        },
      },
      TimeResponse: {
        type: 'object',
        properties: {
          now: { type: 'integer' },
        },
      },
      HealthResponse: {
        type: 'object',
        properties: {
          status: { type: 'string' },
          service: { type: 'string' },
          db: { type: 'string' },
          queue: { type: 'string' },
          timestamp: { type: 'integer' },
        },
      },
    },
  },
  paths: {
    '/join': {
      post: {
        tags: ['Public'],
        summary: 'Join a quiz',
        description: 'Join a quiz as a participant',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/JoinRequest',
              },
            },
          },
          required: true,
        },
        responses: {
          200: {
            description: 'Successful join',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/JoinResponse',
                },
              },
            },
          },
          400: {
            description: 'Bad request',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          404: {
            description: 'Quiz not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          500: {
            description: 'Server error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
    '/time': {
      get: {
        tags: ['Public'],
        summary: 'Get server time',
        description: 'Returns current server timestamp in milliseconds',
        responses: {
          200: {
            description: 'Server time',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/TimeResponse',
                },
              },
            },
          },
        },
      },
    },
    '/health': {
      get: {
        tags: ['Public'],
        summary: 'Health check',
        description: 'Check the health of the API service',
        responses: {
          200: {
            description: 'Service health status',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/HealthResponse',
                },
              },
            },
          },
        },
      },
    },
    '/admin/login': {
      post: {
        tags: ['Admin'],
        summary: 'Admin login',
        description: 'Login as admin to get JWT token',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/LoginRequest',
              },
            },
          },
          required: true,
        },
        responses: {
          200: {
            description: 'Successful login',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/LoginResponse',
                },
              },
            },
          },
          401: {
            description: 'Authentication failed',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          500: {
            description: 'Server error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
    '/admin/quizzes': {
      post: {
        tags: ['Admin'],
        summary: 'Create quiz',
        description: 'Create a new quiz',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/QuizRequest',
              },
            },
          },
          required: true,
        },
        responses: {
          201: {
            description: 'Quiz created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    quiz: {
                      $ref: '#/components/schemas/Quiz',
                    },
                  },
                },
              },
            },
          },
          400: {
            description: 'Bad request',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          401: {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          500: {
            description: 'Server error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
      get: {
        tags: ['Admin'],
        summary: 'List quizzes',
        description: 'List all quizzes',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'page',
            in: 'query',
            description: 'Page number',
            schema: {
              type: 'integer',
              default: 1,
            },
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Items per page',
            schema: {
              type: 'integer',
              default: 10,
            },
          },
          {
            name: 'status',
            in: 'query',
            description: 'Filter by status',
            schema: {
              type: 'string',
              enum: ['draft', 'running', 'ended'],
            },
          },
        ],
        responses: {
          200: {
            description: 'List of quizzes',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    quizzes: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/Quiz',
                      },
                    },
                    pagination: {
                      type: 'object',
                      properties: {
                        total: { type: 'integer' },
                        page: { type: 'integer' },
                        pages: { type: 'integer' },
                        limit: { type: 'integer' },
                      },
                    },
                  },
                },
              },
            },
          },
          401: {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          500: {
            description: 'Server error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
    // Many more API endpoints would be defined here...
  },
};

module.exports = { swaggerSpec };