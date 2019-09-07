import { getSetting } from 'meteor/vulcan:core';
import { importComponent } from 'meteor/vulcan:lib';

if(getSetting('forumType') === 'AlignmentForum') {
  // HACK: At the top of the file because DeepScan false-positively warns about
  // imports not at top level, and it re-detects it every time the line number
  // changes. Putting it at the top makes its line number stable.
  importComponent("AlignmentForumHome", () => require('../components/alignment-forum/AlignmentForumHome.jsx'));
}

if (getSetting('forumType') === 'EAForum') {
  importComponent("EAHome", () => require('../components/ea-forum/EAHome'));
}

importComponent("ConversationTitleEditForm", () => require('../components/messaging/ConversationTitleEditForm.jsx'));
importComponent("ConversationDetails", () => require('../components/messaging/ConversationDetails.jsx'));
importComponent("ConversationItem", () => require('../components/messaging/ConversationItem.jsx'));
importComponent("ConversationWrapper", () => require('../components/messaging/ConversationWrapper.jsx'));
importComponent("ConversationPage", () => require('../components/messaging/ConversationPage.jsx'));
importComponent("MessageItem", () => require('../components/messaging/MessageItem.jsx'));
importComponent("InboxWrapper", () => require('../components/messaging/InboxWrapper.jsx'));
importComponent("InboxNavigation", () => require('../components/messaging/InboxNavigation.jsx'));
importComponent("NewConversationButton", () => require('../components/messaging/NewConversationButton.jsx'));
importComponent("EditorFormComponent", () => require('../components/editor/EditorFormComponent.jsx'));
importComponent("EditTitle", () => require('../components/editor/EditTitle.jsx'));
importComponent("EditUrl", () => require('../components/editor/EditUrl.jsx'));

// RSS Feed Integration
importComponent("newFeedButton", () => require('../components/feeds/newFeedButton.jsx'));
importComponent("editFeedButton", () => require('../components/feeds/editFeedButton.jsx'));

importComponent("NotificationsMenu", () => require('../components/notifications/NotificationsMenu.jsx'));
importComponent("NotificationsList", () => require('../components/notifications/NotificationsList.jsx'));
importComponent("NotificationsItem", () => require('../components/notifications/NotificationsItem.jsx'));
importComponent("NotificationsMenuButton", () => require('../components/notifications/NotificationsMenuButton.jsx'));
importComponent("SubscribeTo", () => require('../components/notifications/SubscribeTo.jsx'));

importComponent("Layout", () => require('../components/Layout.jsx'));

importComponent("CalendarDate", () => require('../components/common/CalendarDate.jsx'));
importComponent("FormatDate", () => require('../components/common/FormatDate.jsx'));
importComponent("BetaTag", () => require('../components/common/BetaTag.jsx'));
importComponent("FlashMessages", () => require('../components/common/FlashMessages.jsx'));
importComponent("Header", () => require('../components/common/Header.jsx'));
importComponent("HeaderSubtitle", () => require('../components/common/HeaderSubtitle.jsx'));
importComponent("HeadTags", () => require('../components/common/HeadTags.jsx'));
importComponent("Home2", () => require('../components/common/Home2.jsx'));
importComponent("HomeLatestPosts", () => require('../components/common/HomeLatestPosts'));
importComponent("Meta", () => require('../components/common/Meta.jsx'));
importComponent("AllComments", () => require('../components/common/AllComments.jsx'));
importComponent("SingleColumnSection", () => require('../components/common/SingleColumnSection'));
importComponent("SectionTitle", () => require('../components/common/SectionTitle.jsx'));
importComponent("SectionSubtitle", () => require('../components/common/SectionSubtitle.jsx'));
importComponent("SubSection", () => require('../components/common/SubSection.jsx'));
importComponent("SectionFooter", () => require('../components/common/SectionFooter.jsx'));
importComponent("SectionButton", () => require('../components/common/SectionButton.jsx'));
importComponent("MetaInfo", () => require('../components/common/MetaInfo.jsx'));
importComponent("NoContent", () => require('../components/common/NoContent.jsx'));
importComponent("SearchBar", () => require('../components/common/SearchBar.jsx'));
importComponent("DialogGroup", () => require('../components/common/DialogGroup.jsx'));
importComponent("Divider", () => require('../components/common/Divider.jsx'));
importComponent("HoverOver", () => require('../components/common/HoverOver.jsx'));
importComponent("ErrorBoundary", () => require('../components/common/ErrorBoundary.jsx'));
importComponent("CloudinaryImage", () => require('../components/common/CloudinaryImage.jsx'));
importComponent("ContentItemBody", () => require('../components/common/ContentItemBody.jsx'));
importComponent("LWPopper", () => require('../components/common/LWPopper.jsx'));
importComponent("Footer", () => require('../components/common/Footer.jsx'));
importComponent("LoadMore", () => require('../components/common/LoadMore.jsx'));
importComponent("ReCaptcha", () => require('../components/common/ReCaptcha.jsx'));
importComponent("DefaultStyleFormGroup", () => require('../components/common/DefaultStyleFormGroup.jsx'))
importComponent("LinkCard", () => require('../components/common/LinkCard.jsx'));
importComponent("Error404", () => require('../components/common/Error404.jsx'));
importComponent("PermanentRedirect", () => require('../components/common/PermanentRedirect.jsx'));

