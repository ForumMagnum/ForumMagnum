import { addLightDarkFallbacks, replaceLightDarkWithLightModeColor } from '../lib/lightDarkFallbacks';

describe('replaceLightDarkWithLightModeColor', () => {
  it('replaces light-dark with its first argument', () => {
    expect(replaceLightDarkWithLightModeColor('color: light-dark(#333, #aaa);')).toBe(
      'color: #333;',
    );
  });

  it('handles nested parentheses in the arguments', () => {
    expect(
      replaceLightDarkWithLightModeColor('background: light-dark(rgba(0,0,0,0.1),rgba(255,255,255,0.1));'),
    ).toBe('background: rgba(0,0,0,0.1);');
  });

  it('replaces multiple occurrences', () => {
    expect(
      replaceLightDarkWithLightModeColor('border: 1px solid light-dark(#000,#fff); color: light-dark(#333,#aaa);'),
    ).toBe('border: 1px solid #000; color: #333;');
  });
});

describe('addLightDarkFallbacks', () => {
  it('inserts a light-mode fallback before a light-dark declaration', () => {
    expect(addLightDarkFallbacks('.a-root {\n  background-color: light-dark(#fff, #000);\n}')).toBe(
      '.a-root {\n  background-color: #fff;background-color: light-dark(#fff, #000);\n}',
    );
  });

  it('handles minified declarations without a trailing semicolon', () => {
    expect(addLightDarkFallbacks('.a{color:light-dark(#333,#aaa)}')).toBe(
      '.a{color:#333;color:light-dark(#333,#aaa)}',
    );
  });

  it('handles values with multiple light-dark calls and nested parentheses', () => {
    expect(
      addLightDarkFallbacks('.a{box-shadow:0 0 2px light-dark(rgba(0,0,0,0.2),rgba(255,255,255,0.2)),0 0 4px light-dark(#000,#fff)}'),
    ).toBe(
      '.a{box-shadow:0 0 2px rgba(0,0,0,0.2),0 0 4px #000;box-shadow:0 0 2px light-dark(rgba(0,0,0,0.2),rgba(255,255,255,0.2)),0 0 4px light-dark(#000,#fff)}',
    );
  });

  it('preserves !important in the fallback', () => {
    expect(addLightDarkFallbacks('.a{color:light-dark(#333,#aaa) !important}')).toBe(
      '.a{color:#333 !important;color:light-dark(#333,#aaa) !important}',
    );
  });

  it('leaves declarations without light-dark unchanged', () => {
    const css = '.a{color:#333;background:url(data:image/png;base64,abc)}';
    expect(addLightDarkFallbacks(css)).toBe(css);
  });

  it('only duplicates the declarations that use light-dark', () => {
    expect(
      addLightDarkFallbacks('.a{margin:8px;color:light-dark(#333,#aaa);padding:4px}'),
    ).toBe('.a{margin:8px;color:#333;color:light-dark(#333,#aaa);padding:4px}');
  });
});
