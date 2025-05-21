import { registerComponent } from '../../lib/vulcan-lib/components';
import { useMulti } from '../../lib/crud/withMulti';
import React from 'react';
import SunshineListTitle from "./SunshineListTitle";
import SunshineReportedItem from "./SunshineReportedItem";
import SunshineListCount from "./SunshineListCount";
import LoadMore from "../common/LoadMore";
import { useMutation } from "@apollo/client";
import { gql } from "@/lib/generated/gql-codegen/gql";

const UnclaimedReportsListUpdateMutation = gql(`
  mutation updateReportSunshineReportedContentList($selector: SelectorInput!, $data: UpdateReportDataInput!) {
    updateReport(selector: $selector, data: $data) {
      data {
        ...UnclaimedReportsList
      }
    }
  }
`);

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
  const [updateReport] = useMutation(UnclaimedReportsListUpdateMutation);
  
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

export default registerComponent('SunshineReportedContentList', SunshineReportedContentList, {styles});



