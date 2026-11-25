import React, { useRef } from "react";
import Transition from "react-transition-group/Transition";
import SectionTitle, { SectionTitleProps } from "./SectionTitle";
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { Link } from "../../lib/reactRouterWrapper";
import classNames from "classnames";
import SingleColumnSection from "./SingleColumnSection";
import LWTooltip from "./LWTooltip";
import ForumIcon from "./ForumIcon";
import { defineStyles } from "../hooks/defineStyles";
import { useStyles } from "../hooks/useStyles";

const styles = defineStyles("ExpandableSection", (theme: ThemeType) => ({
  title: {
    display: "flex",
    columnGap: 10,
    color: theme.palette.text.bannerAdOverlay,
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
  // The tooltip wrapper is as tall as the title's line, which is what lets the
  // button align with the text. Only the button should respond to the mouse.
  expandTooltip: {
    pointerEvents: "none",
  },
  expandButton: {
    display: "inline-flex",
    verticalAlign: "middle",
    padding: 6,
    margin: -6,
    border: "none",
    background: "none",
    color: "inherit",
    cursor: "pointer",
    pointerEvents: "auto",
    "&:hover": {
      color: theme.palette.grey[800],
    }
  },
  expandIcon: {
    transform: "translateY(-1px)",
    fontSize: 16,
    transition: "transform 0.2s ease-in-out",
    "@media (prefers-reduced-motion: reduce)": {
      transition: "none",
    },
  },
  chevronExpanded: {
    transform: "rotate(90deg)",
  },
  content: {
    display: "grid",
    gridTemplateRows: "0fr",
    transition: "grid-template-rows 200ms ease-in-out",
    "@media (prefers-reduced-motion: reduce)": {
      transition: "none",
    },
  },
  contentExpanded: {
    gridTemplateRows: "1fr",
  },
  contentInner: {
    minHeight: 0,
    overflow: "hidden",
  },
}));

type ExpandableSectionProps = Exclude<SectionTitleProps, "children"> & {
  pageSectionContext: string,
  expanded: boolean,
  toggleExpanded: () => void,
  afterTitleText?: string,
  afterTitleTo?: string,
  afterTitle?: React.ReactNode,
  children: React.ReactNode,
}

const ExpandableSection = ({
  pageSectionContext,
  expanded,
  toggleExpanded,
  title,
  afterTitleText = "View more",
  afterTitleTo,
  afterTitle,
  children,
  ...sectionTitleProps
}: ExpandableSectionProps) => {
  const classes = useStyles(styles);
  const contentRef = useRef<HTMLDivElement>(null);
  const expandLabel = expanded ? "Collapse" : "Expand";

  return (
    <AnalyticsContext pageSectionContext={pageSectionContext}>
      <SingleColumnSection>
        <SectionTitle
          {...sectionTitleProps}
          title={
            <div className={classes.title}>
              {title}
              <LWTooltip
                title={expandLabel}
                hideOnTouchScreens
                className={classes.expandTooltip}
              >
                <button
                  type="button"
                  aria-label={expandLabel}
                  aria-expanded={expanded}
                  onClick={toggleExpanded}
                  className={classes.expandButton}
                >
                  <ForumIcon
                    icon="ThickChevronRight"
                    className={classNames(classes.expandIcon, {
                      [classes.chevronExpanded]: expanded,
                    })}
                  />
                </button>
              </LWTooltip>
            </div>
          }
        >
          {expanded && (afterTitle || afterTitleTo) &&
            <div className={classes.afterContainer}>
              {afterTitle}
              {afterTitleTo &&
                <Link to={afterTitleTo}>
                  {afterTitleText}
                </Link>
              }
            </div>
          }
        </SectionTitle>
        <Transition
          nodeRef={contentRef}
          in={expanded}
          timeout={200}
          mountOnEnter
          unmountOnExit
          onEnter={() => {
            // Establish the collapsed layout before transitioning newly mounted content.
            contentRef.current?.getBoundingClientRect();
          }}
        >
          {state => <div
            ref={contentRef}
            className={classNames(classes.content, {
              [classes.contentExpanded]: state === 'entering' || state === 'entered',
            })}
            inert={!expanded}
          >
            <div className={classes.contentInner}>{children}</div>
          </div>}
        </Transition>
      </SingleColumnSection>
    </AnalyticsContext>
  );
}

export default ExpandableSection;