importComponent("TabNavigationMenu", () => require('../components/common/TabNavigationMenu/TabNavigationMenu.jsx'));
import '../components/common/TabNavigationMenu/TabNavigationMenuFooter.jsx';
import '../components/common/TabNavigationMenu/TabNavigationMenuCompressed.jsx';
import '../components/common/TabNavigationMenu/TabNavigationItem.jsx';
import '../components/common/TabNavigationMenu/TabNavigationFooterItem.jsx';
import '../components/common/TabNavigationMenu/TabNavigationCompressedItem.jsx';
importComponent("TabNavigationSubItem", () => require('../components/common/TabNavigationMenu/TabNavigationSubItem.jsx'));
import '../components/common/TabNavigationMenu/NavigationDrawer.jsx';
import '../components/common/TabNavigationMenu/NavigationStandalone.jsx';

// Outgoing RSS Feed builder
importComponent("SubscribeWidget", () => require('../components/common/SubscribeWidget.jsx'));
importComponent("SubscribeDialog", () => require('../components/common/SubscribeDialog.jsx'));

importComponent("HoverPreviewLink", () => require('../components/linkPreview/HoverPreviewLink.jsx'));
importComponent(["PostLinkPreview", "PostLinkCommentPreview", "PostLinkPreviewSequencePost", "PostLinkPreviewSlug", "PostLinkPreviewLegacy", "PostLinkPreviewWithPost", "DefaultPreview"], () => require('../components/linkPreview/PostLinkPreview.jsx'));

importComponent("AccountsVerifyEmail", () => require('../components/users/AccountsVerifyEmail.jsx'));
importComponent("AccountsEnrollAccount", () => require('../components/users/EnrollAccount.jsx'));
importComponent("UsersMenu", () => require('../components/users/UsersMenu.jsx'));
importComponent("UsersEditForm", () => require('../components/users/UsersEditForm.jsx'));
importComponent("UsersAccount", () => require('../components/users/UsersAccount.jsx'));
importComponent("UsersAccountMenu", () => require('../components/users/UsersAccountMenu.jsx'));
importComponent("UsersProfile", () => require('../components/users/UsersProfile.jsx'));
importComponent("UsersName", () => require('../components/users/UsersName.jsx'));
importComponent("UsersNameWrapper", () => require('../components/users/UsersNameWrapper.jsx'));
importComponent("UsersNameDisplay", () => require('../components/users/UsersNameDisplay.jsx'));
importComponent("UsersSingle", () => require('../components/users/UsersSingle.jsx'));
importComponent("UsersEmailVerification", () => require('../components/users/UsersEmailVerification.jsx'));
importComponent("EmailConfirmationRequiredCheckbox", () => require('../components/users/EmailConfirmationRequiredCheckbox.jsx'));
importComponent("LoginPage", () => require('../components/users/LoginPage.jsx'));
importComponent("LoginPopupButton", () => require('../components/users/LoginPopupButton.jsx'));
importComponent("LoginPopup", () => require('../components/users/LoginPopup.jsx'));
importComponent("KarmaChangeNotifier", () => require('../components/users/KarmaChangeNotifier.jsx'));
importComponent("KarmaChangeNotifierSettings", () => require('../components/users/KarmaChangeNotifierSettings.jsx'));
importComponent("AccountsResetPassword", () => require('../components/users/AccountsResetPassword.jsx'));
importComponent("EmailTokenPage", () => require('../components/users/EmailTokenPage.jsx'));
importComponent("EmailTokenResult", () => require('../components/users/EmailTokenResult.jsx'));
importComponent("SignupSubscribeToCurated", () => require('../components/users/SignupSubscribeToCurated.jsx'));
importComponent("UserNameDeleted", () => require('../components/users/UserNameDeleted.jsx'));
importComponent("WrappedLoginForm", () => require('../components/users/WrappedLoginForm.jsx'));
importComponent("ResendVerificationEmailPage", () => require('../components/users/ResendVerificationEmailPage.jsx'));

