import React, { PureComponent } from 'react';
import { registerComponent, Components } from '../../../lib/vulcan-lib';
import { withUpdate } from '../../../lib/crud/withUpdate';
import { withMessages } from '../../common/withMessages';
import MenuItem from '@material-ui/core/MenuItem';
import { withApollo } from '@apollo/client/react/hoc';
import withUser from '../../common/withUser';
import { userCanDo } from '../../../lib/vulcan-users/permissions';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ArrowRightAlt from '@material-ui/icons/ArrowRightAlt';
import Undo from '@material-ui/icons/Undo';

const styles = (theme: ThemeType): JssStyles => ({
  iconRoot: {
    position: "relative",
    width:24,
  },
  omegaIcon: {
    position:"absolute !important",
    left:0,
    top: "7px !important",
    opacity:.3
  },
  moveIcon: {
    marginLeft:8,
    color: "black"
  },
  undoIcon: {
    marginLeft:8,
    width: 20,
    color: "black"
  }
})

interface ExternalProps {
  comment: CommentsList,
  post: PostsBase,
}
interface MoveToAlignmentMenuItemProps extends ExternalProps, WithMessagesProps, WithUserProps, WithStylesProps, WithUpdateCommentProps, WithApolloProps {
}

class MoveToAlignmentMenuItem extends PureComponent<MoveToAlignmentMenuItemProps,{}> {

  handleMoveToAlignmentForum = async () => {
    const { comment, updateComment, client, flash, currentUser, } = this.props
    if (!currentUser) return;
    await updateComment({
      selector: { _id: comment._id},
      data: {
        af: true,
        afDate: new Date(),
        moveToAlignmentUserId: currentUser._id
      },
    })
    client.resetStore()
    flash("Comment and its parents moved to AI Alignment Forum")
  }

  handleRemoveFromAlignmentForum = async () => {
    const { comment, updateComment, client, flash } = this.props

    await updateComment({
      selector: { _id: comment._id},
      data: {
        af: false,
        afDate: null,
        moveToAlignmentUserId: null
      },
    })

    client.resetStore()
    flash("Comment and its children removed from AI Alignment Forum")
  }

  render() {
    const { comment, post, currentUser, classes } = this.props
    const { OmegaIcon } = Components
    if (post.af && userCanDo(currentUser, 'comments.alignment.move.all')) {
      if (!comment.af) {
        return (
          <MenuItem onClick={ this.handleMoveToAlignmentForum}>
            <ListItemIcon>
              <span className={classes.iconRoot}>
                <OmegaIcon className={classes.omegaIcon}/>
                <ArrowRightAlt className={classes.moveIcon}/>
              </span>
            </ListItemIcon>
            Move to Alignment
          </MenuItem>
        )
      } else {
        return (
          <MenuItem onClick={ this.handleRemoveFromAlignmentForum }>
            <ListItemIcon>
              <span className={classes.iconRoot}>
                <OmegaIcon className={classes.omegaIcon} />
                <Undo className={classes.undoIcon}/>
              </span>
            </ListItemIcon>
            Remove from Alignment
          </MenuItem>
        )
      }
    } else  {
      return null
    }
  }
}

const MoveToAlignmentMenuItemComponent = registerComponent<ExternalProps>(
  'MoveToAlignmentMenuItem', MoveToAlignmentMenuItem, {
    styles,
    hocs: [
      withUpdate({
        collectionName: "Comments",
        fragmentName: 'CommentsList',
      }),
      withMessages, withApollo, withUser
    ]
  }
);

declare global {
  interface ComponentTypes {
    MoveToAlignmentMenuItem: typeof MoveToAlignmentMenuItemComponent
  }
}
