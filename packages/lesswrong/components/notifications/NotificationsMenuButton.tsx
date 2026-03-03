import React, { useCallback, useEffect, useRef, useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useCurrentUser } from '../common/withUser';
import { useLocation } from '../../lib/routeUtil';
import { isFriendlyUI } from '../../themes/forumTheme';
import { useUnreadNotifications } from '../hooks/useUnreadNotifications';
import IconButton from '@/lib/vendor/@material-ui/core/src/IconButton';
import { Badge } from "@/components/widgets/Badge";
import classNames from 'classnames';
import DeferRender from '../common/DeferRender';
import { useUpdateCurrentUser } from '../hooks/useUpdateCurrentUser';
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";
import ForumIcon from "../common/ForumIcon";
import LWClickAwayListener from "../common/LWClickAwayListener";
import { useStyles } from '../hooks/useStyles';
import { SuspenseWrapper } from '../common/SuspenseWrapper';
import { styles } from './notificationsMenuButtonStyles';
import ErrorBoundary from '../common/ErrorBoundary';

import dynamic from 'next/dynamic';
const LWPopper = dynamic(() => import("../common/LWPopper"), { ssr: false });

const UserKarmaChangesQuery = gql(`
  query NotificationsMenuButton($documentId: String) {
    user(input: { selector: { documentId: $documentId } }) {
      result {
        ...UserKarmaChanges
      }
    }
  }
`);

type NotificationsMenuButtonProps = {
  open: boolean,
  toggle: () => void,
  className?: string,
}

const BookNotificationsMenuButtonInner = ({
  open,
  toggle,
  className,
}: NotificationsMenuButtonProps) => {
  const classes = useStyles(styles);
  const {latestUnreadCount} = useUnreadNotifications();
  const unreadNotifications = latestUnreadCount ?? 0;
  const buttonClass = open ? classes.buttonOpen : classes.buttonClosed;
  return (
    <Badge
      className={classNames(classes.badgeContainer, className)}
      badgeClassName={classNames(classes.badge, classes.badgeBackground)}
      badgeContent={(unreadNotifications>0) ? `${unreadNotifications}` : ""}
    >
      <IconButton
        classes={{ root: buttonClass }}
        onClick={toggle}
      >
        {(unreadNotifications>0) ? <ForumIcon icon="Bell" /> : <ForumIcon icon="BellBorder" />}
      </IconButton>
    </Badge>
  );
}

const BookNotificationsMenuButtonPlaceholder = ({toggle}: {
  toggle: () => void,
}) => {
  const classes = useStyles(styles);
  return <IconButton classes={{ root: classes.buttonClosed }} onClick={toggle}>
    <ForumIcon icon="BellBorder"/>
  </IconButton>
}

const hasKarmaChange = (
  currentUser: UsersCurrent | null,
  karmaChanges?: UserKarmaChanges | null,
) => {
  if (!currentUser || !karmaChanges?.karmaChanges) {
    return false;
  }
  const {
    updateFrequency, endDate, posts, comments, tagRevisions,
  } = karmaChanges.karmaChanges;
  if (
    !(posts?.length || comments?.length || tagRevisions?.length) ||
    updateFrequency === "disabled"
  ) {
    return false;
  }
  const lastOpened = currentUser.karmaChangeLastOpened ?? new Date(0);
  return lastOpened < (endDate ?? new Date(0)) || updateFrequency === "realtime";
}

const NotificationsMenuButton = ({ open, toggle, className }: NotificationsMenuButtonProps) => {
  const fallback = <BookNotificationsMenuButtonPlaceholder toggle={toggle} />
  return <SuspenseWrapper
    name="NotificationsMenuButton"
    fallback={fallback}
  >
    <ErrorBoundary fallback={fallback}>
      <BookNotificationsMenuButtonInner open={open} toggle={toggle} className={className}/>
    </ErrorBoundary>
  </SuspenseWrapper>
}

export default registerComponent("NotificationsMenuButton", NotificationsMenuButton, {
  areEqual: "auto",
});


