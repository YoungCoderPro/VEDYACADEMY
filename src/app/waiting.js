// Waiting room route: signed-in accounts that aren't linked/approved yet.

import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { WaitingScreen, LoadingScreen } from '../components/auth';
import { useData } from '../lib/store';

export default function Waiting() {
  const data = useData();
  const router = useRouter();

  useEffect(() => {
    if (!data) return;
    if (data.status === 'signedOut' && !data.demoRole) router.replace('/signin');
    if (data.status === 'ready' || data.demoRole) {
      router.replace(data.isStaff ? '/today' : '/home');
    }
  }, [data?.status, data?.demoRole, data?.isStaff]);

  if (!data || data.status === 'loading') return <LoadingScreen />;
  return <WaitingScreen />;
}
