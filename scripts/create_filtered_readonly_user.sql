-- This script creates a readonly user that is filtered to only access
-- public information.
-- The password is set using a psql variable:
-- psql --set=filtered_readonly_password="some_secret_password" <conn parameters> -f ./scripts/create_filtered_readonly_user.sql

DO
$$BEGIN
IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'filtered_readonly') THEN
	REVOKE ALL ON ALL TABLES IN SCHEMA public FROM filtered_readonly;
	DROP USER filtered_readonly;
END IF;
END$$;

CREATE USER filtered_readonly WITH
	NOCREATEDB NOSUPERUSER NOCREATEROLE NOINHERIT
	PASSWORD :'filtered_readonly_password';

GRANT SELECT ON "Books" TO filtered_readonly;
GRANT SELECT ON "Chapters" TO filtered_readonly;
GRANT SELECT ON "Collections" TO filtered_readonly;
GRANT SELECT ON "Comments" TO filtered_readonly;
GRANT SELECT ON "FeaturedResources" TO filtered_readonly;
GRANT SELECT ON "Localgroups" TO filtered_readonly;
GRANT SELECT ON "PodcastEpisodes" TO filtered_readonly;
GRANT SELECT ON "Podcasts" TO filtered_readonly;
GRANT SELECT ON "PostRelations" TO filtered_readonly;
GRANT SELECT ON "Posts" TO filtered_readonly;
GRANT SELECT ON "Revisions" TO filtered_readonly;
GRANT SELECT ON "Sequences" TO filtered_readonly;
GRANT SELECT ON "Spotlights" TO filtered_readonly;
GRANT SELECT ON "TagFlags" TO filtered_readonly;
GRANT SELECT ON "TagRels" TO filtered_readonly;
GRANT SELECT ON "Tags" TO filtered_readonly;
