import React, { useCallback, useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import { useCurrentUser } from '../common/withUser';
import { userCanComment } from '../../lib/vulcan-users/permissions';
import { isFriendlyUI } from '../../themes/forumTheme';
import classNames from 'classnames';
import { useTracking } from '../../lib/analyticsEvents';


const styles = (theme: ThemeType): JssStyles => ({
  shortformItem: {
    //marginTop: theme.spacing.unit * (isFriendlyUI ? 2 : 4),
  },

})


const ShortformThreadListHomepage = ({ classes, maxAgeDays=30, className }: {
  classes: ClassesType,
  maxAgeDays?: number,
  className?: string,
}) => {

  const currentUser = useCurrentUser();

  const {
    results,
    loading,
    showLoadMore,
    loadMoreProps, 
    refetch
  } = useMulti({
    terms: {
      view: "shortformFrontpage",
      limit: 3,
      maxAgeDays,
    },
    collectionName: "Comments",
    fragmentName: "ShortformComments",
    itemsPerPage: 5,
  });

  const {Loading, SectionFooter, LoadMore, ShortformSubmitForm, ShortformListItem} = Components;
  return (<>
    {userCanComment(currentUser) && <ShortformSubmitForm successCallback={refetch} />}
    <div className={className}>
      {results?.map((comment) =>
        <ShortformListItem comment={comment} key={comment._id} />
      )}
      <SectionFooter>
        <LoadMore {...loadMoreProps} sectionFooterStyles/>
      </SectionFooter>    
    </div>
  </>
  );
}

const ShortformThreadListHomepageComponent = registerComponent('ShortformThreadListHomepage', ShortformThreadListHomepage, {styles});

declare global {
  interface ComponentTypes {
    ShortformThreadListHomepage: typeof ShortformThreadListHomepageComponent
  }
}
