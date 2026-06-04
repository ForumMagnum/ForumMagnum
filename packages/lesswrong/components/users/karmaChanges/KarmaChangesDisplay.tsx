import React from 'react';
import classNames from 'classnames';
import { MenuItemLink } from '@/components/common/Menus';
import { Typography } from '@/components/common/Typography';
import { useCurrentUser } from '@/components/common/withUser';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { commentGetPageUrlFromIds } from '@/lib/collections/comments/helpers';
import { TagCommentType } from '@/lib/collections/comments/types';
import { postGetPageUrl } from '@/lib/collections/posts/helpers';
import { tagGetHistoryUrl } from '@/lib/collections/tags/helpers';
import { Link } from '@/lib/reactRouterWrapper';
import { gql } from '@/lib/generated/gql-codegen';
import { useQuery } from '@/lib/crud/useQuery';
import { truncate } from '@/lib/editor/ellipsize';
import ContentStyles from '@/components/common/ContentStyles';
import { ContentItemBody } from '@/components/contents/ContentItemBody';
import LWTooltip from '@/components/common/LWTooltip';
import { getPostPreviewWidth } from '@/components/posts/PostsPreviewTooltip/helpers';
import { highlightSimplifiedStyles } from '@/components/posts/PostsPreviewTooltip/LWPostsPreviewTooltip';
import ReactionIcon from '@/components/votes/ReactionIcon';
import { Card } from '@/components/widgets/Paper';
import UsersName from '../UsersName';
import { getKarmaNotificationTimingChoices } from '../KarmaChangeNotifierSettings';
import { NewReactions } from './NewReactions';
import { ColoredNumber } from './ColoredNumber';

export const styles = defineStyles("KarmaChangesDisplay", (theme: ThemeType) => ({
  title: {
    display: 'block',
    paddingTop: 16,
    paddingLeft: 16,
    paddingRight: 16,
    paddingBottom: 8
  },
  votedItems: {},
  votedItemRow: {
    height: 20
  },
  votedItemScoreChange: {
    display: "inline-block",
    minWidth: 20,
    textAlign: "right",
  },
  votedItemDescription: {
    display: "inline-block",
    marginLeft: 5,
    whiteSpace: "nowrap",
    overflow: "hidden",
    maxWidth: 250,
    textOverflow: "ellipsis"
  },
  settings: {
    display: 'block',
    textAlign: 'right',
    paddingTop: 8,
    paddingRight: 16,
    paddingLeft: 16,
    paddingBottom: 16,
    color: theme.palette.grey[600],
    '&:hover': {
      color: theme.palette.grey[500]
    }
  },
  tooltipCard: {
    width: getPostPreviewWidth(),
    position: "relative",
    '& img': {
      maxHeight: "200px",
    },
  },
  tooltipHeader: {
    padding: 12,
    paddingBottom: 0,
  },
  tooltipTitle: {
    marginBottom: -6,
    color: theme.palette.text.normal,
    lineHeight: "1.7rem",
    fontFamily: theme.typography.postStyle.fontFamily,
    ...theme.typography.postsItemTitle,
  },
  tooltipSubtitle: {
    marginLeft: 2,
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    fontSize: "1.1rem",
    color: theme.palette.grey[600],
  },
  tooltipBody: {
    maxHeight: 450,
    padding: 12,
    paddingBottom: 0,
    paddingTop: 0,
  },
  tooltipHighlight: {
    marginTop: 20,
    marginBottom: 12,
    marginRight: 4,
    wordBreak: 'break-word',
    fontSize: "1.1rem",
    '& h1': {
      fontSize: "1.2rem",
    },
    '& h2': {
      fontSize: "1.2rem",
    },
    '& h3': {
      fontSize: "1.1rem",
    },
    '& li': {
      fontSize: "1.1rem",
    },
    ...highlightSimplifiedStyles,
  },
  tooltipCommentBody: {
    marginTop: 12,
    marginBottom: 12,
    marginRight: 4,
    wordBreak: 'break-word',
    ...highlightSimplifiedStyles,
  },
  tooltipReacts: {
    padding: 12,
    fontFamily: theme.typography.commentStyle.fontFamily,
  },
  tooltipReactsAfterBody: {
    paddingTop: 0,
  },
  tooltipReact: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 4,
    marginTop: 6,
    paddingTop: 6,
    borderTop: `1px solid ${theme.palette.border.faint}`,
    '&:first-child': {
      marginTop: 0,
      paddingTop: 0,
      borderTop: 'none',
    },
  },
  tooltipReactIcon: {
    flex: '0 0 auto',
    marginTop: 2,
  },
  tooltipReactDetails: {
    flex: '1 1 auto',
    minWidth: 0,
  },
  tooltipQuote: {
    paddingLeft: 6,
    marginTop: 2,
    fontSize: '0.9em',
    color: theme.palette.text.primary,
    display: '-webkit-box',
    '-webkit-line-clamp': 3,
    '-webkit-box-orient': 'vertical',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
}), { stylePriority: -1 });

