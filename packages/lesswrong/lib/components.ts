import '../components/alignment-forum/withSetAlignmentPost';
import '../components/posts/PostsPage';
import '../components/posts/TableOfContents';

import '../components/vulcan-core/vulcan-core-components';
import { forumTypeSetting } from './instanceSettings';
// vulcan:forms
import './vulcan-forms/components';
import { importComponent } from './vulcan-lib';

if(forumTypeSetting.get() === 'AlignmentForum') {
  // HACK: At the top of the file because DeepScan false-positively warns about
  // imports not at top level, and it re-detects it every time the line number
  // changes. Putting it at the top makes its line number stable.
  importComponent("AlignmentForumHome", () => require('../components/alignment-forum/AlignmentForumHome'));
}

if (forumTypeSetting.get() === 'EAForum') {
  importComponent("EAHome", () => require('../components/ea-forum/EAHome'));
  importComponent("EASequencesHome", () => require('../components/ea-forum/EASequencesHome'));
  importComponent("EAHomeHandbook", () => require('../components/ea-forum/EAHomeHandbook'));
  importComponent("SmallpoxBanner", () => require('../components/ea-forum/SmallpoxBanner'));
  importComponent("SiteLogo", () => require('../components/ea-forum/SiteLogo'));
}

importComponent("ConversationTitleEditForm", () => require('../components/messaging/ConversationTitleEditForm'));
importComponent("ConversationDetails", () => require('../components/messaging/ConversationDetails'));
importComponent("ConversationItem", () => require('../components/messaging/ConversationItem'));
importComponent("ConversationWrapper", () => require('../components/messaging/ConversationWrapper'));
importComponent("ConversationPage", () => require('../components/messaging/ConversationPage'));
importComponent("ConversationPreview", () => require('../components/messaging/ConversationPreview'));
importComponent("MessageItem", () => require('../components/messaging/MessageItem'));
importComponent("InboxWrapper", () => require('../components/messaging/InboxWrapper'));
importComponent("InboxNavigation", () => require('../components/messaging/InboxNavigation'));
importComponent("NewConversationButton", () => require('../components/messaging/NewConversationButton'));
importComponent("EditorFormComponent", () => require('../components/editor/EditorFormComponent'));
importComponent("EditTitle", () => require('../components/editor/EditTitle'));
importComponent("EditUrl", () => require('../components/editor/EditUrl'));

// RSS Feed Integration
importComponent("newFeedButton", () => require('../components/feeds/newFeedButton'));
//importComponent("editFeedButton", () => require('../components/feeds/editFeedButton'));

importComponent("NotificationsMenu", () => require('../components/notifications/NotificationsMenu'));
importComponent("NotificationsList", () => require('../components/notifications/NotificationsList'));
importComponent("TagRelNotificationItem", () => require('../components/notifications/TagRelNotificationItem'));
importComponent("NotificationsItem", () => require('../components/notifications/NotificationsItem'));
importComponent("NotificationsMenuButton", () => require('../components/notifications/NotificationsMenuButton'));
importComponent("SubscribeTo", () => require('../components/notifications/SubscribeTo'));
importComponent("NotificationTypeSettings", () => require('../components/notifications/NotificationTypeSettings'));
importComponent("NotificationEmailPreviewPage", () => require('../components/notifications/NotificationEmailPreviewPage'));
importComponent("EmailPreview", () => require('../components/notifications/EmailPreview'));

importComponent("Layout", () => require('../components/Layout.tsx'));

importComponent("AnalyticsClient", () => require('../components/common/AnalyticsClient'));
importComponent("CalendarDate", () => require('../components/common/CalendarDate'));
importComponent("FormatDate", () => require('../components/common/FormatDate'));
importComponent("BetaTag", () => require('../components/common/BetaTag'));
importComponent("FlashMessages", () => require('../components/common/FlashMessages'));
importComponent("Header", () => require('../components/common/Header'));
importComponent("HeaderSubtitle", () => require('../components/common/HeaderSubtitle'));
importComponent("HeadTags", () => require('../components/common/HeadTags'));
importComponent("Home2", () => require('../components/common/Home2'));
importComponent("HomeLatestPosts", () => require('../components/common/HomeLatestPosts'));
importComponent("Meta", () => require('../components/common/Meta'));
importComponent("BatchTimePicker", () => require('../components/common/BatchTimePicker'));
importComponent("NavigationEventSender", () => require('../components/common/NavigationEventSender'));
importComponent("SingleColumnSection", () => require('../components/common/SingleColumnSection'));
importComponent("SectionTitle", () => require('../components/common/SectionTitle'));
importComponent("SectionSubtitle", () => require('../components/common/SectionSubtitle'));
importComponent("SubSection", () => require('../components/common/SubSection'));
importComponent("SectionFooter", () => require('../components/common/SectionFooter'));
importComponent("SectionButton", () => require('../components/common/SectionButton'));
importComponent("MetaInfo", () => require('../components/common/MetaInfo'));
importComponent("NoContent", () => require('../components/common/NoContent'));
importComponent("SearchBar", () => require('../components/common/SearchBar'));
importComponent("DialogGroup", () => require('../components/common/DialogGroup'));
importComponent("Divider", () => require('../components/common/Divider'));
importComponent("ErrorBoundary", () => require('../components/common/ErrorBoundary'));
importComponent("ErrorMessage", () => require('../components/common/ErrorMessage'));
importComponent("CloudinaryImage", () => require('../components/common/CloudinaryImage'));
importComponent("CloudinaryImage2", () => require('../components/common/CloudinaryImage2'));
importComponent("ContentItemBody", () => require('../components/common/ContentItemBody'));
importComponent("ContentItemTruncated", () => require('../components/common/ContentItemTruncated'));
importComponent("CompareRevisions", () => require('../components/revisions/CompareRevisions'));
importComponent("RevisionSelect", () => require('../components/revisions/RevisionSelect'));
importComponent("PostsRevisionSelect", () => require('../components/revisions/PostsRevisionSelect'));
importComponent("RevisionComparisonNotice", () => require('../components/revisions/RevisionComparisonNotice'));
importComponent("TagPageRevisionSelect", () => require('../components/revisions/TagPageRevisionSelect'));
importComponent("LWPopper", () => require('../components/common/LWPopper'));
importComponent("LWTooltip", () => require('../components/common/LWTooltip'));
importComponent("Typography", () => require('../components/common/Typography'));
importComponent("PopperCard", () => require('../components/common/PopperCard'));
importComponent("Footer", () => require('../components/common/Footer'));
importComponent("LoadMore", () => require('../components/common/LoadMore'));
importComponent("ReCaptcha", () => require('../components/common/ReCaptcha'));
importComponent("DefaultStyleFormGroup", () => require('../components/common/DefaultStyleFormGroup'))
importComponent("LinkCard", () => require('../components/common/LinkCard'));
importComponent("LWDialog", () => require('../components/common/LWDialog'));
importComponent("Error404", () => require('../components/common/Error404'));
importComponent("PermanentRedirect", () => require('../components/common/PermanentRedirect'));
importComponent("SeparatorBullet", () => require('../components/common/SeparatorBullet'));

