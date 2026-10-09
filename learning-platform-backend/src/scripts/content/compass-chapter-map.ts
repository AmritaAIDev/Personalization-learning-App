import type {
  ChapterRef,
  CompassChapter,
  SubjectName,
} from '../../catalog/chapter-meta.types';

/**
 * Where each jee-compass chapter lands in our JEE syllabus, keyed by
 * `<compassSubjectId>:<compassChapterId>`.
 *
 * - Several compass chapters may point at one of ours (e.g. its split
 *   Electrostatics chapters); their metadata is merged.
 * - `null` means the chapter is CBSE-only and not part of the JEE Main
 *   syllabus we teach, so it is skipped rather than invented.
 */
export const COMPASS_CHAPTER_MAP: Readonly<Record<string, ChapterRef | null>> =
  {
    'physics:1': { subject: 'Physics', chapter: 'Electrostatics' },
    'physics:2': { subject: 'Physics', chapter: 'Electrostatics' },
    'physics:3': { subject: 'Physics', chapter: 'Current Electricity' },
    'physics:4': {
      subject: 'Physics',
      chapter: 'Magnetic Effects of Current and Magnetism',
    },
    'physics:5': {
      subject: 'Physics',
      chapter: 'Magnetic Effects of Current and Magnetism',
    },
    'physics:6': {
      subject: 'Physics',
      chapter: 'Electromagnetic Induction and Alternating Currents',
    },
    'physics:7': {
      subject: 'Physics',
      chapter: 'Electromagnetic Induction and Alternating Currents',
    },
    'physics:8': { subject: 'Physics', chapter: 'Electromagnetic Waves' },
    'physics:9': { subject: 'Physics', chapter: 'Optics' },
    'physics:10': { subject: 'Physics', chapter: 'Optics' },
    'physics:11': {
      subject: 'Physics',
      chapter: 'Dual Nature of Matter and Radiation',
    },
    'physics:12': { subject: 'Physics', chapter: 'Atoms and Nuclei' },
    'physics:13': { subject: 'Physics', chapter: 'Atoms and Nuclei' },
    'physics:14': { subject: 'Physics', chapter: 'Electronic Devices' },

    'chemistry:1': { subject: 'Chemistry', chapter: 'Solutions' },
    'chemistry:2': { subject: 'Chemistry', chapter: 'Electrochemistry' },
    'chemistry:3': { subject: 'Chemistry', chapter: 'Chemical Kinetics' },
    'chemistry:4': null, // Surface Chemistry: CBSE-only
    'chemistry:5': { subject: 'Chemistry', chapter: 'p-Block Elements' },
    'chemistry:6': { subject: 'Chemistry', chapter: 'd- and f-Block Elements' },
    'chemistry:7': { subject: 'Chemistry', chapter: 'Coordination Compounds' },
    'chemistry:8': {
      subject: 'Chemistry',
      chapter: 'Haloalkanes and Haloarenes',
    },
    'chemistry:9': {
      subject: 'Chemistry',
      chapter: 'Alcohols, Phenols and Ethers',
    },
    'chemistry:10': {
      subject: 'Chemistry',
      chapter: 'Aldehydes, Ketones and Carboxylic Acids',
    },
    'chemistry:11': { subject: 'Chemistry', chapter: 'Amines' },
    'chemistry:12': { subject: 'Chemistry', chapter: 'Biomolecules' },
    'chemistry:13': null, // Polymers: CBSE-only
    'chemistry:14': null, // Chemistry in Everyday Life: CBSE-only

    'mathematics:1': {
      subject: 'Mathematics',
      chapter: 'Sets, Relations and Functions',
    },
    'mathematics:2': null, // Inverse Trigonometric Functions: not a separate JEE chapter here
    'mathematics:3': {
      subject: 'Mathematics',
      chapter: 'Matrices and Determinants',
    },
    'mathematics:4': {
      subject: 'Mathematics',
      chapter: 'Matrices and Determinants',
    },
    'mathematics:5': {
      subject: 'Mathematics',
      chapter: 'Differential Calculus',
    },
    'mathematics:6': {
      subject: 'Mathematics',
      chapter: 'Differential Calculus',
    },
    'mathematics:7': { subject: 'Mathematics', chapter: 'Integral Calculus' },
    'mathematics:8': { subject: 'Mathematics', chapter: 'Integral Calculus' },
    'mathematics:9': {
      subject: 'Mathematics',
      chapter: 'Differential Equations',
    },
    'mathematics:10': { subject: 'Mathematics', chapter: 'Vector Algebra' },
    'mathematics:11': {
      subject: 'Mathematics',
      chapter: 'Three Dimensional Geometry',
    },
    'mathematics:12': null, // Linear Programming: CBSE-only
    'mathematics:13': {
      subject: 'Mathematics',
      chapter: 'Statistics and Probability',
    },
  };

