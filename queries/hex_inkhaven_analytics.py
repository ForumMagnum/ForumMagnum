# Hex.tech Inkhaven Analytics
# This file contains the components needed for Hex analysis

# =============================================================================
# PART A: Process the Inkhaven CSV to extract LW post IDs and user mapping
# =============================================================================
# In Hex: Upload "Daily Publishing Record-Inkhaven Essays Only.csv" as a data source
# It will be available as a dataframe (e.g., `inkhaven_csv`)

# --- Cell 1: Python - Process CSV to extract LW post IDs ---
import pandas as pd
import re

# Assuming `inkhaven_csv` is the uploaded CSV dataframe in Hex
# If you need to load it manually:
# inkhaven_csv = pd.read_csv("Daily Publishing Record-Inkhaven Essays Only.csv")

def extract_lw_post_id(url):
    """Extract LessWrong post ID from a URL"""
    if pd.isna(url):
        return None
    match = re.search(r'lesswrong\.com/posts/([A-Za-z0-9]+)', str(url))
    return match.group(1) if match else None

# Extract post IDs from Publication URL column
inkhaven_csv['lw_post_id'] = inkhaven_csv['Publication URL'].apply(extract_lw_post_id)

# Filter to only LW posts
lw_posts_from_csv = inkhaven_csv[inkhaven_csv['lw_post_id'].notna()].copy()

# Get unique post IDs for the SQL query
lw_post_ids = lw_posts_from_csv['lw_post_id'].unique().tolist()
print(f"Found {len(lw_post_ids)} unique LW post IDs in the Inkhaven CSV")

# Create the post IDs as a SQL-ready string for Part A query
post_ids_sql = ", ".join([f"'{pid}'" for pid in lw_post_ids])
print(f"SQL array ready: {len(lw_post_ids)} post IDs")


# =============================================================================
# PART A (continued): SQL Query - Get userIds for CSV post IDs
# =============================================================================
# Run this against the LW database to get userId mapping for CSV posts

PART_A_SQL = """
-- Part A: Get userId for each Inkhaven CSV post ID
-- Replace {POST_IDS} with the generated post_ids_sql from Python above

SELECT 
  p._id AS post_id,
  p."userId",
  p."postedAt"::date AS posted_date,
  r."wordCount" AS word_count
FROM "Posts" p
LEFT JOIN "Revisions" r ON r._id = p."contents_latest"
WHERE p._id IN ({POST_IDS})
"""

# In Hex, you would run this query with the post IDs substituted
# The result becomes a dataframe, e.g., `csv_post_details`


# =============================================================================
# PART B: SQL Query - Get all LW October/November stats
# =============================================================================
# Run this against the LW database

PART_B_SQL = """
-- Part B: All LW posting stats for October and November 2025

SELECT 
  p."userId",
  u."displayName",
  COUNT(*) FILTER (WHERE p."postedAt" >= '2025-10-01' AND p."postedAt" < '2025-11-01') AS oct_posts,
  COUNT(*) FILTER (WHERE p."postedAt" >= '2025-11-01' AND p."postedAt" < '2025-12-01') AS nov_posts,
  COALESCE(SUM(r."wordCount") FILTER (WHERE p."postedAt" >= '2025-10-01' AND p."postedAt" < '2025-11-01'), 0) AS oct_words,
  COALESCE(SUM(r."wordCount") FILTER (WHERE p."postedAt" >= '2025-11-01' AND p."postedAt" < '2025-12-01'), 0) AS nov_words
FROM "Posts" p
JOIN "Users" u ON u._id = p."userId"
LEFT JOIN "Revisions" r ON r._id = p."contents_latest"
WHERE p.draft IS NOT TRUE
  AND p."isEvent" IS NOT TRUE
  AND p.shortform IS NOT TRUE
  AND p."isFuture" IS NOT TRUE
  AND p."authorIsUnreviewed" IS NOT TRUE
  AND p.status = 2
  AND p.rejected IS NOT TRUE
  AND p.unlisted IS NOT TRUE
  AND p."hiddenRelatedQuestion" IS NOT TRUE
  AND p."postedAt" >= '2025-10-01'
  AND p."postedAt" < '2025-12-01'
GROUP BY p."userId", u."displayName"
"""

# The result becomes a dataframe, e.g., `lw_stats`


# =============================================================================
# PART C: Local SQL/Python - Join everything together
# =============================================================================

# --- Option 1: Using Pandas ---

