import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export function useQueryParams() {
  const location = useLocation();
  const navigate = useNavigate();

  const getParam = useCallback(
    (key: string): string | null => {
      const params = new URLSearchParams(location.search);
      return params.get(key);
    },
    [location.search]
  );

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(location.search);
      params.set(key, value);
      navigate({ search: params.toString() }, { replace: true });
    },
    [location.search, navigate]
  );

  const setParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(location.search);
      Object.entries(updates).forEach(([k, v]) => params.set(k, v));
      navigate({ search: params.toString() }, { replace: true });
    },
    [location.search, navigate]
  );

  return { getParam, setParam, setParams };
}
