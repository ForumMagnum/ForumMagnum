import React, { useRef, useState } from 'react';
import { useCurrentUser } from '../common/withUser';
import { userIsAdmin } from '@/lib/vulcan-users/permissions';
import { usePaginatedResolver } from '../hooks/usePaginatedResolver';
import { Link } from '@/lib/reactRouterWrapper';
import { postGetPageUrl } from '@/lib/collections/posts/helpers';
import { userGetProfileUrl } from '@/lib/collections/users/helpers';
import { useMessages } from '../common/withMessages';
import { registerComponent } from "@/lib/vulcan-lib/components";
import { makeAbsolute } from "@/lib/vulcan-lib/utils.ts";
import { Error404 } from "../common/Error404";
import { SectionTitle } from "../common/SectionTitle";
import { Loading } from "../vulcan-core/Loading";
import { FormatDate } from "../common/FormatDate";
import { TruncatedAuthorsList } from "../posts/TruncatedAuthorsList";
import { ForumIcon } from "../common/ForumIcon";
import { LWTooltip } from "../common/LWTooltip";
import { LoadMore } from "../common/LoadMore";

const styles = (theme: ThemeType) => ({
  root: {
    maxWidth: 1200,
    margin: '10px auto',
  },
  topSection: {
    paddingLeft: 12,
    marginBottom: 10,
  },
  headlineRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    columnGap: 20,
  },
  headlineText: {
    flex: '1 1 0',
  },
  copyButton: {},
  copyIcon: {
    color: theme.palette.primary.main,
    fontSize: 26,
    cursor: 'pointer',
    '&:hover': {
      color: theme.palette.primary.dark,
    },
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
    '& input': {
      width: 50,
      marginLeft: 10,
      padding: 5,
      fontSize: 14,
    },
    '& label': {
      fontSize: 14,
      color: theme.palette.grey[800],
    },
  },
  table: {
    background: theme.palette.grey[0],
    width: '100%',
    fontFamily: theme.typography.fontFamily,
    fontSize: 13,
    lineHeight: '18px',
    textAlign: 'left',
    borderCollapse: 'collapse',
    '& th': {
      position: 'sticky',
      top: 0,
      background: theme.palette.grey[250],
      zIndex: 1,
    },
    '& th, td': {
      minWidth: 72,
      padding: 5,
      '&:first-child': {
        padding: '5px 5px 5px 14px',
      },
      '&:last-child': {
        padding: '5px 14px 5px 5px',
      },
    },
  },
  link: {
    color: theme.palette.primary.main,
    fontFamily: theme.typography.fontFamily,
    fontSize: 16,
    lineHeight: '22px',
    fontWeight: 600,
  },
  centeredColHeader: {
    textAlign: 'center',
  },
});

const readableDate = (date: Date) => date.toISOString().replace('T', ' ').slice(0, 16);

