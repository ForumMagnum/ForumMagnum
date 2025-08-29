import React from 'react';
import { useCurrentUser } from '../common/withUser';
import SingleColumnSection from '../common/SingleColumnSection';
import SectionTitle from '../common/SectionTitle';
import { MixedTypeFeed } from '../common/MixedTypeFeed';
import { UltraFeedSubscriptionsQuery } from '../common/feeds/feedQueries';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { createUltraFeedRenderers } from './renderers/createUltraFeedRenderers';
import { useUltraFeedSettings } from '../hooks/useUltraFeedSettings';

const styles = defineStyles('UltraFeedSubscriptionsFeed', (theme: ThemeType) => ({
  titleText: {},
}));

const UltraFeedSubscriptionsFeed = ({ embedded = false }: { embedded?: boolean }) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const { settings } = useUltraFeedSettings();

  if (!currentUser) return null;

  const { feedCommentThread, feedPost, feedSubscriptionSuggestions } = createUltraFeedRenderers({ settings });

  const content = (
    <MixedTypeFeed
      query={UltraFeedSubscriptionsQuery}
      variables={{}}
      firstPageSize={20}
      pageSize={30}
      fetchPolicy="network-only"
      renderers={{
        feedCommentThread,
        feedPost,
        feedSubscriptionSuggestions,
      }}
    />
  );

  if (embedded) return content;

  return (
    <SingleColumnSection>
      <SectionTitle title="Following" titleClassName={classes.titleText} />
      {content}
    </SingleColumnSection>
  );
};

export default UltraFeedSubscriptionsFeed;

