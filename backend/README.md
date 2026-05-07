# Cricket Match Management Backend

A monolithic Node.js backend API for managing cricket matches, players, teams, and tournaments.

## Architecture

This backend follows a **monolithic architecture** with clear separation of concerns:

```
backend/
├── prisma/
│   └── schema.prisma          # Prisma database schema
├── src/
│   ├── config/                # Configuration files
│   │   ├── database.js        # Prisma client instance
│   │   └── supabase.js        # Supabase storage config
│   ├── controllers/           # Business logic
│   │   ├── authController.js
│   │   ├── matchController.js
│   │   ├── matchPlayerController.js
│   │   ├── scoringController.js
│   │   ├── playerController.js
│   │   ├── registeredPlayerController.js
│   │   ├── teamController.js
│   │   └── tournamentController.js
│   ├── middleware/            # Express middleware
│   │   ├── auth.js            # Authentication & authorization
│   │   └── upload.js          # File upload configuration
│   ├── routes/                # API routes
│   │   ├── authRoutes.js
│   │   ├── matchRoutes.js
│   │   ├── playerRoutes.js
│   │   ├── teamRoutes.js
│   │   ├── tournamentRoutes.js
│   │   └── index.js           # Route aggregator
│   └── app.js                 # Main application entry point
├── seeders/                   # Database seed files
│   ├── seed.js
│   ├── seed-all-players.js
│   ├── seed-balls.js
│   ├── seed-comprehensive.js
│   ├── seed-full.js
│   ├── seed-skanda.js
│   └── seed-skandaib.js
├── logs/                      # Application logs
│   ├── combined.log           # All logs
│   └── error.log              # Error logs only
├── old_files/                 # Archived old files (for reference)
├── uploads/                   # Local file storage (fallback)
├── .env                       # Environment variables (not in git)
├── .env.example               # Environment template
├── package.json
└── README.md
```

## Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Authentication**: JWT (jsonwebtoken)
- **File Storage**: Supabase Storage
- **File Upload**: Multer
- **Logging**: Winston + Morgan

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and update with your actual values:

```bash
cp .env.example .env
```

**Important**: Update the `DATABASE_URL` in `.env`:
```
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
```

### 3. Database Setup

#### Option A: Using Existing Database
If you already have the database set up with the SQL schema:

```bash
# Generate Prisma Client
npm run prisma:generate

# Pull the existing schema (optional - to sync Prisma with DB)
npx prisma db pull
```

#### Option B: Fresh Database with Prisma Migrations
If starting fresh:

```bash
# Generate Prisma Client
npm run prisma:generate

# Create and apply migrations
npm run prisma:migrate

# Optional: Seed the database
npm run prisma:seed
```

### 4. Start the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will run on `http://localhost:5000` (or the PORT specified in `.env`).

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start the server in production mode |
| `npm run dev` | Start the server with nodemon (auto-reload) |
| `npm run prisma:generate` | Generate Prisma Client |
| `npm run prisma:migrate` | Create and apply database migrations |
| `npm run prisma:deploy` | Apply migrations in production |
| `npm run prisma:studio` | Open Prisma Studio (database GUI) |
| `npm run prisma:seed` | Seed the database with initial data |

## API Endpoints

### Authentication
- `POST /api/register` - Register new user
- `POST /api/login` - Login user
- `GET /api/me` - Get current user info

### Matches (Public)
- `GET /api/public/live-matches` - Get all live matches
- `GET /api/public/matches/:id` - Get match details
- `GET /api/public/matches/:id/scorecard` - Get match scorecard

### Matches (Authenticated)
- `GET /api/matches` - Get all matches (with status filter)
- `GET /api/matches/:id` - Get match details with players
- `POST /api/matches` - Create new match (feeder only)
- `PUT /api/matches/:id` - Update match (feeder only)
- `GET /api/matches/:id/scorecard` - Get detailed scorecard

### Match Players
- `POST /api/matches/:id/join` - Join a match (player only)
- `GET /api/matches/:id/players` - Get match players
- `PUT /api/match-players/:id/approve` - Approve player (feeder only)
- `GET /api/matches/:id/approved-players` - Get approved players

