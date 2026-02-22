import { Badge } from "@/components/widgets/Badge";
import IconButton from '@/lib/vendor/@material-ui/core/src/IconButton';
import classNames from 'classnames';
import { registerComponent } from '../../lib/vulcan-lib/components';
import ErrorBoundary from '../common/ErrorBoundary';
import ForumIcon from "../common/ForumIcon";
import { SuspenseWrapper } from '../common/SuspenseWrapper';
import { useStyles } from '../hooks/useStyles';
import { useUnreadNotifications } from '../hooks/useUnreadNotifications';
import { styles } from './notificationsMenuButtonStyles';

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
