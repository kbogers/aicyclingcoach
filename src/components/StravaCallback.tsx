import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';

export function StravaCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const calledRef = useRef<boolean>(false);

  useEffect(() => {
    // Guard to ensure we only run the callback logic once
    if (calledRef.current) return;
    calledRef.current = true;

    const handleCallback = async () => {
      try {
        // Get authorization code from URL params
        const code = searchParams.get('code');
        const error = searchParams.get('error');

        if (error) {
          throw new Error(`Strava authorization failed: ${error}`);
        }

        if (!code) {
          throw new Error('No authorization code received from Strava');
        }

        console.log('Exchanging code for tokens...', code);

        // Exchange code for tokens via Supabase Edge Function
        const { data, error: functionError } = await supabase.functions.invoke('strava-oauth', {
          body: { code }
        });

        if (functionError) {
          console.error('Function error:', functionError);
          throw new Error(`Token exchange failed: ${functionError.message}`);
        }

        if (!data.success) {
          throw new Error(data.error || 'Token exchange failed');
        }

        console.log('Token exchange successful:', data);

        // Use the auth context to log in the user
        await login(data);

        setStatus('success');
        
        // Redirect to dashboard after successful authentication
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);

      } catch (error) {
        console.error('Strava OAuth callback error:', error);
        setErrorMessage(error instanceof Error ? error.message : 'Authentication failed');
        setStatus('error');
      }
    };

    handleCallback();
  }, []);

  if (status === 'loading') {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <h2>Connecting to Strava...</h2>
        <p>Please wait while we complete your authentication.</p>
        <div style={{ margin: '1rem 0' }}>
          <div style={{ 
            border: '3px solid #f3f3f3',
            borderTop: '3px solid #FC4C02',
            borderRadius: '50%',
            width: '30px',
            height: '30px',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }}></div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <h2>Authentication Failed</h2>
        <p style={{ color: 'red', marginBottom: '1rem' }}>{errorMessage}</p>
        <details style={{ textAlign: 'left', margin: '1rem 0', padding: '1rem', backgroundColor: '#f5f5f5' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Debug Information</summary>
          <p><strong>URL Parameters:</strong></p>
          <pre style={{ fontSize: '12px', overflow: 'auto' }}>
            {JSON.stringify(Object.fromEntries(searchParams.entries()), null, 2)}
          </pre>
        </details>
        <button 
          onClick={() => navigate('/')}
          style={{
            padding: '12px 24px',
            marginTop: '1rem',
            border: 'none',
            borderRadius: '6px',
            backgroundColor: '#2563eb',
            color: 'white',
            cursor: 'pointer'
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <h2>✅ Successfully Connected!</h2>
      <p>Your Strava account has been connected. Redirecting to dashboard...</p>
    </div>
  );
} 