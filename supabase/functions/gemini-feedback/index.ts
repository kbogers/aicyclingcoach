import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface TrainingAnalysisData {
  recentActivities: any[];
  goals: any[];
  timeInZones: any;
  restDays: number;
  weeklyStats: any;
  userProfile: any;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Starting gemini-feedback function...')
    
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')

    let user: any = null

    if (authHeader) {
      console.log('Authorization header present, creating Supabase client...')

      // Create Supabase client
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } }
      )

      // Get user from auth token
      console.log('Getting user from auth token...')
      const { data: { user: authUser }, error: userError } = await supabaseClient.auth.getUser()
      if (userError || !authUser) {
        console.warn('User authentication failed or no user found:', userError)
      } else {
        user = authUser
        console.log('User authenticated:', user.id)
      }
    } else {
      console.log('No authorization header provided; proceeding without Supabase auth')
    }

    // Parse request body
    console.log('Parsing request body...')
    const requestBody = await req.json()
    const { trainingData }: { trainingData: TrainingAnalysisData } = requestBody
    
    if (!trainingData) {
      console.error('No training data provided in request body')
      throw new Error('Training data is required')
    }
    
    console.log('Training data received:', {
      activitiesCount: trainingData.recentActivities?.length || 0,
      goalsCount: trainingData.goals?.length || 0,
      hasTimeInZones: !!trainingData.timeInZones,
      restDays: trainingData.restDays,
      hasWeeklyStats: !!trainingData.weeklyStats,
      userProfileId: trainingData.userProfile?.id
    })

    // Get Gemini API key
    console.log('Checking Gemini API key...')
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      console.error('Gemini API key not found in environment variables')
      throw new Error('Gemini API key not configured')
    }
    console.log('Gemini API key found')

    // Build the prompt for weekly progress analysis
    console.log('Building prompt...')
    const prompt = buildWeeklyProgressPrompt(trainingData)
    console.log('Prompt built, length:', prompt.length)

    // Call Gemini API
    console.log('Calling Gemini API...')
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH", 
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        })
      }
    )

    console.log('Gemini API response status:', geminiResponse.status)

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text()
      console.error('Gemini API error response:', errorText)
      throw new Error(`Gemini API error: ${geminiResponse.status} - ${errorText}`)
    }

    console.log('Parsing Gemini response...')
    const geminiData = await geminiResponse.json()
    
    if (!geminiData.candidates || geminiData.candidates.length === 0) {
      console.error('No candidates in Gemini response:', geminiData)
      throw new Error('No response from Gemini')
    }

    const feedbackText = geminiData.candidates[0].content.parts[0].text
    console.log('Feedback generated successfully, length:', feedbackText.length)

    return new Response(
      JSON.stringify({ 
        feedback: feedbackText,
        source: 'gemini',
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in gemini-feedback function:', error)
    console.error('Error stack:', error.stack)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Unknown error occurred',
        source: 'error',
        details: error.stack || 'No stack trace available'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

function buildWeeklyProgressPrompt(data: TrainingAnalysisData): string {
  const { recentActivities, goals, timeInZones, restDays, weeklyStats, userProfile } = data

  // Safely handle activities
  const activities = recentActivities || []
  
  // Format recent activities summary
  const activitiesSummary = activities.slice(0, 7).map(activity => {
    const zones = activity.power_zones || activity.hr_zones
    const zonesText = zones ? 
      `Z1: ${Math.round(zones.z1 || 0)}min, Z2: ${Math.round(zones.z2 || 0)}min, Z3: ${Math.round(zones.z3 || 0)}min, Z4: ${Math.round(zones.z4 || 0)}min, Z5: ${Math.round(zones.z5 || 0)}min` :
      'No zone data'
    
    return `- ${activity.name || 'Unnamed activity'} (${Math.round((activity.moving_time || 0) / 60)}min, ${((activity.distance || 0) / 1000).toFixed(1)}km) - ${zonesText}`
  }).join('\n')

  // Format goals
  const goalsArray = goals || []
  const goalsText = goalsArray.length > 0 ? 
    goalsArray.map(goal => `"${goal.description}" by ${new Date(goal.target_date).toLocaleDateString()}`).join(', ') :
    'No specific goals set'

  // Calculate rest periods
  const avgRestDays = (restDays || 0) / 7

  // Safely handle weekly stats
  const stats = weeklyStats || {}

  const prompt = `You are an expert cycling coach analyzing a cyclist's weekly training progress. Provide a concise, motivating weekly summary with specific areas for improvement.

TRAINING DATA (Last 7 Days):
Recent Activities:
${activitiesSummary || 'No recent activities'}

Training Goals: ${goalsText}

Weekly Statistics:
- Total activities: ${stats.totalActivities || 0}
- Total distance: ${((stats.totalDistance || 0) / 1000).toFixed(1)}km
- Total time: ${Math.round((stats.totalTime || 0) / 60)}min
- Average rest between sessions: ${avgRestDays.toFixed(1)} days
${stats.avgPower ? `- Average power: ${Math.round(stats.avgPower)}W` : ''}
${stats.avgHeartRate ? `- Average heart rate: ${Math.round(stats.avgHeartRate)}bpm` : ''}

Time in Training Zones (if available):
${timeInZones ? JSON.stringify(timeInZones, null, 2) : 'No zone data available'}

INSTRUCTIONS:
1. Write a brief, encouraging summary of the week's training (2-3 sentences)
2. Identify 2-3 specific areas for improvement to progress toward their goals
3. Give 1-2 actionable recommendations for next week
4. Keep the tone motivating and coach-like
5. Focus on training zones distribution and recovery patterns
6. If rest days seem insufficient or excessive, mention it
7. Keep total response under 200 words

Format as natural paragraphs, not bullet points.`

  return prompt
} 