### Scoring
- `POST /api/matches/:id/ball` - Record ball-by-ball (feeder only)
- `GET /api/matches/:id/balls` - Get ball-by-ball data

### Players
- `GET /api/players` - Get all players (feeder only)
- `PUT /api/players/:id/approve` - Approve player (feeder only)
- `GET /api/players/:id/journey` - Get player statistics
- `GET /api/players/journey-by-name` - Search player by name

### Registered Players
- `GET /api/registered-players` - Get all registered players
- `POST /api/registered-players` - Register new player
- `POST /api/registered-players/:id/photo` - Upload player photo
- `PUT /api/registered-players/:id` - Update player details

### Teams
- `GET /api/teams` - Get all teams
- `GET /api/teams/:id` - Get team details with players
- `POST /api/teams` - Create new team (feeder only)
- `POST /api/teams/:id/players` - Add player to team (feeder only)
- `DELETE /api/teams/:teamId/players/:playerId` - Remove player (feeder only)

### Tournaments
- `GET /api/tournaments` - Get all tournaments
- `GET /api/tournaments/:id` - Get tournament details
- `POST /api/tournaments` - Create tournament (feeder only)
- `POST /api/tournaments/:id/teams` - Add team to tournament (feeder only)
- `GET /api/tournaments/:id/fixtures` - Get tournament fixtures
- `GET /api/tournaments/:id/standings` - Get tournament standings

## User Roles

- **viewer**: Can view public matches and scorecards
- **player**: Can register, join matches, view own statistics
- **feeder**: Full access - create matches, approve players, record scores

## Database Models

The application uses the following main models:

- **User**: System users (players, feeders, viewers)
- **Match**: Cricket matches
- **MatchPlayer**: Player participation in matches
- **PlayerScore**: Player statistics per match
- **Ball**: Ball-by-ball scoring data
- **RegisteredPlayer**: Player registry (independent of user accounts)
- **Team**: Cricket teams
- **TeamPlayer**: Team roster
- **Tournament**: Tournament management
- **TournamentTeam**: Tournament participants
- **TournamentFixture**: Tournament match schedule

## Prisma Migrations

To create a new migration after schema changes:

```bash
npx prisma migrate dev --name description_of_changes
```

To apply migrations in production:

```bash
npm run prisma:deploy
```

## Development Tools

**Prisma Studio** - Visual database browser:
```bash
npm run prisma:studio
```

This opens a web interface at `http://localhost:5555` to view and edit database records.

## Error Handling

The API uses standard HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

All errors return JSON in the format:
```json
{
  "error": "Error message description"
}
```

## Logging

The application uses **Winston** for application logging and **Morgan** for HTTP request logging.

### Log Levels

- `error` - Error messages (saved to `logs/error.log`)
- `warn` - Warning messages
- `info` - Informational messages (default)
- `http` - HTTP request logs
- `debug` - Debug messages

### Configuration

Set the log level in your `.env` file:
```env
LOG_LEVEL=info
NODE_ENV=development
```

### Log Files

- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only
- Console output - Colored logs in development

### HTTP Request Logging

All HTTP requests are automatically logged with:
- Remote address
- HTTP method
- URL
- Status code
- Response size
- Response time

Example:
```
2026-04-21 16:03:45 [http]: ::1 POST /api/login 200 156 - 45.2 ms
```

### Application Logging

Use the logger in your code:
```javascript
const logger = require('./utils/logger');

logger.info('User logged in successfully');
logger.warn('Database connection slow');
logger.error('Failed to upload file');
logger.debug('Processing request data');
```

## Security

- Passwords are hashed using bcrypt
- JWT tokens for authentication
- Role-based access control (RBAC)
- File upload validation (images only, 5MB limit)
- Environment variables for sensitive data
- Request/response logging for debugging

## Contributing

When adding new features:
1. Create controller in `src/controllers/`
2. Define routes in `src/routes/`
3. Update Prisma schema if needed
4. Run migrations
5. Update this README

## License

ISC
