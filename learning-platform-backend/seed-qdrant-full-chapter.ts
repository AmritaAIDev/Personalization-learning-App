import { QdrantClient } from '@qdrant/js-client-rest';
import * as dotenv from 'dotenv';
import { embedText, EMBEDDING_DIM } from './src/agent/embedding.util';

dotenv.config();

const QDRANT_URL = process.env.QDRANT_URL;
const QDRANT_API_KEY = process.env.QDRANT_API_KEY;
const COLLECTION_NAME = 'learning_concepts';

if (!QDRANT_URL || !QDRANT_API_KEY) {
  console.error('Missing Qdrant credentials in .env');
  process.exit(1);
}

const client = new QdrantClient({
  url: QDRANT_URL,
  apiKey: QDRANT_API_KEY,
});

const chunks = [
  {
    id: 10,
    title: 'Electric Charge and Properties',
    content:
      'Charge is quantized (q = ±ne), conserved, and additive. It is an inherent property of matter associated with mass. The fundamental unit of charge is the electron charge e = 1.6 x 10^-19 C.',
    metadata: {
      chapter: 'Electrostatics',
      topic: 'Electric Charge',
      concept: 'Properties of Charge',
    },
  },
  {
    id: 11,
    title: "Coulomb's Law",
    content:
      'The electrostatic force between two stationary point charges is F = k * (q1 * q2) / r^2, where k = 1 / (4*pi*epsilon_0) = 9 x 10^9 Nm^2/C^2. It follows the superposition principle: the net force on a charge is the vector sum of individual forces exerted by other charges.',
    metadata: {
      chapter: 'Electrostatics',
      topic: "Coulomb's Law",
      concept: 'Force between charges',
    },
  },
  {
    id: 12,
    title: 'Electric Field Definition',
    content:
      'Electric field is defined as the force per unit test charge: E = F / q_t. For a point charge, the electric field at a distance r is E = k * q / r^2.',
    metadata: {
      chapter: 'Electrostatics',
      topic: 'Electric Field',
      concept: 'Field Definition',
    },
  },
  {
    id: 13,
    title: 'Electric Dipole',
    content:
      'A system of two equal and opposite charges separated by distance 2a is a dipole. The dipole moment p = q * (2a), directed from negative to positive charge.',
    metadata: {
      chapter: 'Electrostatics',
      topic: 'Electric Field',
      concept: 'Dipole Moment',
    },
  },
  {
    id: 14,
    title: 'Electric Flux',
    content:
      'Electric flux is a measure of the total number of electric field lines passing through a given surface. Formula: phi = Integral(E . dA). For closed surfaces, the area vector is directed outwards.',
    metadata: {
      chapter: 'Electrostatics',
      topic: 'Gauss Law',
      concept: 'Electric Flux',
    },
  },
  {
    id: 15,
    title: "Gauss's Law",
    content:
      "Gauss's Law: The total flux through a closed surface is phi = Q_enc / epsilon_0. It is primarily used to find the electric field of highly symmetric charge distributions (spherical, cylindrical, planar).",
    metadata: {
      chapter: 'Electrostatics',
      topic: 'Gauss Law',
      concept: 'Gauss Law Statement',
    },
  },
  {
    id: 16,
    title: 'Electric Potential',
    content:
      'Electric Potential (V) is a scalar quantity, V = k * q / r. The relation between Electric Field E and Potential V is E = -dV/dr.',
    metadata: {
      chapter: 'Electrostatics',
      topic: 'Electric Potential',
      concept: 'Potential and Field Relation',
    },
  },
  {
    id: 17,
    title: 'Electric Potential Energy',
    content:
      'Potential Energy (U) is the work required to assemble a system of charges. For a pair of charges, U = k * (q1 * q2) / r.',
    metadata: {
      chapter: 'Electrostatics',
      topic: 'Electric Potential',
      concept: 'Potential Energy',
    },
  },
  {
    id: 18,
    title: 'Capacitance and Capacitors',
    content:
      'Capacitance C = Q / V. For a Parallel Plate Capacitor: C = (epsilon_0 * A) / d. If a dielectric of constant K is inserted, C = (K * epsilon_0 * A) / d.',
    metadata: {
      chapter: 'Electrostatics',
      topic: 'Capacitors',
      concept: 'Capacitor Formulas',
    },
  },
  {
    id: 19,
    title: 'Energy in Capacitors',
    content:
      'Energy stored in a capacitor U = 1/2 * C * V^2 = Q^2 / (2C) = 1/2 * Q * V. For capacitors in series: 1/C_eq = Sum(1/C_i). In parallel: C_eq = Sum(C_i).',
    metadata: {
      chapter: 'Electrostatics',
      topic: 'Capacitors',
      concept: 'Energy and Combinations',
    },
  },
  {
    id: 20,
    title: 'Gauss Law - Flux Through Symmetric Surfaces',
    content:
      'For JEE questions on Gauss Law, first decide whether the surface is closed and then identify enclosed charge. A charge outside the surface can change local electric field values on the surface, but it contributes zero net flux because incoming and outgoing contributions cancel. For a charge at the centre of a cube, flux is shared equally by six faces. For a charge at a cube corner, imagine eight identical cubes around the charge before dividing flux by the relevant faces.',
    metadata: {
      chapter: 'Electric Charges and Fields',
      topic: 'Gauss Law',
      concept: 'flux symmetry and enclosed charge',
      subtopic: 'closed-surface flux',
    },
  },
  {
    id: 21,
    title: 'Electric Charge and Field - Symmetry Checks',
    content:
      'When charges are arranged symmetrically, many electric-field questions become cancellation problems. Equal charges at opposite positions produce equal magnitude fields; directions decide whether they cancel or add. At the centre of a uniformly charged ring or square with equal corner charges, the net electric field is zero by symmetry even though each charge individually produces a nonzero field.',
    metadata: {
      chapter: 'Electric Charges and Fields',
      topic: 'Electric charge & field',
      concept: 'field superposition and symmetry',
      subtopic: 'symmetric charge distributions',
    },
  },
  {
    id: 22,
    title: "Coulomb's Law - Scaling and Optimization",
    content:
      'Coulomb force scales as q1 q2 / r^2. Doubling both charges multiplies force by four; halving distance multiplies force by four again. When a fixed charge Q is split into q and Q - q, the product q(Q - q) is maximum at equal split, so the electrostatic force is maximum when q = Q/2.',
    metadata: {
      chapter: 'Electric Charges and Fields',
      topic: "Coulomb's Law",
      concept: 'inverse-square scaling',
      subtopic: 'force scaling',
    },
  },
  {
    id: 23,
    title: 'Electric Dipole - Torque and Field Lines',
    content:
      'A dipole in a uniform electric field has zero net force but usually nonzero torque. The torque magnitude is pE sin theta and is maximum when the dipole is perpendicular to the field. Potential energy is -pE cos theta, so the stable orientation is aligned with the field. The dipole moment points from negative charge to positive charge.',
    metadata: {
      chapter: 'Electric Charges and Fields',
      topic: 'Electric Dipole',
      concept: 'dipole torque and energy',
      subtopic: 'dipole in uniform field',
    },
  },
  {
    id: 24,
    title: 'Electric Potential - Work and Sign Convention',
    content:
      'Electric potential is scalar and potential difference controls work. Work done by the electric field in moving charge q from potential V1 to V2 is q(V1 - V2). Work done by an external agent in a slow move is q(V2 - V1). Many wrong answers come from reversing these signs or confusing electric field, which falls as 1/r^2 for a point charge, with potential, which falls as 1/r.',
    metadata: {
      chapter: 'Electrostatic Potential and Capacitance',
      topic: 'Electric Potential',
      concept: 'potential and work',
      subtopic: 'work-energy relation',
    },
  },
  {
    id: 25,
    title: 'Capacitance Basics - Plate Geometry and Units',
    content:
      'Capacitance measures charge stored per unit potential difference: C = Q/V, unit farad. For a parallel-plate capacitor, C = epsilon0 A/d in air. Increasing plate area increases capacitance; increasing separation decreases it. If area doubles and separation halves, capacitance becomes four times larger.',
    metadata: {
      chapter: 'Electrostatic Potential and Capacitance',
      topic: 'Capacitance basics',
      concept: 'capacitance geometry',
      subtopic: 'parallel plate capacitor',
    },
  },
  {
    id: 26,
    title: 'Capacitor Energy and Combinations',
    content:
      'The energy stored in a capacitor is U = QV/2 = CV^2/2 = Q^2/(2C). The factor one-half is essential because the voltage rises gradually while charging. In series, capacitors add by reciprocals and the equivalent capacitance is smaller than the smallest capacitor. In parallel, capacitances add directly.',
    metadata: {
      chapter: 'Electrostatic Potential and Capacitance',
      topic: 'Capacitance',
      concept: 'stored energy and combinations',
      subtopic: 'series and parallel capacitors',
    },
  },
  {
    id: 27,
    title: 'Equipotential Surfaces - Field Direction',
    content:
      'An equipotential surface has the same potential at every point, so moving a charge along it requires zero work. The electric field is perpendicular to equipotential surfaces; a tangential component would do work and create a potential difference along the surface. Closely spaced equipotentials indicate a stronger electric field.',
    metadata: {
      chapter: 'Electrostatic Potential and Capacitance',
      topic: 'Equipotential Surfaces',
      concept: 'equipotential and field direction',
      subtopic: 'field perpendicularity',
    },
  },
  {
    id: 28,
    title: 'Van de Graaff Generator - Charge Storage Limit',
    content:
      'A Van de Graaff generator transfers charge to a conducting dome using a moving belt. Charge resides on the outer surface of the conductor, building a high potential. The practical voltage limit is usually dielectric breakdown of the surrounding air, which causes corona discharge and charge leakage.',
    metadata: {
      chapter: 'Electrostatic Potential and Capacitance',
      topic: 'Van de Graaff Generator',
      concept: 'high-voltage charge accumulation',
      subtopic: 'dielectric breakdown',
    },
  },
];

async function main() {
  console.log('Loading local embedding model (all-MiniLM-L6-v2)...');

  const collections = await client.getCollections();
  const exists = collections.collections.some(
    (c) => c.name === COLLECTION_NAME,
  );

  if (!exists) {
    console.log(`Creating collection ${COLLECTION_NAME}...`);
    await client.createCollection(COLLECTION_NAME, {
      vectors: {
        size: EMBEDDING_DIM,
        distance: 'Cosine',
      },
    });
  }

  const points: any[] = [];

  console.log(
    'Generating real embeddings for the full Electrostatics chapter...',
  );
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
        concept: chunk.metadata.concept,
        subtopic: chunk.metadata.subtopic ?? null,
        source: 'JEE AI reviewed concept seed',
      },
    });
  }

  console.log('Uploading full chapter to Qdrant...');
  await client.upsert(COLLECTION_NAME, {
    wait: true,
    points: points,
  });

  console.log(
    'Successfully seeded full Electrostatics chapter descriptive content to Qdrant!',
  );
}

main().catch(console.error);
