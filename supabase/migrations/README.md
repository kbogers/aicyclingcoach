# Database Migrations

This folder contains SQL migration files for the AI Cycling Coach application database.

## Migration Files

1. **`001_initial_users_table.sql`** - Creates the users table with all necessary columns, policies, and triggers
2. **`002_activities_table.sql`** - Creates the activities table with foreign key relationships and indexes
3. **`003_add_last_sync_to_users.sql`** - Adds the `last_sync` column to existing users table (if needed)
4. **`999_complete_fresh_setup.sql`** - Complete setup that combines all migrations and handles existing tables

## How to Use

### For a Fresh Database
Use the complete setup migration:
```sql
-- Copy and paste the contents of 999_complete_fresh_setup.sql
-- into the Supabase SQL Editor
```

### For Incremental Updates
Run migrations in order:
1. Run `001_initial_users_table.sql`
2. Run `002_activities_table.sql`
3. Run `003_add_last_sync_to_users.sql` (if needed)

### In Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of the desired migration file
4. Paste into a new query
5. Click "Run" to execute

## Important Notes

- **`999_complete_fresh_setup.sql`** will drop and recreate the activities table (losing all activity data)
- Use incremental migrations if you want to preserve existing data
- All tables have Row Level Security (RLS) enabled
- Policies ensure users can only access their own data
- Indexes are created for optimal query performance

## Schema Overview

### Users Table
- `id` (UUID, Primary Key)
- `email` (Text, Unique)
- `name` (Text)
- `strava_user_id` (Text, Unique)
- `strava_access_token` (Text)
- `strava_refresh_token` (Text)
- `strava_expires_at` (Timestamp)
- `ftp` (Integer)
- `lthr` (Integer)
- `last_sync` (Timestamp)
- `created_at`, `updated_at` (Timestamps)

### Activities Table
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key)
- `strava_activity_id` (Text)
- Activity details: name, type, distance, time, etc.
- Power and heart rate metrics
- `created_at`, `updated_at` (Timestamps)

## Troubleshooting

If you encounter errors:
1. Check that you're connected to the correct Supabase project
2. Ensure you have the necessary permissions
3. Try the complete fresh setup if incremental migrations fail
4. Check the Supabase logs for detailed error messages 