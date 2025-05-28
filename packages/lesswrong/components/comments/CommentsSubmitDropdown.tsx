import React, { useCallback, useRef, useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { AnalyticsContext, useTracking } from '@/lib/analyticsEvents';
import { preferredHeadingCase } from '@/themes/forumTheme';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import ForumIcon from '../common/ForumIcon';
import LWPopper from '../common/LWPopper';
import LWClickAwayListener from '../common/LWClickAwayListener';
import DropdownMenu from '../dropdowns/DropdownMenu';
import DropdownItem from '../dropdowns/DropdownItem';
import { Paper } from '../widgets/Paper';

const styles = (theme: ThemeType) => ({
  buttonWrapper: {
    backgroundColor: theme.palette.primary.main,
    borderTopRightRadius: theme.borderRadius.default,
    borderBottomRightRadius: theme.borderRadius.default,
    display: 'flex',
  },
  divider: {
    width: 1,
    opacity: 0.9,
    flex: 1,
    marginTop: 'auto',
    marginBottom: 'auto',
    height: "calc(100% - 12px)",
    backgroundColor: theme.palette.text.alwaysWhite,
  },
  button: {
    borderRadius: theme.borderRadius.default,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    padding: '6px 4px',
    minWidth: 0,
    boxShadow: 'none',
  },
  dropdownIcon: {
    transform: 'translateY(1px)'
  },
  popper: {
    marginTop: 6
  }
});

export const CommentsSubmitDropdown = ({ handleSubmit, classes }: {
  handleSubmit: (meta: {draft: boolean}) => Promise<void>,
  classes: ClassesType<typeof styles>,
}) => {
  const { captureEvent } = useTracking()

  const [menuOpen, innerSetMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null)

  const setMenuOpen = useCallback((open: boolean) => {
    captureEvent("menuToggled", { openAfter: open, pageElementContext: "CommentsSubmitDropdown" });
    innerSetMenuOpen(open);
  }, [captureEvent, innerSetMenuOpen])

  return (
    <AnalyticsContext pageElementContext="CommentsSubmitDropdown">
      <div ref={dropdownRef} className={classes.buttonWrapper}>
        <div className={classes.divider} />
        <Button
          variant="contained"
          color="primary"
          className={classes.button}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <ForumIcon className={classes.dropdownIcon} icon="ThickChevronDown" />
        </Button>
      </div>
      <LWPopper
        open={menuOpen}
        anchorEl={dropdownRef.current}
        placement="bottom-end"
        className={classes.popper}
      >
        <LWClickAwayListener onClickAway={() => setMenuOpen(false)}>
          <Paper>
            <DropdownMenu>
              <DropdownItem
                title={preferredHeadingCase("Save As Draft")}
                onClick={() => {
                  void handleSubmit({ draft: true });
                  setMenuOpen(false);
                }}
              />
            </DropdownMenu>
          </Paper>
        </LWClickAwayListener>
      </LWPopper>
    </AnalyticsContext>
  );
}

export default registerComponent('CommentsSubmitDropdown', CommentsSubmitDropdown, {styles});
