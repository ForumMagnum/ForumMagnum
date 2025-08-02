import React, { useState, useCallback } from 'react';
import { userIsAdmin } from '../../lib/vulcan-users/permissions';
import { useCurrentUser } from '../common/withUser';
import { useMessages } from '../common/withMessages';
import { useMutation } from '@apollo/client/react';
import { gql } from '@/lib/generated/gql-codegen';
import SingleColumnSection from '../common/SingleColumnSection';
import SectionTitle from '../common/SectionTitle';
import UsersSearchAutoComplete from '../search/UsersSearchAutoComplete';
import { Typography } from '../common/Typography';
import EAButton from '../ea-forum/EAButton';
import Loading from '../vulcan-core/Loading';
import TextField from '@/lib/vendor/@material-ui/core/src/TextField';
import Checkbox from '@/lib/vendor/@material-ui/core/src/Checkbox';
import FormControlLabel from '@/lib/vendor/@material-ui/core/src/FormControlLabel';
import { useForm } from '@tanstack/react-form';
import { EditorFormComponent, useEditorFormCallbacks } from '../editor/EditorFormComponent';
import { defineStyles, useStyles } from '../hooks/useStyles';
import FriendlyInbox from '../messaging/FriendlyInbox';
import SingleUsersItem from '../form-components/SingleUsersItem';
import { getDraftMessageHtml } from '../../lib/collections/messages/helpers';

const defaultEditorPlaceholder = `We have templates! You can use {{displayName}} or {{firstName}}

Note: it takes a few seconds for the messages to appear in inbox below after sending`;


const styles = defineStyles('AdminMultiMessage', (theme: ThemeType) => ({
  root: {
    maxWidth: 800,
  },
  inboxWrapper: {
    minHeight: 600,
    maxHeight: 1000,
    overflow: 'scroll',
    // No profile images for us, tyvm!
    '& .UsersProfileImage-root': {
      filter: 'grayscale(100%)',
    },
  },
  section: {
    marginBottom: theme.spacing.unit * 3,
  },
  sectionTitle: {
    marginBottom: theme.spacing.unit * 2,
  },
  selectedUsers: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing.unit,
    marginTop: theme.spacing.unit * 2,
  },
  userChip: {
    backgroundColor: theme.palette.grey[200],
    borderRadius: theme.borderRadius.default,
    padding: '4px 8px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  removeButton: {
    cursor: 'pointer',
    color: theme.palette.grey[600],
    '&:hover': {
      color: theme.palette.grey[900],
    },
  },
  subjectInput: {
    width: '100%',
    marginBottom: theme.spacing.unit * 2,
    '& .MuiInput-underline:before': {
      borderBottom: 'none',
    },
    '& .MuiInputBase-input': {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
  },
  editorWrapper: {
    marginBottom: theme.spacing.unit * 2,
    backgroundColor: theme.palette.grey[100],
    padding: theme.spacing.unit * 2,
    borderRadius: theme.borderRadius.default,
  },
  checkboxWrapper: {
    marginBottom: theme.spacing.unit * 3,
  },
  successMessage: {
    color: theme.palette.primary.main,
    marginTop: theme.spacing.unit * 2,
  },
  inboxSection: {
    marginTop: theme.spacing.unit * 4,
  },
  inboxTitle: {
    marginBottom: theme.spacing.unit * 2,
  },
}));

interface SelectedUser {
  _id: string;
  displayName: string;
}

// Use createConversation to always create new conversations (not reuse existing ones)
const CREATE_CONVERSATION_MUTATION = gql(`
  mutation AdminMultiMessageCreateConversation($data: CreateConversationDataInput!) {
    createConversation(data: $data) {
      data {
        ...ConversationsMinimumInfo
      }
    }
  }
`);

const CREATE_MESSAGE_MUTATION = gql(`
  mutation AdminMultiMessageCreateMessage($data: CreateMessageDataInput!) {
    createMessage(data: $data) {
      data {
        ...messageListFragment
      }
    }
  }
`);