importComponent("TabNavigationMenu", () => require('../components/common/TabNavigationMenu/TabNavigationMenu'));
importComponent("TabNavigationMenuFooter", () => require('../components/common/TabNavigationMenu/TabNavigationMenuFooter'));
importComponent("TabNavigationMenuCompressed", () => require('../components/common/TabNavigationMenu/TabNavigationMenuCompressed'));
importComponent("TabNavigationItem", () => require('../components/common/TabNavigationMenu/TabNavigationItem'));
importComponent("TabNavigationFooterItem", () => require('../components/common/TabNavigationMenu/TabNavigationFooterItem'));
importComponent("TabNavigationCompressedItem", () => require('../components/common/TabNavigationMenu/TabNavigationCompressedItem'));
importComponent("TabNavigationSubItem", () => require('../components/common/TabNavigationMenu/TabNavigationSubItem'));
importComponent("NavigationDrawer", () => require('../components/common/TabNavigationMenu/NavigationDrawer'));
importComponent("NavigationStandalone", () => require('../components/common/TabNavigationMenu/NavigationStandalone'));
importComponent("EventsList", () => require('../components/common/TabNavigationMenu/EventsList'));

importComponent("RecaptchaWarning", () => require('../components/common/RecaptchaWarning'));

importComponent("MixedTypeFeed", () => require('../components/common/MixedTypeFeed'));

// Outgoing RSS Feed builder
importComponent("SubscribeWidget", () => require('../components/common/SubscribeWidget'));
importComponent("SubscribeDialog", () => require('../components/common/SubscribeDialog'));

importComponent("HoverPreviewLink", () => require('../components/linkPreview/HoverPreviewLink'));
importComponent(["PostLinkPreview", "PostLinkCommentPreview", "PostLinkPreviewSequencePost", "PostLinkPreviewSlug", "PostLinkPreviewLegacy", "CommentLinkPreviewLegacy", "PostLinkPreviewWithPost", "PostCommentLinkPreviewGreaterWrong", "DefaultPreview", "MozillaHubPreview", "MetaculusPreview", "ArbitalPreview"], () => require('../components/linkPreview/PostLinkPreview'));
importComponent("LinkToPost", () => require('../components/linkPreview/LinkToPost'));

importComponent("ThemePickerMenu", () => require('../components/themes/ThemePickerMenu'));
importComponent("BannedNotice", () => require('../components/users/BannedNotice'));
importComponent("UsersMenu", () => require('../components/users/UsersMenu'));
importComponent("UsersEditForm", () => require('../components/users/UsersEditForm'));
importComponent("UsersAccount", () => require('../components/users/UsersAccount'));
importComponent("UsersAccountMenu", () => require('../components/users/UsersAccountMenu'));
importComponent("UsersProfile", () => require('../components/users/UsersProfile'));
importComponent("BookmarksPage", () => require('../components/posts/BookmarksPage'));
importComponent("BookmarksList", () => require('../components/posts/BookmarksList'));
importComponent("UsersName", () => require('../components/users/UsersName'));
importComponent("UsersNameWrapper", () => require('../components/users/UsersNameWrapper'));
importComponent("UsersNameDisplay", () => require('../components/users/UsersNameDisplay'));
importComponent("UsersSingle", () => require('../components/users/UsersSingle'));
importComponent("UsersEmailVerification", () => require('../components/users/UsersEmailVerification'));
importComponent("UsersViewABTests", () => require('../components/users/UsersViewABTests'));
importComponent("ViewSubscriptionsPage", () => require('../components/users/ViewSubscriptionsPage'));
importComponent("EmailConfirmationRequiredCheckbox", () => require('../components/users/EmailConfirmationRequiredCheckbox'));
importComponent("LoginPage", () => require('../components/users/LoginPage'));
importComponent("LoginPopupButton", () => require('../components/users/LoginPopupButton'));
importComponent("LoginPopup", () => require('../components/users/LoginPopup'));
importComponent("KarmaChangeNotifier", () => require('../components/users/KarmaChangeNotifier'));
importComponent("KarmaChangeNotifierSettings", () => require('../components/users/KarmaChangeNotifierSettings'));
importComponent("EmailTokenPage", () => require('../components/users/EmailTokenPage'));
importComponent("EmailTokenResult", () => require('../components/users/EmailTokenResult'));
importComponent("SignupSubscribeToCurated", () => require('../components/users/SignupSubscribeToCurated'));
importComponent("UserNameDeleted", () => require('../components/users/UserNameDeleted'));
importComponent("WrappedLoginForm", () => require('../components/users/WrappedLoginForm'));
importComponent("ResendVerificationEmailPage", () => require('../components/users/ResendVerificationEmailPage'));
importComponent("PasswordResetPage", () => require('../components/users/PasswordResetPage.tsx'))

