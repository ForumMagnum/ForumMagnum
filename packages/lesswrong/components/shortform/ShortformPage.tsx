"use client";

import React from 'react';
import SingleColumnSection from "../common/SingleColumnSection";
import ShortformThreadList from "./ShortformThreadList";
import SectionTitle from "../common/SectionTitle";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('ShortformPage', (theme: ThemeType) => ({
  column: {
    maxWidth:680,
    margin:"auto"
  }
}))

const ShortformPage = () => {
  const classes = useStyles(styles);

  return (
    <SingleColumnSection>
      <div className={classes.column}>
        <SectionTitle title={"Quick Takes"} />
        <ShortformThreadList />
      </div>
    </SingleColumnSection>
  )
}

export default ShortformPage;


