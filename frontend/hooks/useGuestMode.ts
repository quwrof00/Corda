import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useGuestMode() {
  const [isGuest, setIsGuest] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // This runs only on the client, after hydration — the only safe place to read localStorage.
    setIsGuest(localStorage.getItem('guestMode') === 'true');
    setInitialized(true);
  }, []);

  const enterGuestMode = () => {
    localStorage.setItem('guestMode', 'true');
    setIsGuest(true);
    router.push('/dashboard');
  };

  const exitGuestMode = () => {
    localStorage.removeItem('guestMode');
    setIsGuest(false);
    window.location.href = '/login';
  };

  return { isGuest, initialized, enterGuestMode, exitGuestMode };
}
