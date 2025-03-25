import React, { useState } from 'react';
import { gql, useMutation } from '@apollo/client';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { registerComponent } from '@/lib/vulcan-lib/components';

const styles = defineStyles("GenerateImagesButton", (theme: ThemeType) => ({
  root: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  generateButton: {
    padding: '10px 0',
    display: 'block',
    color: theme.palette.primary.dark,
    backgroundColor: 'transparent',
    border: 'none',
    fontWeight: 'bold',
    cursor: 'pointer',
    '&:disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
    }
  },
  loadingText: {
    marginLeft: 10,
    color: theme.palette.grey[600],
    fontStyle: 'italic',
  },
  promptInput: {
    marginLeft: 10,
    padding: 4,
    backgroundColor: 'transparent',
  }
}));

const GenerateImagesButton = ({
  postId,
  prompt,
  allowCustomPrompt = false,
  buttonText = "Generate Images",
  onComplete
}: {
  postId: string,
  prompt?: string,
  allowCustomPrompt?: boolean,
  buttonText?: string,
  onComplete?: () => void
}) => {
  const classes = useStyles(styles);
  const [isGenerating, setIsGenerating] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");

  const [generateCoverImages] = useMutation(gql`
    mutation GenerateCoverImagesForPost($postId: String!, $prompt: String) {
      generateCoverImagesForPost(postId: $postId, prompt: $prompt)
    }
  `);

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      const finalPrompt = allowCustomPrompt ? customPrompt : prompt;
      await generateCoverImages({ 
        variables: { 
          postId,
          ...(finalPrompt && { prompt: finalPrompt })
        } 
      });
      onComplete?.();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error generating cover images:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={classes.root}>
      <button 
        className={classes.generateButton}
        onClick={handleGenerate}
        disabled={isGenerating}
      >
        Generate
      </button>
      {allowCustomPrompt && <input
        type="text"
        className={classes.promptInput}
        value={customPrompt}
        onChange={(e) => setCustomPrompt(e.target.value)}
        placeholder="Enter custom prompt..."
      />}
      {isGenerating && <span className={classes.loadingText}>Generating...</span>}
    </div>
  );
};

const GenerateImagesButtonComponent = registerComponent('GenerateImagesButton', GenerateImagesButton);

declare global {
  interface ComponentTypes {
    GenerateImagesButton: typeof GenerateImagesButtonComponent
  }
}

export default GenerateImagesButton;
