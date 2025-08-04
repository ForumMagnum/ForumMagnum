import { Routes } from "@/lib/vulcan-lib/routes";
import { combineUrls, getSiteUrl } from "@/lib/vulcan-lib/utils";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";
import { userGetProfileUrlFromSlug } from "@/lib/collections/users/helpers";
import { tagGetUrl } from "@/lib/collections/tags/helpers";
import { sequenceGetPageUrl } from "@/lib/collections/sequences/helpers";
import { localgroupGetUrl } from "@/lib/collections/localgroups/helpers";
import PostsRepo from "./repos/PostsRepo";
import UsersRepo from "./repos/UsersRepo";
import TagsRepo from "./repos/TagsRepo";
import SequencesRepo from "./repos/SequencesRepo";
import LocalgroupsRepo from "./repos/LocalgroupsRepo";
import chunk from "lodash/chunk";

type ChangeFreq =
  | 'always'
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'never'

type SitemapEntry = {
  path: string
  changefreq?: ChangeFreq
  priority?: number
  lastmod?: Date
}

const compileEntries = (entries: SitemapEntry[]) => {
  const baseUrl = getSiteUrl();
  const compiledEntries = entries.map(({ path, changefreq, priority, lastmod }) => {
    const loc = `<loc>${combineUrls(baseUrl, path)}</loc>`;
    const freq = changefreq ? `<changefreq>${changefreq}</changefreq>` : "";
    const prio = priority !== undefined
      ? `<priority>${priority.toFixed(1)}</priority>`
      : "";
    const mod = lastmod ? `<lastmod>${lastmod.toISOString()}</lastmod>` : '';
    return `<url>${loc}${freq}${prio}${mod}</url>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${compiledEntries.join('\n')}
</urlset>`
}

const generateStaticEntries = () => {
  const entries: SitemapEntry[] = [];
  for (const routeName in Routes) {
    const route = Routes[routeName];
    if (route.redirect || route.noIndex || route.isAdmin || route.hideFromSitemap) {
      continue;
    }

    if (route.path.indexOf(":") < 0) {
      entries.push({
        path: route.path,
        changefreq: "daily",
      });
    }
  }
  return entries;
}

const generatePostEntries = async (): Promise<SitemapEntry[]> => {
  const oneMonthAgo = new Date().setMonth(new Date().getMonth() - 1);
  const posts = await new PostsRepo().getSitemapPosts();
  return posts.map((post) => ({
    path: postGetPageUrl(post),
    lastmod: post.modifiedAt ?? undefined,
    changefreq: !post.modifiedAt || post.modifiedAt.getTime() < oneMonthAgo
      ? "monthly" as const
      : "daily" as const,
  }));
}

const generateUserEntries = async (): Promise<SitemapEntry[]> => {
  const users = await new UsersRepo().getSitemapUsers();
  return users.map((user) => ({
    path: userGetProfileUrlFromSlug(user.slug),
    changefreq: "monthly",
  }));
}

const generateTagEntries = async (): Promise<SitemapEntry[]> => {
  const tags = await new TagsRepo().getSitemapTags();
  return tags.map((tag) => ({
    path: tagGetUrl(tag),
    changefreq: "monthly",
  }));
}

const generateSequencesEntries = async (): Promise<SitemapEntry[]> => {
  const sequences = await new SequencesRepo().getSitemapSequences();
  return sequences.map((sequence) => ({
    path: sequenceGetPageUrl(sequence),
    changefreq: "monthly",
  }));
}

const generateLocalgroupsEntries = async (): Promise<SitemapEntry[]> => {
  const localgroups = await new LocalgroupsRepo().getSitemapLocalgroups();
  return localgroups.map((localgroup) => ({
    path: localgroupGetUrl(localgroup),
    lastmod: localgroup.lastActivity,
    changefreq: "monthly",
  }));
}

const generateSitemapIndex = (sitemapCount: number) => {
  const baseUrl = getSiteUrl();
  const now = new Date().toISOString();
  const sitemaps = new Array(sitemapCount).fill(null).map((_, i) => `
    <sitemap>
      <loc>${combineUrls(baseUrl, `sitemap${i + 1}.xml`)}</loc>
      <lastmod>${now}</lastmod>
    </sitemap>`);
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${sitemaps.join("")}
</sitemapindex>`;
}

export const generateSitemaps = async (): Promise<string[]> => {
  const [
    postEntries,
    userEntries,
    tagEntries,
    sequenceEntries,
    localgroupEntries,
  ] = await Promise.all([
    generatePostEntries(),
    generateUserEntries(),
    generateTagEntries(),
    generateSequencesEntries(),
    generateLocalgroupsEntries(),
  ]);
  const entries: SitemapEntry[] = [
    ...generateStaticEntries(),
    ...postEntries,
    ...userEntries,
    ...tagEntries,
    ...sequenceEntries,
    ...localgroupEntries,
  ];
  const sections = chunk(entries, 49999);
  if (sections.length === 1) {
    return [compileEntries(entries)];
  }
  return [
    generateSitemapIndex(sections.length),
    ...sections.map((section) => compileEntries(section)),
  ];
}

type CachedSitemap = {
  sitemaps: Promise<string[]>,
  expiresAt: Date,
}

let cachedSitemap: CachedSitemap | null = null;

export const getSitemapWithCache = async (
  index?: number,
  expiresInMinutes = 5,
): Promise<string> => {
  if (!cachedSitemap || cachedSitemap.expiresAt <= new Date()) {
    cachedSitemap = {
      sitemaps: generateSitemaps(),
      expiresAt: new Date(
        new Date().setMinutes(new Date().getMinutes() + expiresInMinutes),
      ),
    };
  }
  const sitemaps = await cachedSitemap!.sitemaps;
  return sitemaps[index ?? 0];
}
