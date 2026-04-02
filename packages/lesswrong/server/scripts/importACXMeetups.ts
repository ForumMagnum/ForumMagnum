import { createHash } from 'crypto';
import { writeFile, readFile, rename, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { Posts } from '@/server/collections/posts/collection';
import { Users } from '@/server/collections/users/collection';
import { mapsAPIKeySetting } from '@/lib/instanceSettings';
import { getLocalTime } from '../mapsUtils';
import { userFindOneByEmail } from '../commonQueries';
import { getUnusedSlugByCollectionName } from '../utils/slugUtil';
import { createUser } from '../collections/users/mutations';
import { createPost } from '../collections/posts/mutations';
import { createAnonymousContext } from '../vulcan-lib/createContexts';
import { computeContextFromUser } from '../vulcan-lib/apollo-server/context';
import { executePromiseQueue } from '@/lib/utils/asyncUtils';
import { acxSpring2026Data } from './importACXMeetups/acxSpring2026Data';

/* eslint-disable no-console */

// ── Types ──────────────────────────────────────────────────────────────

export interface ACXMeetup {
  Region: string
  Name: string
  Username?: string
  "Email address": string
  Country: string
  City: string
  "Location description": string
  "Plus.Code Coordinates": string
  Date: string
  Time: string
  "GPS Coordinates": string
  "Event Link"?: string
  "Group Link"?: string
  Notes?: string
  "Additional contact info"?: string
  Title?: string
}

interface ValidatedRecord {
  email: string
  name: string
  profileSlug: string | null
  city: string
  country: string
  locationDescription: string
  coordinates: { lat: number, lng: number }
  plusCodeUrl: string
  eventTimeAsUTC: string
  title: string
  contactInfo: string
  additionalContactInfo: string | null
  eventLink: string | null
  premadePostId: string | null
  meetupLink: string | null
  facebookLink: string | null
  groupLink: string | null
  notes: string | null
  warnings: string[]
}

interface StageFileMetadata {
  completedAt: string | null
  contentHash: string
  inputHash?: string
}

interface ValidationFailureRecord {
  email: string
  row: ACXMeetup
  reasons: string[]
}

interface FailureRecord {
  email: string
  city: string
  reasons: string[]
}

interface StageFile<T> {
  metadata: StageFileMetadata
  records: Record<string, T>
}

interface StageFailureFile<T = FailureRecord> {
  metadata: StageFileMetadata
  records: Record<string, T>
}

interface GeocodingResult {
  googleLocation: Record<string, unknown>
  actualTime: string
  computedAt: string
}

interface UserResult {
  userId: string
}

interface PostResult {
  postId: string
}

// ── File I/O utilities ─────────────────────────────────────────────────

const REPO_ROOT = path.resolve(__dirname, '../../../..');

function stageDir(migrationId: string): string {
  return path.join(REPO_ROOT, 'acxMeetupImports', migrationId);
}

async function ensureStageDir(migrationId: string): Promise<string> {
  const dir = stageDir(migrationId);
  await mkdir(dir, { recursive: true });
  return dir;
}

function computeHash(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

async function atomicWriteJson(filePath: string, data: unknown): Promise<void> {
  const content = JSON.stringify(data, null, 2);
  const tmpPath = `${filePath}.tmp`;
  await writeFile(tmpPath, content, 'utf-8');
  await rename(tmpPath, filePath);
}

async function readJsonFile<T>(filePath: string): Promise<T | null> {
  if (!existsSync(filePath)) return null;
  const content = await readFile(filePath, 'utf-8');
  return JSON.parse(content);
}

function stageFilePaths(dir: string, stageName: string) {
  return {
    success: path.join(dir, `${stageName}.json`),
    failures: path.join(dir, `${stageName}-failures.json`),
  };
}

// ── Shared helpers ─────────────────────────────────────────────────────

function userFindOneByProfileSlugOrUsername(slugOrUsername: string): Promise<DbUser | null> {
  return Users.findOne({
    $or: [{ slug: slugOrUsername }, { username: slugOrUsername }, { oldSlugs: slugOrUsername }],
  });
}

const LESSWRONG_USERS_PATH = "/users/";

function acxMeetupProfileLookupKey(raw: string | undefined): string | null {
  if (raw === undefined) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const collapsedLower = trimmed.toLowerCase().replace(/\s+/g, "");
  if (
    collapsedLower === "n/a" ||
    collapsedLower === "na" ||
    collapsedLower === "no" ||
    collapsedLower === "nonusernameselected"
  ) {
    return null;
  }

  const slugFromPathname = (pathname: string): string | null => {
    const idx = pathname.toLowerCase().indexOf(LESSWRONG_USERS_PATH);
    if (idx === -1) return null;
    const after = pathname.slice(idx + LESSWRONG_USERS_PATH.length);
    const segment = after.split("/").filter(Boolean)[0];
    if (!segment) return null;
    try {
      return decodeURIComponent(segment);
    } catch {
      return segment;
    }
  };

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      return slugFromPathname(new URL(trimmed).pathname);
    } catch {
      return null;
    }
  }

  if (trimmed.startsWith("/")) {
    const fromPath = slugFromPathname(trimmed);
    if (fromPath) return fromPath;
  }

  if (/\s/.test(trimmed) || trimmed.length > 64) return null;

  return trimmed;
}

