import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Strava OAuth function called');
    
    // Parse request body
    const { code } = await req.json()
    console.log('Received code:', code ? 'present' : 'missing');

    if (!code) {
      throw new Error('Authorization code is required')
    }

    // Get Strava credentials from environment
    const stravaClientId = Deno.env.get('STRAVA_CLIENT_ID')
    const stravaClientSecret = Deno.env.get('STRAVA_CLIENT_SECRET')

    console.log('Strava credentials:', {
      clientId: stravaClientId ? 'present' : 'missing',
      clientSecret: stravaClientSecret ? 'present' : 'missing'
    });

    if (!stravaClientId || !stravaClientSecret) {
      throw new Error('Strava credentials not configured')
    }

    // Exchange authorization code for access token
    console.log('Exchanging code with Strava...');
    const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: stravaClientId,
        client_secret: stravaClientSecret,
        code: code,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error('Strava token exchange failed:', errorData);
      throw new Error(`Strava token exchange failed: ${errorData}`)
    }

    const tokenData = await tokenResponse.json()
    console.log('Token data received from Strava');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Store or update user data in Supabase
    console.log('Storing user data in Supabase...');
    const userData = {
      strava_user_id: tokenData.athlete.id.toString(),
      email: tokenData.athlete.email || `strava_${tokenData.athlete.id}@temp.com`,
      name: `${tokenData.athlete.firstname || ''} ${tokenData.athlete.lastname || ''}`.trim(),
      strava_access_token: tokenData.access_token,
      strava_refresh_token: tokenData.refresh_token,
      strava_expires_at: new Date(tokenData.expires_at * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    };

    // First try to update existing user, then insert if not found
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('strava_user_id', tokenData.athlete.id.toString())
      .single();

    let upsertError: any = null;
    if (existingUser) {
      // Update existing user
      const { error } = await supabase
        .from('users')
        .update(userData)
        .eq('strava_user_id', tokenData.athlete.id.toString());
      upsertError = error;
    } else {
      // Insert new user
      const { error } = await supabase
        .from('users')
        .insert({ ...userData, created_at: new Date().toISOString() });
      upsertError = error;
    }

    if (upsertError) {
      console.error('Error storing user data:', upsertError)
      throw new Error(`Failed to store user data: ${upsertError.message}`)
    }

    console.log('User data stored successfully');

    // Return the tokens and user info
    return new Response(
      JSON.stringify({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: tokenData.expires_at,
        athlete: tokenData.athlete,
        success: true,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Strava OAuth error:', error)
    
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
}) 