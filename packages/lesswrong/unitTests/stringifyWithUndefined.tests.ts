import { stringifyWithUndefined } from '../lib/utils/stringifyWithUndefined';

describe('stringifyWithUndefined', () => {
  it('stringifies correctly', () => {
    expect(stringifyWithUndefined(undefined)).toBe('undefined');
    expect(stringifyWithUndefined({x: undefined})).toBe('{"x":undefined}');
    expect(stringifyWithUndefined([1,undefined,3])).toBe('[1,undefined,3]');
    expect(stringifyWithUndefined([1,"$placeholder.undefined",3])).toBe('[1,"$placeholder.undefined",3]');
    expect(stringifyWithUndefined([1,"$placeholder.undefined","$apollo.undefined",3])).toBe('[1,"$placeholder.undefined","$apollo.undefined",3]');
  });
});