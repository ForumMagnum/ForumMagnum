import React from 'react';
import { Components, registerComponent, } from '../../lib/vulcan-lib';
import classNames from 'classnames';
import SubdirectoryArrowLeftIcon from '@material-ui/icons/SubdirectoryArrowLeft';

const styles = (theme: ThemeType): JssStyles => ({
  button: {
    color: "rgba(0,0,0,.5)",
    fontSize: "12px",
    left: 4,
    transition: "all 450ms cubic-bezier(0.23, 1, 0.32, 1) 0ms",
  },
  hideButton: {
    position: "relative",
    top: 2,
    transform: "rotate(90deg)",
  },
  showButton: {
    position: "relative",
    top: 4,
    transform: "rotate(-90deg)",
  },
});

const ShowOrHideHighlightButton = ({open, className, classes}: {
  open: boolean,
  className?: string,
  classes: ClassesType,
}) =>
  <span className={className}>
    { open
      ? <Components.MetaInfo>
          Hide Highlight
          <SubdirectoryArrowLeftIcon className={classNames(classes.button, classes.hideButton)}/>
        </Components.MetaInfo>
      : <Components.MetaInfo>
          Show Highlight
          <SubdirectoryArrowLeftIcon className={classNames(classes.button, classes.showButton)}/>
        </Components.MetaInfo>
    }
  </span>

const ShowOrHideHighlightButtonComponent = registerComponent("ShowOrHideHighlightButton", ShowOrHideHighlightButton, {styles});

declare global {
  interface ComponentTypes {
    ShowOrHideHighlightButton: typeof ShowOrHideHighlightButtonComponent
  }
}
