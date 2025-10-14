import React from 'react';
import PostTranslationLink, { PostTranslationLinkData } from './PostTranslationLink';
import { registerComponent } from '@/lib/vulcan-lib/components';

const styles = (theme: ThemeType) => ({
  root: {
    marginBottom: theme.spacing.unit*4,
    marginTop: theme.spacing.unit*2
  },
  title: {
    ...theme.typography.commentStyle,
    display: "inline-block",
    lineHeight: "1rem",
    marginBottom: -4
  },
  loadMore: {
    ...theme.typography.commentStyle,
    display: "inline-block",
    lineHeight: "1rem",
    marginBottom: -4,
    ...(theme.isFriendlyUI
      ? {
        fontWeight: 600,
        marginTop: 12,
        color: theme.palette.primary.main,
        "&:hover": {
          color: theme.palette.primary.dark,
          opacity: 1,
        },
      }
      : {
        color: theme.palette.lwTertiary.main,
      }),
  },
  list: {
    marginTop: theme.spacing.unit
  },
});

const PostTranslations = ({ classes, postId }: {
  classes: ClassesType<typeof styles>,
  postId: string,
}) => {
  const [translations, setTranslations] = React.useState<PostTranslationLinkData[]>([]);
  React.useEffect(() => {
    const fetchTranslations = async () => {
      const url = `/api/post-translations-proxy/${postId}`;
      const response = await fetch(url);
      if (response.ok) {
        try {
        const data = await response.json();
        setTranslations(data);
        } catch (e) {
          setTranslations([{url: 'error', title: `Error fetching ${url}`, language: 'en'}]);
        } 
      }
    };
    // eslint-disable-next-line no-console
    fetchTranslations().catch(console.error);
  }, [postId]);
  if (translations && translations.length > 0) {
    const sortedTranslations = translations.sort((a: PostTranslationLinkData, b: PostTranslationLinkData) => a.language.localeCompare(b.language));
    return <div className={classes.root}>
      <div className={classes.title}>
          <span>Translations of this post</span>
      </div>
      <div className={classes.list}>
        {sortedTranslations.map((translation) => <PostTranslationLink key={translation.url} data={translation}/>)}
      </div>
    </div>
  }
}

export default registerComponent('PostTranslations', PostTranslations, { styles});