importComponent("OmegaIcon", () => require('../components/icons/OmegaIcon'));
importComponent("SettingsButton", () => require('../components/icons/SettingsButton'));
importComponent("KarmaIcon", () => require('../components/icons/KarmaIcon.tsx'));

// posts

importComponent("PostsHighlight", () => require('../components/posts/PostsHighlight'));
importComponent("PostsListPlaceholder", () => require('../components/posts/PostsListPlaceholder'));
importComponent("AlignmentCrosspostMessage", () => require('../components/posts/AlignmentCrosspostMessage'));
importComponent("LegacyPostRedirect", () => require('../components/posts/LegacyPostRedirect'));
importComponent("LinkPostMessage", () => require('../components/posts/LinkPostMessage'));
importComponent("PostsSingle", () => require('../components/posts/PostsSingle'));
importComponent("PostsNoMore", () => require('../components/posts/PostsNoMore'));
importComponent("PostsNoResults", () => require('../components/posts/PostsNoResults'));
importComponent("PostsLoading", () => require('../components/posts/PostsLoading'));
importComponent("PostsTimeframeList", () => require('../components/posts/PostsTimeframeList'));
importComponent("AllPostsPage", () => require('../components/posts/AllPostsPage'));
importComponent("PostsListSettings", () => require('../components/posts/PostsListSettings'));
importComponent("SuggestCurated", () => require('../components/posts/SuggestCurated'));
importComponent("DeleteDraft", () => require('../components/posts/DeleteDraft'));
importComponent("BookmarkButton", () => require('../components/posts/BookmarkButton'));
importComponent("MoveToDraft", () => require('../components/posts/MoveToDraft'));
importComponent("SuggestAlignment", () => require('../components/posts/SuggestAlignment'));
importComponent("Pingback", () => require('../components/posts/Pingback'));
importComponent("PingbacksList", () => require('../components/posts/PingbacksList'));
importComponent("PostsItemMeta", () => require('../components/posts/PostsItemMeta'));
importComponent("PostsItem2", () => require('../components/posts/PostsItem2.tsx'));
importComponent("PostsListSortDropdown", () => require('../components/posts/PostsListSortDropdown.tsx'));
importComponent("PostsItemTooltipWrapper", () => require('../components/posts/PostsItemTooltipWrapper'));
importComponent("PostsItem2MetaInfo", () => require('../components/posts/PostsItem2MetaInfo'));
importComponent("PostsTitle", () => require('../components/posts/PostsTitle'));
importComponent("PostsPreviewTooltip", () => require('../components/posts/PostsPreviewTooltip'));
importComponent("PostsPreviewTooltipSingle", () => require('../components/posts/PostsPreviewTooltipSingle'));
importComponent("PostsItemComments", () => require('../components/posts/PostsItemComments'));
importComponent("PostsItemWrapper", () => require('../components/posts/PostsItemWrapper'));
importComponent("PostsItemKarma", () => require('../components/posts/PostsItemKarma.tsx'));
importComponent("PostsItemMetaInfo", () => require('../components/posts/PostsItemMetaInfo'));
importComponent("PostsItemNewCommentsWrapper", () => require('../components/posts/PostsItemNewCommentsWrapper'));
importComponent("PostsItemIcons", () => require('../components/posts/PostsItemIcons'));
importComponent("SpreadsheetPage", () => require('../components/posts/SpreadsheetPage'));
importComponent("PostsCompareRevisions", () => require('../components/posts/PostsCompareRevisions'));

importComponent("PostsSingleSlug", () => require('../components/posts/PostsSingleSlug'));
importComponent("PostsSingleRoute", () => require('../components/posts/PostsSingleRoute'));
importComponent("PostsList2", () => require('../components/posts/PostsList2'));
importComponent("PostsTimeBlock", () => require('../components/posts/PostsTimeBlock'));
importComponent("PostsCommentsThread", () => require('../components/posts/PostsCommentsThread'));
importComponent("PostsNewForm", () => require('../components/posts/PostsNewForm'));
importComponent("PostsEditForm", () => require('../components/posts/PostsEditForm'));
importComponent("PostsEditPage", () => require('../components/posts/PostsEditPage'));
importComponent("PostCollaborationEditor", () => require('../components/posts/PostCollaborationEditor'));


importComponent("PostsGroupDetails", () => require('../components/posts/PostsGroupDetails'));
importComponent("PostsStats", () => require('../components/posts/PostsStats'));
importComponent("PostsUserAndCoauthors", () => require('../components/posts/PostsUserAndCoauthors'));
importComponent("PostSubmit", () => require('../components/posts/PostSubmit'));
importComponent("SubmitToFrontpageCheckbox", () => require('../components/posts/SubmitToFrontpageCheckbox'));
importComponent("ReportPostMenuItem", () => require('../components/posts/ReportPostMenuItem'));
importComponent("PostsItemDate", () => require('../components/posts/PostsItemDate'));
importComponent("ElicitBlock", () => require('../components/posts/ElicitBlock'));

importComponent("UserPageTitle", () => require('../components/titles/UserPageTitle'));
importComponent("SequencesPageTitle", () => require('../components/titles/SequencesPageTitle'));
importComponent("PostsPageHeaderTitle", () => require('../components/titles/PostsPageTitle'));

importComponent("ShortformPage", () => require('../components/shortform/ShortformPage'));
importComponent("ShortformThreadList", () => require('../components/shortform/ShortformThreadList'));
importComponent("RepliesToCommentList", () => require('../components/shortform/RepliesToCommentList'));
importComponent("NewShortformDialog", () => require('../components/shortform/NewShortformDialog'));
importComponent("ShortformSubmitForm", () => require('../components/shortform/ShortformSubmitForm'));
importComponent("ShortformTimeBlock", () => require('../components/shortform/ShortformTimeBlock'));

importComponent("VoteButton", () => require('../components/votes/VoteButton'));
importComponent("SmallSideVote", () => require('../components/votes/SmallSideVote'));
importComponent("PostsVote", () => require('../components/votes/PostsVote'));

