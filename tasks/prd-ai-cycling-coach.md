# Product Requirements Document: AI Cycling Coach

## 1. Introduction/Overview
The AI Cycling Coach is a web application designed to help cyclists of all levels—from beginners to serious racers—improve their fitness and achieve their cycling goals. The app addresses the challenge of planning and sticking to a training regimen by providing an adaptive, AI-driven training plan and virtual coaching feedback. By integrating with Strava, the app delivers daily-updated plans and actionable feedback, helping users feel confident in their training decisions and progress.

## 2. Goals
- Enable users to receive a personalized, adaptive cycling training plan that updates daily based on their actual activities.
- Provide motivating and constructive feedback after each training session, simulating a real coach.
- Allow users to set specific event goals (with date and description) and tailor plans accordingly.
- Deliver a clean, simple, and intuitive user experience focused on core training features.
- Achieve at least 100 users who have created a plan post-launch.

## 3. User Stories
- As a beginner cyclist, I want to be coached in what to do to get fit, so I can confidently work on my fitness.
- As a road racer, I want to have a training plan that fits exactly to my situation, so I make the best possible use of my time.
- As a cycling enthusiast, I want to have a well thought out plan that adapts to my daily life so I can be well prepared for my first serious event that I'm working towards.

## 4. Functional Requirements
1. The system must allow users to authenticate via Strava or Google.
2. The system must import cycling activity data from Strava, including power and/or heart rate streams.
3. The system must allow users to set an event/goal with a date and description.
4. The system must generate and display a month-based training plan, updating daily based on new Strava activities.
5. The system must provide daily feedback and tips after each training session, including motivation and constructive criticism.
6. The system must use heart rate data if power data is unavailable (users must provide FTP and LTHR). If neither is available, use only time and distance (do not use Strava's estimated power).
7. The system must allow users to add private notes via Strava, which the AI will consider in feedback and planning.
8. The system must present the plan in a clear, calendar-like interface optimized for web and mobile (responsive design).
9. The system must use a consistent, neutral color scheme and avoid Strava branding/colors.
10. The system must adapt the plan to help users resume training after breaks (e.g., illness, vacation).

## 5. Non-Goals (Out of Scope)
- Nutrition tracking.
- Conversational AI or chat-based interactions.
- Social features (e.g., sharing, following, group plans).
- Manual workout entry or integrations beyond Strava.
- Use of Strava's estimated power data.

## 6. Design Considerations (Optional)
- Use a neutral, clean color scheme (avoid Strava colors).
- Focus on simplicity and clarity in UI/UX.
- Month-based calendar view for training plan.
- Responsive design for web and mobile.
- No existing mockups; design from scratch with UX best practices.

## 7. Technical Considerations (Optional)
- Frontend: Vite (React or similar), deployed on Vercel.
- Backend: Supabase preferred for ease of use, but open to alternatives that are free or low-cost and easy to manage.
- User authentication via Strava and Google OAuth.
- Good git/GitHub practices from the start.
- Training plan logic should be based on one or two proven frameworks (e.g., polarized training, periodization) and remain consistent for all users.

## 8. Success Metrics
- 100 users have created a plan in the app.
- Users return to view their plan after new Strava uploads.
- The app is mentioned in Strava ride names.
- Positive user feedback on simplicity and usefulness.

## 9. Open Questions
- Which specific training frameworks will be used for the initial version?
- What is the best way to handle backend hosting and scaling as the user base grows?
- Are there any legal or compliance considerations with Strava data usage?
- How will we collect and act on user feedback for future iterations? 