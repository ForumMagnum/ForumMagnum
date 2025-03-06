import React from 'react';
import { Components, registerComponent } from '@/lib/vulcan-lib/components';
import { FieldsNotNull, filterWhereFieldsNotNull } from '@/lib/utils/typeGuardUtils';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { DocumentContributorWithStats, DocumentContributorsInfo } from '@/lib/arbital/useTagLenses';
import UsersNameDisplay from "@/components/users/UsersNameDisplay";
import LWTooltip from "@/components/common/LWTooltip";

const styles = defineStyles("ContributorsList", (theme: ThemeType) => ({
  contributorNameWrapper: {
    flex: 1,
    [theme.breakpoints.down('sm')]: {
      fontSize: '15px',
    },
  },
  contributorName: {
    fontWeight: 550,
  },
  tocContributors: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    marginBottom: 12
  },
  tocContributor: {
    marginLeft: 16,
    fontFamily: theme.palette.fonts.sansSerifStack,
    color: theme.palette.greyAlpha(0.5),
  },
}))

type NonnullDocumentContributorWithStats = FieldsNotNull<DocumentContributorWithStats, 'user'>

export function useDisplayedContributors(contributorsInfo: DocumentContributorsInfo | null) {
  const contributors = filterWhereFieldsNotNull(contributorsInfo?.contributors ?? [], 'user');
  if (!contributors.some(({ currentAttributionCharCount }) => currentAttributionCharCount)) {
    return { topContributors: contributors, smallContributors: [] };
  }

  const totalAttributionChars = contributors.reduce((acc: number, contributor: DocumentContributorWithStats) => acc + (contributor.currentAttributionCharCount ?? 0), 0);

  if (totalAttributionChars === 0) {
    return { topContributors: contributors, smallContributors: [] };
  }

  const sortedContributors = [...contributors].sort((a, b) => (b.currentAttributionCharCount ?? 0) - (a.currentAttributionCharCount ?? 0));
  const initialTopContributors = sortedContributors.filter(({ currentAttributionCharCount }) => ((currentAttributionCharCount ?? 0) / totalAttributionChars) > 0.1);
  const topContributors = initialTopContributors.length <= 3 
    ? sortedContributors.filter(({ currentAttributionCharCount }) => ((currentAttributionCharCount ?? 0) / totalAttributionChars) > 0.05)
    : initialTopContributors;
  const smallContributors = sortedContributors.filter(contributor => !topContributors.includes(contributor));

  return { topContributors, smallContributors };
}

const ContributorsList = ({ contributors, onHoverContributor, endWithComma }: {
  contributors: NonnullDocumentContributorWithStats[],
  onHoverContributor: (userId: string|null) => void,
  endWithComma: boolean
}) => {
  const classes = useStyles(styles);

  return <>{contributors.map(({ user }, idx) => (<span key={user._id} onMouseOver={() => onHoverContributor(user._id)} onMouseOut={() => onHoverContributor(null)}>
    <UsersNameDisplay user={user} tooltipPlacement="top" className={classes.contributorName} />
    {endWithComma || idx < contributors.length - 1 ? ', ' : ''}
  </span>))}</>;
}

const ToCContributorsList = ({topContributors, onHoverContributor}: {
  topContributors: NonnullDocumentContributorWithStats[]
  onHoverContributor: (userId: string|null) => void
}) => {
  const classes = useStyles(styles);

  return <div className={classes.tocContributors}>
    {topContributors.map(({ user }: { user: UsersMinimumInfo }, idx: number) => (
      <span className={classes.tocContributor} key={user._id} onMouseOver={() => onHoverContributor(user._id)} onMouseOut={() => onHoverContributor(null)}>
        <UsersNameDisplay key={user._id} user={user} className={classes.contributorName} />
      </span>
    ))}
  </div>;
}

const HeadingContributorsList = ({topContributors, smallContributors, onHoverContributor}: {
  topContributors: NonnullDocumentContributorWithStats[]
  smallContributors: NonnullDocumentContributorWithStats[]
  onHoverContributor: (userId: string|null) => void
}) => {
  const classes = useStyles(styles);
  return <div className={classes.contributorNameWrapper}>
    <span>Written by </span>
    <ContributorsList
      contributors={topContributors}
      onHoverContributor={onHoverContributor}
      endWithComma={smallContributors.length > 0}
    />
    {smallContributors.length > 0 && <LWTooltip
      title={<ContributorsList contributors={smallContributors} onHoverContributor={onHoverContributor} endWithComma={false} />}
      clickable
      placement="top"
    >
      et al.
    </LWTooltip>}
  </div>
}

const ContributorsListComponent = registerComponent('ContributorsList', ContributorsList);
const ToCContributorsListComponent = registerComponent('ToCContributorsList', ToCContributorsList);
const HeadingContributorsListComponent = registerComponent('HeadingContributorsList', HeadingContributorsList);

declare global {
  interface ComponentTypes {
    ContributorsList: typeof ContributorsListComponent
    ToCContributorsList: typeof ToCContributorsListComponent
    HeadingContributorsList: typeof HeadingContributorsListComponent
  }
}

export {
  ContributorsListComponent as ContributorsList,
  ToCContributorsListComponent as ToCContributorsList,
  HeadingContributorsListComponent as HeadingContributorsList
}

