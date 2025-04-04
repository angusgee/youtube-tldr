import * as fs from 'fs/promises';
import * as path from 'path';
import Anthropic from '@anthropic-ai/sdk';
import * as dotenv from 'dotenv';

dotenv.config();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Reads text from a file, sends it to the Anthropic API for summarization,
 * and saves the summary to a new Markdown file.
 *
 * @param transcriptFilePath The absolute path to the transcript text file.
 * @param baseFileName A base name (like video ID or title) for the output summary file.
 */
async function createSummary(transcriptFilePath: string, baseFileName: string): Promise<void> {
  console.log(`Reading transcript from: ${transcriptFilePath}`);
  try {
    // 1. Read the transcript file
    const transcriptText = await fs.readFile(transcriptFilePath, 'utf-8');
    console.log(`Successfully read transcript. Length: ${transcriptText.length} characters.`);

    if (!transcriptText.trim()) {
      console.error('Error: Transcript file is empty or contains only whitespace.');
      return;
    }

    // 2. Send text to Anthropic API for summarization
    console.log(`Sending transcript to Anthropic API (model: claude-3-5-haiku-20241022)...`);
    const msg = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 1024, // Adjust max_tokens as needed
      messages: [
        {
          role: 'user',
          content: `Please summarize the following video transcript concisely. Don't add any introductory text like "Here's a concise summary:" just return the summary in markdown format.

${transcriptText}`,
        },
      ],
    });

    console.log('Received summary from Anthropic API.');

    // Extract the summary text - Assuming the response structure
    // Check the actual structure of msg.content if this doesn't work
    let summaryText = '';
    if (Array.isArray(msg.content) && msg.content.length > 0 && msg.content[0].type === 'text') {
        summaryText = msg.content[0].text;
    } else {
        console.error('Error: Unexpected response format from Anthropic API.');
        console.error('API Response:', JSON.stringify(msg, null, 2));
        return;
    }


    // 3. Generate filename and save the summary
    const outputFileName = `${baseFileName}-summary.md`;
    const outputDirectory = path.dirname(transcriptFilePath); // Save in the same directory as the transcript
    const outputFilePath = path.join(outputDirectory, outputFileName);

    console.log(`Saving summary to: ${outputFilePath}`);
    await fs.writeFile(outputFilePath, summaryText, 'utf-8');
    console.log('Summary saved successfully!');

  } catch (error) {
    console.error('An error occurred:', error);
  }
}

const transcriptPath = path.resolve(__dirname, 'transcripts', 'LjbNtw14TwI.txt'); 
const videoIdentifier = 'LjbNtw14TwI'; 

createSummary(transcriptPath, videoIdentifier)
  .then(() => console.log('Summary creation process finished.'))
  .catch(err => console.error('Summary creation failed:', err));