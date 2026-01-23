import { sleep } from "@/lib/utils/asyncUtils";

declare global {
  interface Window {
    MathJax?: MathJaxInstance;
  }
  // MathJax is also available as a global variable
  // eslint-disable-next-line no-var
  var MathJax: MathJaxInstance | undefined;
}

interface MathJaxStartupConfig {
  typeset?: boolean;
  promise?: Promise<unknown>;
}

export interface MathJaxInstance {
  tex2chtmlPromise?: (equation: string, options: { em: number; ex: number; display: boolean }) => Promise<HTMLElement>;
  chtmlStylesheet?: () => HTMLStyleElement;
  version?: string;
  // Config properties (before MathJax loads)
  loader?: unknown;
  options?: unknown;
  tex?: unknown;
  startup?: MathJaxStartupConfig;
}

const MAX_WAITING_PERIODS = 20;
const WAITING_PERIOD_LENGTH = 300;

/**
 * Check if MathJax is version 3
 */
function isMathJaxVersion3(version: string | undefined): boolean {
  return !!version && typeof version === 'string' && version.split('.').length === 3 && version.split('.')[0] === '3';
}


const MATHJAX_SCRIPT_SELECTOR = 'script[data-mathjax-cdn="true"]';
let mathJaxLoadPromise: Promise<MathJaxInstance | null> | null = null;

function ensureMathJaxStyles(mathJaxInstance: MathJaxInstance): void {
  if (!mathJaxInstance.chtmlStylesheet || typeof document === 'undefined') {
    return;
  }

  const existingSheet = document.querySelector('#MJX-CHTML-styles');
  const newSheet = mathJaxInstance.chtmlStylesheet();

  if (!existingSheet) {
    document.head.appendChild(newSheet);
    return;
  }

  if (!existingSheet.isEqualNode(newSheet)) {
    existingSheet.parentNode?.removeChild(existingSheet);
    document.head.appendChild(newSheet);
  }
}

/**
 * Load MathJax if it hasn't been loaded yet.
 */
export function loadMathJax(): Promise<MathJaxInstance | null> {
  if (typeof window === 'undefined') {
    return Promise.resolve(null);
  }

  if (window.MathJax?.tex2chtmlPromise && isMathJaxVersion3(window.MathJax.version)) {
    return Promise.resolve(window.MathJax);
  }

  if (mathJaxLoadPromise) {
    return mathJaxLoadPromise;
  }

  mathJaxLoadPromise = (async () => {
    // Ensure MathJax config exists (only if it's not already initialized)
    if (!window.MathJax || !window.MathJax.tex2chtmlPromise) {
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

    for (let attempt = 0; attempt <= MAX_WAITING_PERIODS; attempt += 1) {
      const instance = window.MathJax;
      if (instance?.tex2chtmlPromise && isMathJaxVersion3(instance.version)) {
        await instance.startup?.promise;
        return instance;
      }
      await sleep(WAITING_PERIOD_LENGTH);
    }

    return null;
  })();

  mathJaxLoadPromise.then((instance) => {
    if (!instance) {
      mathJaxLoadPromise = null;
    }
  }).catch(() => {
    mathJaxLoadPromise = null;
  });

  return mathJaxLoadPromise;
}

/**
 * Render a LaTeX equation to an HTML element using MathJax.
 * Uses polling to wait for MathJax to be ready.
 */
export async function renderEquation(
  equation: string,
  element: HTMLElement,
  display: boolean
): Promise<void> {
  const mathJaxInstance = await loadMathJax();

  if (!mathJaxInstance || !mathJaxInstance.tex2chtmlPromise) {
    element.textContent = display ? `\\[${equation}\\]` : `\\(${equation}\\)`;
    return;
  }

  try {
    const node = await mathJaxInstance.tex2chtmlPromise(equation, {
      em: 22,
      ex: 11,
      display,
    });

    element.textContent = '';
    element.appendChild(node);
    ensureMathJaxStyles(mathJaxInstance);
  } catch (error) {
    // On error, show raw equation
    element.textContent = display ? `\\[${equation}\\]` : `\\(${equation}\\)`;
  }
}
