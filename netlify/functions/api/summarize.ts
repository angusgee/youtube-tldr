import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
// Import the specific function and the response type
import { fetchTranscriptData, TranscriptResponse } from '../lib/youtube/getTranscript'; 
import { createSummary } from '../lib/summarization/createSummary';

// Define an interface for the expected request body
interface SummarizeRequestBody {
    videoId?: string; // videoId is optional in the body structure initially
}

// Define an interface for the successful response body
interface SummarizeResponseBody {
    title?: string; // title can be undefined if fetching failed
    videoId: string;
    summary: string;
}

// Define an interface for the error response body
interface ErrorResponseBody {
    error: string;
}

const handler: Handler = async (event: HandlerEvent, context: HandlerContext): Promise<{ statusCode: number; body: string; headers?: {[key: string]: string} }> => {
    // Only accept POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' } satisfies ErrorResponseBody),
            headers: { 'Allow': 'POST' } // Inform client about allowed method
        };
    }

    try {
        // Safely parse JSON body, default to empty object if body is null/undefined
        let requestBody: SummarizeRequestBody = {};
        if (event.body) {
            try {
                requestBody = JSON.parse(event.body);
            } catch (parseError) {
                console.error("Error parsing request body:", parseError);
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: 'Invalid JSON body' } satisfies ErrorResponseBody),
                };
            }
        } else {
             console.log("Request body is empty or null.");
             // Continue, but videoId check below will handle it
        }

        const videoId = requestBody.videoId;

        if (!videoId) {
             console.error("Video ID missing from request body.");
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Video ID is required in the request body' } satisfies ErrorResponseBody),
            };
        }

        // 1. Fetch Transcript - Use the imported type
        console.log(`[summarize] Fetching transcript for videoId: ${videoId}`);
        const transcriptResponse: TranscriptResponse = await fetchTranscriptData(videoId);

        if (transcriptResponse.error) {
            console.error(`[summarize] Error fetching transcript: ${transcriptResponse.error}`);
            // Determine appropriate status code based on error type if possible
            const statusCode = transcriptResponse.error.includes("Invalid YouTube Video ID") ? 400 : 500; 
            return {
                statusCode: statusCode,
                body: JSON.stringify({ error: transcriptResponse.error } satisfies ErrorResponseBody),
            };
        }

        // Ensure transcript exists and is not empty before proceeding
        // The `?` handles cases where transcript might be undefined
        const fullText = transcriptResponse.transcript?.map(segment => segment.text).join(' \n') || '';
        if (!fullText) {
            console.error(`[summarize] Transcript is empty or missing for videoId: ${videoId}`);
            return {
                // Consider 404 if the video exists but has no transcript?
                statusCode: 500, 
                body: JSON.stringify({ error: 'Could not retrieve a non-empty transcript for this video.' } satisfies ErrorResponseBody),
            };
        }

        // 2. Generate Summary
        console.log(`[summarize] Generating summary for videoId: ${videoId}`);
        const summaryText = await createSummary(fullText);

        if (!summaryText) {
            console.error(`[summarize] Failed to generate summary for videoId: ${videoId}`);
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Failed to generate summary' } satisfies ErrorResponseBody),
            };
        }

        // 3. Return Success Response - Use the defined interface
        console.log(`[summarize] Successfully generated summary for videoId: ${videoId}`);
        const responseBody: SummarizeResponseBody = {
            title: transcriptResponse.title, // This can be undefined, matching the interface
            videoId: videoId,
            summary: summaryText,
        };

        return {
            statusCode: 200,
            body: JSON.stringify(responseBody),
            headers: {
                'Content-Type': 'application/json'
            }
        };

    } catch (error: any) { // Type the catch error
        console.error('[summarize] Unhandled error processing request:', error?.message || error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error' } satisfies ErrorResponseBody),
        };
    }
};

export { handler };