importComponent("OmegaIcon", () => require('../components/icons/OmegaIcon.jsx'));
importComponent("SettingsIcon", () => require('../components/icons/SettingsIcon.jsx'));

// posts

importComponent("PostsHighlight", () => require('../components/posts/PostsHighlight.jsx'));
importComponent("AlignmentCrosspostMessage", () => require('../components/posts/AlignmentCrosspostMessage.jsx'));
importComponent("LegacyPostRedirect", () => require('../components/posts/LegacyPostRedirect.jsx'));
importComponent("LinkPostMessage", () => require('../components/posts/LinkPostMessage.jsx'));
importComponent("CategoryDisplay", () => require('../components/posts/CategoryDisplay.jsx'));
importComponent("PostsSingle", () => require('../components/posts/PostsSingle.jsx'));
importComponent("PostsNoMore", () => require('../components/posts/PostsNoMore.jsx'));
importComponent("PostsNoResults", () => require('../components/posts/PostsNoResults.jsx'));
importComponent("PostsLoading", () => require('../components/posts/PostsLoading.jsx'));
importComponent("PostsTimeframeList", () => require('../components/posts/PostsTimeframeList.jsx'));
importComponent("AllPostsPage", () => require('../components/posts/AllPostsPage.jsx'));
importComponent("PostsListSettings", () => require('../components/posts/PostsListSettings.jsx'));
importComponent("SuggestCurated", () => require('../components/posts/SuggestCurated.jsx'));
importComponent("DeleteDraft", () => require('../components/posts/DeleteDraft.jsx'));
importComponent("MoveToDraft", () => require('../components/posts/MoveToDraft.jsx'));
importComponent("SuggestAlignment", () => require('../components/posts/SuggestAlignment.jsx'));
importComponent("PostsItemMeta", () => require('../components/posts/PostsItemMeta.jsx'));
importComponent("PostsItem2", () => require('../components/posts/PostsItem2.jsx'));
importComponent("PostsItem2MetaInfo", () => require('../components/posts/PostsItem2MetaInfo.jsx'));
importComponent("PostsTitle", () => require('../components/posts/PostsTitle.jsx'));
importComponent("PostsItemTooltip", () => require('../components/posts/PostsItemTooltip.jsx'));
importComponent("PostsItemComments", () => require('../components/posts/PostsItemComments.jsx'));
importComponent("PostsItemWrapper", () => require('../components/posts/PostsItemWrapper.jsx'));
importComponent("PostsItemKarma", () => require('../components/posts/PostsItemKarma.jsx'));
importComponent("PostsItemMetaInfo", () => require('../components/posts/PostsItemMetaInfo.jsx'));
importComponent("PostsItemNewCommentsWrapper", () => require('../components/posts/PostsItemNewCommentsWrapper.jsx'));
importComponent("PostsItemIcons", () => require('../components/posts/PostsItemIcons.jsx'));
import '../components/posts/PostsPage';
importComponent("PostsSingleSlug", () => require('../components/posts/PostsSingleSlug.jsx'));
importComponent("PostsSingleRoute", () => require('../components/posts/PostsSingleRoute.jsx'));
importComponent("PostsList2", () => require('../components/posts/PostsList2.jsx'));
importComponent("PostsTimeBlock", () => require('../components/posts/PostsTimeBlock.jsx'));
importComponent("PostsCommentsThread", () => require('../components/posts/PostsCommentsThread.jsx'));
importComponent("PostsNewForm", () => require('../components/posts/PostsNewForm.jsx'));
importComponent("PostsEditForm", () => require('../components/posts/PostsEditForm.jsx'));
importComponent("PostsEditPage", () => require('../components/posts/PostsEditPage.jsx'));
importComponent("PostsGroupDetails", () => require('../components/posts/PostsGroupDetails.jsx'));
importComponent("PostsStats", () => require('../components/posts/PostsStats.jsx'));
import '../components/posts/TableOfContents';
importComponent("ShowOrHideHighlightButton", () => require('../components/posts/ShowOrHideHighlightButton.jsx'));
importComponent("PostsUserAndCoauthors", () => require('../components/posts/PostsUserAndCoauthors.jsx'));
importComponent("PostSubmit", () => require('../components/posts/PostSubmit.jsx'));
importComponent("SubmitToFrontpageCheckbox", () => require('../components/posts/SubmitToFrontpageCheckbox.jsx'));
importComponent("ReportPostMenuItem", () => require('../components/posts/ReportPostMenuItem.jsx'));
importComponent("PostsItemDate", () => require('../components/posts/PostsItemDate.jsx'));

