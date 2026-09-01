import { useEffect } from 'react';
import { onDataChanged } from '../events';

export function useDataChange(handler) {
  useEffect(() => {
    return onDataChanged(handler);
  }, [handler]);
}
