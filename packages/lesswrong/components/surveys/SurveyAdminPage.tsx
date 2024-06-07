import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { useCurrentUser } from "../common/withUser";
import { useMulti } from "@/lib/crud/withMulti";

const styles = (theme: ThemeType) => ({
  root: {
    fontFamily: theme.palette.fonts.sansSerifStack,
  },
});

const SurveyEditor = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {results: surveys, loading} = useMulti({
    collectionName: "Surveys",
    fragmentName: "SurveyMinimumInfo",
    terms: {
      view: "surveysByCreatedAt",
    },
  });

  const {
    SingleColumnSection, SectionTitle, Loading, EAButton, FormatDate,
  } = Components;
  return (
    <SingleColumnSection className={classes.root}>
      <SectionTitle title="Surveys" />
      {surveys?.map((s) =>
        <div key={s._id}>
          {s.name} (<FormatDate date={s.createdAt} />)
        </div>
      )}
      {loading && <Loading />}
      <EAButton href="/newSurvey">New survey</EAButton>
    </SingleColumnSection>
  );
}

const SurveyAdminPage = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser();
  return currentUser?.isAdmin
    ? <SurveyEditor classes={classes} />
    : <Components.Error404 />;
}

const SurveyAdminPageComponent = registerComponent(
  "SurveyAdminPage",
  SurveyAdminPage,
  {styles},
);

declare global {
  interface ComponentTypes {
    SurveyAdminPage: typeof SurveyAdminPageComponent
  }
}
