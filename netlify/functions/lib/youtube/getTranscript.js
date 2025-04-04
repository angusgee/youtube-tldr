const { YoutubeTranscript } = require('youtube-transcript');
const { video_info } = require('play-dl');
const { decode } = require('html-entities');

// TranscriptSegment interface
// {
//     text: string;
//     duration: number;
//     offset: number;
// }

// TranscriptResponse interface
// {
//     url: string;
//     videoId?: string | null;
//     title?: string;
//     transcript?: TranscriptSegment[];
//     error?: string;
// }

function sanitizeFilename(input) {
    return input.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').replace(/_+/g, '_').trim();
}

async function fetchTranscriptData(videoId) {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    let title = undefined;
    let response;

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
        } catch (infoError) {
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

        } catch (transcriptError) {
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

module.exports = {
    fetchTranscriptData,
    sanitizeFilename
};