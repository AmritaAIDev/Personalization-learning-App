import 'dotenv/config';
import AppDataSource from '../database/data-source';
import {
  Question,
  QuestionPublicationStatus,
  QuestionSource,
} from '../question.entity';

/**
 * Top-up seeder: fills the missing difficulty tiers for thin Electrostatics
 * topics so every topic has at least one (ideally two) Easy, Medium, and Hard
 * published question. With adaptive practice sizing this makes every topic
 * practice/learn-ready. Content is hand-authored, reviewed, NCERT-aligned
 * (no AI drafts); upserted by question_id, so it is idempotent and never
 * duplicates or deletes existing data.
 */

type Seed = Omit<
  Question,
  'id' | 'created_at' | 'updated_at' | 'published_at' | 'reviewed_at'
> & { published_at?: Date; reviewed_at?: Date | null };

function q(
  question_id: string,
  chapter: string,
  topic: string,
  question_text: string,
  options: string[],
  correct_answer: string,
  solution: string,
  difficulty: 'Easy' | 'Medium' | 'Hard',
  bloom_level: string,
  concept_tags: string[],
  common_errors: string[],
  marks = 4,
  estimated_time_sec = 90,
): Seed {
  return {
    question_id,
    subject: 'Physics',
    chapter,
    topic,
    subtopic: null,
    question_text,
    options,
    correct_answer,
    solution,
    bloom_level,
    difficulty,
    marks,
    estimated_time_sec,
    concept_tags,
    common_errors,
    status: QuestionPublicationStatus.PUBLISHED,
    source: QuestionSource.CURATED,
    quality_score: 90,
    created_by_user_id: null,
    reviewed_by_user_id: null,
    review_notes: null,
  };
}

const ECF = 'Electric Charges and Fields';
const EPC = 'Electrostatic Potential and Capacitance';

