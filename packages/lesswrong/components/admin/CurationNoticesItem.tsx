import { postGetPageUrl } from '@/lib/collections/posts/helpers';
import { useCreate } from '@/lib/crud/withCreate';
import { useUpdate } from '@/lib/crud/withUpdate';
import { defaultEditorPlaceholder } from '@/lib/editor/make_editable';
import { Link } from '@/lib/reactRouterWrapper';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import { isFriendlyUI } from '@/themes/forumTheme';
import { useForm } from '@tanstack/react-form';
import classNames from 'classnames';
import React, { useState } from 'react';
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { commentBodyStyles } from '../../themes/stylePiping';
import { useCurrentUser } from '../common/withUser';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { TanStackCheckbox } from '../tanstack-form-components/TanStackCheckbox';
import { TanStackEditor, useEditorFormCallbacks } from '../tanstack-form-components/TanStackEditor';
import { submitButtonStyles } from '../tanstack-form-components/TanStackSubmit';

const styles = (theme: ThemeType) => ({
  root: {
    border: theme.palette.border.commentBorder,
    borderRadius: isFriendlyUI ? theme.borderRadius.small : undefined,
    cursor: "default",
    marginBottom: 20,
    background: theme.palette.background.pageActiveAreaBackground,
    padding: 12,
    position: "relative",
    paddingBottom: 24,
  },
  editButton: {
    ...theme.typography.body2,
    color: theme.palette.primary.main,
    padding: "0px 16px",
    fontSize: "16px",
    position: "absolute",
    right: 10,
    top: 10,
    textTransform: "uppercase",
    "&:hover": {
      opacity: 0.5,
    },
  },
  publishButton: {
    ...theme.typography.body2,
    color: theme.palette.primary.main,
    padding: "0px 16px",
    fontSize: "16px",
    position: "absolute",
    right: 10,
    bottom: 10,
    textTransform: "uppercase",
    "&:hover": {
      opacity: 0.5,
    },
  },
  meta: {
    "& > div": {
      marginRight: 5,
    },
    position: "relative",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    rowGap: "6px",
    marginBottom: 8,
    color: theme.palette.text.dim,
    paddingTop: "0.6em",
    marginRight: isFriendlyUI ? 40 : 20,
    "& a:hover, & a:active": {
      textDecoration: "none",
      color: isFriendlyUI ? undefined : `${theme.palette.linkHover.dim} !important`,
    },
  },
  postTitle: {
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    color: theme.palette.link.dim2,
  },
  username: {
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    fontWeight: 600,
    marginLeft: 25,
  },
  commentBody: {
    ...commentBodyStyles(theme)
  },
  publishButtonDisabled: {
    color: theme.palette.grey[500],
    cursor: "not-allowed",
  }
});

const formStyles = defineStyles('TanStackCurationNoticesForm', (theme: ThemeType) => ({
  fieldWrapper: {
    marginTop: theme.spacing.unit * 2,
    marginBottom: theme.spacing.unit * 2,
  },
  submitButton: submitButtonStyles(theme),
}));

type TanStackCurationNoticesFormProps = {
  initialData?: UpdateCurationNoticeDataInput & { _id: string };
  currentUser: UsersCurrent;
  postId: string;
  onSuccess: (doc: CurationNoticesFragment) => void;
};

