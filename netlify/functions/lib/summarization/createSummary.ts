import Anthropic from '@anthropic-ai/sdk';
import * as dotenv from 'dotenv';

// Load environment variables from .env file in the root project directory
// Note: Netlify automatically handles .env files during build and in Netlify Dev
// but running this locally might require it.
dotenv.config({ path: '../../.env' }); // Adjust path relative to this file

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Sends text to the Anthropic API for summarization.
 *
 * @param transcriptText The transcript text to summarize.
 * @returns The summary text as a string, or null if an error occurs.
 */
export async function createSummary(transcriptText: string): Promise<string | null> {
  console.log(`Received transcript text. Length: ${transcriptText.length} characters.`);

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Error: ANTHROPIC_API_KEY environment variable is not set.');
    return null; // Return null or throw an error if the key is missing
  }

  try {
    if (!transcriptText.trim()) {
      console.error('Error: Transcript text is empty or contains only whitespace.');
      return null;
    }

    // Note: Model name was updated in original user request, using that one
    console.log(`Sending transcript to Anthropic API (model: claude-3-haiku-20240307)...`); 
    const msg = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307', // Ensure this is the model you intend to use
      max_tokens: 1024, // Adjust as needed
      messages: [
        {
          role: 'user',
          // Using the prompt format from the summarize.ts suggestion
          content: `Please summarize the following video transcript concisely. Focus on the key points and main topics. Output the summary directly in Markdown format, without any introductory phrases like "Here's a summary:".\n\nTranscript:\n${transcriptText}`,
        },
      ],
    });

    console.log('Received summary from Anthropic API.');

    // Check the response structure (Anthropic SDK might evolve)
    if (Array.isArray(msg.content) && msg.content[0]?.type === 'text') {
        return msg.content[0].text;
    } else {
        console.error('Error: Unexpected response format from Anthropic API.');
        console.error('API Response:', JSON.stringify(msg, null, 2));
        return null;
    }

  } catch (error: any) { // Added type annotation for error
    console.error('An error occurred during summarization:', error?.message || error);
    // Log more details if available from the SDK error structure
    if (error?.response?.data) {
        console.error('API Error Data:', error.response.data);
    }
    return null;
  }
}

// No need for module.exports in TypeScript with ES modules
