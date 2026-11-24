import { useEffect } from "react";
import { printPostOnly } from "../posts/printPostOnly";

// Give images and math a moment to finish rendering after fonts are ready
// before opening the print dialog.
const PRINT_DELAY_MS = 500;

/**
 * Opens the browser's print dialog (from which the user can save the page as
 * a PDF) once `shouldPrint` becomes true, then calls `onPrinted`. Used by the
 * "Save as PDF" post action, which opens the post page with a query parameter
 * that turns this on.
 */
export function usePrintOnLoad(shouldPrint: boolean, onPrinted: () => void) {
  useEffect(() => {
    if (!shouldPrint) return;
    let cancelled = false;
    let timeout: number | null = null;
    const fontsReady = document.fonts?.ready ?? Promise.resolve();
    void fontsReady.then(() => {
      if (cancelled) return;
      timeout = window.setTimeout(() => {
        if (cancelled) return;
        printPostOnly();
        onPrinted();
      }, PRINT_DELAY_MS);
    });
    return () => {
      cancelled = true;
      if (timeout !== null) window.clearTimeout(timeout);
    };
  }, [shouldPrint, onPrinted]);
}
