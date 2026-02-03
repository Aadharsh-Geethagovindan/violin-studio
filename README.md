# Violet Violin Studio Website

A modern, full-featured website for Violet Violin Studio built with React, TypeScript, Tailwind CSS, and Supabase.

## Features

- 🎻 **Home Page**: Hero section, studio introduction, media gallery
- 👨‍🏫 **Instructor Profiles**: Detailed instructor pages with bios and teaching experience
- 🔐 **Authentication**: User login/signup with role-based access (students, parents, instructors, admin)
- 📅 **Scheduling System**: 30-minute lesson booking with instructor confirmation
- ✏️ **Inline Editing**: Content management for instructors/admins
- 🏕️ **Camp Page**: Summer camp information and signup form
- 📱 **Responsive Design**: Mobile-first design with Tailwind CSS

## Tech Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom violet theme
- **Backend**: Supabase (PostgreSQL + Auth)
- **Routing**: React Router v6
- **Build Tool**: Vite
- **Deployment**: Vercel (recommended)

## Project Structure

```
violet-violin-studio/
├── src/
│   ├── components/        # Reusable UI components
│   │   └── Navbar.tsx
│   ├── pages/            # Page components
│   │   ├── Home.tsx
│   │   ├── Instructors.tsx
│   │   └── Login.tsx
│   ├── lib/              # Utilities and configurations
│   │   ├── supabase.ts   # Supabase client
│   │   └── AuthContext.tsx
│   ├── types/            # TypeScript type definitions
│   │   └── index.ts
│   ├── styles/           # Global styles
│   │   └── index.css
│   ├── App.tsx           # Main app component
│   ├── main.tsx          # Entry point
│   └── vite-env.d.ts     # Vite type definitions
├── public/               # Static assets
├── index.html
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
└── vite.config.ts
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account

### Installation

1. **Clone or navigate to the project directory:**
   ```bash
   cd violet-violin-studio
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Update `.env` with your Supabase credentials:
     ```
     VITE_SUPABASE_URL=your_supabase_project_url
     VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

4. **Set up Supabase database:**
   - Create the following tables in your Supabase project (SQL schema will be provided separately)
   - Enable Row Level Security (RLS) policies
   - Configure authentication settings

5. **Start the development server:**
   ```bash
   npm run dev
   ```

6. **Open your browser:**
   - Navigate to `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Database Schema (To Be Created in Supabase)

You'll need to create the following tables:

1. **profiles** - User profiles with roles
2. **instructors** - Instructor detailed information
3. **scheduling_slots** - Class scheduling and bookings
4. **content_sections** - Editable page content
5. **camp_signups** - Camp registration data

*Detailed SQL schema will be provided in the next step.*

## Authentication Flow

1. Users sign up/login via `/login` page
2. User profile is created in `profiles` table with default role
3. Role determines access to features:
   - **Students/Parents**: Can request lesson slots
   - **Instructors**: Can confirm/reject requests, book slots directly, edit content
   - **Admin**: Full access to all features

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Manual Deployment

1. Build the project:
   ```bash
   npm run build
   ```

2. Deploy the `dist` folder to your hosting service

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous key |

## Customization

### Theme Colors

Edit `tailwind.config.js` to customize the violet color palette:

```javascript
colors: {
  violet: {
    50: '#faf5ff',
    // ... customize colors
  }
}
```

### Fonts

The project uses:
- **Inter** for body text
- **Playfair Display** for headings

Change fonts in `index.html` and `tailwind.config.js`.

## Next Steps

1. ✅ Project boilerplate created
2. ⏳ Create Supabase database schema
3. ⏳ Implement scheduling interface
4. ⏳ Add inline editing functionality
5. ⏳ Create Camp page
6. ⏳ Add media gallery
7. ⏳ Test and deploy

## Contributing

This is a private project for Violet Violin Studio.

## License

Proprietary - All rights reserved

---

**Need Help?** Contact the development team for support.
