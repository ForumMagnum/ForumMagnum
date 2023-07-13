import React from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import { useMulti } from '../../../lib/crud/withMulti';
import { Link } from '../../../lib/reactRouterWrapper';
import { useCurrentUser } from '../../common/withUser';
import { userIsAdmin } from '../../../lib/vulcan-users/permissions';
import { getDigestName } from '../../../lib/collections/digests/helpers';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    maxWidth: 1200,
    margin: '10px auto'
  },
  link: {
    color: theme.palette.primary.main,
    fontFamily: theme.typography.fontFamily,
    fontSize: 16,
    lineHeight: '22px'
  }
})

const Digests = ({classes}:{classes: ClassesType}) => {
  const currentUser = useCurrentUser()
  const { results } = useMulti({
    terms: {
      view: "all"
    },
    collectionName: "Digests",
    fragmentName: 'DigestsMinimumInfo',
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
        
      {results.map(digest => {
        return <div key={digest._id}>
          <Link to={`/admin/digests/${digest.num}`} className={classes.link}>
            {getDigestName({digest})}
          </Link>
        </div>
      })}
    </div>
  )
}

const DigestsComponent = registerComponent('Digests', Digests, {styles});

declare global {
  interface ComponentTypes {
    Digests: typeof DigestsComponent
  }
}
