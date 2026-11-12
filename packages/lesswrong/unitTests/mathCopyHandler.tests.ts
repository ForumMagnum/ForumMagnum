/** @jest-environment jsdom */
import { handleMathCopy } from '@/components/contents/mathCopyHandler';

// jsdom doesn't implement innerText, which depends on layout
beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'innerText', {
    configurable: true,
    get(this: HTMLElement) {
      return this.textContent;
    },
  });
});

afterEach(() => {
  document.body.innerHTML = '';
  document.getSelection()?.removeAllRanges();
});

function renderContent(html: string): HTMLDivElement {
  const container = document.createElement('div');
  container.innerHTML = html;
  document.body.appendChild(container);
  return container;
}

function selectNodeContents(node: Node) {
  const range = document.createRange();
  range.selectNodeContents(node);
  const selection = document.getSelection()!;
  selection.removeAllRanges();
  selection.addRange(range);
}

function copyFrom(container: HTMLElement) {
  const data: Record<string, string> = {};
  let defaultPrevented = false;
  handleMathCopy({
    defaultPrevented: false,
    currentTarget: container,
    clipboardData: {
      setData: (format: string, value: string) => { data[format] = value; },
    },
    preventDefault: () => { defaultPrevented = true; },
  });
  return { data, defaultPrevented };
}

const inlineMath = '<mjx-container class="MathJax" jax="CHTML" aria-label="N^\\lambda" role="math"><mjx-math><mjx-mi class="mjx-i"><mjx-c class="mjx-c1D441"></mjx-c></mjx-mi></mjx-math></mjx-container>';
const displayMath = '<mjx-container class="MathJax" jax="CHTML" display="true" aria-label="\\sum_i x_i" role="math"><mjx-math><mjx-mo><mjx-c></mjx-c></mjx-mo></mjx-math></mjx-container>';

describe('handleMathCopy', () => {
  it('puts the TeX source of inline and display equations into the plaintext', () => {
    const container = renderContent(`<style>mjx-c {}</style><p>Scaling as ${inlineMath} holds.</p>${displayMath}`);
    selectNodeContents(container);
    const { data, defaultPrevented } = copyFrom(container);
    expect(defaultPrevented).toBe(true);
    expect(data['text/plain']).toBe('Scaling as \\(N^\\lambda\\) holds.$$\\sum_i x_i$$');
    expect(data['text/html']).toContain('aria-label="N^\\lambda"');
    expect(data['text/html']).not.toContain('<style');
  });

  it('copies the whole equation when the selection starts inside it', () => {
    const container = renderContent(`<p>Scaling as ${inlineMath} holds.</p>`);
    const mjxMath = container.querySelector('mjx-math')!;
    const range = document.createRange();
    range.setStart(mjxMath, 0);
    range.setEnd(container.querySelector('p')!.lastChild!, 6);
    const selection = document.getSelection()!;
    selection.removeAllRanges();
    selection.addRange(range);
    const { data } = copyFrom(container);
    expect(data['text/plain']).toBe('\\(N^\\lambda\\) holds');
  });

  it('leaves copies without equations to the browser', () => {
    const container = renderContent('<p>No math here.</p>');
    selectNodeContents(container);
    const { data, defaultPrevented } = copyFrom(container);
    expect(defaultPrevented).toBe(false);
    expect(data).toEqual({});
  });
});
