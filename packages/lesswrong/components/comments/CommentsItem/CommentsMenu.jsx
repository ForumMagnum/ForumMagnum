import React, { PureComponent } from 'react';
import { registerComponent, Components } from 'meteor/vulcan:core';
import PropTypes from 'prop-types';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import Menu from '@material-ui/core/Menu';

import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  root: {
    position:"absolute",
    right:0,
    top:0,
    padding: theme.spacing.unit,
  },
  icon: {
    fontSize:"1.4rem",
    color: theme.palette.grey[400]
  },
  menu: {
    position:"absolute",
    right:0,
    top:0,
    zIndex: 1,
  }
})

class CommentsMenu extends PureComponent {
  state = {anchorEl:null}

  handleClick = event => {
    this.setState({ anchorEl: event.currentTarget });
  }

  handleClose = () => {
    this.setState({anchorEl: null})
  }

  render() {
    const { children, classes } = this.props
    const { anchorEl } = this.state
    return (
      <span className={classes.root}>
        <MoreVertIcon
          className={classes.icon}
          onClick={this.handleClick}
        />
        <Menu
          onClick={this.handleClose}
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
        >
          {children}
        </Menu>
      </span>
    )
  }
}

registerComponent('CommentsMenu', CommentsMenu, withStyles(styles))
