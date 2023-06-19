import type { ContentBlock } from 'draft-js';
import React from 'react';

import DefaultDivider from './components/DefaultDivider';
import DividerButton, { DividerButtonProps } from './components/DividerButton';

// import buttonStyles from './buttonStyles.css';

const createDividerPlugin = (
  { blockType = 'divider', component = DefaultDivider } = {},
) => ({
  blockRendererFn: (block: ContentBlock) => {
    if (block.getType() === blockType) {
      return {
        component,
        editable: false,
      };
    }
  },
  //eslint-disable-next-line react/display-name
  DividerButton: (props: DividerButtonProps) => (
    <DividerButton {...props} blockType={blockType} />
  ),
});

export default createDividerPlugin;
