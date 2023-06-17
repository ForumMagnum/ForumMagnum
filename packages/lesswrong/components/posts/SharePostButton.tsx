import React, { useRef, useState } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import withErrorBoundary from '../common/withErrorBoundary';
import classNames from 'classnames';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    display: "inline-block",
    verticalAlign: 'middle',
    marginRight: 16
  },
  icon: {
    fontSize: 22,
    cursor: "pointer",
    '&:hover': {
      opacity: '0.5'
    }
  },
})

const SharePostButton = ({
  post,
  className,
  classes,
}: {
  post: PostsBase,
  className?: string,
  classes: ClassesType,
}) => {
  const anchorEl = useRef<HTMLDivElement | null>(null)
  const [isOpen, setIsOpen] = useState<boolean>(false)

  const {ForumIcon, PopperCard, LWClickAwayListener, SharePostActions} = Components

  return <div className={classes.root}>
    <div ref={anchorEl}>
      <ForumIcon
        icon="Share"
        className={classNames(classes.icon, className)}
        onClick={() => setIsOpen(!isOpen)}
      />
    </div>
    <PopperCard
      open={isOpen}
      anchorEl={anchorEl.current}
      placement="bottom"
      allowOverflow
    >
      <LWClickAwayListener onClickAway={() => setIsOpen(false)}>
        <SharePostActions post={post} />
      </LWClickAwayListener>
    </PopperCard>
  </div>
}

const SharePostButtonComponent = registerComponent('SharePostButton', SharePostButton, {
  styles,
  hocs: [withErrorBoundary],
});

declare global {
  interface ComponentTypes {
    SharePostButton: typeof SharePostButtonComponent
  }
}
