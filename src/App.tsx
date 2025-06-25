import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { supabase } from './lib/supabaseClient'
import { StravaIntegration } from './components/StravaIntegration'
import { StravaCallback } from './components/StravaCallback'
import { Dashboard } from './components/Dashboard'
import { useAuth } from './hooks/useAuth'

function Home() {
  const [count, setCount] = useState(0)
  const [supabaseStatus, setSupabaseStatus] = useState<string>('Testing...')
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    // Test Supabase connection
    const testSupabase = async () => {
      try {
        const { error } = await supabase.from('test').select('*').limit(1)
        if (error && (error.code === 'PGRST116' || error.message.includes('does not exist'))) {
          // Table doesn't exist, but connection works
          setSupabaseStatus('✅ Supabase connected successfully!')
        } else if (error) {
          setSupabaseStatus(`❌ Supabase error: ${error.message}`)
        } else {
          setSupabaseStatus('✅ Supabase connected and working!')
        }
      } catch (err) {
        setSupabaseStatus(`❌ Connection failed: ${err}`)
      }
    }
    testSupabase()
  }, [])

  const handleAuthError = (error: string) => {
    console.error('Auth error:', error)
    // You can add toast notifications or other error handling here
  }

  // Redirect to dashboard if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>AI Cycling Coach</h1>
      <div className="card">
        <p>Supabase Status: {supabaseStatus}</p>
        <div style={{ margin: '20px 0' }}>
          <StravaIntegration onAuthError={handleAuthError} />
        </div>
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

function App() {
  const { isLoading } = useAuth()

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column'
      }}>
        <div style={{ 
          border: '3px solid #f3f3f3',
          borderTop: '3px solid #2563eb',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          animation: 'spin 1s linear infinite',
          marginBottom: '1rem'
        }}></div>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/auth/strava/callback" element={<StravaCallback />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/" element={<Home />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
