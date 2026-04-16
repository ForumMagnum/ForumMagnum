import React, { useEffect, useRef, useState } from 'react';
import { Paper }from '@/components/widgets/Paper';
import IconButton from '@/lib/vendor/@material-ui/core/src/IconButton';
import { Badge } from "@/components/widgets/Badge";
import { useTracking, AnalyticsContext } from '../../../lib/analyticsEvents';
import classNames from 'classnames';
import { useSuspenseQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";
import LWClickAwayListener from "../../common/LWClickAwayListener";
import ForumIcon from "../../common/ForumIcon";
import { SuspenseWrapper } from '../../common/SuspenseWrapper';
import ErrorBoundary from '../../common/ErrorBoundary';
import { ColoredNumber } from './ColoredNumber';
import { defineStyles, useStyles } from '../../hooks/useStyles';
import { useCurrentUser } from '@/components/common/withUser';
import KarmaChangesDisplay from './KarmaChangesDisplay';
import LWPopper from '../../common/LWPopper';
import DeferRender from '@/components/common/DeferRender';
import { useLocation } from '@/lib/routeUtil';
import { canonicalizePath } from '@/lib/generated/routeManifest';
import { useMutationNoCache } from '@/lib/crud/useMutationNoCache';
import { isIfAnyoneBuildsItFrontPage } from '@/components/seasonal/styles';

const styles = defineStyles("KarmaChangeNotifier", (theme: ThemeType) => ({
  root: {
    display: 'flex',
    alignItems: 'center',
  },
  placeholder: {},
  karmaNotifierButton: {},
  karmaNotifierPaper: {},
  karmaNotifierPopper: {
    zIndex: theme.zIndexes.karmaChangeNotifier,
  },
  starIcon: {
    color: theme.palette.header.text,
    ...isIfAnyoneBuildsItFrontPage({
      color: theme.palette.text.bannerAdOverlay,
    }),
  },
  pointBadge: {
    fontSize: '0.9rem'
  },
}), { stylePriority: -1 });

export const UserKarmaChangesQuery = gql(`
  query KarmaChangeNotifier($documentId: String) {
    user(input: { selector: { documentId: $documentId } }) {
      result {
        ...UserKarmaChanges
      }
    }
  }
`);

const KarmaChangesCheckedMutation = gql(`
  mutation karmaChangesCheckedKarmaChangeNotifier($startDate: Date, $endDate: Date) {
    karmaChangesChecked(startDate: $startDate, endDate: $endDate)
  }
`);

const KarmaChangeNotifierLoaded = ({className, onOpen, notificationOpen}: {
  className?: string,
  onOpen?: () => void,
  notificationOpen?: boolean,
}) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser()!;
  const [karmaChangesChecked] = useMutationNoCache(KarmaChangesCheckedMutation);
  const [cleared,setCleared] = useState(false);
  const [open, setOpen] = useState(false);
  const anchorEl = useRef<HTMLDivElement|null>(null)
  const { captureEvent } = useTracking()
  const [karmaChangeLastOpened, setKarmaChangeLastOpened] = useState(currentUser?.karmaChangeLastOpened || new Date());

  const { data } = useSuspenseQuery(UserKarmaChangesQuery, {
    variables: { documentId: currentUser._id },
  });
  const document = data?.user?.result;

  const [stateKarmaChanges,setStateKarmaChanges] = useState(document?.karmaChanges);

  // Close karma panel (without marking as read) when notifications panel opens
  useEffect(() => {
    if (notificationOpen) {
      setOpen(false);
    }
  }, [notificationOpen]);

  const handleOpen = () => {
    setOpen(true);
    setKarmaChangeLastOpened(new Date());
    onOpen?.();
  }

  const handleClose = () => {
    setOpen(false);
    if (!currentUser) return;
    if (document?.karmaChanges) {
      void karmaChangesChecked({
        variables: {
          startDate: document.karmaChanges.startDate,
          endDate: document.karmaChanges.endDate,
        },
      });

      if (document.karmaChanges.updateFrequency === "realtime") {
        setCleared(true);
      }
    }
  }

  const handleToggle = () => {
    if (open) {
      handleClose()
    } else {
      handleOpen()
    }
    captureEvent("karmaNotifierToggle", {open: !open, karmaChangeLastOpened, karmaChanges: stateKarmaChanges})
  }

  if (!document) {
    return <KarmaChangeNotifierPlaceholder/>
  }
  const karmaChanges = stateKarmaChanges || document.karmaChanges; // Covers special case when state was initialized when user wasn't logged in
  if (!karmaChanges) {
    return <KarmaChangeNotifierPlaceholder/>
  }

  const { karmaChangeNotifierSettings: settings } = currentUser
  if (settings && settings.updateFrequency === "disabled")
    return null;

  const { posts, comments, tagRevisions, endDate, totalChange } = karmaChanges
  //Check if user opened the karmaChangeNotifications for the current interval
  const newKarmaChangesSinceLastVisit = new Date(karmaChangeLastOpened || 0) < new Date(endDate || 0)
  const starIsHollow = ((!comments?.length && !posts?.length && !tagRevisions?.length) || cleared || !newKarmaChangesSinceLastVisit)
  return <AnalyticsContext pageSection="karmaChangeNotifer">
    <div className={classNames(classes.root, className)}>
      <div ref={anchorEl}>
        <IconButton onClick={handleToggle} className={classes.karmaNotifierButton}>
          {starIsHollow
            ? <ForumIcon icon="KarmaOutline" className={classes.starIcon}/>
            : <Badge badgeContent={
                <span className={classes.pointBadge}>
                  {(!!totalChange) && <ColoredNumber n={totalChange}/>}
                </span>}
              >
                <ForumIcon icon="Karma" className={classes.starIcon}/>
              </Badge>
          }
        </IconButton>
      </div>
      <LWPopper
        open={open}
        anchorEl={anchorEl.current}
        placement="bottom-end"
        className={classes.karmaNotifierPopper}
      >
        <LWClickAwayListener onClickAway={handleClose}>
          <Paper className={classes.karmaNotifierPaper}>
            <KarmaChangesDisplay karmaChanges={karmaChanges} handleClose={handleClose} />
          </Paper>
        </LWClickAwayListener>
      </LWPopper>
    </div>
  </AnalyticsContext>
}

