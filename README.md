# Interactive Quiz Application

A real-time quiz application built with Node.js, Express, MongoDB, and Socket.IO. This system enables quiz administrators to create and manage quizzes while participants can join, answer questions, and receive immediate feedback.

## Features

- **Real-time quiz management**: Create, start, and end quizzes with real-time participant updates
- **Secure authentication**: JWT-based authentication for admin endpoints
- **Anti-cheat mechanisms**: Track fullscreen exits, browser visibility changes, and other events
- **Email result delivery**: Automatically send detailed quiz results via email
- **Shuffling**: Randomize questions and options per user to prevent cheating
- **Live ranking**: Track user progress and rankings in real-time
- **Comprehensive API documentation**: Swagger UI for exploring and testing the API

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Realtime**: Socket.IO (namespaces/rooms per quiz)
- **Validation**: Joi
- **Authentication**: JWT for admin endpoints
- **Security**: Helmet, CORS, express-rate-limit, bcrypt
- **Jobs/Emails**: Agenda (MongoDB-backed job scheduler) + SendGrid/SMTP
- **Documentation**: OpenAPI 3 + Swagger UI at `/docs`
- **Logging**: Morgan + Pino for structured logs
- **Testing**: Jest + Supertest

## Installation

### Prerequisites

- Node.js 18 or higher
- MongoDB 4.4 or higher

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/quiz-app.git
   cd quiz-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create an environment file:
   ```bash
   cp .env.example .env
   ```

4. Configure your environment variables in the `.env` file:
   ```
   PORT=3000
   MONGO_URI=mongodb://localhost:27017/quizapp
   JWT_SECRET=your_jwt_secret_key_here
   ADMIN_EMAIL=admin@example.com
   ADMIN_PASSWORD_HASH=bcrypt_hashed_password_here
   APP_BASE_URL=http://localhost:3000
   ```

5. Seed the database with an admin user and sample quiz:
   ```bash
   npm run seed
   ```
   This will create an admin user with the email specified in your `.env` and a sample quiz with 5 questions.

## Running the Application

### Step 1: Make sure MongoDB is running

If using Docker:
```bash
docker run -d --name mongo-quiz -p 27017:27017 mongo:latest
```

### Step 2: Seed the database
```bash
npm run seed
```

This creates:
- An admin user with email `admin@example.com` and password `admin123`
- A sample quiz with basic questions

### Step 3: Start the application

#### Development mode (with auto-reload)
```bash
npm run dev
```

#### Production mode
```bash
npm start
```

### Step 4: Access the application

- **API Documentation**: http://localhost:3000/docs
- **Admin Login**: Use the admin credentials to get a JWT token
- **API Base URL**: http://localhost:3000/api

## API Documentation

Once the server is running, you can access the Swagger UI documentation at:

```
http://localhost:3000/docs
```

## API Endpoints

### Public Endpoints

#### Join a Quiz

- **URL**: `/api/join`
- **Method**: `POST`
- **Input**:
  ```json
  {
    "quizId": "60a1b2c3d4e5f6a7b8c9d0e1",
    "name": "John Doe",
    "teamName": "Team Alpha",
    "email": "john@example.com"
  }
  ```
- **Output Success**:
  ```json
  {
    "success": true,
    "sessionId": "60b2c3d4e5f6a7b8c9d0e1f2",
    "quizId": "60a1b2c3d4e5f6a7b8c9d0e1",
    "user": {
      "name": "John Doe",
      "teamName": "Team Alpha",
      "email": "john@example.com"
    }
  }
  ```
- **Output Error**:
  ```json
  {
    "success": false,
    "message": "Quiz not found or not available"
  }
  ```

#### Submit Answer

- **URL**: `/api/sessions/{sessionId}/answers`
- **Method**: `POST`
- **Input**:
  ```json
  {
    "questionId": "60c3d4e5f6a7b8c9d0e1f2a3",
    "selectedOptionId": "60d4e5f6a7b8c9d0e1f2a3b4",
    "timeTakenMs": 5000
  }
  ```
- **Output Success**:
  ```json
  {
    "success": true,
    "correct": true
  }
  ```
