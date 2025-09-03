import React, { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const GoogleCallbackSuccessPage: React.FC = () => {
  const { session } = useAuth();

  useEffect(() => {
    const fetchAndRegister = async () => {
      if (session) {
        await supabase.functions.invoke('google-calendar-integration/fetch-events', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });
        await supabase.functions.invoke('google-calendar-integration/register-webhook', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });
      }
    };
    fetchAndRegister();
  }, [session]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded shadow-md w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-4">Google Calendar Connected!</h1>
        <p>We are now fetching your calendar events. You can close this page.</p>
      </div>
    </div>
  );
};

export default GoogleCallbackSuccessPage;
