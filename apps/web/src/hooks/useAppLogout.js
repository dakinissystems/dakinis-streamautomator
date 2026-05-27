import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { dakinisPerformClientLogout } from '@dakinis/auth-client/logout';
import { useAuth } from '../store/authStore';

/** Unified sign-out: clear local auth + redirect to /login. */
export function useAppLogout() {
  const { clearAuth } = useAuth();
  const navigate = useNavigate();

  return useCallback(
    () =>
      dakinisPerformClientLogout({
        clearLocalSession: clearAuth,
        navigate: (to, opts) => navigate(to, opts),
      }),
    [clearAuth, navigate]
  );
}