export function compassKey(chapter: CompassChapter): string {
  return `${chapter.subjectId}:${chapter.chapterId}`;
}

export function chapterKey(subject: SubjectName, chapter: string): string {
  return `${subject}|${chapter}`;
}

/**
 * Unit (Physics/Maths) or branch (Chemistry) shown as a filter tab on the
 * subject page, for every chapter in our syllabus.
 */
export const CHAPTER_UNITS: Readonly<Record<string, string>> = {
  // Physics
  'Physics|Units and Measurements': 'Mechanics',
  'Physics|Kinematics': 'Mechanics',
  'Physics|Laws of Motion': 'Mechanics',
  'Physics|Work, Energy and Power': 'Mechanics',
  'Physics|Rotational Motion': 'Mechanics',
  'Physics|Gravitation': 'Mechanics',
  'Physics|Properties of Solids and Liquids': 'Mechanics',
  'Physics|Thermodynamics': 'Heat & Thermodynamics',
  'Physics|Kinetic Theory of Gases': 'Heat & Thermodynamics',
  'Physics|Oscillations': 'Oscillations & Waves',
  'Physics|Waves': 'Oscillations & Waves',
  'Physics|Electrostatics': 'Electrostatics',
  'Physics|Current Electricity': 'Current Electricity',
  'Physics|Magnetic Effects of Current and Magnetism': 'Magnetism',
  'Physics|Electromagnetic Induction and Alternating Currents': 'EMI & AC',
  'Physics|Electromagnetic Waves': 'EM Waves',
  'Physics|Optics': 'Optics',
  'Physics|Dual Nature of Matter and Radiation': 'Modern Physics',
  'Physics|Atoms and Nuclei': 'Modern Physics',
  'Physics|Electronic Devices': 'Semiconductors',
  // Chemistry
  'Chemistry|Some Basic Concepts of Chemistry': 'Physical',
  'Chemistry|Structure of Atom': 'Physical',
  'Chemistry|States of Matter': 'Physical',
  'Chemistry|Chemical Thermodynamics': 'Physical',
  'Chemistry|Equilibrium': 'Physical',
  'Chemistry|Redox Reactions': 'Physical',
  'Chemistry|Solutions': 'Physical',
  'Chemistry|Electrochemistry': 'Physical',
  'Chemistry|Chemical Kinetics': 'Physical',
  'Chemistry|Classification of Elements': 'Inorganic',
  'Chemistry|Chemical Bonding and Molecular Structure': 'Inorganic',
  'Chemistry|p-Block Elements': 'Inorganic',
  'Chemistry|d- and f-Block Elements': 'Inorganic',
  'Chemistry|Coordination Compounds': 'Inorganic',
  'Chemistry|Basic Principles of Organic Chemistry': 'Organic',
  'Chemistry|Hydrocarbons': 'Organic',
  'Chemistry|Haloalkanes and Haloarenes': 'Organic',
  'Chemistry|Alcohols, Phenols and Ethers': 'Organic',
  'Chemistry|Aldehydes, Ketones and Carboxylic Acids': 'Organic',
  'Chemistry|Amines': 'Organic',
  'Chemistry|Biomolecules': 'Organic',
  // Mathematics
  'Mathematics|Sets, Relations and Functions': 'Algebra',
  'Mathematics|Complex Numbers and Quadratic Equations': 'Algebra',
  'Mathematics|Matrices and Determinants': 'Algebra',
  'Mathematics|Permutations and Combinations': 'Algebra',
  'Mathematics|Binomial Theorem': 'Algebra',
  'Mathematics|Sequences and Series': 'Algebra',
  'Mathematics|Trigonometric Functions': 'Trigonometry',
  'Mathematics|Coordinate Geometry': 'Coordinate Geometry',
  'Mathematics|Differential Calculus': 'Calculus',
  'Mathematics|Integral Calculus': 'Calculus',
  'Mathematics|Differential Equations': 'Calculus',
  'Mathematics|Vector Algebra': 'Vectors & 3D',
  'Mathematics|Three Dimensional Geometry': 'Vectors & 3D',
  'Mathematics|Statistics and Probability': 'Probability & Statistics',
};

