# Database Scripts

This directory contains utility scripts for managing the GameGen database.

## Template Seed Data

### `seed-templates.sql`

Adds sample game templates to populate the featured templates API endpoint.

**What it creates:**
- 1 system user profile (`gamegen_official`)
- 4 sample games with different genres and difficulty levels
- 4 corresponding template records
- Mock play session data to make templates appear active

**How to apply:**

1. **Via Supabase Dashboard:**
   - Go to https://supabase.com/dashboard/project/ajwskzlxlvhkhlbedtrg
   - Navigate to SQL Editor
   - Copy and paste the contents of `seed-templates.sql`
   - Execute the script

2. **Via Supabase CLI (if working):**
   ```bash
   # From project root
   psql "postgresql://postgres:[password]@db.ajwskzlxlvhkhlbedtrg.supabase.co:5432/postgres" < scripts/seed-templates.sql
   ```

3. **Via automated deployment script:**
   ```bash
   # From project root
   ./scripts/deploy_seed_data.sh
   ```

**Templates created:**
- Simple Platformer (Beginner)
- Space Shooter (Intermediate)  
- Puzzle Game (Beginner)
- RPG Adventure (Advanced)

After applying this seed data, the `/api/templates/featured` endpoint will return populated results instead of empty arrays.