// TODO: Import component in components.ts
import React, { useContext, useEffect, useRef, useState } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
import { postFormSectionStyles, ThinkWrapper } from './ThinkWrapper';
import { useLocation, useNavigate } from '@/lib/routeUtil';
import { useSingle } from '@/lib/crud/withSingle';
import { CENTRAL_COLUMN_WIDTH } from '../posts/PostsPage/PostsPage';
import classNames from 'classnames';
import { usePostReadProgress } from '../posts/usePostReadProgress';
import { useRecordPostView } from '../hooks/useRecordPostView';
import { useDynamicTableOfContents } from '../hooks/useDynamicTableOfContents';
import type { ContentItemBody, ContentReplacedSubstringComponentInfo } from '../common/ContentItemBody';
import { SideItemVisibilityContextProvider } from '@/components/dropdowns/posts/SetSideItemVisibility';

// Import necessary hooks and utilities
import { jargonTermsToTextReplacements } from '@/components/jargon/JargonTooltip';
import { useVote } from '@/components/votes/withVote';
import { useDisplayGlossary } from '../posts/PostsPage/PostBody';
import { getVotingSystemByName } from '@/lib/voting/votingSystems';
import { PostsPageContext } from '../posts/PostsPage/PostsPageContext';
import { useUpdate } from '@/lib/crud/withUpdate';
import { AutosaveEditorStateContext } from '../editor/EditorFormComponent';

const formContainerStyles = (theme: ThemeType) => ({
  maxWidth: 715,
  width: '100%',
  ...postFormSectionStyles(theme),
  marginLeft: "auto",
  marginRight: "auto",
});

const styles = (theme: ThemeType) => ({
  title: {
    marginBottom: theme.spacing.unit * 4
  },
  postBody: {
    maxWidth: CENTRAL_COLUMN_WIDTH,
    ...postFormSectionStyles(theme),
    position: 'absolute',
    top: 0,
    left: 0,
  },
  topRight: {
    position: 'absolute',
    top: 70,
    right: 8,
  },
  postContainer: {
    position: 'relative',
  },
  hide: {
    opacity: 0,
    pointerEvents: 'none',
  },
  editorHide: {
    display: 'none',
  },
  editButton: {
    ...theme.typography.body2,
    color: theme.palette.grey[500],
    cursor: 'pointer',
    '&:hover': {
      color: theme.palette.grey[700],
    }
  },
  formContainer: {
    ...formContainerStyles(theme),
  }
});

export const ThinkPost = ({classes, post, sequence, refetchPost, refetchSequence}: {
  classes: ClassesType<typeof styles>,
  post: PostsPage,
  sequence?: SequencesPageWithChaptersFragment,
  refetchPost?: () => void,
  refetchSequence?: () => void,
}) => {
  const { LWPostsPageHeader, ThinkWrapper, ContentStyles, ContentItemBody, ForumIcon, InlineReactSelectionWrapper, PostsEditForm, SideItemsSidebar, Error404, GlossarySidebar, LWTooltip, SideItemsContainer } = Components;

  const { params: { postId }, query: { edit, key } } = useLocation();
  const [isEditing, setIsEditing] = useState(edit === 'true');

  const { autosaveEditorState } = useContext(AutosaveEditorStateContext);

  const handleEditClick = async () => {
    setIsEditing(!isEditing);
    if (autosaveEditorState) {
      await autosaveEditorState();
      if (refetchPost) {
        refetchPost();
      }
    }
  };

  const sectionData = useDynamicTableOfContents({
    html: (post as PostsPage)?.contents?.html ?? post?.contents?.htmlHighlight ?? "",
    post,
    answers: [],
  });
  const htmlWithAnchors = sectionData?.html || post?.contents?.html || "";

  const contentRef = useRef<ContentItemBody>(null);

  // Use the useDisplayGlossary hook
  const {
    showAllTerms,
    setShowAllTerms,
    termsToHighlight,
    unapprovedTermsCount,
    approvedTermsCount,
  } = useDisplayGlossary(post);

  const votingSystem = getVotingSystemByName(post.votingSystem || 'default');
  const voteProps = useVote(post, 'Posts', votingSystem);

  const highlights = votingSystem.getPostHighlights
    ? votingSystem.getPostHighlights({post, voteProps})
    : []
  const glossaryItems: ContentReplacedSubstringComponentInfo[] = ('glossary' in post)
    ? jargonTermsToTextReplacements(termsToHighlight)
    : [];
  const replacedSubstrings = [...highlights, ...glossaryItems];
  // Create the glossary sidebar
  const glossarySidebar = ('glossary' in post) && (
    <GlossarySidebar
      post={post}
      showAllTerms={showAllTerms}
      setShowAllTerms={setShowAllTerms}
      unapprovedTermsCount={unapprovedTermsCount}
      approvedTermsCount={approvedTermsCount}
    />
  );

  return (
    <SideItemsContainer>
      <SideItemVisibilityContextProvider post={post}>
        <ThinkWrapper document={post} sectionData={sectionData} rightColumn={<SideItemsSidebar />}>
          {post && (
            <LWPostsPageHeader
              post={post}
              dialogueResponses={[]}
              topRightExtras={
                <div className={classes.editButton} onClick={handleEditClick}>
                  <LWTooltip title={isEditing ? "Read Mode" : "Edit Mode"}> 
                    <ForumIcon style={{fontSize: 16}} icon={isEditing ? 'Eye' : 'Edit'} />
                  </LWTooltip>
                </div>
              }
            />
          )}
          <div className={classes.postContainer} id="postContent">
            {post && <InlineReactSelectionWrapper
                commentBodyRef={contentRef}
                voteProps={voteProps}
                styling="post"
              >
                {glossarySidebar}
                <div className={classNames(isEditing && classes.hide, classes.postBody)}>
                  <ContentStyles contentType={"post"}>
                    <ContentItemBody
                      dangerouslySetInnerHTML={{ __html: htmlWithAnchors }}
                      ref={contentRef}
                      replacedSubstrings={replacedSubstrings}
                    />
                  </ContentStyles>
                </div>
                <div className={classNames(classes.formContainer, !isEditing && classes.editorHide)}>
                  <PostsEditForm documentId={postId} showTableOfContents={false} fields={['contents']} />
                </div>
              </InlineReactSelectionWrapper>
          }
          </div>
        </ThinkWrapper>
    </SideItemVisibilityContextProvider>
    </SideItemsContainer>
  );
};

const ThinkPostComponent = registerComponent('ThinkPost', ThinkPost, {styles});
declare global {
  interface ComponentTypes {
    ThinkPost: typeof ThinkPostComponent
  }
}