const KarmaChangeNotifierPlaceholder = ({className}: {
  className?: string
}) => {
  const classes = useStyles(styles);
  return <div className={classNames(classes.root, classes.placeholder, className)}>
    <IconButton className={classes.karmaNotifierButton}>
      <ForumIcon icon="KarmaOutline" className={classes.starIcon}/>
    </IconButton>
  </div>
}

export const KarmaChangeNotifier = ({className, onOpen, notificationOpen}: {
  className?: string,
  onOpen?: () => void,
  notificationOpen?: boolean,
}) => {
  // We no-ssr the KarmaChangeNotifier in the case where we aren't hitting a route we recognize
  // to prevent SSRs caused by 404s from executing the karma change queries if the client doesn't
  // execute javascript (i.e. is a bot, or if we do something that causes clients to hit api routes
  // that no longer exist, such as when we're doing cutovers to/from our NextJS branch with some
  // notification-related routes)
  const { pathname } = useLocation();
  const canonicalPathname = canonicalizePath(pathname);
  const shouldSSR = !!canonicalPathname;

  return (
    <ErrorBoundary>
    <SuspenseWrapper
      name="KarmaChangeNotifier"
      fallback={<KarmaChangeNotifierPlaceholder className={className}/>}
    >
      <DeferRender ssr={shouldSSR} fallback={<KarmaChangeNotifierPlaceholder className={className}/>}>
        <KarmaChangeNotifierLoaded className={className} onOpen={onOpen} notificationOpen={notificationOpen}/>
      </DeferRender>
    </SuspenseWrapper>
    </ErrorBoundary>
  )
}

