const { fetchTranscriptData } = require('../../../getTranscriptFromId');
const { createSummary } = require('../../../createSummaryFromText');

exports.handler = async (event) => {
  // Only accept POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const { videoId } = JSON.parse(event.body || '{}');
    
    if (!videoId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Video ID is required' }),
      };
    }

    // Process the video (using your existing code)
    const transcriptResponse = await fetchTranscriptData(videoId);
    
    if (transcriptResponse.error) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: transcriptResponse.error }),
      };
    }

    // Create full transcript
    const fullText = transcriptResponse.transcript?.map(segment => segment.text).join(' \n') || '';
    
    // Generate summary
    const summaryText = await createSummary(fullText);
    
    if (!summaryText) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to generate summary' }),
      };
    }

    // Return the result
    return {
      statusCode: 200,
      body: JSON.stringify({
        title: transcriptResponse.title,
        videoId,
        summary: summaryText,
      }),
    };
  } catch (error) {
    console.error('Error processing request:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};