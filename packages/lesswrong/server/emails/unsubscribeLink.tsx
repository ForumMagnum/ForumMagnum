import React, { ReactNode } from "react";
import { emailTokenTypesByName } from "./emailTokens";
import { siteNameWithArticleSetting } from "@/lib/instanceSettings";
import { getSiteUrl } from "@/lib/vulcan-lib/utils";

export const createUnsubscribeAllNode = async (
  user: DbUser | null,
): Promise<ReactNode> => {
  if (!user) {
    return null;
  }
  const link = await emailTokenTypesByName.unsubscribeAll.generateLink(user._id);
  return (
    <>
      <a href={link}>Unsubscribe</a>{' '}
      (from all emails from {siteNameWithArticleSetting.get()})
      or <a href={`${getSiteUrl()}account`}>Change your notifications settings</a>
    </>
  );
}

export const createUnsubscribeMarketingNode = async (
  user: DbUser | null,
): Promise<ReactNode> => {
  if (!user) {
    return null;
  }
  const link = await emailTokenTypesByName.unsubscribeMarketing.generateLink(user._id);
  return (
    <>
      <a href={link}>Unsubscribe</a>{' '}
      from marketing emails from {siteNameWithArticleSetting.get()},
      or <a href={`${getSiteUrl()}account`}>change your email preferences</a>.
    </>
  );
}
