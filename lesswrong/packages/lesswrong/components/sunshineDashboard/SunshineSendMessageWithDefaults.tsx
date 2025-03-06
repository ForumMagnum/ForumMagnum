import React, {useState} from 'react';
import Menu from '@material-ui/core/Menu';
import { Link } from "../../lib/reactRouterWrapper";
import EditIcon from "@material-ui/icons/Edit";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { useMulti } from "../../lib/crud/withMulti";
import { useCurrentUser } from '../common/withUser';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import type { TemplateQueryStrings } from '../messaging/NewConversationButton'
import { commentBodyStyles } from '../../themes/stylePiping';
import ContentItemBody from "@/components/common/ContentItemBody";
import LWTooltip from "@/components/common/LWTooltip";
import NewConversationButton from "@/components/messaging/NewConversationButton";
import { MenuItem } from "@/components/common/Menus";

const MODERATION_TEMPLATES_URL = "/admin/moderationTemplates"

export const getTitle = (s: string|null) => s ? s.split("\\")[0] : ""

const styles = (theme: ThemeType) => ({
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
    ...commentBodyStyles(theme),
    backgroundColor: theme.palette.panelBackground.default,
    padding:12,
    boxShadow: theme.palette.boxShadow.sunshineSendMessage,
  },
  sendMessageButton: {
    marginTop: 8,
    padding: 8,
    paddingTop: 6,
    height: 32,
    wordBreak: "keep-all",
    fontSize: "1rem",
    border: theme.palette.border.faint,
    borderRadius: 2,
    color: theme.palette.grey[500],
    '&:hover': {
      backgroundColor: theme.palette.grey[200]
    }
  }
})

const SunshineSendMessageWithDefaults = ({ user, embedConversation, classes }: {
  user: SunshineUsersList|UsersMinimumInfo|null,
  embedConversation?: (conversationId: string, templateQueries: TemplateQueryStrings) => void,
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser()
  const [anchorEl, setAnchorEl] = useState<any>(null);
  
  const { results: defaultResponses } = useMulti({
    terms:{view:"moderationTemplatesList", collectionName: "Messages"},
    collectionName: "ModerationTemplates",
    fragmentName: 'ModerationTemplateFragment',
    limit: 50
  });

  if (!(user && currentUser)) return null
  
  return (
    <div className={classes.root}>
      <span
        className={classes.sendMessageButton}
        onClick={(ev) => setAnchorEl(ev.currentTarget)}
      >
        New Message
      </span>
      <Menu
        onClick={() => setAnchorEl(null)}
        open={!!anchorEl}
        anchorEl={anchorEl}
      >
        <MenuItem value={0}>
          <NewConversationButton user={user} currentUser={currentUser} includeModerators embedConversation={embedConversation}>
            New Message
          </NewConversationButton>
        </MenuItem>
        {defaultResponses && defaultResponses.map((template, i) =>
          <div key={`template-${template._id}`}>
            <LWTooltip tooltip={false} placement="left" title={
              <div className={classes.defaultMessage}>
                <ContentItemBody dangerouslySetInnerHTML={{__html:template.contents?.html || ""}}/>
              </div>}
            >
              <MenuItem>
                <NewConversationButton user={user} currentUser={currentUser} templateQueries={{templateId: template._id, displayName: user.displayName}} includeModerators embedConversation={embedConversation}>
                  {template.name}
                </NewConversationButton>
              </MenuItem>
            </LWTooltip>
          </div>)}
          <Link to={MODERATION_TEMPLATES_URL}>
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

export default SunshineSendMessageWithDefaultsComponent;
