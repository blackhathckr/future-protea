# Future Protea - Cricket Match Management System

A comprehensive cricket match management platform featuring live scoring, player statistics, team management, and tournament organization. Built with Flutter mobile app and Node.js backend.

![Platform](https://img.shields.io/badge/Platform-Android%20%7C%20iOS-blue)
![Backend](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-green)
![Database](https://img.shields.io/badge/Database-PostgreSQL-blue)
![Mobile](https://img.shields.io/badge/Mobile-Flutter-02569B)

## 🏏 Overview

Future Protea is a complete cricket management ecosystem designed for youth cricket programs, academies, and local leagues. The platform provides:

- **Live Ball-by-Ball Scoring** - Real-time match scoring with detailed statistics
- **Player Profiles** - Comprehensive player statistics and career tracking
- **Team Management** - Create and manage cricket teams with rosters
- **Tournament Organization** - Full tournament management with fixtures, standings, and statistics
- **Multi-Role System** - Separate interfaces for viewers, players, and match feeders
- **Dark/Light Theme** - Professional UI with theme switching

## 📱 Features

### For Viewers
- Browse live, upcoming, and completed matches
- View detailed match scorecards with ball-by-ball commentary
- Search and explore player profiles with career statistics
- Follow tournament standings and fixtures
- Real-time score updates

### For Players
- Personal dashboard with career highlights
- Detailed batting and bowling statistics
- Match history and performance trends
- Upcoming match schedule
- Tournament participation tracking
- Profile management with photo upload

### For Feeders (Match Officials)
- Live ball-by-ball scoring interface
- Match creation and management
- Player approval and team assignment
- Tournament fixture scheduling
- Comprehensive scoring controls (runs, wickets, extras, boundaries)
- Undo functionality and match state management

### Match Features
- Complete scorecard with batting and bowling statistics
- Ball-by-ball commentary
- Wagon wheel shot tracking
- Partnership tracking
- Over-by-over progression
- Player of the Match selection
- Toss and innings management
- Injury substitution support

### Tournament Features
- Multi-team tournament creation
- Fixture scheduling with groups
- Points table with NRR calculation
- Tournament-wide statistics (top scorers, wicket-takers)
- Completed match results with scores
- Man of the Match tracking

## 🛠️ Technology Stack

### Mobile App (Flutter)
- **Framework**: Flutter 3.x
- **Language**: Dart
- **State Management**: Provider
- **UI Components**: Material Design 3
- **Animations**: flutter_animate
- **Charts**: fl_chart
- **Fonts**: Google Fonts (Poppins)
- **Image Handling**: image_picker
- **HTTP Client**: http package
- **Date Formatting**: intl

### Backend (Node.js)
- **Runtime**: Node.js
- **Framework**: Express.js
- **ORM**: Prisma
- **Database**: PostgreSQL (Docker)
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **File Storage**: Supabase Storage
- **File Upload**: Multer
- **Logging**: Winston + Morgan
- **Validation**: express-validator

### Infrastructure
- **Database**: PostgreSQL 15 (Docker container)
- **Storage**: Supabase (cricket-app bucket)
- **Development**: Docker Compose for database
- **Version Control**: Git

## 📂 Project Structure

```
future_protea/
├── backend/                    # Node.js API server
│   ├── prisma/
│   │   └── schema.prisma      # Database schema
│   ├── src/
│   │   ├── config/            # Configuration (DB, Supabase)
│   │   ├── controllers/       # Business logic
│   │   ├── middleware/        # Auth & upload middleware
│   │   ├── routes/            # API routes
│   │   ├── services/          # External services
│   │   ├── utils/             # Utilities & helpers
│   │   └── app.js             # Express app entry
│   ├── seeders/               # Database seed scripts
│   ├── logs/                  # Application logs
│   ├── .env                   # Environment variables
│   └── package.json
│
└── protea-app/                # Flutter mobile application
    ├── lib/
    │   ├── models/            # Data models
    │   ├── screens/           # UI screens
    │   │   ├── auth/          # Login, register
    │   │   ├── feeder/        # Live scoring, match management
    │   │   ├── player/        # Player dashboard, journey
    │   │   ├── teams/         # Team management
    │   │   ├── tournaments/   # Tournament features
    │   │   ├── viewer/        # Match viewing, player search
    │   │   └── profile/       # User profile
    │   ├── services/          # API service, auth provider
    │   ├── theme/             # App theme (dark/light)
    │   └── widgets/           # Reusable components
    ├── assets/
    │   └── protea_logo.png    # App logo
    ├── android/               # Android configuration
    ├── ios/                   # iOS configuration
    └── pubspec.yaml           # Flutter dependencies
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** 16+ and npm/pnpm
- **Flutter** 3.0+
- **Docker** and Docker Compose (for PostgreSQL)
- **Git**
- **Supabase Account** (for file storage)

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your values:
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/cricket_match_db"
   JWT_SECRET="your-secret-key-here"
   PORT=5000
   NODE_ENV=development
   
   # Supabase Storage
   SUPABASE_URL="your-supabase-url"
   SUPABASE_KEY="your-supabase-anon-key"
   SUPABASE_BUCKET="cricket-app"
   ```

4. **Start PostgreSQL with Docker**
   ```bash
   docker-compose up -d
   ```

5. **Run database migrations**
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

6. **Seed the database (optional)**
   ```bash
   npm run prisma:seed
   ```

7. **Start the development server**
   ```bash
   npm run dev
   ```
   
   Backend will run on `http://localhost:5000`

### Flutter App Setup

1. **Navigate to app directory**
   ```bash
   cd protea-app
   ```

2. **Install dependencies**
   ```bash
   flutter pub get
   ```

3. **Update API endpoint**
   
   Edit `lib/services/api_service.dart`:
   ```dart
   static const String baseUrl = 'http://YOUR_IP:5000/api';
   ```
   
   Replace `YOUR_IP` with your local IP address (not localhost for physical devices)

4. **Run the app**
   ```bash
   flutter run
   ```

## 🎨 UI/UX Features

### Design System
- **Pure Black Dark Theme** - OLED-friendly dark mode with `#000000` background
- **Material Design 3** - Modern, clean interface
- **Poppins Font** - Professional typography throughout
- **Consistent Color Palette**:
  - Primary Green: `#1B5E20`
  - Accent Gold: `#FFD600`
  - Wicket Red: `#FF1744`
  - Boundary Green: `#00E676`
  - Six Yellow: `#FFD600`

### Professional Touches
- Rounded search bars with proper border clipping
- Smooth animations and transitions
- Context-aware icon colors
- Gradient headers with team branding
- Responsive layouts for all screen sizes
- Loading states and error handling
- Pull-to-refresh on all lists

## 📊 Database Schema

Key models include:

- **User** - System users with roles (viewer, player, feeder)
- **Match** - Cricket matches with toss, innings, and scores
- **MatchPlayer** - Player participation and approval
- **PlayerScore** - Batting and bowling statistics per match
- **Ball** - Ball-by-ball scoring data with shot zones
- **RegisteredPlayer** - Player registry with photos and details
- **Team** - Cricket teams with logos
- **TeamPlayer** - Team rosters
- **Tournament** - Tournament management
- **TournamentTeam** - Tournament participants
- **TournamentFixture** - Match fixtures with results

## 🔐 Authentication & Authorization

### User Roles

1. **Viewer** (Default)
   - View matches and scorecards
   - Browse players and teams
   - Follow tournaments

2. **Player**
   - All viewer permissions
   - Personal dashboard and statistics
   - Join matches
   - Profile management

3. **Feeder** (Match Official)
   - All player permissions
   - Create and manage matches
   - Live scoring interface
   - Approve players
   - Create tournaments and teams

### Security Features
- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control (RBAC)
- Protected API routes
- Secure file upload validation
- Environment variable protection

## 📡 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints
- `POST /register` - Register new user
- `POST /login` - Login user
- `GET /me` - Get current user

### Match Endpoints
- `GET /matches?status=live|upcoming|completed` - List matches
- `GET /matches/:id` - Match details
- `POST /matches` - Create match (feeder)
- `GET /matches/:id/scorecard` - Detailed scorecard
- `POST /matches/:id/ball` - Record ball (feeder)
- `DELETE /matches/:id/ball/last` - Undo last ball (feeder)

### Player Endpoints
- `GET /players/all` - All players
- `GET /players/me/profile` - Current player profile
- `GET /players/:id/journey` - Player statistics

### Team Endpoints
- `GET /teams` - All teams
- `POST /teams` - Create team (feeder)
- `POST /teams/:id/players` - Add player to team

### Tournament Endpoints
- `GET /tournaments` - All tournaments
- `GET /tournaments/:id/fixtures` - Tournament fixtures
- `GET /tournaments/:id/standings` - Points table
- `GET /tournaments/:id/stats` - Tournament statistics

See [backend/README.md](backend/README.md) for complete API documentation.

## 🎯 Key Features Implementation

### Live Scoring
- Ball-by-ball recording with runs, wickets, extras
- Shot zone tracking (wagon wheel)
- Partnership tracking
- Over completion with automatic strike rotation
- Undo functionality
- Innings management
- Wicket types (bowled, caught, LBW, run out, etc.)
- Extras (wide, no-ball, bye, leg-bye)

### Statistics Tracking
- Batting: Runs, balls, strike rate, 4s, 6s
- Bowling: Overs, maidens, runs, wickets, economy
- Career aggregates across all matches
- Recent form tracking
- Tournament-specific stats

### Tournament Management
- Group-based fixtures
- Points calculation (Win: 2, Tie: 1, Loss: 0)
- Net Run Rate (NRR) calculation
- Top performers leaderboards
- Match results with scores
- Fixture scheduling

## 🐛 Known Issues & Solutions

### Search Bar Rounded Corners
If search bars appear rectangular instead of rounded, perform a **full app restart** (not hot reload):
```bash
flutter clean
flutter run
```

### Dark Theme Text Visibility
Profile screen labels now have explicit colors for dark theme visibility. Restart app to see changes.

## 🔄 Recent Updates

- ✅ Pure black dark theme (`#000000` background)
- ✅ Professional color palette for live scoring
- ✅ Rounded search bars with proper border clipping
- ✅ Dark theme text visibility fixes
- ✅ Tournament stats UI improvements
- ✅ Fixture cards with inline scores
- ✅ Player search and filtering
- ✅ Team management interface

## 📝 Development Workflow

### Adding New Features

1. **Backend**:
   - Update Prisma schema if needed
   - Create/update controller
   - Define routes
   - Run migrations
   - Test with Postman/Thunder Client

2. **Flutter**:
   - Create/update models
   - Build UI screens
   - Integrate API service
   - Test on device

### Database Changes

```bash
# Create migration
npx prisma migrate dev --name feature_description

# Apply in production
npm run prisma:deploy

# View database
npm run prisma:studio
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

ISC

## 👥 Team

**Future Protea Development Team**

## 🙏 Acknowledgments

- Flutter team for the amazing framework
- Prisma for the excellent ORM
- Supabase for file storage
- Material Design team for design guidelines

---

**Built with ❤️ for cricket enthusiasts**
