import React, { createContext, useContext } from 'react';
import { Components, registerComponent } from '@/lib/vulcan-lib/components';
import { ConditionalVisibilitySettings } from './conditionalVisibility';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles("ConditionalVisibilityBlockDisplay", (theme) => ({
  revealHiddenBlocks: {
    "& .conditionallyVisibleBlock.defaultHidden": {
      display: "block",
    },
  },
}));

export const RevealHiddenBlocksContext = createContext(false);

const useBlockIsVisible = (options: ConditionalVisibilitySettings) => {
  const xor = (a: boolean, b: boolean): boolean => !(a && b) && (a || b);
  const  knowsRequisite = (otherPage: string) => false
  const  wantsRequisite = (otherPage: string) => false
  const  pathBeforeOrAfter = (otherPage: string, beforeOrAfter: "before"|"after") => false

  switch (options.type) {
    case "knowsRequisite":
      return xor(knowsRequisite(options.otherPage), options.inverted);
    case "wantsRequisite":
      return xor(wantsRequisite(options.otherPage), options.inverted);
    case "ifPathBeforeOrAfter":
      return xor(pathBeforeOrAfter(options.otherPage, options.order), options.inverted);

    case "unset":
    case "todo":
    case "fixme":
    case "comment":
    default:
      return false;
  }
}

const ConditionalVisibilityBlockDisplayInner = ({options, children}: {
  options: ConditionalVisibilitySettings,
  children: React.ReactNode,
}) => {
  const revealHiddenBlocks = useContext(RevealHiddenBlocksContext);

  // TODO: When options.type is "knowsRequisite", "wantsRequisite", or "ifPathBeforeOrAfter", this is sometimes true.
  const visible = useBlockIsVisible(options);
  
  if (revealHiddenBlocks) {
    return <Components.ShowBlockVisibilityCondition options={options}>
      {children}
    </Components.ShowBlockVisibilityCondition>
  } else if (visible) {
    if (options.inline) {
      return <span>{children}</span>
    } else {
      return <div>{children}</div>
    }
  } else {
    return null;
  }
}

export const RevealHiddenBlocks = ({children}: {
  children: React.ReactNode
}) => {
  const classes = useStyles(styles);
  return <RevealHiddenBlocksContext.Provider value={true}>
    <div className={classes.revealHiddenBlocks}>
      {children}
    </div>
  </RevealHiddenBlocksContext.Provider>
}

export const ConditionalVisibilityBlockDisplay = registerComponent('ConditionalVisibilityBlockDisplay', ConditionalVisibilityBlockDisplayInner);

declare global {
  interface ComponentTypes {
    ConditionalVisibilityBlockDisplay: typeof ConditionalVisibilityBlockDisplay
  }
}

