# 🚨 URGENT: Edge Function Update Required

The app is still failing because the Edge Function needs to be redeployed with the latest changes that fix the user lookup issue.

## What's Been Fixed

1. **Edge Function**: Now returns the complete user data directly, avoiding the database lookup timing issue
2. **AuthProvider**: Uses the user data from the Edge Function response instead of making a separate database call
3. **Better Error Handling**: Fallback mechanism if Edge Function doesn't include user data

## Steps to Fix

### Step 1: Redeploy Edge Function

You need to redeploy the Supabase Edge Function with the latest code:

```bash
# Make sure you're in the project directory
cd /path/to/your/project

# Deploy the updated function
supabase functions deploy strava-oauth
```

If you don't have Supabase CLI set up, you can also:
1. Go to **Supabase Dashboard** → **Edge Functions**
2. **Delete** the existing `strava-oauth` function
3. **Create new function** with the updated code from `supabase/functions/strava-oauth/index.ts`

### Step 2: Clear Browser Data

1. **Open browser dev tools** (F12)
2. **Go to Application/Storage tab**
3. **Clear all localStorage** (or just delete `strava_user` entry)
4. **Clear all cookies** for your domain
5. **Hard refresh** the page (Ctrl+Shift+R or Cmd+Shift+R)

### Step 3: Test the Login Flow

1. **Restart your dev server**: `npm run dev`
2. **Go to the app** and click "Connect with Strava"
3. **Complete the OAuth flow**
4. **Check browser console** for any errors

## Expected Result

After the fix, you should see:
- ✅ **No database lookup errors** in console
- ✅ **Successful login** and redirect to dashboard
- ✅ **User data properly loaded** with correct UUID
- ✅ **Activities sync working** without errors

## What Changed in the Code

### Edge Function (`supabase/functions/strava-oauth/index.ts`):
- Now uses `upsert()` instead of separate insert/update logic
- Returns the complete user record in the response as `dbUser`
- More reliable user creation/update process

### AuthProvider (`src/components/AuthProvider.tsx`):
- First tries to use `userData.dbUser` from Edge Function response
- Only falls back to database lookup if needed
- Eliminates the timing issue between user creation and lookup

## Troubleshooting

### If you still see "Failed to fetch user data":
1. **Check Supabase logs** in dashboard for Edge Function errors
2. **Verify environment variables** are set correctly
3. **Make sure the activities table exists** (from previous migration)

### If login succeeds but activities don't load:
1. **Check if database migration was completed** successfully
2. **Verify RLS policies** are working correctly
3. **Check browser console** for specific database errors

---

**⚠️ The Edge Function MUST be redeployed for the fix to work!** 