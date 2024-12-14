import React from 'react';
import { useDialog } from '../common/withDialog';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { subscriptionTypes } from '../../lib/collections/subscriptions/schema'
import { useCurrentUser } from '../common/withUser';
import { Link } from '../../lib/reactRouterWrapper';
import HistoryIcon from '@material-ui/icons/History';
import EditOutlinedIcon from '@material-ui/icons/EditOutlined';
import LockIcon from '@material-ui/icons/Lock';
import { userHasNewTagSubscriptions } from '../../lib/betas';
import classNames from 'classnames';
import { useTagBySlug } from './useTag';
import { tagGetHistoryUrl, tagMinimumKarmaPermissions, tagUserHasSufficientKarma } from '../../lib/collections/tags/helpers';

const styles = (theme: ThemeType): JssStyles => ({
  buttonsRow: {
    ...theme.typography.body2,
    color: theme.palette.grey[700],
    display: "flex",
    flexWrap: "wrap",
    '& svg': {
      height: 20,
      width: 20,
      marginRight: 4,
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
  buttonTooltip: {
    display: "flex",
    alignItems: "center",
  },
  button: {
    display: "flex",
    alignItems: "center",
    marginRight: 16,
  },
  buttonLabel: {
    [theme.breakpoints.down('sm')]: {
      display: "none"
    }
  },
  lockIcon: {
    display: "flex",
    alignItems: "center",
    marginRight: 16,
    '&:hover': {
      opacity: 1
    },
    '& svg': {
      color: theme.palette.grey[600],
    }
  },
  subscribeToWrapper: {
    display: "flex !important",
  },
  subscribeTo: {
    marginRight: 16
  },
  helpImprove: {
    [theme.breakpoints.down('sm')]: {
      display: "none"
    },
    marginLeft: 'auto',
    color: theme.palette.grey[700],
    ...theme.typography.italic,
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

const TagPageButtonRow = ({ tag, editing, setEditing, hideLabels = false, className, classes }: {
  tag: TagPageWithRevisionFragment | TagPageFragment,
  editing: boolean,
  setEditing: (editing: boolean) => void,
  hideLabels?: boolean,
  className?: string,
  classes: ClassesType
}) => {
  const { openDialog } = useDialog();
  const currentUser = useCurrentUser();
  const { LWTooltip, NotifyMeButton, TagDiscussionButton, ContentItemBody } = Components;
  const { tag: beginnersGuideContentTag } = useTagBySlug("tag-cta-popup", "TagFragment")

  const numFlags = tag.tagFlagsIds?.length

  function handleEditClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (currentUser) {
      setEditing(true)
    } else {
      openDialog({
        componentName: "LoginPopup",
        componentProps: {}
      });
      e.preventDefault();
    }
  }

  const { canEdit, noEditNotAuthor, noEditKarmaTooLow } = useTagEditingRestricted(tag, editing, currentUser);

  const editTooltipHasContent = noEditNotAuthor || noEditKarmaTooLow || numFlags || beginnersGuideContentTag
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
    {!!numFlags && <>
      <div>
        This article has the following flag{tag.tagFlagsIds?.length > 1 ? "s" : ""}:{' '}
        {tag.tagFlags.map((flag, i) => <span key={flag._id}>{flag.name}{(i + 1) < tag.tagFlags?.length && ", "}</span>)}
      </div>
      <br />
    </>}
    <ContentItemBody
      className={classes.beginnersGuide}
      dangerouslySetInnerHTML={{ __html: beginnersGuideContentTag?.description?.html || "" }}
      description={`tag ${tag?.name}`}
    />
  </>

  return <div className={classNames(classes.buttonsRow, className)}>
    {!editing && <LWTooltip
      className={classes.buttonTooltip}
      title={editTooltip}
    >
      {canEdit ? (<a className={classes.button} onClick={handleEditClick}>
        <EditOutlinedIcon /><span className={classes.buttonLabel}>
          {!hideLabels && "Edit"}
        </span>
      </a>) : (
        <a className={classes.lockIcon} onClick={() => {}}><LockIcon className={classes.lockIcon}/><span className={classes.buttonLabel}>
          {!hideLabels && "Edit"}
        </span></a>)}
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
      <NotifyMeButton
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
    {<div className={classes.button}><TagDiscussionButton tag={tag} hideLabel={hideLabels} hideLabelOnMobile /></div>}
    {!userHasNewTagSubscriptions(currentUser) && !hideLabels && <LWTooltip
      className={classes.helpImprove}
      title={editTooltip}
    >
      <a onClick={handleEditClick}>
        Help improve this page {!!numFlags && <>({numFlags} flag{numFlags > 1 ? "s" : ""})</>}
      </a>
    </LWTooltip>}
  </div>
}

const TagPageButtonRowComponent = registerComponent("TagPageButtonRow", TagPageButtonRow, { styles });

declare global {
  interface ComponentTypes {
    TagPageButtonRow: typeof TagPageButtonRowComponent
  }
}