// Events
// In a past version, these `importComponent` definitions were skipped if the hasEvents
// setting wasn't set. This broke AF on, which doesn't have events in the sense that it
// doesn't have events on its sidebar, but can have events if they're moved from LessWrong.
// There's no actual benefit to gating these imports behind an if statement, anyways;
// the source files behind them are only executed if actually used on a page, and
// they aren't excluded from the bundle in any case.

importComponent("EventsPast", () => require('../components/posts/EventsPast'));
importComponent("EventsUpcoming", () => require('../components/posts/EventsUpcoming'));
importComponent("CommunityHome", () => require('../components/localGroups/CommunityHome'));
importComponent(["CommunityMap", "PersonalMapLocationMarkers"], () => require('../components/localGroups/CommunityMap'));
importComponent("CommunityMapFilter", () => require('../components/localGroups/CommunityMapFilter'));
importComponent("CommunityMapWrapper", () => require('../components/localGroups/CommunityMapWrapper'));
importComponent("SetPersonalMapLocationDialog", () => require('../components/localGroups/SetPersonalMapLocationDialog'));
importComponent("EventNotificationsDialog", () => require('../components/localGroups/EventNotificationsDialog'));
importComponent("StyledMapPopup", () => require('../components/localGroups/StyledMapPopup'));
importComponent("EventTime", () => require('../components/localGroups/EventTime'));
importComponent("EventVicinity", () => require('../components/localGroups/EventVicinity'));
importComponent("LocalGroupMarker", () => require('../components/localGroups/LocalGroupMarker'));
importComponent("LocalEventMarker", () => require('../components/localGroups/LocalEventMarker'));
importComponent("LocalGroupPage", () => require('../components/localGroups/LocalGroupPage'));
importComponent("LocalGroupSingle", () => require('../components/localGroups/LocalGroupSingle'));
importComponent("GroupFormLink", () => require('../components/localGroups/GroupFormLink'));
importComponent("SmallMapPreview", () => require('../components/localGroups/SmallMapPreview'));
importComponent("GroupLinks", () => require('../components/localGroups/GroupLinks'));
importComponent("LocalGroupsList", () => require('../components/localGroups/LocalGroupsList'));
importComponent("LocalGroupsItem", () => require('../components/localGroups/LocalGroupsItem'));
importComponent("TabNavigationEventsList", () => require('../components/localGroups/TabNavigationEventsList'));
importComponent("AllGroupsPage", () => require('../components/localGroups/AllGroupsPage'));
importComponent("GroupFormDialog", () => require('../components/localGroups/GroupFormDialog'));

importComponent("WalledGardenHome", () => require('../components/walledGarden/WalledGardenHome'));
importComponent("WalledGardenPortal", () => require('../components/walledGarden/WalledGardenPortal'));
importComponent("GardenEventDetails", () => require('../components/walledGarden/GardenEventDetails'));
importComponent("GardenCodesList", () => require('../components/walledGarden/GardenCodesList'));
importComponent("GardenCodesEditForm", () => require('../components/walledGarden/GardenCodesEditForm'));
importComponent("GardenCodesItem", () => require('../components/walledGarden/GardenCodesItem'));
importComponent("WalledGardenEvents", () => require('../components/walledGarden/WalledGardenEvents'));
importComponent("FrontpageGcalEventItem", () => require('../components/walledGarden/FrontpageGcalEventItem'));
importComponent("PortalBarGcalEventItem", () => require('../components/walledGarden/PortalBarGcalEventItem'));
importComponent("GardenCodeWidget", () => require('../components/walledGarden/GardenCodeWidget'));
importComponent("WalledGardenMessage", () => require('../components/walledGarden/WalledGardenMessage'));
importComponent("PomodoroWidget", () => require('../components/walledGarden/PomodoroWidget'));
importComponent("WalledGardenPortalBar", () => require('../components/walledGarden/WalledGardenPortalBar'));
importComponent("GatherTownIframeWrapper", () => require('../components/walledGarden/GatherTownIframeWrapper'));
importComponent("GatherTown", () => require('../components/walledGarden/GatherTown'));

// comments

importComponent("CommentsItem", () => require('../components/comments/CommentsItem/CommentsItem'));
importComponent("CommentUserName", () => require('../components/comments/CommentsItem/CommentUserName'));
importComponent("RetractCommentMenuItem", () => require('../components/comments/CommentActions/RetractCommentMenuItem'));
importComponent("MoveToAnswersMenuItem", () => require('../components/comments/CommentActions/MoveToAnswersMenuItem'));
importComponent("CommentsPermalinkMenuItem", () => require('../components/comments/CommentActions/CommentsPermalinkMenuItem'));
importComponent("CommentShortformIcon", () => require('../components/comments/CommentsItem/CommentShortformIcon'));
importComponent("BanUserFromPostMenuItem", () => require('../components/comments/CommentActions/BanUserFromPostMenuItem'));
importComponent("BanUserFromAllPostsMenuItem", () => require('../components/comments/CommentActions/BanUserFromAllPostsMenuItem'));
importComponent("BanUserFromAllPersonalPostsMenuItem", () => require('../components/comments/CommentActions/BanUserFromAllPersonalPostsMenuItem'));
importComponent("DeleteCommentMenuItem", () => require('../components/comments/CommentActions/DeleteCommentMenuItem'));
importComponent("DeleteCommentDialog", () => require('../components/comments/CommentActions/DeleteCommentDialog'));
importComponent("EditCommentMenuItem", () => require('../components/comments/CommentActions/EditCommentMenuItem'));
importComponent("ReportCommentMenuItem", () => require('../components/comments/CommentActions/ReportCommentMenuItem'));
importComponent("MoveToAlignmentMenuItem", () => require('../components/comments/CommentActions/MoveToAlignmentMenuItem'));
importComponent("SuggestAlignmentMenuItem", () => require('../components/comments/CommentActions/SuggestAlignmentMenuItem'));
importComponent("SubscribeToCommentMenuItem", () => require('../components/comments/CommentActions/SubscribeToCommentMenuItem'));
importComponent("CommentDeletedMetadata", () => require('../components/comments/CommentsItem/CommentDeletedMetadata'));
importComponent("CommentBody", () => require('../components/comments/CommentsItem/CommentBody'));
importComponent("CommentActions", () => require('../components/comments/CommentActions/CommentActions'));
importComponent("CommentsMenu", () => require('../components/comments/CommentsItem/CommentsMenu'));
importComponent("CommentOutdatedWarning", () => require('../components/comments/CommentsItem/CommentOutdatedWarning'));
importComponent("CommentsItemDate", () => require('../components/comments/CommentsItem/CommentsItemDate'));
importComponent("CommentBottomCaveats", () => require('../components/comments/CommentsItem/CommentBottomCaveats'));
importComponent("ToggleIsModeratorComment", () => require('../components/comments/CommentActions/ToggleIsModeratorComment'));

