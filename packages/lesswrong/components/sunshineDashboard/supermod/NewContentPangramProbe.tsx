import { useEffect } from 'react';
import { useModeratedUserContents } from '@/components/hooks/useModeratedUserContents';
import { userContentQualifiesForPangram } from './groupings';

// Renders nothing; loads a new-content user's content and reports (via onResult)
// whether it qualifies them for the Pangram tab. Mounted once per new-content user.
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
