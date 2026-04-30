# Adzan Challenge Website

Adzan Challenge Website adalah platform gamifikasi untuk meningkatkan partisipasi peserta dalam kegiatan adzan berjamaah. Sistem ini melacak kehadiran dan kualitas adzan peserta, memberikan poin berdasarkan performa, dan memungkinkan peserta menukar poin dengan hadiah (Free Fire Diamond).

## Project Structure

```
adzan-challenge-website/
├── src/
│   ├── backend/           # Express server and API
│   │   ├── server.ts      # Main server entry point
│   │   └── database.ts    # Database connection pool
│   ├── frontend/          # React application
│   │   ├── App.tsx        # Main App component
│   │   ├── index.tsx      # React entry point
│   │   └── index.css      # Global styles
│   └── shared/            # Shared types and utilities
│       └── types.ts       # TypeScript interfaces
├── public/                # Static files
│   └── index.html         # HTML template
├── .env                   # Environment variables (development)
├── .env.example           # Environment variables template
├── package.json           # Project dependencies
├── tsconfig.json          # TypeScript configuration
└── README.md              # This file
```

## Technology Stack

- **Backend**: Node.js + Express + TypeScript
- **Frontend**: React + TypeScript + Tailwind CSS
- **Database**: PostgreSQL (or SQLite for development)
- **Authentication**: JWT + bcrypt
- **Testing**: Jest + React Testing Library

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- PostgreSQL (or SQLite for development)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd adzan-challenge-website
```

2. Install dependencies:
```bash
npm install
```

3. Setup environment variables:
```bash
cp .env.example .env
```

4. Update `.env` with your configuration:
```env
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=adzan_challenge

JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRY=24h

ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123

MONTHLY_BUDGET=50000
MAX_REDEEM_PER_WEEK=2
```

5. Create the database:
```bash
createdb adzan_challenge
```

## Development

### Start the backend server:
```bash
npm run dev
```

The server will start on `http://localhost:5000`

### Health check:
```bash
curl http://localhost:5000/health
```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run lint` - Run ESLint
- `npm run type-check` - Check TypeScript types

## Database Setup

The database connection pool is configured in `src/backend/database.ts`. It uses PostgreSQL by default but can be configured for SQLite.

### Connection Pool Configuration:
- Max connections: 20
- Idle timeout: 30 seconds
- Connection timeout: 2 seconds

## API Endpoints

### Health Check
- `GET /health` - Check server status

### Participants (To be implemented)
- `GET /api/participants` - List all participants
- `POST /api/participants` - Create new participant
- `PUT /api/participants/:id` - Update participant
- `PATCH /api/participants/:id/status` - Update participant status

### Attendance (To be implemented)
- `POST /api/attendance` - Record attendance

### Adzan (To be implemented)
- `POST /api/adzan` - Record adzan with attitude rating

### Points (To be implemented)
- `GET /api/participants/:id/points` - Get participant points

### Redeem (To be implemented)
- `GET /api/redeem-packages` - List redeem packages
- `POST /api/redeem` - Process redeem request

### Quiz (To be implemented)
- `GET /api/quizzes` - List quizzes
- `POST /api/quizzes/:id/submit` - Submit quiz answers

## Error Handling

The server includes centralized error handling middleware that:
- Catches all errors
- Logs errors to console
- Returns standardized error responses with status codes
- Includes timestamps for debugging

## Security Features

- CORS middleware for cross-origin requests
- Body parser with size limits (10MB)
- Environment variable management
- Request logging
- Error handling middleware

## Next Steps

1. Setup database schema and migrations
2. Implement authentication system
3. Create API endpoints for participants management
4. Implement attendance and adzan tracking
5. Build React components for dashboard
6. Implement quiz system
7. Implement redeem system
8. Add comprehensive testing

## Contributing

Please follow the project structure and coding standards when contributing.

## License

ISC
