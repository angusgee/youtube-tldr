# YouTube TL;DR Summarizer

Get quick AI-generated summaries for YouTube videos directly from their ID.

## Features

*   Fetch video title and transcript using just the video ID.
*   Generate a concise summary using the Anthropic Claude Haiku API.
*   Save transcript data (JSON, TXT) and the summary (Markdown) to the `./outputs` directory.

## Tech Stack

*   Node.js
*   TypeScript
*   Anthropic API (Claude 3.5 Haiku via `@anthropic-ai/sdk`)
*   `youtube-transcript`
*   `play-dl` (for video title)
*   `dotenv`

## Setup

1.  **Clone:** `git clone https://github.com/angusgee/youtube-tldr.git`
2.  **Navigate:** `cd youtube-tldr`
3.  **Install:** `npm install`
4.  **Configure API Key:**
    *   Create a `.env` file in the project root.
    *   Add your Anthropic API key: `ANTHROPIC_API_KEY=your_actual_api_key`

## Usage

1.  **Set Video ID:** Open `main.ts` and change the `exampleVideoId` variable.
2.  **Run:** `npx ts-node main.ts`
3.  **Check Output:** Find the results in the `./outputs` directory.

---

*Built to demonstrate modular TypeScript, API integration, and async handling.*
