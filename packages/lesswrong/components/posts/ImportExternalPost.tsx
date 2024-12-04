import React, { useState, useEffect, useRef } from 'react';
import { Components, registerComponent, useStyles, getFragment } from '../../lib/vulcan-lib';
import { gql, useLazyQuery } from '@apollo/client';
import { useNavigate } from '@/lib/reactRouterWrapper.tsx';
import Button from '@material-ui/core/Button';
import { useCurrentUser } from '../common/withUser';
import CKEditor from '@/lib/vendor/ckeditor5-react/ckeditor';
import { getCkEditor, getCkPostEditor, getCkCommentEditor } from '@/lib/wrapCkEditor';
import { mentionPluginConfiguration } from '@/lib/editor/mentionsConfig';
import { ckEditorStyles } from '@/themes/stylePiping';
import { forumTypeSetting } from '@/lib/instanceSettings';
import { useCreate } from '@/lib/crud/withCreate';
import { useUpdate } from '@/lib/crud/withUpdate';
import classNames from 'classnames';

export type ForeignSiteImportData = {
  _id: string;
  slug: string;
  title: string;
  url: string | null;
  postedAt: Date | null;
  createdAt: Date | null;
  userId: string | null;
  modifiedAt: Date | null;
  draft: boolean;
  content: string;
  coauthorStatuses: Array<{
    userId: string;
    confirmed: boolean;
    requested: boolean;
  }> | null;
};

const styles = (theme: ThemeType) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    width: "100%",
    background: theme.palette.panelBackground.default,
    padding: '12px 16px',
    borderRadius: theme.borderRadius.quickTakesEntry,
    marginTop: 24,
  },
  loadingDots: {
    marginTop: -8,
  },
  input: {
    fontWeight: 500,
    backgroundColor: theme.palette.grey[100],
    borderRadius: theme.borderRadius.small,
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
  post: ForeignSiteImportData;
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
      <Components.ContentStyles contentType="post">
        <CKEditor
          isCollaborative={false}
          editor={getCkPostEditor(false, forumTypeSetting.get())}
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
      </Components.ContentStyles>
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
      <Components.ContentStyles contentType="comment">
        <CKEditor
          isCollaborative={false}
          editor={getCkCommentEditor(forumTypeSetting.get())}
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
      </Components.ContentStyles>
    </div>
  );
};

const ImportExternalPost = ({ classes }: { classes: ClassesType<typeof styles> }) => {
  const [value, setValue] = useState('');
  const [post, setPost] = useState<ForeignSiteImportData | null>(null);
  const [postContent, setPostContent] = useState<string>('');
  const [published, setPublished] = useState<boolean>(false);
  const navigate = useNavigate();

  const { Typography, Loading, ContentStyles } = Components;

  const currentUser = useCurrentUser();

  const [importUrlAsDraftPost, { data, loading, error }] = useLazyQuery(gql`
    query importUrlAsDraftPost($url: String!) {
      importUrlAsDraftPost(url: $url) {
        _id
        slug
        title
        content
        url
      }
    }
  `);

  const { create } = useCreate({
    collectionName: 'Comments',
    fragmentName: 'CommentsList',
  });

  const { mutate: updatePost } = useUpdate({
    collectionName: 'Posts',
    fragmentName: 'PostsList',
  });

  useEffect(() => {
    if (data && data.importUrlAsDraftPost) {
      const importedPost = data.importUrlAsDraftPost;
      setPost(importedPost);
      setPostContent(importedPost.content || '');
    }
    if (error) {
      // eslint-disable-next-line no-console
      console.error(error);
    }
  }, [data, error]);

  const handlePublish = async (commentContent: string) => {
    if (!post || !currentUser) return;

    try {
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
        } as EditableFieldContents,
      };

      await create({ data: commentData });

      // Update and publish the post using useUpdate
      await updatePost({
        selector: { _id: post._id },
        data: {
          contents: {
            originalContents: {
              data: postContent,
              type: 'ckEditorMarkup',
            },
          },
          draft: false,
          postedAt: new Date(),
        } as AnyBecauseHard,
      });

      setPublished(true);
      setValue('');
      window.scrollTo(0, 0);
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

      {/* State 1 and State 3: Display message and input form */}
      {(!post || published) && (
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
      {post && !published && (
        <div className={classes.importEditors}>
          <Typography variant="body2" className={classes.importLabel}>
            Importing post from <a href={post.url ?? ''} target="_blank" rel="noopener noreferrer">{post.url ?? 'error: unknown'}</a>
            <br />
            You can edit the linkpost here:
          </Typography>
          {/* <Button
            onClick={handleImportDifferentPost}
            className={classes.formButton}
          >
            Import different post
          </Button> */}
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
        </div>
      )}
    </div>
  );
};

const ImportExternalPostComponent = registerComponent('ImportExternalPost', ImportExternalPost, {
  styles,
});

declare global {
  interface ComponentTypes {
    ImportExternalPost: typeof ImportExternalPostComponent;
  }
}
