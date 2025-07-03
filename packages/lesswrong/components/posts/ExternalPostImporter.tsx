import React, { useState, useEffect, useRef } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useMutation } from "@apollo/client/react";
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import { useCurrentUser } from '../common/withUser';
import CKEditor from '@/lib/vendor/ckeditor5-react/ckeditor';
import { getCkPostEditor, getCkCommentEditor } from '@/lib/wrapCkEditor';
import { ckEditorStyles } from '@/themes/stylePiping';
import { forumTypeSetting } from '@/lib/instanceSettings';
import classNames from 'classnames';
import { useMessages } from '../common/withMessages';
import ContentStyles from "../common/ContentStyles";
import { Typography } from "../common/Typography";
import Loading from "../vulcan-core/Loading";
import { gql } from "@/lib/generated/gql-codegen";
import { maybeDate } from '@/lib/utils/dateUtils';

const PostsListUpdateMutation = gql(`
  mutation updatePostExternalPostImporter($selector: SelectorInput!, $data: UpdatePostDataInput!) {
    updatePost(selector: $selector, data: $data) {
      data {
        ...PostsList
      }
    }
  }
`);

const CommentsListMutation = gql(`
  mutation createCommentExternalPostImporter($data: CreateCommentDataInput!) {
    createComment(data: $data) {
      data {
        ...CommentsList
      }
    }
  }
`);

export type ExternalPostImportData = {
  alreadyExists: boolean;
  post: {
    _id: string;
    slug: string | null;
    title: string | null;
    url: string | null;
    postedAt: string | null;
    createdAt: string | null;
    userId: string | null;
    modifiedAt: string | null;
    draft: boolean | null;
    content: string | null;
    coauthorStatuses: Array<{
      userId: string | null;
      confirmed: boolean | null;
      requested: boolean | null;
    }> | null;
  };
};

const styles = (theme: ThemeType) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    width: "100%",
    padding: '12px 16px',
    borderRadius: theme.borderRadius.quickTakesEntry
  },
  loadingDots: {
    marginTop: -8,
  },
  input: {
    fontWeight: 500,
    backgroundColor: theme.palette.grey[100],
    borderRadius: theme.borderRadius.small,
    boxShadow: `0px 0px 10px ${theme.palette.inverseGreyAlpha(1)}, 0 0 0 10px ${theme.palette.inverseGreyAlpha(1)}`,
    padding: '12px 8px',
    '&:hover, &:focus': {
      backgroundColor: theme.palette.grey[200],
    },
    flexGrow: 1,
  },
  formButton: {
    fontSize: "16px",
    color: theme.palette.lwTertiary.main,
    marginLeft: "5px",
    "&:hover": {
      opacity: .5,
      backgroundColor: "none",
    },
  },
  inputGroup: {
    display: 'flex',
    gap: '8px',
    marginTop: '1em',
  },
  error: {
    lineHeight: '18px',
    textAlign: 'center',
    color: theme.palette.error.main,
  },
  editorContainer: {
    marginTop: 12,
    marginBottom: 24,
    '& .ck.ck-editor__editable': {
      minHeight: 100,
    },
    ...ckEditorStyles(theme),
    padding: 10,
    backgroundColor: theme.palette.grey[120],
  },
  commentEditorContainer: {
    marginTop: 12,
    '& .ck.ck-editor__editable': {
      minHeight: 100,
    },
    ...ckEditorStyles(theme),
    padding: 10,
    backgroundColor: theme.palette.grey[120],
  },
  editorButtons: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  submitButton: {},
  cancelButton: {
    color: theme.palette.grey[400],
  },
  importEditors: {
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
  },
  importLabel: {
    fontStyle: 'italic',
  },
  importTitle: {
    marginTop: 20,
    fontSize: '2.5em',
    fontWeight: 500,
    fontFamily: theme.palette.fonts.serifStack,
  },
  importButton: {
    width: 120
  },
  successMessage: {
    marginBottom: 32,
    fontSize: '1.6rem',
  },
});

