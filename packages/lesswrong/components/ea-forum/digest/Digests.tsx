import React, { Fragment } from 'react';
import { registerComponent } from '../../../lib/vulcan-lib/components';
import { Link } from '../../../lib/reactRouterWrapper';
import { useCurrentUser } from '../../common/withUser';
import { userIsAdmin } from '../../../lib/vulcan-users/permissions';
import { getDigestInfo } from '../../../lib/collections/digests/helpers';
import Error404 from "../../common/Error404";
import SectionTitle from "../../common/SectionTitle";
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/crud/wrapGql";

const DigestsMinimumInfoMultiQuery = gql(`
  query multiDigestDigestsQuery($selector: DigestSelector, $limit: Int, $enableTotal: Boolean) {
    digests(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...DigestsMinimumInfo
      }
      totalCount
    }
  }
`);

const styles = (theme: ThemeType) => ({
  root: {
    maxWidth: 1200,
    margin: '10px auto'
  },
  digests: {
    display: 'grid',
    gridTemplateColumns: '200px 50px 14px 50px',
    alignItems: 'center',
    gap: '10px 1px',
    fontFamily: theme.typography.fontFamily,
  },
  link: {
    color: theme.palette.primary.main,
    fontSize: 16,
    lineHeight: '22px',
    fontWeight: 600,
  }
})

const Digests = ({classes}: {classes: ClassesType<typeof styles>}) => {
  const currentUser = useCurrentUser()
  const { data } = useQuery(DigestsMinimumInfoMultiQuery, {
    variables: {
      selector: { all: {} },
      limit: 100,
      enableTotal: false,
    },
    skip: !userIsAdmin(currentUser),
    notifyOnNetworkStatusChange: true,
  });

  const results = data?.digests?.results;
  if (!userIsAdmin(currentUser)) {
    return <Error404 />
  }
  
  if (!results) return null

  return (
    <div className={classes.root}>
      <SectionTitle
        title="Digests"
        noTopMargin
      />
      
      <div className={classes.digests}>
        {results.map(digest => {
          const data = getDigestInfo(digest)
          return <Fragment key={digest._id}>
            <div>
              <Link to={`/admin/digests/${digest.num}`} className={classes.link}>
                {data.name}
              </Link>
            </div>
            <div>{data.start}</div>
            <div>-</div>
            <div>{data.end}</div>
          </Fragment>
        })}
      </div>
    </div>
  )
}

export default registerComponent('Digests', Digests, {styles});


