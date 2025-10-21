# Getting Started with Squad Feedback Library

This guide will help you get started with the Squad Feedback Library in just a few minutes.

## Prerequisites

- Node.js 18+ installed
- A Squad API key (obtainable from your Squad dashboard)

## Step 1: Install Dependencies

Navigate to the `squad-feedback-client` directory and install dependencies:

```bash
cd squad-feedback-client
npm install
```

## Step 2: Set Up Your Environment

1. Copy the example environment file:

```bash
cp .env.example .env
```

2. Edit `.env` and add your Squad API key:

```bash
SQUAD_API_KEY=your-actual-api-key-here
```

## Step 3: Run the Example

Test the library with the included example:

```bash
npm run dev
```

You should see output showing successful feedback submission!

## Step 4: Use in Your Own Code

### Simple Example

Create a new file (e.g., `my-feedback.ts`) in the `src/` directory:

```typescript
import 'dotenv/config';
import { submitFeedback } from './index.js';

// The API key is automatically read from process.env.SQUAD_API_KEY
const result = await submitFeedback('This is my first feedback!');

if (result.success) {
  console.log('Success! ✓');
  console.log('Workspace ID:', result.data?.data.workspaceId);
} else {
  console.error('Error:', result.error?.message);
}
```

Run it with:

```bash
tsx src/my-feedback.ts
```

### Integration Example (Express.js)

Here's how to integrate the library into an Express.js application:

```typescript
import express from 'express';
import { submitFeedback } from '@squad/feedback-client';

const app = express();
app.use(express.json());

app.post('/api/feedback', async (req, res) => {
  const { feedback } = req.body;

  if (!feedback) {
    return res.status(400).json({ error: 'Feedback is required' });
  }

  // API key is automatically read from process.env.SQUAD_API_KEY
  const result = await submitFeedback(feedback, { source: 'MANUAL' });

  if (result.success) {
    res.json({
      message: 'Thank you for your feedback!',
      workspaceId: result.data?.data.workspaceId,
    });
  } else {
    res.status(500).json({
      error: 'Failed to submit feedback',
      details: result.error?.message,
    });
  }
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
```

## Step 5: Build for Production

When you're ready to use this in production:

1. Build the TypeScript code:

```bash
npm run build
```

2. The compiled JavaScript will be in the `dist/` directory.

3. You can now import and use it in your production code:

```typescript
import { submitFeedback } from './dist/index.js';
```

## Common Use Cases

### Use Case 1: User Feedback Form

```typescript
import { submitFeedback } from '@squad/feedback-client';

// After user submits feedback form
const result = await submitFeedback(userFeedbackText, { source: 'MANUAL' });

if (result.success) {
  // Show success message to user
  showNotification('Thank you for your feedback!');
} else {
  // Log error and show generic message
  console.error('Failed to submit feedback:', result.error);
  showNotification('Something went wrong. Please try again.');
}
```

### Use Case 2: Slack Integration

```typescript
import { submitFeedback } from '@squad/feedback-client';

// When user posts in a feedback channel
slackApp.message(async ({ message, say }) => {
  const result = await submitFeedback(message.text, { source: 'SLACK' });

  if (result.success) {
    await say('Thanks for your feedback! We've recorded it.');
  } else {
    await say('Sorry, failed to record feedback. Please try again.');
  }
});
```

### Use Case 3: Batch Import from Typeform

```typescript
import { submitFeedbackBatch } from '@squad/feedback-client';

// Get responses from Typeform
const responses = await getTypeformResponses();

// Submit all responses as feedback
const results = await submitFeedbackBatch(
  responses.map((r) => r.answer),
  {
    source: 'TYPEFORM',
    delayMs: 200, // Be nice to the API
    continueOnError: true,
  }
);

const successCount = results.filter((r) => r.success).length;
console.log(`Imported ${successCount}/${results.length} responses`);
```

## Troubleshooting

### "SQUAD_API_KEY environment variable is not set" error

Make sure you've set the `SQUAD_API_KEY` environment variable:

```bash
export SQUAD_API_KEY=your-api-key-here
```

Or add it to your `.env` file.

### "Request timeout" error

Try increasing the timeout in the options:

```typescript
const result = await submitFeedback('Test feedback', {
  timeout: 30000, // 30 seconds
});
```

### 401 Unauthorized error

Your API key may be invalid or expired. Check your Squad dashboard to verify.

### Rate limiting

If you're submitting many feedback items, use the `submitFeedbackBatch` function with a delay:

```typescript
import { submitFeedbackBatch } from '@squad/feedback-client';

const results = await submitFeedbackBatch(feedbackItems, {
  delayMs: 500, // Wait 500ms between each submission
});
```

## Environment Configuration

The library always reads the API key from the `SQUAD_API_KEY` environment variable. This is a security best practice for backend applications.

### Development

```bash
export SQUAD_API_KEY=dev-api-key
```

### Staging

```bash
export SQUAD_API_KEY=staging-api-key
```

### Production

```bash
export SQUAD_API_KEY=prod-api-key
```

You can override the API base URL for different environments:

```typescript
// Development
const result = await submitFeedback('Test', {
  baseUrl: 'https://dev.api.meetsquad.ai',
});

// Staging
const result = await submitFeedback('Test', {
  baseUrl: 'https://uat.api.meetsquad.ai',
});

// Production (default)
const result = await submitFeedback('Test');
```

## Next Steps

- Read the full [README.md](./README.md) for complete API documentation
- Check out the [example.ts](./src/example.ts) file for more examples
- Integrate the library into your application
- Start collecting valuable user feedback with Squad!

## Support

For issues or questions:

- Check the [README.md](./README.md) for API documentation
- Contact Squad support
- Review the example code in [example.ts](./src/example.ts)
