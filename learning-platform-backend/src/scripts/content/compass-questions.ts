import type { CompassQuestion } from './compass-question.types';

/**
 * Physics Chapter 1 ("Electric Charges and Fields") question bank from the
 * jee-compass project: 120 multiple-choice questions, every one with an
 * explanation. Extracted once by text parsing (the source was never executed)
 * and kept here for review. They are imported as DRAFT only; see
 * seed-compass-questions.ts. The answer is stored as an option index.
 */
export const COMPASS_PHYSICS_CH1_QUESTIONS: readonly CompassQuestion[] = [
  {
    id: 'p1_t1_ue1',
    topic: "Coulomb's Law",
    bloomLevel: 'Understand',
    difficulty: 'Easy',
    question:
      "According to Coulomb's law, the force between two point charges is directly proportional to:",
    options: [
      'The product of the magnitudes of the two charges',
      'The sum of the magnitudes of the two charges',
      'The square of the distance between them',
      'The difference of the magnitudes of the two charges',
    ],
    correctIndex: 0,
    explanation:
      "Coulomb's law states that the electrostatic force between two point charges is directly proportional to the product of their charges and inversely proportional to the square of the distance between them.",
  },
  {
    id: 'p1_t1_um1',
    topic: "Coulomb's Law",
    bloomLevel: 'Understand',
    difficulty: 'Medium',
    question:
      'The Coulomb force between two charges is F. If the distance between them is doubled, the new force will be:',
    options: ['F/4', 'F/2', '2F', '4F'],
    correctIndex: 0,
    explanation:
      'Since F ∝ 1/r², doubling the distance (r → 2r) reduces the force by a factor of 4, giving F/4.',
  },
  {
    id: 'p1_t1_uh1',
    topic: "Coulomb's Law",
    bloomLevel: 'Understand',
    difficulty: 'Hard',
    question:
      'Two identical conducting spheres with charges +6 μC and -2 μC are brought into contact and then separated. The charge on each sphere after separation is:',
    options: ['+2 μC', '+4 μC', '-2 μC', '0 μC'],
    correctIndex: 0,
    explanation:
      'When identical conducting spheres touch, charge redistributes equally. Total charge = +6 + (-2) = +4 μC, divided equally gives +2 μC on each sphere.',
  },
  {
    id: 'p1_t1_ae1',
    topic: "Coulomb's Law",
    bloomLevel: 'Apply',
    difficulty: 'Easy',
    question:
      'Two charges of 2 μC and 3 μC are separated by 0.1 m in vacuum. The force between them is approximately: (k = 9 × 10⁹ N·m²/C²)',
    options: ['5.4 N', '0.54 N', '54 N', '0.054 N'],
    correctIndex: 0,
    explanation:
      'F = k·q₁·q₂/r² = 9×10⁹ × (2×10⁻⁶)(3×10⁻⁶)/(0.1)² = 9×10⁹ × 6×10⁻¹²/0.01 = 5.4 N.',
  },
  {
    id: 'p1_t1_am1',
    topic: "Coulomb's Law",
    bloomLevel: 'Apply',
    difficulty: 'Medium',
    question:
      'Three charges +q, +q, and -q are placed at the vertices of an equilateral triangle of side a. The net force on the charge -q is directed:',
    options: [
      'Along the angle bisector away from the midpoint of the two +q charges',
      'Along the angle bisector toward the midpoint of the two +q charges',
      'Perpendicular to the side connecting the +q charges',
      'Zero, as forces cancel',
    ],
    correctIndex: 0,
    explanation:
      'Both +q charges repel the -q charge. The forces from the two +q charges have equal magnitudes and are symmetric, so their resultant points along the angle bisector away from the midpoint of the two +q charges.',
  },
  {
    id: 'p1_t1_ah1',
    topic: "Coulomb's Law",
    bloomLevel: 'Apply',
    difficulty: 'Hard',
    question:
      'Two charges q₁ = 4 μC and q₂ = 9 μC are placed 0.5 m apart. At what distance from q₁ should a third charge be placed so that it experiences zero net force?',
    options: ['0.2 m', '0.3 m', '0.25 m', '0.4 m'],
    correctIndex: 0,
    explanation:
      'For zero net force, the third charge must be between the two charges where forces balance. Let x be distance from q₁. k·q₁·q₃/x² = k·q₂·q₃/(0.5-x)². So q₁/x² = q₂/(0.5-x)². 4/x² = 9/(0.5-x)². 2/x = 3/(0.5-x). 2(0.5-x) = 3x. 1 - 2x = 3x. x = 0.2 m.',
  },
  {
    id: 'p1_t1_ne1',
    topic: "Coulomb's Law",
    bloomLevel: 'Analyze',
    difficulty: 'Easy',
    question:
      'If the medium between two charges is changed from air to a dielectric with dielectric constant K, the Coulomb force between them:',
    options: [
      'Decreases by a factor of K',
      'Increases by a factor of K',
      'Remains unchanged',
      'Becomes zero',
    ],
    correctIndex: 0,
    explanation:
      'The Coulomb force in a medium is F = F₀/K, where F₀ is the force in vacuum. The dielectric reduces the effective force by a factor of K.',
  },
  {
    id: 'p1_t1_nm1',
    topic: "Coulomb's Law",
    bloomLevel: 'Analyze',
    difficulty: 'Medium',
    question:
      'Two charges are placed at a distance r. The force between them is F. If one charge is doubled and the distance is halved, the new force is:',
    options: ['8F', '4F', '2F', 'F/2'],
    correctIndex: 0,
    explanation:
      'F ∝ q₁·q₂/r². New force = k·(2q₁)·q₂/(r/2)² = k·2q₁·q₂·4/r² = 8·(k·q₁·q₂/r²) = 8F.',
  },
  {
    id: 'p1_t1_nh1',
    topic: "Coulomb's Law",
    bloomLevel: 'Analyze',
    difficulty: 'Hard',
    question:
      'Four charges +q are placed at the corners of a square of side a. The net force on any one charge due to the other three is:',
    options: [
      'kq²/a² · (1/2 + √2)',
      'kq²/a² · (1 + √2)',
      'kq²/a² · (1/2 + 1/√2)',
      'kq²/a² · √2',
    ],
    correctIndex: 0,
    explanation:
      'For a charge at a corner, forces from adjacent charges are kq²/a² each at 90° to each other, and from the diagonal charge is kq²/(a√2)² = kq²/2a². Net force = √[(kq²/a²)² + (kq²/a²)²] + kq²/2a² = kq²/a²·√2 + kq²/2a² = kq²/a²·(√2 + 1/2).',
  },
  {
    id: 'p1_t1_ve1',
    topic: "Coulomb's Law",
    bloomLevel: 'Evaluate',
    difficulty: 'Easy',
    question: "Which statement about Coulomb's law is most accurate?",
    options: [
      'It applies to point charges at rest in vacuum or a uniform medium',
      'It applies to all charges regardless of motion',
      'It only applies to charges in conductors',
      'It is valid only for charges of equal magnitude',
    ],
    correctIndex: 0,
    explanation:
      "Coulomb's law is valid for point charges at rest (electrostatics). For moving charges, additional magnetic forces must be considered.",
  },
  {
    id: 'p1_t1_vm1',
    topic: "Coulomb's Law",
    bloomLevel: 'Evaluate',
    difficulty: 'Medium',
    question:
      "A student claims that Coulomb's law and Newton's law of gravitation have the same mathematical form. Which evaluation is correct?",
    options: [
      "Both follow inverse-square laws, but Coulomb's law can be attractive or repulsive while gravity is always attractive",
      'Both are always attractive forces',
      "Coulomb's law is stronger than gravity for all distances",
      'Both forces are independent of the medium',
    ],
    correctIndex: 0,
    explanation:
      "Both laws follow the inverse-square form, but electrostatic force can be attractive or repulsive depending on charge signs, while gravitational force is always attractive. Also, Coulomb's law depends on the medium.",
  },
  {
    id: 'p1_t1_vh1',
    topic: "Coulomb's Law",
    bloomLevel: 'Evaluate',
    difficulty: 'Hard',
    question:
      'Two charges q₁ and q₂ exert a force F on each other. If a third charge q₃ is placed between them, which statement is most correct?',
    options: [
      'The force between q₁ and q₂ remains F, but q₃ experiences forces from both',
      'The force between q₁ and q₂ changes because q₃ modifies the field',
      'The force between q₁ and q₂ becomes zero',
      'The force between q₁ and q₂ doubles',
    ],
    correctIndex: 0,
    explanation:
      "Coulomb's law gives the force between two charges independent of other charges. The presence of q₃ does not change the force between q₁ and q₂, but q₃ experiences forces from both q₁ and q₂.",
  },
  {
    id: 'p1_t2_ue1',
    topic: 'Electric Field',
    bloomLevel: 'Understand',
    difficulty: 'Easy',
    question: 'The electric field at a point is defined as:',
    options: [
      'The force per unit positive test charge placed at that point',
      'The force per unit negative charge placed at that point',
      'The potential energy per unit charge',
      'The work done per unit charge',
    ],
    correctIndex: 0,
    explanation:
      'Electric field E = F/q₀, where F is the force on a small positive test charge q₀ placed at the point.',
  },
  {
    id: 'p1_t2_um1',
    topic: 'Electric Field',
    bloomLevel: 'Understand',
    difficulty: 'Medium',
    question:
      'The electric field due to a point charge Q at a distance r is E. If the distance is doubled, the new field is:',
    options: ['E/4', 'E/2', '2E', '4E'],
    correctIndex: 0,
    explanation:
      'E ∝ 1/r² for a point charge. Doubling the distance reduces the field by a factor of 4.',
  },
  {
    id: 'p1_t2_uh1',
    topic: 'Electric Field',
    bloomLevel: 'Understand',
    difficulty: 'Hard',
    question: 'The electric field lines of a positive point charge:',
    options: [
      'Radiate outward from the charge',
      'Point inward toward the charge',
      'Form closed loops around the charge',
      'Are parallel and equally spaced',
    ],
    correctIndex: 0,
    explanation:
      'Electric field lines originate from positive charges and terminate on negative charges. For a positive point charge, they radiate outward radially.',
  },
  {
    id: 'p1_t2_ae1',
    topic: 'Electric Field',
    bloomLevel: 'Apply',
    difficulty: 'Easy',
    question:
      'A charge of 5 μC experiences a force of 0.01 N in an electric field. The magnitude of the electric field is:',
    options: ['2000 N/C', '200 N/C', '20 N/C', '2 N/C'],
    correctIndex: 0,
    explanation: 'E = F/q = 0.01 / (5×10⁻⁶) = 0.01/0.000005 = 2000 N/C.',
  },
  {
    id: 'p1_t2_am1',
    topic: 'Electric Field',
    bloomLevel: 'Apply',
    difficulty: 'Medium',
    question:
      'Two charges +4 μC and -4 μC are separated by 0.2 m. The electric field at the midpoint of the line joining them is: (k = 9 × 10⁹)',
    options: [
      '7.2 × 10⁶ N/C directed toward the negative charge',
      '3.6 × 10⁶ N/C directed toward the positive charge',
      'Zero',
      '1.8 × 10⁶ N/C',
    ],
    correctIndex: 0,
    explanation:
      'At the midpoint (r = 0.1 m from each charge), E₁ = k·q/r² = 9×10⁹ × 4×10⁻⁶/(0.1)² = 3.6×10⁶ N/C. Both fields point toward the negative charge, so E_net = 2 × 3.6×10⁶ = 7.2×10⁶ N/C.',
  },
  {
    id: 'p1_t2_ah1',
    topic: 'Electric Field',
    bloomLevel: 'Apply',
    difficulty: 'Hard',
    question:
      'A charge q is placed at the center of a cube. The electric flux through one face of the cube is:',
    options: ['q/(6ε₀)', 'q/ε₀', 'q/(4ε₀)', 'q/(2ε₀)'],
    correctIndex: 0,
    explanation:
      "By Gauss's law, total flux through the cube = q/ε₀. By symmetry, flux through each of the 6 faces is equal, so flux through one face = q/(6ε₀).",
  },
  {
    id: 'p1_t2_ne1',
    topic: 'Electric Field',
    bloomLevel: 'Analyze',
    difficulty: 'Easy',
    question:
      'The electric field inside a uniformly charged spherical shell is:',
    options: [
      'Zero',
      'Constant and non-zero',
      'Inversely proportional to r²',
      'Directly proportional to r',
    ],
    correctIndex: 0,
    explanation:
      "By Gauss's law, the net flux through a Gaussian surface inside the shell is zero (no enclosed charge), so the electric field inside a uniformly charged spherical shell is zero.",
  },
  {
    id: 'p1_t2_nm1',
    topic: 'Electric Field',
    bloomLevel: 'Analyze',
    difficulty: 'Medium',
    question:
      'Two equal positive charges are placed at points A and B. The electric field at the midpoint of AB is:',
    options: [
      'Zero',
      'Directed from A to B',
      'Directed from B to A',
      'Directed perpendicular to AB',
    ],
    correctIndex: 0,
    explanation:
      'At the midpoint, the fields from the two equal charges have equal magnitudes but opposite directions, so they cancel, giving zero net field.',
  },
  {
    id: 'p1_t2_nh1',
    topic: 'Electric Field',
    bloomLevel: 'Analyze',
    difficulty: 'Hard',
    question:
      'A dipole consists of charges +q and -q separated by distance 2a. The electric field at a point on the axial line at distance r from the center (r >> a) is proportional to:',
    options: ['1/r³', '1/r²', '1/r', '1/r⁴'],
    correctIndex: 0,
    explanation:
      'The axial field of a dipole at large distances is E = 2kp/r³, where p = q·2a is the dipole moment. So E ∝ 1/r³.',
  },
  {
    id: 'p1_t2_ve1',
    topic: 'Electric Field',
    bloomLevel: 'Evaluate',
    difficulty: 'Easy',
    question: 'Which statement about electric field lines is correct?',
    options: [
      'Field lines never intersect',
      'Field lines can intersect at points of high field strength',
      'Field lines always form closed loops',
      'Field lines are always straight',
    ],
    correctIndex: 0,
    explanation:
      'Electric field lines never intersect because at any point, the electric field has a unique direction. If they intersected, there would be two directions of the field at the same point.',
  },
  {
    id: 'p1_t2_vm1',
    topic: 'Electric Field',
    bloomLevel: 'Evaluate',
    difficulty: 'Medium',
    question:
      'A student says the electric field is a scalar quantity. Which evaluation is correct?',
    options: [
      'The student is wrong; electric field is a vector quantity with both magnitude and direction',
      'The student is correct; electric field has only magnitude',
      'The student is partially correct; it is a scalar in uniform fields',
      'The student is correct; field lines show only magnitude',
    ],
    correctIndex: 0,
    explanation:
      'Electric field is a vector quantity. It has both magnitude (E = F/q) and direction (the direction of force on a positive test charge).',
  },
  {
    id: 'p1_t2_vh1',
    topic: 'Electric Field',
    bloomLevel: 'Evaluate',
    difficulty: 'Hard',
    question:
      'Compare the electric field of a point charge and a uniformly charged infinite plane sheet. Which statement is most accurate?',
    options: [
      'The point charge field decreases as 1/r², while the infinite sheet field is constant',
      'Both fields decrease as 1/r²',
      'The infinite sheet field decreases as 1/r², while the point charge field is constant',
      'Both fields are constant',
    ],
    correctIndex: 0,
    explanation:
      'The point charge field E = kQ/r² decreases with distance, while the field of an infinite plane sheet E = σ/(2ε₀) is uniform and independent of distance from the sheet.',
  },
  {
    id: 'p1_t3_ue1',
    topic: 'Electric Dipole',
    bloomLevel: 'Understand',
    difficulty: 'Easy',
    question: 'An electric dipole consists of:',
    options: [
      'Two equal and opposite charges separated by a small distance',
      'Two equal charges of the same sign separated by a distance',
      'A single positive charge',
      'Two unequal charges of the same sign',
    ],
    correctIndex: 0,
    explanation:
      'An electric dipole is a pair of equal and opposite charges (+q and -q) separated by a small distance.',
  },
  {
    id: 'p1_t3_um1',
    topic: 'Electric Dipole',
    bloomLevel: 'Understand',
    difficulty: 'Medium',
    question: 'The dipole moment vector is directed:',
    options: [
      'From the negative charge to the positive charge',
      'From the positive charge to the negative charge',
      'Perpendicular to the line joining the charges',
      'In any arbitrary direction',
    ],
    correctIndex: 0,
    explanation:
      'The dipole moment p = q·2a is directed from the negative charge toward the positive charge along the dipole axis.',
  },
  {
    id: 'p1_t3_uh1',
    topic: 'Electric Dipole',
    bloomLevel: 'Understand',
    difficulty: 'Hard',
    question: 'The SI unit of electric dipole moment is:',
    options: ['C·m', 'C/m', 'N·m', 'V/m'],
    correctIndex: 0,
    explanation:
      'Dipole moment p = q × 2a, where q is in coulombs and 2a is in meters. So the SI unit is C·m (coulomb-meter).',
  },
  {
    id: 'p1_t3_ae1',
    topic: 'Electric Dipole',
    bloomLevel: 'Apply',
    difficulty: 'Easy',
    question:
      'A dipole has charges ±2 μC separated by 0.01 m. Its dipole moment is:',
    options: ['2 × 10⁻⁸ C·m', '2 × 10⁻⁵ C·m', '2 × 10⁻⁶ C·m', '2 × 10⁻⁴ C·m'],
    correctIndex: 0,
    explanation: 'p = q × 2a = 2×10⁻⁶ × 0.01 = 2×10⁻⁸ C·m.',
  },
  {
    id: 'p1_t3_am1',
    topic: 'Electric Dipole',
    bloomLevel: 'Apply',
    difficulty: 'Medium',
    question:
      'A dipole of moment p is placed in a uniform electric field E at an angle θ. The torque on the dipole is:',
    options: ['pE sin θ', 'pE cos θ', 'pE', 'pE tan θ'],
    correctIndex: 0,
    explanation:
      'The torque on a dipole in a uniform electric field is τ = p × E = pE sin θ, where θ is the angle between p and E.',
  },
  {
    id: 'p1_t3_ah1',
    topic: 'Electric Dipole',
    bloomLevel: 'Apply',
    difficulty: 'Hard',
    question:
      'A dipole of moment 4 × 10⁻⁹ C·m is aligned at 60° to a uniform electric field of 5 × 10⁵ N/C. The torque on the dipole is:',
    options: [
      '1.73 × 10⁻³ N·m',
      '2 × 10⁻³ N·m',
      '1 × 10⁻³ N·m',
      '3.46 × 10⁻³ N·m',
    ],
    correctIndex: 0,
    explanation:
      'τ = pE sin θ = 4×10⁻⁹ × 5×10⁵ × sin 60° = 4×10⁻⁹ × 5×10⁵ × 0.866 = 1.73×10⁻³ N·m.',
  },
  {
    id: 'p1_t3_ne1',
    topic: 'Electric Dipole',
    bloomLevel: 'Analyze',
    difficulty: 'Easy',
    question:
      'The electric field on the equatorial line of a dipole at a large distance is:',
    options: [
      'Opposite to the direction of the dipole moment',
      'Along the direction of the dipole moment',
      'Perpendicular to the dipole moment',
      'Zero',
    ],
    correctIndex: 0,
    explanation:
      'On the equatorial line, the field is directed opposite to the dipole moment vector. The equatorial field E = -kp/r³.',
  },
  {
    id: 'p1_t3_nm1',
    topic: 'Electric Dipole',
    bloomLevel: 'Analyze',
    difficulty: 'Medium',
    question:
      'The ratio of the electric field on the axial line to that on the equatorial line of a dipole at the same distance is:',
    options: ['2:1', '1:2', '1:1', '4:1'],
    correctIndex: 0,
    explanation:
      'Axial field E_axial = 2kp/r³ and equatorial field E_equatorial = kp/r³. So the ratio is 2:1.',
  },
  {
    id: 'p1_t3_nh1',
    topic: 'Electric Dipole',
    bloomLevel: 'Analyze',
    difficulty: 'Hard',
    question:
      'A dipole is placed in a non-uniform electric field. Which statement is correct?',
    options: [
      'The dipole experiences both a net force and a torque',
      'The dipole experiences only a torque',
      'The dipole experiences only a net force',
      'The dipole experiences neither force nor torque',
    ],
    correctIndex: 0,
    explanation:
      'In a non-uniform field, the forces on the two charges are unequal, producing a net force. Additionally, since the forces are not collinear, a torque is also produced.',
  },
  {
    id: 'p1_t3_ve1',
    topic: 'Electric Dipole',
    bloomLevel: 'Evaluate',
    difficulty: 'Easy',
    question: 'In a uniform electric field, a dipole experiences:',
    options: [
      'Only a torque, no net force',
      'Only a net force, no torque',
      'Both a net force and a torque',
      'Neither a net force nor a torque',
    ],
    correctIndex: 0,
    explanation:
      'In a uniform field, the forces on the two charges are equal and opposite, so the net force is zero. However, they form a couple, producing a torque.',
  },
  {
    id: 'p1_t3_vm1',
    topic: 'Electric Dipole',
    bloomLevel: 'Evaluate',
    difficulty: 'Medium',
    question:
      'The potential energy of a dipole in a uniform electric field is minimum when:',
    options: [
      'The dipole is aligned parallel to the field (θ = 0°)',
      'The dipole is perpendicular to the field (θ = 90°)',
      'The dipole is antiparallel to the field (θ = 180°)',
      'The potential energy is constant for all orientations',
    ],
    correctIndex: 0,
    explanation:
      'U = -pE cos θ. This is minimum (most negative) when cos θ = 1, i.e., θ = 0°, when the dipole is aligned with the field.',
  },
  {
    id: 'p1_t3_vh1',
    topic: 'Electric Dipole',
    bloomLevel: 'Evaluate',
    difficulty: 'Hard',
    question:
      'A dipole is rotated from θ = 0° to θ = 180° in a uniform electric field. The work done by the external agent is:',
    options: ['2pE', 'pE', '0', '-2pE'],
    correctIndex: 0,
    explanation:
      'Work done = U_final - U_initial = (-pE cos 180°) - (-pE cos 0°) = pE - (-pE) = 2pE.',
  },
  {
    id: 'p1_t4_ue1',
    topic: "Gauss's Law",
    bloomLevel: 'Understand',
    difficulty: 'Easy',
    question:
      "Gauss's law states that the total electric flux through a closed surface is:",
    options: [
      'Equal to the net charge enclosed divided by ε₀',
      'Equal to the net charge enclosed multiplied by ε₀',
      'Always zero',
      'Equal to the total charge on the surface',
    ],
    correctIndex: 0,
    explanation:
      "Gauss's law: ∮E·dA = q_enc/ε₀. The total flux through a closed surface equals the net charge enclosed divided by the permittivity of free space.",
  },
  {
    id: 'p1_t4_um1',
    topic: "Gauss's Law",
    bloomLevel: 'Understand',
    difficulty: 'Medium',
    question: 'The electric flux through a closed surface depends on:',
    options: [
      'Only the net charge enclosed by the surface',
      'The total charge on the surface',
      'The shape of the surface',
      'The size of the surface',
    ],
    correctIndex: 0,
    explanation:
      "Gauss's law shows that flux depends only on the net charge enclosed, not on the shape, size, or position of the closed surface.",
  },
  {
    id: 'p1_t4_uh1',
    topic: "Gauss's Law",
    bloomLevel: 'Understand',
    difficulty: 'Hard',
    question:
      'A charge q is placed outside a closed surface. The net electric flux through the surface is:',
    options: [
      'Zero',
      'q/ε₀',
      'q/(2ε₀)',
      'Depends on the position of the charge',
    ],
    correctIndex: 0,
    explanation:
      "Since the charge is outside the closed surface, the net charge enclosed is zero. By Gauss's law, the net flux through the surface is zero.",
  },
  {
    id: 'p1_t4_ae1',
    topic: "Gauss's Law",
    bloomLevel: 'Apply',
    difficulty: 'Easy',
    question:
      'A charge of 8.85 μC is enclosed by a closed surface. The total electric flux through the surface is: (ε₀ = 8.85 × 10⁻¹² C²/N·m²)',
    options: [
      '1 × 10⁶ N·m²/C',
      '1 × 10⁻⁶ N·m²/C',
      '8.85 × 10⁶ N·m²/C',
      '8.85 × 10⁻⁶ N·m²/C',
    ],
    correctIndex: 0,
    explanation: 'Φ = q/ε₀ = 8.85×10⁻⁶ / 8.85×10⁻¹² = 1×10⁶ N·m²/C.',
  },
  {
    id: 'p1_t4_am1',
    topic: "Gauss's Law",
    bloomLevel: 'Apply',
    difficulty: 'Medium',
    question:
      'A point charge q is placed at the center of a sphere of radius R. The electric flux through the sphere is Φ. If the radius is doubled, the new flux is:',
    options: ['Φ', 'Φ/4', '4Φ', 'Φ/2'],
    correctIndex: 0,
    explanation:
      "By Gauss's law, flux depends only on the enclosed charge, not on the radius of the Gaussian surface. So the flux remains Φ.",
  },
  {
    id: 'p1_t4_ah1',
    topic: "Gauss's Law",
    bloomLevel: 'Apply',
    difficulty: 'Hard',
    question:
      'A uniformly charged infinite plane sheet has surface charge density σ. The electric field at a point near the sheet is:',
    options: ['σ/(2ε₀)', 'σ/ε₀', '2σ/ε₀', 'σ/(4ε₀)'],
    correctIndex: 0,
    explanation:
      'Using a cylindrical Gaussian surface, the field of an infinite plane sheet is E = σ/(2ε₀), directed perpendicular to the sheet.',
  },
  {
    id: 'p1_t4_ne1',
    topic: "Gauss's Law",
    bloomLevel: 'Analyze',
    difficulty: 'Easy',
    question:
      'The electric field due to a uniformly charged infinite line with linear charge density λ at distance r is:',
    options: ['λ/(2πε₀r)', 'λ/(πε₀r)', 'λ/(4πε₀r)', 'λr/(2πε₀)'],
    correctIndex: 0,
    explanation:
      'Using a cylindrical Gaussian surface around the line charge, E = λ/(2πε₀r).',
  },
  {
    id: 'p1_t4_nm1',
    topic: "Gauss's Law",
    bloomLevel: 'Analyze',
    difficulty: 'Medium',
    question:
      'A charge q is placed at the center of a cube. The flux through one face of the cube is q/(6ε₀). If the charge is moved to a corner of the cube, the flux through the cube is:',
    options: ['q/(8ε₀)', 'q/ε₀', 'q/(6ε₀)', 'q/(2ε₀)'],
    correctIndex: 0,
    explanation:
      'When the charge is at a corner, only 1/8 of the charge is effectively inside the cube (considering 8 cubes meeting at that corner). So flux = q/(8ε₀).',
  },
  {
    id: 'p1_t4_nh1',
    topic: "Gauss's Law",
    bloomLevel: 'Analyze',
    difficulty: 'Hard',
    question:
      'A conducting sphere of radius R has charge Q. The electric field at a point inside the sphere (r < R) is:',
    options: ['Zero', 'kQ/r²', 'kQ/R²', 'kQr/R³'],
    correctIndex: 0,
    explanation:
      'For a conductor in electrostatic equilibrium, the charge resides on the surface. Inside the conductor, the net charge enclosed by any Gaussian surface is zero, so E = 0.',
  },
  {
    id: 'p1_t4_ve1',
    topic: "Gauss's Law",
    bloomLevel: 'Evaluate',
    difficulty: 'Easy',
    question:
      "Gauss's law is most useful for calculating electric fields when:",
    options: [
      'The charge distribution has high symmetry (spherical, cylindrical, or planar)',
      'The charge distribution is completely random',
      'The charges are moving at high speeds',
      'The charges are in a non-uniform medium',
    ],
    correctIndex: 0,
    explanation:
      "Gauss's law is most effective when the charge distribution has symmetry that allows the field to be taken out of the surface integral.",
  },
  {
    id: 'p1_t4_vm1',
    topic: "Gauss's Law",
    bloomLevel: 'Evaluate',
    difficulty: 'Medium',
    question:
      "A student claims that Gauss's law is only valid for symmetric charge distributions. Which evaluation is correct?",
    options: [
      "Gauss's law is valid for all charge distributions, but it is most useful for symmetric ones",
      "Gauss's law is only valid for spherical charge distributions",
      "Gauss's law is only valid for point charges",
      "Gauss's law is only valid in vacuum",
    ],
    correctIndex: 0,
    explanation:
      "Gauss's law is a fundamental law valid for any charge distribution. However, it is practically useful for calculating fields only when the distribution has symmetry.",
  },
  {
    id: 'p1_t4_vh1',
    topic: "Gauss's Law",
    bloomLevel: 'Evaluate',
    difficulty: 'Hard',
    question:
      'Compare the electric field of a uniformly charged solid sphere (non-conducting) at a point inside (r < R) and outside (r > R). Which statement is correct?',
    options: [
      'Inside: E ∝ r; Outside: E ∝ 1/r²',
      'Inside: E ∝ 1/r²; Outside: E ∝ r',
      'Inside: E = 0; Outside: E ∝ 1/r²',
      'Inside: E ∝ 1/r²; Outside: E ∝ 1/r²',
    ],
    correctIndex: 0,
    explanation:
      'For a uniformly charged non-conducting sphere, inside (r < R): E = kQr/R³ (proportional to r). Outside (r > R): E = kQ/r² (inverse square).',
  },
  {
    id: 'p1_t5_ue1',
    topic: 'Field Lines & Conductors',
    bloomLevel: 'Understand',
    difficulty: 'Easy',
    question:
      'Electric field lines inside a conductor in electrostatic equilibrium are:',
    options: ['Zero', 'Uniform and parallel', 'Radial', 'Circular'],
    correctIndex: 0,
    explanation:
      'In electrostatic equilibrium, the electric field inside a conductor is zero. Free electrons redistribute to cancel any internal field.',
  },
  {
    id: 'p1_t5_um1',
    topic: 'Field Lines & Conductors',
    bloomLevel: 'Understand',
    difficulty: 'Medium',
    question: 'The electric field just outside a charged conductor is:',
    options: [
      'Perpendicular to the surface',
      'Parallel to the surface',
      'At 45° to the surface',
      'Zero',
    ],
    correctIndex: 0,
    explanation:
      'In electrostatic equilibrium, the electric field just outside a conductor is always perpendicular to the surface. Any tangential component would cause charge motion.',
  },
  {
    id: 'p1_t5_uh1',
    topic: 'Field Lines & Conductors',
    bloomLevel: 'Understand',
    difficulty: 'Hard',
    question: 'The surface charge density on a charged conductor is:',
    options: [
      'Highest where the surface is most curved (sharp points)',
      'Uniform everywhere on the surface',
      'Highest on flat surfaces',
      'Zero on sharp points',
    ],
    correctIndex: 0,
    explanation:
      'Charge density is highest at sharp points or regions of maximum curvature. This is why lightning rods have sharp tips.',
  },
  {
    id: 'p1_t5_ae1',
    topic: 'Field Lines & Conductors',
    bloomLevel: 'Apply',
    difficulty: 'Easy',
    question:
      'A conductor with a cavity has no charge inside the cavity. The electric field inside the cavity is:',
    options: [
      'Zero',
      'Non-zero and uniform',
      'Non-zero and radial',
      'Depends on the shape of the cavity',
    ],
    correctIndex: 0,
    explanation:
      'In electrostatic equilibrium, the field inside a cavity of a conductor (with no charge in the cavity) is zero. This is the principle of electrostatic shielding.',
  },
  {
    id: 'p1_t5_am1',
    topic: 'Field Lines & Conductors',
    bloomLevel: 'Apply',
    difficulty: 'Medium',
    question:
      'A charge +Q is placed inside a hollow conductor. The charge induced on the inner surface of the conductor is:',
    options: ['-Q', '+Q', '0', '-Q/2'],
    correctIndex: 0,
    explanation:
      "By Gauss's law, the net charge on the inner surface must be -Q to cancel the field inside the conductor material. The outer surface then has +Q.",
  },
  {
    id: 'p1_t5_ah1',
    topic: 'Field Lines & Conductors',
    bloomLevel: 'Apply',
    difficulty: 'Hard',
    question:
      'A conducting sphere of radius R has charge Q. The electric field just outside the surface is E₀. If the radius is doubled while keeping the charge constant, the new field just outside is:',
    options: ['E₀/4', 'E₀/2', '2E₀', '4E₀'],
    correctIndex: 0,
    explanation: 'E = kQ/R². If R is doubled, E = kQ/(2R)² = kQ/4R² = E₀/4.',
  },
  {
    id: 'p1_t5_ne1',
    topic: 'Field Lines & Conductors',
    bloomLevel: 'Analyze',
    difficulty: 'Easy',
    question:
      'The number of electric field lines originating from a charge is proportional to:',
    options: [
      'The magnitude of the charge',
      'The square of the charge',
      'The distance from the charge',
      'The medium surrounding the charge',
    ],
    correctIndex: 0,
    explanation:
      'The number of field lines is proportional to the magnitude of the charge. More charge means more field lines.',
  },
  {
    id: 'p1_t5_nm1',
    topic: 'Field Lines & Conductors',
    bloomLevel: 'Analyze',
    difficulty: 'Medium',
    question:
      'Two conductors A and B have charges Q and 2Q respectively. If they are connected by a wire, the charge will redistribute such that:',
    options: [
      'Both reach the same potential',
      'Both have equal charges',
      'A has more charge than B',
      'The charges remain unchanged',
    ],
    correctIndex: 0,
    explanation:
      'When conductors are connected by a wire, charge flows until both reach the same potential. The final charge distribution depends on their capacitances.',
  },
  {
    id: 'p1_t5_nh1',
    topic: 'Field Lines & Conductors',
    bloomLevel: 'Analyze',
    difficulty: 'Hard',
    question:
      'A charged conductor is placed in an external electric field. The field inside the conductor is:',
    options: [
      'Zero, because free electrons redistribute to cancel the external field',
      'Equal to the external field',
      'Half the external field',
      'Twice the external field',
    ],
    correctIndex: 0,
    explanation:
      'In electrostatic equilibrium, free electrons in the conductor redistribute to create an internal field that exactly cancels the external field, making the net field inside zero.',
  },
  {
    id: 'p1_t5_ve1',
    topic: 'Field Lines & Conductors',
    bloomLevel: 'Evaluate',
    difficulty: 'Easy',
    question: 'The principle of electrostatic shielding is used in:',
    options: [
      'Protecting sensitive electronic equipment from external electric fields',
      'Increasing the capacitance of a capacitor',
      'Generating electric current',
      'Magnetizing materials',
    ],
    correctIndex: 0,
    explanation:
      'Electrostatic shielding uses a conducting enclosure to protect the interior from external electric fields. This is used in shielding sensitive electronic equipment.',
  },
  {
    id: 'p1_t5_vm1',
    topic: 'Field Lines & Conductors',
    bloomLevel: 'Evaluate',
    difficulty: 'Medium',
    question:
      'A student says that insulators cannot hold electric charge. Which evaluation is correct?',
    options: [
      'The student is wrong; insulators can hold charge, but the charge does not move freely',
      'The student is correct; insulators cannot hold any charge',
      'The student is partially correct; insulators can only hold negative charge',
      'The student is correct; only conductors can hold charge',
    ],
    correctIndex: 0,
    explanation:
      'Insulators can hold charge, but the charge remains localized where it was placed because charge carriers are not free to move. Conductors allow charge to spread over the surface.',
  },
  {
    id: 'p1_t5_vh1',
    topic: 'Field Lines & Conductors',
    bloomLevel: 'Evaluate',
    difficulty: 'Hard',
    question:
      'Compare the behavior of a conductor and an insulator when placed in an external electric field. Which statement is most accurate?',
    options: [
      'In a conductor, free electrons redistribute to cancel the internal field; in an insulator, charges are slightly displaced (polarization) but the internal field is not fully cancelled',
      'Both conductors and insulators completely cancel the internal field',
      'Neither conductors nor insulators affect the internal field',
      'Insulators cancel the internal field, but conductors do not',
    ],
    correctIndex: 0,
    explanation:
      'In conductors, free electrons move to cancel the internal field completely. In insulators, bound charges are only slightly displaced, causing polarization, but the internal field is only partially reduced.',
  },
  {
    id: 'p1_t6_ue1',
    topic: 'Charge & Its Properties',
    bloomLevel: 'Understand',
    difficulty: 'Easy',
    question: 'The law of conservation of charge states that:',
    options: [
      'The total charge in an isolated system remains constant',
      'Charge can be created but not destroyed',
      'Charge can be destroyed but not created',
      'Charge is always positive',
    ],
    correctIndex: 0,
    explanation:
      'Charge conservation states that the total electric charge in an isolated system is constant. Charge can be transferred but not created or destroyed.',
  },
  {
    id: 'p1_t6_um1',
    topic: 'Charge & Its Properties',
    bloomLevel: 'Understand',
    difficulty: 'Medium',
    question: 'The quantization of charge means that:',
    options: [
      'Charge exists in discrete multiples of the elementary charge e',
      'Charge can take any continuous value',
      'Charge is always an integer number of coulombs',
      'Charge is always zero',
    ],
    correctIndex: 0,
    explanation:
      'Quantization means charge is always an integral multiple of the elementary charge e = 1.6 × 10⁻¹⁹ C. q = ne, where n is an integer.',
  },
  {
    id: 'p1_t6_uh1',
    topic: 'Charge & Its Properties',
    bloomLevel: 'Understand',
    difficulty: 'Hard',
    question: 'The elementary charge e has the value:',
    options: [
      '1.6 × 10⁻¹⁹ C',
      '1.6 × 10⁻¹⁷ C',
      '9.1 × 10⁻³¹ C',
      '1.6 × 10⁻²⁷ C',
    ],
    correctIndex: 0,
    explanation:
      'The elementary charge is e = 1.6 × 10⁻¹⁹ C. The electron has charge -e and the proton has charge +e.',
  },
  {
    id: 'p1_t6_ae1',
    topic: 'Charge & Its Properties',
    bloomLevel: 'Apply',
    difficulty: 'Easy',
    question:
      'A body has a charge of 3.2 × 10⁻¹⁹ C. The number of excess electrons on the body is: (e = 1.6 × 10⁻¹⁹ C)',
    options: ['2', '3', '4', '5'],
    correctIndex: 0,
    explanation: 'n = q/e = 3.2×10⁻¹⁹ / 1.6×10⁻¹⁹ = 2 electrons.',
  },
  {
    id: 'p1_t6_am1',
    topic: 'Charge & Its Properties',
    bloomLevel: 'Apply',
    difficulty: 'Medium',
    question:
      'A body has 10¹⁰ excess electrons. Its charge is: (e = 1.6 × 10⁻¹⁹ C)',
    options: [
      '-1.6 × 10⁻⁹ C',
      '+1.6 × 10⁻⁹ C',
      '-1.6 × 10⁻¹⁰ C',
      '+1.6 × 10⁻¹⁰ C',
    ],
    correctIndex: 0,
    explanation:
      'q = ne = 10¹⁰ × (-1.6×10⁻¹⁹) = -1.6×10⁻⁹ C. The charge is negative because there are excess electrons.',
  },
  {
    id: 'p1_t6_ah1',
    topic: 'Charge & Its Properties',
    bloomLevel: 'Apply',
    difficulty: 'Hard',
    question:
      'When a glass rod is rubbed with silk, the glass rod acquires a charge of +3.2 × 10⁻¹⁹ C. The number of electrons transferred is:',
    options: [
      '2 electrons transferred from glass to silk',
      '2 electrons transferred from silk to glass',
      '4 electrons transferred from glass to silk',
      '4 electrons transferred from silk to glass',
    ],
    correctIndex: 0,
    explanation:
      'The glass rod becomes positively charged, meaning it loses electrons. n = q/e = 3.2×10⁻¹⁹/1.6×10⁻¹⁹ = 2 electrons are transferred from glass to silk.',
  },
  {
    id: 'p1_t6_ne1',
    topic: 'Charge & Its Properties',
    bloomLevel: 'Analyze',
    difficulty: 'Easy',
    question:
      'When a charged body is brought near an uncharged conductor, the conductor:',
    options: [
      'Gets charged by induction',
      'Gets charged by conduction',
      'Remains completely uncharged',
      'Loses all its free electrons',
    ],
    correctIndex: 0,
    explanation:
      'When a charged body is brought near an uncharged conductor, charge separation occurs in the conductor by induction. The conductor gets charged by induction.',
  },
  {
    id: 'p1_t6_nm1',
    topic: 'Charge & Its Properties',
    bloomLevel: 'Analyze',
    difficulty: 'Medium',
    question:
      'A positively charged rod is brought near an uncharged metal sphere. The side of the sphere nearest to the rod becomes:',
    options: [
      'Negatively charged',
      'Positively charged',
      'Neutral',
      'Alternately charged',
    ],
    correctIndex: 0,
    explanation:
      'The positive rod attracts electrons in the sphere toward the near side, making the near side negatively charged and the far side positively charged.',
  },
  {
    id: 'p1_t6_nh1',
    topic: 'Charge & Its Properties',
    bloomLevel: 'Analyze',
    difficulty: 'Hard',
    question:
      'Two identical metal spheres A and B have charges +6 μC and -2 μC. They are brought into contact and then separated. The final charge on each is:',
    options: ['+2 μC', '+4 μC', '-2 μC', '0 μC'],
    correctIndex: 0,
    explanation:
      'Total charge = +6 + (-2) = +4 μC. When identical spheres touch, charge is shared equally: +4/2 = +2 μC on each.',
  },
  {
    id: 'p1_t6_ve1',
    topic: 'Charge & Its Properties',
    bloomLevel: 'Evaluate',
    difficulty: 'Easy',
    question: 'Which statement about the additivity of charge is correct?',
    options: [
      'The total charge of a system is the algebraic sum of individual charges',
      'The total charge is the vector sum of individual charges',
      'The total charge is always positive',
      'The total charge is always zero',
    ],
    correctIndex: 0,
    explanation:
      'Charge is a scalar quantity. The total charge of a system is the algebraic sum of all individual charges, considering their signs.',
  },
  {
    id: 'p1_t6_vm1',
    topic: 'Charge & Its Properties',
    bloomLevel: 'Evaluate',
    difficulty: 'Medium',
    question:
      'A student claims that charge is a vector quantity. Which evaluation is correct?',
    options: [
      'The student is wrong; charge is a scalar quantity',
      'The student is correct; charge has both magnitude and direction',
      'The student is partially correct; charge is a vector only in electric fields',
      'The student is correct; charge always points in one direction',
    ],
    correctIndex: 0,
    explanation:
      'Charge is a scalar quantity. It has magnitude and sign (positive or negative) but no direction in space.',
  },
  {
    id: 'p1_t6_vh1',
    topic: 'Charge & Its Properties',
    bloomLevel: 'Evaluate',
    difficulty: 'Hard',
    question:
      'In a nuclear reaction, a neutron decays into a proton and an electron. Which statement about charge conservation is correct?',
    options: [
      'Charge is conserved: the neutron (0) becomes proton (+e) and electron (-e), with net charge 0',
      'Charge is not conserved in nuclear reactions',
      'Charge is created in this reaction',
      'Charge is destroyed in this reaction',
    ],
    correctIndex: 0,
    explanation:
      'Charge is conserved. The neutron has charge 0. After decay, the proton has +e and the electron has -e, so the total charge is +e + (-e) = 0, which equals the initial charge.',
  },
  {
    id: 'p1_t7_ue1',
    topic: 'Electric Flux',
    bloomLevel: 'Understand',
    difficulty: 'Easy',
    question: 'Electric flux is defined as:',
    options: [
      'The dot product of the electric field and the area vector',
      'The cross product of the electric field and the area vector',
      'The ratio of electric field to area',
      'The product of electric field and charge',
    ],
    correctIndex: 0,
    explanation:
      'Electric flux Φ = E·A = EA cos θ, where θ is the angle between the electric field and the area vector (normal to the surface).',
  },
  {
    id: 'p1_t7_um1',
    topic: 'Electric Flux',
    bloomLevel: 'Understand',
    difficulty: 'Medium',
    question: 'The SI unit of electric flux is:',
    options: ['N·m²/C', 'N/C', 'V·m', 'C/m²'],
    correctIndex: 0,
    explanation:
      'Electric flux = E × A = (N/C) × m² = N·m²/C. It can also be expressed as V·m.',
  },
  {
    id: 'p1_t7_uh1',
    topic: 'Electric Flux',
    bloomLevel: 'Understand',
    difficulty: 'Hard',
    question: 'The electric flux through a surface is maximum when:',
    options: [
      'The electric field is perpendicular to the surface',
      'The electric field is parallel to the surface',
      'The electric field is at 45° to the surface',
      'The electric field is zero',
    ],
    correctIndex: 0,
    explanation:
      'Φ = EA cos θ. When the field is perpendicular to the surface, θ = 0° and cos θ = 1, giving maximum flux Φ = EA.',
  },
  {
    id: 'p1_t7_ae1',
    topic: 'Electric Flux',
    bloomLevel: 'Apply',
    difficulty: 'Easy',
    question:
      'A uniform electric field of 100 N/C passes through a square of area 0.5 m² perpendicular to the field. The flux is:',
    options: ['50 N·m²/C', '100 N·m²/C', '200 N·m²/C', '25 N·m²/C'],
    correctIndex: 0,
    explanation: 'Φ = EA cos 0° = 100 × 0.5 × 1 = 50 N·m²/C.',
  },
  {
    id: 'p1_t7_am1',
    topic: 'Electric Flux',
    bloomLevel: 'Apply',
    difficulty: 'Medium',
    question:
      'A uniform electric field of 200 N/C passes through a circular area of radius 0.1 m at an angle of 60° to the normal. The flux is:',
    options: ['π N·m²/C', '2π N·m²/C', '4π N·m²/C', '0.5π N·m²/C'],
    correctIndex: 0,
    explanation:
      'A = πr² = π(0.1)² = 0.01π m². Φ = EA cos 60° = 200 × 0.01π × 0.5 = π N·m²/C.',
  },
  {
    id: 'p1_t7_ah1',
    topic: 'Electric Flux',
    bloomLevel: 'Apply',
    difficulty: 'Hard',
    question:
      'A charge q is placed at the center of a cube of side a. The total electric flux through the cube is:',
    options: ['q/ε₀', 'q/(6ε₀)', 'q/(2ε₀)', 'q/(4ε₀)'],
    correctIndex: 0,
    explanation:
      "By Gauss's law, the total flux through any closed surface enclosing charge q is q/ε₀, regardless of the shape or size of the surface.",
  },
  {
    id: 'p1_t7_ne1',
    topic: 'Electric Flux',
    bloomLevel: 'Analyze',
    difficulty: 'Easy',
    question:
      'The electric flux through a closed surface enclosing no net charge is:',
    options: ['Zero', 'Positive', 'Negative', 'Infinite'],
    correctIndex: 0,
    explanation:
      "By Gauss's law, if the net charge enclosed is zero, the net flux through the closed surface is zero.",
  },
  {
    id: 'p1_t7_nm1',
    topic: 'Electric Flux',
    bloomLevel: 'Analyze',
    difficulty: 'Medium',
    question:
      'A charge q is placed at the center of a cube. The flux through one face of the cube is:',
    options: ['q/(6ε₀)', 'q/ε₀', 'q/(4ε₀)', 'q/(2ε₀)'],
    correctIndex: 0,
    explanation:
      'Total flux = q/ε₀. By symmetry, each of the 6 faces gets an equal share: q/(6ε₀).',
  },
  {
    id: 'p1_t7_nh1',
    topic: 'Electric Flux',
    bloomLevel: 'Analyze',
    difficulty: 'Hard',
    question:
      'A charge q is placed at the center of a sphere. If the sphere is replaced by a cube of the same volume, the total flux through the cube is:',
    options: [
      'The same as through the sphere',
      'Greater than through the sphere',
      'Less than through the sphere',
      'Zero',
    ],
    correctIndex: 0,
    explanation:
      "Gauss's law states that the total flux depends only on the enclosed charge, not on the shape of the surface. So the flux through the cube equals the flux through the sphere.",
  },
  {
    id: 'p1_t7_ve1',
    topic: 'Electric Flux',
    bloomLevel: 'Evaluate',
    difficulty: 'Easy',
    question: 'Which statement about electric flux is correct?',
    options: [
      'Flux is a scalar quantity',
      'Flux is a vector quantity',
      'Flux is always positive',
      'Flux is always negative',
    ],
    correctIndex: 0,
    explanation:
      'Electric flux is a scalar quantity. It can be positive, negative, or zero depending on the angle between the field and the area vector.',
  },
  {
    id: 'p1_t7_vm1',
    topic: 'Electric Flux',
    bloomLevel: 'Evaluate',
    difficulty: 'Medium',
    question:
      'A student says that the flux through a closed surface is always positive. Which evaluation is correct?',
    options: [
      'The student is wrong; flux can be positive, negative, or zero depending on the enclosed charge',
      'The student is correct; flux is always positive',
      'The student is partially correct; flux is always positive for conductors',
      'The student is correct; flux is always positive in vacuum',
    ],
    correctIndex: 0,
    explanation:
      'Flux through a closed surface is positive if the net enclosed charge is positive, negative if the net enclosed charge is negative, and zero if no net charge is enclosed.',
  },
  {
    id: 'p1_t7_vh1',
    topic: 'Electric Flux',
    bloomLevel: 'Evaluate',
    difficulty: 'Hard',
    question:
      'Compare the flux through a closed surface when a charge is (a) at the center and (b) near the surface but still inside. Which statement is correct?',
    options: [
      'The flux is the same in both cases because it depends only on the enclosed charge',
      'The flux is greater when the charge is at the center',
      'The flux is greater when the charge is near the surface',
      'The flux is zero in both cases',
    ],
    correctIndex: 0,
    explanation:
      "Gauss's law states that the flux through a closed surface depends only on the net charge enclosed, not on the position of the charge within the surface.",
  },
  {
    id: 'p1_t8_ue1',
    topic: 'Continuous Charge Distribution',
    bloomLevel: 'Understand',
    difficulty: 'Easy',
    question: 'Linear charge density is defined as:',
    options: [
      'Charge per unit length',
      'Charge per unit area',
      'Charge per unit volume',
      'Charge per unit mass',
    ],
    correctIndex: 0,
    explanation:
      'Linear charge density λ = q/L, measured in C/m. It describes charge distributed along a line.',
  },
  {
    id: 'p1_t8_um1',
    topic: 'Continuous Charge Distribution',
    bloomLevel: 'Understand',
    difficulty: 'Medium',
    question: 'Surface charge density is defined as:',
    options: [
      'Charge per unit area',
      'Charge per unit length',
      'Charge per unit volume',
      'Charge per unit mass',
    ],
    correctIndex: 0,
    explanation:
      'Surface charge density σ = q/A, measured in C/m². It describes charge distributed over a surface.',
  },
  {
    id: 'p1_t8_uh1',
    topic: 'Continuous Charge Distribution',
    bloomLevel: 'Understand',
    difficulty: 'Hard',
    question: 'Volume charge density is defined as:',
    options: [
      'Charge per unit volume',
      'Charge per unit area',
      'Charge per unit length',
      'Charge per unit mass',
    ],
    correctIndex: 0,
    explanation:
      'Volume charge density ρ = q/V, measured in C/m³. It describes charge distributed throughout a volume.',
  },
  {
    id: 'p1_t8_ae1',
    topic: 'Continuous Charge Distribution',
    bloomLevel: 'Apply',
    difficulty: 'Easy',
    question:
      'A charge of 10 μC is uniformly distributed over a wire of length 2 m. The linear charge density is:',
    options: ['5 μC/m', '10 μC/m', '20 μC/m', '2.5 μC/m'],
    correctIndex: 0,
    explanation: 'λ = q/L = 10 μC / 2 m = 5 μC/m.',
  },
  {
    id: 'p1_t8_am1',
    topic: 'Continuous Charge Distribution',
    bloomLevel: 'Apply',
    difficulty: 'Medium',
    question:
      'A charge of 20 μC is uniformly distributed over a circular disc of radius 0.1 m. The surface charge density is:',
    options: ['2000/π μC/m²', '20 μC/m²', '200 μC/m²', '2 μC/m²'],
    correctIndex: 0,
    explanation:
      'A = πr² = π(0.1)² = 0.01π m². σ = q/A = 20 μC / 0.01π = 2000/π μC/m².',
  },
  {
    id: 'p1_t8_ah1',
    topic: 'Continuous Charge Distribution',
    bloomLevel: 'Apply',
    difficulty: 'Hard',
    question:
      'A charge of 30 μC is uniformly distributed throughout a sphere of radius 0.1 m. The volume charge density is:',
    options: ['30/(4π/3 × 10⁻³) μC/m³', '30 μC/m³', '300 μC/m³', '3 μC/m³'],
    correctIndex: 0,
    explanation:
      'V = (4/3)πr³ = (4/3)π(0.1)³ = (4/3)π × 10⁻³ m³. ρ = q/V = 30 μC / ((4/3)π × 10⁻³) = 30 × 3/(4π × 10⁻³) = 90/(4π × 10⁻³) μC/m³ = 22500/π μC/m³.',
  },
  {
    id: 'p1_t8_ne1',
    topic: 'Continuous Charge Distribution',
    bloomLevel: 'Analyze',
    difficulty: 'Easy',
    question:
      'The electric field due to an infinite line charge with linear density λ at distance r is proportional to:',
    options: ['1/r', '1/r²', 'r', 'r²'],
    correctIndex: 0,
    explanation:
      'E = λ/(2πε₀r), so the field of an infinite line charge is proportional to 1/r.',
  },
  {
    id: 'p1_t8_nm1',
    topic: 'Continuous Charge Distribution',
    bloomLevel: 'Analyze',
    difficulty: 'Medium',
    question:
      'The electric field due to an infinite plane sheet with surface density σ is:',
    options: [
      'Independent of distance from the sheet',
      'Inversely proportional to distance',
      'Inversely proportional to distance squared',
      'Directly proportional to distance',
    ],
    correctIndex: 0,
    explanation:
      'E = σ/(2ε₀) for an infinite plane sheet. The field is uniform and independent of distance from the sheet.',
  },
  {
    id: 'p1_t8_nh1',
    topic: 'Continuous Charge Distribution',
    bloomLevel: 'Analyze',
    difficulty: 'Hard',
    question:
      'Two infinite plane sheets with surface charge densities +σ and -σ are placed parallel to each other. The electric field between the sheets is:',
    options: ['σ/ε₀', 'σ/(2ε₀)', '0', '2σ/ε₀'],
    correctIndex: 0,
    explanation:
      'Each sheet produces a field of σ/(2ε₀). Between the sheets, the fields add: E = σ/(2ε₀) + σ/(2ε₀) = σ/ε₀.',
  },
  {
    id: 'p1_t8_ve1',
    topic: 'Continuous Charge Distribution',
    bloomLevel: 'Evaluate',
    difficulty: 'Easy',
    question:
      'Which statement about continuous charge distributions is correct?',
    options: [
      'The total charge is found by integrating the charge density over the distribution',
      'The total charge is found by summing discrete point charges only',
      "Continuous distributions cannot be analyzed using Gauss's law",
      'Charge density is always uniform',
    ],
    correctIndex: 0,
    explanation:
      'For continuous distributions, the total charge is Q = ∫λ dl (line), Q = ∫σ dA (surface), or Q = ∫ρ dV (volume).',
  },
  {
    id: 'p1_t8_vm1',
    topic: 'Continuous Charge Distribution',
    bloomLevel: 'Evaluate',
    difficulty: 'Medium',
    question:
      'A student says that the field of a finite line charge is the same as that of an infinite line charge. Which evaluation is correct?',
    options: [
      'The student is wrong; the field of a finite line charge differs, especially near the ends',
      'The student is correct; the fields are identical everywhere',
      'The student is partially correct; the fields are identical only at the center',
      'The student is correct; both fields are zero',
    ],
    correctIndex: 0,
    explanation:
      'The field of a finite line charge is different from that of an infinite line charge, particularly near the ends where edge effects are significant. The infinite line approximation is valid only far from the ends.',
  },
  {
    id: 'p1_t8_vh1',
    topic: 'Continuous Charge Distribution',
    bloomLevel: 'Evaluate',
    difficulty: 'Hard',
    question:
      'Compare the electric field of a uniformly charged ring and a uniformly charged disc at a point on their axis. Which statement is most accurate?',
    options: [
      'The ring field is zero at the center and increases then decreases; the disc field is maximum at the center and decreases',
      'Both fields are maximum at the center',
      'Both fields are zero at the center',
      'The disc field is zero at the center and increases outward',
    ],
    correctIndex: 0,
    explanation:
      'For a ring, the field at the center is zero (fields from opposite elements cancel). For a disc, the field at the center is maximum (all elements contribute in the same direction).',
  },
  {
    id: 'p1_t9_ue1',
    topic: "Applications of Gauss's Law",
    bloomLevel: 'Understand',
    difficulty: 'Easy',
    question:
      'The electric field due to a uniformly charged infinite line at distance r is:',
    options: ['λ/(2πε₀r)', 'λ/(πε₀r)', 'λ/(4πε₀r)', 'λr/(2πε₀)'],
    correctIndex: 0,
    explanation:
      'Using a cylindrical Gaussian surface, E = λ/(2πε₀r) for an infinite line charge.',
  },
  {
    id: 'p1_t9_um1',
    topic: "Applications of Gauss's Law",
    bloomLevel: 'Understand',
    difficulty: 'Medium',
    question:
      'The electric field due to a uniformly charged infinite plane sheet is:',
    options: [
      'σ/(2ε₀), independent of distance',
      'σ/(2ε₀r), dependent on distance',
      'σ/(2ε₀r²), dependent on distance',
      'Zero',
    ],
    correctIndex: 0,
    explanation:
      'For an infinite plane sheet, E = σ/(2ε₀), which is uniform and independent of distance from the sheet.',
  },
  {
    id: 'p1_t9_uh1',
    topic: "Applications of Gauss's Law",
    bloomLevel: 'Understand',
    difficulty: 'Hard',
    question:
      'The electric field just outside a charged conducting sphere of radius R with charge Q is:',
    options: ['kQ/R²', 'kQ/(2R²)', 'kQ/(4R²)', 'Zero'],
    correctIndex: 0,
    explanation:
      'For a conducting sphere, the charge is on the surface. Just outside, E = kQ/R², same as a point charge at the center.',
  },
  {
    id: 'p1_t9_ae1',
    topic: "Applications of Gauss's Law",
    bloomLevel: 'Apply',
    difficulty: 'Easy',
    question:
      'A conducting sphere of radius 0.1 m has a charge of 1 μC. The electric field just outside the surface is: (k = 9 × 10⁹)',
    options: ['9 × 10⁵ N/C', '9 × 10⁶ N/C', '9 × 10⁴ N/C', '9 × 10⁷ N/C'],
    correctIndex: 0,
    explanation:
      'E = kQ/R² = 9×10⁹ × 1×10⁻⁶ / (0.1)² = 9×10³/0.01 = 9×10⁵ N/C.',
  },
  {
    id: 'p1_t9_am1',
    topic: "Applications of Gauss's Law",
    bloomLevel: 'Apply',
    difficulty: 'Medium',
    question:
      'A non-conducting sphere of radius R has uniform volume charge density ρ. The electric field at a point inside the sphere (r < R) is:',
    options: ['ρr/(3ε₀)', 'ρR/(3ε₀)', 'ρr²/(3ε₀)', 'ρ/(3ε₀r)'],
    correctIndex: 0,
    explanation:
      'Using a Gaussian sphere of radius r < R, the enclosed charge is ρ(4/3)πr³. E(4πr²) = ρ(4/3)πr³/ε₀, so E = ρr/(3ε₀).',
  },
  {
    id: 'p1_t9_ah1',
    topic: "Applications of Gauss's Law",
    bloomLevel: 'Apply',
    difficulty: 'Hard',
    question:
      'A solid conducting sphere of radius R has charge Q. A point charge q is placed at a distance 2R from the center. The force on q is:',
    options: ['kQq/(4R²)', 'kQq/(2R²)', 'kQq/R²', 'kQq/(8R²)'],
    correctIndex: 0,
    explanation:
      'For a conducting sphere, the charge Q acts as if concentrated at the center. The force on q at distance 2R is F = kQq/(2R)² = kQq/(4R²).',
  },
  {
    id: 'p1_t9_ne1',
    topic: "Applications of Gauss's Law",
    bloomLevel: 'Analyze',
    difficulty: 'Easy',
    question:
      'The electric field inside a uniformly charged non-conducting sphere (r < R) is:',
    options: [
      'Directly proportional to r',
      'Inversely proportional to r',
      'Constant',
      'Zero',
    ],
    correctIndex: 0,
    explanation:
      'E = ρr/(3ε₀) inside a uniformly charged non-conducting sphere, so E ∝ r.',
  },
  {
    id: 'p1_t9_nm1',
    topic: "Applications of Gauss's Law",
    bloomLevel: 'Analyze',
    difficulty: 'Medium',
    question:
      'The electric field at a point outside a uniformly charged non-conducting sphere (r > R) is:',
    options: ['kQ/r², same as a point charge', 'kQr/R³', 'kQ/R²', 'Zero'],
    correctIndex: 0,
    explanation:
      'For r > R, the entire charge Q is enclosed by the Gaussian surface, so E = kQ/r², same as a point charge at the center.',
  },
  {
    id: 'p1_t9_nh1',
    topic: "Applications of Gauss's Law",
    bloomLevel: 'Analyze',
    difficulty: 'Hard',
    question:
      'A conducting sphere of radius R has charge Q. A point charge q is placed at the center of the sphere. The charge on the inner surface of the sphere is:',
    options: ['-q', '+q', 'Q - q', 'Q + q'],
    correctIndex: 0,
    explanation:
      "By Gauss's law, the net charge enclosed by a Gaussian surface just inside the conductor must be zero. So the inner surface must have charge -q to cancel the +q at the center.",
  },
  {
    id: 'p1_t9_ve1',
    topic: "Applications of Gauss's Law",
    bloomLevel: 'Evaluate',
    difficulty: 'Easy',
    question: "Gauss's law is most useful for calculating the field of:",
    options: [
      'A uniformly charged infinite plane sheet',
      'A randomly shaped charged object',
      'A dipole at close range',
      'Two point charges at arbitrary positions',
    ],
    correctIndex: 0,
    explanation:
      "Gauss's law is most useful for symmetric distributions like infinite planes, infinite lines, and spheres, where the field can be taken out of the integral.",
  },
  {
    id: 'p1_t9_vm1',
    topic: "Applications of Gauss's Law",
    bloomLevel: 'Evaluate',
    difficulty: 'Medium',
    question:
      'A student claims that the field of a conducting sphere and a non-conducting sphere with the same charge are identical everywhere. Which evaluation is correct?',
    options: [
      'The student is wrong; inside the conducting sphere E = 0, but inside the non-conducting sphere E ≠ 0',
      'The student is correct; the fields are identical everywhere',
      'The student is partially correct; the fields are identical only outside',
      'The student is correct; both have zero field inside',
    ],
    correctIndex: 0,
    explanation:
      'For a conducting sphere, E = 0 inside (charge on surface). For a non-conducting sphere with uniform volume charge, E ≠ 0 inside. Outside, both have E = kQ/r².',
  },
  {
    id: 'p1_t9_vh1',
    topic: "Applications of Gauss's Law",
    bloomLevel: 'Evaluate',
    difficulty: 'Hard',
    question:
      'Compare the electric field of an infinite line charge and a finite line charge at a point far from both. Which statement is most accurate?',
    options: [
      'The infinite line field is E = λ/(2πε₀r), while the finite line field approaches kQ/r² at very large distances',
      'Both fields are identical at all distances',
      'The finite line field is always stronger',
      'The infinite line field is always zero',
    ],
    correctIndex: 0,
    explanation:
      'An infinite line has E ∝ 1/r. A finite line of total charge Q behaves like a point charge at very large distances, with E ∝ 1/r².',
  },
  {
    id: 'p1_t10_ue1',
    topic: 'Electrostatic Shielding & Equilibrium',
    bloomLevel: 'Understand',
    difficulty: 'Easy',
    question: 'Electrostatic shielding is the phenomenon where:',
    options: [
      'A conducting enclosure blocks external electric fields from reaching its interior',
      'A conducting enclosure amplifies external electric fields',
      'An insulator blocks all electric fields',
      'A magnet blocks electric fields',
    ],
    correctIndex: 0,
    explanation:
      'Electrostatic shielding uses a conducting enclosure to block external electric fields. The field inside the enclosure is zero.',
  },
  {
    id: 'p1_t10_um1',
    topic: 'Electrostatic Shielding & Equilibrium',
    bloomLevel: 'Understand',
    difficulty: 'Medium',
    question:
      'The electric field inside a cavity of a conductor (with no charge in the cavity) is:',
    options: [
      'Zero, regardless of the external field',
      'Equal to the external field',
      'Half the external field',
      'Depends on the shape of the cavity',
    ],
    correctIndex: 0,
    explanation:
      'The field inside a cavity of a conductor is zero regardless of the external field. This is the principle of electrostatic shielding.',
  },
  {
    id: 'p1_t10_uh1',
    topic: 'Electrostatic Shielding & Equilibrium',
    bloomLevel: 'Understand',
    difficulty: 'Hard',
    question: 'A lightning conductor works on the principle that:',
    options: [
      'Charge concentrates at sharp points, allowing controlled discharge',
      'Charge spreads uniformly on flat surfaces',
      'Conductors repel lightning',
      'Insulators attract lightning',
    ],
    correctIndex: 0,
    explanation:
      'Lightning conductors have sharp tips where charge density is highest. This allows the charge to leak into the air gradually, preventing a sudden discharge.',
  },
  {
    id: 'p1_t10_ae1',
    topic: 'Electrostatic Shielding & Equilibrium',
    bloomLevel: 'Apply',
    difficulty: 'Easy',
    question:
      'A sensitive electronic device is placed inside a metal box. The device is protected from external electric fields because:',
    options: [
      'The metal box acts as an electrostatic shield',
      'The metal box absorbs all electric charges',
      'The metal box reflects all electric fields',
      'The device is grounded',
    ],
    correctIndex: 0,
    explanation:
      "The metal box acts as an electrostatic shield. The external field induces charges on the box's surface, and the field inside the box is zero.",
  },
  {
    id: 'p1_t10_am1',
    topic: 'Electrostatic Shielding & Equilibrium',
    bloomLevel: 'Apply',
    difficulty: 'Medium',
    question:
      'A charge +Q is placed inside a hollow conductor. The charge on the outer surface of the conductor is:',
    options: ['+Q', '-Q', '0', '+Q/2'],
    correctIndex: 0,
    explanation:
      'The inner surface has -Q (to cancel the field in the conductor). By charge conservation, the outer surface has +Q.',
  },
  {
    id: 'p1_t10_ah1',
    topic: 'Electrostatic Shielding & Equilibrium',
    bloomLevel: 'Apply',
    difficulty: 'Hard',
    question:
      'Three charges +q, +q, and -q are placed at the vertices of an equilateral triangle. The equilibrium of the system is:',
    options: [
      'Unstable, as the charges will move unless constrained',
      'Stable, as the forces balance',
      'Neutral, as the net force is zero',
      'Stable only if the charges are equal in magnitude',
    ],
    correctIndex: 0,
    explanation:
      'The charges experience net forces and will move unless constrained. The configuration is not in stable equilibrium.',
  },
  {
    id: 'p1_t10_ne1',
    topic: 'Electrostatic Shielding & Equilibrium',
    bloomLevel: 'Analyze',
    difficulty: 'Easy',
    question:
      'The charge on the inner surface of a hollow conductor with a charge q inside is:',
    options: ['-q', '+q', '0', '-q/2'],
    correctIndex: 0,
    explanation:
      "By Gauss's law, the net charge on the inner surface must be -q to make the field inside the conductor material zero.",
  },
  {
    id: 'p1_t10_nm1',
    topic: 'Electrostatic Shielding & Equilibrium',
    bloomLevel: 'Analyze',
    difficulty: 'Medium',
    question:
      'A charge q is placed at the center of a hollow conducting sphere. The field at a point outside the sphere is:',
    options: [
      'kq/r², as if the charge were at the center',
      'Zero',
      'kq/(2r²)',
      'Depends on the thickness of the sphere',
    ],
    correctIndex: 0,
    explanation:
      'The outer surface of the sphere has charge +q. The field outside is the same as a point charge q at the center: E = kq/r².',
  },
  {
    id: 'p1_t10_nh1',
    topic: 'Electrostatic Shielding & Equilibrium',
    bloomLevel: 'Analyze',
    difficulty: 'Hard',
    question:
      'A charge q is placed inside a hollow conductor, and an external charge Q is placed outside. The field inside the cavity (where q is) is:',
    options: [
      'Due only to q, not affected by Q',
      'Due to both q and Q',
      'Zero',
      'Due only to Q',
    ],
    correctIndex: 0,
    explanation:
      'The conducting shell shields the cavity from external charges. The field inside the cavity is due only to the charge q inside, not affected by external charges.',
  },
  {
    id: 'p1_t10_ve1',
    topic: 'Electrostatic Shielding & Equilibrium',
    bloomLevel: 'Evaluate',
    difficulty: 'Easy',
    question: 'Which statement about electrostatic equilibrium is correct?',
    options: [
      'In equilibrium, the electric field inside a conductor is zero',
      'In equilibrium, the electric field inside a conductor is maximum',
      'In equilibrium, charges move freely inside a conductor',
      'In equilibrium, the electric field is zero only at the surface',
    ],
    correctIndex: 0,
    explanation:
      'In electrostatic equilibrium, free charges in a conductor have redistributed so that the net electric field inside the conductor is zero.',
  },
  {
    id: 'p1_t10_vm1',
    topic: 'Electrostatic Shielding & Equilibrium',
    bloomLevel: 'Evaluate',
    difficulty: 'Medium',
    question:
      'A student claims that a Faraday cage only works if it is grounded. Which evaluation is correct?',
    options: [
      'The student is wrong; a Faraday cage shields its interior even when not grounded, though grounding improves safety',
      'The student is correct; grounding is essential for shielding',
      'The student is partially correct; grounding is needed only for strong fields',
      'The student is correct; without grounding, the cage amplifies fields',
    ],
    correctIndex: 0,
    explanation:
      'A Faraday cage shields its interior regardless of grounding. Grounding is important for safety and to prevent charge buildup on the cage.',
  },
  {
    id: 'p1_t10_vh1',
    topic: 'Electrostatic Shielding & Equilibrium',
    bloomLevel: 'Evaluate',
    difficulty: 'Hard',
    question:
      'Compare the shielding effectiveness of a solid metal box and a metal mesh (wire cage) with small openings. Which statement is most accurate?',
    options: [
      'Both provide shielding, but the mesh is less effective for fields with wavelengths smaller than the mesh openings',
      'Only the solid box provides any shielding',
      'Only the mesh provides shielding',
      'Neither provides any shielding',
    ],
    correctIndex: 0,
    explanation:
      'Both a solid box and a mesh cage provide electrostatic shielding. However, the mesh is less effective for high-frequency fields where the wavelength is comparable to or smaller than the mesh openings.',
  },
];
