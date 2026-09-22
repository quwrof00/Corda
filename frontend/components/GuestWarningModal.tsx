import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useGuestMode } from '@/hooks/useGuestMode';

export default function GuestWarningModal() {
  const [isOpen, setIsOpen] = useState(false);
  const { isGuest, exitGuestMode } = useGuestMode();
  const router = useRouter();

  useEffect(() => {
    // Only show once per session using sessionStorage
    const hasSeen = sessionStorage.getItem('hasSeenGuestModal');
    if (isGuest && !hasSeen) {
      setIsOpen(true);
      sessionStorage.setItem('hasSeenGuestModal', 'true');
    }
  }, [isGuest]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl p-6 overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-amber-500" />
            
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3 text-amber-600 dark:text-amber-500">
                <div className="p-2 bg-amber-100 dark:bg-amber-500/20 rounded-lg">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold">Guest Mode</h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-4 mb-8">
              <p>
                You are currently using Corda in Guest Mode. Your data is being saved locally to this browser.
              </p>
              <p className="font-medium text-zinc-900 dark:text-zinc-200">
                Warning: If you clear your browser cache, your tasks will be permanently lost.
              </p>
              <p>
                To sync your tasks across devices and collaborate with teams, please create an account.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 px-4 py-2 text-sm font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                Continue as Guest
              </button>
              <button
                onClick={() => {
                  exitGuestMode();
                  router.push('/register');
                }}
                className="flex-1 px-4 py-2 text-sm font-bold uppercase tracking-wider text-white bg-[var(--accent-time)] hover:opacity-90 rounded-lg transition-colors shadow-lg shadow-black/10"
              >
                Sign Up Now
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
