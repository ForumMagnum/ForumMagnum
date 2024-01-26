import React from 'react';
import { annualReviewAnnouncementPostPathSetting, DatabasePublicSetting } from "../../publicSettings";
import QuestionAnswerIcon from '@material-ui/icons/QuestionAnswer';
import ArrowForwardIcon from '@material-ui/icons/ArrowForward';
import AllInclusiveIcon from '@material-ui/icons/AllInclusive';
import StarIcon from '@material-ui/icons/Star';
import { isEAForum } from '../../instanceSettings';

export const postStatuses = {
  STATUS_PENDING: 1, // Unused
  STATUS_APPROVED: 2,
  STATUS_REJECTED: 3,
  STATUS_SPAM: 4,
  STATUS_DELETED: 5,
}


// Post statuses
export const postStatusLabels = [
  {
    value: 1,
    label: 'pending'
  },
  {
    value: 2,
    label: 'approved'
  },
  {
    value: 3,
    label: 'rejected'
  },
  {
    value: 4,
    label: 'spam'
  },
  {
    value: 5,
    label: 'deleted'
  }
];

const amaTagIdSetting = new DatabasePublicSetting<string | null>('amaTagId', null)
const openThreadTagIdSetting = new DatabasePublicSetting<string | null>('openThreadTagId', null)
export const startHerePostIdSetting = new DatabasePublicSetting<string | null>('startHerePostId', null)

// Cute hack
const reviewPostIdSetting = {
  get: () => isEAForum ?
    annualReviewAnnouncementPostPathSetting.get()?.match(/^\/posts\/([a-zA-Z\d]+)/)?.[1] :
    null
}

export const tagSettingIcons = new Map<DatabasePublicSetting<string | null>, React.ComponentType<React.SVGProps<SVGElement>>>([
  [amaTagIdSetting, QuestionAnswerIcon], 
  [openThreadTagIdSetting, AllInclusiveIcon],
]);

export const idSettingIcons = new Map([
  [startHerePostIdSetting, ArrowForwardIcon],
  // use an imposter to avoid duplicating annualReviewAnnouncementPostPathSetting, which is a path not a post id
  [reviewPostIdSetting as DatabasePublicSetting<string | null>, StarIcon]
]);

export const sideCommentFilterMinKarma = 10;
export const sideCommentAlwaysExcludeKarma = -1;