- **Output Error**:
  ```json
  {
    "success": false,
    "message": "Invalid answer or time expired"
  }
  ```

#### Log Event (fullscreen exit, tab switch, etc.)

- **URL**: `/api/sessions/{sessionId}/events`
- **Method**: `POST`
- **Input**:
  ```json
  {
    "type": "fullscreen_exit"
  }
  ```
- **Output Success**:
  ```json
  {
    "success": true
  }
  ```

#### Get Server Time (for synchronization)

- **URL**: `/api/time`
- **Method**: `GET`
- **Output**:
  ```json
  {
    "now": 1633123456789
  }
  ```

### Admin Endpoints (Require JWT Authentication)

#### Admin Login

- **URL**: `/api/admin/login`
- **Method**: `POST`
- **Input**:
  ```json
  {
    "email": "admin@example.com",
    "password": "admin123"
  }
  ```
- **Output Success**:
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```
- **Output Error**:
  ```json
  {
    "success": false,
    "message": "Invalid credentials"
  }
  ```

#### Create Quiz

- **URL**: `/api/admin/quizzes`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer {token}`
- **Input**:
  ```json
  {
    "title": "General Knowledge Quiz",
    "durationSeconds": 300,
    "config": {
      "shuffleQuestions": true,
      "shuffleOptions": true,
      "pointsPerCorrect": 1
    }
  }
  ```
- **Output Success**:
  ```json
  {
    "success": true,
    "quiz": {
      "_id": "61a1b2c3d4e5f6a7b8c9d0e1",
      "title": "General Knowledge Quiz",
      "durationSeconds": 300,
      "status": "draft",
      "config": {
        "shuffleQuestions": true,
        "shuffleOptions": true,
        "pointsPerCorrect": 1
      },
      "createdAt": "2025-10-04T10:30:00.000Z",
      "updatedAt": "2025-10-04T10:30:00.000Z"
    }
  }
  ```

#### List Quizzes

