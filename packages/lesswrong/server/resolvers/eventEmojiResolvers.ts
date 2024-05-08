import {
  addGraphQLMutation,
  addGraphQLQuery,
  addGraphQLResolvers,
  addGraphQLSchema,
} from "../vulcan-lib";
import { BannerEmoji, MAX_THETA } from "../../components/ea-forum/EAEmojisHeader";
import { userIsAdminOrMod } from "../../lib/vulcan-users";

addGraphQLSchema(`
  type BannerEmoji {
    id: String!
    userId: String!
    displayName: String!
    emoji: String!
    link: String!
    description: String!
    x: Float!
    y: Float!
    theta: Float!
  }
`);

const emojiPattern = `©|®|‼|⁉|™|ℹ|[↔-↙]|↩|↪|⌚|⌛|⌨|⏏|[⏩-⏳]|[⏸-⏺]|Ⓜ|▪|▫|▶|◀|[◻-◾]|[☀-☄]|☎|☑|☔|☕|☘|☝|☠|☢|☣|☦|☪|☮|☯|[☸-☺]|♀|♂|[♈-♓]|♟|♠|♣|♥|♦|♨|♻|♾|♿|[⚒-⚔]|⚕|⚖|⚗|⚙|⚛|⚜|⚠|⚡|⚪|⚫|⚰|⚱|⚽|⚾|⛄|⛅|⛈|⛎|⛏|⛑|⛓|⛔|⛩|⛪|[⛰-⛵]|[⛷-⛺]|⛽|✂|✅|[✈-✍]|✏|✒|✔|✖|✝|✡|✨|✳|✴|❄|❇|❌|❎|[❓-❕]|❗|❣|❤|[➕-➗]|➡|➰|➿|⤴|⤵|[⬅-⬇]|⬛|⬜|⭐|⭕|〰|〽|㊗|㊙|\u{1F004}|\u{1F0CF}|\u{1F170}|\u{1F171}|\u{1F17E}|\u{1F17F}|\u{1F18E}|[\u{1F191}-\u{1F19A}]|[\u{1F1E6}-\u{1F1FF}]|\u{1F201}|\u{1F202}|\u{1F21A}|\u{1F22F}|[\u{1F232}-\u{1F23A}]|\u{1F250}|\u{1F251}|[\u{1F300}-\u{1F321}]|[\u{1F324}-\u{1F393}]|\u{1F396}|\u{1F397}|[\u{1F399}-\u{1F39B}]|[\u{1F39E}-\u{1F3F0}]|[\u{1F3F3}-\u{1F3F5}]|[\u{1F3F7}-\u{1F4FD}]|[\u{1F4FF}-\u{1F53D}]|[\u{1F549}-\u{1F54E}]|[\u{1F550}-\u{1F567}]|\u{1F56F}|\u{1F570}|[\u{1F573}-\u{1F579}]|\u{1F57A}|\u{1F587}|[\u{1F58A}-\u{1F58D}]|\u{1F590}|\u{1F595}|\u{1F596}|\u{1F5A4}|\u{1F5A5}|\u{1F5A8}|\u{1F5B1}|\u{1F5B2}|\u{1F5BC}|[\u{1F5C2}-\u{1F5C4}]|[\u{1F5D1}-\u{1F5D3}]|[\u{1F5DC}-\u{1F5DE}]|\u{1F5E1}|\u{1F5E3}|\u{1F5E8}|\u{1F5EF}|\u{1F5F3}|[\u{1F5FA}-\u{1F64F}]|[\u{1F680}-\u{1F6C5}]|[\u{1F6CB}-\u{1F6D0}]|\u{1F6D1}|\u{1F6D2}|\u{1F6D5}|[\u{1F6E0}-\u{1F6E5}]|\u{1F6E9}|\u{1F6EB}|\u{1F6EC}|\u{1F6F0}|\u{1F6F3}|[\u{1F6F4}-\u{1F6F6}]|\u{1F6F7}|\u{1F6F8}|\u{1F6F9}|\u{1F6FA}|[\u{1F7E0}-\u{1F7EB}]|[\u{1F90D}-\u{1F90F}]|[\u{1F910}-\u{1F918}]|[\u{1F919}-\u{1F91E}]|\u{1F91F}|[\u{1F920}-\u{1F927}]|[\u{1F928}-\u{1F92F}]|\u{1F930}|\u{1F931}|\u{1F932}|[\u{1F933}-\u{1F93A}]|[\u{1F93C}-\u{1F93E}]|\u{1F93F}|[\u{1F940}-\u{1F945}]|[\u{1F947}-\u{1F94B}]|\u{1F94C}|[\u{1F94D}-\u{1F94F}]|[\u{1F950}-\u{1F95E}]|[\u{1F95F}-\u{1F96B}]|[\u{1F96C}-\u{1F970}]|\u{1F971}|[\u{1F973}-\u{1F976}]|\u{1F97A}|\u{1F97B}|[\u{1F97C}-\u{1F97F}]|[\u{1F980}-\u{1F984}]|[\u{1F985}-\u{1F991}]|[\u{1F992}-\u{1F997}]|[\u{1F998}-\u{1F9A2}]|[\u{1F9A5}-\u{1F9AA}]|\u{1F9AE}|\u{1F9AF}|[\u{1F9B0}-\u{1F9B9}]|[\u{1F9BA}-\u{1F9BF}]|\u{1F9C0}|\u{1F9C1}|\u{1F9C2}|[\u{1F9C3}-\u{1F9CA}]|[\u{1F9CD}-\u{1F9CF}]|[\u{1F9D0}-\u{1F9E6}]|[\u{1F9E7}-\u{1F9FF}]|[\u{1FA70}-\u{1FA73}]|[\u{1FA78}-\u{1FA7A}]|[\u{1FA80}-\u{1FA82}]|[\u{1FA90}-\u{1FA95}]|⌚|⌛|[⏩-⏬]|⏰|⏳|◽|◾|☔|☕|[♈-♓]|♿|⚓|⚡|⚪|⚫|⚽|⚾|⛄|⛅|⛎|⛔|⛪|⛲|⛳|⛵|⛺|⛽|✅|✊|✋|✨|❌|❎|[❓-❕]|❗|[➕-➗]|➰|➿|⬛|⬜|⭐|⭕|\u{1F004}|\u{1F0CF}|\u{1F18E}|[\u{1F191}-\u{1F19A}]|[\u{1F1E6}-\u{1F1FF}]|\u{1F201}|\u{1F21A}|\u{1F22F}|[\u{1F232}-\u{1F236}]|[\u{1F238}-\u{1F23A}]|\u{1F250}|\u{1F251}|[\u{1F300}-\u{1F320}]|[\u{1F32D}-\u{1F335}]|[\u{1F337}-\u{1F37C}]|[\u{1F37E}-\u{1F393}]|[\u{1F3A0}-\u{1F3CA}]|[\u{1F3CF}-\u{1F3D3}]|[\u{1F3E0}-\u{1F3F0}]|\u{1F3F4}|[\u{1F3F8}-\u{1F43E}]|\u{1F440}|[\u{1F442}-\u{1F4FC}]|[\u{1F4FF}-\u{1F53D}]|[\u{1F54B}-\u{1F54E}]|[\u{1F550}-\u{1F567}]|\u{1F57A}|\u{1F595}|\u{1F596}|\u{1F5A4}|[\u{1F5FB}-\u{1F64F}]|[\u{1F680}-\u{1F6C5}]|\u{1F6CC}|\u{1F6D0}|\u{1F6D1}|\u{1F6D2}|\u{1F6D5}|\u{1F6EB}|\u{1F6EC}|[\u{1F6F4}-\u{1F6F6}]|\u{1F6F7}|\u{1F6F8}|\u{1F6F9}|\u{1F6FA}|[\u{1F7E0}-\u{1F7EB}]|[\u{1F90D}-\u{1F90F}]|[\u{1F910}-\u{1F918}]|[\u{1F919}-\u{1F91E}]|\u{1F91F}|[\u{1F920}-\u{1F927}]|[\u{1F928}-\u{1F92F}]|\u{1F930}|\u{1F931}|\u{1F932}|[\u{1F933}-\u{1F93A}]|[\u{1F93C}-\u{1F93E}]|\u{1F93F}|[\u{1F940}-\u{1F945}]|[\u{1F947}-\u{1F94B}]|\u{1F94C}|[\u{1F94D}-\u{1F94F}]|[\u{1F950}-\u{1F95E}]|[\u{1F95F}-\u{1F96B}]|[\u{1F96C}-\u{1F970}]|\u{1F971}|[\u{1F973}-\u{1F976}]|\u{1F97A}|\u{1F97B}|[\u{1F97C}-\u{1F97F}]|[\u{1F980}-\u{1F984}]|[\u{1F985}-\u{1F991}]|[\u{1F992}-\u{1F997}]|[\u{1F998}-\u{1F9A2}]|[\u{1F9A5}-\u{1F9AA}]|\u{1F9AE}|\u{1F9AF}|[\u{1F9B0}-\u{1F9B9}]|[\u{1F9BA}-\u{1F9BF}]|\u{1F9C0}|\u{1F9C1}|\u{1F9C2}|[\u{1F9C3}-\u{1F9CA}]|[\u{1F9CD}-\u{1F9CF}]|[\u{1F9D0}-\u{1F9E6}]|[\u{1F9E7}-\u{1F9FF}]|[\u{1FA70}-\u{1FA73}]|[\u{1FA78}-\u{1FA7A}]|[\u{1FA80}-\u{1FA82}]|[\u{1FA90}-\u{1FA95}]|[\u{1F3FB}-\u{1F3FF}]|☝|⛹|[✊-✍]|\u{1F385}|[\u{1F3C2}-\u{1F3C4}]|\u{1F3C7}|[\u{1F3CA}-\u{1F3CC}]|\u{1F442}|\u{1F443}|[\u{1F446}-\u{1F450}]|[\u{1F466}-\u{1F478}]|\u{1F47C}|[\u{1F481}-\u{1F483}]|[\u{1F485}-\u{1F487}]|\u{1F48F}|\u{1F491}|\u{1F4AA}|\u{1F574}|\u{1F575}|\u{1F57A}|\u{1F590}|\u{1F595}|\u{1F596}|[\u{1F645}-\u{1F647}]|[\u{1F64B}-\u{1F64F}]|\u{1F6A3}|[\u{1F6B4}-\u{1F6B6}]|\u{1F6C0}|\u{1F6CC}|\u{1F90F}|\u{1F918}|[\u{1F919}-\u{1F91E}]|\u{1F91F}|\u{1F926}|\u{1F930}|\u{1F931}|\u{1F932}|[\u{1F933}-\u{1F939}]|[\u{1F93C}-\u{1F93E}]|\u{1F9B5}|\u{1F9B6}|\u{1F9B8}|\u{1F9B9}|\u{1F9BB}|[\u{1F9CD}-\u{1F9CF}]|[\u{1F9D1}-\u{1F9DD}]|‍|⃣|\uFE0F|[\u{1F1E6}-\u{1F1FF}]|[\u{1F3FB}-\u{1F3FF}]|[\u{1F9B0}-\u{1F9B3}]|[\u{E0020}-\u{E007F}]|©|®|‼|⁉|™|ℹ|[↔-↙]|↩|↪|⌚|⌛|⌨|⎈|⏏|[⏩-⏳]|[⏸-⏺]|Ⓜ|▪|▫|▶|◀|[◻-◾]|[☀-☄]|★|[☇-☍]|☎|☏|☐|☑|☒|☔|☕|☖|☗|☘|[☙-☜]|☝|☞|☟|☠|☡|☢|☣|☤|☥|☦|[☧-☩]|☪|[☫-☭]|☮|☯|[☰-☷]|[☸-☺]|[☻-☿]|♀|♁|♂|[♃-♇]|[♈-♓]|[♔-♞]|♟|♠|♡|♢|♣|♤|♥|♦|♧|♨|[♩-♺]|♻|♼|♽|♾|♿|[⚀-⚅]|⚐|⚑|[⚒-⚔]|⚕|⚖|⚗|⚘|⚙|⚚|⚛|⚜|[⚝-⚟]|⚠|⚡|[⚢-⚩]|⚪|⚫|[⚬-⚯]|⚰|⚱|[⚲-⚼]|⚽|⚾|[⚿-⛃]|⛄|⛅|⛆|⛇|⛈|[⛉-⛍]|⛎|⛏|⛐|⛑|⛒|⛓|⛔|[⛕-⛨]|⛩|⛪|[⛫-⛯]|[⛰-⛵]|⛶|[⛷-⛺]|⛻|⛼|⛽|[⛾-✁]|✂|✃|✄|✅|[✈-✍]|✎|✏|✐|✑|✒|✔|✖|✝|✡|✨|✳|✴|❄|❇|❌|❎|[❓-❕]|❗|❣|❤|[❥-❧]|[➕-➗]|➡|➰|➿|⤴|⤵|[⬅-⬇]|⬛|⬜|⭐|⭕|〰|〽|㊗|㊙|[\u{1F000}-\u{1F003}]|\u{1F004}|[\u{1F005}-\u{1F0CE}]|\u{1F0CF}|[\u{1F0D0}-\u{1F0FF}]|[\u{1F10D}-\u{1F10F}]|\u{1F12F}|[\u{1F16C}-\u{1F16F}]|\u{1F170}|\u{1F171}|\u{1F17E}|\u{1F17F}|\u{1F18E}|[\u{1F191}-\u{1F19A}]|[\u{1F1AD}-\u{1F1E5}]|\u{1F201}|\u{1F202}|[\u{1F203}-\u{1F20F}]|\u{1F21A}|\u{1F22F}|[\u{1F232}-\u{1F23A}]|[\u{1F23C}-\u{1F23F}]|[\u{1F249}-\u{1F24F}]|\u{1F250}|\u{1F251}|[\u{1F252}-\u{1F2FF}]|[\u{1F300}-\u{1F321}]|\u{1F322}|\u{1F323}|[\u{1F324}-\u{1F393}]|\u{1F394}|\u{1F395}|\u{1F396}|\u{1F397}|\u{1F398}|[\u{1F399}-\u{1F39B}]|\u{1F39C}|\u{1F39D}|[\u{1F39E}-\u{1F3F0}]|\u{1F3F1}|\u{1F3F2}|[\u{1F3F3}-\u{1F3F5}]|\u{1F3F6}|[\u{1F3F7}-\u{1F3FA}]|[\u{1F400}-\u{1F4FD}]|\u{1F4FE}|[\u{1F4FF}-\u{1F53D}]|[\u{1F546}-\u{1F548}]|[\u{1F549}-\u{1F54E}]|\u{1F54F}|[\u{1F550}-\u{1F567}]|[\u{1F568}-\u{1F56E}]|\u{1F56F}|\u{1F570}|\u{1F571}|\u{1F572}|[\u{1F573}-\u{1F579}]|\u{1F57A}|[\u{1F57B}-\u{1F586}]|\u{1F587}|\u{1F588}|\u{1F589}|[\u{1F58A}-\u{1F58D}]|\u{1F58E}|\u{1F58F}|\u{1F590}|[\u{1F591}-\u{1F594}]|\u{1F595}|\u{1F596}|[\u{1F597}-\u{1F5A3}]|\u{1F5A4}|\u{1F5A5}|\u{1F5A6}|\u{1F5A7}|\u{1F5A8}|[\u{1F5A9}-\u{1F5B0}]|\u{1F5B1}|\u{1F5B2}|[\u{1F5B3}-\u{1F5BB}]|\u{1F5BC}|[\u{1F5BD}-\u{1F5C1}]|[\u{1F5C2}-\u{1F5C4}]|[\u{1F5C5}-\u{1F5D0}]|[\u{1F5D1}-\u{1F5D3}]|[\u{1F5D4}-\u{1F5DB}]|[\u{1F5DC}-\u{1F5DE}]|\u{1F5DF}|\u{1F5E0}|\u{1F5E1}|\u{1F5E2}|\u{1F5E3}|[\u{1F5E4}-\u{1F5E7}]|\u{1F5E8}|[\u{1F5E9}-\u{1F5EE}]|\u{1F5EF}|[\u{1F5F0}-\u{1F5F2}]|\u{1F5F3}|[\u{1F5F4}-\u{1F5F9}]|[\u{1F5FA}-\u{1F64F}]|[\u{1F680}-\u{1F6C5}]|[\u{1F6C6}-\u{1F6CA}]|[\u{1F6CB}-\u{1F6D0}]|\u{1F6D1}|\u{1F6D2}|\u{1F6D3}|\u{1F6D4}|\u{1F6D5}|[\u{1F6D6}-\u{1F6DF}]|[\u{1F6E0}-\u{1F6E5}]|[\u{1F6E6}-\u{1F6E8}]|\u{1F6E9}|\u{1F6EA}|\u{1F6EB}|\u{1F6EC}|[\u{1F6ED}-\u{1F6EF}]|\u{1F6F0}|\u{1F6F1}|\u{1F6F2}|\u{1F6F3}|[\u{1F6F4}-\u{1F6F6}]|\u{1F6F7}|\u{1F6F8}|\u{1F6F9}|\u{1F6FA}|[\u{1F6FB}-\u{1F6FF}]|[\u{1F774}-\u{1F77F}]|[\u{1F7D5}-\u{1F7DF}]|[\u{1F7E0}-\u{1F7EB}]|[\u{1F7EC}-\u{1F7FF}]|[\u{1F80C}-\u{1F80F}]|[\u{1F848}-\u{1F84F}]|[\u{1F85A}-\u{1F85F}]|[\u{1F888}-\u{1F88F}]|[\u{1F8AE}-\u{1F8FF}]|\u{1F90C}|[\u{1F90D}-\u{1F90F}]|[\u{1F910}-\u{1F918}]|[\u{1F919}-\u{1F91E}]|\u{1F91F}|[\u{1F920}-\u{1F927}]|[\u{1F928}-\u{1F92F}]|\u{1F930}|\u{1F931}|\u{1F932}|[\u{1F933}-\u{1F93A}]|[\u{1F93C}-\u{1F93E}]|\u{1F93F}|[\u{1F940}-\u{1F945}]|[\u{1F947}-\u{1F94B}]|\u{1F94C}|[\u{1F94D}-\u{1F94F}]|[\u{1F950}-\u{1F95E}]|[\u{1F95F}-\u{1F96B}]|[\u{1F96C}-\u{1F970}]|\u{1F971}|\u{1F972}|[\u{1F973}-\u{1F976}]|[\u{1F977}-\u{1F979}]|\u{1F97A}|\u{1F97B}|[\u{1F97C}-\u{1F97F}]|[\u{1F980}-\u{1F984}]|[\u{1F985}-\u{1F991}]|[\u{1F992}-\u{1F997}]|[\u{1F998}-\u{1F9A2}]|\u{1F9A3}|\u{1F9A4}|[\u{1F9A5}-\u{1F9AA}]|[\u{1F9AB}-\u{1F9AD}]|\u{1F9AE}|\u{1F9AF}|[\u{1F9B0}-\u{1F9B9}]|[\u{1F9BA}-\u{1F9BF}]|\u{1F9C0}|\u{1F9C1}|\u{1F9C2}|[\u{1F9C3}-\u{1F9CA}]|\u{1F9CB}|\u{1F9CC}|[\u{1F9CD}-\u{1F9CF}]|[\u{1F9D0}-\u{1F9E6}]|[\u{1F9E7}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FA73}]|[\u{1FA74}-\u{1FA77}]|[\u{1FA78}-\u{1FA7A}]|[\u{1FA7B}-\u{1FA7F}]|[\u{1FA80}-\u{1FA82}]|[\u{1FA83}-\u{1FA8F}]|[\u{1FA90}-\u{1FA95}]|[\u{1FA96}-\u{1FFFD}]`;
const complexEmojiRegex = new RegExp(`^${emojiPattern}$`, "u");
const simpleEmojiRegex = /^\p{Extended_Pictographic}$/u;

