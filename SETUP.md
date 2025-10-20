# BANB Setup Quick Reference

This is a step-by-step guide to get BANB running locally.

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works)
- Git installed

## Step-by-Step Setup

### Step 1: Clone and Install

```bash
# If not already done
git clone <your-repo-url>
cd banb

# Install dependencies
npm install
```

### Step 2: Create Supabase Project

1. Go to https://app.supabase.com
2. Click **New Project**
3. Fill in:
   - **Name**: banb (or your preferred name)
   - **Database Password**: (generate a strong password)
   - **Region**: Choose closest to you
4. Click **Create new project**
5. Wait for project to be ready (~2 minutes)

### Step 3: Get Supabase Keys

1. In your Supabase project dashboard, click **Settings** (gear icon)
2. Click **API** in the left sidebar
3. You'll see:
   - **Project URL** - This is your `NEXT_PUBLIC_SUPABASE_URL`
   - **Project API keys**:
     - **anon public** - This is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - **service_role** - This is your `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

### Step 4: Configure Environment Variables

```bash
# Copy the example file
cp .env.example .env.local

# Open .env.local in your editor and fill in:
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
NEXT_PUBLIC_URL=http://localhost:3000
```

**Important**: Never commit `.env.local` to git! It's already in `.gitignore`.

### Step 5: Create Database Tables

1. In your Supabase project, click **SQL Editor** in the left sidebar
2. Click **New Query**
3. Open `supabase/dump.sql` in your code editor
4. Copy **all** the SQL (it's a long file)
5. Paste into the Supabase SQL Editor
6. Click **Run** (or press Cmd/Ctrl + Enter)
7. Wait for "Success. No rows returned" message

### Step 6: Verify Database Setup

In the Supabase SQL Editor, run this query:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'recipients', 'transactions', 'ai_operations')
ORDER BY table_name;
```

You should see 4 rows returned with the table names.

### Step 7: Start Development Server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

### Step 8: Test the Application

1. Click **Login** or **Sign Up**
2. Connect your Farcaster wallet
3. Complete the profile setup
4. You should see the banking dashboard

## Common Issues

### "supabaseUrl is required"
- Check that `NEXT_PUBLIC_SUPABASE_URL` is set in `.env.local`
- Make sure the variable name has the `NEXT_PUBLIC_` prefix
- Restart the dev server after changing env vars

### "Could not find the table 'public.profiles'"
- Make sure you ran the migration SQL in Step 5
- Check that all tables were created in Step 6
- Verify you're connected to the correct Supabase project

### "Invalid API key"
- Double-check you copied the correct keys from Supabase
- Make sure there are no extra spaces or line breaks
- Verify the keys match your project (not another project)

### Changes to .env.local not taking effect
- Restart the Next.js dev server (`Ctrl+C` then `npm run dev`)
- Clear your browser cache
- Check for typos in variable names

## What's Next?

After successful setup:

1. ✅ Profile creation works
2. ✅ Dashboard shows balance
3. ✅ Can add recipients
4. ✅ Can send test payments

See the main [README.md](./README.md) for more information about the project structure and features.

## Getting Help

- Review the [Migration README](./supabase/migrations/README.md) for database issues
- Check the [MVP Spec](./.kiro/specs/farcaster-miniapp-mvp/README.md) for feature details
- Review the [Design Doc](./.kiro/specs/farcaster-miniapp-mvp/design.md) for architecture

## Development Workflow

```bash
# Start dev server
npm run dev

# Run linter
npm run lint

# Build for production
npm run build

# Start production server
npm start
```

## Port Information

- **3000** - Next.js dev server
- **54321** - Supabase local instance (if using Supabase CLI)

## Useful Supabase Dashboard Links

From your project dashboard:
- **Table Editor** - View/edit data directly
- **SQL Editor** - Run custom queries
- **Authentication** - Manage users
- **API Docs** - Auto-generated API documentation
- **Logs** - View database and API logs

Happy coding! 🚀
