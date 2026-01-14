declare global {
  interface Window {
    MathJax?: MathJaxInstance;
    MathJaxReady?: boolean;
  }
  // MathJax is also available as a global variable
  // eslint-disable-next-line no-var
  var MathJax: MathJaxInstance | undefined;
}

export interface MathJaxInstance {
  tex2chtmlPromise?: (equation: string, options: { em: number; ex: number; display: boolean }) => Promise<HTMLElement>;
  chtmlStylesheet?: () => HTMLStyleElement;
  version?: string;
  // Config properties (before MathJax loads)
  loader?: unknown;
  options?: unknown;
  tex?: unknown;
  startup?: unknown;
}

const MAX_WAITING_PERIODS = 20;
const WAITING_PERIOD_LENGTH = 300;

/**
 * Check if MathJax is version 3
 */
function isMathJaxVersion3(version: string | undefined): boolean {
  return !!version && typeof version === 'string' && version.split('.').length === 3 && version.split('.')[0] === '3';
}

/**
 * Wait for a specified number of milliseconds
 */
function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let loadingStarted = false;
const MATHJAX_SCRIPT_SELECTOR = 'script[data-mathjax-cdn="true"]';

/**
 * Load MathJax if it hasn't been loaded yet.
 */
export function loadMathJax(): void {
  if (loadingStarted) {
    return;
  }
  loadingStarted = true;

  // If MathJax is already loaded and ready, nothing to do
  if (window.MathJax?.tex2chtmlPromise) {
    return;
  }
  
  // Ensure MathJax config exists
  if (!window.MathJax) {
    window.MathJax = {
      loader: { load: ['[tex]/colorv2'] },
      options: {
        renderActions: {
          addMenu: [],
          checkLoading: []
        }
      },
      tex: {
        autoload: {
          color: [],
          colorv2: ['color']
        },
        packages: { '[+]': ['noerrors', 'color'] }
      },
      startup: {
        typeset: false,
        pageReady: () => {
          window.MathJaxReady = true;
        }
      }
    };
  }

  // Always ensure the script tag exists if MathJax isn't ready yet.
  if (!document.querySelector(MATHJAX_SCRIPT_SELECTOR)) {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3.1.2/es5/tex-mml-chtml.js';
    script.async = true;
    script.setAttribute('data-mathjax-cdn', 'true');
    document.head.appendChild(script);
  }
}

/**
 * Render a LaTeX equation to an HTML element using MathJax.
 * Uses polling to wait for MathJax to be ready.
 */
export async function renderEquation(
  equation: string,
  element: HTMLElement,
  display: boolean,
  pastAttempts: number = 0
): Promise<void> {
  // Ensure loading has started
  loadMathJax();
  const mathJaxInstance = window.MathJax;
  
  // Check if MathJax is ready
  if (
    !mathJaxInstance ||
    !isMathJaxVersion3(mathJaxInstance.version) ||
    !mathJaxInstance.tex2chtmlPromise
  ) {
    if (pastAttempts > MAX_WAITING_PERIODS) {
      // MathJax failed to load, show raw equation
      element.textContent = display ? `\\[${equation}\\]` : `\\(${equation}\\)`;
      return;
    }
    
    await wait(WAITING_PERIOD_LENGTH);
    return renderEquation(equation, element, display, pastAttempts + 1);
  }

  try {
    const node = await mathJaxInstance.tex2chtmlPromise(equation, {
      em: 22,
      ex: 11,
      display,
    });

    element.textContent = '';
    element.appendChild(node);

    // Ensure MathJax styles are in the document
    const existingSheet = document.querySelector('#MJX-CHTML-styles');
    if (!existingSheet && mathJaxInstance.chtmlStylesheet) {
      const newSheet = mathJaxInstance.chtmlStylesheet();
      document.head.appendChild(newSheet);
    }
  } catch (error) {
    // On error, show raw equation
    element.textContent = display ? `\\[${equation}\\]` : `\\(${equation}\\)`;
  }
}
