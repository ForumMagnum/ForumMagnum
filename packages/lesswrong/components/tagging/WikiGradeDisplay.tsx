import React from 'react'
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { wikiGradeDefinitions } from '../../lib/collections/tags/schema';
import StarIcon from '@material-ui/icons/Star';
import { Link } from '../../lib/reactRouterWrapper';

const styles = theme => ({
  root: {
    display: 'flex',
    alignItem: 'center',
    marginRight: 16
  }
})

const wikiGradeDescriptions = {
  1: "This tag is flagged for deletion",
  2: "This tag is a stub, you can contribute by extending it!",
  3: "This tag is C-Class, which means it has the basic things a tag needs, but there is still a lot of room to improve",
  4: "This tag is B-Class, which means this tag has a solid description and many posts",
  5: "This tag is A-Class, which means it is a great example of what we want good tags on LessWrong to be like"
}

const WikiGradeDisplay = ({wikiGrade, classes}: {wikiGrade:number, classes: any}) => {
  const { LWTooltip } = Components
  if (wikiGrade === 0) return null
  return <LWTooltip title={wikiGradeDescriptions[wikiGrade]}>
    <Link className={classes.root} to={"/tag/tag-grading-scheme"}>
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
