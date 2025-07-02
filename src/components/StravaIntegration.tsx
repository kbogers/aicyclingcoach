import { useEffect, useState } from 'react';

interface StravaIntegrationProps {
  onAuthError?: (error: string) => void;
}

export function StravaIntegration({ onAuthError }: StravaIntegrationProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [authUrl, setAuthUrl] = useState<string>('');

  useEffect(() => {
    // Generate Strava OAuth URL
    const generateStravaAuthUrl = () => {
      const clientId = import.meta.env.VITE_STRAVA_CLIENT_ID;
      const redirectUri = import.meta.env.VITE_STRAVA_REDIRECT_URI || `${window.location.origin}/auth/strava/callback`;
      const scope = 'read,activity:read_all';
      const responseType = 'code';
      const approvalPrompt = 'auto';

      if (!clientId) {
        console.error('VITE_STRAVA_CLIENT_ID is not configured');
        return '';
      }

      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: responseType,
        approval_prompt: approvalPrompt,
        scope: scope,
      });

      return `https://www.strava.com/oauth/authorize?${params.toString()}`;
    };

    setAuthUrl(generateStravaAuthUrl());
  }, []);

  const handleStravaAuth = () => {
    if (!authUrl) {
      onAuthError?.('Strava OAuth URL could not be generated. Check your environment variables.');
      return;
    }

    setIsLoading(true);
    
    // Redirect to Strava OAuth
    window.location.href = authUrl;
  };

  return (
    <div className="strava-integration">
      <h3>Connect with Strava</h3>
      <p>Connect your Strava account to import your cycling activities and get personalized coaching.</p>
      
      <button
        onClick={handleStravaAuth}
        disabled={isLoading || !authUrl}
        className="strava-auth-button"
        style={{
          backgroundColor: '#2563eb', // Use our theme's primary blue
          color: 'white',
          padding: '12px 24px',
          border: 'none',
          borderRadius: '6px',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          fontSize: '16px',
          fontWeight: '600',
          opacity: isLoading ? 0.7 : 1,
        }}
      >
        {isLoading ? 'Connecting...' : 'Connect with Strava'}
      </button>

      {!authUrl && (
        <p style={{ color: 'red', marginTop: '8px' }}>
          Error: Strava Client ID not configured. Please check your environment variables.
        </p>
      )}
    </div>
  );
}

// Export function to handle callback (can be used in a separate callback component)
export { StravaIntegration as default }; 