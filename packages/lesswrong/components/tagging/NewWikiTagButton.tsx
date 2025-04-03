import React from 'react';
import Paper from '@/lib/vendor/@material-ui/core/src/Paper';
import AddBoxIcon from '@/lib/vendor/@material-ui/icons/src/AddBox';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { useCurrentUser } from '../common/withUser';
import { useDialog } from '@/components/common/withDialog';
import { tagCreateUrl, tagUserHasSufficientKarma } from '../../lib/collections/tags/helpers';
import { useHover } from '../common/withHover';
import { AnalyticsContext } from '@/lib/analyticsEvents';

const styles = defineStyles("NewWikiTagButton", (theme: ThemeType) => ({
  addTagButton: {
    zIndex: theme.zIndexes.newWikiTagButton,
    cursor: "pointer",
    color: theme.palette.primary.dark,
    marginBottom: -10,
    display: 'flex',
    alignItems: 'center',
    '& svg': {
      color: `${theme.palette.primary.dark} !important`,
      marginRight: 4,
    },
    '& span': {
      '@media (max-width: 400px)': {
        display: 'none',
      },
    },
  },
  addTagDropdownPopper: {
    marginTop: 8,
    marginLeft: 12,
  },
}));

const NewWikiTagButton = ({ hideLabel=false, className }: {
  hideLabel?: boolean,
  className?: string
}) => {
  const classes = useStyles(styles);
  const { SectionButton, LWPopper, DropdownMenu, DropdownItem, DropdownDivider } = Components;
  const { eventHandlers, hover, forceUnHover, anchorEl } = useHover();
  const currentUser = useCurrentUser();
  const { openDialog } = useDialog();

  const handleLogin = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    openDialog({
      componentName: "LoginPopup",
      componentProps: {},
    });
  };

  if (!currentUser) {
    return (
      <AnalyticsContext pageElementContext="newWikiTagButton">
        <div className={className}>
          <SectionButton onClick={handleLogin}>
            <div className={classes.addTagButton}>
              <AddBoxIcon />
              {!hideLabel && <span>New Wikitag</span>}
            </div>
          </SectionButton>
        </div>
      </AnalyticsContext>
    );
  }

  if (!tagUserHasSufficientKarma(currentUser, "new")) {
    return null;
  }

  return (
    <AnalyticsContext pageElementContext="newWikiTagButton">
      <div {...eventHandlers} className={className}>
        <SectionButton>
          <div className={classes.addTagButton} style={{ cursor: "pointer" }}>
            <AddBoxIcon />
            {!hideLabel && <span>New Wikitag</span>}
          </div>
          <LWPopper
            open={hover}
            anchorEl={anchorEl}
            placement="bottom-start"
            className={classes.addTagDropdownPopper}
          >
            <Paper>
              <DropdownMenu>
                <div onClick={() => forceUnHover()}>
                  <DropdownItem title="Wiki Only" to={`${tagCreateUrl}?type=wiki`} />
                  <DropdownItem title="Wiki + Tag" to={tagCreateUrl} />
                  <DropdownDivider />
                  <DropdownItem 
                    title={<span><em>What's the difference?</em></span>} 
                    to="/w/what-s-a-wikitag"
                    onClick={() => forceUnHover()}
                  />
                </div>
              </DropdownMenu>
            </Paper>
          </LWPopper>
        </SectionButton>
      </div>
    </AnalyticsContext>
  );
};

const NewWikiTagButtonComponent = registerComponent("NewWikiTagButton", NewWikiTagButton);

export default NewWikiTagButtonComponent;

declare global {
  interface ComponentTypes {
    NewWikiTagButton: typeof NewWikiTagButtonComponent;
  }
} 