const KarmaChangePostBodiesQuery = gql(`
  query KarmaChangePostBodies($selector: PostSelector, $limit: Int) {
    posts(selector: $selector, limit: $limit, enableTotal: false) {
      results {
        _id
        contents {
          _id
          htmlHighlight
        }
      }
    }
  }
`);

const KarmaChangeCommentBodiesQuery = gql(`
  query KarmaChangeCommentBodies($selector: CommentSelector, $limit: Int) {
    comments(selector: $selector, limit: $limit, enableTotal: false) {
      results {
        _id
        contents {
          _id
          html
        }
      }
    }
  }
`);

const KarmaChangesDisplay = ({ karmaChanges, handleClose }: {
  karmaChanges: KarmaChanges;
  handleClose: (ev: React.MouseEvent) => any;
}) => {
  const classes = useStyles(styles);
  const { posts, comments, tagRevisions, updateFrequency } = karmaChanges;
  const noKarmaChanges = !(
    (posts && (posts.length > 0))
    || (comments && (comments.length > 0))
    || (tagRevisions && (tagRevisions.length > 0))
  );

  const karmaNotificationTimingChoices = getKarmaNotificationTimingChoices();

  const postIds = (posts ?? []).map(p => p.postId);
  const { data: postBodiesData } = useQuery(KarmaChangePostBodiesQuery, {
    variables: {
      selector: { default: { exactPostIds: postIds } },
      limit: postIds.length,
    },
    skip: postIds.length === 0,
  });

  const postHighlightById = new Map<string, string>();
  for (const p of postBodiesData?.posts?.results ?? []) {
    if (p.contents?.htmlHighlight) {
      postHighlightById.set(p._id, p.contents.htmlHighlight);
    }
  }

  const commentIds = (comments ?? []).map(c => c._id);
  const { data: commentBodiesData } = useQuery(KarmaChangeCommentBodiesQuery, {
    variables: {
      selector: { default: { commentIds } },
      limit: commentIds.length,
    },
    skip: commentIds.length === 0,
  });

  const commentHtmlById = new Map<string, string>();
  for (const c of commentBodiesData?.comments?.results ?? []) {
    if (c.contents?.html) {
      commentHtmlById.set(c._id, c.contents.html);
    }
  }

  return (
    <Typography variant="body2">
      {noKarmaChanges
        ? <span className={classes.title}>{karmaNotificationTimingChoices[updateFrequency].emptyText}</span>
        : <div>
            <span className={classes.title}>{karmaNotificationTimingChoices[updateFrequency].infoText}</span>
            <div className={classes.votedItems}>
              {karmaChanges.posts?.map((postChange) => (
                <KarmaChangePost
                  key={postChange._id}
                  postChange={postChange}
                  bodyHtml={postHighlightById.get(postChange.postId) ?? null}
                />
              ))}
              {karmaChanges.comments?.map((commentChange) => (
                <KarmaChangeComment
                  key={commentChange._id}
                  commentChange={commentChange}
                  bodyHtml={commentHtmlById.get(commentChange._id) ?? null}
                />
              ))}
              {karmaChanges.tagRevisions?.map((tagChange) => <KarmaChangeTagRevision tagChange={tagChange} key={tagChange._id}/>)}
            </div>
          </div>
      }
      <Link to={`/account`} onClick={handleClose}>
        <span className={classes.settings}>Change Settings</span>
      </Link>
    </Typography>
  );
};

function KarmaChangePost({ postChange, bodyHtml }: {
  postChange: PostKarmaChange;
  bodyHtml: string|null;
}) {
  return <KarmaChangeRow
    link={postGetPageUrl(postChange)}
    scoreChange={postChange.scoreChange}
    addedReacts={postChange.addedReacts}
    description={postChange.title ?? ""}
    tooltipTitle={postChange.title ?? null}
    tooltipSubtitle={null}
    tooltipBodyHtml={bodyHtml}
    tooltipBodyContentType="postHighlight"
  />
}

function KarmaChangeComment({ commentChange, bodyHtml }: {
  commentChange: CommentKarmaChange;
  bodyHtml: string|null;
}) {
  return <KarmaChangeRow
    link={commentGetPageUrlFromIds({ postId: commentChange.postId, tagSlug: commentChange.tagSlug, tagCommentType: commentChange.tagCommentType as TagCommentType, commentId: commentChange._id })}
    scoreChange={commentChange.scoreChange}
    addedReacts={commentChange.addedReacts}
    description={commentChange.description ?? ""}
    tooltipTitle={null}
    tooltipSubtitle={commentChange.postTitle ?? null}
    tooltipBodyHtml={bodyHtml}
    tooltipBodyContentType="comment"
  />
}

