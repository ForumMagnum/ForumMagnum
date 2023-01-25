import classNames from 'classnames';
import React from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import truncateTagDescription from '../../../lib/utils/truncateTagDescription';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    padding: "1em 1.5em",
  },
})

const SubforumWelcomeBox = ({html, classes, className}: {
  html: string | undefined,
  classes: ClassesType,
  className?: string,
}) => {
  const { ContentStyles } = Components

  return html ? (
    <ContentStyles contentType="tag" key={`welcome_box`}>
      <div
        className={classNames(className, classes.root)}
        dangerouslySetInnerHTML={{ __html: truncateTagDescription(html, false)}}
      />
    </ContentStyles>
  ) : <></>;
}

const SubforumWelcomeBoxComponent = registerComponent(
  'SubforumWelcomeBox', SubforumWelcomeBox, {styles}
);

declare global {
  interface ComponentTypes {
    SubforumWelcomeBox: typeof SubforumWelcomeBoxComponent
  }
}
