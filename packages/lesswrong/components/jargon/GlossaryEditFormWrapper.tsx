// TODO: Import component in components.ts
import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
import { commentBodyStyles } from '@/themes/stylePiping';

const styles = (theme: ThemeType) => ({
  root: {

  },
  jargonRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...commentBodyStyles(theme),
    marginBottom: 12,
  }
});

export const GlossaryEditFormWrapper = ({classes, postId}: {
  classes: ClassesType<typeof styles>,
  postId: string,
}) => {
  const { captureEvent } = useTracking(); //it is virtuous to add analytics tracking to new components

  const { GlossaryEditForm, ToggleSwitch } = Components;

  const [glossary, setGlossary] = React.useState(() => {
    const savedGlossary = localStorage.getItem(`glossary-${postId}`);
    return savedGlossary ? JSON.parse(savedGlossary) : null;
  });

  React.useEffect(() => {
    if (glossary) {
      localStorage.setItem(`glossary-${postId}`, JSON.stringify(glossary));
    }
  }, [glossary, postId]);

  console.log(glossary);
  console.log(Object.keys(glossary));

  return <div className={classes.root}>
    {!glossary && <GlossaryEditForm postId={postId} />}
    {!!glossary && <>{Object.keys(glossary).map((item: any) => !glossary[item].props.isAltTerm &&
      <div className={classes.jargonRow} key={item}>
        <div dangerouslySetInnerHTML={{__html: glossary[item].props.text}} />
        <ToggleSwitch value={false}/>
      </div>
    )}
    </>
    }
  </div>;
}

const GlossaryEditFormWrapperComponent = registerComponent('GlossaryEditFormWrapper', GlossaryEditFormWrapper, {styles});

declare global {
  interface ComponentTypes {
    GlossaryEditFormWrapper: typeof GlossaryEditFormWrapperComponent
  }
}