importComponent("UserPageTitle", () => require('../components/titles/UserPageTitle.jsx'));
importComponent("SequencesPageTitle", () => require('../components/titles/SequencesPageTitle.jsx'));
importComponent("PostsPageHeaderTitle", () => require('../components/titles/PostsPageTitle.jsx'));

importComponent("ShortformPage", () => require('../components/shortform/ShortformPage.jsx'));
importComponent("ShortformThreadList", () => require('../components/shortform/ShortformThreadList.jsx'));
importComponent("RepliesToCommentList", () => require('../components/shortform/RepliesToCommentList.jsx'));
importComponent("NewShortformDialog", () => require('../components/shortform/NewShortformDialog.jsx'));
importComponent("ShortformSubmitForm", () => require('../components/shortform/ShortformSubmitForm.jsx'));
importComponent("ShortformTimeBlock", () => require('../components/shortform/ShortformTimeBlock.jsx'));

importComponent("VoteButton", () => require('../components/votes/VoteButton.jsx'));
importComponent("CommentsVote", () => require('../components/votes/CommentsVote.jsx'));
importComponent("PostsVote", () => require('../components/votes/PostsVote.jsx'));

// events

if (getSetting('hasEvents', true)) {
  importComponent("EventsPast", () => require('../components/posts/EventsPast.jsx'));
  importComponent("EventsUpcoming", () => require('../components/posts/EventsUpcoming.jsx'));
  importComponent("CommunityHome", () => require('../components/localGroups/CommunityHome.jsx'));
  importComponent("CommunityMap", () => require('../components/localGroups/CommunityMap.jsx'));
  importComponent("CommunityMapFilter", () => require('../components/localGroups/CommunityMapFilter.jsx'));
  importComponent("CommunityMapWrapper", () => require('../components/localGroups/CommunityMapWrapper.jsx'));
  importComponent("SetPersonalMapLocationDialog", () => require('../components/localGroups/SetPersonalMapLocationDialog.jsx'));
  importComponent("EventNotificationsDialog", () => require('../components/localGroups/EventNotificationsDialog.jsx'));
  importComponent("MarkerWithInfoWindow", () => require('../components/localGroups/MarkerWithInfoWindow.jsx'));
  importComponent("StyledMapMarker", () => require('../components/localGroups/StyledMapMarker.jsx'));
  importComponent("EventTime", () => require('../components/localGroups/EventTime.jsx'));
  importComponent("EventVicinity", () => require('../components/localGroups/EventVicinity.jsx'));
  importComponent("LocalGroupMarker", () => require('../components/localGroups/LocalGroupMarker.jsx'));
  importComponent("LocalEventMarker", () => require('../components/localGroups/LocalEventMarker.jsx'));
  importComponent("LocalGroupPage", () => require('../components/localGroups/LocalGroupPage.jsx'));
  importComponent("LocalGroupSingle", () => require('../components/localGroups/LocalGroupSingle.jsx'));
  importComponent("GroupFormLink", () => require('../components/localGroups/GroupFormLink.jsx'));
  importComponent("SmallMapPreview", () => require('../components/localGroups/SmallMapPreview.jsx'));
  importComponent("GroupLinks", () => require('../components/localGroups/GroupLinks.jsx'));
  importComponent("LocalGroupsList", () => require('../components/localGroups/LocalGroupsList.jsx'));
  importComponent("LocalGroupsItem", () => require('../components/localGroups/LocalGroupsItem.jsx'));
  importComponent("TabNavigationEventsList", () => require('../components/localGroups/TabNavigationEventsList.jsx'));
  importComponent("AllGroupsPage", () => require('../components/localGroups/AllGroupsPage.jsx'));
  importComponent("GroupFormDialog", () => require('../components/localGroups/GroupFormDialog.jsx'));
}