const TanStackCurationNoticesForm = ({
  initialData,
  currentUser,
  postId,
  onSuccess,
}: TanStackCurationNoticesFormProps) => {
  const classes = useStyles(formStyles);
  const { LWTooltip, Error404 } = Components;

  const formType = initialData ? 'edit' : 'new';

  const {
    onSubmitCallback,
    onSuccessCallback,
    addOnSubmitCallback,
    addOnSuccessCallback
  } = useEditorFormCallbacks<typeof form.state.values, CurationNoticesFragment>();

  const { create } = useCreate({
    collectionName: 'CurationNotices',
    fragmentName: 'CurationNoticesFragment',
  });

  const { mutate } = useUpdate({
    collectionName: 'CurationNotices',
    fragmentName: 'CurationNoticesFragment',
  });

  const form = useForm({
    defaultValues: {
      ...initialData,
      ...(formType === 'new' ? {
        userId: currentUser._id,
        postId,
      } : {}),
    },
    onSubmit: async ({ value }) => {
      if (onSubmitCallback.current) {
        value = await onSubmitCallback.current(value);
      }

      let result: CurationNoticesFragment;
      if (formType === 'new') {
        const { data } = await create({ data: value });
        result = data?.createCurationNotice.data;
      } else {
        const { _id, ...valueWithoutId } = value;
        const { data } = await mutate({
          selector: { _id: initialData?._id },
          data: valueWithoutId,
        });
        result = data?.updateCurationNotice.data;
      }

      if (onSuccessCallback.current) {
        result = onSuccessCallback.current(result, {});
      }

      onSuccess(result);
    },
  });

  if (formType === 'edit' && !initialData) {
    return <Error404 />;
  }

  return (
    <form className="vulcan-form" onSubmit={(e) => {
      e.preventDefault();
      e.stopPropagation();
      void form.handleSubmit();
    }}>
      {/* TODO: add custom validation (simpleSchema present) */}
      <div className={classes.fieldWrapper}>
        <form.Field name="contents">
          {(field) => (
            <TanStackEditor
              field={field}
              document={form.state.values}
              formType={formType}
              hintText={defaultEditorPlaceholder}
              fieldName="contents"
              name="contents"
              collectionName="CurationNotices"
              commentEditor={true}
              commentStyles={true}
              hideControls={true}
              addOnSubmitCallback={addOnSubmitCallback}
              addOnSuccessCallback={addOnSuccessCallback}
            />
          )}
        </form.Field>
      </div>

      <div className={classes.fieldWrapper}>
        <form.Field name="deleted">
          {(field) => (
            <TanStackCheckbox
              field={field}
              label="Deleted"
            />
          )}
        </form.Field>
      </div>

      <div className="form-submit">
        <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
          {([canSubmit, isSubmitting]) => (
            <Button
              type="submit"
              disabled={!canSubmit || isSubmitting}
              className={classNames("primary-form-submit-button", classes.submitButton)}
            >
              Submit
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
};

export const CurationNoticesItem = ({curationNotice, classes}: {
  curationNotice: CurationNoticesFragment,
  classes: ClassesType<typeof styles>
}) => {
  const { ContentItemBody, Button, BasicFormStyles, WrappedSmartForm } = Components;

  const currentUser = useCurrentUser();

  const [edit, setEdit] = useState<boolean>(false)
  const [clickedPushing, setClickedPushing] = useState<boolean>(false)

  const { create } = useCreate({
    collectionName: "Comments",
    fragmentName: 'CommentsList'
  });

  const { mutate: updateCurrentCurationNotice } = useUpdate({
    collectionName: "CurationNotices",
    fragmentName: 'CurationNoticesFragment',
  });

  const { mutate: updatePost } = useUpdate({
    collectionName: "Posts",
    fragmentName: 'PostsList',
  });

  const publishCommentAndCurate = async (curationNotice: CurationNoticesFragment) => {
    const { contents, postId, userId } = curationNotice;
    if (clickedPushing) return;
    setClickedPushing(true)

    if (!contents) throw Error("Curation notice is missing contents")

    const { originalContents: { data, type } } = contents;

    const comment = {
      postId,
      userId,
      contents: {
        originalContents: { data, type }
      } as EditableFieldContents
    };

    try {
      const result = await create({ data: comment });
      const commentId = result.data?.createComment.data._id;
      await updateCurrentCurationNotice({
        selector: { _id: curationNotice._id },
        data: { commentId: commentId }
      });
      await updatePost({
        selector: { _id: curationNotice.postId },
        data: {
          reviewForCuratedUserId: curationNotice.userId,
          curatedDate: new Date(),
        }
      })
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error creating comment: ", error)
    }
  }

  if (curationNotice.post === null || !currentUser) return null;

  const { _id, contents, commentId, deleted } = curationNotice;

  return <div className={classes.root}>
    {edit ? 
      <div>
        <BasicFormStyles>
          {curationNotice.post.title}
          {/* <WrappedSmartForm
            collectionName="CurationNotices"
            documentId={curationNotice._id}
            mutationFragmentName={'CurationNoticesFragment'}
            queryFragmentName={'CurationNoticesFragment'}
            successCallback={() => setEdit(false)}
            prefilledProps={{userId: curationNotice.userId, postId: curationNotice.postId}}
          /> */}
          <TanStackCurationNoticesForm
            initialData={{ _id, contents, commentId, deleted }}
            currentUser={currentUser}
            postId={curationNotice.postId}
            onSuccess={() => setEdit(false)}
          />
        </BasicFormStyles>
      </div>
      : <>
        <div className={classes.meta}>
          <div>
            <Link to={postGetPageUrl(curationNotice.post)} className={classes.postTitle}>{curationNotice.post?.title}</Link>
            <span className={classes.username}>Curation by {curationNotice.user?.displayName}</span>
          </div>
        </div>
        {!curationNotice.commentId && <div
          onClick={() => setEdit(true)}
          className={classes.editButton}
        >
          Edit
        </div>}
        <ContentItemBody dangerouslySetInnerHTML={{__html: curationNotice.contents?.html ?? ''}} className={classes.commentBody}/>
        {!curationNotice.commentId && <div
          onClick={() => publishCommentAndCurate(curationNotice)}
          className={classNames(classes.publishButton, {
            [classes.publishButtonDisabled]: clickedPushing,
          })}
        >
          Publish & Curate
        </div>}
      </>
    }
    
  </div>
}

const CurationNoticesItemComponent = registerComponent('CurationNoticesItem', CurationNoticesItem, {styles});

declare global {
  interface ComponentTypes {
    CurationNoticesItem: typeof CurationNoticesItemComponent
  }
}


