import React from 'react';
import { DatabasePublicSetting } from "../../publicSettings";
import QuestionAnswerIcon from '@material-ui/icons/QuestionAnswer';
import PlayCircleOutlineIcon from '@material-ui/icons/PlayCircleOutline';
import AllInclusiveIcon from '@material-ui/icons/AllInclusive';

export const postStatuses = {
  STATUS_PENDING: 1,
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
const startHerePostIdSetting = new DatabasePublicSetting<string | null>('startHerePostId', null)

export const tagSettingIcons = new Map<DatabasePublicSetting<string | null>, React.ComponentType<React.SVGProps<SVGElement>>>([
  [amaTagIdSetting, QuestionAnswerIcon], 
  [openThreadTagIdSetting, AllInclusiveIcon],
]);

export const idSettingIcons = new Map([
  [startHerePostIdSetting, PlayCircleOutlineIcon]
]);
