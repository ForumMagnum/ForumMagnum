/**
 * Class added to <body> while printing via "Save as PDF", so that print styles
 * can hide the comments and recommendations (which are otherwise kept when a
 * user prints the page normally) and produce a PDF of just the post.
 */
export const PRINT_POST_ONLY_CLASS = "printPostOnly";

/**
 * Selector for print styles that should only apply to "Save as PDF" printing,
 * for use as a nested JSS rule key.
 */
export const printPostOnlySelector = `body.${PRINT_POST_ONLY_CLASS} &`;

function removePrintPostOnlyClass() {
  document.body.classList.remove(PRINT_POST_ONLY_CLASS);
  window.removeEventListener("afterprint", removePrintPostOnlyClass);
}

/**
 * Opens the browser's print dialog with the post-only print styles enabled.
 */
export function printPostOnly() {
  document.body.classList.add(PRINT_POST_ONLY_CLASS);
  window.addEventListener("afterprint", removePrintPostOnlyClass);
  window.print();
}
