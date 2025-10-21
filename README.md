# @squadai/feedback-client

A lightweight TypeScript/Node.js library for sending user feedback to Squad GPT using the public data ingress API.

## Features

- **Simple API** - Just one function to submit feedback
- **Lightweight** - Uses native `fetch`, no heavy dependencies
- **TypeScript Support** - Fully typed for great developer experience
- **Batch Support** - Submit multiple feedback items with rate limiting
- **Environment-based** - Reads API key from `SQUAD_API_KEY` env var
- **Backend-focused** - Designed specifically for server-side use
- **Validation** - Built-in source parameter validation

## Installation

Install the package from npm:

```bash
npm install @squadai/feedback-client
```

Or with yarn:

```bash
yarn add @squadai/feedback-client
```

Or with pnpm:

```bash
pnpm add @squadai/feedback-client
```

## Quick Start

### 1. Set Your API Key

Set the `SQUAD_API_KEY` environment variable:

```bash
export SQUAD_API_KEY=your-api-key-here
```

Or add it to your `.env` file:

```env
SQUAD_API_KEY=your-api-key-here
```

### 2. Submit Feedback

```typescript
import { submitFeedback } from "@squadai/feedback-client";

const result = await submitFeedback("Great product! Love the new features.");

if (result.success) {
  console.log("Feedback submitted successfully!");
  console.log("Workspace ID:", result.data.data.workspaceId);
} else {
  console.error("Failed to submit feedback:", result.error.message);
}
```

That's it! The library automatically reads the API key from `process.env.SQUAD_API_KEY`.

## Usage Examples

### Basic Usage

```typescript
import { submitFeedback } from "@squadai/feedback-client";

// The API key is automatically read from process.env.SQUAD_API_KEY
const result = await submitFeedback("The app is really easy to use!");

if (result.success) {
  console.log("✓ Feedback submitted");
  console.log("Workspace ID:", result.data.data.workspaceId);
} else {
  console.error("✗ Error:", result.error.message);
}
```

### With Custom Source

The source parameter must contain only uppercase letters and underscores:

```typescript
import { submitFeedback } from "@squadai/feedback-client";

// Valid source examples: "USER_FEEDBACK", "API_INTEGRATION", "SLACK_BOT"
const result = await submitFeedback("User feedback from integration", {
  source: "USER_FEEDBACK", // Must be UPPERCASE_WITH_UNDERSCORES
});

// This will throw an error:
// source: "user-feedback" ❌ (lowercase and hyphens not allowed)
// source: "UserFeedback" ❌ (mixed case not allowed)
// source: "USER-FEEDBACK" ❌ (hyphens not allowed)
```

### Batch Submission

```typescript
import { submitFeedbackBatch } from "@squadai/feedback-client";

const feedbackItems = [
  "Great product!",
  "Would love to see feature X",
  "The UI is very intuitive",
];

const results = await submitFeedbackBatch(feedbackItems, {
  source: "BATCH_IMPORT", // Must be uppercase with underscores
  delayMs: 200, // Wait 200ms between submissions to avoid rate limiting
  continueOnError: true, // Continue even if one fails
});

const successCount = results.filter((r) => r.success).length;
console.log(`${successCount}/${results.length} submitted successfully`);
```

### Custom Timeout

```typescript
import { submitFeedback } from "@squadai/feedback-client";

const result = await submitFeedback("Test feedback", {
  timeout: 5000, // 5 second timeout
});
```

### Integration with Express.js

```typescript
import express from "express";
import { submitFeedback } from "@squadai/feedback-client";

const app = express();
app.use(express.json());

app.post("/api/feedback", async (req, res) => {
  const { feedback } = req.body;

  if (!feedback) {
    return res.status(400).json({ error: "Feedback is required" });
  }

  const result = await submitFeedback(feedback, {
    source: "WEB_FORM" // Must be uppercase with underscores
  });

  if (result.success) {
    res.json({
      message: "Thank you for your feedback!",
      workspaceId: result.data.data.workspaceId,
    });
  } else {
    res.status(500).json({
      error: "Failed to submit feedback",
      details: result.error.message,
    });
  }
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
```

### Integration with Slack

```typescript
import { submitFeedback } from "@squadai/feedback-client";

// When user posts in a feedback channel
slackApp.message(async ({ message, say }) => {
  const result = await submitFeedback(message.text, {
    source: "SLACK_INTEGRATION" // Must be uppercase with underscores
  });

  if (result.success) {
    await say("Thanks for your feedback! We've recorded it.");
  } else {
    await say("Sorry, failed to record feedback. Please try again.");
  }
});
```

### Batch Import from External Sources

```typescript
import { submitFeedbackBatch } from "@squadai/feedback-client";

// Get responses from your data source
const responses = await getExternalResponses();

// Submit all responses as feedback
const results = await submitFeedbackBatch(
  responses.map((r) => r.text),
  {
    source: "EXTERNAL_IMPORT", // Must be uppercase with underscores
    delayMs: 200,
    continueOnError: true,
  }
);

const successCount = results.filter((r) => r.success).length;
console.log(`Imported ${successCount}/${results.length} responses`);
```

