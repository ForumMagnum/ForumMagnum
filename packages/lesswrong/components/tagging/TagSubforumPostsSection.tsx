import React, { useCallback, useEffect, useRef, useState } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import AddBoxIcon from '@material-ui/icons/AddBox';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    padding: '0 10px',
  },
  postsScrollContainer: {
    overflowY: 'scroll',
  },
  newPostButton: {
    alignSelf: 'flex-end',
    marginBottom: 8,
  },
});

export const TagSubforumPostsSection = ({ classes, tag }: { classes: ClassesType; tag: TagSubforumFragment }) => {
  const {
    SectionButton,
    PostsList2,
  } = Components;

  const topRef = useRef<HTMLDivElement>(null);
  const [yPosition, setYPosition] = useState<number>()
  
  const recalculateYPosition = useCallback(() => {
    if (!topRef.current) return
    const bottomMargin = 40
    const newYPosition = topRef.current.getBoundingClientRect().top + bottomMargin
    if (newYPosition !== yPosition)
      setYPosition(newYPosition)
  }, [yPosition])

  useEffect(() => {
    recalculateYPosition()
    window.addEventListener('resize', recalculateYPosition)
    return () => window.removeEventListener('resize', recalculateYPosition)
  }, [recalculateYPosition])

  return (<>
    <div ref={topRef} />
    <div className={classes.root}>
      <a className={classes.newPostButton} href={`/newPost?subforumTagId=${tag._id}`}>
        <SectionButton>
          <AddBoxIcon />
          New Subforum Post
        </SectionButton>
      </a>
      <div className={classes.postsScrollContainer} style={{height: `calc(100vh - ${yPosition}px)`}}>
        <PostsList2 tagId={tag._id} />
      </div>
    </div>
    </>);
};

const TagSubforumPostsSectionComponent = registerComponent("TagSubforumPostsSection", TagSubforumPostsSection, { styles });

declare global {
  interface ComponentTypes {
    TagSubforumPostsSection: typeof TagSubforumPostsSectionComponent;
  }
}
