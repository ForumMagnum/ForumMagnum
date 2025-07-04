import React, { ComponentType } from "react";
import { registerComponent } from '../../lib/vulcan-lib/components';
import SectionTitle, { SectionTitleProps } from "./SectionTitle";
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { Link } from "../../lib/reactRouterWrapper";
import classNames from "classnames";
import SingleColumnSection from "./SingleColumnSection";
import LWTooltip from "./LWTooltip";
import ForumIcon from "./ForumIcon";

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
    verticalAlign: 'middle',
    transform: "translateY(-1px)",
    fontSize: 16,
    cursor: "pointer",
    transition: "transform 0.2s ease-in-out",
    "&:hover": {
      color: theme.palette.grey[800],
    }
  },
  chevronExpanded: {
    transform: "rotate(90deg)",
  },
});

type ExpandableSectionProps = Exclude<SectionTitleProps, "children"> & {
  pageSectionContext: string,
  expanded: boolean,
  toggleExpanded: () => void,
  afterTitleText?: string,
  afterTitleTo?: string,
  AfterTitleComponent?: ComponentType,
  children: React.ReactNode,
}

const ExpandableSection = ({
  pageSectionContext,
  expanded,
  toggleExpanded,
  title,
  afterTitleText = "View more",
  afterTitleTo,
  AfterTitleComponent,
  children,
  classes,
  ...sectionTitleProps
}: ExpandableSectionProps & {classes: ClassesType<typeof styles>}) => {
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
                  icon="ThickChevronRight"
                  onClick={toggleExpanded}
                  className={classNames(classes.expandIcon, {
                    [classes.chevronExpanded]: expanded,
                  })}
                />
              </LWTooltip>
            </div>
          }
          large
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
        {expanded && <>{children}</>}
      </SingleColumnSection>
    </AnalyticsContext>
  );
}

export default registerComponent(
  "ExpandableSection",
  ExpandableSection,
  {styles},
);


