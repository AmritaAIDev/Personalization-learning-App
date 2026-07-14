import { QdrantClient } from '@qdrant/js-client-rest';
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

const chunks = [
  {
    id: 10,
    title: "Electric Charge and Properties",
    content: "Charge is quantized (q = ±ne), conserved, and additive. It is an inherent property of matter associated with mass. The fundamental unit of charge is the electron charge e = 1.6 x 10^-19 C.",
    metadata: { chapter: "Electrostatics", topic: "Electric Charge", concept: "Properties of Charge" }
  },
  {
    id: 11,
    title: "Coulomb's Law",
    content: "The electrostatic force between two stationary point charges is F = k * (q1 * q2) / r^2, where k = 1 / (4*pi*epsilon_0) = 9 x 10^9 Nm^2/C^2. It follows the superposition principle: the net force on a charge is the vector sum of individual forces exerted by other charges.",
    metadata: { chapter: "Electrostatics", topic: "Coulomb's Law", concept: "Force between charges" }
  },
  {
    id: 12,
    title: "Electric Field Definition",
    content: "Electric field is defined as the force per unit test charge: E = F / q_t. For a point charge, the electric field at a distance r is E = k * q / r^2.",
    metadata: { chapter: "Electrostatics", topic: "Electric Field", concept: "Field Definition" }
  },
  {
    id: 13,
    title: "Electric Dipole",
    content: "A system of two equal and opposite charges separated by distance 2a is a dipole. The dipole moment p = q * (2a), directed from negative to positive charge.",
    metadata: { chapter: "Electrostatics", topic: "Electric Field", concept: "Dipole Moment" }
  },
  {
    id: 14,
    title: "Electric Flux",
    content: "Electric flux is a measure of the total number of electric field lines passing through a given surface. Formula: phi = Integral(E . dA). For closed surfaces, the area vector is directed outwards.",
    metadata: { chapter: "Electrostatics", topic: "Gauss Law", concept: "Electric Flux" }
  },
  {
    id: 15,
    title: "Gauss's Law",
    content: "Gauss's Law: The total flux through a closed surface is phi = Q_enc / epsilon_0. It is primarily used to find the electric field of highly symmetric charge distributions (spherical, cylindrical, planar).",
    metadata: { chapter: "Electrostatics", topic: "Gauss Law", concept: "Gauss Law Statement" }
  },
  {
    id: 16,
    title: "Electric Potential",
    content: "Electric Potential (V) is a scalar quantity, V = k * q / r. The relation between Electric Field E and Potential V is E = -dV/dr.",
    metadata: { chapter: "Electrostatics", topic: "Electric Potential", concept: "Potential and Field Relation" }
  },
  {
    id: 17,
    title: "Electric Potential Energy",
    content: "Potential Energy (U) is the work required to assemble a system of charges. For a pair of charges, U = k * (q1 * q2) / r.",
    metadata: { chapter: "Electrostatics", topic: "Electric Potential", concept: "Potential Energy" }
  },
  {
    id: 18,
    title: "Capacitance and Capacitors",
    content: "Capacitance C = Q / V. For a Parallel Plate Capacitor: C = (epsilon_0 * A) / d. If a dielectric of constant K is inserted, C = (K * epsilon_0 * A) / d.",
    metadata: { chapter: "Electrostatics", topic: "Capacitors", concept: "Capacitor Formulas" }
  },
  {
    id: 19,
    title: "Energy in Capacitors",
    content: "Energy stored in a capacitor U = 1/2 * C * V^2 = Q^2 / (2C) = 1/2 * Q * V. For capacitors in series: 1/C_eq = Sum(1/C_i). In parallel: C_eq = Sum(C_i).",
    metadata: { chapter: "Electrostatics", topic: "Capacitors", concept: "Energy and Combinations" }
  }
];

async function main() {
  console.log("Loading local embedding model (all-MiniLM-L6-v2)...");

  const points: any[] = [];

  console.log("Generating real embeddings for the full Electrostatics chapter...");
  for (const chunk of chunks) {
    const vector = await embedText(chunk.content);

    points.push({
      id: chunk.id,
      vector: vector,
      payload: {
        title: chunk.title,
        text: chunk.content, 
        chapter: chunk.metadata.chapter,
        topic: chunk.metadata.topic,
        concept: chunk.metadata.concept
      }
    });
  }

  console.log("Uploading full chapter to Qdrant...");
  await client.upsert(COLLECTION_NAME, {
    wait: true,
    points: points
  });

  console.log("Successfully seeded full Electrostatics chapter descriptive content to Qdrant!");
}

main().catch(console.error);
