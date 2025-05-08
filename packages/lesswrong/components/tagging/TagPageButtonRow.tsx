import React from 'react';
import { useDialog } from '../common/withDialog';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { subscriptionTypes } from '../../lib/collections/subscriptions/helpers'
import { useCurrentUser } from '../common/withUser';
import { Link } from '../../lib/reactRouterWrapper';
import HistoryIcon from '@/lib/vendor/@material-ui/icons/src/History';
import EditOutlinedIcon from '@/lib/vendor/@material-ui/icons/src/EditOutlined';
import LockIcon from '@/lib/vendor/@material-ui/icons/src/Lock';
import { userHasNewTagSubscriptions } from '../../lib/betas';
import classNames from 'classnames';
import { useTagBySlug } from './useTag';
import { tagGetHistoryUrl, tagMinimumKarmaPermissions, tagUserHasSufficientKarma, isTagAllowedType3Audio } from '../../lib/collections/tags/helpers';
import { isLWorAF } from '@/lib/instanceSettings';
import type { TagLens } from '@/lib/arbital/useTagLenses';
import { isFriendlyUI } from '@/themes/forumTheme';
import { AnalyticsContext, useTracking } from '@/lib/analyticsEvents';

const PODCAST_ICON_SIZE = 20;
const PODCAST_ICON_PADDING = 3;

const styles = (theme: ThemeType) => ({
  buttonsRow: {
    ...theme.typography.body2,
    marginTop: isFriendlyUI ? 2 : undefined,
    marginBottom: isFriendlyUI ? 16 : undefined,
    color: theme.palette.grey[700],
    display: "flex",
    flexWrap: "wrap",
    columnGap: 16,
    [theme.breakpoints.down('xs')]: {
      marginTop: isFriendlyUI ? 8 : undefined,
    },
    '& svg': {
      height: 20,
      width: 20,
      marginBottom: 1, // JP it's fine, stop adjusting single pixels
      cursor: "pointer",
      color: theme.palette.grey[700]
    },
    "@media print": {
      display: "none",
    },
  },
  headerSubforumLink: {
    alignItems: "center",
    marginRight: 16,
    display: "none",
    [theme.breakpoints.down('sm')]: {
      display: "flex",
    },
  },
  likeButtonWrapper: {
    fontSize: 12,
  },
  buttonTooltip: {
    display: "flex",
    alignItems: "center",
  },
  button: {
    display: "flex",
    alignItems: "center",
  },
  buttonLabel: {
    [theme.breakpoints.down('sm')]: {
      display: "none"
    }
  },
  lockIcon: {
    display: "flex",
    alignItems: "center",
    '&:hover': {
      opacity: 1
    },
    '& svg': {
      color: theme.palette.grey[600],
    }
  },
  subscribeToWrapper: {
    display: "flex !important",
    ...(isFriendlyUI ? {
    } : {
      marginLeft: -2,
      marginRight: -5,
      '& .MuiListItemIcon-root': {
        marginRight: "unset !important",
      },
    }),
  },
  subscribeTo: {
  },
  helpImprove: {
    [theme.breakpoints.down('sm')]: {
      display: "none"
    },
    marginLeft: 'auto',
    color: theme.palette.grey[700],
    ...theme.typography.italic,
  },
  newLensIcon: {},
  togglePodcastContainer: {
    alignSelf: 'center',
    color: theme.palette.text.dim3,
    height: PODCAST_ICON_SIZE,
  },
  audioIcon: {
    width: PODCAST_ICON_SIZE + (PODCAST_ICON_PADDING * 2) + "px !important",
    height: PODCAST_ICON_SIZE + (PODCAST_ICON_PADDING * 2) + "px !important",
    padding: PODCAST_ICON_PADDING,
    transform: isFriendlyUI ? undefined : `translateY(-3px)`,
    marginRight: -3
  },
  audioIconOn: {
    background: theme.palette.icon.dim05,
    borderRadius: theme.borderRadius.small,
  },
});

