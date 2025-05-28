import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { gql } from '@/lib/generated/gql-codegen';
import { defineStyles, useStyles } from '../hooks/useStyles';

const styles = defineStyles("GenerateImagesButton", (theme: ThemeType) => ({
  root: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  generateButton: {
    padding: '10px 0',
    display: 'block',
    ...theme.typography.body2,
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
    color: theme.palette.grey[600],
    fontStyle: 'italic',
    marginLeft: 10,
  },
  promptInput: {
    backgroundColor: 'transparent',
    ...theme.typography.body2,
    marginLeft: 10,
    padding: 4,
  },
  promptContainer: {
    ...theme.typography.body2,
    color: theme.palette.grey[400],
    whiteSpace: 'pre',
    overflow: 'hidden',
  }
}));

export const artPrompt = ", aquarelle artwork fading out to the left, in the style of ethereal watercolor washes, clear focal point on the right half of image, juxtaposition of hard and soft lines, muted colors, drenched in watercolor, aquarelle, smooth color gradients, ethereal watercolor, beautiful fade to white, white, soaking wet watercolors fading into each other, smooth edges, topographic maps, left side of the image is fading to white, right side has a visceral motif, left fade right intense, image fades to white on left, left side white, smooth texture";

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

  const [generateCoverImages] = useMutation(gql(`
    mutation GenerateCoverImagesForPost($postId: String!, $prompt: String) {
      generateCoverImagesForPost(postId: $postId, prompt: $prompt) { 
        _id
      }
    }
  `));

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      // If the user has entered a custom prompt, we want to append the default art prompt. 
      // If not, we want the generateCoverImages function to generate it's own prompts (which requires passing in an empty prompt)
      const submittedPrompt = customPrompt.trim() ? customPrompt + artPrompt : "";
      const finalPrompt = allowCustomPrompt ? submittedPrompt : prompt;
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
      {allowCustomPrompt && <div className={classes.promptContainer}>{artPrompt}</div>}
      {isGenerating && <span className={classes.loadingText}>Generating...</span>}
    </div>
  );
};

export default GenerateImagesButton;