async function coordinatesToGoogleLocation({ lat, lng }: { lat: string, lng: string }): Promise<Record<string, unknown> | undefined> {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${mapsAPIKeySetting.get()}`,
      { method: 'GET', redirect: 'follow' }
    );
    const responseData = await response.json();
    if (!responseData.results?.length) {
      console.log(`Geocoding returned no results for ${lat},${lng} (status: ${responseData.status})`);
      return undefined;
    }
    return responseData.results[0];
  } catch (err) {
    console.log(`Geocoding failed for ${lat},${lng}:`, err);
    return undefined;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ── Stage 1: Validation ────────────────────────────────────────────────

function recordKey(email: string, city: string): string {
  return `${email}|${city}`;
}

function validateNonEmailFields(row: ACXMeetup): { errors: string[], warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Name
  if (!row.Name) {
    errors.push("Name is empty");
  }

  // GPS Coordinates
  const gps = row["GPS Coordinates"];
  if (!gps) {
    errors.push("GPS Coordinates is empty");
  } else {
    const parts = gps.split(",");
    if (parts.length !== 2) {
      errors.push(`GPS Coordinates "${gps}" does not match "lat,lng" format`);
    } else {
      const lat = parseFloat(parts[0]);
      const lng = parseFloat(parts[1]);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        errors.push(`GPS latitude ${parts[0]} is not a valid number in [-90, 90]`);
      }
      if (isNaN(lng) || lng < -180 || lng > 180) {
        errors.push(`GPS longitude ${parts[1]} is not a valid number in [-180, 180]`);
      }
    }
  }

  // Plus.Code Coordinates
  const plusCode = row["Plus.Code Coordinates"];
  if (!plusCode) {
    errors.push("Plus.Code Coordinates is empty");
  } else if (!plusCode.startsWith("https://plus.codes/")) {
    errors.push(`Plus.Code Coordinates "${plusCode}" does not start with https://plus.codes/`);
  }

  // Date + Time
  const dateStr = row.Date;
  const timeStr = row.Time;
  if (!dateStr) {
    errors.push("Date is empty");
  }
  if (!timeStr) {
    errors.push("Time is empty");
  }
  if (dateStr && timeStr) {
    const parsed = new Date(`${dateStr} ${timeStr} UTC`);
    if (isNaN(parsed.getTime())) {
      errors.push(`Date "${dateStr}" + Time "${timeStr}" does not produce a valid date`);
    } else {
      const now = new Date();
      const sixMonthsMs = 180 * 24 * 60 * 60 * 1000;
      const sixMonthsFromNow = new Date(now.getTime() + sixMonthsMs);
      const sixMonthsAgo = new Date(now.getTime() - sixMonthsMs);
      if (parsed < sixMonthsAgo || parsed > sixMonthsFromNow) {
        errors.push(`Date "${dateStr}" is outside the reasonable range (within 6 months of today)`);
      }
    }
    if (timeStr === "12:00 AM") {
      warnings.push(`Time is "12:00 AM" (midnight) — verify this is not a data entry error (meant 12:00 PM?)`);
    }
  }

  // City
  if (!row.City) {
    errors.push("City is empty");
  }

  // Country
  if (!row.Country) {
    errors.push("Country is empty");
  }

  // Location description
  if (!row["Location description"]) {
    errors.push("Location description is empty");
  }

  // Event Link
  const eventLink = row["Event Link"];
  if (eventLink) {
    try {
      const url = new URL(eventLink);
      if (eventLink.includes("lesswrong.com")) {
        const postId = url.pathname.split('/')[2];
        if (!postId) {
          errors.push(`Event Link "${eventLink}" is a lesswrong.com URL but could not extract a post ID from it`);
        }
      }
    } catch {
      errors.push(`Event Link "${eventLink}" is not a valid URL`);
    }
  }

  // Group Link
  const groupLink = row["Group Link"];
  if (groupLink) {
    try {
      new URL(groupLink);
    } catch {
      // Some group links are just descriptions, not URLs — warn instead of error
      warnings.push(`Group Link "${groupLink}" is not a valid URL`);
    }
  }

  return { errors, warnings };
}

