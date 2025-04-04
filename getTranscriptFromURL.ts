import { YoutubeTranscript } from 'youtube-transcript';
import * as fs from 'fs';
import * as path from 'path';
import { parseArgs } from 'util';
import { video_info } from 'play-dl'; 
import { decode } from 'html-entities'; 

interface TranscriptSegment {
    text: string;
    duration: number;
    offset: number;
}

interface TranscriptResponse {
    url: string;
    videoId?: string | null;
    title?: string; 
    transcript?: TranscriptSegment[];
    error?: string;
}

function sanitizeFilename(input: string): string {
    return input.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').replace(/_+/g, '_').trim();
}

async function main() {
    const options = {
        videoId: { type: 'string', short: 'v' }, 
        outputDir: { type: 'string', short: 'o', default: './transcripts' },
        help: { type: 'boolean', short: 'h' }
    } as const;

    let args;
    try {
        args = parseArgs({
            options,
            allowPositionals: false 
        }).values;
    } catch (e: any) {
        console.error(`Error parsing arguments: ${e.message}`);
        console.error("Usage: ts-node getTranscriptFromURL.ts --videoId <youtube_video_id> [--outputDir <directory>] [-h]");
        process.exit(1);
    }

    if (args.help || !args.videoId) { 
        console.log("Fetches a YouTube video transcript and saves it as JSON and plain text.");
        console.log("Usage: ts-node getTranscriptFromURL.ts --videoId <youtube_video_id> [--outputDir <directory>] [-h|--help]");
        console.log("Options:");
        console.log("  -v, --videoId    (Required) The 11-character ID of the YouTube video.");
        console.log("  -o, --outputDir  (Optional) Directory to save the output files (default: ./transcripts).");
        console.log("  -h, --help       Show this help message.");
        process.exit(0);
    }

    const videoId = args.videoId as string; 
    const outputDir = args.outputDir as string;
    const url = `https://www.youtube.com/watch?v=${videoId}`; 

    if (!fs.existsSync(outputDir)){
        console.log(`Creating output directory: ${outputDir}`);
        fs.mkdirSync(outputDir, { recursive: true });
    }

    let title: string | undefined = undefined; 
    let response: TranscriptResponse;
    let baseFilename: string = videoId; 

    if (!videoId || videoId.length !== 11 || !/^[a-zA-Z0-9_-]+$/.test(videoId)) {
        response = {
            url: url,
            videoId: videoId,
            error: 'Invalid YouTube Video ID format provided via --videoId.'
        };
        baseFilename = `invalid_video_id_${videoId || 'unknown'}`; 
    } else {
        try {
            console.log(`Attempting to fetch video info for ID: ${videoId} (URL: ${url})`);
            const info = await video_info(url);
            title = info.video_details.title;
            console.log(`Successfully fetched title: ${title}`);
            baseFilename = title ? sanitizeFilename(title) : videoId; 
        } catch (infoError: any) {
            console.warn(`Warning: Failed to fetch video title: ${infoError.message}. Using Video ID for filename.`);
            
            // Fallback to secondary method if available in the future
            console.warn('Falling back to video ID for filename.');
            baseFilename = videoId;
        }

        try {
            console.log(`Fetching transcript for ID: ${videoId} (URL: ${url})`);
            const rawTranscript = await YoutubeTranscript.fetchTranscript(url);

            const decodedTranscript = rawTranscript.map(segment => ({
                ...segment,
                text: decode(segment.text)
            }));

            response = {
                url: url,
                videoId: videoId,
                title: title, 
                transcript: decodedTranscript,
            };

        } catch (transcriptError: any) {
            console.error(`Error fetching transcript: ${transcriptError.message}`);
            baseFilename = `${baseFilename}_transcript_error`;
            response = {
                url: url,
                videoId: videoId,
                title: title, 
                error: `Failed to fetch transcript. Reason: ${transcriptError.message || 'Unknown error'}.`
            };
        }
    }

    const jsonOutputPath = path.join(outputDir, `${baseFilename}.json`);
    const textOutputPath = path.join(outputDir, `${baseFilename}.txt`);

    try {
        fs.writeFileSync(jsonOutputPath, JSON.stringify(response, null, 2));
        console.log(`Successfully saved JSON data to: ${jsonOutputPath}`);
    } catch (writeError: any) {
        console.error(`Failed to write JSON output file: ${writeError.message}`);
    }

    if (response.transcript && response.transcript.length > 0) {
        try {
            const fullText = response.transcript.map(segment => segment.text).join(' \n'); 
            fs.writeFileSync(textOutputPath, fullText);
            console.log(`Successfully saved plain text transcript to: ${textOutputPath}`);
        } catch (writeError: any) {
            console.error(`Failed to write text output file: ${writeError.message}`);
        }
    }
}

main();