importComponent("AllComments", () => require('../components/comments/AllComments'));

importComponent("CommentWithReplies", () => require('../components/comments/CommentWithReplies'));
importComponent("CommentPermalink", () => require('../components/comments/CommentPermalink'));
importComponent("RecentDiscussionThread", () => require('../components/recentDiscussion/RecentDiscussionThread'));
importComponent("RecentDiscussionThreadsList", () => require('../components/recentDiscussion/RecentDiscussionThreadsList'));
importComponent("RecentDiscussionFeed", () => require('../components/recentDiscussion/RecentDiscussionFeed'));
importComponent("RecentDiscussionSubscribeReminder", () => require('../components/recentDiscussion/RecentDiscussionSubscribeReminder'));
importComponent("CantCommentExplanation", () => require('../components/comments/CantCommentExplanation'));
importComponent("CommentsEditForm", () => require('../components/comments/CommentsEditForm'));
importComponent("CommentsListSection", () => require('../components/comments/CommentsListSection'));
importComponent("CommentsList", () => require('../components/comments/CommentsList'));
importComponent("CommentsListMeta", () => require('../components/comments/CommentsListMeta'));
importComponent("CommentsNode", () => require('../components/comments/CommentsNode'));
importComponent("CommentFrame", () => require('../components/comments/CommentFrame'));
importComponent("CommentsViews", () => require('../components/comments/CommentsViews'));
importComponent("LegacyCommentRedirect", () => require('../components/comments/LegacyCommentRedirect'));
importComponent("RecentComments", () => require('../components/comments/RecentComments'));
importComponent("UserCommentsReplies", () => require('../components/comments/UserCommentsReplies'));

importComponent("ParentCommentSingle", () => require('../components/comments/ParentCommentSingle'));
importComponent("ModerationGuidelinesBox", () => require('../components/comments/ModerationGuidelines/ModerationGuidelinesBox'));
importComponent("ModerationGuidelinesEditForm", () => require('../components/comments/ModerationGuidelines/ModerationGuidelinesEditForm'))
importComponent("LastVisitList", () => require('../components/comments/LastVisitList'))
importComponent("CommentsNewForm", () => require('../components/comments/CommentsNewForm'));
importComponent("SingleLineComment", () => require('../components/comments/SingleLineComment'));
importComponent("ShowParentComment", () => require('../components/comments/ShowParentComment'));

importComponent("PostsListEditorSearchHit", () => require('../components/search/PostsListEditorSearchHit'));
importComponent("PostsSearchHit", () => require('../components/search/PostsSearchHit'));
importComponent("SearchAutoComplete", () => require('../components/search/SearchAutoComplete'));
importComponent("PostsSearchAutoComplete", () => require('../components/search/PostsSearchAutoComplete'));
importComponent("CommentsSearchHit", () => require('../components/search/CommentsSearchHit'));
importComponent("UsersSearchHit", () => require('../components/search/UsersSearchHit'));
importComponent("TagsSearchHit", () => require('../components/search/TagsSearchHit'));
importComponent("SequencesSearchHit", () => require('../components/search/SequencesSearchHit'));
importComponent("SequencesSearchAutoComplete", () => require('../components/search/SequencesSearchAutoComplete'));
importComponent("UsersSearchAutoComplete", () => require('../components/search/UsersSearchAutoComplete'));
importComponent("UsersAutoCompleteHit", () => require('../components/search/UsersAutoCompleteHit'));
importComponent("UsersSearchInput", () => require('../components/search/UsersSearchInput'));
importComponent("SearchBarResults", () => require('../components/search/SearchBarResults'));
importComponent("SearchPagination", () => require('../components/search/SearchPagination'));
importComponent("SearchPage", () => require('../components/search/SearchPage'));