function isValidEmail(email: string): boolean {
  return email.includes("@") && !email.includes(" ");
}

async function runStage1(acxData: ACXMeetup[], dir: string): Promise<boolean> {
  console.log("\n========== Stage 1: Validation ==========");
  const paths = stageFilePaths(dir, 'validation');

  // First pass: resolve emails. If the raw email is invalid, try looking up
  // the user by their LW username and using that account's email instead.
  interface ResolvedRow {
    row: ACXMeetup
    resolvedEmail: string | null
    profileSlug: string | null
  }

  const resolvedRows: ResolvedRow[] = [];
  for (const row of acxData) {
    const rawEmail = row["Email address"] || null;
    const profileSlug = acxMeetupProfileLookupKey(row.Username);

    if (rawEmail && isValidEmail(rawEmail)) {
      resolvedRows.push({ row, resolvedEmail: rawEmail, profileSlug });
    } else if (profileSlug) {
      const user = await userFindOneByProfileSlugOrUsername(profileSlug);
      if (user?.email) {
        console.log(`  RESOLVED [${row.City}]: Found email "${user.email}" via username "${profileSlug}"`);
        resolvedRows.push({ row, resolvedEmail: user.email, profileSlug });
      } else {
        const reason = user ? "user has no email on file" : "no user found with that username";
        console.log(`  LOOKUP FAILED [${row.City}]: Username "${profileSlug}" — ${reason}`);
        resolvedRows.push({ row, resolvedEmail: null, profileSlug });
      }
    } else {
      resolvedRows.push({ row, resolvedEmail: null, profileSlug });
    }
  }

  // Build key frequency map for duplicate detection
  const keyCounts = new Map<string, number>();
  for (const { row, resolvedEmail } of resolvedRows) {
    if (resolvedEmail) {
      const key = recordKey(resolvedEmail, row.City);
      keyCounts.set(key, (keyCounts.get(key) ?? 0) + 1);
    }
  }

  // Second pass: validate all fields and build output records
  const successRecords: Record<string, ValidatedRecord> = {};
  const failureRecords: Record<string, ValidationFailureRecord> = {};
  let warningCount = 0;

  for (const { row, resolvedEmail, profileSlug } of resolvedRows) {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Email validation
    if (!resolvedEmail) {
      const rawEmail = row["Email address"];
      if (!rawEmail) {
        errors.push("Email address is empty and no LW username provided to look up");
      } else {
        errors.push(`Email address "${rawEmail}" is not a valid email and could not be resolved via username`);
      }
    } else {
      const key = recordKey(resolvedEmail, row.City);
      const count = keyCounts.get(key) ?? 0;
      if (count > 1) {
        errors.push(`Duplicate record: "${resolvedEmail}" + "${row.City}" appears ${count} times`);
      }
    }

    // Non-email field validation
    const fieldValidation = validateNonEmailFields(row);
    errors.push(...fieldValidation.errors);
    warnings.push(...fieldValidation.warnings);

    if (warnings.length > 0) {
      warningCount += warnings.length;
      console.log(`  WARN [${row.City}, ${resolvedEmail || "(no email)"}]: ${warnings.join("; ")}`);
    }

    if (errors.length > 0) {
      const failKey = resolvedEmail ? recordKey(resolvedEmail, row.City) : `no-email|${row.City}|${row.Name}`;
      failureRecords[failKey] = { email: resolvedEmail || row["Email address"], row, reasons: errors };
      console.log(`  FAIL [${row.City}, ${resolvedEmail || "(no email)"}]: ${errors.join("; ")}`);
    } else {
      const email = resolvedEmail!;
      const key = recordKey(email, row.City);
      const [latStr, lngStr] = row["GPS Coordinates"].split(",");
      const eventLink = row["Event Link"] || null;
      let premadePostId: string | null = null;
      if (eventLink?.includes("lesswrong.com")) {
        try {
          premadePostId = new URL(eventLink).pathname.split('/')[2] || null;
        } catch { /* URL validation already passed above */ }
      }

      successRecords[key] = {
        email,
        name: row.Name,
        profileSlug,
        city: row.City,
        country: row.Country,
        locationDescription: row["Location description"],
        coordinates: { lat: parseFloat(latStr), lng: parseFloat(lngStr) },
        plusCodeUrl: row["Plus.Code Coordinates"],
        eventTimeAsUTC: new Date(`${row.Date} ${row.Time} UTC`).toISOString(),
        title: row.Title || `${row.City}, ${row.Country} - ACX Spring Schelling 2026`,
        contactInfo: email,
        additionalContactInfo: row["Additional contact info"] || null,
        eventLink,
        premadePostId,
        meetupLink: eventLink?.includes("meetup.com") ? eventLink : null,
        facebookLink: eventLink?.includes("facebook.com") ? eventLink : null,
        groupLink: row["Group Link"] || null,
        notes: row.Notes || null,
        warnings,
      };
    }
  }

  const successContent = JSON.stringify(successRecords);
  const contentHash = computeHash(successContent);

  const successFile: StageFile<ValidatedRecord> = {
    metadata: {
      completedAt: new Date().toISOString(),
      contentHash,
    },
    records: successRecords,
  };

  const failureFile: StageFailureFile<ValidationFailureRecord> = {
    metadata: {
      completedAt: new Date().toISOString(),
      contentHash,
    },
    records: failureRecords,
  };

  await atomicWriteJson(paths.success, successFile);
  await atomicWriteJson(paths.failures, failureFile);

  const failCount = Object.keys(failureRecords).length;
  const successCount = Object.keys(successRecords).length;
  console.log(`  Stage 1 complete: ${successCount} passed, ${failCount} failed, ${warningCount} warnings`);

  if (failCount > 0) {
    console.log(`  ${failCount} record(s) failed validation. Review ${paths.failures}`);
    console.log("  To proceed anyway, re-run with startStage=2");
    return false;
  }
  return true;
}