// comments

importComponent("CommentsItem", () => require('../components/comments/CommentsItem/CommentsItem.jsx'));
importComponent("CommentUserName", () => require('../components/comments/CommentsItem/CommentUserName.jsx'));
importComponent("RetractCommentMenuItem", () => require('../components/comments/CommentsItem/RetractCommentMenuItem.jsx'));
importComponent("MoveToAnswersMenuItem", () => require('../components/comments/CommentsItem/MoveToAnswersMenuItem.jsx'));
importComponent("CommentsPermalinkMenuItem", () => require('../components/comments/CommentsItem/CommentsPermalinkMenuItem.jsx'));
importComponent("CommentShortformIcon", () => require('../components/comments/CommentsItem/CommentShortformIcon.jsx'));
importComponent("BanUserFromPostMenuItem", () => require('../components/comments/CommentsItem/BanUserFromPostMenuItem.jsx'));
importComponent("BanUserFromAllPostsMenuItem", () => require('../components/comments/CommentsItem/BanUserFromAllPostsMenuItem.jsx'));
importComponent("BanUserFromAllPersonalPostsMenuItem", () => require('../components/comments/CommentsItem/BanUserFromAllPersonalPostsMenuItem.jsx'));
importComponent("DeleteCommentMenuItem", () => require('../components/comments/CommentsItem/DeleteCommentMenuItem.jsx'));
importComponent("DeleteCommentDialog", () => require('../components/comments/CommentsItem/DeleteCommentDialog.jsx'));
importComponent("EditCommentMenuItem", () => require('../components/comments/CommentsItem/EditCommentMenuItem.jsx'));
importComponent("ReportCommentMenuItem", () => require('../components/comments/CommentsItem/ReportCommentMenuItem.jsx'));
importComponent("MoveToAlignmentMenuItem", () => require('../components/comments/CommentsItem/MoveToAlignmentMenuItem.jsx'));
importComponent("SuggestAlignmentMenuItem", () => require('../components/comments/CommentsItem/SuggestAlignmentMenuItem.jsx'));
importComponent("SubscribeToCommentMenuItem", () => require('../components/comments/CommentsItem/SubscribeToCommentMenuItem.jsx'));
importComponent("CommentDeletedMetadata", () => require('../components/comments/CommentsItem/CommentDeletedMetadata.jsx'));
importComponent("CommentBody", () => require('../components/comments/CommentsItem/CommentBody.jsx'));
importComponent("CommentsMenu", () => require('../components/comments/CommentsItem/CommentsMenu.jsx'));
importComponent("CommentOutdatedWarning", () => require('../components/comments/CommentsItem/CommentOutdatedWarning'));
importComponent("CommentsItemDate", () => require('../components/comments/CommentsItem/CommentsItemDate'));

importComponent("CommentWithReplies", () => require('../components/comments/CommentWithReplies'));
importComponent("CommentPermalink", () => require('../components/comments/CommentPermalink.jsx'));
importComponent("RecentDiscussionThread", () => require('../components/comments/RecentDiscussionThread.jsx'));
importComponent("RecentDiscussionThreadsList", () => require('../components/comments/RecentDiscussionThreadsList.jsx'));
importComponent("CantCommentExplanation", () => require('../components/comments/CantCommentExplanation.jsx'));
importComponent("CommentsEditForm", () => require('../components/comments/CommentsEditForm.jsx'));
importComponent("CommentsListSection", () => require('../components/comments/CommentsListSection.jsx'));
importComponent("CommentsList", () => require('../components/comments/CommentsList.jsx'));
importComponent("CommentsListMeta", () => require('../components/comments/CommentsListMeta.jsx'));
importComponent("CommentsNode", () => require('../components/comments/CommentsNode.jsx'));
importComponent("CommentsViews", () => require('../components/comments/CommentsViews.jsx'));
importComponent("RecentComments", () => require('../components/comments/RecentComments.jsx'));

