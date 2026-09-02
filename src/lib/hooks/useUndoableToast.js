import { showToast } from '../ui/Toast';

/**
 * Hook reusable para acciones "Deshacer" (toast).
 *
 * @param options.undo - { label, onClick, icon?, duration? }
 * @param options.tone - color del toast
 * @returns { execute } - función que dispara el toast con su undo
 */
export function useUndoableToast() {
  function execute(message, undoOptions) {
    showToast(message, 'success', undoOptions);
  }
  return { execute };
}
