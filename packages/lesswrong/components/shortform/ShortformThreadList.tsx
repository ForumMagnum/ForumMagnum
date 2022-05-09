import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import classNames from 'classnames';

const styles = (theme: ThemeType): JssStyles => ({
  shortformItem: {
    marginTop: theme.spacing.unit*4
  },
  root: {
    position:"absolute",
    top:0,
    left:0,
    width: "100%"
  },
  background: {
    top:0,
    left:0,
    position:"sticky",
    background: theme.palette.background.default,
    width: "100%",
    height: "100vh",
    opacity: 0,
    transition: ".5s",
    zIndex: 5,
    pointerEvents: "none"
  },
  visible: {
    opacity: .92,
    pointerEvents: "unset"
  },
  form: {
    zIndex: 10,
    position: "relative"
  },
  column: {
    maxWidth:680,
    margin:"auto"
  }
})

const ShortformThreadList = ({ classes }: {
  classes: ClassesType,
}) => {
  const { LoadMore, CommentWithReplies, ShortformSubmitForm, SectionTitle } = Components
  const { results, loadMoreProps, refetch } = useMulti({
    terms: {
      view: 'shortform',
      limit:20
    },
    collectionName: "Comments",
    fragmentName: 'CommentWithRepliesFragment',
    fetchPolicy: 'cache-and-network',
    enableTotal: false,
    pollInterval: 0,
  });

  const [writing, setWriting] = useState(false)

  return (
    <div className={classes.root}>
      <div className={classNames(classes.background, {[classes.visible]:writing})} onClick={() => setWriting(false)}/>
      <div className={classes.column}>
        <div className={classes.form} onClick={() => setWriting(true)}>
          <SectionTitle title="Shortform"/>
          <ShortformSubmitForm successCallback={refetch}/>
        </div>
        <div>
          {results && results.map((comment, i) => {
            if (!comment.post) return null
            return <div key={comment._id} className={classes.shortformItem}>
              <CommentWithReplies comment={comment} post={comment.post} refetch={refetch}/>
            </div>
          })}
        </div>
        <LoadMore {...loadMoreProps} />
      </div>
    </div>
  )
}

const ShortformThreadListComponent = registerComponent('ShortformThreadList', ShortformThreadList, {styles});

declare global {
  interface ComponentTypes {
    ShortformThreadList: typeof ShortformThreadListComponent
  }
}

