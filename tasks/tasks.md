## Relevant Files

- `vite.config.ts` - Vite configuration for project setup and build.
- `package.json` - Project dependencies and scripts.
- `src/main.tsx` - Main entry point for the React app with AuthProvider.
- `src/App.tsx` - Root component for routing and layout.
- `src/index.css` - Global styles including loading spinner animations.
- `src/lib/supabaseClient.ts` - Supabase client configuration and initialization.
- `src/types/index.ts` - TypeScript type definitions for the application.
- `src/styles/theme.ts` - Theme and color scheme definitions.
- `src/components/AuthProvider.tsx` - Authentication context provider for Strava auth.
- `src/hooks/useAuth.ts` - Custom hook for accessing authentication state.
- `src/components/StravaIntegration.tsx` - Manages Strava OAuth flow and authentication button.
- `src/components/StravaCallback.tsx` - Handles Strava OAuth callback and token exchange.
- `src/components/Dashboard.tsx` - Main dashboard page for authenticated users.
- `supabase/functions/strava-oauth/index.ts` - Edge Function for Strava token exchange.
- `supabase/README.md` - Setup instructions for Supabase deployment.
- `src/components/TrainingPlan.tsx` - Displays and manages the adaptive training plan.
- `src/components/CoachFeedback.tsx` - Component that fetches analysis and displays daily feedback & tips with caching and rate limiting.
- `src/components/CalendarView.tsx` - Month-based calendar interface for the training plan with mini charts and maximized screen usage.
- `src/components/MiniChart.tsx` - SVG-based mini chart component for displaying power/HR data in calendar cells.
- `src/components/Sidebar.tsx` - Clean sidebar navigation menu with Material Icons for switching between app sections.
- `src/components/MaterialIcon.tsx` - Reusable Material Icon component for consistent iconography throughout the app.
- `src/components/Settings.tsx` - Settings page with training goals management and account information.
- `src/hooks/useGoals.ts` - Custom hook for managing user training goals with CRUD operations.
- `supabase/migrations/005_goals_table.sql` - Database migration for the goals table with RLS policies.
- `supabase/migrations/006_coach_feedback_table.sql` - Database migration for coach feedback caching with rate limiting support.
- `src/services/geminiService.ts` - Service for integrating with Google Gemini API with fallback to heuristic analysis.
- `src/hooks/useWeeklyCoachFeedback.ts` - Hook for generating AI-powered weekly training feedback with caching and rate limiting.
- `supabase/functions/gemini-feedback/index.ts` - Edge Function for securely calling Gemini API with training data analysis.
- `src/hooks/usePlannedSessions.ts` - Hook that generates sample planned training sessions for calendar display.
- `src/utils/trainingLogic.ts` - Core logic for generating and updating training plans.
- `src/utils/dataProcessing.ts` - Functions for processing Strava data (power, HR, notes).
- `src/services/trainingDataAggregator.ts` - Aggregates and processes activity data for AI analysis.
- `src/services/dataService.ts` - Data service with methods for coach feedback caching and rate limiting.
- `src/hooks/useTrainingAnalysis.ts` - Hook for accessing processed training insights and metrics.
- `docs/training-frameworks.md` - Documentation of selected training frameworks.
- `src/utils/trainingPlanGenerator.ts` - Generates polarized training plans.
- `src/utils/trainingPlanAdapter.ts` - Adapts upcoming sessions based on latest training analysis.
- `src/tests/AuthProvider.test.tsx` - Unit tests for authentication logic.
- `src/tests/StravaIntegration.test.tsx` - Unit tests for Strava integration.
- `src/tests/TrainingPlan.test.tsx` - Unit tests for training plan logic.
- `src/tests/CoachFeedback.test.tsx` - Unit tests for feedback logic.
- `src/tests/CalendarView.test.tsx` - Unit tests for the calendar UI.
- `src/services/geminiService.ts` - Wrapper for securely calling the Gemini API.
- `supabase/functions/gemini-feedback/index.ts` - Edge Function that sends training analysis to Gemini and returns feedback.
- `src/tests/geminiService.test.ts` - Unit tests for Gemini service and Edge Function.
- `src/services/geminiPlanService.ts` - Handles Gemini-driven training plan adaptation requests.
- `supabase/functions/gemini-plan-adapt/index.ts` - Edge Function that passes plan & analysis to Gemini and returns an updated plan.
- `src/tests/geminiPlanService.test.ts` - Unit tests for training plan adaptation flow.

