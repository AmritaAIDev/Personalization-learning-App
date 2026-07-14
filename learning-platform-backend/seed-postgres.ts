import { DataSource } from 'typeorm';
import { Question } from './src/question.entity';
import * as dotenv from 'dotenv';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  entities: [Question],
  synchronize: true, // Auto-create tables for this seed
});

const mockQuestions = [
  {
    question_id: "PHY_ELEC_GAUSS_001",
    subject: "Physics",
    chapter: "Electrostatics",
    topic: "Gauss Law",
    subtopic: "Electric Flux",
    question_text: "A point charge q is placed at the center of a cube of side L. What is the electric flux passing through one face of the cube?",
    options: ["q/ε0", "q/6ε0", "q/4πε0L^2", "Zero"],
    correct_answer: "q/6ε0",
    solution: "By Gauss's Law, the total flux through the cube is q/ε0. Since the charge is at the center, the flux is symmetric across all 6 faces. Therefore, flux through one face is (1/6) * (q/ε0).",
    bloom_level: "Understand",
    difficulty: "Easy",
    marks: 4,
    estimated_time_sec: 60,
    concept_tags: ["electric flux", "symmetry", "cube"],
    common_errors: ["Forgot to divide by 6", "Used area formula instead of Gauss Law"]
  },
  {
    question_id: "PHY_ELEC_GAUSS_002",
    subject: "Physics",
    chapter: "Electrostatics",
    topic: "Gauss Law",
    subtopic: "Symmetry",
    question_text: "A charge Q is placed at one of the corners of a cube. The electric flux passing through the cube is:",
    options: ["Q/ε0", "Q/2ε0", "Q/4ε0", "Q/8ε0"],
    correct_answer: "Q/8ε0",
    solution: "To fully enclose the charge using symmetry, we need 8 such cubes forming a larger cube with the charge at the center. Total flux is Q/ε0. The flux through the single original cube is therefore 1/8 of the total, or Q/8ε0.",
    bloom_level: "Analyze",
    difficulty: "Medium",
    marks: 4,
    estimated_time_sec: 90,
    concept_tags: ["symmetry", "corner charge", "cube"],
    common_errors: ["Assumed full flux Q/ε0", "Divided by 6 faces instead of 8 cubes"]
  },
  {
    question_id: "PHY_ELEC_GAUSS_003",
    subject: "Physics",
    chapter: "Electrostatics",
    topic: "Gauss Law",
    subtopic: "Solid Angle",
    question_text: "A point charge q is placed at a distance of R/2 directly above the center of a square of side R. The electric flux through the square is:",
    options: ["q/ε0", "q/2ε0", "q/4ε0", "q/6ε0"],
    correct_answer: "q/6ε0",
    solution: "Imagine the square is one face of a cube of side R, with the charge q exactly at the center of this cube. The total flux is q/ε0, divided equally among 6 faces. Thus, the flux is q/6ε0.",
    bloom_level: "Apply",
    difficulty: "Medium",
    marks: 4,
    estimated_time_sec: 90,
    concept_tags: ["symmetry", "imaginary surface"],
    common_errors: ["Tried to integrate E.dA manually instead of using symmetry"]
  },
  {
    question_id: "PHY_ELEC_GAUSS_004",
    subject: "Physics",
    chapter: "Electrostatics",
    topic: "Gauss Law",
    subtopic: "Conductors",
    question_text: "A solid conducting sphere of radius R has a net charge Q. What is the electric field at a distance r (where r < R) from the center?",
    options: ["kQ/r^2", "kQ/R^2", "Zero", "kQr/R^3"],
    correct_answer: "Zero",
    solution: "Inside a conductor under electrostatic conditions, the electric field is always zero. Any excess charge resides entirely on the outer surface.",
    bloom_level: "Remember",
    difficulty: "Easy",
    marks: 4,
    estimated_time_sec: 30,
    concept_tags: ["conductor", "inside sphere", "electric field"],
    common_errors: ["Used solid non-conducting sphere formula"]
  },
  {
    question_id: "PHY_ELEC_GAUSS_005",
    subject: "Physics",
    chapter: "Electrostatics",
    topic: "Gauss Law",
    subtopic: "Continuous Charge",
    question_text: "An infinitely long straight wire has a uniform linear charge density λ. The electric field at a perpendicular distance r from the wire is:",
    options: ["λ / (2πε0 r)", "λ / (4πε0 r)", "λ / (2πε0 r^2)", "λ / (πε0 r)"],
    correct_answer: "λ / (2πε0 r)",
    solution: "Construct a cylindrical Gaussian surface of radius r and length L. Flux = E * 2πrL = (λL)/ε0. Therefore, E = λ / (2πε0 r).",
    bloom_level: "Apply",
    difficulty: "Medium",
    marks: 4,
    estimated_time_sec: 60,
    concept_tags: ["infinite wire", "cylindrical symmetry", "electric field"],
    common_errors: ["Used point charge formula 1/r^2"]
  }
];

async function seed() {
  try {
    await AppDataSource.initialize();
    console.log("Database connection established.");
    
    const questionRepo = AppDataSource.getRepository(Question);
    
    // Clear existing to avoid duplicates during testing
    await questionRepo.clear();

    console.log("Inserting mock Gauss Law questions...");
    await questionRepo.save(mockQuestions);
    
    console.log(`Successfully seeded ${mockQuestions.length} questions into PostgreSQL!`);
  } catch (error) {
    console.error("Error during Data Source initialization", error);
  } finally {
    await AppDataSource.destroy();
  }
}

seed();
