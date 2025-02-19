/*
 * This is a dummy migration that doesn't actually do anything. We're moving
 * the on-connect queries into a migration, but it makes more sense to move
 * them into the initial migration than into a new migration. This file is
 * needed as we now include postgres functions in the accepted schema, so we
 * need to update the accepted hash.
 *
 * Details:
 *   We currently have a relatively large number of "on-connect queries" that
 *   are run automatically every time we create a new SQL client (including
 *   on server startup). These queries are both rarely edited and necessary
 *   in order to bootstrap a new forum instance. For these reasons it makes
 *   more sense to run them a single time in a migration instead.
 *
 *   I've moved them into the very first "dummy" migration that exists. In
 *   general, it's bad practice to edit old migrations but it this case I
 *   think it makes sense as these queries should be the very first queries
 *   used to bootstrap a new instance, but they've already been run a thousand
 *   times on all the existing instances so we don't need to run them in a
 *   migration there.
 *
 *   Doing this reduces the time from server startup to having a usable
 *   Postgres connection from about 1.3 seconds down to about 50 milliseconds
 *   (albeit on my less-than-ideal internet connection).
 */

export const acceptsSchemaHash = "2e28d7576d143428c88b6c5a8ece4690";

export const up = async (_: MigrationContext) => {}

export const down = async (_: MigrationContext) => {}
