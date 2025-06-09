import React, { useState } from 'react';
import { registerComponent } from "../../lib/vulcan-lib/components";
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import { DialogActions } from '../widgets/DialogActions';
import { useMessages } from '../common/withMessages';
import Input from '@/lib/vendor/@material-ui/core/src/Input';
import { useNavigate } from '../../lib/routeUtil';
import { isFriendlyUI, preferredHeadingCase } from '../../themes/forumTheme';
import UserMultiselect from "../form-components/UserMultiselect";
import LWDialog from "../common/LWDialog";
import Loading from "../vulcan-core/Loading";
import EAButton from "../ea-forum/EAButton";
import { useMutation } from "@apollo/client";
import { gql } from "@/lib/generated/gql-codegen";

const PostsEditMutation = gql(`
  mutation createPostNewDialogueDialog($data: CreatePostDataInput!) {
    createPost(data: $data) {
      data {
        ...PostsEdit
      }
    }
  }
`);

const styles = (theme: ThemeType) => ({
  dialog: {
    padding: 24,
    paddingBottom: isFriendlyUI ? undefined : 12,
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.text.normal,
    "& .MuiDialogActions-root": {
      margin: isFriendlyUI ? 0 : undefined,
    },
  },
  inputRow: {
    marginBottom: 12,
  },
  label: {
    ...theme.typography.body2,
    display: "inline-block",
  },
  titleInput: {
    ...theme.typography.body1,
    ...theme.typography.headerStyle,
    marginTop: 12,
    width: 400,
  },
  userMultiselect: {
    marginTop: 12,
    display: "inline-block",
  },
  header: {
    ...theme.typography.headerStyle,
    marginTop: 0
  },
  info: {
    ...theme.typography.body2,
    marginRight: 12
  }
})

const NewDialogueDialog = ({initialParticipantIds, onClose, classes}: {
  initialParticipantIds?: string[],
  onClose: () => void,
  classes: ClassesType<typeof styles>,
}) => {
  const [title, setTitle] = useState("");
  const {flash} = useMessages();
  const [participants, setParticipants] = useState<string[]>(initialParticipantIds ?? []);
  const [createPost, { loading }] = useMutation(PostsEditMutation);
  const navigate = useNavigate();

  async function createDialogue() {
    if (loading) return;
    if (!title.length) {
      flash("You must choose a title");
      return;
    }
    const createResult = await createPost({
      variables: {
        data: {
          title,
          draft: true,
          collabEditorDialogue: true,
          coauthorStatuses: participants.map(userId => ({ userId, confirmed: true, requested: false })),
          shareWithUsers: participants,
          sharingSettings: {
            anyoneWithLinkCan: "none",
            explicitlySharedUsersCan: "edit",
          },
          // Contents is a resolver only field, but there is handling for it
          // in `createMutator`/`updateMutator`
          ...({
            contents: {
              originalContents: {
                type: "ckEditorMarkup",
                data: ""
              }
            },
          }) as AnyBecauseHard,
        }
      },
    });
    if (createResult?.data?.createPost?.data) {
      const post = createResult?.data?.createPost?.data;
      if (post) {
        const postId = post._id;
        const postEditUrl = `/editPost?postId=${postId}`;
        navigate(postEditUrl);
        onClose();
      }
    }
  }

  const ButtonComponent = isFriendlyUI ? EAButton : Button;
  return <LWDialog
    open={true}
    onClose={onClose}
    fullWidth
    maxWidth={"sm"}
  >
    <div className={classes.dialog}>
      <h2 className={classes.header}>{preferredHeadingCase("Start Dialogue")}</h2>
      <p className={classes.info}>
        Invite users to a conversation where you can explore ideas, interview each other, or debate a topic. You can edit the transcript, and when you're ready, publish it as a post.
      </p>
      <p className={classes.info}>
        You'll be able to see each other's comments as you're writing.
      </p>
      <Input
        type="text"
        placeholder={preferredHeadingCase("Dialogue Title")}
        value={title}
        className={classes.titleInput}
        onChange={ev => setTitle(ev.currentTarget.value)}
      />
      <div className={classes.userMultiselect}>
        <UserMultiselect
          value={participants}
          setValue={setParticipants}
          label={preferredHeadingCase("Add Participants")}
        />
      </div>

      <DialogActions>
        {loading && <Loading/>}
        <ButtonComponent onClick={createDialogue} disabled={!!loading}>
          {preferredHeadingCase("Create Dialogue")}
        </ButtonComponent>
      </DialogActions>
    </div>
  </LWDialog>
}

export default registerComponent('NewDialogueDialog', NewDialogueDialog, {styles});