### Notes

- Unit tests should typically be placed alongside the code files they are testing (e.g., `MyComponent.tsx` and `MyComponent.test.tsx` in the same directory).
- Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration.

## Tasks

- [x] 1.0 Set Up Project Infrastructure
  - [x] 1.1 Initialize Vite project with React and TypeScript.
  - [x] 1.2 Set up version control with Git and connect to GitHub.
  - [x] 1.3 Configure Vercel for deployment.
  - [x] 1.4 Set up Supabase (or alternative) for backend and database.
  - [x] 1.5 Add basic project structure and install dependencies.

- [x] 2.0 Implement User Authentication (Strava OAuth)
  - [x] 2.1 Set up OAuth flow for Strava.
  - [x] 2.2 Create authentication context/provider for app-wide access.
  - [x] 2.3 Store and manage user sessions securely.

- [x] 3.0 Integrate Strava Data Import and Processing
  - [x] 3.1 Connect to Strava API to fetch user activities.
  - [x] 3.2 Parse power and heart rate streams from activities.
  - [x] 3.3 Handle fallback to heart rate or time/distance if power is missing.
  - [x] 3.4 Extract and process private notes from Strava activities.
  - [x] 3.5 Store imported data in backend for analysis.

- [x] 4.0 Develop Adaptive Training Plan and Coaching Logic
  - [x] 4.1 Build data aggregation system to collect and process activity data, time-in-zones, and private notes for AI analysis.
  - [x] 4.2 Research and select 1-2 proven training frameworks.
  - [x] 4.3 Implement logic to generate initial training plan based on user profile and goals.
  - [x] 4.4 Implement daily plan adaptation based on new Strava data and processed insights.
  - [x] 4.5 Generate daily feedback and tips after each session using processed activity data.
  - [ ] 4.6 Adapt plan for breaks (illness, vacation) and resumption.

- [x] 5.0 Build User Interface (Calendar, Feedback, Event/Goal Setting)
  - [x] 5.1 Design and implement a month-based calendar view for the training plan.
  - [x] 5.15 Create a clean sidebar navigation menu with icons for Calendar, Coach, and Settings.
  - [x] 5.2 Create UI for setting event goals (date, description).
  - [x] 5.3 Display daily feedback and tips in a clear, motivating way.

## Future Enhancements (Moved from main tasks)

- [ ] 5.4 Integrate private notes into feedback and planning.
- [ ] 5.5 Ensure all UI is accessible and user-friendly.
- [ ] 4.6 Adapt plan for breaks (illness, vacation) and resumption.
- [ ] 8.7 Add unit and integration tests for Gemini integration, including cost/error handling and prompt validation.

- [x] 6.0 Ensure Responsive Design and UX Consistency
  - [x] 6.1 Apply a neutral, clean color scheme (avoid Strava colors).
  - [x] 6.2 Test and optimize UI for mobile and desktop.
    - [x] Implement mobile weekly calendar view with vertical card layout
    - [x] Add Apple-style bottom navigation for mobile
    - [x] Create responsive breakpoints and media query hooks
    - [x] Add swipe left/right navigation for mobile week switching
    - [x] Optimize mobile header layout with proper spacing
    - [x] Ensure proper bottom navigation spacing and safe areas
  - [ ] 6.3 Conduct basic usability testing and iterate on feedback.
