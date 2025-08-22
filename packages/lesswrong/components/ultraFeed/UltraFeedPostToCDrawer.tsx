import React from 'react';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { Drawer } from '../material-ui/Drawer';
import TableOfContentsRow from '../posts/TableOfContents/TableOfContentsRow';
import LWCommentCount from '../posts/TableOfContents/LWCommentCount';
import type { ToCData } from '../../lib/tableOfContents';
import { isRegularClick } from '../posts/TableOfContents/TableOfContentsList';

const styles = defineStyles("UltraFeedPostToCDrawer", (theme: ThemeType) => ({
  drawerPaper: {
    width: 300,
    [theme.breakpoints.down('sm')]: {
      width: '80vw',
      maxWidth: 300,
    },
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  tocContainer: {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    padding: 16,
  },
  commentCount: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingLeft: 28,
    paddingTop: 12,
    paddingBottom: 20,
    backgroundColor: theme.palette.background.pageActiveAreaBackground,
    borderTop: theme.palette.border.faint,
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: theme.palette.panelBackground.hoverHighlightGrey,
    },
  },
}));

interface UltraFeedPostToCDrawerProps {
  open: boolean;
  onClose: () => void;
  toc: ToCData | null;
  post: PostsListWithVotes | PostsPage | UltraFeedPostFragment;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
}

const UltraFeedPostToCDrawer = ({
  open,
  onClose,
  toc,
  post,
  scrollContainerRef,
}: UltraFeedPostToCDrawerProps) => {
  const classes = useStyles(styles);

  const scrollToElement = (elementId: string) => {
    const container = scrollContainerRef.current;
    const targetElement = elementId ? document.getElementById(elementId) : null;
    
    if (container) {
      if (!targetElement) {
        // No element ID means scroll to top
        container.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        const containerRect = container.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();
        const offsetInsideContainer = targetRect.top - containerRect.top;
        
        container.scrollTo({
          top: container.scrollTop + offsetInsideContainer - (container.clientHeight * 0.2),
          behavior: 'smooth',
        });
      }
    }
    
    onClose();
  };

  const scrollToComments = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    scrollToElement('comments');
  };

  if (!toc || !toc.sections || toc.sections.length === 0) {
    return null;
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      paperClassName={classes.drawerPaper}
      anchor="left"
    >
      <div className={classes.tocContainer}>
        <TableOfContentsRow
          href="#"
          onClick={(ev) => {
            if (isRegularClick(ev)) {
              ev.preventDefault();
              scrollToElement('');
            }
          }}
          highlighted={false}
          title
        >
          {post.title?.trim()}
        </TableOfContentsRow>
        
        {toc.sections.map((section) => (
          <TableOfContentsRow
            key={section.anchor}
            indentLevel={section.level}
            divider={section.divider}
            highlighted={false}
            href={`#${section.anchor}`}
            onClick={(ev) => {
              if (isRegularClick(ev)) {
                ev.preventDefault();
                scrollToElement(section.anchor);
              }
            }}
            answer={!!section.answer}
          >
            <span>{section.title?.trim()}</span>
          </TableOfContentsRow>
        ))}
      </div>
      
      {post.commentCount > 0 && (
        <div className={classes.commentCount} onClick={scrollToComments}>
          <LWCommentCount commentCount={post.commentCount} />
        </div>
      )}
    </Drawer>
  );
};

export default UltraFeedPostToCDrawer; 
