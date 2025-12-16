import React from 'react';
import { registerComponent } from '../../../lib/vulcan-lib/components';
import type { PostTranslation } from '../../../server/resolvers/postTranslations';

const styles = (theme: ThemeType) => ({
  root: {
    marginBottom: 32,
    marginTop: 16,
  },
  title: {
    ...theme.typography.commentStyle,
    display: "inline-block",
    lineHeight: "1rem",
  },
  list: {
    marginTop: 8,
  },
  item: {
    marginBottom: 2,
  },
  link: {
    ...theme.typography.body2,
    color: theme.palette.primary.main,
  },
  language: {
    fontFamily: theme.typography.code?.fontFamily,
    fontSize: '0.85em',
    color: theme.palette.grey[600],
    marginRight: 8,
    textTransform: 'uppercase' as const,
  },
});

const PostTranslations = ({ classes, translations }: {
  classes: ClassesType<typeof styles>,
  translations: PostTranslation[],
}) => {
  if (!translations?.length) {
    return null;
  }

  const sorted = [...translations].sort((a, b) => a.language.localeCompare(b.language));

  return (
    <div className={classes.root}>
      <div className={classes.title}>Translations</div>
      <div className={classes.list}>
        {sorted.map((t) => (
          <div key={t.url} className={classes.item}>
            <a href={t.url} target="_blank" rel="noopener noreferrer" className={classes.link}>
              <span className={classes.language}>{t.language}</span>
              {t.title}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default registerComponent('PostTranslations', PostTranslations, { styles });