/**
 * Class (11 or 12) each syllabus chapter is taught in, following the usual JEE
 * Main split. This is a DRAFT for the owner to confirm: chapters that straddle
 * both years sit with the class where most of the chapter is taught
 * (p-Block Elements and Differential Calculus are Class 12), and an admin can
 * correct any value afterwards in the chapter review screen.
 */
export const CHAPTER_CLASS_LEVELS: Readonly<Record<string, number>> = {
  // Physics, Class 11
  'Physics|Units and Measurements': 11,
  'Physics|Kinematics': 11,
  'Physics|Laws of Motion': 11,
  'Physics|Work, Energy and Power': 11,
  'Physics|Rotational Motion': 11,
  'Physics|Gravitation': 11,
  'Physics|Properties of Solids and Liquids': 11,
  'Physics|Thermodynamics': 11,
  'Physics|Kinetic Theory of Gases': 11,
  'Physics|Oscillations': 11,
  'Physics|Waves': 11,
  // Physics, Class 12
  'Physics|Electrostatics': 12,
  'Physics|Current Electricity': 12,
  'Physics|Magnetic Effects of Current and Magnetism': 12,
  'Physics|Electromagnetic Induction and Alternating Currents': 12,
  'Physics|Electromagnetic Waves': 12,
  'Physics|Optics': 12,
  'Physics|Dual Nature of Matter and Radiation': 12,
  'Physics|Atoms and Nuclei': 12,
  'Physics|Electronic Devices': 12,
  // Chemistry, Class 11
  'Chemistry|Some Basic Concepts of Chemistry': 11,
  'Chemistry|Structure of Atom': 11,
  'Chemistry|Classification of Elements': 11,
  'Chemistry|Chemical Bonding and Molecular Structure': 11,
  'Chemistry|States of Matter': 11,
  'Chemistry|Chemical Thermodynamics': 11,
  'Chemistry|Equilibrium': 11,
  'Chemistry|Redox Reactions': 11,
  'Chemistry|Basic Principles of Organic Chemistry': 11,
  'Chemistry|Hydrocarbons': 11,
  // Chemistry, Class 12
  'Chemistry|Solutions': 12,
  'Chemistry|Electrochemistry': 12,
  'Chemistry|Chemical Kinetics': 12,
  'Chemistry|p-Block Elements': 12,
  'Chemistry|d- and f-Block Elements': 12,
  'Chemistry|Coordination Compounds': 12,
  'Chemistry|Haloalkanes and Haloarenes': 12,
  'Chemistry|Alcohols, Phenols and Ethers': 12,
  'Chemistry|Aldehydes, Ketones and Carboxylic Acids': 12,
  'Chemistry|Amines': 12,
  'Chemistry|Biomolecules': 12,
  // Mathematics, Class 11
  'Mathematics|Sets, Relations and Functions': 11,
  'Mathematics|Complex Numbers and Quadratic Equations': 11,
  'Mathematics|Permutations and Combinations': 11,
  'Mathematics|Binomial Theorem': 11,
  'Mathematics|Sequences and Series': 11,
  'Mathematics|Trigonometric Functions': 11,
  'Mathematics|Coordinate Geometry': 11,
  // Mathematics, Class 12
  'Mathematics|Matrices and Determinants': 12,
  'Mathematics|Differential Calculus': 12,
  'Mathematics|Integral Calculus': 12,
  'Mathematics|Differential Equations': 12,
  'Mathematics|Vector Algebra': 12,
  'Mathematics|Three Dimensional Geometry': 12,
  'Mathematics|Statistics and Probability': 12,
};