importComponent("ParentCommentSingle", () => require('../components/comments/ParentCommentSingle.jsx'));
importComponent("ModerationGuidelinesBox", () => require('../components/comments/ModerationGuidelines/ModerationGuidelinesBox.jsx'));
importComponent("ModerationGuidelinesEditForm", () => require('../components/comments/ModerationGuidelines/ModerationGuidelinesEditForm.jsx'))
importComponent("LastVisitList", () => require('../components/comments/LastVisitList.jsx'))
importComponent("CommentsNewForm", () => require('../components/comments/CommentsNewForm.jsx'));
importComponent("SingleLineComment", () => require('../components/comments/SingleLineComment.jsx'));
importComponent("ShowParentComment", () => require('../components/comments/ShowParentComment'));

importComponent("PostsListEditorSearchHit", () => require('../components/search/PostsListEditorSearchHit.jsx'));
importComponent("PostsSearchHit", () => require('../components/search/PostsSearchHit.jsx'));
importComponent("PostsSearchAutoComplete", () => require('../components/search/PostsSearchAutoComplete.jsx'));
importComponent("CommentsSearchHit", () => require('../components/search/CommentsSearchHit.jsx'));
importComponent("UsersSearchHit", () => require('../components/search/UsersSearchHit.jsx'));
importComponent("SequencesSearchHit", () => require('../components/search/SequencesSearchHit.jsx'));
importComponent("SequencesSearchAutoComplete", () => require('../components/search/SequencesSearchAutoComplete.jsx'));
importComponent("UsersSearchAutoComplete", () => require('../components/search/UsersSearchAutoComplete.jsx'));
importComponent("UsersAutoCompleteHit", () => require('../components/search/UsersAutoCompleteHit.jsx'));
importComponent("UsersSearchInput", () => require('../components/search/UsersSearchInput.jsx'));
importComponent("SearchBarResults", () => require('../components/search/SearchBarResults.jsx'));
importComponent("SearchPagination", () => require('../components/search/SearchPagination.jsx'));

importComponent("AdminHome", () => require('../components/sunshineDashboard/AdminHome.jsx'));
importComponent("AdminMetadata", () => require('../components/sunshineDashboard/AdminMetadata.jsx'));
importComponent("ModerationLog", () => require('../components/sunshineDashboard/ModerationLog.jsx'));
importComponent("ReportForm", () => require('../components/sunshineDashboard/ReportForm.jsx'));
importComponent("SunshineCommentsItemOverview", () => require('../components/sunshineDashboard/SunshineCommentsItemOverview.jsx'));
importComponent("AFSuggestCommentsItem", () => require('../components/sunshineDashboard/AFSuggestCommentsItem.jsx'));
importComponent("AFSuggestCommentsList", () => require('../components/sunshineDashboard/AFSuggestCommentsList.jsx'));
importComponent("AFSuggestPostsItem", () => require('../components/sunshineDashboard/AFSuggestPostsItem.jsx'));
importComponent("AFSuggestPostsList", () => require('../components/sunshineDashboard/AFSuggestPostsList.jsx'));
importComponent("AFSuggestUsersItem", () => require('../components/sunshineDashboard/AFSuggestUsersItem.jsx'));
importComponent("AFSuggestUsersList", () => require('../components/sunshineDashboard/AFSuggestUsersList.jsx'));
importComponent("SunshineNewUserPostsList", () => require('../components/sunshineDashboard/SunshineNewUserPostsList.jsx'));
importComponent("SunshineNewUserCommentsList", () => require('../components/sunshineDashboard/SunshineNewUserCommentsList.jsx'));
importComponent("SunshineNewUsersItem", () => require('../components/sunshineDashboard/SunshineNewUsersItem.jsx'));
importComponent("SunshineNewUsersList", () => require('../components/sunshineDashboard/SunshineNewUsersList.jsx'));
importComponent("SunshineNewPostsList", () => require('../components/sunshineDashboard/SunshineNewPostsList.jsx'));
importComponent("SunshineNewPostsItem", () => require('../components/sunshineDashboard/SunshineNewPostsItem.jsx'));
importComponent("SunshineNewCommentsItem", () => require('../components/sunshineDashboard/SunshineNewCommentsItem.jsx'));
importComponent("SunshineNewCommentsList", () => require('../components/sunshineDashboard/SunshineNewCommentsList.jsx'));
importComponent("SunshineReportedContentList", () => require('../components/sunshineDashboard/SunshineReportedContentList.jsx'));
importComponent("SunshineReportedItem", () => require('../components/sunshineDashboard/SunshineReportedItem.jsx'));
importComponent("SunshineCuratedSuggestionsItem", () => require('../components/sunshineDashboard/SunshineCuratedSuggestionsItem.jsx'));
importComponent("SunshineCuratedSuggestionsList", () => require('../components/sunshineDashboard/SunshineCuratedSuggestionsList.jsx'));
importComponent("SunshineSidebar", () => require('../components/sunshineDashboard/SunshineSidebar.jsx'));
importComponent("SunshineListTitle", () => require('../components/sunshineDashboard/SunshineListTitle.jsx'));
importComponent("SunshineListItem", () => require('../components/sunshineDashboard/SunshineListItem.jsx'));
importComponent("SidebarHoverOver", () => require('../components/sunshineDashboard/SidebarHoverOver.jsx'));
importComponent("SidebarInfo", () => require('../components/sunshineDashboard/SidebarInfo.jsx'));
importComponent("SidebarActionMenu", () => require('../components/sunshineDashboard/SidebarActionMenu.jsx'));
importComponent("SidebarAction", () => require('../components/sunshineDashboard/SidebarAction.jsx'));
importComponent("SunshineListCount", () => require('../components/sunshineDashboard/SunshineListCount.jsx'));
importComponent("LastCuratedDate", () => require('../components/sunshineDashboard/LastCuratedDate'));
importComponent(["EmailHistory", "EmailHistoryPage", "EmailPreview"], () => require('../components/sunshineDashboard/EmailHistory.jsx'));