const SEEDS: Seed[] = [
  // Electric Field Lines (needs Medium, Hard)
  q(
    'TOPUP-EFL-M1',
    ECF,
    'Electric Field Lines',
    'Two equal positive charges are placed at a small separation. Near the midpoint between them, the electric field lines:',
    [
      'Both point toward each charge',
      'Cancel to zero everywhere',
      'Bend away from the midpoint, leaving a low-field region',
      'Run straight from one to the other',
    ],
    'Bend away from the midpoint, leaving a low-field region',
    'Field lines never cross. Near the midpoint the equal like charges produce opposing fields, so the lines are pushed outward and the field is weak there.',
    'Medium',
    'Apply',
    ['field lines', 'superposition'],
    [
      'Assuming the field is zero at every point on the perpendicular bisector.',
    ],
  ),
  q(
    'TOPUP-EFL-H1',
    ECF,
    'Electric Field Lines',
    'A closed loop of electrostatic field lines would imply that the electrostatic field is:',
    [
      'Conservative',
      'Non-conservative, which contradicts electrostatics',
      'Uniform',
      'Zero everywhere',
    ],
    'Non-conservative, which contradicts electrostatics',
    'Electrostatic field lines cannot form closed loops because the field is conservative (curl-free). A closed loop would imply nonzero work around a loop.',
    'Hard',
    'Analyze',
    ['conservative field', 'field lines'],
    [
      'Treating electric field lines like magnetic field lines, which can form closed loops.',
    ],
  ),

  // Coulomb's Law (needs Hard)
  q(
    'TOPUP-CL-H1',
    ECF,
    "Coulomb's Law",
    'Two small spheres carry charges +q and -q separated by distance d, with force F. If each charge is doubled and the separation is halved, the new force is:',
    ['F', '4F', '8F', '16F'],
    '16F',
    'F is proportional to q1*q2 / d^2. Doubling each charge gives factor 4; halving d gives factor 4; total 16F.',
    'Hard',
    'Apply',
    ["Coulomb's law", 'inverse-square'],
    ['Forgetting that halving the distance squares the factor.'],
    5,
    120,
  ),
  q(
    'TOPUP-CL-H2',
    ECF,
    "Coulomb's Law",
    'A charge Q is split into two parts q and (Q - q) placed a fixed distance apart. The force between them is maximised when:',
    ['q = Q/4', 'q = Q/3', 'q = Q/2', 'q = Q'],
    'q = Q/2',
    'Force is proportional to q(Q - q). This product is maximised at q = Q/2 (by symmetry / AM-GM).',
    'Hard',
    'Analyze',
    ["Coulomb's law", 'optimisation'],
    ['Assuming the force is maximised when one part is as large as possible.'],
    5,
  ),

  // Electric Dipole (needs Hard)
  q(
    'TOPUP-ED-H1',
    ECF,
    'Electric Dipole',
    'An electric dipole of moment p is placed in a uniform field E. The maximum torque on it is:',
    ['pE', 'pE/2', '2pE', 'zero'],
    'pE',
    'Torque is pE sin(theta); it is maximum at 90 degrees, so the maximum torque is pE.',
    'Hard',
    'Apply',
    ['dipole', 'torque'],
    ['Confusing torque with potential energy, which is minimum at 90 degrees.'],
    5,
  ),
  q(
    'TOPUP-ED-H2',
    ECF,
    'Electric Dipole',
    'A dipole placed in a uniform electric field has:',
    [
      'Net force and net torque both zero',
      'Net force zero, net torque generally nonzero',
      'Net force nonzero, net torque zero',
      'Both nonzero',
    ],
    'Net force zero, net torque generally nonzero',
    'Equal and opposite forces on the two charges cancel (net force zero) but form a couple giving a torque p cross E unless the dipole is aligned with the field.',
    'Hard',
    'Understand',
    ['dipole', 'uniform field'],
    ['Assuming a uniform field can exert a net force on a neutral dipole.'],
    5,
  ),

  // Capacitance (needs Hard)
  q(
    'TOPUP-CAP-H1',
    EPC,
    'Capacitance',
    'A parallel-plate capacitor has capacitance C. If the plate area is doubled and the separation is halved, the new capacitance is:',
    ['C', '2C', '4C', 'C/2'],
    '4C',
    'C = epsilon0 * A / d. Doubling A gives factor 2; halving d gives factor 2; total 4C.',
    'Hard',
    'Apply',
    ['capacitance', 'parallel plate'],
    ['Applying only one of the two changes.'],
    5,
  ),
  q(
    'TOPUP-CAP-H2',
    EPC,
    'Capacitance',
    'Two capacitors 3 microF and 6 microF are connected in series. The equivalent capacitance is:',
    ['9 microF', '2 microF', '4.5 microF', '18 microF'],
    '2 microF',
    '1/C = 1/3 + 1/6 = 1/2, so C = 2 microF. Series adds reciprocals, not the values themselves.',
    'Hard',
    'Apply',
    ['series capacitors', 'equivalent capacitance'],
    ['Adding series capacitances like parallel ones.'],
    5,
  ),

  // Electric Potential (needs Medium, Hard)
  q(
    'TOPUP-EP-M1',
    EPC,
    'Electric Potential',
    'The electric potential due to a point charge q at a distance r is:',
    ['kq/r', 'kq/r^2', 'kq/r^3', 'kqr'],
    'kq/r',
    'The scalar potential of a point charge is V = kq/r; it is a scalar and falls as 1/r, unlike the field which falls as 1/r^2.',
    'Medium',
    'Remember',
    ['potential', 'point charge'],
    ['Confusing potential (1/r) with field (1/r^2).'],
    4,
  ),
  q(
    'TOPUP-EP-H1',
    EPC,
    'Electric Potential',
    'A point charge +q is moved from a point at potential V1 to a point at potential V2 by the electric field. The work done by the field is:',
    ['q(V1 - V2)', 'q(V2 - V1)', 'zero', 'q V1 V2'],
    'q(V1 - V2)',
    'Work done by the field equals q times the drop in potential: W = q(V_initial - V_final) = q(V1 - V2).',
    'Hard',
    'Apply',
    ['potential', 'work'],
    [
      'Reversing the sign convention for work by the field vs work by an external agent.',
    ],
    5,
  ),

  // Capacitance basics (needs Medium, Hard)
  q(
    'TOPUP-CB-M1',
    EPC,
    'Capacitance basics',
    'The SI unit of capacitance is:',
    ['Farad', 'Coulomb', 'Volt', 'Ohm'],
    'Farad',
    'Capacitance is measured in farads (F), where 1 F = 1 C/V.',
    'Medium',
    'Remember',
    ['capacitance', 'units'],
    ['Mixing capacitance units with charge or voltage units.'],
    4,
  ),
  q(
    'TOPUP-CB-H1',
    EPC,
    'Capacitance basics',
    'A capacitor stores charge Q at voltage V. The energy stored in it is:',
    ['QV', 'QV/2', 'Q^2/(2V)', 'Both QV/2 and Q^2/(2V)'],
    'Both QV/2 and Q^2/(2V)',
    'U = QV/2 = Q^2/(2C) = C V^2 / 2. The two listed forms are equivalent since Q = CV.',
    'Hard',
    'Apply',
    ['energy', 'capacitor'],
    ['Using QV (without the 1/2) as the stored energy.'],
    5,
  ),

  // Energy Stored in a Capacitor (needs Hard)
  q(
    'TOPUP-ESC-H1',
    EPC,
    'Energy Stored in a Capacitor',
    'A 10 microF capacitor is charged to 100 V. The energy stored is:',
    ['0.05 J', '0.5 J', '5 J', '50 J'],
    '0.05 J',
    'U = C V^2 / 2 = 10e-6 * 100^2 / 2 = 0.05 J.',
    'Hard',
    'Apply',
    ['energy', 'capacitor'],
    ['Forgetting the factor of 1/2 in U = CV^2/2.'],
    5,
  ),
  q(
    'TOPUP-ESC-H2',
    EPC,
    'Energy Stored in a Capacitor',
    'If the voltage across a capacitor is doubled while its capacitance stays the same, the stored energy:',
    ['doubles', 'halves', 'quadruples', 'stays the same'],
    'quadruples',
    'U = C V^2 / 2, so with C fixed, U is proportional to V^2. Doubling V quadruples U.',
    'Hard',
    'Apply',
    ['energy', 'capacitor'],
    ['Assuming energy scales linearly with voltage.'],
    5,
  ),

  // Equipotential Surfaces (needs Hard)
  q(
    'TOPUP-ES-H1',
    EPC,
    'Equipotential Surfaces',
    'The electric field is always:',
    [
      'parallel to equipotential surfaces',
      'perpendicular to equipotential surfaces',
      'tangent to equipotential surfaces',
      'zero on equipotential surfaces',
    ],
    'perpendicular to equipotential surfaces',
    'No work is done moving a charge along an equipotential, so the field can have no tangential component there; it must be perpendicular.',
    'Hard',
    'Understand',
    ['equipotential', 'electric field'],
    ['Believing the field is parallel to equipotential surfaces.'],
    5,
  ),
  q(
    'TOPUP-ES-H2',
    EPC,
    'Equipotential Surfaces',
    'Two points on the same equipotential surface are separated by a distance d. The work needed to move a charge q from one point to the other is:',
    ['qV', 'zero', 'qd', 'qVd'],
    'zero',
    'Both points are at the same potential, so the potential difference is zero and the work W = q * deltaV is zero.',
    'Hard',
    'Apply',
    ['equipotential', 'work'],
    ['Assuming any separation implies a potential difference.'],
    5,
  ),

  // Van de Graaff Generator (needs Hard)
  q(
    'TOPUP-VG-H1',
    EPC,
    'Van de Graaff Generator',
    'A Van de Graaff generator builds a high potential on its dome because:',
    [
      'charge is carried to the dome continuously by the belt',
      'the dome stores magnetic energy',
      'it converts AC to DC inside the dome',
      'the belt acts as a resistor',
    ],
    'charge is carried to the dome continuously by the belt',
    'The belt transports charge to the dome. As a conductor, the dome stores that charge on its outer surface, accumulating it to a high potential.',
    'Hard',
    'Understand',
    ['Van de Graaff', 'electrostatics'],
    ['Confusing it with an electromagnetic induction device.'],
    5,
  ),
  q(
    'TOPUP-VG-H2',
    EPC,
    'Van de Graaff Generator',
    'The maximum potential of a Van de Graaff dome is limited mainly by:',
    [
      'the belt speed',
      'dielectric breakdown of the surrounding gas',
      'the colour of the dome',
      'the ground resistance',
    ],
    'dielectric breakdown of the surrounding gas',
    'When the field at the dome exceeds the dielectric strength of the surrounding air, corona discharge leaks charge away, capping the potential.',
    'Hard',
    'Apply',
    ['Van de Graaff', 'dielectric breakdown'],
    ['Assuming belt speed is the limiting factor.'],
    5,
  ),

  // Electric charge & field (needs Medium, Hard)
  q(
    'TOPUP-ECF-M1',
    ECF,
    'Electric charge & field',
    'Four equal positive charges +q are placed at the four corners of a square. The net electric field at the centre of the square is:',
    [
      'maximum along a diagonal',
      'zero',
      'along a side',
      'depends on the side length',
    ],
    'zero',
    'By symmetry, the fields from the four equal corner charges cancel pairwise at the centre, giving zero net field.',
    'Medium',
    'Apply',
    ['superposition', 'symmetry'],
    ['Ignoring the symmetry and thinking the fields add along a diagonal.'],
    4,
  ),
  q(
    'TOPUP-ECF-H1',
    ECF,
    'Electric charge & field',
    'A uniformly charged ring of total charge Q and radius R has, at its centre, an electric field of:',
    ['kQ/R^2', 'kQ/R', 'zero', 'kQR'],
    'zero',
    'Symmetric charge elements of the ring produce fields that cancel at the centre; only the axial field at a distance x from the centre is nonzero.',
    'Hard',
    'Apply',
    ['ring of charge', 'symmetry'],
    ['Treating the ring as a point charge at its centre.'],
    5,
  ),
];

async function main() {
  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(Question);
  let inserted = 0;
  for (const seed of SEEDS) {
    const existing = await repo.findOne({
      where: { question_id: seed.question_id },
    });
    const entity = repo.create({
      ...seed,
      id: existing?.id,
      published_at: existing?.published_at ?? new Date(),
      reviewed_at: existing?.reviewed_at ?? null,
    } as Question);
    await repo.save(entity);
    if (!existing) inserted += 1;
  }
  console.log(
    `Top-up seeder: processed ${SEEDS.length} questions (${inserted} new, ${SEEDS.length - inserted} already present).`,
  );
  await AppDataSource.destroy();
}
void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
