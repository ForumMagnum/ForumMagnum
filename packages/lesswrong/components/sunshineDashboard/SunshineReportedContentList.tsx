import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useUpdate } from '../../lib/crud/withUpdate';
import { useMulti } from '../../lib/crud/withMulti';
import React from 'react';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    backgroundColor: "rgba(60,0,0,.08)"
  }
})

const SunshineReportedContentList = ({ terms, classes }: {
  terms: ReportsViewTerms,
  classes: ClassesType,
}) => {
  const { SunshineListTitle, SunshineReportedItem, SunshineListCount } = Components
  
  const { results, totalCount } = useMulti({
    terms,
    collectionName: "Reports",
    fragmentName: 'unclaimedReportsList',
    enableTotal: true,
  });
  const { mutate: updateReport } = useUpdate({
    collectionName: "Reports",
    fragmentName: 'unclaimedReportsList',
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
              updateReport={updateReport}
            />
          </div>
        )}
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

