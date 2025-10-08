/**
 * Logistic Regression implementation in TypeScript for frontpage classification
 * Uses weighted loss to handle false positive/negative costs differently
 */

export interface TrainingOptions {
  learningRate?: number;
  epochs?: number;
  falsePositiveWeight?: number;
  falseNegativeWeight?: number;
  verbose?: boolean;
}

export interface TrainingResult {
  loss: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
}

export class LogisticRegression {
  weights: number[] = [];
  bias: number = 0;

  constructor(inputDim?: number) {
    if (inputDim) {
      this.initializeWeights(inputDim);
    }
  }

  private initializeWeights(inputDim: number): void {
    // Xavier initialization
    const scale = Math.sqrt(2.0 / inputDim);
    this.weights = Array(inputDim).fill(0).map(() => (Math.random() - 0.5) * scale);
    this.bias = 0;
  }

  private sigmoid(z: number): number {
    return 1 / (1 + Math.exp(-z));
  }

  private dotProduct(a: number[], b: number[]): number {
    return a.reduce((sum, val, i) => sum + val * b[i], 0);
  }

  private clip(value: number, min = 1e-10, max = 1 - 1e-10): number {
    return Math.max(min, Math.min(max, value));
  }

  predict(x: number[]): number {
    const z = this.dotProduct(this.weights, x) + this.bias;
    return this.sigmoid(z);
  }

  predictBinary(x: number[], threshold = 0.5): boolean {
    return this.predict(x) >= threshold;
  }

  train(X: number[][], y: number[], options: TrainingOptions = {}): TrainingResult {
    const {
      learningRate = 0.01,
      epochs = 1000,
      falsePositiveWeight = 4,
      falseNegativeWeight = 1,
      verbose = false
    } = options;

    if (X.length === 0 || X[0].length === 0) {
      throw new Error('Training data cannot be empty');
    }

    if (X.length !== y.length) {
      throw new Error('X and y must have the same number of samples');
    }

    const n = X.length;
    const inputDim = X[0].length;

    // Initialize weights if not already done
    if (this.weights.length === 0) {
      this.initializeWeights(inputDim);
    }

    let lastLoss = Infinity;

    for (let epoch = 0; epoch < epochs; epoch++) {
      let totalLoss = 0;
      const gradientWeights = Array(inputDim).fill(0);
      let gradientBias = 0;

      // Calculate gradients with weighted loss
      for (let i = 0; i < n; i++) {
        const prediction = this.predict(X[i]);
        const clippedPred = this.clip(prediction);
        const error = prediction - y[i];

        // Apply weight based on type of error
        let weight = 1;
        if (y[i] === 1 && prediction < 0.5) {
          // False negative
          weight = falseNegativeWeight;
        } else if (y[i] === 0 && prediction >= 0.5) {
          // False positive
          weight = falsePositiveWeight;
        }

        // Weighted binary cross-entropy loss
        const loss = -weight * (
          y[i] * Math.log(clippedPred) +
          (1 - y[i]) * Math.log(1 - clippedPred)
        );
        totalLoss += loss;

        // Accumulate weighted gradients
        const weightedError = weight * error;
        for (let j = 0; j < inputDim; j++) {
          gradientWeights[j] += weightedError * X[i][j];
        }
        gradientBias += weightedError;
      }

      // Update weights using gradient descent
      for (let j = 0; j < inputDim; j++) {
        this.weights[j] -= learningRate * (gradientWeights[j] / n);
      }
      this.bias -= learningRate * (gradientBias / n);

      const avgLoss = totalLoss / n;

      if (verbose && epoch % 100 === 0) {
        console.log(`Epoch ${epoch}, Loss: ${avgLoss.toFixed(4)}`);
      }

      // Early stopping if loss stops improving
      if (Math.abs(lastLoss - avgLoss) < 1e-6) {
        if (verbose) {
          console.log(`Early stopping at epoch ${epoch}`);
        }
        break;
      }
      lastLoss = avgLoss;
    }

    // Calculate final metrics
    return this.evaluate(X, y, { falsePositiveWeight, falseNegativeWeight });
  }

  evaluate(X: number[][], y: number[], options: {
    falsePositiveWeight?: number;
    falseNegativeWeight?: number;
    threshold?: number;
  } = {}): TrainingResult {
    const {
      falsePositiveWeight = 4,
      falseNegativeWeight = 1,
      threshold = 0.5
    } = options;

    let truePositives = 0;
    let trueNegatives = 0;
    let falsePositives = 0;
    let falseNegatives = 0;
    let totalLoss = 0;

    for (let i = 0; i < X.length; i++) {
      const prediction = this.predict(X[i]);
      const predicted = prediction >= threshold ? 1 : 0;
      const actual = y[i];

      if (predicted === 1 && actual === 1) {
        truePositives++;
      } else if (predicted === 0 && actual === 0) {
        trueNegatives++;
      } else if (predicted === 1 && actual === 0) {
        falsePositives++;
      } else {
        falseNegatives++;
      }

      // Calculate weighted loss
      const weight = (actual === 1 && predicted === 0) ? falseNegativeWeight :
                     (actual === 0 && predicted === 1) ? falsePositiveWeight : 1;

      const clippedPred = this.clip(prediction);
      const loss = -weight * (
        actual * Math.log(clippedPred) +
        (1 - actual) * Math.log(1 - clippedPred)
      );
      totalLoss += loss;
    }

    const accuracy = (truePositives + trueNegatives) / X.length;
    const precision = truePositives / (truePositives + falsePositives) || 0;
    const recall = truePositives / (truePositives + falseNegatives) || 0;
    const f1Score = 2 * (precision * recall) / (precision + recall) || 0;
    const loss = totalLoss / X.length;

    return { loss, accuracy, precision, recall, f1Score };
  }

  toJSON(): { weights: number[], bias: number } {
    return {
      weights: [...this.weights],
      bias: this.bias
    };
  }

  fromJSON(model: { weights: number[], bias: number }): void {
    this.weights = [...model.weights];
    this.bias = model.bias;
  }
}