// Some PodcastEpisodes rows (the ones bulk-imported from
// razPostToBuzzsproutMappings.json and curatedPostToBuzzsproutMappings.json
// in the 2022-08-19-createPodcastsForPosts manual migration) have HTML-encoded
// "&amp;" in their episodeLink instead of "&". When PostsPodcastPlayer.tsx
// later assigns that string directly to script.src, the literal "&amp;" is
// sent to Buzzsprout, which then 404s (because the player=small query param
// gets parsed as "amp;player=small"). The result is that the audio toggle
// icon shows in the post header but the embedded player area is empty.
// This migration replaces "&amp;" with "&" in episodeLink for all affected
// rows.

export const up = async ({db}: MigrationContext) => {
  await db.none(`
    UPDATE "PodcastEpisodes"
    SET "episodeLink" = REPLACE("episodeLink", '&amp;', '&')
    WHERE "episodeLink" LIKE '%&amp;%'
  `);
}

export const down = async ({db}: MigrationContext) => {
}
