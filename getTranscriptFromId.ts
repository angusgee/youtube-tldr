import { YoutubeTranscript } from 'youtube-transcript';
import { video_info } from 'play-dl';
import { decode } from 'html-entities';

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
    return input.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').replace(/_+/g, '_').trim();
}

export async function fetchTranscriptData(videoId: string): Promise<TranscriptResponse> {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    let title: string | undefined = undefined;
    let response: TranscriptResponse;

    if (!videoId || videoId.length !== 11 || !/^[a-zA-Z0-9_-]+$/.test(videoId)) {
        response = {
            url: url,
            videoId: videoId,
            error: 'Invalid YouTube Video ID format provided.'
        };
    } else {
        try {
            console.log(`Attempting to fetch video info for ID: ${videoId} (URL: ${url})`);
            const info = await video_info(url);
            title = info.video_details.title;
            console.log(`Successfully fetched title: ${title}`);
        } catch (infoError: any) {
            console.warn(`Warning: Failed to fetch video title: ${infoError.message}.`);
            console.warn('Proceeding without title.');
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
            response = {
                url: url,
                videoId: videoId,
                title: title,
                error: `Failed to fetch transcript. Reason: ${transcriptError.message || 'Unknown error'}.`
            };
        }
    }

    return response;
}