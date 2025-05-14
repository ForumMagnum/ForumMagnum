import { useEffect, useRef } from "react";

export function useFormSubmitOnCmdEnter(submitFunction: () => Promise<void>) {
  const formRef = useRef<HTMLFormElement>(null);

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