// SequenceEditor
importComponent("EditSequenceTitle", () => require('../components/sequenceEditor/EditSequenceTitle.jsx'));

// Sequences
importComponent("SequencesPage", () => require('../components/sequences/SequencesPage.jsx'));
importComponent("SequencesPostsList", () => require('../components/sequences/SequencesPostsList.jsx'));
importComponent("SequencesSingle", () => require('../components/sequences/SequencesSingle.jsx'));
importComponent("SequencesEditForm", () => require('../components/sequences/SequencesEditForm.jsx'));
importComponent("SequencesNewForm", () => require('../components/sequences/SequencesNewForm.jsx'));
importComponent("SequencesHome", () => require('../components/sequences/SequencesHome.jsx'));
importComponent("SequencesGrid", () => require('../components/sequences/SequencesGrid.jsx'));
importComponent("SequencesGridWrapper", () => require('../components/sequences/SequencesGridWrapper.jsx'));
importComponent("SequenceTooltip", () => require('../components/sequences/SequenceTooltip.jsx'));
importComponent("SequencesNavigationLink", () => require('../components/sequences/SequencesNavigationLink.jsx'));
importComponent("SequencesNewButton", () => require('../components/sequences/SequencesNewButton.jsx'));
importComponent("BottomNavigation", () => require('../components/sequences/BottomNavigation.jsx'));
importComponent("BottomNavigationItem", () => require('../components/sequences/BottomNavigationItem.jsx'));
importComponent("SequencesPost", () => require('../components/sequences/SequencesPost.jsx'));
importComponent("SequencesGridItem", () => require('../components/sequences/SequencesGridItem.jsx'));
importComponent("ChaptersItem", () => require('../components/sequences/ChaptersItem.jsx'));
importComponent("ChaptersList", () => require('../components/sequences/ChaptersList.jsx'));
importComponent("ChaptersEditForm", () => require('../components/sequences/ChaptersEditForm.jsx'));
importComponent("ChaptersNewForm", () => require('../components/sequences/ChaptersNewForm.jsx'));
importComponent("CollectionsSingle", () => require('../components/sequences/CollectionsSingle.jsx'));
importComponent("CollectionsPage", () => require('../components/sequences/CollectionsPage.jsx'));
importComponent("CollectionsEditForm", () => require('../components/sequences/CollectionsEditForm.jsx'));
importComponent("BooksNewForm", () => require('../components/sequences/BooksNewForm.jsx'));
importComponent("BooksEditForm", () => require('../components/sequences/BooksEditForm.jsx'));
importComponent("BooksItem", () => require('../components/sequences/BooksItem.jsx'));
importComponent("CoreReading", () => require('../components/sequences/CoreReading.jsx'));
importComponent("CollectionsCardContainer", () => require('../components/collections/CollectionsCardContainer.jsx'));
importComponent("CollectionsCard", () => require('../components/collections/CollectionsCard.jsx'));
importComponent("BigCollectionsCard", () => require('../components/collections/BigCollectionsCard.jsx'));
importComponent("CoreSequences", () => require('../components/sequences/CoreSequences.jsx'));
importComponent("HPMOR", () => require('../components/sequences/HPMOR.jsx'));
importComponent("Codex", () => require('../components/sequences/Codex.jsx'));

