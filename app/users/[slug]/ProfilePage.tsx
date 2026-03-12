"use client";

import React, { Suspense, useState, useRef } from "react";
import { gql } from "@/lib/generated/gql-codegen";
import { useQuery, useSuspenseQuery } from "@/lib/crud/useQuery";
import { useQueryWithLoadMore } from "@/components/hooks/useQueryWithLoadMore";
import { userCanEditUser, userGetDisplayName } from "@/lib/collections/users/helpers";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";
import { sequenceGetPageUrl } from "@/lib/collections/sequences/helpers";
import { userGetEditUrl } from "@/lib/vulcan-users/helpers";
import { userIsAdminOrMod } from "@/lib/vulcan-users/permissions";
import { getUserFromResults } from "@/components/users/UsersProfile";
import { useCurrentUser } from "@/components/common/withUser";
import classNames from "classnames";
import { useStyles } from "@/components/hooks/useStyles";
import UserContentFeed from "@/components/users/UserContentFeed";
import { UltraFeedContextProvider } from "@/components/ultraFeed/UltraFeedContextProvider";
import { UltraFeedObserverProvider } from "@/components/ultraFeed/UltraFeedObserver";
import { OverflowNavObserverProvider } from "@/components/ultraFeed/OverflowNavObserverContext";
import UsersNameWithModal from "@/components/ultraFeed/UsersNameWithModal";
import LWTooltip from "@/components/common/LWTooltip";
import { ExpandedDate } from "@/components/common/FormatDate";
import UserMetaInfo from "@/components/users/UserMetaInfo";
import UserNotifyDropdown from "@/components/notifications/UserNotifyDropdown";
import NewConversationButton from "@/components/messaging/NewConversationButton";
import ContentStyles from "@/components/common/ContentStyles";
import { ContentItemBody } from "@/components/contents/ContentItemBody";
import EditIcon from "@/lib/vendor/@material-ui/icons/src/Edit";
import VisibilityOutlinedIcon from "@/lib/vendor/@material-ui/icons/src/VisibilityOutlined";
import { Link } from "@/lib/reactRouterWrapper";
import { defaultSequenceBannerIdSetting, nofollowKarmaThreshold } from "@/lib/instanceSettings";
import { useCookiesWithConsent } from "@/components/hooks/useCookiesWithConsent";
import { SELECTED_PROFILE_TAB_COOKIE } from "@/lib/cookies/cookies";
import ProfileDiamondSections from "./ProfileDiamondSections";
import { profileStyles } from "./profileStyles";
import Error404 from "@/components/common/Error404";
import { StatusCodeSetter } from "@/components/next/StatusCodeSetter";
import LoadMore from "@/components/common/LoadMore";
import { UserProfileTopPostsSection } from "./UserProfileTopPostsSection";
import { cssUrl, formatReadableDate, getCollapsedBioHtml, getListPostImageUrl, getPostSummary } from "./userProfilePageUtil";

const ProfileUserQuery = gql(`
  query ProfileUserQuery($selector: UserSelector, $limit: Int, $enableTotal: Boolean) {
    users(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...UsersProfile
      }
      totalCount
    }
  }
`);

const ProfilePostsQuery = gql(`
  query ProfilePostsQuery($selector: PostSelector, $limit: Int, $enableTotal: Boolean) {
    posts(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...UserProfilePost
      }
      totalCount
    }
  }
  fragment UserProfilePost on Post {
    ...PostsMinimumInfo
    baseScore postedAt
    contents { plaintextDescription }
  }
`);

const ProfileSequencesQuery = gql(`
  query ProfileSequencesQuery($selector: SequenceSelector, $limit: Int, $enableTotal: Boolean) {
    sequences(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...SequenceContinueReadingFragment
      }
      totalCount
    }
  }
`);

type ProfileTab = "posts" | "sequences" | "quickTakes" | "feed";
const INITIAL_POSTS_TO_SHOW = 7;
const SEQUENCES_LIMIT = 6;
const SORT_PANEL_CLOSE_MS = 300;

function parseProfileTab(value: unknown): ProfileTab | null {
  if (value === "posts" || value === "sequences" || value === "quickTakes" || value === "feed") {
    return value;
  }
  return null;
}