// ── Stage 2: Geocoding + Timezone ──────────────────────────────────────

async function runStage2(dir: string): Promise<boolean> {
  console.log("\n========== Stage 2: Geocoding + Timezone ==========");
  const validationPaths = stageFilePaths(dir, 'validation');
  const geocodingPaths = stageFilePaths(dir, 'geocoding');

  // Pre-checks
  const validationFile = await readJsonFile<StageFile<ValidatedRecord>>(validationPaths.success);
  if (!validationFile) {
    console.log("  ERROR: validation.json not found. Run stage 1 first.");
    return false;
  }
  if (!validationFile.metadata.completedAt) {
    console.log("  ERROR: Stage 1 did not complete. Re-run stage 1.");
    return false;
  }

  const apiKey = mapsAPIKeySetting.get();
  if (!apiKey) {
    console.log("  ERROR: Google Maps API key is not configured (googleMaps.apiKey setting).");
    return false;
  }

  const inputHash = validationFile.metadata.contentHash;

  // Load existing progress
  const existingProgress = await readJsonFile<StageFile<GeocodingResult>>(geocodingPaths.success);
  const existingRecords: Record<string, GeocodingResult> = {};

  if (existingProgress) {
    if (existingProgress.metadata.inputHash !== inputHash) {
      console.log("  WARNING: validation.json has changed since last geocoding run. Starting fresh.");
    } else {
      Object.assign(existingRecords, existingProgress.records);
      console.log(`  Resuming: ${Object.keys(existingRecords).length} records already geocoded`);
    }
  }

  const successRecords: Record<string, GeocodingResult> = { ...existingRecords };
  const failureRecords: Record<string, FailureRecord> = {};
  const keys = Object.keys(validationFile.records);
  let processedCount = 0;

  for (const key of keys) {
    if (successRecords[key]) {
      continue;
    }

    const record = validationFile.records[key];
    const { coordinates, city, email } = record;

    const googleLocation = await coordinatesToGoogleLocation({ lat: String(coordinates.lat), lng: String(coordinates.lng) });
    if (!googleLocation) {
      failureRecords[key] = { email, city, reasons: [`Geocoding failed for coordinates ${coordinates.lat},${coordinates.lng}`] };
      console.log(`  FAIL [${city}]: Geocoding failed`);
      // Continue processing other records before stopping
    } else {
      const eventTimePretendingItsUTC = new Date(record.eventTimeAsUTC);
      const localtime = await getLocalTime(eventTimePretendingItsUTC, googleLocation);
      if (!localtime) {
        failureRecords[key] = { email, city, reasons: [`Timezone lookup failed for ${city}`] };
        console.log(`  FAIL [${city}]: Timezone lookup failed`);
      } else {
        // Reverse the timezone offset: getLocalTime adds the offset, we need to subtract it
        // to convert the user's intended local time into UTC
        const actualTime = new Date(
          eventTimePretendingItsUTC.getTime() + (eventTimePretendingItsUTC.getTime() - localtime.getTime())
        );

        successRecords[key] = {
          googleLocation,
          actualTime: actualTime.toISOString(),
          computedAt: new Date().toISOString(),
        };
      }
    }

    processedCount++;

    // Write incremental progress every 10 records
    if (processedCount % 10 === 0) {
      await atomicWriteJson(geocodingPaths.success, {
        metadata: { completedAt: null, contentHash: computeHash(JSON.stringify(successRecords)), inputHash },
        records: successRecords,
      });
      console.log(`  Progress: ${Object.keys(successRecords).length} geocoded, ${Object.keys(failureRecords).length} failed`);
    }

    // Throttle: 100ms between API calls (well under 50 QPS limit)
    await sleep(100);
  }

  // Final write
  const successContent = JSON.stringify(successRecords);
  const successFile: StageFile<GeocodingResult> = {
    metadata: {
      completedAt: new Date().toISOString(),
      contentHash: computeHash(successContent),
      inputHash,
    },
    records: successRecords,
  };

  const failureFile: StageFailureFile = {
    metadata: {
      completedAt: new Date().toISOString(),
      contentHash: computeHash(JSON.stringify(failureRecords)),
      inputHash,
    },
    records: failureRecords,
  };

  await atomicWriteJson(geocodingPaths.success, successFile);
  await atomicWriteJson(geocodingPaths.failures, failureFile);

  const failCount = Object.keys(failureRecords).length;
  const successCount = Object.keys(successRecords).length;
  console.log(`  Stage 2 complete: ${successCount} geocoded, ${failCount} failed`);

  if (failCount > 0) {
    console.log(`  ${failCount} record(s) failed geocoding. Review ${geocodingPaths.failures}`);
    console.log("  To proceed anyway, re-run with startStage=3");
    return false;
  }
  return true;
}