const TwitterAdminInner = ({ classes }: { classes: ClassesType<typeof styles> }) => {
  const [copyCount, setCopyCount] = useState(10);
  const currentUser = useCurrentUser();
  const { flash } = useMessages();

  const { results, loading, error, loadMoreProps } = usePaginatedResolver({
    resolverName: 'CrossedKarmaThreshold',
    fragmentName: 'PostsTwitterAdmin',
    limit: 20,
    itemsPerPage: 20,
  });

  const authorExpandContainer = useRef(null);

  if (!userIsAdmin(currentUser)) {
    return <Error404 />;
  }
  if (loading && !results) return <Loading />;
  if (error || !results) return null;

  const getAuthorsLinks = (post: PostsTwitterAdmin) => {
    if (post.user) {
      const author = post.user;
      const authorUrl = userGetProfileUrl(author);
      const authorLink = `=HYPERLINK("${authorUrl.startsWith('http') ? authorUrl : makeAbsolute(authorUrl)}", "${author.displayName.replace(/"/g, '""')}")`;
      return authorLink;
    }
    return 'Unknown';
  };

  const copyPostsToClipboard = async (posts: PostsTwitterAdmin[]) => {
    const currentTime = readableDate(new Date());
    let tsvContent = '';

    for (const post of posts) {
      const postUrl = `${postGetPageUrl(post, true)}`;
      const titleCell = `=HYPERLINK("${postUrl}", "${post.title.replace(/"/g, '""')}")`;
      const authorsLink = getAuthorsLinks(post);
      const postedAt = readableDate(new Date(post.postedAt));
      const karma = post.baseScore;
      const commentCount = post.commentCount;

      const authors = ([post.user, ...(post.coauthors || [])]
        .filter(author => author) as UsersSocialMediaInfo[])
        .map((author) => {
          const userSetTwitterHandle = author.twitterProfileURL
          const adminSetTwitterHandle = author.twitterProfileURLAdmin

          const anyHandleSet = (userSetTwitterHandle || adminSetTwitterHandle)
          const unambiguousHandle =
            anyHandleSet &&
            (!userSetTwitterHandle || !adminSetTwitterHandle || userSetTwitterHandle === adminSetTwitterHandle);

          const twitterHandleStr = unambiguousHandle
            ? ` (@${userSetTwitterHandle || adminSetTwitterHandle})`
            : anyHandleSet
            ? ` (ADMIN: @${adminSetTwitterHandle}, USER: @${userSetTwitterHandle})`
            : "";

          return `${author!.displayName}${twitterHandleStr}`
        })
        .join(', ');

      // Note: These quotes are currently stripped when pasting into Google sheets
      const standardTweet1 = `"${post.title}" by ${authors}`;
      const standardTweet2 = `Full post: ${postUrl}`;

      const row = `${titleCell}\t${authorsLink}\t${postedAt}\t${currentTime}\t${karma}\t${commentCount}\t${standardTweet1}\t${standardTweet2}\n`;
      tsvContent += row;
    }

    try {
      await navigator.clipboard.writeText(tsvContent);
      flash('Copied to clipboard');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to copy: ', error);
      flash('Failed to copy');
    }
  };

  const handleCopyRow = async (post: PostsTwitterAdmin) => {
    await copyPostsToClipboard([post]);
  };

  const handleCopyRecentPosts = async () => {
    const sortedPosts = [...results].sort(
      (a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
    );
    const postsToCopy = sortedPosts.slice(0, copyCount);
    await copyPostsToClipboard(postsToCopy);
  };

  return (
    <div className={classes.root}>
      <div className={classes.topSection}>
        <div className={classes.headlineRow}>
          <div className={classes.headlineText}>
            <SectionTitle title="Twitter Eligible Posts" noTopMargin />
          </div>
          <div className={classes.controls}>
            <label htmlFor="copyCountInput">Number to Copy:</label>
            <input
              id="copyCountInput"
              type="number"
              value={copyCount}
              onChange={(e) => setCopyCount(Number(e.target.value))}
              min="1"
            />
            <LWTooltip
              title={`Click to copy the ${copyCount} most recent posts`}
              placement="bottom"
              className={classes.copyButton}
            >
              <ForumIcon
                icon="ClipboardDocumentList"
                className={classes.copyIcon}
                onClick={() => handleCopyRecentPosts()}
              />
            </LWTooltip>
          </div>
        </div>
      </div>
      <table className={classes.table}>
        <thead>
          <tr>
            <th>Title</th>
            <th>Author</th>
            <th>Posted At</th>
            <th>Karma</th>
            <th>Comments</th>
            <th className={classes.centeredColHeader}>Copy</th>
          </tr>
        </thead>
        <tbody>
          {results.map((post) => (
            <tr key={post._id}>
              <td>
                <Link to={postGetPageUrl(post)} target="_blank" rel="noopener noreferrer"  className={classes.link}>
                  {post.title}
                </Link>
              </td>
              <td>
                <TruncatedAuthorsList
                  // TODO make it work with the real type
                  post={post as PostsListWithVotes}
                  expandContainer={authorExpandContainer}
                />
              </td>
              <td>
                <FormatDate date={post.postedAt} />
              </td>
              <td>{post.baseScore}</td>
              <td>{post.commentCount}</td>
              <td className={classes.centeredColHeader}>
                <LWTooltip title="Copy this post" placement="bottom">
                  <ForumIcon
                    icon="ClipboardDocumentList"
                    className={classes.copyIcon}
                    onClick={() => handleCopyRow(post)}
                  />
                </LWTooltip>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <LoadMore {...loadMoreProps} />
    </div>
  );
};

export const TwitterAdmin = registerComponent('TwitterAdmin', TwitterAdminInner, { styles });

declare global {
  interface ComponentTypes {
    TwitterAdmin: typeof TwitterAdmin;
  }
}