## API Reference

### `submitFeedback(feedback, options?)`

Submit a single feedback item.

**Parameters:**

- `feedback` (string, required): The feedback text to submit
- `options` (object, optional):
  - `source` (string): The source of the feedback. Must contain only uppercase letters and underscores (e.g., "SQUAD_CLIENT", "USER_FEEDBACK"). Defaults to `"SQUAD_CLIENT"`
  - `baseUrl` (string): The base URL for the Squad API. Defaults to `"https://api.meetsquad.ai"`
  - `timeout` (number): Request timeout in milliseconds. Defaults to `10000` (10 seconds)

**Returns:** `Promise<SubmitFeedbackResult>`

The result is a discriminated union type that provides excellent type safety:

```typescript
// Success case
{
  success: true;
  data: SquadFeedbackResponse;
  statusCode: number;
}

// Failure case
{
  success: false;
  error: Error;
  statusCode?: number;
}
```

This means TypeScript will automatically narrow the types based on the `success` field:

```typescript
const result = await submitFeedback("Test");
if (result.success) {
  // TypeScript knows result.data exists here
  console.log(result.data.data.workspaceId);
} else {
  // TypeScript knows result.error exists here
  console.log(result.error.message);
}
```

### `submitFeedbackBatch(feedbackItems, options?)`

Submit multiple feedback items with automatic rate limiting.

**Parameters:**

- `feedbackItems` (string[], required): Array of feedback strings to submit
- `options` (object, optional):
  - All options from `submitFeedback`
  - `delayMs` (number): Delay between submissions in milliseconds to avoid rate limiting. Defaults to `100`
  - `continueOnError` (boolean): Whether to continue submitting if one fails. Defaults to `true`

**Returns:** `Promise<SubmitFeedbackResult[]>`

An array of results for each feedback item, maintaining the same order as the input.

## Environment Variables

- `SQUAD_API_KEY` (required): Your Squad API key

**Note:** The API key is ALWAYS read from the environment variable `SQUAD_API_KEY`. This is a security best practice for backend applications.

## Error Handling

The library provides detailed error information in the result object:

```typescript
const result = await submitFeedback("Test feedback");

if (!result.success) {
  console.error("Error:", result.error.message);
  console.error("Status Code:", result.statusCode);

  // Handle specific errors
  if (result.error.message.includes("SQUAD_API_KEY")) {
    console.error("API key not set in environment");
  } else if (result.error.message.includes("Invalid source format")) {
    console.error("Source must be uppercase letters and underscores only");
  } else if (result.statusCode === 401) {
    console.error("Invalid API key");
  } else if (result.statusCode === 400) {
    console.error("Bad request - check your feedback format");
  } else if (result.error.message.includes("timeout")) {
    console.error("Request timed out");
  }
}
```

## TypeScript Support

This package is written in TypeScript and includes full type definitions. All types are exported:

```typescript
import {
  submitFeedback,
  submitFeedbackBatch,
  type SubmitFeedbackOptions,
  type SubmitFeedbackBatchOptions,
  type SquadFeedbackResponse,
  type SubmitFeedbackResult,
  type SubmitFeedbackSuccess,
  type SubmitFeedbackFailure,
} from "@squadai/feedback-client";
```

## Source Parameter Validation

The `source` parameter is used as a path parameter in the API URL and must follow strict formatting rules:

- ✅ **Valid formats:**
  - `"SQUAD_CLIENT"`
  - `"USER_FEEDBACK"`
  - `"API_INTEGRATION"`
  - `"SLACK_BOT"`
  - `"WEB_FORM"`

- ❌ **Invalid formats:**
  - `"squad-client"` (lowercase and hyphens)
  - `"UserFeedback"` (mixed case)
  - `"USER-FEEDBACK"` (hyphens not allowed)
  - `"SQUAD CLIENT"` (spaces not allowed)
  - `"SQUAD_123"` (numbers not allowed)

If an invalid source format is provided, the library will throw an error with a descriptive message.

## Development

### Building from Source

If you want to contribute or build the package locally:

1. Clone the repository:

```bash
git clone https://github.com/your-org/squad-feedback-client.git
cd squad-feedback-client
```

2. Install dependencies:

```bash
npm install
```

3. Build the package:

```bash
npm run build
```

This will create compiled JavaScript and type definitions in the `dist/` directory.

### Running Tests

```bash
npm test
```

### Running the Example

1. Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

2. Add your API key to `.env`:

```env
SQUAD_API_KEY=your-api-key-here
```

3. Run the example:

```bash
npm run dev
```

## License

MIT

## Support

For issues, questions, or feature requests, please:
- Contact Squad support
- Create an issue in the [GitHub repository](https://github.com/your-org/squad-feedback-client)
- Check our [documentation](https://docs.squadai.com)

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a list of changes in each version.