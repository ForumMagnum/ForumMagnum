import { useEffect, useRef, type RefObject } from "react";

export function useFormSubmitOnCmdEnter<T extends HTMLElement = HTMLFormElement>(submitFunction: () => Promise<void>): RefObject<T | null> {
  const formRef = useRef<T>(null);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.keyCode === 13) {
        event.stopPropagation();
        event.preventDefault();
        void submitFunction();
      }
    };

    const form = formRef.current;
    
    form?.addEventListener('keydown', handler);

    return () => form?.removeEventListener('keydown', handler);
  }, [submitFunction]);

  return formRef;
}
