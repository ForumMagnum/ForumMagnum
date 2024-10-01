// TODO: Import component in components.ts
import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
import { commentBodyStyles } from '@/themes/stylePiping';

const styles = (theme: ThemeType) => ({
  root: {

  },
});

export const GlossaryEditFormWrapper = ({classes, postId}: {
  classes: ClassesType<typeof styles>,
  postId: string,
}) => {
  const { captureEvent } = useTracking(); //it is virtuous to add analytics tracking to new components

  const { GlossaryEditForm, JargonEditorRow, ToggleSwitch } = Components;

  const [glossary, setGlossary] = React.useState(() => {
    const savedGlossary = localStorage.getItem(`glossary-${postId}`);
    return savedGlossary ? JSON.parse(savedGlossary) : null;
  });

  React.useEffect(() => {
    if (glossary) {
      localStorage.setItem(`glossary-${postId}`, JSON.stringify(glossary));
    }
  }, [glossary, postId]);

  const handleTextChange = (key: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setGlossary((prevGlossary: any) => ({
      ...prevGlossary,
    [key]: {
      ...prevGlossary[key],
      props: {
        ...prevGlossary[key].props,
        text: event.target.value,
      },
    },
    }));
  };

  return <div className={classes.root}>
    {!glossary && <GlossaryEditForm postId={postId} />}
    {!!glossary && <>{Object.keys(glossary).map((item: any) => !glossary[item].props.isAltTerm &&
      <JargonEditorRow key={item} glossaryProps={glossary[item].props}/>
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
