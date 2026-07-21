import { useEffect, useRef, type RefObject } from 'react';

/**
 * Focus trap hook for modals and dialogs.
 * Traps focus within the referenced element when active,
 * and returns focus to the previously focused element on cleanup.
 *
 * @param ref - RefObject pointing to the container element
 * @param active - Whether the focus trap is active
 */
export function useFocusTrap(
  ref: RefObject<HTMLElement | null>,
  active: boolean
) {
  const previousActiveElement = useRef<Element | null>(null);

  useEffect(() => {
    if (!active) return;

    // Store the previously focused element
    previousActiveElement.current = document.activeElement;

    // Focus the first focusable element inside the trap
    const container = ref.current;
    if (container) {
      const focusable = getFocusableElements(container);
      if (focusable.length > 0) {
        focusable[0].focus();
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab' || !ref.current) return;

      const focusable = getFocusableElements(ref.current);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        // If shift+tab and on first element, wrap to last
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        // If tab and on last element, wrap to first
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Restore focus to the previously active element
      if (
        previousActiveElement.current &&
        previousActiveElement.current instanceof HTMLElement
      ) {
        previousActiveElement.current.focus();
      }
    };
  }, [active, ref]);
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selectors = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ];

  return Array.from(
    container.querySelectorAll<HTMLElement>(selectors.join(', '))
  ).filter(
    (el) => el.offsetParent !== null || el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT'
  );
}
