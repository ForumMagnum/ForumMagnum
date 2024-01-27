// TODO: Import component in components.ts
import React, { useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib';

import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';

const styles = (theme: ThemeType) => ({
  root: {

  },
  textField: {
    marginTop: 10,
  }
});

export const TopPostEditOrder = ({ reviewWinner, updateCuratedOrder, classes }: {
  reviewWinner: ReviewWinnerEditDisplay,
  updateCuratedOrder: (newCuratedOrder: number) => void,
  classes: ClassesType<typeof styles>,
}) => {
  const [currentOrder, setCurrentOrder] = useState(reviewWinner.curatedOrder);

  if (reviewWinner.curatedOrder === 0) {
    console.log({ reviewWinner, currentOrder });
  }

  return (
    <div className={classes.root}>
      <TextField
        id="comment-menu-item-delete-reason"
        label="Curated Order"
        className={classes.textField}
        value={currentOrder}
        onChange={(event) => setCurrentOrder(parseInt(event.target.value))}
      />
      <Button onClick={() => updateCuratedOrder(currentOrder)}>
        Submit
      </Button>
    </div>
  );
}

const TopPostEditOrderComponent = registerComponent('TopPostEditOrder', TopPostEditOrder, {styles});

declare global {
  interface ComponentTypes {
    TopPostEditOrder: typeof TopPostEditOrderComponent
  }
}
