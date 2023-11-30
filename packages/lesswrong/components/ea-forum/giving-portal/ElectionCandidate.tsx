import React from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { Link } from "../../../lib/reactRouterWrapper";
import { useVote } from "../../votes/withVote";
import { getVotingSystemByName } from "../../../lib/voting/votingSystems";
import { donationElectionTagId } from "../../../lib/eaGivingSeason";
import classNames from "classnames";
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import Checkbox from "@material-ui/core/Checkbox";
import { requireCssVar } from "../../../themes/cssVars";

export const imageSize = 52;

const styles = (theme: ThemeType) => ({
  root: {
    position: "relative",
    backgroundColor: theme.palette.givingPortal.candidate,
    borderRadius: theme.borderRadius.default,
    padding: 8,
    fontFamily: theme.palette.fonts.sansSerifStack,
    color: theme.palette.givingPortal[1000],
    display: "flex",
    alignItems: 'center',
    gap: "16px",
    width: 360,
    maxWidth: "100%",
    minHeight: 68,
  },
  rootVoted: {
    backgroundColor: theme.palette.givingPortal.votedCandidate,
  },
  rootSelected: {
    backgroundColor: theme.palette.givingPortal.selectedCandidate,
  },
  imageContainer: {
    borderRadius: theme.borderRadius.small,
    backgroundColor: theme.palette.grey[0],
    width: imageSize,
    height: imageSize,
  },
  image: {
    borderRadius: theme.borderRadius.small,
    objectFit: "cover",
    width: imageSize,
    height: imageSize,
  },
  details: {
    flexGrow: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: "2px",
    paddingRight: 24
  },
  heartIcon: {
    fontSize: 14,
    transform: "translateY(2px)",
    marginRight: 4,
  },
  preVoteButton: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  name: {
    fontWeight: 600,
    fontSize: 16,
    letterSpacing: "-0.16px",
    position: "relative",
    overflow: "hidden",
    display: "-webkit-box",
    "-webkit-box-orient": "vertical",
    "-webkit-line-clamp": 2,
  },
  metaInfo: {
    fontWeight: 500,
    fontSize: 14,
    letterSpacing: "-0.14px",
  },
  checkbox: {
    padding: 6,
    marginRight: -12
  },
  preVotes: {
    opacity: 0.8,
  },
  postCount: {
    opacity: 0.8,
    textDecoration: "none",
    "&:hover": {
      opacity: 1,
      textDecoration: "underline",
    },
  },
  descriptionTooltip: {
    maxWidth: 320,
    marginTop: 8,
    textAlign: "left",
    borderRadius: `${theme.borderRadius.default}px !important`,
    backgroundColor: `${theme.palette.grey[900]} !important}`,
    display: "-webkit-box",
    "-webkit-box-orient": "vertical",
    "-webkit-line-clamp": 12, // Just stop it from really overflowing
  },
  hoverUnderline: {
    '&:hover': {
      textUnderlineOffset: '3px',
      textDecoration: 'underline',
    }
  },
  tooltip: {
    maxWidth: 200,
    textAlign: "center",
    background: `${theme.palette.panelBackground.tooltipBackground2} !important}`,
    transform: "translateY(8px)",
  },
});

const ElectionCandidate = ({candidate, type="preVote", selected, onSelect, classes}: {
  candidate: ElectionCandidateBasicInfo,
  type?: "preVote" | "select",
  selected?: boolean,
  onSelect?: (candidateIds: string[]) => void,
  classes: ClassesType,
}) => {
  const isSelect = type === "select";

  const votingProps = useVote(
    candidate,
    "ElectionCandidates",
    getVotingSystemByName("eaDonationElection"),
  );

  const {
    name, logoSrc, fundraiserLink, href, postCount, tag, extendedScore, currentUserExtendedVote, description,
  } = votingProps.document;
  const preVoteCount = extendedScore?.preVoteCount ?? 0;
  const hasVoted = !!currentUserExtendedVote?.preVote;

  const preVoteCountString = `${preVoteCount} pre-vote${preVoteCount === 1 ? "" : "s"}`;
  const postCountString = `${postCount} post${postCount === 1 ? "" : "s"}`;
  const postsLink = `/search?query=&tags[0]=${donationElectionTagId}&tags[1]=${tag?._id}`;

  // We don't want to accidentally navigate away from the page if the user is selecting candidates
  const newTabProps = { target: "_blank", rel: "noopener noreferrer" };
  const linkProps = isSelect ? newTabProps : {};

  const linkUrl = isSelect ? href : fundraiserLink;

  const {PreVoteButton, ForumIcon, LWTooltip} = Components;
  return (
    <AnalyticsContext pageElementContext="electionCandidate">
      <div
        className={classNames(classes.root, {
          [classes.rootVoted]: !isSelect && hasVoted,
          [classes.rootSelected]: isSelect && selected,
        })}
      >
        {isSelect && (
          <Checkbox
            className={classes.checkbox}
            style={{ color: requireCssVar("palette", "givingPortal", 1000) }}
            checked={selected}
            onChange={() => onSelect?.([candidate._id])}
          />
        )}
        <div className={classes.imageContainer}>
          <Link to={linkUrl || ""} {...linkProps}>
            <img src={logoSrc} className={classes.image} />
          </Link>
        </div>
        <div className={classes.details}>
          <LWTooltip
            disabled={!isSelect}
            className={classes.name}
            title={description}
            placement="bottom"
            popperClassName={classes.descriptionTooltip}
          >
            <Link
              to={linkUrl || ""}
              className={classNames({
                [classes.hoverUnderline]: isSelect,
              })}
              {...linkProps}
            >
              {name}
            </Link>
          </LWTooltip>
          <div className={classes.metaInfo}>
            {!isSelect && (
              <span className={classes.preVotes}>
                <ForumIcon icon="HeartOutline" className={classes.heartIcon} />
                {preVoteCountString}
              </span>
            )}
            {!isSelect && tag && ", "}
            {tag && (
              <>
                <LWTooltip
                  title={`View ${postCountString} tagged “${tag.name}” and “Donation Election (2023)”`}
                  placement="bottom"
                  popperClassName={classes.tooltip}
                >
                  <a href={postsLink} className={classes.postCount} {...newTabProps}>
                    {postCountString}
                  </a>
                </LWTooltip>
              </>
            )}
          </div>
        </div>
        {!isSelect && <PreVoteButton {...votingProps} className={classes.preVoteButton} />}
      </div>
    </AnalyticsContext>
  );
}

const ElectionCandidateComponent = registerComponent(
  "ElectionCandidate",
  ElectionCandidate,
  {styles,},
);

declare global {
  interface ComponentTypes {
    ElectionCandidate: typeof ElectionCandidateComponent;
  }
}
