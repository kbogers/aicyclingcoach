import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { supabase } from './lib/supabaseClient'

function App() {
  const [count, setCount] = useState(0)
  const [supabaseStatus, setSupabaseStatus] = useState<string>('Testing...')

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

export default App