importComponent("MigrationsDashboard", () => require('../components/admin/migrations/MigrationsDashboard'));
importComponent("MigrationsDashboardRow", () => require('../components/admin/migrations/MigrationsDashboardRow'));
importComponent("AdminHome", () => require('../components/admin/AdminHome'));
importComponent("AdminMetadata", () => require('../components/admin/AdminMetadata'));
importComponent("ModerationLog", () => require('../components/sunshineDashboard/ModerationLog'));
importComponent("ReportForm", () => require('../components/sunshineDashboard/ReportForm'));
importComponent("SunshineCommentsItemOverview", () => require('../components/sunshineDashboard/SunshineCommentsItemOverview'));
importComponent("AFSuggestCommentsItem", () => require('../components/sunshineDashboard/AFSuggestCommentsItem'));
importComponent("AFSuggestCommentsList", () => require('../components/sunshineDashboard/AFSuggestCommentsList'));
importComponent("AFSuggestPostsItem", () => require('../components/sunshineDashboard/AFSuggestPostsItem'));
importComponent("AFSuggestPostsList", () => require('../components/sunshineDashboard/AFSuggestPostsList'));
importComponent("AFSuggestUsersItem", () => require('../components/sunshineDashboard/AFSuggestUsersItem'));
importComponent("AFSuggestUsersList", () => require('../components/sunshineDashboard/AFSuggestUsersList'));
importComponent("SunshineNewUserPostsList", () => require('../components/sunshineDashboard/SunshineNewUserPostsList'));
importComponent("SunshineNewUserCommentsList", () => require('../components/sunshineDashboard/SunshineNewUserCommentsList'));
importComponent("SunshineNewUsersItem", () => require('../components/sunshineDashboard/SunshineNewUsersItem'));
importComponent("SunshineNewUsersInfo", () => require('../components/sunshineDashboard/SunshineNewUsersInfo'));
importComponent("SunshineNewUsersList", () => require('../components/sunshineDashboard/SunshineNewUsersList'));
importComponent("SunshineNewUsersProfileInfo", () => require('../components/sunshineDashboard/SunshineNewUsersProfileInfo'));
importComponent("SunshineNewPostsList", () => require('../components/sunshineDashboard/SunshineNewPostsList'));
importComponent("SunshineNewPostsItem", () => require('../components/sunshineDashboard/SunshineNewPostsItem'));
importComponent("SunshineNewCommentsItem", () => require('../components/sunshineDashboard/SunshineNewCommentsItem'));
importComponent("CommentKarmaWithPreview", () => require('../components/sunshineDashboard/CommentKarmaWithPreview'));
importComponent("PostKarmaWithPreview", () => require('../components/sunshineDashboard/PostKarmaWithPreview'));
importComponent("SunshineNewCommentsList", () => require('../components/sunshineDashboard/SunshineNewCommentsList'));
importComponent("SunshineReportedContentList", () => require('../components/sunshineDashboard/SunshineReportedContentList'));
importComponent("SunshineReportedItem", () => require('../components/sunshineDashboard/SunshineReportedItem'));
importComponent("SunshineCuratedSuggestionsItem", () => require('../components/sunshineDashboard/SunshineCuratedSuggestionsItem'));
importComponent("SunshineCuratedSuggestionsList", () => require('../components/sunshineDashboard/SunshineCuratedSuggestionsList'));
importComponent("SunshineNewTagsList", () => require('../components/sunshineDashboard/SunshineNewTagsList'));
importComponent("SunshineNewTagsItem", () => require('../components/sunshineDashboard/SunshineNewTagsItem'));
importComponent("SunshineSidebar", () => require('../components/sunshineDashboard/SunshineSidebar'));
importComponent("SunshineListTitle", () => require('../components/sunshineDashboard/SunshineListTitle'));
importComponent("SunshineListItem", () => require('../components/sunshineDashboard/SunshineListItem'));
importComponent("SidebarHoverOver", () => require('../components/sunshineDashboard/SidebarHoverOver'));
importComponent("SidebarInfo", () => require('../components/sunshineDashboard/SidebarInfo'));
importComponent("SidebarActionMenu", () => require('../components/sunshineDashboard/SidebarActionMenu'));
importComponent("SidebarAction", () => require('../components/sunshineDashboard/SidebarAction'));
importComponent("SunshineListCount", () => require('../components/sunshineDashboard/SunshineListCount'));
importComponent(["EmailHistory", "EmailHistoryPage"], () => require('../components/sunshineDashboard/EmailHistory'));

importComponent("AddTag", () => require('../components/tagging/AddTag'));
importComponent("NewTagsList", () => require('../components/tagging/NewTagsList'));
importComponent("AddTagButton", () => require('../components/tagging/AddTagButton'));
importComponent("CoreTagsChecklist", () => require('../components/tagging/CoreTagsChecklist'));
importComponent("TagPage", () => require('../components/tagging/TagPage'));
importComponent("TagPageTitle", () => require('../components/tagging/TagPageTitle'));
importComponent("AddPostsToTag", () => require('../components/tagging/AddPostsToTag'));
importComponent("FooterTagList", () => require('../components/tagging/FooterTagList'));
importComponent("FooterTag", () => require('../components/tagging/FooterTag'));
importComponent("NewTagPage", () => require('../components/tagging/NewTagPage'));
importComponent("EditTagPage", () => require('../components/tagging/EditTagPage'));
importComponent("EditTagsDialog", () => require('../components/tagging/EditTagsDialog'));
importComponent("AllTagsPage", () => require('../components/tagging/AllTagsPage'));
importComponent("AllTagsAlphabetical", () => require('../components/tagging/AllTagsAlphabetical'));
importComponent("TagRelevanceButton", () => require('../components/tagging/TagRelevanceButton'));
importComponent("WikiGradeDisplay", () => require('../components/tagging/WikiGradeDisplay'));
importComponent("TaggingDashboard", () => require('../components/tagging/TaggingDashboard'));
importComponent("TagFlagEditAndNewForm", () => require('../components/tagging/TagFlagEditAndNewForm'));
importComponent("TagFlagItem", () => require('../components/tagging/TagFlagItem'));
importComponent("TagDiscussionSection", () => require('../components/tagging/TagDiscussionSection'));
importComponent("TagDiscussionButton", () => require('../components/tagging/TagDiscussionButton'));
importComponent("TagCTAPopup", () => require('../components/tagging/TagCTAPopup'));


