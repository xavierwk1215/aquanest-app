import { useEffect, useState } from 'react';
import { getReferenceData, type ReferenceData } from '../lib/referenceData';

interface State {
  data: ReferenceData | null;
  loading: boolean;
  error: string | null;
}

export function useReferenceData(): State {
  const [state, setState] = useState<State>({ data: null, loading: true, error: null });

  useEffect(() => {
    let cancelled = false;
    getReferenceData()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((err: Error) => {
        if (!cancelled) setState({ data: null, loading: false, error: err.message });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
