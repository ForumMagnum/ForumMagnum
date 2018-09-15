import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import defineComponent from '../../lib/defineComponent';
import Popper from '@material-ui/core/Popper';
import PropTypes from 'prop-types';

const styles = theme => ({
  root: {
    position:"relative",
    zIndex:1,
  },
  hoverInfo: {
    position: "relative",
    backgroundColor: theme.palette.grey[50],
    padding: theme.spacing.unit*2,
    border: "solid 1px rgba(0,0,0,.1)",
    boxShadow: "-3px 0 5px 0px rgba(0,0,0,.1)",
    zIndex: 200,
  }
})

const SidebarHoverOver = ({children, classes, hover, anchorEl, width=500}) => {
  return <Popper className={classes.root} open={hover} anchorEl={anchorEl} placement="left-start">
    <div className={classes.hoverInfo} style={{width:width}}>
        { children }
    </div>
  </Popper>
};

SidebarHoverOver.propTypes = {
  classes: PropTypes.object.isRequired,
  hover: PropTypes.bool.isRequired,
  anchorEl: PropTypes.object,
  width: PropTypes.number,
};

export default defineComponent({
  name: 'SidebarHoverOver',
  component: SidebarHoverOver,
  styles: styles,
});
