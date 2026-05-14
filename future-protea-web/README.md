# Future Protea - Cricket Management Admin

A modern, production-grade cricket management system built with React, TypeScript, and Vite. Manage matches, players, teams, tournaments, and analytics with a beautiful, responsive admin interface.

## 🏏 Features

### Cricket Management
- **Matches** - Create, schedule, and manage cricket matches with live scoring
- **Players** - Comprehensive player profiles with statistics and performance tracking
- **Teams** - Team management with roster, rankings, and match history
- **Tournaments** - Tournament creation, brackets, and standings
- **Analytics** - Advanced cricket analytics and performance insights
- **Reports** - Generate detailed reports for matches, players, and tournaments

### Admin Features
- **Dashboard** - Real-time cricket statistics and system health monitoring
- **User Management** - Role-based access control (Admin, Manager, Coach, Player)
- **Support** - Integrated support ticket system
- **Announcements** - Broadcast announcements to users
- **System Settings** - Configure application settings and preferences

### UI/UX
- **Modern Design** - Beautiful, cricket-themed interface with animations
- **Dark/Light Mode** - Customizable theme with 12+ color palettes
- **Responsive** - Mobile-first design that works on all devices
- **Accessible** - WCAG compliant with keyboard navigation
- **Animations** - Smooth transitions with Framer Motion and Lottie

## 🚀 Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: TailwindCSS 4, shadcn/ui components
- **State Management**: TanStack Query (React Query)
- **Routing**: React Router v7
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **Animations**: Framer Motion, Lottie React
- **Icons**: Lucide React
- **HTTP Client**: Axios

## 📦 Installation

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Update .env with your backend API URL
VITE_API_BASE_URL=http://localhost:5000/api
```

## 🛠️ Development

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Lint code
pnpm lint
```

## 🌍 Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

For production, use your production API URL.

## 📁 Project Structure

```
src/
├── Admin/              # Admin feature modules
│   ├── Dashboard/      # Cricket dashboard
│   ├── Matches/        # Match management
│   ├── Players/        # Player management
│   ├── Teams/          # Team management
│   ├── Tournaments/    # Tournament management
│   ├── Analytics/      # Cricket analytics
│   ├── Reports/        # Report generation
│   └── ...
├── Auth/               # Authentication
├── components/         # Reusable UI components
│   └── ui/            # shadcn/ui components
├── services/          # API services
│   ├── cricket/       # Cricket-specific services
│   └── admin/         # Admin services
├── hooks/             # Custom React hooks
├── lib/               # Utilities and helpers
├── types/             # TypeScript type definitions
└── contexts/          # React context providers
```

## 🎨 Customization

### Theme Colors
The app supports 12+ color palettes. Users can customize:
- Primary color palette
- Font family (12 options)
- Dark/Light mode
- Color depth and intensity

### Permissions
Role-based permissions for:
- Matches (view, create, update, delete, publish)
- Players (view, create, update, delete)
- Teams (view, create, update, delete)
- Tournaments (view, create, update, delete)
- Users, Support, Reports, Settings, Notifications

## 🔐 Authentication

The app uses JWT-based authentication with:
- Email/password login
- Role-based access control
- Protected routes
- Automatic token refresh
- Session management

## 📱 Responsive Design

Optimized for:
- Desktop (1920px+)
- Laptop (1280px - 1919px)
- Tablet (768px - 1279px)
- Mobile (320px - 767px)

## 🚢 Deployment

### Build

```bash
pnpm build
```

The build output will be in the `dist/` directory.

### Deploy to Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

### Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

## 📄 License

Proprietary - Future Protea Cricket Management System

## 🤝 Support

For support, contact the development team or create a support ticket in the admin panel.