// ── Stage 3: User Resolution ───────────────────────────────────────────

const ADMIN_ID = 'XtphY3uYHwruKqDyG';

async function runStage3(dir: string, migrationSuffix: string): Promise<boolean> {
  console.log("\n========== Stage 3: User Resolution ==========");
  const validationPaths = stageFilePaths(dir, 'validation');
  const userPaths = stageFilePaths(dir, 'users');

  // Pre-checks
  const validationFile = await readJsonFile<StageFile<ValidatedRecord>>(validationPaths.success);
  if (!validationFile) {
    console.log("  ERROR: validation.json not found. Run stage 1 first.");
    return false;
  }
  if (!validationFile.metadata.completedAt) {
    console.log("  ERROR: Stage 1 did not complete. Re-run stage 1.");
    return false;
  }

  const inputHash = validationFile.metadata.contentHash;

  // Load existing progress
  const existingProgress = await readJsonFile<StageFile<UserResult>>(userPaths.success);
  const existingRecords: Record<string, UserResult> = {};

  if (existingProgress) {
    if (existingProgress.metadata.inputHash !== inputHash) {
      console.log("  WARNING: validation.json has changed since last user resolution run. Starting fresh.");
    } else {
      Object.assign(existingRecords, existingProgress.records);
      console.log(`  Resuming: ${Object.keys(existingRecords).length} users already resolved`);
    }
  }

  const successRecords: Record<string, UserResult> = { ...existingRecords };
  const failureRecords: Record<string, FailureRecord> = {};
  const keys = Object.keys(validationFile.records);
  let processedCount = 0;

  for (const key of keys) {
    if (successRecords[key]) {
      continue;
    }

    const record = validationFile.records[key];
    const { profileSlug, name, city, email } = record;
    try {
      const userByProfile = profileSlug
        ? await userFindOneByProfileSlugOrUsername(profileSlug)
        : null;
      const existingUserByEmail = await userFindOneByEmail(email);

      let eventOrganizer: DbUser;

      if (userByProfile) {
        eventOrganizer = userByProfile;
        if (existingUserByEmail && existingUserByEmail._id !== userByProfile._id) {
          console.log(`  INFO [${city}]: Profile user (${profileSlug}) differs from email user; using profile user`);
        }
      } else if (existingUserByEmail) {
        eventOrganizer = existingUserByEmail;
      } else {
        const username = await getUnusedSlugByCollectionName("Users", name.toLowerCase());
        try {
          const newUser = await createUser({
            data: {
              username,
              displayName: name,
              email,
              reviewedByUserId: ADMIN_ID,
              reviewedAt: new Date(),
            },
          }, createAnonymousContext());
          eventOrganizer = newUser;
          console.log(`  Created user "${username}" for ${city}`);
        } catch (createErr) {
          console.log(`  First username "${username}" failed, trying fallback`);
          const newUser = await createUser({
            data: {
              username: `${username}-${migrationSuffix}`,
              displayName: name,
              email,
              reviewedByUserId: ADMIN_ID,
              reviewedAt: new Date(),
            },
          }, createAnonymousContext());
          eventOrganizer = newUser;
          console.log(`  Created user "${username}-${migrationSuffix}" for ${city}`);
        }
      }

      successRecords[key] = { userId: eventOrganizer._id };
      processedCount++;

      // Write incremental progress every 10 records
      if (processedCount % 10 === 0) {
        await atomicWriteJson(userPaths.success, {
          metadata: { completedAt: null, contentHash: computeHash(JSON.stringify(successRecords)), inputHash },
          records: successRecords,
        });
        console.log(`  Progress: ${Object.keys(successRecords).length} resolved`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      failureRecords[key] = { email, city, reasons: [`User resolution failed: ${message}`] };
      console.log(`  FAIL [${city}]: ${message}`);
    }
  }

  // Final write
  const successContent = JSON.stringify(successRecords);
  const successFile: StageFile<UserResult> = {
    metadata: {
      completedAt: new Date().toISOString(),
      contentHash: computeHash(successContent),
      inputHash,
    },
    records: successRecords,
  };

  const failureFile: StageFailureFile = {
    metadata: {
      completedAt: new Date().toISOString(),
      contentHash: computeHash(JSON.stringify(failureRecords)),
      inputHash,
    },
    records: failureRecords,
  };

  await atomicWriteJson(userPaths.success, successFile);
  await atomicWriteJson(userPaths.failures, failureFile);

  const failCount = Object.keys(failureRecords).length;
  const successCount = Object.keys(successRecords).length;
  console.log(`  Stage 3 complete: ${successCount} resolved, ${failCount} failed`);

  if (failCount > 0) {
    console.log(`  ${failCount} record(s) failed user resolution. Review ${userPaths.failures}`);
    console.log("  To proceed anyway, re-run with startStage=4");
    return false;
  }
  return true;
}

// ── Stage 4: Post Creation ─────────────────────────────────────────────

const GEOCODING_FRESHNESS_HOURS = 24;

async function runStage4(dir: string): Promise<boolean> {
  console.log("\n========== Stage 4: Post Creation ==========");
  const validationPaths = stageFilePaths(dir, 'validation');
  const geocodingPaths = stageFilePaths(dir, 'geocoding');
  const userPaths = stageFilePaths(dir, 'users');
  const postPaths = stageFilePaths(dir, 'posts');

  // Pre-checks: validation
  const validationFile = await readJsonFile<StageFile<ValidatedRecord>>(validationPaths.success);
  if (!validationFile?.metadata.completedAt) {
    console.log("  ERROR: Stage 1 not complete. Run stage 1 first.");
    return false;
  }

  // Pre-checks: geocoding
  const geocodingFile = await readJsonFile<StageFile<GeocodingResult>>(geocodingPaths.success);
  if (!geocodingFile?.metadata.completedAt) {
    console.log("  ERROR: Stage 2 not complete. Run stage 2 first.");
    return false;
  }

  // Check geocoding freshness
  const now = Date.now();
  const freshnessMs = GEOCODING_FRESHNESS_HOURS * 60 * 60 * 1000;
  for (const [key, result] of Object.entries(geocodingFile.records)) {
    const age = now - new Date(result.computedAt).getTime();
    if (age > freshnessMs) {
      console.log(`  ERROR: Geocoding result for ${key} is ${Math.round(age / 3600000)}h old (limit: ${GEOCODING_FRESHNESS_HOURS}h). Re-run stage 2.`);
      return false;
    }
  }

  // Pre-checks: users
  const usersFile = await readJsonFile<StageFile<UserResult>>(userPaths.success);
  if (!usersFile?.metadata.completedAt) {
    console.log("  ERROR: Stage 3 not complete. Run stage 3 first.");
    return false;
  }

  // All pre-checks passed; bind to non-null locals for use in the closure below
  const validatedRecords = validationFile.records;
  const geocodingRecords = geocodingFile.records;
  const userRecords = usersFile.records;

  // Determine which records have both geocoding and user data
  const validKeys = Object.keys(validatedRecords);
  const processableKeys = validKeys.filter(key => {
    const hasGeo = !!geocodingRecords[key];
    const hasUser = !!userRecords[key];
    if (!hasGeo) console.log(`  SKIP [${validatedRecords[key].city}]: No geocoding data`);
    if (!hasUser) console.log(`  SKIP [${validatedRecords[key].city}]: No user data`);
    return hasGeo && hasUser;
  });

  // Load existing progress
  const existingProgress = await readJsonFile<StageFile<PostResult>>(postPaths.success);
  const existingRecords: Record<string, PostResult> = {};
  const inputHash = `${geocodingFile.metadata.contentHash}:${usersFile.metadata.contentHash}`;

  if (existingProgress) {
    if (existingProgress.metadata.inputHash !== inputHash) {
      console.log("  WARNING: Upstream stage outputs have changed since last post creation run. Starting fresh.");
    } else {
      Object.assign(existingRecords, existingProgress.records);
      console.log(`  Resuming: ${Object.keys(existingRecords).length} posts already processed`);
    }
  }

  const successRecords: Record<string, PostResult> = { ...existingRecords };
  const failureRecords: Record<string, FailureRecord> = {};
  let processedCount = 0;

  const keysToProcess = processableKeys.filter(key => !successRecords[key]);

  async function processOnePost(key: string): Promise<void> {
    const record = validatedRecords[key];
    const geocoding = geocodingRecords[key];
    const { userId } = userRecords[key];
    const { city, title, premadePostId, email } = record;

    try {
      const [existingPost, premadePostObject] = await Promise.all([
        Posts.findOne({ title }),
        premadePostId ? Posts.findOne(premadePostId) : Promise.resolve(undefined),
      ]);

      if (existingPost) {
        console.log(`  EXISTS [${city}]: Post already exists with title "${title}"`);
        successRecords[key] = { postId: existingPost._id };
      } else if (premadePostObject) {
        console.log(`  EXISTS [${city}]: Premade post found via Event Link`);
        successRecords[key] = { postId: premadePostObject._id };
      } else {
        const eventOrganizer = await Users.findOne(userId);
        if (!eventOrganizer) {
          failureRecords[key] = { email, city, reasons: [`User ${userId} not found in database`] };
          console.log(`  FAIL [${city}]: User ${userId} not found`);
          return;
        }

        const newPostData = {
          title,
          postedAt: new Date(),
          userId,
          reviewedByUserId: ADMIN_ID,
          submitToFrontpage: false,
          activateRSVPs: true,
          draft: false,
          meta: false,
          isEvent: true,
          contactInfo: record.contactInfo,
          location: city,
          startTime: new Date(geocoding.actualTime),
          meetupLink: record.meetupLink ?? undefined,
          facebookLink: record.facebookLink ?? undefined,
          googleLocation: geocoding.googleLocation,
          contents: {
            originalContents: {
              type: 'lexical',
              data: `<p>This year's Spring ACX Meetup everywhere in ${city}.</p>
                <p>Location: ${record.locationDescription} - <a href="${record.plusCodeUrl}">${record.plusCodeUrl}</a></p>
                ${record.groupLink ? `<p>Group Link: ${record.groupLink}</p>` : ""}
                ${record.notes ? `<p>${record.notes}</p>` : ""}
                <p>Contact: ${record.contactInfo} ${record.additionalContactInfo ? `- ${record.additionalContactInfo}` : ""}</p>`,
            },
            updateType: 'minor',
            commitMessage: '',
          },
          moderationStyle: 'easy-going',
          af: false,
          authorIsUnreviewed: false,
          types: ['SSC'],
        };

        const context = computeContextFromUser({ user: eventOrganizer, isSSR: false });
        const newPost = await createPost({ data: newPostData }, context);
        console.log(`  CREATED [${city}]: "${newPost.title}"`);
        successRecords[key] = { postId: newPost._id };
      }

      processedCount++;

      // Write incremental progress every 5 records
      if (processedCount % 5 === 0) {
        await atomicWriteJson(postPaths.success, {
          metadata: { completedAt: null, contentHash: computeHash(JSON.stringify(successRecords)), inputHash },
          records: successRecords,
        });
        console.log(`  Progress: ${Object.keys(successRecords).length} posts processed`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      failureRecords[key] = { email, city, reasons: [`Post creation failed: ${message}`] };
      console.log(`  FAIL [${city}]: ${message}`);
    }
  }

  await executePromiseQueue(keysToProcess.map(key => () => processOnePost(key)), 5);

  // Final write
  const successContent = JSON.stringify(successRecords);
  const successFile: StageFile<PostResult> = {
    metadata: {
      completedAt: new Date().toISOString(),
      contentHash: computeHash(successContent),
      inputHash,
    },
    records: successRecords,
  };

  const failureFile: StageFailureFile = {
    metadata: {
      completedAt: new Date().toISOString(),
      contentHash: computeHash(JSON.stringify(failureRecords)),
      inputHash,
    },
    records: failureRecords,
  };

  await atomicWriteJson(postPaths.success, successFile);
  await atomicWriteJson(postPaths.failures, failureFile);

  const failCount = Object.keys(failureRecords).length;
  const successCount = Object.keys(successRecords).length;
  console.log(`  Stage 4 complete: ${successCount} posts processed, ${failCount} failed`);

  if (failCount > 0) {
    console.log(`  ${failCount} record(s) failed post creation. Review ${postPaths.failures}`);
    return false;
  }
  return true;
}

// ── Pipeline runner ────────────────────────────────────────────────────

const MIGRATION_ID = '2026-spring';
const MIGRATION_SUFFIX = 'spring-acx-26';

export async function importACXMeetups(startStage?: number): Promise<void> {
  const stage = startStage ?? 1;
  if (stage < 1 || stage > 4) {
    console.log("startStage must be between 1 and 4");
    return;
  }

  const dir = await ensureStageDir(MIGRATION_ID);
  console.log(`ACX Meetup Import — starting from stage ${stage}`);
  console.log(`Output directory: ${dir}`);

  const stages: Array<() => Promise<boolean>> = [
    () => runStage1(acxSpring2026Data, dir),
    () => runStage2(dir),
    () => runStage3(dir, MIGRATION_SUFFIX),
    () => runStage4(dir),
  ];

  for (let i = stage - 1; i < stages.length; i++) {
    const success = await stages[i]();
    if (!success) {
      console.log(`\nPipeline stopped after stage ${i + 1} due to failures.`);
      return;
    }
  }

  console.log("\nAll stages completed successfully!");
}
