import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useUpdate } from '../../lib/crud/withUpdate';
import { useMulti } from '../../lib/crud/withMulti';
import React from 'react';
import SunshineListTitle from "@/components/sunshineDashboard/SunshineListTitle";
import SunshineReportedItem from "@/components/sunshineDashboard/SunshineReportedItem";
import SunshineListCount from "@/components/sunshineDashboard/SunshineListCount";
import LoadMore from "@/components/common/LoadMore";

const styles = (theme: ThemeType) => ({
  root: {
    backgroundColor: theme.palette.panelBackground.sunshineReportedContent,
  }
})

const SunshineReportedContentList = ({ classes, currentUser }: {
  classes: ClassesType<typeof styles>,
  currentUser: UsersCurrent,
}) => {
  const { results, totalCount, loadMoreProps, refetch } = useMulti({
    terms: {view:"sunshineSidebarReports", limit: 30},
    collectionName: "Reports",
    fragmentName: 'UnclaimedReportsList',
    enableTotal: true,
  });
  const { mutate: updateReport } = useUpdate({
    collectionName: "Reports",
    fragmentName: 'UnclaimedReportsList',
  });
  
  if (results && results.length) {
    return (
      <div className={classes.root}>
        <SunshineListTitle>
          Flagged Content <SunshineListCount count={totalCount} />
        </SunshineListTitle>
        {results.map(report =>
          <div key={report._id} >
            <SunshineReportedItem
              report={report}
              currentUser={currentUser}
              updateReport={updateReport}
              refetch={refetch}
            />
          </div>
        )}
        <LoadMore {...loadMoreProps} />
      </div>
    )
  } else {
    return null
  }
}

const SunshineReportedContentListComponent = registerComponent('SunshineReportedContentList', SunshineReportedContentList, {styles});

declare global {
  interface ComponentTypes {
    SunshineReportedContentList: typeof SunshineReportedContentListComponent
  }
}

export default SunshineReportedContentListComponent;

