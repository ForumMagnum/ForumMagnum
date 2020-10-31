import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import times from 'lodash/times';
import random from 'lodash/random';
import groupBy from 'lodash/groupBy';



const mockElicitData = times(100, (n) => ({
  id: n,
  prediction: random(1, 99, false)
}))

const styles = (theme: ThemeType): JssStyles => ({
  daily: {
    padding: theme.spacing.unit
  }
})
const ElicitBlock = ({ classes }: {
  classes: ClassesType,
}) => {
  const groupedData = groupBy(mockElicitData, ({prediction}) => Math.ceil(prediction / 10) * 10)
  return <div>
    {times(10, () => <div>
      
    </div>)}
  </div>
}

const ElicitBlockComponent = registerComponent('ElicitBlock', ElicitBlock, { styles });

declare global {
  interface ComponentTypes {
    ElicitBlock: typeof ElicitBlockComponent
  }
}

