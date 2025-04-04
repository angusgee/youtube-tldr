import * as fs from 'fs/promises';
import * as path from 'path';
import { fetchTranscriptData, sanitizeFilename, TranscriptSegment } from './getTranscriptFromId';
import { createSummary } from './createSummaryFromText';

const OUTPUT_DIR = './outputs';

async function processVideo(videoId: string): Promise<void> {
    console.log(`--- Processing video ID: ${videoId} ---`);

    // 1. Fetch transcript data
    const transcriptResponse = await fetchTranscriptData(videoId);

    // Handle errors from fetching transcript
    if (transcriptResponse.error) {
        console.error(`Failed to fetch transcript data: ${transcriptResponse.error}`);
        // Save error information
        const errorFilename = sanitizeFilename(`error_${videoId}`);
        const errorFilePath = path.join(OUTPUT_DIR, `${errorFilename}.json`);
        try {
            await fs.mkdir(OUTPUT_DIR, { recursive: true });
            await fs.writeFile(errorFilePath, JSON.stringify(transcriptResponse, null, 2));
            console.log(`Error details saved to: ${errorFilePath}`);
        } catch (writeError: any) {
            console.error(`Failed to write error file: ${writeError.message}`);
        }
        return; // Stop processing if transcript fetch failed
    }

    // Ensure transcript exists and is not empty
    if (!transcriptResponse.transcript || transcriptResponse.transcript.length === 0) {
        console.error('Error: Transcript data is missing or empty.');
        // Optionally save info
        const infoFilename = sanitizeFilename(`${transcriptResponse.title || videoId}_no_transcript`);
        const infoFilePath = path.join(OUTPUT_DIR, `${infoFilename}.json`);
        try {
             await fs.mkdir(OUTPUT_DIR, { recursive: true });
             await fs.writeFile(infoFilePath, JSON.stringify(transcriptResponse, null, 2));
             console.log(`Info (no transcript) saved to: ${infoFilePath}`);
        } catch (writeError: any) {
            console.error(`Failed to write info file: ${writeError.message}`);
        }
        return; // Stop processing if no transcript
    }

    console.log(`Successfully fetched transcript data for title: "${transcriptResponse.title || '(No Title)'}"`);

    // Construct the full transcript text
    const fullText = transcriptResponse.transcript.map((segment: TranscriptSegment) => segment.text).join(' \n');

    // 2. Create summary from transcript text
    const summaryText = await createSummary(fullText);

    // Handle errors from summarisation
    if (!summaryText) {
        console.error('Failed to generate summary.');
        return; 
    }

    console.log('Successfully generated summary.');

    // 3. Save the results (Transcript JSON, Transcript TXT, Summary MD)
    const baseFilename = sanitizeFilename(transcriptResponse.title || videoId);
    const jsonOutputPath = path.join(OUTPUT_DIR, `${baseFilename}.json`);
    const textOutputPath = path.join(OUTPUT_DIR, `${baseFilename}.txt`);
    const summaryOutputPath = path.join(OUTPUT_DIR, `${baseFilename}-summary.md`);

    try {
        // Ensure output directory exists
        await fs.mkdir(OUTPUT_DIR, { recursive: true });
        console.log(`Ensured output directory exists: ${OUTPUT_DIR}`);

        // Save JSON
        await fs.writeFile(jsonOutputPath, JSON.stringify(transcriptResponse, null, 2));
        console.log(`Transcript JSON saved to: ${jsonOutputPath}`);

        // Save Text
        await fs.writeFile(textOutputPath, fullText);
        console.log(`Transcript text saved to: ${textOutputPath}`);

        // Save Summary
        await fs.writeFile(summaryOutputPath, summaryText);
        console.log(`Summary markdown saved to: ${summaryOutputPath}`);

    } catch (writeError: any) {
        console.error(`Failed to write output files: ${writeError.message}`);
    }

    console.log(`--- Finished processing video ID: ${videoId} ---`);
}

// --- Entry Point ---
// Example usage: Replace with actual video ID input mechanism (e.g., command line args, API request)
const exampleVideoId = 'h5J3YOnBiZ8'; // Example: ITPM flash
// const exampleVideoId = 'invalid-id'; // Example: Invalid ID
// const exampleVideoId = 'J---aiyznGQ'; // Example: Video with potentially no transcript

if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Error: ANTHROPIC_API_KEY environment variable is not set.');
    console.log('Please create a .env file in the root directory with ANTHROPIC_API_KEY=your_key');
    process.exit(1);
}

processVideo(exampleVideoId)
    .then(() => console.log('\nApplication finished.'))
    .catch(error => {
        console.error('\nUnhandled error in main process:', error);
        process.exit(1);
    });