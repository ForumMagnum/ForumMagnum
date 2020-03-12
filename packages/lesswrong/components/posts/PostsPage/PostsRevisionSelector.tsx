import React, { Component } from 'react'
import { registerComponent, Components } from '../../../lib/vulcan-lib';
import HistoryIcon from '@material-ui/icons/History';
import Menu from '@material-ui/core/Menu';
import Tooltip from '@material-ui/core/Tooltip';
import moment from '../../../lib/moment-timezone';


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

interface PostsRevisionSelectorProps extends WithStylesProps {
  post: PostsBase,
  format: any,
}
interface PostsRevisionSelectorState {
  anchorEl: any,
}

class PostsRevisionSelector extends Component<PostsRevisionSelectorProps,PostsRevisionSelectorState> {
  state: PostsRevisionSelectorState = {
    anchorEl: null
  }
  openMenu = (event) => {
    this.setState({anchorEl: event.currentTarget})
  }
  closeMenu = () => {
    this.setState({anchorEl: null})
  }
  render() {
    const { classes, post, format } = this.props
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
          <span>{ format ? 
            moment(new Date(post.postedAt)).format(format) :
            moment(new Date(post.postedAt)).fromNow()
          }</span>
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

const PostsRevisionSelectorComponent = registerComponent('PostsRevisionSelector', PostsRevisionSelector, {styles});

declare global {
  interface ComponentTypes {
    PostsRevisionSelector: typeof PostsRevisionSelectorComponent
  }
}
