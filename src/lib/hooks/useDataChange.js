import { useEffect } from 'react';
import { onDataChanged, onUserChanged } from '../events';

export function useDataChange(handler) {
  useEffect(() => onDataChanged(handler), [handler]);
}

export function useUserChange(handler) {
  useEffect(() => onUserChanged(handler), [handler]);
}