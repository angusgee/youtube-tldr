import { YoutubeTranscript } from 'youtube-transcript';
import { video_info } from 'play-dl';
import { decode } from 'html-entities';

// Define interfaces matching your original TS file
export interface TranscriptSegment {
    text: string;
    duration: number;
    offset: number;
}

export interface TranscriptResponse {
    url: string;
    videoId?: string | null;
    title?: string;
    transcript?: TranscriptSegment[];
    error?: string;
}

export function sanitizeFilename(input: string): string {
    // Replace characters that are invalid in filenames on most systems
    // Also replace consecutive underscores with a single one
    return input.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').replace(/_+/g, '_').trim();
}

export async function fetchTranscriptData(videoId: string): Promise<TranscriptResponse> {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    let title: string | undefined = undefined;
    // Removed redundant `response` declaration here

    if (!videoId || videoId.length !== 11 || !/^[a-zA-Z0-9_-]+$/.test(videoId)) {
        // Return directly when input is invalid
        return { 
            url: url,
            videoId: videoId,
            error: 'Invalid YouTube Video ID format provided.'
        };
    }

    try {
        console.log(`Attempting to fetch video info for ID: ${videoId} (URL: ${url})`);
        // Use any for info type
        const info: any = await video_info(url);
        title = info.video_details.title;
        console.log(`Successfully fetched title: ${title}`);
    } catch (infoError: any) { // Type the catch error
        console.warn(`Warning: Failed to fetch video title: ${infoError?.message}.`);
        console.warn('Proceeding without title.');
        // No need to set response here, title is just undefined
    }

    try {
        console.log(`Fetching transcript for ID: ${videoId} (URL: ${url})`);
        // Type the raw transcript as any[]
        const rawTranscript: any[] = await YoutubeTranscript.fetchTranscript(url);

        // Type the decoded transcript
        const decodedTranscript: TranscriptSegment[] = rawTranscript.map(segment => ({
            // Add explicit properties since rawTranscript is any[]
            text: decode(segment.text),
            duration: segment.duration,
            offset: segment.offset
        }));

        // Return success response directly
        return { 
            url: url,
            videoId: videoId,
            title: title, // title might be undefined here, which is fine
            transcript: decodedTranscript,
        };

    } catch (transcriptError: any) { // Type the catch error
        console.error(`Error fetching transcript: ${transcriptError?.message}`);
        // Return error response directly
        return { 
            url: url,
            videoId: videoId,
            title: title, // Include title if fetched, even if transcript fails
            error: `Failed to fetch transcript. Reason: ${transcriptError?.message || 'Unknown error'}.`
        };
    }
    // The logic now returns directly from within the try/catch blocks or the initial validation,
    // so no final return statement is needed here.
}
