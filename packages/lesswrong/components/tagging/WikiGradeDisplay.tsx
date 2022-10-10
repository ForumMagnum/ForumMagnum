import React from 'react'
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { wikiGradeDefinitions } from '../../lib/collections/tags/schema';
import StarIcon from '@material-ui/icons/Star';
import { Link } from '../../lib/reactRouterWrapper';
import { forumTypeSetting, siteNameWithArticleSetting, taggingNamePluralSetting, taggingNameSetting } from '../../lib/instanceSettings';
import { tagGradingSchemeUrl } from '../../lib/collections/tags/helpers';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    display: 'flex',
    alignItem: 'center',
    marginRight: 16
  }
})

const wikiGradeDescriptions: Partial<Record<number,string>> = {
  1: `This ${taggingNameSetting.get()} has been flagged for review`,
  2: `This ${taggingNameSetting.get()} is a stub, you can contribute by extending it!`,
  3: `This ${taggingNameSetting.get()} is C-Class, it meets the basic requirements, but there is still a lot of room to improve this ${taggingNameSetting.get()}`,
  4: `This ${taggingNameSetting.get()} is B-Class, it a great resource with a solid description and many greats posts`,
  5: `This ${taggingNameSetting.get()} is A-Class, it is an outstanding resource and great example of what we want good ${taggingNamePluralSetting.get()} on ${siteNameWithArticleSetting.get()} to be like`
}

const WikiGradeDisplay = ({wikiGrade, classes}: {wikiGrade:number, classes: any}) => {
  const { LWTooltip } = Components
  if (forumTypeSetting.get() === 'EAForum' || wikiGrade === 0) return null
  return <LWTooltip title={wikiGradeDescriptions[wikiGrade]}>
    <Link
      className={classes.root}
      to={tagGradingSchemeUrl}
    >
      <StarIcon/>{wikiGradeDefinitions[wikiGrade]}
    </Link>
  </LWTooltip>
}


const WikiGradeDisplayComponent = registerComponent("WikiGradeDisplay", WikiGradeDisplay, {styles});

declare global {
  interface ComponentTypes {
    WikiGradeDisplay: typeof WikiGradeDisplayComponent
  }
}
