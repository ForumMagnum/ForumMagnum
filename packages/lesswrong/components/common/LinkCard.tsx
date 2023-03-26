import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import classNames from 'classnames';
import { Link } from '../../lib/reactRouterWrapper';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    cursor: "pointer",
    position: "relative",
    borderRadius: theme.borderRadius.default,
    "& a": {
      position: "relative",
    },
  },
  background: {
    width: "100%",
    height: "100%",
    position: "absolute",
    left: 0,
    top: 0,
    zIndex: theme.zIndexes.linkCard,
    "& a": {
      position: "absolute",
      width: "100%",
      height: "100%",
      left: 0,
      top: 0,
    },
  },
});

// A clickable card which can contain clickable links. This exists to work
// around a limitation of HTML, which is that you can't nest <a> tags in <a>
// tags, and making the outer link be a Javascript link breaks the default
// Cmd/Ctrl/Middle-Click to open in new tab interaction. So, following a hack
// described in https://www.sarasoueidan.com/blog/nested-links/, we make the
// card background and card contents siblings rather than nested, then use
// z-index to control which is clickable.
const LinkCard = ({children, to, tooltip, className, classes, onClick, clickable}: {
  children?: React.ReactNode,
  to: string,
  tooltip?: any,
  className?: string,
  classes: ClassesType,
  onClick?: any,
  clickable?: boolean
}) => {
  const { LWTooltip } = Components
  const card = (
    <div className={classNames(className, classes.root)}>
      <div className={classes.background}>
        {onClick ? <a onClick={onClick}/> : <Link to={to} />}
      </div>
      {children}
    </div>
  );
  
  if (tooltip) {
    return <LWTooltip className={classNames(className, classes.root)} title={tooltip} placement="bottom-start" tooltip={false} inlineBlock={false} clickable={clickable} flip={false}>
      {card}
    </LWTooltip>;
  } else {
    return <div className={classNames(className, classes.root)}>
      {card}
      </div>
  }
}


const LinkCardComponent = registerComponent("LinkCard", LinkCard, {styles});

declare global {
  interface ComponentTypes {
    LinkCard: typeof LinkCardComponent
  }
}