/**
 * Returns whether the current user can edit the tag, and if not, why not.
 * 
 * IMPORTANT: this does not return false if the user is logged out.  You need to check that separately.
 */
export function useTagEditingRestricted(tag: TagPageWithRevisionFragment | TagPageFragment | null, alreadyEditing: boolean, currentUser: UsersCurrent | null) {
  if (!tag) return { canEdit: false, noEditNotAuthor: false, noEditKarmaTooLow: false };

  const restricted = tag.canEditUserIds && tag.canEditUserIds.length > 0;
  const noEditNotAuthor = restricted && (!currentUser || (!currentUser.isAdmin && !tag.canEditUserIds.includes(currentUser._id)));
  const noEditKarmaTooLow = !restricted && currentUser && !tagUserHasSufficientKarma(currentUser, "edit");
  const canEdit = !alreadyEditing && !noEditKarmaTooLow && !noEditNotAuthor;

  return { canEdit, noEditNotAuthor, noEditKarmaTooLow };
}
const TagPageButtonRowInner = ({
  tag,
  selectedLens,
  editing,
  setEditing,
  hideLabels = false,
  className,
  refetchTag,
  updateSelectedLens,
  toggleEmbeddedPlayer,
  showEmbeddedPlayer,
  classes
}: {
  tag: TagPageWithRevisionFragment | TagPageFragment | TagPageWithArbitalContentFragment;
  selectedLens?: TagLens;
  editing: boolean;
  setEditing: (editing: boolean) => void;
  hideLabels?: boolean;
  className?: string;
  refetchTag?: () => Promise<void>;
  updateSelectedLens?: (lensId: string) => void;
  toggleEmbeddedPlayer?: () => void;
  showEmbeddedPlayer?: boolean;
  classes: ClassesType<typeof styles>;
}) => {
  const { openDialog } = useDialog();
  const currentUser = useCurrentUser();
  const {
    LWTooltip,
    SubscribeTo,
    TagDiscussionButton,
    ContentItemBody,
    ForumIcon,
    TagOrLensLikeButton,
    TagPageActionsMenuButton
  } = Components;
  const { tag: beginnersGuideContentTag } = useTagBySlug("tag-cta-popup", "TagFragment");

  const { captureEvent } = useTracking();

  const numFlags = tag.tagFlagsIds?.length

  function handleNewLensClick() {
    captureEvent('tagPageButtonRowNewLensClick');
    if (!currentUser) {
      openDialog({
        name: "LoginPopup",
        contents: ({onClose}) => <Components.LoginPopup onClose={onClose} />
      });
      return;
    }

    if (!refetchTag || !updateSelectedLens) return;
    openDialog({
      name: "NewLensDialog",
      contents: ({onClose}) => <Components.NewLensDialog
        onClose={onClose}
        tag={tag}
        refetchTag={refetchTag}
        updateSelectedLens={updateSelectedLens}
      />
    });
  }

  function handleEditClick(e: React.MouseEvent<HTMLAnchorElement>) {
    captureEvent('tagPageButtonRowEditClick');
    if (currentUser) {
      setEditing(true)
    } else {
      openDialog({
        name: "LoginPopup",
        contents: ({onClose}) => <Components.LoginPopup onClose={onClose} />
      });
      e.preventDefault();
    }
  }

  const { canEdit, noEditNotAuthor, noEditKarmaTooLow } = useTagEditingRestricted(tag, editing, currentUser);
  
  const undeletedLensCount = 'lenses' in tag ? tag.lenses.filter(lens => !lens.deleted).length : 0;
  const canCreateLens = !editing
    && canEdit
    && (!!refetchTag && !!updateSelectedLens)
    && (undeletedLensCount < 5)
    && isLWorAF;

  const editTooltipHasContent = noEditNotAuthor || noEditKarmaTooLow || (numFlags && !isLWorAF) || beginnersGuideContentTag
  const editTooltip = editTooltipHasContent && <>
    {noEditNotAuthor && <>
      <div>
      This article can only be edited by the authors, please comment in the discussion to suggest changes
    </div>
    <br />
    </>}
    {noEditKarmaTooLow && <>
      <div>
      You must have at least {tagMinimumKarmaPermissions.edit} karma to edit this topic
    </div>
    <br />
    </>}
    {!!numFlags && !isLWorAF && <>
      <div>
        This article has the following flag{tag.tagFlagsIds?.length > 1 ? "s" : ""}:{' '}
        {tag.tagFlags.map((flag, i) => <span key={flag._id}>{flag.name}{(i + 1) < tag.tagFlags?.length && ", "}</span>)}
      </div>
      <br />
    </>}
    <ContentItemBody
      dangerouslySetInnerHTML={{ __html: beginnersGuideContentTag?.description?.html || "" }}
      description={`tag ${tag?.name}`}
    />
  </>;

  // Audio toggle element
  const audioToggle = isTagAllowedType3Audio(tag) && toggleEmbeddedPlayer && (
    <LWTooltip title={'Listen to this page'} className={classes.togglePodcastContainer}>
      <a href="#" onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleEmbeddedPlayer();
      }}>
        <ForumIcon 
          icon="VolumeUp" 
          className={classNames(classes.audioIcon, {[classes.audioIconOn]: showEmbeddedPlayer})} 
        />
        <span className={classes.buttonLabel}>
          {!hideLabels && "Listen"}
        </span>
      </a>
    </LWTooltip>
  );

  return <AnalyticsContext pageSectionContext="tagPageButtonRow">
    <div className={classNames(classes.buttonsRow, className)}>
      {audioToggle}
      {!editing && <LWTooltip
        className={classes.buttonTooltip}
        title={editTooltip}
      >
        {canEdit ? (<a className={classes.button} onClick={handleEditClick}>
          <EditOutlinedIcon />
          <span className={classes.buttonLabel}>
            {!hideLabels && "Edit"}
          </span>
        </a>) : (<a className={classes.lockIcon} onClick={() => {}}><LockIcon className={classes.lockIcon}/>
          <span className={classes.buttonLabel}>
            {!hideLabels && "Edit"}
          </span>
        </a>)}
      </LWTooltip>}
      {<Link
        className={classes.button}
        to={tagGetHistoryUrl(tag)}
      >
        <HistoryIcon /><span className={classes.buttonLabel}>
          {!hideLabels && "History"}
        </span>
      </Link>}
      {!userHasNewTagSubscriptions(currentUser) && !tag.wikiOnly && !editing && <LWTooltip title="Get notifications when posts are added to this tag." className={classes.subscribeToWrapper}>
        <SubscribeTo
          document={tag}
          className={classes.subscribeTo}
          showIcon
          hideLabel={hideLabels}
          hideLabelOnMobile
          subscribeMessage="Subscribe"
          unsubscribeMessage="Unsubscribe"
          subscriptionType={subscriptionTypes.newTagPosts}
        />
      </LWTooltip>}
      {<div className={classes.button}><TagDiscussionButton tag={tag} hideLabel={hideLabels} hideLabelOnMobile hideParens /></div>}
      {selectedLens && <div className={classes.likeButtonWrapper}>
        <TagOrLensLikeButton lens={selectedLens} isSelected={true} stylingVariant="buttonRow" />
      </div>}
      {!userHasNewTagSubscriptions(currentUser) && !hideLabels && <LWTooltip
        className={classes.helpImprove}
        title={editTooltip}
      >
        <a onClick={handleEditClick}>
          Help improve this page {!!numFlags && <>({numFlags} flag{numFlags > 1 ? "s" : ""})</>}
        </a>
      </LWTooltip>}
      
      {isLWorAF && <TagPageActionsMenuButton
        tagOrLens={selectedLens}
        createLens={canCreateLens ? handleNewLensClick : null}
        handleEditClick={!editing && canEdit ? handleEditClick : null}
      />}
    </div>
  </AnalyticsContext>
}

export const TagPageButtonRow = registerComponent("TagPageButtonRow", TagPageButtonRowInner, { styles });

declare global {
  interface ComponentTypes {
    TagPageButtonRow: typeof TagPageButtonRow
  }
}
