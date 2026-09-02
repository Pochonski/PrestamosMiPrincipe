import { useEffect, useRef } from 'react';
import { onDataChanged } from '../events';

export function useDataChange(handler) {
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    function wrapped() {
      handlerRef.current();
    }
    return onDataChanged(wrapped);
  }, []);
}
