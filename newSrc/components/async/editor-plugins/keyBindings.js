import {getDefaultKeyBinding, KeyBindingUtil} from 'draft-js';
const { hasCommandModifier } = KeyBindingUtil;

export const myKeyBindingFn = (e) => {
  if (e.keyCode === 77 && hasCommandModifier(e)) {
    return 'insert-texblock';
  }
  if (e.key === '4' && hasCommandModifier(e)) {
    return 'insert-inlinetex';
  }
  return getDefaultKeyBinding(e);
}
