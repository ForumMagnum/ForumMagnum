import { colorToString, invertColorPreservingHue, invertHexColor } from '../themes/colorUtil';

describe('colorUtil', () => {
  it('keeps the old channel-wise inversion for theme colors', () => {
    expect(invertHexColor('#0000ff')).toBe('#ffff00');
  });

  it('preserves hue when inverting lightness for content colors', () => {
    expect(colorToString(invertColorPreservingHue([0, 0, 1, 1]))).toBe('#0000ff');
    expect(colorToString(invertColorPreservingHue([0, 0, 128 / 255, 1]))).toBe('#7f7fff');
  });

  it('inverts greyscale lightness when preserving hue', () => {
    expect(colorToString(invertColorPreservingHue([0.2, 0.2, 0.2, 1]))).toBe('#cccccc');
  });
});
