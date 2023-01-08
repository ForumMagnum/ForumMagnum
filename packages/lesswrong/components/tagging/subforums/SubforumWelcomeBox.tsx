import classNames from 'classnames';
import React from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import truncateTagDescription from '../../../lib/utils/truncateTagDescription';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
     // FIXME: headers add a lot of padding, this is a hack to make it look right when there is a header but it still looks bad when there isn't one
    paddingTop: 2,
    paddingBottom: "1em",
    paddingLeft: "1.5em",
    paddingRight: "1.5em",
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
