# CricTail - Cricket Scoring Platform

A modern, production-grade cricket scoring application built for office and friendly Friday matches.

## Tech Stack

- **React 19** + **Vite** + **TypeScript**
- **TailwindCSS** + **shadcn/ui** components
- **TanStack Query** for server state management
- **Zustand** for client state management
- **React Router v7** for routing
- **Axios** for API calls
- **Framer Motion** for animations
- **Lucide React** for icons

## Features

### Authentication
- Registration with full name, mobile number, password
- Login with mobile number and password
- Forgot password with OTP flow
- JWT token-based auth with automatic token refresh
- Protected routes

### Match Management
- Create matches with multi-step wizard
- Team creation and player selection
- Search existing players or add new players
- Drag & drop batting order
- Captain and wicket keeper selection
- Support for same player in both teams
- Assign scorers

### Live Scoring
- Mobile-optimized scoring interface
- Large touch-friendly scoring buttons
- Dot ball, runs (1-6), wide, no ball, wicket
- Advanced wicket flow (bowled, caught, LBW, run out, stumped, hit wicket)
- Wide + runs calculation
- No ball + runs/wicket handling
- Automatic over completion detection
- Sticky score header with live updates
- Animated score transitions
- Boundary and six animations
- Undo last ball
- Ball-by-ball history
- Over progress visualization

### Public Views
- Live score without login
- Ball-by-ball commentary
- Full scorecards
- Partnership stats
- Required run rate calculations

### Design
- Dark mode first with light mode support
- System theme detection
- Mobile-first responsive design
- Premium sports UI aesthetic
- Glassmorphism effects
- Animated transitions
- Live match glow indicators

## Project Structure

```
src/
├── app/
│   └── App.tsx              # Root app component
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── cricket/             # Cricket-specific components
│   │   ├── LiveMatchCard.tsx
│   │   ├── ScoreHeader.tsx
│   │   ├── BatsmanDisplay.tsx
│   │   ├── BowlerDisplay.tsx
│   │   ├── OverProgress.tsx
│   │   └── ScoringButton.tsx
│   └── layout/              # Layout components
│       ├── Navbar.tsx
│       └── BottomNav.tsx
├── features/                # Feature modules
│   ├── auth/
│   ├── matches/
│   ├── scoring/
│   ├── teams/
│   └── players/
├── hooks/                   # Custom React Query hooks
│   ├── useAuth.ts
│   ├── useMatches.ts
│   └── usePlayers.ts
├── services/
│   ├── api/
│   │   └── client.ts        # Axios instance
│   └── mock/
│       ├── authMock.ts
│       ├── matchesMock.ts
│       └── playersMock.ts
├── store/                   # Zustand stores
│   ├── authStore.ts
│   ├── themeStore.ts
│   ├── scoringStore.ts
│   └── matchCreationStore.ts
├── routes/                  # Routing
│   ├── index.tsx
│   └── ProtectedRoute.tsx
├── layouts/
│   ├── MainLayout.tsx
│   ├── AuthLayout.tsx
│   └── ScoringLayout.tsx
├── pages/
│   ├── HomePage.tsx
│   ├── DashboardPage.tsx
│   ├── ProfilePage.tsx
│   ├── TeamsPage.tsx
│   ├── NotFoundPage.tsx
│   ├── auth/
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   └── ForgotPasswordPage.tsx
│   ├── matches/
│   │   ├── CreateMatchPage.tsx
│   │   ├── MatchDetailPage.tsx
│   │   └── ScorecardPage.tsx
│   ├── public/
│   │   └── LiveScorePage.tsx
│   └── scoring/
│       └── LiveScoringPage.tsx
├── types/
│   └── index.ts             # TypeScript interfaces
├── lib/
│   └── utils.ts             # Utility functions
├── styles/
│   └── globals.css          # Global styles
└── main.tsx                 # Entry point
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Demo Credentials
- Mobile: `9876543210`
- Password: `password123`
- OTP: `123456`

## API Integration

The frontend is structured to easily switch from mock data to real backend APIs:

1. All API calls go through `services/api/client.ts`
2. Mock services in `services/mock/` simulate backend behavior
3. To switch to real APIs, replace mock imports in hooks with actual API calls
4. The hook layer (`hooks/`) remains unchanged

### Backend Schema Alignment

The TypeScript types in `types/index.ts` map directly to your PostgreSQL schema:
- `users` → `User`
- `teams` → `Team`
- `matches` → `Match`
- `innings` → `Innings`
- `ball_events` → `BallEvent`
- `batting_scorecards` → `BattingScorecard`
- `bowling_scorecards` → `BowlingScorecard`
- `live_match` → `LiveMatchState`
- `player_career_stats` → `PlayerCareerStats`

## Scoring Logic

The scoring engine handles:
- Legal ball counting (excluding wides and no balls)
- Extra runs (wide, no ball, bye, leg bye)
- Boundary detection (4s and 6s)
- Strike rotation on odd runs
- Over completion after 6 legal balls
- Wicket types with proper cricket rules
- No ball wicket restrictions (no bowled/LBW)
- Run out on no balls allowed
- Automatic target calculation for second innings
- Required run rate calculations

## Future Enhancements

- WebSocket integration for real-time updates
- Push notifications for match events
- Player statistics and leaderboards
- Tournament management
- Photo/video uploads
- Social sharing
- Advanced analytics

## License

MIT
