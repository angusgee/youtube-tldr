import Anthropic from '@anthropic-ai/sdk';
import * as dotenv from 'dotenv';

dotenv.config();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Sends text to the Anthropic API for summarisation.
 *
 * @param transcriptText The transcript text to summarise.
 * @returns The summary text as a string, or null if an error occurs.
 */
export async function createSummary(transcriptText: string): Promise<string | null> {
  console.log(`Received transcript text. Length: ${transcriptText.length} characters.`);
  try {
    if (!transcriptText.trim()) {
      console.error('Error: Transcript text is empty or contains only whitespace.');
      return null;
    }

    console.log(`Sending transcript to Anthropic API (model: claude-3-5-haiku-20241022)...`);
    const msg = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Please summarise the following video transcript concisely. Don't add any introductory text like "Here's a concise summary:" just return the summary in markdown format.\n\n${transcriptText}`,
        },
      ],
    });

    console.log('Received summary from Anthropic API.');

    let summaryText: string | null = null;
    if (Array.isArray(msg.content) && msg.content.length > 0 && msg.content[0].type === 'text') {
        summaryText = msg.content[0].text;
    } else {
        console.error('Error: Unexpected response format from Anthropic API.');
        console.error('API Response:', JSON.stringify(msg, null, 2));
        return null;
    }

    return summaryText;

  } catch (error) {
    console.error('An error occurred during summarisation:', error);
    return null;
  }
}