import React from 'react';
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import {Link} from "../../lib/reactRouterWrapper";
import EditIcon from "@material-ui/icons/Edit";
import {Components, registerComponent} from "../../lib/vulcan-lib";
import { useTagBySlug } from '../tagging/useTag'
import { useMulti } from "../../lib/crud/withMulti";
import { useCurrentUser } from '../common/withUser';


export const getTitle = (s: string|null) => s ? s.split("\\")[0] : ""

const styles = (theme: ThemeType): JssStyles => ({
  editIcon: {
    width: 20,
    color: theme.palette.grey[400]
  },
  defaultMessage: {
    maxWidth: 500,
    backgroundColor: "white",
    padding:12,
    boxShadow: "0 0 10px rgba(0,0,0,0.5)"
  }
})

const SunshineSendMessageWithDefaults = ({ user, tagSlug, classes }: {
  user: SunshineUsersList|UsersMinimumInfo|null,
  tagSlug: string,
  classes: ClassesType,
}) => {
  
  const { CommentBody, LWTooltip, NewConversationButton } = Components
  
  const currentUser = useCurrentUser()
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
    <div>
      {user && <Select value={0} variant="outlined">
        <MenuItem value={0}>
          <NewConversationButton user={user} currentUser={currentUser}>
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
                {console.log({comment, commentId: comment._id})}
                <NewConversationButton user={user} currentUser={currentUser} templateCommentId={comment._id}>
                  {getTitle(comment.contents?.plaintextMainText || null)}
                </NewConversationButton>
              </MenuItem>
            </LWTooltip>
          </div>)}
      </Select>}
      <Link to={`/tag/${tagSlug}/discussion`}><EditIcon className={classes.editIcon}/></Link>
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
