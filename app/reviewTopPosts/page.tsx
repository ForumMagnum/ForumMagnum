import { REVIEW_YEAR } from "@/lib/reviewUtils";
import { redirect } from "next/navigation";

export default function ReviewTopPostsPage() {
  redirect(`/reviewTopPosts/${REVIEW_YEAR}`);
}
