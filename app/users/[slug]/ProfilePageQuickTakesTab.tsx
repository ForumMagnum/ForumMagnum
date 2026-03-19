import { defineStyles, useStyles } from "@/components/hooks/useStyles";
import { profileStyles, TabPanel } from "./profileStyles";
import { UltraFeedContextProvider } from "@/components/ultraFeed/UltraFeedContextProvider";
import { UltraFeedObserverProvider } from "@/components/ultraFeed/UltraFeedObserver";
import { OverflowNavObserverProvider } from "@/components/ultraFeed/OverflowNavObserverContext";
import QuickTakesListItem from "@/components/quickTakes/QuickTakesListItem";
import LoadMore from "@/components/common/LoadMore";
import Loading from "@/components/vulcan-core/Loading";
import { useQueryWithLoadMore } from "@/components/hooks/useQueryWithLoadMore";
import { gql } from "@/lib/generated/gql-codegen";
import { z } from "zod";

const ProfilePageQuickTakesTabQuery = gql(`
  query ProfilePageQuickTakesTab($selector: CommentSelector, $limit: Int, $enableTotal: Boolean) {
    comments(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...FrontpageShortformComments
      }
      totalCount
    }
  }
`);

const profilePageQuickTakesTabUnsharedStyles = defineStyles("ProfilePageQuickTakesTabUnshared", (theme) => ({
  tabPanel: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    animation: "$slideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
    "@media (max-width: 630px)": {
      order: 1,
    },
  },
  quickTakesList: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  quickTakeItem: {
    border: theme.palette.border.commentBorder,
  },
}));

export const profilePageQuickTakesTabSettingsSchema = z.object({});
export type ProfilePageQuickTakesTabSettings = z.infer<typeof profilePageQuickTakesTabSettingsSchema>;

export const defaultProfilePageQuickTakesTabSettings: ProfilePageQuickTakesTabSettings = {};

export function ProfilePageQuickTakesTabSettingsForm({
  settings,
  onChange,
}: {
  settings: ProfilePageQuickTakesTabSettings,
  onChange: (settings: ProfilePageQuickTakesTabSettings) => void,
}) {
  void settings;
  void onChange;
  return null;
}

export function ProfilePageQuickTakesTabContents({user, settings}: {
  user: UsersProfile,
  settings: ProfilePageQuickTakesTabSettings,
}) {
  const sharedClasses = useStyles(profileStyles);
  const classes = useStyles(profilePageQuickTakesTabUnsharedStyles);
  const {data, loading, loadMoreProps} = useQueryWithLoadMore(ProfilePageQuickTakesTabQuery, {
    variables: {
      selector: {shortform: {userId: user._id}},
      limit: 20,
      enableTotal: true,
    },
    fetchPolicy: "cache-and-network",
  });
  const quickTakes = data?.comments?.results;

  return (
    <TabPanel>
      <UltraFeedContextProvider openInNewTab={true}>
        <UltraFeedObserverProvider incognitoMode={false}>
          <OverflowNavObserverProvider>
            <div className={sharedClasses.profileFeedTopMargin}>
              <div className={classes.quickTakesList}>
                {quickTakes?.map((quickTake: FrontpageShortformComments) => (
                  <div key={quickTake._id} className={classes.quickTakeItem}>
                    <QuickTakesListItem key={quickTake._id} quickTake={quickTake} linesToDisplay={3} />
                  </div>
                ))}
                {loading && <Loading />}
                {!loadMoreProps.hidden && <LoadMore {...loadMoreProps} />}
              </div>
            </div>
          </OverflowNavObserverProvider>
        </UltraFeedObserverProvider>
      </UltraFeedContextProvider>
    </TabPanel>
  );
}
