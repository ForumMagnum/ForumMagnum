# Frontpage Classifier

This module implements a server-side machine learning classifier that predicts whether posts should be on the frontpage based on their semantic embeddings.

## Overview

The classifier uses:
- **Input**: 1536-dimensional embedding vectors from OpenAI's text-embedding model (stored in PostEmbeddings table)
- **Algorithm**: Logistic regression with weighted loss function
- **Output**: Binary prediction (frontpage/personal) with confidence score via API
- **Special Feature**: False positives are weighted 4x more heavily than false negatives during training
- **Architecture**: Server-side classification with API endpoint (no client-side ML)

## Components

### 1. Training Pipeline (`/server/scripts/frontpageClassifier/trainClassifier.ts`)

Extracts training data from the database and trains the classifier.

**Usage:**
```bash
yarn repl prod packages/lesswrong/server/scripts/frontpageClassifier/trainClassifier.ts "trainFrontpageClassifier()"
```

**Options:**
```typescript
trainFrontpageClassifier(
  startDate,  // Optional: Start date for training data (default: 2023-01-01)
  endDate,    // Optional: End date for training data (default: 2024-01-01)
  {
    falsePositiveWeight: 4,    // Weight for false positives (default: 4)
    falseNegativeWeight: 1,     // Weight for false negatives (default: 1)
    learningRate: 0.01,         // Learning rate for gradient descent
    epochs: 1000,               // Number of training epochs
    testRatio: 0.2              // Fraction of data for testing
  }
)
```

### 2. Logistic Regression Implementation (`logisticRegression.ts`)

Pure TypeScript implementation of logistic regression with:
- Gradient descent optimization
- Weighted loss function for asymmetric costs
- Xavier weight initialization
- Early stopping
- Comprehensive evaluation metrics

### 3. Classifier Service (`/server/frontpageClassifier/classifierService.ts`)

Server-side service that:
- Loads pre-trained model weights from JSON
- Fetches embeddings from PostEmbeddings table
- Provides classification functions
- Auto-reloads model every hour
- Handles batch classification efficiently

### 4. API Endpoint (`/app/api/admin/classify-frontpage/route.ts`)

NextJS route that provides:
- POST endpoint for classifying posts
- Admin-only access control
- Batch classification support (up to 100 posts)
- Response caching (1 hour with stale-while-revalidate)
- GET endpoint for checking classifier status

**API Usage:**
```typescript
// Request
POST /api/admin/classify-frontpage
{
  postIds: ["postId1", "postId2", ...]
}

// Response
{
  predictions: {
    "postId1": {
      isFrontpage: boolean,
      confidence: number,
      probability: number
    },
    ...
  },
  metadata: {
    accuracy: number,
    precision: number,
    recall: number,
    threshold: number,
    trainedAt: string
  }
}
```

### 5. React Hook (`useFrontpageClassification.ts`)

Hook for fetching classifications from the API:
```typescript
// Single post classification
const { prediction, isLoading, error } = useFrontpageClassification(postId);

// Batch classification with automatic batching
const { predictions, isLoading, error } = useBatchFrontpageClassification(postIds);
```

Features:
- Client-side caching to avoid redundant API calls
- Automatic request batching (50ms delay)
- SWR integration for status checking

### 6. UI Integration (`SunshineNewPostsItem.tsx`)

Shows predictions in the Sunshine sidebar with:
- API call triggered on hover
- Confidence percentages
- Visual indicators for mismatches
- Color-coded badges (blue for frontpage, gray for personal)

## Training Process

1. **Data Collection**: Queries posts with embeddings and known frontpage status
2. **Feature Extraction**: Uses 1536-dimensional embeddings from PostEmbeddings table
3. **Label Assignment**: `frontpageDate` presence determines labels
4. **Train/Test Split**: Stratified 80/20 split maintaining class balance
5. **Training**: Gradient descent with weighted cross-entropy loss
6. **Threshold Optimization**: Finds optimal decision threshold considering costs
7. **Model Saving**: Exports weights to JSON file

## Weighted Loss Function

The classifier uses an asymmetric loss function where false positives (incorrectly predicting a post as frontpage) cost 4x more than false negatives:

```
Cost = 4 × False Positives + 1 × False Negatives
```

This ensures the classifier is conservative about recommending posts for the frontpage.

## Deployment

1. **Train the model**:
   ```bash
   yarn repl prod packages/lesswrong/server/scripts/frontpageClassifier/trainClassifier.ts "trainFrontpageClassifier()"
   ```

2. **Verify model file exists**:
   Check that `packages/lesswrong/lib/frontpageClassifier/model.json` was created

3. **Deploy the application**:
   The model will be loaded by the server and served via the API endpoint

4. **Monitor performance**:
   - Check the training output for accuracy metrics
   - Review misclassification examples
   - Monitor the prediction badge in Sunshine sidebar
   - Check classifier status via GET endpoint

## Server Architecture

```
┌─────────────────┐
│   UI Component  │
│  (on hover)     │
└────────┬────────┘
         │ API Request
         ▼
┌─────────────────┐
│  API Endpoint   │
│ (admin-only)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│Classifier Service│
│  (server-side)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  PostEmbeddings │
│   (database)    │
└─────────────────┘
```

## Retraining

The model should be retrained periodically as:
- New posts accumulate
- Frontpage standards evolve
- Embedding model updates

Recommended retraining frequency: Monthly or quarterly

## Performance Metrics

The classifier reports:
- **Accuracy**: Overall correct predictions
- **Precision**: True positives / (True positives + False positives)
- **Recall**: True positives / (True positives + False negatives)
- **F1 Score**: Harmonic mean of precision and recall
- **Weighted Loss**: Cost-adjusted loss considering asymmetric penalties

## Troubleshooting

### "Classifier not ready" error
- Run the training script to generate the model file
- Check that `model.json` exists and is not the placeholder
- Check server logs for model loading errors

### No predictions returned
- Verify posts have embeddings in PostEmbeddings table
- Check that user has admin permissions
- Inspect API response for error messages

### Low accuracy
- Increase training data date range
- Adjust learning rate or epochs
- Review misclassified examples for patterns
- Consider adjusting the threshold

### API performance issues
- Check if model is being reloaded too frequently
- Consider increasing cache duration
- Monitor batch sizes in requests

## Security

- API endpoint requires admin authentication
- Embeddings never leave the server
- Model weights are not exposed to clients
- Predictions are cached to reduce computation