importComponent("TagsListItem", () => require('../components/tagging/TagsListItem'));
importComponent("ChangeMetricsDisplay", () => require('../components/tagging/ChangeMetricsDisplay'));
importComponent("NewTagItem", () => require('../components/tagging/NewTagItem'));
importComponent("TagRevisionItem", () => require('../components/tagging/TagRevisionItem'));
importComponent("TagRevisionItemShortMetadata", () => require('../components/tagging/TagRevisionItemShortMetadata'));
importComponent("TagRevisionItemFullMetadata", () => require('../components/tagging/TagRevisionItemFullMetadata'));
importComponent("TagsDetailsItem", () => require('../components/tagging/TagsDetailsItem'));
importComponent("TagCompareRevisions", () => require('../components/tagging/TagCompareRevisions'));
importComponent("TagDiscussionPage", () => require('../components/tagging/TagDiscussionPage'));
importComponent("TagDiscussion", () => require('../components/tagging/TagDiscussion'));
importComponent("TagFilterSettings", () => require('../components/tagging/TagFilterSettings'));
importComponent("FilterMode", () => require('../components/tagging/FilterMode'));
importComponent("TagPreview", () => require('../components/tagging/TagPreview'));
importComponent("TagPreviewDescription", () => require('../components/tagging/TagPreviewDescription'));
importComponent("TagHoverPreview", () => require('../components/tagging/TagHoverPreview'));
importComponent("TagRelCard", () => require('../components/tagging/TagRelCard'));
importComponent("TagSearchHit", () => require('../components/tagging/TagSearchHit'));
importComponent("TagVoteActivity", () => require('../components/tagging/TagVoteActivity'));
importComponent("PostsItemTagRelevance", () => require('../components/tagging/PostsItemTagRelevance'));
importComponent("TagSmallPostLink", () => require('../components/tagging/TagSmallPostLink'));
importComponent("RecentDiscussionTag", () => require('../components/recentDiscussion/RecentDiscussionTag'));
importComponent("TagHistoryPage", () => require('../components/tagging/history/TagHistoryPage'));
importComponent("TagActivityFeed", () => require('../components/tagging/TagActivityFeed'));
importComponent("TagProgressBar", () => require('../components/tagging/TagProgressBar'));

// SequenceEditor
importComponent("EditSequenceTitle", () => require('../components/sequenceEditor/EditSequenceTitle'));

// Sequences
importComponent("SequencesPage", () => require('../components/sequences/SequencesPage'));
importComponent("SequencesPostsList", () => require('../components/sequences/SequencesPostsList'));
importComponent("SequencesSingle", () => require('../components/sequences/SequencesSingle'));
importComponent("SequencesEditForm", () => require('../components/sequences/SequencesEditForm'));
importComponent("SequencesNewForm", () => require('../components/sequences/SequencesNewForm'));
importComponent("SequencesHome", () => require('../components/sequences/SequencesHome'));
importComponent("SequencesGrid", () => require('../components/sequences/SequencesGrid'));
importComponent("SequencesGridWrapper", () => require('../components/sequences/SequencesGridWrapper'));
importComponent("SequenceTooltip", () => require('../components/sequences/SequenceTooltip'));
importComponent("SequencesNavigationLink", () => require('../components/sequences/SequencesNavigationLink'));
importComponent("SequencesNewButton", () => require('../components/sequences/SequencesNewButton'));
importComponent("BottomNavigation", () => require('../components/sequences/BottomNavigation'));
importComponent("BottomNavigationItem", () => require('../components/sequences/BottomNavigationItem'));
importComponent("SequencesPost", () => require('../components/sequences/SequencesPost'));
importComponent("SequencesGridItem", () => require('../components/sequences/SequencesGridItem'));
importComponent("ChaptersItem", () => require('../components/sequences/ChaptersItem'));
importComponent("ChaptersList", () => require('../components/sequences/ChaptersList'));
importComponent("ChaptersEditForm", () => require('../components/sequences/ChaptersEditForm'));
importComponent("ChaptersNewForm", () => require('../components/sequences/ChaptersNewForm'));
importComponent("CollectionsSingle", () => require('../components/sequences/CollectionsSingle'));
importComponent("CollectionsPage", () => require('../components/sequences/CollectionsPage'));
importComponent("CollectionsEditForm", () => require('../components/sequences/CollectionsEditForm'));
importComponent("BooksNewForm", () => require('../components/sequences/BooksNewForm'));
importComponent("BooksEditForm", () => require('../components/sequences/BooksEditForm'));
importComponent("BooksItem", () => require('../components/sequences/BooksItem'));
importComponent("CoreReading", () => require('../components/sequences/CoreReading'));
importComponent("CollectionsCardContainer", () => require('../components/collections/CollectionsCardContainer'));
importComponent("CollectionsCard", () => require('../components/collections/CollectionsCard'));
importComponent("BigCollectionsCard", () => require('../components/collections/BigCollectionsCard'));
importComponent("CoreSequences", () => require('../components/sequences/CoreSequences'));
importComponent("HPMOR", () => require('../components/sequences/HPMOR'));
importComponent("Codex", () => require('../components/sequences/Codex'));

importComponent("PostsListEditor", () => require('../components/form-components/PostsListEditor'));
importComponent("ImageUpload", () => require('../components/form-components/ImageUpload'));
importComponent("SequencesListEditor", () => require('../components/form-components/SequencesListEditor'));
importComponent("SequencesListEditorItem", () => require('../components/form-components/SequencesListEditorItem'));
importComponent("SubmitButton", () => require('../components/form-components/SubmitButton'));
importComponent("FormSubmit", () => require('../components/form-components/FormSubmit'));
importComponent("SingleUsersItem", () => require('../components/form-components/SingleUsersItem'));
importComponent("SingleUsersItemWrapper", () => require('../components/form-components/SingleUsersItemWrapper'));
importComponent("UsersListEditor", () => require('../components/form-components/UsersListEditor'));
importComponent("MuiInput", () => require('../components/form-components/MuiInput'));
importComponent("LocationFormComponent", () => require('../components/form-components/LocationFormComponent'));
importComponent("MuiTextField", () => require('../components/form-components/MuiTextField'));
importComponent("MultiSelectButtons", () => require('../components/form-components/MultiSelectButtons'));
importComponent("FormComponentCheckbox", () => require('../components/form-components/FormComponentCheckbox'));
importComponent("FormComponentRadioGroup", () => require('../components/form-components/FormComponentRadioGroup'));
importComponent("SectionFooterCheckbox", () => require('../components/form-components/SectionFooterCheckbox'));
importComponent("FormComponentDefault", () => require('../components/form-components/FormComponentDefault'));
importComponent("FormComponentSelect", () => require('../components/form-components/FormComponentSelect'));
importComponent("FormComponentDate", () => require('../components/form-components/FormComponentDate'));
importComponent("FormComponentDateTime", () => require('../components/form-components/FormComponentDateTime'));
importComponent("FormComponentNumber", () => require('../components/form-components/FormComponentNumber'));
importComponent("WrappedSmartForm", () => require('../components/form-components/WrappedSmartForm'));
importComponent("ManageSubscriptionsLink", () => require('../components/form-components/ManageSubscriptionsLink'));
importComponent("TagFlagToggleList", () => require('../components/form-components/TagFlagToggleList'));

