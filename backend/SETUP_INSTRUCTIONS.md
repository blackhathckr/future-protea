# Backend Setup Instructions

## Prerequisites
- Node.js installed
- PostgreSQL running
- `.env` file configured

## Step 1: Install Dependencies
```bash
cd backend
npm install
```

## Step 2: Setup Database
```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# (Optional) Seed database with test data
npm run prisma:seed
```

## Step 3: Verify .env Configuration
Create `.env` file in backend directory:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/future_protea
JWT_SECRET=your-secret-key-here
NODE_ENV=development
PORT=5000
LOG_LEVEL=info
```

## Step 4: Start Backend Server
```bash
npm run dev
```

Expected output:
```
============================================================
Cricket Match Management API Server Started
============================================================
Port: 5000
Environment: development
Log Level: info
Health Check: http://localhost:5000/health
Logs Directory: ./logs/
============================================================

Server ready to accept requests...
```

## Step 5: Verify Backend is Running
Test health endpoint:
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{"status":"ok","message":"Server is running"}
```

## Step 6: Test Login Endpoint
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cricket.com","password":"password123"}'
```

Expected response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "...",
    "name": "Admin",
    "email": "admin@cricket.com",
    "role": "admin",
    "approved": true
  }
}
```

## Troubleshooting

### 404 Error on Login
- Ensure backend was restarted after code changes
- Check that routes are properly mounted at `/api`
- Verify database is initialized

### Database Connection Error
- Check PostgreSQL is running
- Verify `DATABASE_URL` in `.env`
- Run migrations: `npm run prisma:migrate`

### Port Already in Use
- Change `PORT` in `.env`
- Or kill process on port 5000:
  ```bash
  # Windows
  netstat -ano | findstr :5000
  taskkill /PID <PID> /F
  
  # Mac/Linux
  lsof -i :5000
  kill -9 <PID>
  ```

## Routes Available

All routes are prefixed with `/api`:

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Matches
- `GET /api/matches` - List matches
- `POST /api/matches` - Create match
- `GET /api/matches/:id` - Get match details
- `PUT /api/matches/:id` - Update match
- `DELETE /api/matches/:id` - Delete match

### Teams
- `GET /api/teams` - List teams
- `POST /api/teams` - Create team
- `GET /api/teams/:id` - Get team details
- `DELETE /api/teams/:id` - Delete team

### Players
- `GET /api/players` - List players
- `POST /api/players` - Register player
- `GET /api/players/:id` - Get player details
- `POST /api/players/:id/approve` - Approve player
- `DELETE /api/players/:id` - Delete player

### Tournaments
- `GET /api/tournaments` - List tournaments
- `POST /api/tournaments` - Create tournament
- `GET /api/tournaments/:id` - Get tournament details
- `DELETE /api/tournaments/:id` - Delete tournament

## Important Notes

1. **Code Changes Made:**
   - `src/app.ts`: Added `/api` prefix to routes
   - `src/routes/index.ts`: Removed duplicate `/api` prefix

2. **Must Restart Backend:**
   - Stop current backend process (Ctrl+C)
   - Run `npm run dev` again
   - Verify new routes are loaded

3. **Database:**
   - Ensure Prisma migrations are up to date
   - Check database has admin user for testing

---

**Status:** Ready for backend startup
**Next:** Follow steps 1-6 above