- **URL**: `/api/admin/quizzes`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer {token}`
- **Query Parameters**: `page=1&limit=10&status=draft`
- **Output**:
  ```json
  {
    "success": true,
    "quizzes": [
      {
        "_id": "61a1b2c3d4e5f6a7b8c9d0e1",
        "title": "General Knowledge Quiz",
        "durationSeconds": 300,
        "status": "draft",
        "config": {
          "shuffleQuestions": true,
          "shuffleOptions": true,
          "pointsPerCorrect": 1
        },
        "createdAt": "2025-10-04T10:30:00.000Z",
        "updatedAt": "2025-10-04T10:30:00.000Z"
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "pages": 1,
      "limit": 10
    }
  }
  ```

#### Add Questions

- **URL**: `/api/admin/quizzes/{quizId}/questions`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer {token}`
- **Input**:
  ```json
  {
    "questions": [
      {
        "text": "What is the capital of France?",
        "options": [
          {"text": "Paris"},
          {"text": "London"},
          {"text": "Berlin"},
          {"text": "Rome"}
        ],
        "correctOptionIndex": 0
      },
      {
        "text": "Which planet is known as the Red Planet?",
        "options": [
          {"text": "Earth"},
          {"text": "Mars"},
          {"text": "Jupiter"},
          {"text": "Venus"}
        ],
        "correctOptionIndex": 1
      }
    ]
  }
  ```
- **Output Success**:
  ```json
  {
    "success": true,
    "addedCount": 2,
    "questions": [
      {
        "_id": "62a1b2c3d4e5f6a7b8c9d0e1",
        "text": "What is the capital of France?",
        "options": [
          {"_id": "63a1b2c3d4e5f6a7b8c9d0e1", "text": "Paris"},
          {"_id": "64a1b2c3d4e5f6a7b8c9d0e1", "text": "London"},
          {"_id": "65a1b2c3d4e5f6a7b8c9d0e1", "text": "Berlin"},
          {"_id": "66a1b2c3d4e5f6a7b8c9d0e1", "text": "Rome"}
        ],
        "correctOptionId": "63a1b2c3d4e5f6a7b8c9d0e1"
      }
    ]
  }
  ```

#### Start Quiz

- **URL**: `/api/admin/quizzes/{quizId}/start`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer {token}`
- **Output Success**:
  ```json
  {
    "success": true,
    "quiz": {
      "_id": "61a1b2c3d4e5f6a7b8c9d0e1",
      "title": "General Knowledge Quiz",
      "status": "running",
      "startedAt": "2025-10-04T10:35:00.000Z"
    }
  }
  ```

#### End Quiz

- **URL**: `/api/admin/quizzes/{quizId}/end`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer {token}`
- **Output Success**:
  ```json
  {
    "success": true,
    "quiz": {
      "_id": "61a1b2c3d4e5f6a7b8c9d0e1",
      "title": "General Knowledge Quiz",
      "status": "ended",
      "startedAt": "2025-10-04T10:35:00.000Z",
      "endedAt": "2025-10-04T10:40:00.000Z"
    }
  }
  ```

#### Get Ranking

- **URL**: `/api/admin/quizzes/{quizId}/ranking`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer {token}`
- **Output**:
  ```json
  {
    "success": true,
    "ranking": [
      {
        "rank": 1,
        "sessionId": "72a1b2c3d4e5f6a7b8c9d0e1",
        "name": "John Doe",
        "teamName": "Team Alpha",
        "score": 2,
        "totalTimeMs": 8500
      }
    ]
  }
  ```

## Usage Flow

### Admin Flow

1. **Login**: `POST /api/admin/login` with admin credentials
2. **Create Quiz**: `POST /api/admin/quizzes` with quiz details
3. **Add Questions**: `POST /api/admin/quizzes/:quizId/questions` with question data
4. **Monitor Participants**: `GET /api/admin/quizzes/:quizId/participants` to see joined users
5. **Start Quiz**: `POST /api/admin/quizzes/:quizId/start` to begin the quiz
6. **Monitor Progress**: Connect to Socket.IO and listen for progress events
7. **View Ranking**: `GET /api/admin/quizzes/:quizId/ranking` for real-time scores
8. **End Quiz**: `POST /api/admin/quizzes/:quizId/end` to finalize and send results
9. **Export Results**: `GET /api/admin/quizzes/:quizId/export` to download CSV

### Participant Flow

1. **Join Quiz**: `POST /api/join` with quiz ID, name, team, and email
2. **Connect**: Connect to Socket.IO and join quiz room
3. **Start**: Wait for "server:start" event signaling quiz start
4. **Get Question**: `GET /api/sessions/:sessionId/next` to retrieve first question
5. **Submit Answer**: `POST /api/sessions/:sessionId/answers` with selected option
6. **Continue**: Repeat steps 4-5 until all questions are answered
7. **End**: Receive "server:end" event and wait for result email

## WebSocket Events

### Client → Server Events (emitted by clients)

#### User Join Session

- **Event**: `user:join`
- **Data**:
  ```json
  {
    "sessionId": "72a1b2c3d4e5f6a7b8c9d0e1"
  }
  ```

#### User Submit Answer

- **Event**: `user:answer`
- **Data**:
  ```json
  {
    "questionId": "62a1b2c3d4e5f6a7b8c9d0e1",
    "selectedOptionId": "63a1b2c3d4e5f6a7b8c9d0e1",
    "timeTakenMs": 3500
  }
  ```

#### User Event

- **Event**: `user:event`
- **Data**:
  ```json
  {
    "type": "fullscreen_exit"
  }
  ```

#### Admin Join

- **Event**: `admin:join`
- **Data**:
  ```json
  {
    "quizId": "61a1b2c3d4e5f6a7b8c9d0e1",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

### Server → Client Events (emitted by server)

#### Joined Session

- **Event**: `joined`
- **Data**:
  ```json
  {
    "quizId": "61a1b2c3d4e5f6a7b8c9d0e1"
  }
  ```

#### Answer Result

- **Event**: `answer:result`
- **Data**:
  ```json
  {
    "correct": true
  }
  ```

#### Quiz State Updated

- **Event**: `quiz-state-updated`
- **Data**:
  ```json
  {
    "state": "running",
    "timestamp": "2025-10-04T10:35:00.000Z"
  }
  ```

#### Start Signal

- **Event**: `server:start`
- **Data**:
  ```json
  {
    "startAt": "2025-10-04T10:35:00.000Z",
    "durationSeconds": 300
  }
  ```

#### End Signal

- **Event**: `server:end`
- **Data**:
  ```json
  {
    "endedAt": "2025-10-04T10:40:00.000Z"
  }
  ```

#### Current Participants (admin only)

- **Event**: `server:joinedUsers`
- **Data**:
  ```json
  [
    {
      "sessionId": "72a1b2c3d4e5f6a7b8c9d0e1",
      "name": "John Doe",
      "teamName": "Team Alpha",
      "email": "john@example.com",
      "status": "active"
    }
  ]
  ```

#### Progress Update (admin only)

- **Event**: `server:progress`
- **Data**:
  ```json
  {
    "sessionId": "72a1b2c3d4e5f6a7b8c9d0e1",
    "answeredCount": 2,
    "totalQuestions": 5
  }
  ```

#### Ranking Update (admin only)

- **Event**: `server:rankingUpdate`
- **Data**:
  ```json
  [
    {
      "user": {
        "name": "John Doe",
        "teamName": "Team Alpha"
      },
      "score": 2,
      "totalTimeMs": 8500,
      "fullscreenExits": 0
    }
  ]
  ```

## Data Models

### User

- `_id`: ObjectId
- `name`: String
- `teamName`: String
- `email`: String (unique)

### Quiz

- `_id`: ObjectId
- `title`: String
- `durationSeconds`: Number
- `status`: String (enum: draft, running, ended)
- `config`: Object
  - `shuffleQuestions`: Boolean
  - `shuffleOptions`: Boolean
  - `pointsPerCorrect`: Number

### Question

- `_id`: ObjectId
- `quizId`: ObjectId (ref: Quiz)
- `text`: String
- `options`: Array
  - `_id`: ObjectId
  - `text`: String
- `correctOptionId`: ObjectId

### Session

- `_id`: ObjectId
- `quizId`: ObjectId (ref: Quiz)
- `userId`: ObjectId (ref: User)
- `joinAt`: Date
- `startAt`: Date
- `endAt`: Date
- `status`: String (enum: waiting, active, ended)
- `questionOrder`: Array of ObjectId
- `optionOrders`: Object (questionId: array of optionId)
- `score`: Number
- `totalTimeMs`: Number
- `fullscreenExits`: Number

### Answer

- `_id`: ObjectId
- `sessionId`: ObjectId (ref: Session)
- `quizId`: ObjectId (ref: Quiz)
- `questionId`: ObjectId (ref: Question)
- `selectedOptionId`: ObjectId
- `isCorrect`: Boolean
- `answeredAt`: Date
- `timeTakenMs`: Number

### EventLog

- `_id`: ObjectId
- `sessionId`: ObjectId (ref: Session)
- `quizId`: ObjectId (ref: Quiz)
- `type`: String (enum: fullscreen_exit, blur, focus, visibility_hidden, visibility_visible, rejoin)
- `at`: Date

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 3000 |
| NODE_ENV | Environment (development/production) | development |
| MONGO_URI | MongoDB connection string | mongodb://localhost:27017/quiz-app |
| JWT_SECRET | Secret for JWT signing | - |
| ADMIN_EMAIL | Admin user email | - |
| ADMIN_PASSWORD_HASH | Admin password bcrypt hash | - |
| APP_BASE_URL | Base URL for application | http://localhost:3000 |
| EMAIL_FROM | Email sender address | - |
| SENDGRID_API_KEY | SendGrid API Key (optional) | - |
| SMTP_HOST | SMTP host (optional) | - |
| SMTP_PORT | SMTP port (optional) | 587 |
| SMTP_USER | SMTP username (optional) | - |
| SMTP_PASS | SMTP password (optional) | - |
| DISABLE_EMAIL | Disable email sending (for testing) | false |
| DISABLE_AGENDA | Disable job scheduler (for testing) | false |

## Testing

Run the test suite with:

```bash
npm test
```

## License

This project is licensed under the MIT License.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.