function KarmaChangeTagRevision({ tagChange }: {
  tagChange: RevisionsKarmaChange;
}) {
  const currentUser = useCurrentUser();
  return <KarmaChangeRow
    link={`${tagGetHistoryUrl({ slug: tagChange.tagSlug ?? "" })}?user=${currentUser!.slug}`}
    scoreChange={tagChange.scoreChange}
    addedReacts={tagChange.addedReacts}
    description={tagChange.tagName ?? ""}
    tooltipTitle={tagChange.tagName ?? null}
    tooltipSubtitle={null}
    tooltipBodyHtml={null}
    tooltipBodyContentType={null}
  />
}

function RowTooltipContent({ title, subtitle, bodyHtml, bodyContentType, addedReacts }: {
  title: string|null;
  subtitle: string|null;
  bodyHtml: string|null;
  bodyContentType: 'postHighlight'|'comment'|null;
  addedReacts: ReactionChange[]|null|undefined;
}) {
  const classes = useStyles(styles);
  const hasHeader = !!(title || subtitle);
  const hasBody = !!(bodyHtml && bodyContentType);
  const hasReacts = !!(addedReacts && addedReacts.length);
  if (!hasHeader && !hasBody && !hasReacts) return null;

  const truncatedBodyHtml = hasBody ? truncate(bodyHtml, 100, "words") : null;

  return <Card className={classes.tooltipCard}>
    {hasHeader && <div className={classes.tooltipHeader}>
      {title && <div className={classes.tooltipTitle}>{title}</div>}
      {subtitle && <div className={classes.tooltipSubtitle}>{subtitle}</div>}
    </div>}
    {truncatedBodyHtml && bodyContentType && <div className={classes.tooltipBody}>
      <ContentStyles
        contentType={bodyContentType}
        className={bodyContentType === "comment" ? classes.tooltipCommentBody : classes.tooltipHighlight}
      >
        <ContentItemBody
          dangerouslySetInnerHTML={{ __html: truncatedBodyHtml }}
          description={title ?? subtitle ?? "karma change preview"}
        />
      </ContentStyles>
    </div>}
    {hasReacts && <div className={classNames(classes.tooltipReacts, (hasHeader || hasBody) && classes.tooltipReactsAfterBody)}>
      {addedReacts?.map((r, i) => (
        <div className={classes.tooltipReact} key={`${r.userId ?? 'anon'}-${r.reactionType}-${r.quote ?? ''}-${i}`}>
          <span className={classes.tooltipReactIcon}>
            <ReactionIcon react={r.reactionType} />
          </span>
          <div className={classes.tooltipReactDetails}>
            <UsersName documentId={r.userId ?? undefined} />
            {r.quote && <div className={classes.tooltipQuote}>{r.quote}</div>}
          </div>
        </div>
      ))}
    </div>}
  </Card>;
}

function KarmaChangeRow({link, scoreChange, addedReacts, description, tooltipTitle, tooltipSubtitle, tooltipBodyHtml, tooltipBodyContentType}: {
  link: string;
  scoreChange: number;
  addedReacts: ReactionChange[]|null|undefined;
  description: string;
  tooltipTitle: string|null;
  tooltipSubtitle: string|null;
  tooltipBodyHtml: string|null;
  tooltipBodyContentType: 'postHighlight'|'comment'|null;
}) {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const hideNegativeScoreChange = currentUser?.karmaChangeNotifierSettings?.showNegativeKarma === false;
  const showScoreChange = scoreChange>0 || (!hideNegativeScoreChange && scoreChange !== 0);

  const hasTooltip = !!(tooltipTitle || tooltipSubtitle || tooltipBodyHtml || addedReacts?.length);
  const row = <MenuItemLink
    className={classes.votedItemRow}
    to={link}
  >
    {showScoreChange && <span className={classes.votedItemScoreChange}>
      <ColoredNumber n={scoreChange} />
    </span>}
    <NewReactions reactionChanges={addedReacts} />
    <div className={classes.votedItemDescription}>
      {description}
    </div>
  </MenuItemLink>;

  if (!hasTooltip) return row;

  return <LWTooltip
    title={<RowTooltipContent
      title={tooltipTitle}
      subtitle={tooltipSubtitle}
      bodyHtml={tooltipBodyHtml}
      bodyContentType={tooltipBodyContentType}
      addedReacts={addedReacts}
    />}
    placement="left-start"
    inlineBlock={false}
    As="div"
    clickable
    tooltip={false}
    hideOnTouchScreens
  >
    {row}
  </LWTooltip>
}

export default KarmaChangesDisplay;