function getInitialProfileTab({
  preferredTab,
  hasPosts,
  hasSequences,
  hasQuickTakes,
}: {
  preferredTab: ProfileTab | null;
  hasPosts: boolean;
  hasSequences: boolean;
  hasQuickTakes: boolean;
}): ProfileTab {
  if (preferredTab === "sequences" && hasSequences) return "sequences";
  if (preferredTab === "posts" && hasPosts) return "posts";
  if (preferredTab === "quickTakes" && hasQuickTakes) return "quickTakes";
  if (preferredTab === "feed") return "feed";
  if (!hasPosts) return "feed";
  return "posts";
}

function switchTab(
  tab: ProfileTab,
  tabsRef: React.RefObject<HTMLDivElement | null>,
  setActiveTab: (tab: ProfileTab) => void,
) {
  // Preserve scroll position relative to tabs when switching
  const tabsTop = tabsRef.current?.getBoundingClientRect().top ?? 0;
  setActiveTab(tab);
  requestAnimationFrame(() => {
    if (tabsRef.current) {
      const newTabsTop = tabsRef.current.getBoundingClientRect().top;
      window.scrollBy(0, newTabsTop - tabsTop);
    }
  });
}

function toggleSortPanel(
  sortPanelOpen: boolean,
  setSortPanelOpen: (open: boolean) => void,
  setSortPanelClosing: (closing: boolean) => void,
) {
  if (sortPanelOpen) {
    setSortPanelClosing(true);
    setTimeout(() => {
      setSortPanelOpen(false);
      setSortPanelClosing(false);
    }, SORT_PANEL_CLOSE_MS);
  } else {
    setSortPanelOpen(true);
  }
}
export default function ProfilePage({slug}: {
  slug: string
}) {
  const classes = useStyles(profileStyles);

  const { data: userData } = useSuspenseQuery(ProfileUserQuery, {
    variables: {
      selector: { usersProfile: { slug } },
      limit: 1,
      enableTotal: false,
    },
    fetchPolicy: "cache-and-network",
  });
  const user = getUserFromResults(userData?.users?.results);

  if (!user) {
    return <div className={classes.profileContent}>
      <main className={classes.profileMain}>
        <Error404 />
      </main>
    </div>;
  }

  return <>
    <StatusCodeSetter status={200}/>
    <ProfilePageInner user={user} />
  </>
}

type AllPostsTabSortingMode = "new" | "top" | "topInflation" | "recentComments" | "old" | "magic";