def combine_data(lw_stats_df, csv_post_details_df, official_override_usernames=None):
    """
    Combine LW stats with Inkhaven CSV data
    
    Args:
        lw_stats_df: Result from PART_B_SQL
        csv_post_details_df: Result from PART_A_SQL
        official_override_usernames: List of displayNames to mark as official (crossposters)
    """
    if official_override_usernames is None:
        official_override_usernames = ['mingyuan']  # Default overrides
    
    # Aggregate CSV post stats per user
    csv_user_stats = csv_post_details_df.groupby('userId').agg({
        'post_id': 'count',
        'word_count': 'sum'
    }).reset_index()
    csv_user_stats.columns = ['userId', 'csv_posts', 'csv_words']
    
    # Get list of official users from CSV
    official_user_ids = csv_post_details_df['userId'].unique().tolist()
    
    # Merge with LW stats
    combined = lw_stats_df.merge(csv_user_stats, on='userId', how='left')
    combined['csv_posts'] = combined['csv_posts'].fillna(0).astype(int)
    combined['csv_words'] = combined['csv_words'].fillna(0).astype(int)
    
    # Mark official status
    combined['official'] = (
        combined['userId'].isin(official_user_ids) | 
        combined['displayName'].isin(official_override_usernames)
    )
    
    # Calculate percentage increases
    combined['post_pct'] = combined.apply(
        lambda r: None if r['oct_posts'] == 0 
        else round(((r['nov_posts'] - r['oct_posts']) / r['oct_posts']) * 100),
        axis=1
    )
    combined['word_pct'] = combined.apply(
        lambda r: None if r['oct_words'] == 0 
        else round(((r['nov_words'] - r['oct_words']) / r['oct_words']) * 100),
        axis=1
    )
    
    # Sort by November posts
    combined = combined.sort_values('nov_posts', ascending=False)
    
    # Reorder columns
    columns = ['displayName', 'official', 'csv_posts', 'oct_posts', 'nov_posts', 
               'oct_words', 'nov_words', 'post_pct', 'word_pct']
    return combined[columns]

# Usage in Hex:
# combined_stats = combine_data(lw_stats, csv_post_details)


# --- Option 2: Using Hex Local SQL ---

PART_C_SQL = """
-- Part C: Combine LW stats with CSV data (run as Hex local SQL)
-- Assumes:
--   - lw_stats: dataframe from Part B
--   - csv_post_details: dataframe from Part A

WITH csv_user_stats AS (
  SELECT 
    "userId",
    COUNT(*) AS csv_posts,
    SUM(word_count) AS csv_words
  FROM csv_post_details
  GROUP BY "userId"
),
official_users AS (
  SELECT DISTINCT "userId" FROM csv_post_details
  UNION
  SELECT "userId" FROM lw_stats WHERE "displayName" IN ('mingyuan')  -- Manual overrides
)
SELECT 
  lw."displayName",
  CASE WHEN ou."userId" IS NOT NULL THEN true ELSE false END AS official,
  COALESCE(csv.csv_posts, 0) AS csv_posts,
  lw.oct_posts,
  lw.nov_posts,
  lw.oct_words,
  lw.nov_words,
  CASE 
    WHEN lw.oct_posts = 0 THEN NULL
    ELSE ROUND(((lw.nov_posts - lw.oct_posts)::numeric / lw.oct_posts) * 100)
  END AS post_pct,
  CASE 
    WHEN lw.oct_words = 0 THEN NULL
    ELSE ROUND(((lw.nov_words - lw.oct_words)::numeric / lw.oct_words) * 100)
  END AS word_pct
FROM lw_stats lw
LEFT JOIN official_users ou ON ou."userId" = lw."userId"
LEFT JOIN csv_user_stats csv ON csv."userId" = lw."userId"
WHERE lw.nov_posts > 0
ORDER BY lw.nov_posts DESC
"""


# =============================================================================
# QUICK START - Copy these to Hex cells
# =============================================================================

print("""
=== HEX SETUP INSTRUCTIONS ===

1. Upload CSV:
   - Add "Daily Publishing Record-Inkhaven Essays Only.csv" as a data source
   - Name it: inkhaven_csv

2. Cell 1 (Python): Process CSV
   - Copy the code from PART A above
   - This extracts LW post IDs and creates post_ids_sql

3. Cell 2 (SQL - LW Database): Get CSV post details
   - Use PART_A_SQL with {POST_IDS} replaced by post_ids_sql
   - Name result: csv_post_details

4. Cell 3 (SQL - LW Database): Get LW stats
   - Use PART_B_SQL
   - Name result: lw_stats

5. Cell 4 (Python or Local SQL): Combine
   - Option A: Use combine_data(lw_stats, csv_post_details)
   - Option B: Use PART_C_SQL as Hex local SQL

6. Visualize!
""")

