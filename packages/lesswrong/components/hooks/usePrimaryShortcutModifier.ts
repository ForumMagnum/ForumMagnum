import { useEffect, useState } from 'react';

export function usePrimaryShortcutModifier(): 'Cmd' | 'Ctrl' {
  const [modifier, setModifier] = useState<'Cmd' | 'Ctrl'>('Ctrl');
  useEffect(() => {
    // iPadOS can identify as Macintosh when requesting desktop sites.
    const isApple = /Macintosh|Mac OS X|iPhone|iPad|iPod/i.test(navigator.userAgent);
    setModifier(isApple ? 'Cmd' : 'Ctrl');
  }, []);
  return modifier;
}
