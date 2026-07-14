import { QdrantClient } from '@qdrant/js-client-rest';
import * as cheerio from 'cheerio';
import * as dotenv from 'dotenv';
import { embedText } from './src/agent/embedding.util';

dotenv.config();

const QDRANT_URL = process.env.QDRANT_URL;
const QDRANT_API_KEY = process.env.QDRANT_API_KEY;
const COLLECTION_NAME = 'learning_concepts';

if (!QDRANT_URL || !QDRANT_API_KEY) {
  console.error("Missing Qdrant credentials in .env");
  process.exit(1);
}

const client = new QdrantClient({
  url: QDRANT_URL,
  apiKey: QDRANT_API_KEY,
});

async function scrapeAndSeed() {
  console.log("Fetching live Electrostatics content from Wikipedia...");
  
  // Fetch real content from Wikipedia
  const response = await fetch('https://en.wikipedia.org/wiki/Electrostatics');
  const html = await response.text();
  const $ = cheerio.load(html);

  const chunks: any[] = [];
  let currentId = 100;
  
  // Find all paragraphs
  $('p').each((i, elem) => {
    const text = $(elem).text().replace(/\[\d+\]/g, '').trim(); // Remove citations like [1]
    
    // Only take substantial paragraphs
    if (text.length > 150) {
      chunks.push({
        id: currentId++,
        title: `Electrostatics Concept ${currentId - 100}`,
        content: text,
        metadata: { chapter: "Electrostatics", topic: "General Electrostatics", concept: "Wikipedia Scrape" }
      });
    }
  });

  // Limit to top 50 paragraphs to avoid overloading the console
  const finalChunks = chunks.slice(0, 50);

  console.log(`Successfully scraped ${finalChunks.length} high-density physics paragraphs!`);

  const points: any[] = [];

  console.log("Formatting payloads and generating real embeddings...");
  for (const chunk of finalChunks) {
    const vector = await embedText(chunk.content);

    points.push({
      id: chunk.id,
      vector,
      payload: {
        title: chunk.title,
        text: chunk.content, 
        chapter: chunk.metadata.chapter,
        topic: chunk.metadata.topic,
        concept: chunk.metadata.concept,
        source: "Wikipedia: Electrostatics"
      }
    });
  }

  console.log("Uploading rich text payloads to Qdrant...");
  await client.upsert(COLLECTION_NAME, {
    wait: true,
    points: points
  });

  console.log("Successfully seeded Qdrant with real web-scraped educational content!");
}

scrapeAndSeed().catch(console.error);
