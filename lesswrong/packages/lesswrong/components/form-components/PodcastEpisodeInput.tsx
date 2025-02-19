import Button from '@material-ui/core/Button';
import Input from '@material-ui/core/Input';
import Select from '@material-ui/core/Select';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useCreate } from '../../lib/crud/withCreate';
import { useMulti } from '../../lib/crud/withMulti';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import debounce from 'lodash/debounce';

const styles = (theme: ThemeType) => ({
  podcastEpisodeName: {
    fontSize: "15px",
    width: 350,
    [theme.breakpoints.down('sm')]: {
      width: "calc(100% - 30px)", // leaving 30px so that the "clear" button for select forms has room
    },
  }
});

const PodcastEpisodeInput = ({ value, path, document, classes, label, updateCurrentValues }: FormComponentProps<string> & {
  document: PostsBase,
  classes: ClassesType<typeof styles>,
}) => {
  const { Loading, MenuItem } = Components;

  const { title: postTitle } = document;

  const { results: podcasts = [], loading } = useMulti({
    collectionName: 'Podcasts',
    fragmentName: 'PodcastSelect',
    terms: {}
  });

  const [externalEpisodeId, setExternalEpisodeId] = useState('');

  const terms: PodcastEpisodesViewTerms = useMemo(
    () => externalEpisodeId
      ? { view: 'episodeByExternalId', externalEpisodeId }
      : { view: 'episodeByExternalId', _id: value },
    [externalEpisodeId, value]
  );

  // If the post already has an attached episode, fetch it by _id.  Otherwise, refetch it by externalEpisodeId (only when `refetchPodcastEpisode` is called)
  const { results: [existingPodcastEpisode] = [], refetch: refetchPodcastEpisode, loading: episodeLoading } = useMulti({
    collectionName: 'PodcastEpisodes',
    fragmentName: 'PodcastEpisodeFull',
    terms,
  });

  const { create: createEpisodeMutation, data: createdEpisode } = useCreate({
    collectionName: 'PodcastEpisodes',
    fragmentName: 'PodcastEpisodesDefaultFragment'
  });

  const [podcastEpisodeId, setPodcastEpisodeId] = useState(createdEpisode?._id ?? value);

  const syncPodcastEpisodeId = useCallback((id: string) => {
    setPodcastEpisodeId(id);
    void updateCurrentValues({
      [path]: id
    });
  }, [path, updateCurrentValues]);

  const debouncedRefetchPodcastEpisode = useMemo(
    () => debounce(async () => await refetchPodcastEpisode(), 300),
    [refetchPodcastEpisode]
  );

  // If we have an external episode ID but no corresponding episode, we want to do a few things differently
  // This is part of what controls whether the "Create episode" button and the episodeLink/episodeTitle fields are enabled
  const episodeNotFound = useMemo(
    () => externalEpisodeId.length > 0 && !existingPodcastEpisode,
    [externalEpisodeId, existingPodcastEpisode]
  );

  const [podcastId, setPodcastId] = useState(podcasts[0]?._id ?? '');

  const [episodeTitle, setEpisodeTitle] = useState(postTitle);
  const [episodeLink, setEpisodeLink] = useState(existingPodcastEpisode?.episodeLink ?? '');

  const [validEpisodeLink, setValidEpisodeLink] = useState(true);

  const selectPodcastId = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPodcastId(e.target.value);
  };

  // Ideally the link is pasted in, but if it's typed, don't make a bunch of unnecessary queries
  const updateEpisodeLink = async (episodeLink: string) => {
    try {
      const url = new URL(episodeLink);
      const externalEpisodeId = url.searchParams.get('container_id')?.split('-').slice(-1)[0];
      if (externalEpisodeId) {
        // Success case is if we manage to parse an external (buzzsprout) ID from the pasted link
        // If not, it's probably a bad copy & paste job
        setEpisodeLink(url.toString());
        setValidEpisodeLink(true);
        setExternalEpisodeId(externalEpisodeId);
        await debouncedRefetchPodcastEpisode();
      } else {
        setEpisodeLink(episodeLink);
        setValidEpisodeLink(false);
      }
    } catch (err) {
      setEpisodeLink(episodeLink);
      const isEmptyString = !episodeLink;
      setValidEpisodeLink(isEmptyString);
    }
  };

  // Only enable the "Create episode button" if the fields were manually filled in by the user
  // We don't want to enable it if the episode already existed and we fetched it by the given buzzsprout ID
  const createEpisodeButtonEnabled = useMemo(() => {
    const podcastEpisodesFieldsFilled = !!(podcastId && externalEpisodeId && episodeLink && episodeTitle);
    return podcastEpisodesFieldsFilled && episodeNotFound;
  }, [podcastId, externalEpisodeId, episodeLink, episodeTitle, episodeNotFound]);

  const episodeTitleProps = episodeNotFound ? { value: episodeTitle } : { disabled: true, value: episodeTitle };

  const createNewEpisode = useCallback(async () => {
    const episodeData: PodcastEpisodesDefaultFragment = {
      podcastId,
      externalEpisodeId,
      episodeLink,
      title: episodeTitle
    };

    await createEpisodeMutation({ data: episodeData });
  }, [podcastId, externalEpisodeId, episodeLink, episodeTitle, createEpisodeMutation]);

  useEffect(() => {
    if (podcasts.length) {
      const podcast = podcasts.find(podcast => podcast.title.includes('Curated')) ?? podcasts[0];
      setPodcastId(podcast._id);
    }
  }, [podcasts]);

  // Ensure consistency between input fields while refetching after typing
  useEffect(() => {
    if (existingPodcastEpisode) {
      syncPodcastEpisodeId(existingPodcastEpisode._id);
      setExternalEpisodeId(existingPodcastEpisode.externalEpisodeId);
      setPodcastId(existingPodcastEpisode.podcastId);
      // We don't want to prevent a user's changes to the episode link even if we already have one
      setEpisodeLink(episodeLink || existingPodcastEpisode.episodeLink);
      setEpisodeTitle(existingPodcastEpisode.title);
    }
  }, [existingPodcastEpisode, episodeLink, syncPodcastEpisodeId]);

  return (
    loading
    ? <></>
    : (
      // Should we use FormComponentSelect here?
      <>
        <div>
          <Select
            value={podcastId}
            onChange={selectPodcastId}
          >
            {podcasts.map(podcast => {
              return <MenuItem key={podcast._id} value={podcast._id}>{podcast.title}</MenuItem>
            })}
          </Select>
        </div>
        <div>
          <Input
            className={classes.podcastEpisodeName}
            placeholder={'Podcast episode player script URL'}
            onChange={(e) => updateEpisodeLink(e.target.value)}
            error={!validEpisodeLink}
            value={episodeLink}
          />
        </div>
        {episodeLoading
        ? <Loading />
        : <>
            <div>
              <Input
                className={classes.podcastEpisodeName}
                placeholder={'Podcast episode Buzzsprout ID'}
                onChange={(e) => setExternalEpisodeId(e.target.value)}
                value={externalEpisodeId}
                disabled
              />
            </div>
            <div>
              <Input
                className={classes.podcastEpisodeName}
                placeholder={'Podcast episode title'}
                onChange={(e) => setEpisodeTitle(e.target.value)}
                { ...episodeTitleProps }
              />
            </div>
            <div>
              <Input
                className={classes.podcastEpisodeName}
                placeholder={'Podcast episode internal ID'}
                onChange={(e) => syncPodcastEpisodeId(e.target.value)}
                value={podcastEpisodeId}
              />
            </div>
        </>
        }
        <Button variant="outlined" onClick={createNewEpisode} disabled={!createEpisodeButtonEnabled}>
          Create new podcast episode
        </Button>
      </>
    )
  );
};

const PodcastEpisodeInputComponent = registerComponent('PodcastEpisodeInput', PodcastEpisodeInput, {
  styles
});

declare global {
  interface ComponentTypes {
    PodcastEpisodeInput: typeof PodcastEpisodeInputComponent
  }
}
