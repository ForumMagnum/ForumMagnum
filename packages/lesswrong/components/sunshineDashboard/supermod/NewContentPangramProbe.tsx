import { useEffect } from 'react';
import { useModeratedUserContents } from '@/components/hooks/useModeratedUserContents';
import { userContentQualifiesForPangram } from './groupings';

// Renders nothing; loads a new-content user's posts and comments client-side and
// reports whether that content qualifies them for the Pangram tab. Mounted for
// every new-content user so the Pangram/New Content split stays accurate.
const NewContentPangramProbe = ({ userId, onResult }: {
  userId: string;
  onResult: (userId: string, qualifies: boolean) => void;
}) => {
  const { posts, comments } = useModeratedUserContents(userId);
  const qualifies = userContentQualifiesForPangram(posts, comments);

  useEffect(() => {
    onResult(userId, qualifies);
  }, [userId, qualifies, onResult]);

  return null;
};

export default NewContentPangramProbe;
