import React from 'react'
import { AnalyticsContext } from '../../lib/analyticsEvents'
import { useSingle } from '../../lib/crud/withSingle'
import { Components, registerComponent } from '../../lib/vulcan-lib'

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    marginBottom: 16,
  },
})

const TagIntroSequence = ({tag, classes}: {
  tag: TagPageFragment,
  classes: ClassesType
}) => {
  const { SectionTitle, ChaptersList } = Components

  if (!tag.sequence) return null
  
  return <div className={classes.root}>
    <SectionTitle title={`Introduction to ${tag.name}`} />
    <AnalyticsContext listContext={'tagIntroSequnce'}>
      <ChaptersList sequenceId={tag.sequence._id} canEdit={false} preview />
    </AnalyticsContext>
  </div>
}

const TagIntroSequenceComponent = registerComponent("TagIntroSequence", TagIntroSequence, {styles})

declare global {
  interface ComponentTypes {
    TagIntroSequence: typeof TagIntroSequenceComponent
  }
}
