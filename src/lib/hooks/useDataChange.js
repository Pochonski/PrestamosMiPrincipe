import { useEffect, useRef } from 'react';
import { onDataChanged } from '../events';

export function useDataChange(handler) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    function wrapped() {
      ref.current?.();
    }
    return onDataChanged(wrapped);
  }, []);
}
