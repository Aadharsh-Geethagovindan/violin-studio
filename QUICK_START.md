# Quick Start Guide - Violet Violin Studio

## Immediate Next Steps

### 1. Navigate to Project & Install Dependencies

```bash
cd violet-violin-studio
npm install
```

This will install all required packages (~2-3 minutes).

### 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the database to initialize (~2 minutes)
3. Go to Project Settings > API
4. Copy your:
   - Project URL
   - Anon/Public key

### 3. Configure Environment Variables

```bash
# Create .env file from template
cp .env.example .env

# Edit .env and add your Supabase credentials:
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Create Database Tables

In your Supabase dashboard, go to SQL Editor and run this schema:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'parent', 'instructor', 'admin')),
  full_name TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Instructors table
CREATE TABLE instructors (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INTEGER,
  teaching_experience TEXT NOT NULL,
  bio TEXT NOT NULL,
  image_url TEXT,
  contact_info TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scheduling slots table
CREATE TABLE scheduling_slots (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  instructor_id UUID REFERENCES instructors(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'pending', 'confirmed', 'rejected')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content sections table (for editable page content)
CREATE TABLE content_sections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  page TEXT NOT NULL,
  section_key TEXT NOT NULL,
  content TEXT NOT NULL,
  content_type TEXT DEFAULT 'text' CHECK (content_type IN ('text', 'html', 'markdown')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(page, section_key)
);

-- Camp signups table
CREATE TABLE camp_signups (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_name TEXT NOT NULL,
  parent_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  age INTEGER,
  additional_info TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'waitlist')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_scheduling_slots_instructor ON scheduling_slots(instructor_id);
CREATE INDEX idx_scheduling_slots_student ON scheduling_slots(student_id);
CREATE INDEX idx_scheduling_slots_start_time ON scheduling_slots(start_time);
CREATE INDEX idx_content_sections_page ON content_sections(page);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduling_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE camp_signups ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for instructors
CREATE POLICY "Instructors are viewable by everyone" ON instructors
  FOR SELECT USING (true);

CREATE POLICY "Only admins and instructors can modify instructor data" ON instructors
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'instructor')
    )
  );

-- RLS Policies for scheduling_slots
CREATE POLICY "Users can view their own slots" ON scheduling_slots
  FOR SELECT USING (
    student_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM instructors
      WHERE instructors.id = scheduling_slots.instructor_id
      AND instructors.profile_id = auth.uid()
    )
  );

CREATE POLICY "Students can create booking requests" ON scheduling_slots
  FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "Instructors can manage their slots" ON scheduling_slots
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM instructors
      WHERE instructors.id = scheduling_slots.instructor_id
      AND instructors.profile_id = auth.uid()
    )
  );

-- RLS Policies for content_sections
CREATE POLICY "Content is viewable by everyone" ON content_sections
  FOR SELECT USING (true);

CREATE POLICY "Only admins and instructors can modify content" ON content_sections
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'instructor')
    )
  );

-- RLS Policies for camp_signups
CREATE POLICY "Only admins can view camp signups" ON camp_signups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Anyone can create camp signup" ON camp_signups
  FOR INSERT WITH CHECK (true);

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample content for home page
INSERT INTO content_sections (page, section_key, content, content_type) VALUES
('home', 'studio_intro', 'Discover the art of violin playing in a nurturing, professional environment. Our experienced instructors are dedicated to helping students of all ages and skill levels achieve their musical goals.', 'text');
```

### 5. Start Development Server

```bash
npm run dev
```

Open http://localhost:5173 in your browser!

## What's Included

✅ **Home Page** - Hero, intro, gallery placeholders
✅ **Instructors Page** - Dynamic profiles from database
✅ **Login/Signup** - Full authentication system
✅ **Navigation** - Responsive navbar with auth state
✅ **Authentication Context** - User session management
✅ **TypeScript Types** - Full type definitions
✅ **Tailwind Theme** - Custom violet color palette
✅ **Supabase Integration** - Database & auth configured

## Project Structure

```
violet-violin-studio/
├── src/
│   ├── components/     # Navbar, etc.
│   ├── pages/          # Home, Instructors, Login
│   ├── lib/            # Supabase client, Auth context
│   ├── types/          # TypeScript definitions
│   └── styles/         # Tailwind CSS
├── public/             # Static assets
└── Configuration files
```

## Testing the Setup

1. **Sign up** for a new account at `/login`
2. **Check Supabase** - Profile should be created automatically
3. **Navigate** between pages using the navbar
4. **View instructors** - Should show empty state (add sample data in Supabase)

## Adding Sample Instructor

In Supabase SQL Editor:

```sql
-- First, create an instructor profile (replace with your user ID)
INSERT INTO instructors (name, teaching_experience, bio, display_order) VALUES
('Sarah Johnson', '15 years of teaching experience', 'Sarah is a classically trained violinist with a passion for teaching students of all ages. She specializes in Suzuki method and traditional classical training.', 1);
```

## Next Development Steps

1. ⏳ Build scheduling interface
2. ⏳ Add inline content editing
3. ⏳ Create Camp page
4. ⏳ Implement media gallery
5. ⏳ Add admin dashboard

## Troubleshooting

**Dependencies won't install?**
- Ensure Node.js v18+ is installed: `node --version`

**Supabase errors?**
- Check `.env` file has correct credentials
- Ensure database schema has been created

**Page won't load?**
- Clear browser cache
- Check browser console for errors

## Support

Need help? The project is ready to run - just follow the steps above!

---

**You're all set!** 🎻 Start with `npm install` and then `npm run dev`.
