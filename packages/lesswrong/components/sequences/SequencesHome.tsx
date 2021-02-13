import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { legacyBreakpoints } from '../../lib/utils/theme';
import { postBodyStyles } from '../../themes/stylePiping';
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { forumTypeSetting } from '../../lib/instanceSettings';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
  },
  header: {
    marginTop: theme.spacing.unit*3,
    marginBottom: 50,
    [legacyBreakpoints.maxTiny]: {
      paddingLeft: 0,
    }
  },
  library: {
    ...theme.typography.headerStyle,
    fontWeight: 600,
  },
  listTitle: {
    fontWeight: "bold",
    textTransform: "uppercase",

    "& h1": {
      marginTop: 7,
    }
  },
  listDescription: {
    marginTop: theme.spacing.unit*2,
    ...postBodyStyles(theme)
  }
});

const SequencesHome = ({classes}: {
  classes: ClassesType,
}) => {
  const { SingleColumnSection, SectionTitle, Divider, SequencesNewButton } = Components
  // TODO: decide on terms for community sequences
  return <React.Fragment>
    <AnalyticsContext pageContext="sequencesHome">

      {forumTypeSetting.get() === 'LessWrong' && <SingleColumnSection>
        <SectionTitle title="Core Reading" />
        <Components.CoreReading />
      </SingleColumnSection>}
      <Divider />
      <SingleColumnSection>
        <SectionTitle title="Curated Sequences" />
        <div className={classes.sequencesGridWrapperWrapper}>
          <Components.SequencesGridWrapper
            terms={{'view':'curatedSequences', limit:100}}
            itemsPerPage={24}
            showAuthor={true}
            showLoadMore={true}
          />
        </div>
      </SingleColumnSection>
      <Divider />
      <SingleColumnSection>
        <SectionTitle  title="Community Sequences" >
          <SequencesNewButton />
        </SectionTitle>
        <div className={classes.sequencesGridWrapperWrapper}>
          <Components.SequencesGridWrapper
            terms={{'view':'communitySequences', limit:12}}
            itemsPerPage={24}
            showAuthor={true}
            showLoadMore={true}
          />
        </div>
      </SingleColumnSection>
    </AnalyticsContext>
  </React.Fragment>;
};

const SequencesHomeComponent = registerComponent('SequencesHome', SequencesHome, {styles});

declare global {
  interface ComponentTypes {
    SequencesHome: typeof SequencesHomeComponent
  }
}

