import React from 'react';
import { Components, registerComponent } from '@/lib/vulcan-lib/components';
import { FieldsNotNull, filterWhereFieldsNotNull } from '@/lib/utils/typeGuardUtils';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { DocumentContributorWithStats, DocumentContributorsInfo } from '@/lib/arbital/useTagLenses';

const styles = defineStyles("ContributorsList", (theme: ThemeType) => ({
  contributorNameWrapper: {
    [theme.breakpoints.down('sm')]: {
      fontSize: '15px',
    },
  },
  contributorName: {
    fontWeight: 550,
  },
  tocContributors: {
    display: 'flex',
    flexDirection: 'row',
    gap: '4px',
    marginBottom: 12,
    marginLeft: 16,
  },
  tocContributor: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    color: theme.palette.greyAlpha(0.5),
    fontWeight: 550,
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
  const { UsersNameDisplay } = Components;
  const classes = useStyles(styles);

  return <>{contributors.map(({ user }, idx) => (<span key={user._id} onMouseOver={() => onHoverContributor(user._id)} onMouseOut={() => onHoverContributor(null)}>
    <UsersNameDisplay user={user} tooltipPlacement="top" className={classes.contributorName} />
    {endWithComma || idx < contributors.length - 1 ? ', ' : ''}
  </span>))}</>;
}

function ToCContributorsList({
  contributors,
  onHoverContributor,
}: {
  contributors: NonnullDocumentContributorWithStats[]
  onHoverContributor: (userId: string | null) => void
}) {
  const { LWTooltip, UsersNameDisplay } = Components;
  const classes = useStyles(styles);

  const displayedContributors = contributors.slice(0, 2);
  const hiddenContributors = contributors.slice(2);

  return (
    <div className={classes.tocContributors}>
      {displayedContributors.map(({ user }, idx) => (
        <span key={user._id} className={classes.tocContributor} onMouseOver={() => onHoverContributor(user._id)} onMouseOut={() => onHoverContributor(null)}>
          <UsersNameDisplay user={user} className={classes.contributorName} />
          {(idx < displayedContributors.length - 1) || (idx === displayedContributors.length - 1 && hiddenContributors.length > 0) ? ', ' : ''}
        </span>
      ))}
      {hiddenContributors.length > 0 && (
        <LWTooltip
          title={hiddenContributors.map((c, i) => (
            <span key={c.user._id}>
              <UsersNameDisplay user={c.user} className={classes.contributorName} />
              {i < hiddenContributors.length - 1 ? ', ' : ''}
            </span>
          ))}
          clickable
          placement="top"
        >
          <span className={classes.tocContributor}>et al.</span>
        </LWTooltip>
      )}
    </div>
  );
}

const HeadingContributorsList = ({topContributors, smallContributors, onHoverContributor}: {
  topContributors: NonnullDocumentContributorWithStats[]
  smallContributors: NonnullDocumentContributorWithStats[]
  onHoverContributor: (userId: string|null) => void
}) => {
  const classes = useStyles(styles);
  const { LWTooltip } = Components;

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
      et al.&nbsp;
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

