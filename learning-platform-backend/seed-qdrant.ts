import { QdrantClient } from '@qdrant/js-client-rest';
import * as dotenv from 'dotenv';
import { embedText, EMBEDDING_DIM } from './src/agent/embedding.util';

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

// The concept-based chunks we discussed (Structural Chunking)
const chunks = [
  {
    id: 1,
    title: "Definition of Electric Flux",
    content: "Electric flux is a measure of the total number of electric field lines passing through a given surface. It is a scalar quantity. Formula for uniform field: phi_E = E * A * cos(theta), where theta is the angle between electric field and the area vector. For closed surfaces, the area vector is always directed outwards. Outgoing flux is Positive (+), Incoming flux is Negative (-).",
    metadata: { chapter: "Electrostatics", topic: "Gauss Law", concept: "Electric Flux" }
  },
  {
    id: 2,
    title: "Gauss's Law Statement",
    content: "Gauss’s Law provides a relationship between the net electric flux through a closed surface (Gaussian surface) and the net charge enclosed by that surface. Mathematical Statement: phi_E = Integral(E * dA) = q_enclosed / epsilon_0. The law is valid for any closed surface of any shape or size. Only the charges inside the Gaussian surface contribute to the flux. The flux is independent of the shape of the Gaussian surface and the position of the charge(s) inside it.",
    metadata: { chapter: "Electrostatics", topic: "Gauss Law", concept: "Gauss Law Statement" }
  },
  {
    id: 3,
    title: "Common Applications of Gauss's Law",
    content: "Gauss’s Law is primarily used in JEE to calculate the electric field for highly symmetric charge distributions. 1. Uniformly Charged Spherical Shell: Outside (r >= R) behaves like point charge at center. Inside conducting shell: E = 0. 2. Infinitely Long Uniformly Charged Wire: E is inversely proportional to distance (E = lambda / 2*pi*epsilon_0*r). 3. Infinite Plane Sheet of Charge: Electric field is uniform (E = sigma / 2*epsilon_0), does not depend on distance.",
    metadata: { chapter: "Electrostatics", topic: "Gauss Law", concept: "Applications of Gauss Law" }
  },
  {
    id: 4,
    title: "JEE Problem Tips for Flux and Symmetry",
    content: "Choosing the Gaussian Surface: Always pick a surface that passes through the point where you want to find the field and takes advantage of the symmetry. Flux through Cubes: JEE frequently asks for flux through one face of a cube when a charge is placed at its center, corner, or edge. Remember to use symmetry or 'enclose' the charge by creating a larger imaginary Gaussian surface (e.g., placing the charge at the corner of 8 identical cubes). If a closed surface encloses no net charge, net flux is zero.",
    metadata: { chapter: "Electrostatics", topic: "Gauss Law", concept: "JEE Problem Tips" }
  }
];

async function main() {
  console.log("Loading local embedding model (all-MiniLM-L6-v2)...");

  // Check if collection exists
  const collections = await client.getCollections();
  const exists = collections.collections.some(c => c.name === COLLECTION_NAME);

  if (!exists) {
    console.log(`Creating collection ${COLLECTION_NAME}...`);
    await client.createCollection(COLLECTION_NAME, {
      vectors: {
        size: EMBEDDING_DIM, // specific to all-MiniLM-L6-v2
        distance: 'Cosine'
      }
    });
  } else {
    console.log(`Collection ${COLLECTION_NAME} already exists.`);
  }

  const points: any[] = [];

  console.log("Generating real embeddings and preparing payload...");
  for (const chunk of chunks) {
    // Generate a real semantic embedding for the chunk content
    const vector = await embedText(chunk.content);

    points.push({
      id: chunk.id,
      vector: vector,
      payload: {
        title: chunk.title,
        text: chunk.content, // Storing the text in payload for retrieval (Parent Chunk)
        chapter: chunk.metadata.chapter,
        topic: chunk.metadata.topic,
        concept: chunk.metadata.concept
      }
    });
  }

  console.log("Uploading to Qdrant...");
  await client.upsert(COLLECTION_NAME, {
    wait: true,
    points: points
  });

  console.log("Successfully seeded Qdrant with Gauss Law concepts!");
}

main().catch(console.error);