const bannerEmojiResolvers = {
  Query: {
    BannerEmojis: (
      _root: void,
      _: {},
      {repos}: ResolverContext,
    ): Promise<BannerEmoji[]> => repos.databaseMetadata.getBannerEmojis(),
  },
  Mutation: {
    AddBannerEmoji: async (
      _root: void,
      {emoji, link, description, x, y, theta}: {
        emoji: string,
        link: string,
        description: string,
        x: number,
        y: number,
        theta: number,
      },
      {currentUser, repos}: ResolverContext,
    ): Promise<BannerEmoji[]> => {
      if (!currentUser) {
        throw new Error("Permission denied");
      }
      if (!simpleEmojiRegex.test(emoji) && !complexEmojiRegex.test(emoji)) {
        throw new Error(`Invalid emoji: ${emoji}`);
      }
      if (!link || typeof link !== "string") {
        throw new Error(`Invalid link: ${link}`);
      }
      if (!description || typeof description !== "string") {
        throw new Error(`Invalid description: ${description}`);
      }
      if (typeof x !== "number" || x < 0 || x > 1) {
        throw new Error(`Invalid position x: ${x}`);
      }
      if (typeof y !== "number" || y < 0 || y > 1) {
        throw new Error(`Invalid position y: ${y}`);
      }
      if (typeof theta !== "number" || theta < -MAX_THETA || theta > MAX_THETA) {
        throw new Error(`Invalid theta: ${theta}`);
      }
      return repos.databaseMetadata.addBannerEmoji(
        currentUser._id,
        emoji,
        link,
        description,
        x,
        y,
        theta,
      );
    },
    RemoveBannerEmoji: async (
      _root: void,
      {id}: {id: string},
      {currentUser, repos}: ResolverContext,
    ) => {
      if (!currentUser) {
        throw new Error("Not logged in");
      }
      if (!userIsAdminOrMod(currentUser)) {
        const emoji = await repos.databaseMetadata.getBannerEmojiRaw(id);
        if (!emoji) {
          throw new Error("Emoji not found");
        }
        if (emoji.userId !== currentUser._id) {
          throw new Error("Permission denied");
        }
      }
      return repos.databaseMetadata.removeBannerEmoji(id);
    },
  },
};

addGraphQLResolvers(bannerEmojiResolvers);
addGraphQLQuery(`
  BannerEmojis: [BannerEmoji!]!
`);
addGraphQLMutation(`
  AddBannerEmoji(
    emoji: String!,
    link: String!,
    description: String!,
    x: Float!,
    y: Float!,
    theta: Float!
  ): [BannerEmoji!]!
`);
addGraphQLMutation(`
  RemoveBannerEmoji(id: String!): [BannerEmoji!]!
`);