importComponent("PostsListEditor", () => require('../components/form-components/PostsListEditor.jsx'));
importComponent("ImageUpload", () => require('../components/form-components/ImageUpload.jsx'));
importComponent("SequencesListEditor", () => require('../components/form-components/SequencesListEditor.jsx'));
importComponent("SequencesListEditorItem", () => require('../components/form-components/SequencesListEditorItem.jsx'));
importComponent("SubmitButton", () => require('../components/form-components/SubmitButton.jsx'));
importComponent("FormSubmit", () => require('../components/form-components/FormSubmit.jsx'));
importComponent("SingleUsersItem", () => require('../components/form-components/SingleUsersItem.jsx'));
importComponent("SingleUsersItemWrapper", () => require('../components/form-components/SingleUsersItemWrapper.jsx'));
importComponent("UsersListEditor", () => require('../components/form-components/UsersListEditor.jsx'));
importComponent("MuiInput", () => require('../components/form-components/MuiInput.jsx'));
importComponent("LocationFormComponent", () => require('../components/form-components/LocationFormComponent.jsx'));
importComponent("MuiTextField", () => require('../components/form-components/MuiTextField.jsx'));
importComponent("MultiSelectButtons", () => require('../components/form-components/MultiSelectButtons.jsx'));
importComponent("FormComponentCheckbox", () => require('../components/form-components/FormComponentCheckbox.jsx'));
importComponent("SectionFooterCheckbox", () => require('../components/form-components/SectionFooterCheckbox.jsx'));
importComponent("FormComponentDefault", () => require('../components/form-components/FormComponentDefault.jsx'));
importComponent("FormComponentSelect", () => require('../components/form-components/FormComponentSelect.jsx'));
importComponent("FormComponentDate", () => require('../components/form-components/FormComponentDate.jsx'));
importComponent("FormComponentDateTime", () => require('../components/form-components/FormComponentDateTime.jsx'));
importComponent("FormComponentNumber", () => require('../components/form-components/FormComponentNumber.jsx'));
importComponent("WrappedSmartForm", () => require('../components/form-components/WrappedSmartForm.jsx'));



import '../components/alignment-forum/withSetAlignmentPost.jsx';
import '../components/alignment-forum/withSetAlignmentComment.jsx';
importComponent("AFApplicationForm", () => require('../components/alignment-forum/AFApplicationForm.jsx'));

importComponent("NewQuestionDialog", () => require('../components/questions/NewQuestionDialog.jsx'));
importComponent("NewRelatedQuestionForm", () => require('../components/questions/NewRelatedQuestionForm.jsx'));
importComponent("NewAnswerForm", () => require('../components/questions/NewAnswerForm.jsx'));
importComponent("PostsPageQuestionContent", () => require('../components/questions/PostsPageQuestionContent.jsx'));
importComponent("NewAnswerCommentQuestionForm", () => require('../components/questions/NewAnswerCommentQuestionForm.jsx'));
importComponent("AnswerCommentsList", () => require('../components/questions/AnswerCommentsList.jsx'));
importComponent("AnswersList", () => require('../components/questions/AnswersList.jsx'));
importComponent("Answer", () => require('../components/questions/Answer.jsx'));
importComponent("QuestionsPage", () => require('../components/questions/QuestionsPage.jsx'));
importComponent("RelatedQuestionsList", () => require('../components/questions/RelatedQuestionsList.jsx'));

importComponent("ConfigurableRecommendationsList", () => require('../components/recommendations/ConfigurableRecommendationsList.jsx'));
importComponent("ContinueReadingList", () => require('../components/recommendations/ContinueReadingList.jsx'));
importComponent("RecommendationsAlgorithmPicker", () => require('../components/recommendations/RecommendationsAlgorithmPicker.jsx'));
importComponent("RecommendationsList", () => require('../components/recommendations/RecommendationsList.jsx'));
importComponent("RecommendationsPage", () => require('../components/recommendations/RecommendationsPage.jsx'));
importComponent("RecommendationsAndCurated", () => require('../components/recommendations/RecommendationsAndCurated.jsx'));