importComponent("PetrovDayWrapper", () => require('../components/seasonal/PetrovDayWrapper'));
importComponent("PetrovDayButton", () => require('../components/seasonal/PetrovDayButton'));
importComponent("PetrovDayLossScreen", () => require('../components/seasonal/PetrovDayLossScreen'));
importComponent("CoronavirusFrontpageWidget", () => require('../components/seasonal/CoronavirusFrontpageWidget'));

importComponent("AFApplicationForm", () => require('../components/alignment-forum/AFApplicationForm'));

importComponent("NewQuestionDialog", () => require('../components/questions/NewQuestionDialog'));
importComponent("NewRelatedQuestionForm", () => require('../components/questions/NewRelatedQuestionForm'));
importComponent("NewAnswerForm", () => require('../components/questions/NewAnswerForm'));
importComponent("PostsPageQuestionContent", () => require('../components/questions/PostsPageQuestionContent'));
importComponent("NewAnswerCommentQuestionForm", () => require('../components/questions/NewAnswerCommentQuestionForm'));
importComponent("AnswerCommentsList", () => require('../components/questions/AnswerCommentsList'));
importComponent("AnswersList", () => require('../components/questions/AnswersList'));
importComponent("Answer", () => require('../components/questions/Answer'));
importComponent("QuestionsPage", () => require('../components/questions/QuestionsPage'));
importComponent("RelatedQuestionsList", () => require('../components/questions/RelatedQuestionsList'));

importComponent("ConfigurableRecommendationsList", () => require('../components/recommendations/ConfigurableRecommendationsList'));
importComponent("ContinueReadingList", () => require('../components/recommendations/ContinueReadingList'));
importComponent("RecommendationsAlgorithmPicker", () => require('../components/recommendations/RecommendationsAlgorithmPicker'));
importComponent("RecommendationsList", () => require('../components/recommendations/RecommendationsList'));
importComponent("RecommendationsPage", () => require('../components/recommendations/RecommendationsPage'));
importComponent("RecommendationsAndCurated", () => require('../components/recommendations/RecommendationsAndCurated'));

// 2018 Review Components
importComponent("FrontpageNominationPhase", () => require('../components/review/FrontpageNominationPhase'));
importComponent("FrontpageReviewPhase", () => require('../components/review/FrontpageReviewPhase'));
importComponent("FrontpageVotingPhase", () => require('../components/review/FrontpageVotingPhase'));
importComponent("Nominations2018", () => require('../components/review/Nominations2018'));
importComponent("Nominations2019", () => require('../components/review/Nominations2019'));
importComponent("Reviews2018", () => require('../components/review/Reviews2018'));
importComponent("Reviews2019", () => require('../components/review/Reviews2019'));
importComponent("ReviewPostButton", () => require('../components/review/ReviewPostButton'));
importComponent("ReviewPostForm", () => require('../components/review/ReviewPostForm'));
importComponent("NominatePostMenuItem", () => require('../components/review/NominatePostMenuItem'));
importComponent("NominatePostDialog", () => require('../components/review/NominatePostDialog'));
importComponent("UserReviews", () => require('../components/review/UserReviews'));
importComponent("PostReviewsAndNominations", () => require('../components/review/PostReviewsAndNominations'));
importComponent("BookCheckout", () => require('../components/review/BookCheckout'));
importComponent("ReviewVotingPage", () => require('../components/review/ReviewVotingPage'))
importComponent("ReactionsButton", () => require('../components/review/ReactionsButton'))
importComponent("QuadraticVotingButtons", () => require('../components/review/QuadraticVotingButtons'))
importComponent("ReviewVoteTableRow", () => require('../components/review/ReviewVoteTableRow'))
importComponent("ReviewVotingButtons", () => require('../components/review/ReviewVotingButtons'))

// Analytics Tracking
importComponent("AnalyticsTracker", () => require('../components/common/AnalyticsTracker'));
importComponent("AnalyticsInViewTracker", () => require('../components/common/AnalyticsInViewTracker'));
importComponent("AnalyticsPageInitializer", () => require('../components/common/AnalyticsPageInitializer'));

// vulcan:ui-bootstrap
importComponent("FormComponentCheckboxGroup", () => require('../components/vulcan-ui-bootstrap/forms/Checkboxgroup'));
importComponent("FormComponentEmail", () => require('../components/vulcan-ui-bootstrap/forms/Email'));
importComponent("FormComponentInner", () => require('../components/vulcan-ui-bootstrap/forms/FormComponentInner'));
importComponent("FormControl", () => require('../components/vulcan-ui-bootstrap/forms/FormControl'));
importComponent("FormElement", () => require('../components/vulcan-ui-bootstrap/forms/FormElement'));
importComponent("FormItem", () => require('../components/vulcan-ui-bootstrap/forms/FormItem'));
importComponent("FormComponentTextarea", () => require('../components/vulcan-ui-bootstrap/forms/Textarea'));
importComponent("FormComponentUrl", () => require('../components/vulcan-ui-bootstrap/forms/Url'));
importComponent("Alert", () => require('../components/vulcan-ui-bootstrap/ui/Alert'));
importComponent("Button", () => require('../components/vulcan-ui-bootstrap/ui/Button'));

// Review Book related components
importComponent("BookLanding", () => require('../components/books/BookLanding'));
importComponent("BookAnimation", () => require('../components/books/BookAnimation'));
importComponent("BookFrontpageWidget", () => require('../components/books/BookFrontpageWidget'));
