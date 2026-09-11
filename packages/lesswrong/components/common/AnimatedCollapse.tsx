import React, { useRef } from 'react';
import classNames from 'classnames';
import Transition from 'react-transition-group/Transition';
import { defineStyles, useStyles } from '../hooks/useStyles';

const styles = defineStyles('AnimatedCollapse', () => ({
  root: {
    display: 'grid',
    gridTemplateRows: '0fr',
    transition: 'grid-template-rows 200ms ease-in-out',
    '@media (prefers-reduced-motion: reduce)': {
      transition: 'none',
    },
  },
  expanded: {
    gridTemplateRows: '1fr',
  },
  content: {
    display: 'flow-root',
    minHeight: 0,
    overflow: 'hidden',
  },
  entered: {
    overflow: 'visible',
  },
}));

/** Keep content mounted during collapse, and release clipping once expanded. */
const AnimatedCollapse = ({ expanded, children }: {
  expanded: boolean,
  children: React.ReactNode,
}) => {
  const classes = useStyles(styles);
  const rootRef = useRef<HTMLDivElement>(null);

  return <Transition
    nodeRef={rootRef}
    in={expanded}
    timeout={200}
    mountOnEnter
    unmountOnExit
    onEnter={() => { rootRef.current?.getBoundingClientRect(); }}
  >
    {state => <div
      ref={rootRef}
      className={classNames(classes.root, {
        [classes.expanded]: state === 'entering' || state === 'entered',
      })}
      inert={!expanded}
    >
      <div className={classNames(classes.content, { [classes.entered]: state === 'entered' })}>
        {children}
      </div>
    </div>}
  </Transition>;
};

export default AnimatedCollapse;
