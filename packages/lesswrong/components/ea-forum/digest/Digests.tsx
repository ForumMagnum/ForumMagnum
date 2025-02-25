import React, { Fragment } from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib/components';
import { useMulti } from '../../../lib/crud/withMulti';
import { Link } from '../../../lib/reactRouterWrapper';
import { useCurrentUser } from '../../common/withUser';
import { userIsAdmin } from '../../../lib/vulcan-users/permissions';
import { getDigestInfo } from '../../../lib/collections/digests/helpers';

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
  const { results } = useMulti({
    terms: {
      view: "all"
    },
    collectionName: "Digests",
    fragmentName: 'DigestsMinimumInfo',
    limit: 100,
    skip: !userIsAdmin(currentUser)
  })
  
  const { Error404, SectionTitle } = Components
  
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

const DigestsComponent = registerComponent('Digests', Digests, {styles});

declare global {
  interface ComponentTypes {
    Digests: typeof DigestsComponent
  }
}