const ImportedPostEditor = ({
  post,
  onContentChange,
  classes,
}: {
  post: ExternalPostImportData['post'];
  onContentChange: (updatedContent: string) => void;
  classes: ClassesType<typeof styles>;
}) => {
  const [editorValue, setEditorValue] = useState<string>(post.content || '');
  const ckEditorRef = useRef<CKEditor<any> | null>(null);
  const editorRef = useRef<any>(null);

  useEffect(() => {
    onContentChange(editorValue);
  }, [editorValue, onContentChange]);

  return (
    <div className={classes.editorContainer}>
      <ContentStyles contentType="post">
        <CKEditor
          isCollaborative={false}
          editor={getCkPostEditor(false)}
          data={editorValue}
          ref={ckEditorRef}
          config={{
            // Other configurations as needed
          }}
          onReady={(editor: any) => {
            editorRef.current = editor;
          }}
          onChange={(_event: any, editor: any) => {
            setEditorValue(editor.getData());
          }}
        />
      </ContentStyles>
    </div>
  );
};

const CommentEditor = ({
  onPublish,
  onCancel,
  classes,
}: {
  onPublish: (commentContent: string) => void;
  onCancel: () => void;
  classes: ClassesType<typeof styles>;
}) => {
  const [commentValue, setCommentValue] = useState<string>('');
  const ckEditorRef = useRef<CKEditor<any> | null>(null);
  const editorRef = useRef<any>(null);

  const isButtonDisabled = commentValue.trim() === '';

  return (
    <div className={classes.commentEditorContainer}>
      <ContentStyles contentType="comment">
        <CKEditor
          isCollaborative={false}
          editor={getCkCommentEditor()}
          data={commentValue}
          ref={ckEditorRef}
          config={{
            placeholder: 'Write a review about the imported post...',
          }}
          onReady={(editor: any) => {
            editorRef.current = editor;
          }}
          onChange={(_event: any, editor: any) => {
            setCommentValue(editor.getData());
          }}
        />
        <div className={classes.editorButtons}>
          <Button
            className={classNames(classes.formButton, classes.cancelButton)}
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className={classNames(classes.formButton, classes.submitButton)}
            onClick={() => onPublish(commentValue)}
            disabled={isButtonDisabled}
            title={isButtonDisabled ? 'You must write a review before submitting.' : ''}
          >
            Submit Linkpost 
          </Button>
        </div>
      </ContentStyles>
    </div>
  );
};