function ProfilePageInner({user}: {
  user: UsersProfile
}) {
  const classes = useStyles(profileStyles);
  const [cookies, setCookie] = useCookiesWithConsent([SELECTED_PROFILE_TAB_COOKIE]);
  const hasPosts = user.postCount > 0;
  const hasFeedContent = hasPosts || (user?.commentCount ?? 0) > 0;
  const hasSequences = user.sequenceCount > 0;
  const hasQuickTakes = !!user.shortformFeedId;

  const [activeTab, setActiveTab] = useState<ProfileTab>(getInitialProfileTab({
    preferredTab: parseProfileTab(cookies[SELECTED_PROFILE_TAB_COOKIE]),
    hasPosts: user.postCount > 0,
    hasSequences: user.sequenceCount > 0,
    hasQuickTakes,
  }));

  const [sortPanelOpen, setSortPanelOpen] = useState(false);
  const [sortPanelClosing, setSortPanelClosing] = useState(false);
  const [sortBy, setSortBy] = useState<AllPostsTabSortingMode>("new");
  const tabsRef = useRef<HTMLDivElement>(null);

  const handleTabSwitch = (tab: ProfileTab) => {
    setCookie(SELECTED_PROFILE_TAB_COOKIE, tab, { path: "/" });
    switchTab(tab, tabsRef, setActiveTab);
  };
  const handleSortPanelToggle = () => toggleSortPanel(sortPanelOpen, setSortPanelOpen, setSortPanelClosing);

  const userId = user?._id;
  const bioNoFollow = user.karma < nofollowKarmaThreshold.get();

  const currentUser = useCurrentUser();

  return (
    <div className={classes.page}>
      <div className={classes.profileContent}>
        <main className={classes.profileMain}>
          <div className={classes.profileHeader}>
            <h1 className={classes.profileName}>
              <UsersNameWithModal
                user={user}
                className={classes.profileNameLink}
                tooltipPlacement="bottom-start"
              />
            </h1>
            <Suspense>
              <ProfileHeaderActions user={user} />
            </Suspense>
          </div>
          {!user.hideProfileTopPosts && <UserProfileTopPostsSection user={user}/>}

          <Suspense>
            <ProfilePageMobileBio user={user} bioNoFollow={bioNoFollow}/>
          </Suspense>

          <section className={classes.allPostsSection}>
            <div className={classes.allPostsLeftColumn}>
            <div className={classes.allPostsHeader} ref={tabsRef}>
              <div className={classes.allPostsLeftHeader}>
                <div className={classes.profileTabs}>
                  <button
                    className={classNames(classes.profileTab, activeTab === "posts" && classes.profileTabActive)}
                    data-tab="posts"
                    type="button"
                    onClick={() => handleTabSwitch("posts")}
                  >
                    Posts
                  </button>
                  {hasSequences && (
                    <button
                      className={classNames(classes.profileTab, activeTab === "sequences" && classes.profileTabActive)}
                      data-tab="sequences"
                      type="button"
                      onClick={() => handleTabSwitch("sequences")}
                    >
                      Sequences
                    </button>
                  )}
                  {hasQuickTakes && (
                    <button
                      className={classNames(classes.profileTab, activeTab === "quickTakes" && classes.profileTabActive)}
                      data-tab="quickTakes"
                      type="button"
                      onClick={() => handleTabSwitch("quickTakes")}
                    >
                      Quick takes
                    </button>
                  )}
                  <button
                    className={classNames(classes.profileTab, activeTab === "feed" && classes.profileTabActive)}
                    data-tab="feed"
                    type="button"
                    onClick={() => handleTabSwitch("feed")}
                  >
                    All
                  </button>
                </div>
                {((activeTab === "posts" && hasPosts) || (activeTab === "feed" && hasFeedContent) || activeTab === "sequences") && (
                  <div className={classes.sortControl}>
                    <button 
                      className={classNames(classes.sortIconButton, activeTab === "sequences" && classes.sortIconDisabled)}
                      onClick={activeTab !== "sequences" ? handleSortPanelToggle : undefined}
                      type="button"
                    >
                      <span className={classes.sortIcon}>⚙</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className={classes.allPostsContainer}>
              <div className={classNames(classes.postsList, classes.tabPanel, activeTab === "posts" && classes.tabPanelActive)}>
                <Suspense>
                  <ProfilePageAllPostsTab user={user} sortBy={sortBy} setSortBy={setSortBy} sortPanelOpen={sortPanelOpen} sortPanelClosing={sortPanelClosing} />
                </Suspense>
              </div>

              <div className={classNames(
                classes.sequencesList, classes.tabPanel,
                activeTab === "sequences" && classes.tabPanelActive
              )}>
                {activeTab === "sequences" && <Suspense>
                  <ProfilePageSequencesTab user={user} />
                </Suspense>}
              </div>

              <div className={classNames(
                classes.tabPanel,
                activeTab === "quickTakes" && classes.tabPanelActive
              )}>
                {activeTab === "quickTakes" && <Suspense>
                  <ProfilePageQuickTakesTab user={user} />
                </Suspense>}
              </div>

              <div className={classNames(
                classes.feedList,
                classes.tabPanel,
                activeTab === "feed" && classes.tabPanelActive
              )}>
                {activeTab === "feed" && <Suspense>
                  <ProfilePageFeedTab user={user} sortPanelOpen={sortPanelOpen} sortPanelClosing={sortPanelClosing} />
                </Suspense>}
              </div>
            </div>
            </div>

            <Suspense>
              <ProfilePageSidebar user={user} bioNoFollow={bioNoFollow}/>
            </Suspense>
          </section>
        </main>
      </div>
    </div>
  );
}

function ProfileHeaderActions({user}: {
  user: UsersProfile
}) {
  const classes = useStyles(profileStyles);
  const currentUser = useCurrentUser();
  const canEditProfile = !!user && userCanEditUser(currentUser, user);
  const canModerateUserProfile = userIsAdminOrMod(currentUser);
  const username = userGetDisplayName(user);

  if (!canEditProfile && !canModerateUserProfile) return null;

  return (
    <div className={classes.profileHeaderActions}>
      {canEditProfile && (
        <LWTooltip title="Edit profile" placement="bottom">
          <Link
            to={userGetEditUrl(user)}
            className={classes.profileActionIconLink}
            aria-label={`Edit ${username}'s profile`}
          >
            <EditIcon className={classes.profileActionIcon} />
          </Link>
        </LWTooltip>
      )}
      {canModerateUserProfile && (
        <LWTooltip title="Supermod page" placement="bottom">
          <Link
            to={`/admin/supermod?user=${user._id}`}
            className={classes.profileActionIconLink}
            aria-label={`${username}'s supermod page`}
          >
            <VisibilityOutlinedIcon className={classes.profileActionIcon} />
          </Link>
        </LWTooltip>
      )}
    </div>
  )
}

function ProfilePageSidebar({user, bioNoFollow}: {
  user: UsersProfile
  bioNoFollow: boolean
}) {
  const classes = useStyles(profileStyles);
  const userId = user._id;
  const currentUser = useCurrentUser();

  const [bioExpanded, setBioExpanded] = useState(false);
  const bioHtml = user?.htmlBio ?? "";
  const hasBio = !!bioHtml;
  const collapsedBioHtml = getCollapsedBioHtml(bioHtml);
  const displayBioHtml = bioExpanded ? bioHtml : collapsedBioHtml;
  const showBioExpand = !!bioHtml && collapsedBioHtml !== bioHtml;

  const isOwnProfile = !!currentUser && user && currentUser._id === user._id;
  const canSubscribeToUser = !isOwnProfile;
  const canMessageUser = !!currentUser && !isOwnProfile;

  return <aside className={classNames(classes.postsSidebar)}>
    <div className={classes.sidebarAuthorBlock}>
      <h4 className={classes.sidebarAuthorName}>
        <UsersNameWithModal
          user={user}
          className={classes.sidebarAuthorNameLink}
          tooltipPlacement="bottom-start"
        />
      </h4>
      <div className={classes.sidebarBioMeta}>
        {canSubscribeToUser && <UserNotifyDropdown
          user={user}
          popperPlacement="bottom-start"
          className={classes.sidebarSubscribe}
        />}
        {canMessageUser && <NewConversationButton user={user} currentUser={currentUser}>
          <a className={classes.sidebarMore}>Message</a>
        </NewConversationButton>}
      </div>
    </div>

    <div className={classes.sidebarBioSection}>
      {!hasBio && <div className={classes.sidebarMetaInfo}>
        <UserMetaInfo user={user} hidePostCount hideCommentCount omegaAlignment="inline" />
      </div>}

      {hasBio && <>
        <div className={classNames(classes.sidebarBioWrapper, bioExpanded ? classes.sidebarBioExpanded : classes.sidebarBioCollapsed)}>
          <ContentStyles contentType="post" className={classes.sidebarAuthorBioContent}>
            <ContentItemBody
              className={classes.sidebarAuthorBio}
              dangerouslySetInnerHTML={{ __html: displayBioHtml }}
              nofollow={bioNoFollow}
            />
          </ContentStyles>
        </div>
        {showBioExpand && (
          <div className={classNames(classes.readMore, classes.postsSidebarReadMore)}>
            <a 
              href="#" 
              className={classes.readMoreLink}
              onClick={(e) => {
                e.preventDefault();
                setBioExpanded(!bioExpanded);
              }}
            >
              {bioExpanded ? "See less" : "See more"}
            </a>
          </div>
        )}
      </>}
    </div>
    <Suspense>
      <ProfileDiamondSections
        key={userId}
        userId={userId}
        classes={classes}
      />
    </Suspense>
  </aside>
}

function ProfilePageMobileBio({user, bioNoFollow}: {
  user: UsersProfile,
  bioNoFollow: boolean
}) {
  const classes = useStyles(profileStyles);
  const currentUser = useCurrentUser();

  const [bioExpanded, setBioExpanded] = useState(false);
  const bioHtml = user?.htmlBio ?? "";
  const collapsedBioHtml = getCollapsedBioHtml(bioHtml);
  const displayBioHtml = bioExpanded ? bioHtml : collapsedBioHtml;
  const showBioExpand = !!bioHtml && collapsedBioHtml !== bioHtml;

  const isOwnProfile = !!currentUser && user && currentUser._id === user._id;
  const canSubscribeToUser = !isOwnProfile;
  const canMessageUser = !!currentUser && !isOwnProfile;

  if (!bioHtml && !user) return null;

  return <div className={classes.mobileProfileBio}>
    <div className={classes.mobileProfileHeaderRow}>
      <h4 className={classes.mobileProfileName}>{userGetDisplayName(user)}</h4>
      <div className={classes.mobileProfileActions}>
        {canSubscribeToUser ? (
          <UserNotifyDropdown
            user={user}
            popperPlacement="bottom-start"
            className={classes.sidebarSubscribe}
          />
        ) : (
          <span className={classNames(classes.sidebarSubscribe, classes.sidebarActionDisabled)}>Subscribe</span>
        )}
        {canMessageUser ? (
          <NewConversationButton user={user} currentUser={currentUser}>
            <a className={classes.sidebarMore}>Message</a>
          </NewConversationButton>
        ) : (
          <span className={classNames(classes.sidebarMore, classes.sidebarActionDisabled)}>Message</span>
        )}
      </div>
    </div>
    {bioHtml && <ContentStyles contentType="post" className={classes.sidebarAuthorBioContent}>
      <ContentItemBody
        className={classes.sidebarAuthorBio}
        dangerouslySetInnerHTML={{ __html: displayBioHtml }}
        nofollow={bioNoFollow}
      />
    </ContentStyles>}
    {showBioExpand && <div className={classes.readMore}>
      <a
        href="#"
        className={classes.readMoreLink}
        onClick={(e) => {
          e.preventDefault();
          setBioExpanded(!bioExpanded);
        }}
      >
        {bioExpanded ? "See less" : "See more"}
      </a>
    </div>}
    {user && <div className={classes.mobileMetaInfo}>
      <UserMetaInfo user={user} />
    </div>}
  </div>
}

function ProfilePageSequencesTab({user}: {
  user: UsersProfile
}) {
  const classes = useStyles(profileStyles);
  const userId = user._id;

  const { data: sequencesData, loading: sequencesLoading } = useQuery(ProfileSequencesQuery, {
    skip: !userId,
    variables: {
      selector: userId ? { userProfile: { userId } } : undefined,
      limit: SEQUENCES_LIMIT,
      enableTotal: false,
    },
    fetchPolicy: "cache-and-network",
  });
  const sequences = sequencesData?.sequences?.results ?? [];

  return <div className={classes.sequencesGrid}>
    {sequences.map((sequence) => {
      const imageId = sequence.gridImageId || defaultSequenceBannerIdSetting.get();
      return (
        <article key={sequence._id} className={classes.sequenceCard}>
          <Link
            to={sequenceGetPageUrl(sequence)}
            className={classes.articleLink}
          >
            <div
              className={classes.sequenceCardImage}
              style={{
                backgroundImage: cssUrl(`https://res.cloudinary.com/lesswrong-2-0/image/upload/c_fill,dpr_2.0,g_custom,h_380,q_auto,w_1200/v1/${imageId}`),
              }}
            />
            <div className={classes.sequenceCardContent}>
              <h3 className={classes.sequenceCardTitle}>{sequence.title}</h3>
            </div>
          </Link>
        </article>
      );
    })}
  </div>
}

function ProfilePageAllPostsTab({user, sortBy, setSortBy, sortPanelOpen, sortPanelClosing}: {
  user: UsersProfile
  sortBy: AllPostsTabSortingMode
  setSortBy: React.Dispatch<React.SetStateAction<AllPostsTabSortingMode>>
  sortPanelOpen: boolean
  sortPanelClosing: boolean
}) {
  const classes = useStyles(profileStyles);
  const userId = user._id;

  const { data: recentPostsData, loading: recentPostsLoading, loadMoreProps } = useQueryWithLoadMore(ProfilePostsQuery, {
    skip: !userId,
    variables: {
      selector: userId ? { userPosts: { userId, sortedBy: sortBy, excludeEvents: true, authorIsUnreviewed: null } } : undefined,
      limit: INITIAL_POSTS_TO_SHOW,
      enableTotal: true,
    },
    itemsPerPage: INITIAL_POSTS_TO_SHOW,
    fetchPolicy: "cache-and-network",
  });
  const recentPosts = recentPostsData?.posts?.results ?? [];
  const hasPosts = user.postCount > 0;

  return <>
    {(sortPanelOpen || sortPanelClosing) && (
      <div className={classNames(classes.sortPanel, sortPanelClosing && classes.sortPanelClosing)}>
        <div className={classes.sortPanelSection}>
          <div className={classes.sortPanelHeader}>Sorted by:</div>
          <button
            className={classNames(classes.sortPanelOption, sortBy === "new" && classes.sortPanelOptionSelected)}
            onClick={() => setSortBy("new")}
            type="button"
          >
            New
          </button>
          <button
            className={classNames(classes.sortPanelOption, sortBy === "old" && classes.sortPanelOptionSelected)}
            onClick={() => setSortBy("old")}
            type="button"
          >
            Old
          </button>
          <button
            className={classNames(classes.sortPanelOption, sortBy === "magic" && classes.sortPanelOptionSelected)}
            onClick={() => setSortBy("magic")}
            type="button"
          >
            Magic (New & Upvoted)
          </button>
          <button
            className={classNames(classes.sortPanelOption, sortBy === "top" && classes.sortPanelOptionSelected)}
            onClick={() => setSortBy("top")}
            type="button"
          >
            Top
          </button>
          <button
            className={classNames(classes.sortPanelOption, sortBy === "topInflation" && classes.sortPanelOptionSelected)}
            onClick={() => setSortBy("topInflation")}
            type="button"
          >
            Top (Inflation Adjusted)
          </button>
          <button
            className={classNames(classes.sortPanelOption, sortBy === "recentComments" && classes.sortPanelOptionSelected)}
            onClick={() => setSortBy("recentComments")}
            type="button"
          >
            Recent Comments
          </button>
        </div>
      </div>
    )}
    {!hasPosts && !recentPostsLoading && (
      <div className={classes.emptyStateContainer}>
        <p className={classes.emptyStateDescription}>{userGetDisplayName(user)} has not written any posts yet.</p>
        <div className={classes.emptyStateImage}>
          <img src="/profile-placeholder-2.png" alt="" />
        </div>
      </div>
    )}
    {recentPosts.map((post) => {
      const summary = getPostSummary(post);
      const imageUrl = getListPostImageUrl(post);
      const hasListImage = !!imageUrl;
      return (
        <article key={post._id} className={classes.listArticle}>
          <Link
            to={postGetPageUrl(post)}
            className={classes.articleLink}
          >
            <div className={classes.listArticleContent}>
              <div className={classNames(classes.listArticleBody, !hasListImage && classes.listArticleBodyNoImage)}>
                <div className={classNames(classes.listArticleText, !hasListImage && classes.listArticleTextNoImage)}>
                  <h3 className={classes.listArticleTitle}>
                    <span className={classes.listArticleTitleText}>{post.title}</span>
                  </h3>
                  {summary && (
                    <div className={classNames(
                      classes.listArticleSummaryWrapper,
                      !hasListImage && classes.listArticleSummaryWrapperNoImage,
                    )}>
                      <p className={classNames(
                        classes.listArticleSummary,
                        !hasListImage && classes.listArticleSummaryNoImage,
                      )}>{summary}</p>
                    </div>
                  )}
                  <div className={classNames(classes.listArticleMeta)}>
                    <LWTooltip title={<ExpandedDate date={post.postedAt!} />}>
                      <span className={classes.listDate}>{formatReadableDate(post.postedAt!)}</span>
                    </LWTooltip>
                    <span className={classes.listMetaDivider} aria-hidden="true">•</span>
                    <LWTooltip title="Karma score">
                      <span className={classes.listKarma}>{post.baseScore ?? 0}</span>
                    </LWTooltip>
                  </div>
                </div>
                {hasListImage && (
                  <div
                    className={classes.listArticleImage}
                    style={{
                      backgroundImage: cssUrl(imageUrl),
                    }}
                  ></div>
                )}
              </div>
            </div>
          </Link>
        </article>
      );
    })}

    <LoadMore {...loadMoreProps} />
  </>
}

function ProfilePageFeedTab({user, sortPanelOpen, sortPanelClosing}: {
  user: UsersProfile,
  sortPanelOpen: boolean,
  sortPanelClosing: boolean
}) {
  const classes = useStyles(profileStyles);
  const [feedSortBy, setFeedSortBy] = useState<"recent" | "top">("recent");
  const [feedFilter, setFeedFilter] = useState<"all" | "posts" | "quickTakes" | "comments">("all");

  const hasPosts = user.postCount > 0;
  // FIXME: This is missing some other content types. The there-is-nothing handler should be coming from MixedTypeFeed.
  const hasFeedContent = hasPosts || (user?.commentCount ?? 0) > 0;

  return <>
    {(sortPanelOpen || sortPanelClosing) && (
      <div className={classNames(classes.sortPanel, classes.sortPanelMulti, sortPanelClosing && classes.sortPanelClosing)}>
        <div className={classes.sortPanelSection}>
          <div className={classes.sortPanelHeader}>Sorted by:</div>
          <button
            className={classNames(classes.sortPanelOption, feedSortBy === "recent" && classes.sortPanelOptionSelected)}
            onClick={() => setFeedSortBy("recent")}
            type="button"
          >
            New
          </button>
          <button
            className={classNames(classes.sortPanelOption, feedSortBy === "top" && classes.sortPanelOptionSelected)}
            onClick={() => setFeedSortBy("top")}
            type="button"
          >
            Top
          </button>
        </div>
        <div className={classes.sortPanelSection}>
          <div className={classes.sortPanelHeader}>Show:</div>
          <button
            className={classNames(classes.sortPanelOption, feedFilter === "all" && classes.sortPanelOptionSelected)}
            onClick={() => setFeedFilter("all")}
            type="button"
          >
            All
          </button>
          <button
            className={classNames(classes.sortPanelOption, feedFilter === "comments" && classes.sortPanelOptionSelected)}
            onClick={() => setFeedFilter("comments")}
            type="button"
          >
            Comments
          </button>
          <button
            className={classNames(classes.sortPanelOption, feedFilter === "quickTakes" && classes.sortPanelOptionSelected)}
            onClick={() => setFeedFilter("quickTakes")}
            type="button"
          >
            Quick takes
          </button>
          <button
            className={classNames(classes.sortPanelOption, feedFilter === "posts" && classes.sortPanelOptionSelected)}
            onClick={() => setFeedFilter("posts")}
            type="button"
          >
            Posts
          </button>
        </div>
      </div>
    )}
    {!hasFeedContent && (
      <div className={classes.emptyStateContainer}>
        <p className={classes.emptyStateDescription}>{userGetDisplayName(user)} hasn&apos;t written anything yet.</p>
        <div className={classes.emptyStateImage}>
          <img src="/profile-placeholder-4.png" alt="" />
        </div>
      </div>
    )}
    {hasFeedContent && (
      <UltraFeedContextProvider openInNewTab={true}>
        <UltraFeedObserverProvider incognitoMode={false}>
          <OverflowNavObserverProvider>
            <div className={classes.profileFeedTopMargin}>
              <UserContentFeed userId={user._id} externalSortMode={feedSortBy} externalFilter={feedFilter} />
            </div>
          </OverflowNavObserverProvider>
        </UltraFeedObserverProvider>
      </UltraFeedContextProvider>
    )}
  </>
}

function ProfilePageQuickTakesTab({user}: {
  user: UsersProfile,
}) {
  const classes = useStyles(profileStyles);

  return (
    <UltraFeedContextProvider openInNewTab={true}>
      <UltraFeedObserverProvider incognitoMode={false}>
        <OverflowNavObserverProvider>
          <div className={classes.profileFeedTopMargin}>
            <UserContentFeed userId={user._id} externalSortMode="recent" externalFilter="quickTakes" removeSideMargins={true} />
          </div>
        </OverflowNavObserverProvider>
      </UltraFeedObserverProvider>
    </UltraFeedContextProvider>
  );
}
