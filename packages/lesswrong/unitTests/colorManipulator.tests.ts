import { darken, emphasize, fade, lighten } from '../lib/vendor/@material-ui/core/src/styles/colorManipulator';

describe('colorManipulator light-dark support', () => {
  it('fades each branch of a light-dark color independently', () => {
    expect(fade('light-dark(rgba(0,0,0,0.12),rgba(255,255,255,0.12))', 1)).toBe(
      'light-dark(rgba(0, 0, 0, 1), rgba(255, 255, 255, 1))',
    );
  });

  it('lightens and darkens each branch independently', () => {
    expect(lighten('light-dark(rgb(0, 0, 0), rgb(10, 20, 30))', 0.5)).toBe(
      'light-dark(rgb(127, 127, 127), rgb(132, 137, 142))',
    );
    expect(darken('light-dark(rgb(250, 240, 230), rgb(255, 255, 255))', 0.2)).toBe(
      'light-dark(rgb(200, 192, 184), rgb(204, 204, 204))',
    );
  });

  it('emphasizes each branch using that branch luminance', () => {
    expect(emphasize('light-dark(rgb(240, 240, 240), rgb(20, 20, 20))', 0.2)).toBe(
      'light-dark(rgb(192, 192, 192), rgb(67, 67, 67))',
    );
  });
});