const ExternalPostImporter = ({ classes, defaultPostedAt }: { classes: ClassesType<typeof styles>, defaultPostedAt?: Date }) => {
  const [value, setValue] = useState('');
  const [post, setPost] = useState<ExternalPostImportData['post'] | null>(null);
  const [postContent, setPostContent] = useState<string>('');
  const [published, setPublished] = useState<boolean>(false);
  const [alreadyExists, setAlreadyExists] = useState<boolean>(false);
  const [publishingPost, setPublishingPost] = useState<boolean>(false);
  const { flash } = useMessages();

  const currentUser = useCurrentUser();

  const [importUrlAsDraftPost, { data, loading, error }] = useMutation(gql(`
    mutation importUrlAsDraftPost($url: String!) {
      importUrlAsDraftPost(url: $url) {
        alreadyExists
        post {
          _id
          slug
          title
          content
          url
          postedAt
          createdAt
          modifiedAt
          userId
          draft
          coauthorStatuses {
            userId
            confirmed
            requested
          }
        }
      }
    }
  `));

  // postedAt, createdAt, modifiedAt, userId, draft, coauthorStatuses

  const [create] = useMutation(CommentsListMutation);

  const [updatePost] = useMutation(PostsListUpdateMutation);

  useEffect(() => {
    if (data && data.importUrlAsDraftPost && data.importUrlAsDraftPost.post) {
      const importedPost = data.importUrlAsDraftPost.post;
      setPost(importedPost);
      setPostContent(importedPost.content ?? '');
      setAlreadyExists(!!data.importUrlAsDraftPost.alreadyExists);
    }
    if (error) {
      flash(error.message);
    }
  }, [data, error, flash]);

  const handlePublish = async (commentContent: string) => {
    if (!post || !currentUser) return;

    try {
      setPublishingPost(true);
      // Create the comment
      const commentData = {
        postId: post._id,
        userId: currentUser._id,
        reviewingForReview: new Date().getFullYear().toString(),
        contents: {
          originalContents: {
            data: commentContent,
            type: 'ckEditorMarkup',
          },
        },
      };

      await create({ variables: { data: commentData } });

      // Update and publish the post using useUpdate
      await updatePost({
        variables: {
          selector: { _id: post._id },
          data: {
            contents: {
              originalContents: {
                data: postContent,
                type: 'ckEditorMarkup',
              },
            },
            draft: false,
            wasEverUndrafted: true,
            postedAt: maybeDate(post.postedAt) ?? defaultPostedAt ?? new Date(),
            deletedDraft: false
          }
        }
      });

      setPublished(true);
      setValue('');
      window.scrollTo(0, 0);
      setPublishingPost(false);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error publishing post and submitting review: ', error);
    }
  };

  const importLinkpostKeyPress = async (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      await importUrlAsDraftPost({ variables: { url: value } });
    }
  };

  const handleImportDifferentPost = () => {
    setPost(null);
    setPostContent('');
    setValue('');
    setPublished(false);
    // Reset any errors if necessary
  };

  /*
    Component can be in one of three states:
    1. Awaiting new link
    2. Displaying imported content for review
    3. Displaying success message

    Implemented desired behavior per the comment.
  */

  return (
    <div className={classes.root}>
      {/* State 3: Display success message beneath input form */}
      {published && post && (
        <ContentStyles contentType="comment" className={classes.successMessage}>
          Your linkpost and review have been published.{' '}
            <a href={`/posts/${post._id}/${post.slug}`}>Click here to see them live.</a>
        </ContentStyles>
      )}

      {alreadyExists && post && (
        <ContentStyles contentType="comment" className={classes.successMessage}>
          This post has already been nominated. <a href={`/posts/${post._id}/${post.slug}`}>Click here to see it live.</a>
        </ContentStyles>
      )}

      {/* State 1 and State 3: Display message and input form */}
      {(!post || published || (post && alreadyExists)) && (
        <>
          <Typography variant="body2">
            {`${published ? 'Or nominate another' : 'Nominate a'} post from offsite that you think is relevant to the community's intellectual progress.`}
          </Typography>
          <div className={classes.inputGroup}>
            <input
              className={classes.input}
              type="url"
              placeholder="Post URL"
              value={value}
              onChange={(event) => {
                setValue(event.target.value);
              }}
              onKeyDown={importLinkpostKeyPress}
            />
            <Button
              onClick={() => importUrlAsDraftPost({ variables: { url: value } })}
              className={classes.importButton}
            >
              {loading ? <Loading className={classes.loadingDots} /> : <>Import Post</>}
            </Button>
          </div>
          {error && <div className={classes.error}>{error.message}</div>}
        </>
      )}


      {/* State 2: Display imported content and editor, hide message and form */}
      {!alreadyExists && post && !published && (
        <div className={classes.importEditors}>
          <Typography variant="body2" className={classes.importLabel}>
            Importing post from <a href={post.url ?? ''} target="_blank" rel="noopener noreferrer">{post.url ?? 'error: unknown'}</a>
            <br />
            You can edit the linkpost here:
          </Typography>
          <div className={classes.importTitle}>{post.title}</div>
          <ImportedPostEditor
            post={post}
            onContentChange={setPostContent}
            classes={classes}
          />
          <Typography variant="body2">
            To nominate a linkpost for the Annual Review, you must write your own review it.<br />
            Please explain why you think this post or paper is significant to LessWrong's intellectual progress.
          </Typography>
          <CommentEditor onPublish={handlePublish} onCancel={handleImportDifferentPost} classes={classes} />
          {publishingPost && <Loading />}
        </div>
      )}
    </div>
  );
};

export default registerComponent('ExternalPostImporter', ExternalPostImporter, {
  styles,
});