const AdminMultiMessage = () => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const { flash } = useMessages();
  const [selectedUsers, setSelectedUsers] = useState<SelectedUser[]>([]);
  const [subject, setSubject] = useState('');
  const [isModerator, setIsModerator] = useState(false);
  const [noEmail, setNoEmail] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [successCount, setSuccessCount] = useState<number | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>();
  const [inboxRefreshKey, setInboxRefreshKey] = useState(0);

  const [createConversationMutation] = useMutation(CREATE_CONVERSATION_MUTATION);
  const [createMessageMutation] = useMutation(CREATE_MESSAGE_MUTATION);

  const {
    onSubmitCallback,
    onSuccessCallback,
    addOnSubmitCallback,
    addOnSuccessCallback
  } = useEditorFormCallbacks();

  const form = useForm({
    defaultValues: {
      contents: {
        originalContents: {
          type: 'html',
          data: '',
        },
      },
    },
    onSubmit: async ({ formApi }) => {
      if (selectedUsers.length === 0) {
        flash({ messageString: 'Please select at least one user', type: 'error' });
        return;
      }

      if (!subject.trim()) {
        flash({ messageString: 'Please enter a subject', type: 'error' });
        return;
      }

      const messageContents = formApi.state.values.contents;
      if (!messageContents?.originalContents?.data) {
        flash({ messageString: 'Please enter a message', type: 'error' });
        return;
      }

      setIsSending(true);
      setSuccessCount(null);
      let successfulSends = 0;

      try {
        await onSubmitCallback.current?.();

        for (const user of selectedUsers) {
          try {
            // Always create a new conversation (not reuse existing ones)
            const { data: conversationResult } = await createConversationMutation({
              variables: { 
                data: {
                  participantIds: [currentUser!._id, user._id],
                  moderator: isModerator,
                  title: subject || undefined,
                },
              },
            });

            const conversation = conversationResult?.createConversation?.data;
            if (conversation?._id) {
              const processedHtml = getDraftMessageHtml({
                html: messageContents.originalContents.data,
                displayName: user.displayName
              });
              
              const processedContents = {
                ...messageContents,
                originalContents: {
                  ...messageContents.originalContents, // putting modified contents here is weird but apparently that's the pattern /shrug
                  data: processedHtml
                }
              };
              
              const messageData = {
                userId: currentUser!._id,
                conversationId: conversation._id,
                contents: processedContents,
                ...(noEmail && { noEmail: true }),
              };

              await createMessageMutation({
                variables: { data: messageData },
              });

              successfulSends++;
            }
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error(`Failed to send message to user ${user.displayName}:`, error);
          }
        }

        if (successfulSends > 0) {
          setSuccessCount(successfulSends);
          
          setSubject('');
          formApi.reset();
          setSelectedUsers([]);
          setIsModerator(false);
          setNoEmail(false);
          
          setInboxRefreshKey(prev => prev + 1);
        }

        if (successfulSends < selectedUsers.length) {
          flash({
            messageString: `Successfully sent to ${successfulSends} out of ${selectedUsers.length} users`,
            type: 'success',
          });
        } else {
          flash({
            messageString: `Successfully sent messages to all ${successfulSends} users`,
            type: 'success',
          });
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error sending messages:', error);
        flash({ messageString: 'Error sending messages', type: 'error' });
      } finally {
        setIsSending(false);
      }
    },
  });

  const handleUserSelect = useCallback((userId: string, user: SearchUser) => {
    if (!selectedUsers.find(u => u._id === userId)) {
      setSelectedUsers([...selectedUsers, { _id: userId, displayName: user.displayName }]);
    }
  }, [selectedUsers]);

  const handleRemoveUser = useCallback((userId: string) => {
    setSelectedUsers(selectedUsers.filter(u => u._id !== userId));
  }, [selectedUsers]);

  if (!userIsAdmin(currentUser)) {
    return <SingleColumnSection>
      <p>Sorry, you do not have permission to access this page.</p>
    </SingleColumnSection>;
  }

  return <>
    <SingleColumnSection className={classes.root}>
      <SectionTitle title="Admin Multi-Message" />
      
      <form onSubmit={(e) => {
        e.preventDefault();
        void form.handleSubmit();
      }}>
        <div className={classes.section}>
          <UsersSearchAutoComplete
            clickAction={handleUserSelect}
            label="Search for users"
          />
          {selectedUsers.length > 0 && (
            <div className={classes.selectedUsers}>
              {selectedUsers.map(user => (
                <SingleUsersItem
                  key={user._id}
                  userId={user._id}
                  removeItem={handleRemoveUser}
                />
              ))}
            </div>
          )}
        </div>

        <div className={classes.section}>
          <TextField
            label="Subject Line"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className={classes.subjectInput}
            fullWidth
          />

          <div className={classes.editorWrapper}>
            <form.Field name="contents">
              {(field) => (
                <EditorFormComponent
                  field={field}
                  name="contents"
                  formType="new"
                  document={form.state.values}
                  addOnSubmitCallback={addOnSubmitCallback}
                  addOnSuccessCallback={addOnSuccessCallback}
                  hintText={defaultEditorPlaceholder}
                  fieldName="contents"
                  collectionName="Messages"
                  commentEditor={true}
                  commentStyles={true}
                />
              )}
            </form.Field>
          </div>

          <div className={classes.checkboxWrapper}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={isModerator}
                  onChange={(e) => setIsModerator(e.target.checked)}
                  color="primary"
                />
              }
              label="Send as moderator message"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={noEmail}
                  onChange={(e) => setNoEmail(e.target.checked)}
                  color="primary"
                />
              }
              label="No email notifications"
              style={{ marginLeft: 16 }}
            />
          </div>
        </div>

        <form.Subscribe selector={(s) => [s.isSubmitting]}>
          {([isSubmitting]) => (
            <EAButton
              type="submit"
              disabled={isSending || isSubmitting || selectedUsers.length === 0}
            >
              {isSending ? (
                <>Sending... <Loading /></>
              ) : (
                `Send to ${selectedUsers.length} user${selectedUsers.length !== 1 ? 's' : ''}`
              )}
            </EAButton>
          )}
        </form.Subscribe>
      </form>

      {successCount !== null && (
        <Typography variant="body2" className={classes.successMessage}>
          Successfully sent messages to {successCount} user{successCount !== 1 ? 's' : ''}
        </Typography>
      )}
    </SingleColumnSection>
    
      <div className={classes.inboxWrapper}>
        <FriendlyInbox
          key={inboxRefreshKey}
          currentUser={currentUser}
          terms={{
            view: "userConversations",
            userId: currentUser._id,
            showArchive: false,
          }}
          conversationId={selectedConversationId}
          onSelectConversation={setSelectedConversationId}
        />
      </div>
  </>;
};

export default AdminMultiMessage;
