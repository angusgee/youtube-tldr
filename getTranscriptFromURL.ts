import { YoutubeTranscript } from 'youtube-transcript';
import * as fs from 'fs';
import * as path from 'path';
import { parseArgs } from 'util';
import ytdl from 'ytdl-core'; 
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

function getVideoId(url: string): string | null {
    const regex = /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

function sanitizeFilename(input: string): string {
    return input.replace(/[<>:"/\|?*\x00-\x1F]/g, '_').replace(/_+/g, '_').trim();
}

function getCurrentDateString(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); 
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

async function main() {
    const options = {
        url: { type: 'string', short: 'u' },
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
        console.error("Usage: ts-node getTranscriptFromURL.ts --url <youtube_url> [--outputDir <directory>] [-h]");
        process.exit(1);
    }

    if (args.help || !args.url) {
        console.log("Fetches a YouTube video transcript and saves it as JSON and plain text.");
        console.log("Usage: ts-node getTranscriptFromURL.ts --url <youtube_url> [--outputDir <directory>] [-h|--help]");
        console.log("Options:");
        console.log("  -u, --url        (Required) The full URL of the YouTube video.");
        console.log("  -o, --outputDir  (Optional) Directory to save the output files (default: ./transcripts).");
        console.log("  -h, --help       Show this help message.");
        process.exit(0);
    }

    const url = args.url as string;
    const outputDir = args.outputDir as string;

    if (!fs.existsSync(outputDir)){
        console.log(`Creating output directory: ${outputDir}`);
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const videoId = getVideoId(url);
    let title: string | undefined = undefined; 
    let response: TranscriptResponse;
    let baseFilename: string = `${getCurrentDateString()}_${videoId || 'error'}`;

    if (!videoId && !url.includes('youtube.com') && !url.includes('youtu.be')) {
        response = {
            url: url,
            videoId: videoId,
            error: 'Invalid YouTube URL format provided via --url.'
        };
        baseFilename = `${getCurrentDateString()}_invalid_url`;
    } else {
        try {
            console.log(`Attempting to fetch video info for: ${url}`);
            const info = await ytdl.getInfo(url);
            title = info.videoDetails.title;
            console.log(`Successfully fetched title: ${title}`);
            baseFilename = `${getCurrentDateString()}_${sanitizeFilename(title)}`;
        } catch (infoError: any) {
            console.warn(`Warning: Failed to fetch video title: ${infoError.message}. Proceeding without title.`);
            baseFilename = `${getCurrentDateString()}_${videoId}_title_fetch_failed`;
        }

        try {
            console.log(`Fetching transcript for: ${url}`);
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
            if (title) {
                baseFilename = `${getCurrentDateString()}_${sanitizeFilename(title)}_transcript_error`;
            } else {
                baseFilename = `${getCurrentDateString()}_${videoId}_transcript_error`;
            }
            response = {
                url: url,
                videoId: videoId,
                title: title, 
                error: `Failed to fetch transcript. Reason: ${transcriptError.message || 'Unknown error'}.`
            };
        }
    }

    const jsonOutputPath = path.join(outputDir, `${baseFilename}.json`);
    const textOutputPath = path.join(outputDir, `${baseFilename}-text.txt`);

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