import React, { Component } from 'react'
import { withStyles } from '@material-ui/core/styles';
import { registerComponent, Components } from 'meteor/vulcan:core';
import HistoryIcon from '@material-ui/icons/History';
import Menu from '@material-ui/core/Menu';
import Tooltip from '@material-ui/core/Tooltip';
import moment from 'moment-timezone';


const styles = theme => ({
  icon: {
    verticalAlign: 'text-top',
    fontSize: 'inherit',
    marginRight: 4
  },
  button: {
    cursor: 'pointer'
  }
})

class PostsRevisionSelector extends Component {
  state = {
    anchorEl: null
  }
  openMenu = (event) => {
    this.setState({anchorEl: event.currentTarget})
  }
  closeMenu = () => {
    this.setState({anchorEl: null})
  }
  render() {
    const { classes, post } = this.props
    const { anchorEl } = this.state
    const { PostsRevisionsList } = Components
    const tooltip = anchorEl ? null : <span>
      This post has major past revisions. Click to view. <br/>
      <em>Originally published: {moment(new Date(post.postedAt)).format("LLL z")}</em>
    </span>
    return <React.Fragment>
      <Tooltip title={tooltip}>
        <span onClick={this.openMenu} className={classes.button}>
          <HistoryIcon className={classes.icon}/>
          <span>{moment(new Date(post.postedAt)).format("Do MMM YYYY")}</span>
        </span>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={this.closeMenu}
      >
        <PostsRevisionsList documentId={post._id}/>
      </Menu>
    </React.Fragment>
  }
}

registerComponent('PostsRevisionSelector', PostsRevisionSelector, withStyles(styles, {name: "PostsRevisionSelector"}))
