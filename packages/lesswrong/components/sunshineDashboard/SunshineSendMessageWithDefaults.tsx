import React, {useState} from 'react';
import MenuItem from "@material-ui/core/MenuItem";
import Menu from '@material-ui/core/Menu';
import { Link } from "../../lib/reactRouterWrapper";
import EditIcon from "@material-ui/icons/Edit";
import {Components, registerComponent} from "../../lib/vulcan-lib";
import { useTagBySlug } from '../tagging/useTag'
import { useMulti } from "../../lib/crud/withMulti";
import { useCurrentUser } from '../common/withUser';
import { taggingNameIsSet, taggingNamePluralSetting } from '../../lib/instanceSettings';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import { tagGetDiscussionUrl } from '../../lib/collections/tags/helpers';


export const getTitle = (s: string|null) => s ? s.split("\\")[0] : ""

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    display: "flex",
    alignItems: "center",
    cursor: "pointer"
  },
  editIcon: {
    width: 20,
    color: theme.palette.grey[400]
  },
  defaultMessage: {
    maxWidth: 500,
    backgroundColor: theme.palette.panelBackground.default,
    padding:12,
    boxShadow: theme.palette.boxShadow.sunshineSendMessage,
  },
  sendMessageButton: {
    padding: 8,
    height: 32,
    fontSize: "1rem",
    color: theme.palette.grey[500],
    '&:hover': {
      backgroundColor: theme.palette.grey[200]
    }
  }
})

const SunshineSendMessageWithDefaults = ({ user, tagSlug, classes }: {
  user: SunshineUsersList|UsersMinimumInfo|null,
  tagSlug: string,
  classes: ClassesType,
}) => {
  
  const { CommentBody, LWTooltip, NewConversationButton } = Components
  
  
  const currentUser = useCurrentUser()
  const [anchorEl, setAnchorEl] = useState<any>(null);
  
  const { tag: defaultResponsesTag } = useTagBySlug(tagSlug, "TagBasicInfo")
  const { results: defaultResponses } = useMulti({
    terms:{view:"defaultModeratorResponses", tagId: defaultResponsesTag?._id},
    collectionName: "Comments",
    fragmentName: 'CommentsListWithParentMetadata',
    fetchPolicy: 'cache-and-network',
    limit: 50
  });
  
  
  if (!(user && currentUser)) return null
  
  return (
    <div className={classes.root}>
      <span
        className={classes.sendMessageButton}
        onClick={(ev) => setAnchorEl(ev.currentTarget)}
      >
        Start Message
      </span>
      <Menu
        onClick={() => setAnchorEl(null)}
        open={!!anchorEl}
        anchorEl={anchorEl}
      >
        <MenuItem value={0}>
          <NewConversationButton user={user} currentUser={currentUser} includeModerators>
            Start a message
          </NewConversationButton>
        </MenuItem>
        {defaultResponses && defaultResponses.map((comment, i) =>
          <div key={`template-${comment._id}`}>
            <LWTooltip tooltip={false} placement="left" title={
              <div className={classes.defaultMessage}>
                <CommentBody comment={comment}/>
              </div>}
            >
              <MenuItem>
                <NewConversationButton user={user} currentUser={currentUser} templateCommentId={comment._id} includeModerators>
                  {getTitle(comment.contents?.plaintextMainText || null)}
                </NewConversationButton>
              </MenuItem>
            </LWTooltip>
          </div>)}
          <Link to={tagGetDiscussionUrl({slug: tagSlug})}>
            <MenuItem>
              <ListItemIcon>
                <EditIcon className={classes.editIcon}/>
              </ListItemIcon>
              <em>Edit Messages</em>
            </MenuItem>
          </Link>
        </Menu>

    </div>
  )
}

const SunshineSendMessageWithDefaultsComponent = registerComponent('SunshineSendMessageWithDefaults', SunshineSendMessageWithDefaults, {
  styles,
});

declare global {
  interface ComponentTypes {
    SunshineSendMessageWithDefaults: typeof SunshineSendMessageWithDefaultsComponent
  }
}
