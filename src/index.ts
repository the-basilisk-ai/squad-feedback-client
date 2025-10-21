/**
 * Squad Feedback Library
 *
 * A lightweight TypeScript library for sending user feedback to Squad GPT
 * using the public data ingress API.
 */

/**
 * Configuration options for submitting feedback
 */
export type SubmitFeedbackOptions = {
  /**
   * The source/origin of the feedback
   * Must contain only uppercase letters and underscores (e.g., "SQUAD_CLIENT", "USER_FEEDBACK")
   * @default 'SQUAD_CLIENT'
   */
  readonly source?: string;

  /**
   * The base URL for the Squad API
   * @default 'https://api.meetsquad.ai'
   */
  readonly baseUrl?: string;

  /**
   * Request timeout in milliseconds
   * @default 10000
   */
  readonly timeout?: number;
};

/**
 * Response from the Squad API after submitting feedback
 */
export type SquadFeedbackResponse = {
  readonly data: {
    readonly insight: string;
    readonly source: string;
    readonly workspaceId: string;
    readonly organisationId: string;
  };
};

/**
 * Result of a successful feedback submission
 */
export type SubmitFeedbackSuccess = {
  readonly success: true;
  readonly data: SquadFeedbackResponse;
  readonly statusCode: number;
};

/**
 * Result of a failed feedback submission
 */
export type SubmitFeedbackFailure = {
  readonly success: false;
  readonly error: Error;
  readonly statusCode?: number;
};

/**
 * Result of a feedback submission attempt
 */
export type SubmitFeedbackResult = SubmitFeedbackSuccess | SubmitFeedbackFailure;

/**
 * Configuration options for batch feedback submission
 */
export type SubmitFeedbackBatchOptions = SubmitFeedbackOptions & {
  /**
   * Delay between submissions in milliseconds to avoid rate limiting
   * @default 100
   */
  readonly delayMs?: number;
  /**
   * Whether to continue submitting if one fails
   * @default true
   */
  readonly continueOnError?: boolean;
};

// Constants for default values
const DEFAULT_TIMEOUT_MS = 10000;
const DEFAULT_BASE_URL = 'https://api.meetsquad.ai';
const DEFAULT_SOURCE = 'SQUAD_CLIENT';
const DEFAULT_BATCH_DELAY_MS = 100;

/**
 * Submit feedback to Squad
 *
 * Reads the API key from the SQUAD_API_KEY environment variable.
 *
 * @param feedback - The feedback text to submit
 * @param options - Optional configuration
 * @returns A promise that resolves to the submission result
 *
 * @example
 * ```typescript
 * const result = await submitFeedback('Great product! Love the new features.');
 *
 * if (result.success) {
 *   console.log('Feedback submitted successfully');
 * } else {
 *   console.error('Failed to submit feedback:', result.error);
 * }
 * ```
 */
export async function submitFeedback(
  feedback: string,
  options?: SubmitFeedbackOptions
): Promise<SubmitFeedbackResult> {
  const apiKey = process.env.SQUAD_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      error: new Error('SQUAD_API_KEY environment variable is not set'),
    };
  }

  if (!feedback || feedback.trim().length === 0) {
    return {
      success: false,
      error: new Error('Feedback cannot be empty. Please provide a non-empty string.'),
    };
  }

  const baseUrl = options?.baseUrl || DEFAULT_BASE_URL;
  const source = options?.source || DEFAULT_SOURCE;
  const timeout = options?.timeout || DEFAULT_TIMEOUT_MS;

  // Validate source format: must be uppercase letters and underscores only
  const sourceRegex = /^[A-Z_]+$/;
  if (!sourceRegex.test(source)) {
    return {
      success: false,
      error: new Error(
        `Invalid source format: "${source}". Source must contain only uppercase letters and underscores (e.g., "SQUAD_CLIENT", "USER_FEEDBACK").`
      ),
    };
  }

  const url = `${baseUrl}/v1/data-ingress/${source}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'Authorization': apiKey,
      },
      body: feedback,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        statusCode: response.status,
        error: new Error(
          `Failed to submit feedback: ${response.status} ${response.statusText}. ${errorText}`
        ),
      };
    }

    const responseData = (await response.json()) as unknown;

    // Validate the response structure
    if (
      !responseData ||
      typeof responseData !== 'object' ||
      !('data' in responseData) ||
      typeof responseData.data !== 'object' ||
      responseData.data === null
    ) {
      return {
        success: false,
        statusCode: response.status,
        error: new Error('Invalid response format from API'),
      };
    }

    return {
      success: true,
      data: responseData as SquadFeedbackResponse,
      statusCode: response.status,
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        success: false,
        error: new Error(`Request timeout after ${timeout}ms`),
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

/**
 * Submit multiple feedback items
 *
 * @param feedbackItems - Array of feedback strings to submit
 * @param options - Optional configuration for batch submission
 * @returns A promise that resolves to an array of submission results
 *
 * @example
 * ```typescript
 * const results = await submitFeedbackBatch([
 *   'Great product!',
 *   'Would love to see feature X',
 *   'The UI is very intuitive'
 * ]);
 *
 * const successCount = results.filter(r => r.success).length;
 * console.log(`${successCount}/${results.length} submitted successfully`);
 * ```
 */
export async function submitFeedbackBatch(
  feedbackItems: ReadonlyArray<string>,
  options?: SubmitFeedbackBatchOptions
): Promise<Array<SubmitFeedbackResult>> {
  const delayMs = options?.delayMs ?? DEFAULT_BATCH_DELAY_MS;
  const continueOnError = options?.continueOnError ?? true;
  const results: Array<SubmitFeedbackResult> = [];

  for (const feedback of feedbackItems) {
    const result = await submitFeedback(feedback, options);
    results.push(result);

    if (!result.success && !continueOnError) {
      break;
    }

    // Add delay between requests to avoid rate limiting
    if (delayMs > 0 && feedback !== feedbackItems[feedbackItems.length - 1]) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return results;
}
