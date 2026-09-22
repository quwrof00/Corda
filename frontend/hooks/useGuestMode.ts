import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useGuestMode() {
  const [isGuest, setIsGuest] = useState(() => {
    // Lazy initializer: read synchronously so it's correct on first render,
    // preventing a false redirect to /login before the effect fires.
    if (typeof window !== 'undefined') {
      return localStorage.getItem('guestMode') === 'true';
    }
    return false;
  });
  const router = useRouter();

  useEffect(() => {
    const guestState = localStorage.getItem('guestMode') === 'true';
    setIsGuest(guestState);
  }, []);

  const enterGuestMode = () => {
    localStorage.setItem('guestMode', 'true');
    setIsGuest(true);
    router.push('/dashboard');
  };

  const exitGuestMode = () => {
    localStorage.removeItem('guestMode');
    setIsGuest(false);
    router.push('/login');
  };

  return { isGuest, enterGuestMode, exitGuestMode };
}
