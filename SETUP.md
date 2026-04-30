# Project Setup Guide

This document provides detailed instructions for setting up the Adzan Challenge Website project.

## Prerequisites

- Node.js v18 or higher
- npm or yarn
- PostgreSQL 12 or higher (or Docker)
- Git

## Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd adzan-challenge-website

# Install dependencies
npm install
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# Important: Change JWT_SECRET in production
```

### 3. Database Setup

#### Option A: Using Docker (Recommended)

```bash
# Start PostgreSQL with Docker Compose
docker-compose up -d postgres

# Wait for PostgreSQL to be ready (check logs)
docker-compose logs postgres

# Initialize database
npm run build
node dist/backend/init-db.js
```

#### Option B: Local PostgreSQL

```bash
# Create database
createdb adzan_challenge

# Initialize database
npm run build
node dist/backend/init-db.js
```

### 4. Start Development Server

```bash
# Start backend server
npm run dev

# Server will run on http://localhost:5000
# Health check: curl http://localhost:5000/health
```

## Project Structure

```
adzan-challenge-website/
├── src/
│   ├── backend/
│   │   ├── server.ts          # Express server setup
│   │   ├── database.ts        # Database connection pool
│   │   └── init-db.ts         # Database initialization
│   ├── frontend/
│   │   ├── App.tsx            # Main React component
│   │   ├── index.tsx          # React entry point
│   │   └── index.css          # Global styles
│   └── shared/
│       └── types.ts           # TypeScript interfaces
├── public/
│   └── index.html             # HTML template
├── dist/                      # Compiled JavaScript (generated)
├── .env                       # Environment variables (local)
├── .env.example               # Environment template
├── package.json               # Dependencies
├── tsconfig.json              # TypeScript config
├── Dockerfile                 # Docker image
├── docker-compose.yml         # Docker Compose config
└── README.md                  # Project documentation
```

## Available Commands

### Development

```bash
# Start development server with hot reload
npm run dev

# Type check without building
npm run type-check

# Build TypeScript to JavaScript
npm run build

# Start production server
npm start
```

### Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Code Quality

```bash
# Run linter
npm run lint

# Type check
npm run type-check
```

## Database Configuration

### Connection Pool Settings

The database connection pool is configured in `src/backend/database.ts`:

- **Max connections**: 20
- **Idle timeout**: 30 seconds
- **Connection timeout**: 2 seconds

### Environment Variables

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=adzan_challenge
```

### Database Tables

The following tables are created during initialization:

1. **users** - Admin users
2. **participants** - Challenge participants (max 12)
3. **points** - Monthly points tracking
4. **transactions** - All point transactions (audit log)
5. **redeem_packages** - Available redeem packages
6. **redeem_history** - Redeem transactions
7. **quizzes** - Quiz definitions
8. **questions** - Quiz questions
9. **quiz_attempts** - Quiz completion records

## Docker Setup

### Using Docker Compose (Recommended)

```bash
# Start all services
docker-compose up

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Remove volumes (careful - deletes data)
docker-compose down -v
```

### Manual Docker Build

```bash
# Build image
docker build -t adzan-challenge .

# Run container
docker run -p 5000:5000 \
  -e DB_HOST=postgres \
  -e DB_USER=postgres \
  -e DB_PASSWORD=postgres \
  adzan-challenge
```

## API Endpoints

### Health Check

```bash
GET /health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### Error Handling

All errors return a standardized format:

```json
{
  "error": {
    "message": "Error description",
    "statusCode": 400,
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

## Security Configuration

### JWT Configuration

```env
JWT_SECRET=your_secret_key_here
JWT_EXPIRY=24h
```

**Important**: Change `JWT_SECRET` in production!

### CORS Configuration

CORS is configured to allow requests from:
- Default: `http://localhost:3000`
- Configurable via `FRONTEND_URL` environment variable

### Password Security

- Passwords are hashed using bcrypt
- Never store plain text passwords
- Use strong passwords in production

## Troubleshooting

### Database Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution**: Ensure PostgreSQL is running
```bash
# Check if PostgreSQL is running
psql --version

# Start PostgreSQL (macOS)
brew services start postgresql

# Start PostgreSQL (Linux)
sudo systemctl start postgresql

# Or use Docker
docker-compose up -d postgres
```

### Port Already in Use

```
Error: listen EADDRINUSE: address already in use :::5000
```

**Solution**: Change PORT in .env or kill the process
```bash
# Change port in .env
PORT=5001

# Or kill the process (Linux/macOS)
lsof -ti:5000 | xargs kill -9
```

### TypeScript Compilation Error

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
```

## Development Workflow

1. **Create feature branch**
   ```bash
   git checkout -b feature/your-feature
   ```

2. **Make changes**
   - Edit TypeScript files in `src/`
   - Changes are automatically compiled

3. **Test changes**
   ```bash
   npm run type-check
   npm test
   ```

4. **Commit and push**
   ```bash
   git add .
   git commit -m "feat: your feature description"
   git push origin feature/your-feature
   ```

5. **Create pull request**

## Performance Optimization

### Database Indexes

Indexes are automatically created during database initialization for:
- Participant status
- Points lookups
- Transaction timestamps
- Quiz attempts

### Connection Pooling

The connection pool automatically manages:
- Connection reuse
- Idle connection cleanup
- Connection timeout handling

## Monitoring and Logging

### Request Logging

All requests are logged with:
- Timestamp
- HTTP method
- Request path

### Error Logging

All errors are logged to console with:
- Error message
- Stack trace
- Timestamp

## Next Steps

1. **Implement Authentication** - See Task 3 in tasks.md
2. **Create API Endpoints** - See Task 6 onwards
3. **Build React Components** - See Task 12 onwards
4. **Add Tests** - See Phase 8 in tasks.md
5. **Deploy** - See Phase 9 in tasks.md

## Support

For issues or questions:
1. Check the README.md
2. Review the requirements.md
3. Check the tasks.md for implementation details
4. Review error logs in console

## Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Docker Documentation](https://docs.docker.com/)
