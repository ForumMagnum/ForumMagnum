import { NotificationsViews } from "@/lib/collections/notifications/views";
import { getDefaultViewSelector } from "@/lib/utils/viewUtils";
import Notifications from "@/server/collections/notifications/collection";
import { getUserFromReq } from "@/server/vulcan-lib/apollo-server/getUserFromReq";
import { isFriendlyUI } from "@/themes/forumTheme";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const currentUser = await getUserFromReq(req);
  if (!currentUser) {
    return new Response("Unauthorized", { status: 401 });
  }

  const selector = {
    ...getDefaultViewSelector(NotificationsViews),
    userId: currentUser._id,
  };

  const lastNotificationsCheck = currentUser.lastNotificationsCheck;

  const unreadNotifications = await Notifications.find({
    ...selector,
    ...(lastNotificationsCheck && {
      createdAt: {$gt: lastNotificationsCheck},
    }),
    ...(isFriendlyUI() && {
      type: {$ne: "newMessage"},
      viewed: {$ne: true},
    }),
  }).fetch();

  return NextResponse.json({ unreadNotificationCount: unreadNotifications.length });
}
