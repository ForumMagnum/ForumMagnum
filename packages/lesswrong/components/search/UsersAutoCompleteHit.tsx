import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import MetaInfo from "../common/MetaInfo";
import FormatDate from "../common/FormatDate";
import Loading from "../vulcan-core/Loading";

const styles = (theme: ThemeType) => ({
  root: {
    cursor: "pointer"
  }
});

const UsersAutoCompleteHit = ({document, classes}: {
  document: SearchUser
  classes: ClassesType<typeof styles>
}) => {
  if (document) {
    return <div className={classes.root}>
      <MetaInfo>
        {document.displayName}
      </MetaInfo>
      <MetaInfo>
        {document.karma} karma
      </MetaInfo>
      <MetaInfo>
        <FormatDate date={document.createdAt}/>
      </MetaInfo>
    </div>
  } else {
    return <Loading />
  }
};

export default registerComponent('UsersAutoCompleteHit', UsersAutoCompleteHit, {styles});



