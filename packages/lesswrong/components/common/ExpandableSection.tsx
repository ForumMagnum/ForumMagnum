import React, { ComponentType } from "react";
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { SectionTitleProps } from "./SectionTitle";
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { Link } from "../../lib/reactRouterWrapper";

const styles = (theme: ThemeType) => ({
  title: {
    display: "flex",
    columnGap: 10
  },
  afterContainer: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    fontSize: 14,
    color: theme.palette.grey[600],
    fontWeight: 600,
    "& a:hover": {
      color: theme.palette.grey[1000],
      opacity: 1,
    },
    "@media (max-width: 350px)": {
      display: "none",
    },
  },
  expandIcon: {
    position: "relative",
    top: 3,
    fontSize: 16,
    cursor: "pointer",
    "&:hover": {
      color: theme.palette.grey[800],
    }
  },
});

type ExpandableSectionProps = Exclude<SectionTitleProps, "children"> & {
  pageSectionContext: string,
  expanded: boolean,
  toggleExpanded: () => void,
  afterTitleText?: string,
  afterTitleTo?: string,
  AfterTitleComponent?: ComponentType,
  Content: ComponentType,
}

const ExpandableSection = ({
  pageSectionContext,
  expanded,
  toggleExpanded,
  title,
  afterTitleText = "View more",
  afterTitleTo,
  AfterTitleComponent,
  Content,
  classes,
  ...sectionTitleProps
}: ExpandableSectionProps & {classes: ClassesType}) => {
  const {SingleColumnSection, SectionTitle, LWTooltip, ForumIcon} = Components;
  return (
    <AnalyticsContext pageSectionContext={pageSectionContext}>
      <SingleColumnSection>
        <SectionTitle
          {...sectionTitleProps}
          title={
            <div className={classes.title}>
              {title}
              <LWTooltip
                title={expanded ? "Collapse" : "Expand"}
                hideOnTouchScreens
              >
                <ForumIcon
                  icon={expanded ? "ThickChevronDown" : "ThickChevronRight"}
                  onClick={toggleExpanded}
                  className={classes.expandIcon}
                />
              </LWTooltip>
            </div>
          }
        >
          {expanded && (AfterTitleComponent || afterTitleTo) &&
            <div className={classes.afterContainer}>
              {AfterTitleComponent &&
                <AfterTitleComponent />
              }
              {afterTitleTo &&
                <Link to={afterTitleTo}>
                  {afterTitleText}
                </Link>
              }
            </div>
          }
        </SectionTitle>
        {expanded && <Content />}
      </SingleColumnSection>
    </AnalyticsContext>
  );
}

const ExpandableSectionComponent = registerComponent(
  "ExpandableSection",
  ExpandableSection,
  {styles},
);

declare global {
  interface ComponentTypes {
    ExpandableSection: typeof ExpandableSectionComponent
  }
}
