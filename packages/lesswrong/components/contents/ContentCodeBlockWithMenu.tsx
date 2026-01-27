import React, { useRef, useState } from 'react';

import { CodeActionMenu, type CodeActionMenuPosition } from '../lexical/plugins/CodeActionMenuPlugin/CodeActionMenu';
import { CopyButton } from '../lexical/plugins/CodeActionMenuPlugin/components/CopyButton';

const CODE_BLOCK_MENU_PADDING = 8;

const getLanguageFromClassName = (className: string): string => {
  const match = className.match(/\blanguage-([a-z0-9_-]+)\b/i);
  return match ? match[1] : '';
};

const getLanguageFromClassNames = (classNames: string[]): string => {
  for (const className of classNames) {
    const language = getLanguageFromClassName(className);
    if (language) {
      return language;
    }
  }
  return '';
};

const getCodeBlockLanguage = (
  attribs: Record<string, any>,
  classNames: string[],
): string => {
  return (
    attribs['data-language'] ||
    attribs['data-highlight-language'] ||
    getLanguageFromClassNames(classNames) ||
    ''
  );
};

export const ContentCodeBlockWithMenu = ({
  attribs,
  classNames,
  children,
}: {
  attribs: Record<string, any>;
  classNames: string[];
  children: React.ReactNode;
}) => {
  const [isShown, setShown] = useState(false);
  const preRef = useRef<HTMLPreElement | null>(null);
  const language = getCodeBlockLanguage(attribs, classNames);
  const position: CodeActionMenuPosition = {
    top: '0',
    right: `${CODE_BLOCK_MENU_PADDING}px`,
  };

  const originalOnMouseEnter = attribs.onMouseEnter;
  const originalOnMouseLeave = attribs.onMouseLeave;

  const handleMouseEnter = (event: React.MouseEvent<HTMLPreElement>) => {
    setShown(true);
    originalOnMouseEnter?.(event);
  };

  const handleMouseLeave = (event: React.MouseEvent<HTMLPreElement>) => {
    setShown(false);
    originalOnMouseLeave?.(event);
  };

  const getCodeText = () => preRef.current?.textContent ?? '';

  return (
    <pre
      {...attribs}
      ref={preRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      <CodeActionMenu
        isShown={isShown}
        language={language}
        position={position}
        renderMenuItems={(menuItemClassName) => (
          <CopyButton getCodeText={getCodeText} menuItemClassName={menuItemClassName} />
        )}
      />
    </pre>
  );
};
