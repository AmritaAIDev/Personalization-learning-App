import type { ChapterSeed } from './syllabus.types';

export const CHEMISTRY_CHAPTERS: ChapterSeed[] = [
  {
    subject: 'Chemistry',
    chapter: 'Chemical Thermodynamics',
    subtopics: [
      {
        name: 'First Law and Enthalpy',
        questions: [
          {
            text: 'For the reaction N2(g) + 3H2(g) → 2NH3(g), ΔH and ΔU are related as:',
            options: [
              'ΔH = ΔU − 2RT',
              'ΔH = ΔU + 2RT',
              'ΔH = ΔU',
              'ΔH = ΔU + RT',
            ],
            answer: 'ΔH = ΔU − 2RT',
            solution: 'ΔH = ΔU + Δng RT; Δng = 2−4 = −2 so ΔH = ΔU − 2RT.',
            bloom: 'Apply',
            difficulty: 'Medium',
          },
        ],
        flashcards: [
          {
            front: 'First law of thermodynamics',
            back: 'ΔU = q + w (chemistry sign: w is work done on the system). Enthalpy H = U + PV; at constant pressure q_p = ΔH.',
          },
        ],
        concepts: [
          {
            title: 'Enthalpy vs internal energy',
            content:
              'ΔH = ΔU + Δ(PV). For ideal gases ΔH = ΔU + Δng RT. Enthalpy is the heat exchanged at constant pressure; internal energy at constant volume.',
          },
        ],
      },
      {
        name: 'Spontaneity and Gibbs Energy',
        questions: [
          {
            text: 'A process is spontaneous at constant T and P if:',
            options: ['ΔG < 0', 'ΔG > 0', 'ΔG = 0', 'ΔH < 0 always'],
            answer: 'ΔG < 0',
            solution:
              'Gibbs energy criterion: ΔG = ΔH − TΔS; negative means spontaneous, zero at equilibrium.',
            bloom: 'Remember',
            difficulty: 'Easy',
          },
        ],
        flashcards: [
          {
            front: 'Gibbs–Helmholtz and temperature dependence',
            back: 'ΔG = ΔH − TΔS. If ΔH<0 and ΔS>0, spontaneous at all T. If signs same, spontaneity flips at T = ΔH/ΔS.',
          },
        ],
        concepts: [
          {
            title: 'Entropy and second law',
            content:
              'Entropy S measures disorder; dS ≥ dq_rev/T. For a spontaneous process in an isolated system, total entropy increases. Standard molar entropies increase from solids to gases.',
          },
        ],
      },
      {
        name: 'Thermochemistry',
        questions: [
          {
            text: 'Heat of formation of an element in its standard state is:',
            options: ['zero', 'positive always', 'negative always', 'infinite'],
            answer: 'zero',
            solution:
              'By definition Δ_f H° of elements in their most stable standard state is zero; compounds have non-zero values.',
            bloom: 'Remember',
            difficulty: 'Easy',
          },
        ],
        flashcards: [
          {
            front: 'Hess’s law',
            back: 'Enthalpy change of a reaction is the same regardless of the path — it is a state function. Allows ΔH calculation via formation or combustion data.',
          },
        ],
        concepts: [
          {
            title: 'Hess’s law and Born-Haber cycle',
            content:
              'Hess: ΔH overall = sum of ΔH of steps. Born-Haber applies Hess to ionic solids: lattice enthalpy + ionisation + electron affinity + atomisation relate to formation enthalpy.',
          },
        ],
      },
    ],
  },
  {
    subject: 'Chemistry',
    chapter: 'Solutions',
    subtopics: [
      {
        name: 'Concentration Terms',
        questions: [
          {
            text: 'Which concentration term is independent of temperature?',
            options: ['molality', 'molarity', 'normality', 'formality'],
            answer: 'molality',
            solution:
              'Molality = moles solute / kg solvent (mass-based); molarity uses volume which expands with T. Molality and mole fraction are T-independent.',
            bloom: 'Understand',
            difficulty: 'Easy',
          },
        ],
        flashcards: [
          {
            front: 'Molarity vs molality vs mole fraction',
            back: 'Molarity M = mol/L solution (T-dependent). Molality m = mol/kg solvent (T-independent). Mole fraction χ = mol_i / total mol (dimensionless, T-independent). ppm = mg per kg.',
          },
        ],
        concepts: [
          {
            title: 'Expressing concentration',
            content:
              'Mass percent, volume percent, molarity, molality, mole fraction, ppm — choice depends on whether volume or mass is convenient and whether T-independence is needed.',
          },
        ],
      },
      {
        name: 'Raoult’s Law and Ideal Solutions',
        questions: [
          {
            text: 'An ideal solution is exemplified by:',
            options: [
              'benzene + toluene',
              'ethanol + water',
              'chloroform + acetone',
              'phenol + aniline',
            ],
            answer: 'benzene + toluene',
            solution:
              'Benzene and toluene have similar interactions and sizes, giving ΔH_mix≈0 and ΔV_mix≈0 and obeying Raoult’s law. The others show deviations.',
            bloom: 'Remember',
            difficulty: 'Medium',
          },
        ],
        flashcards: [
          {
            front: 'Raoult’s law',
            back: 'For a volatile component i: p_i = χ_i · p_i° where p_i° is vapour pressure of pure i. Total vapour pressure p = Σ χ_i p_i° for an ideal solution.',
          },
        ],
        concepts: [
          {
            title: 'Deviations from Raoult’s law',
            content:
              'Positive deviation: weaker A–B interactions than A–A/B–B (e.g. ethanol+water forms a minimum-boiling azeotrope). Negative deviation: stronger A–B (chloroform+acetone). Azeotropes boil without composition change.',
          },
        ],
      },
      {
        name: 'Colligative Properties',
        questions: [
          {
            text: 'Depression of freezing point is given by:',
            options: [
              'ΔTf = i·Kf·m',
              'ΔTf = Kb·m',
              'ΔTf = i·Kb·m',
              'ΔTf = Kf/m',
            ],
            answer: 'ΔTf = i·Kf·m',
            solution:
              'ΔTf = i Kf m where i is van’t Hoff factor (1 for non-electrolytes), Kf cryoscopic constant, m molality.',
            bloom: 'Remember',
            difficulty: 'Medium',
          },
        ],
        flashcards: [
          {
            front: 'Four colligative properties',
            back: '1. Relative lowering of vapour pressure, 2. Elevation of boiling point ΔTb=iKb·m, 3. Depression of freezing point, 4. Osmotic pressure π=iMRT. All depend on number of solute particles, not identity.',
          },
        ],
        concepts: [
          {
            title: 'van’t Hoff factor and osmotic pressure',
            content:
              'i = observed colligative effect / expected for non-electrolyte; i>1 for dissociation, i<1 for association. Osmotic pressure π = i M R T drives osmosis; isotonic solutions have equal π; reverse osmosis desalinates water.',
          },
        ],
      },
      {
        name: 'Henry’s Law',
        questions: [
          {
            text: 'Henry’s law states:',
            options: ['p = K_H · χ', 'p = χ / K_H', 'χ = p + K_H', 'K_H = p·χ'],
            answer: 'p = K_H · χ',
            solution:
              'Partial pressure of a gas above a solution is proportional to its mole fraction in solution: p = K_H χ. Solubility of gases increases with pressure.',
            bloom: 'Remember',
            difficulty: 'Easy',
          },
        ],
        flashcards: [
          {
            front: 'Henry’s law applications',
            back: 'Scuba: N2 dissolves under pressure → bends if depressurised too fast. Soft drinks: CO2 solubility under pressure. Altitude sickness: low O2 partial pressure.',
          },
        ],
        concepts: [
          {
            title: 'Solubility of gases',
            content:
              'Gas solubility in liquids increases with pressure and decreases with temperature. Henry’s constant increases with temperature, meaning less soluble at higher T.',
          },
        ],
      },
    ],
  },
  {
    subject: 'Chemistry',
    chapter: 'Electrochemistry',
    subtopics: [
      {
        name: 'Galvanic Cells and EMF',
        questions: [
          {
            text: 'Standard EMF of a Zn–Cu galvanic cell (E° Zn²⁺/Zn = −0.76 V, E° Cu²⁺/Cu = +0.34 V) is:',
            options: ['1.10 V', '0.42 V', '−0.42 V', '1.52 V'],
            answer: '1.10 V',
            solution:
              'E°cell = E°cathode − E°anode = 0.34 − (−0.76) = 1.10 V (Cu is cathode, Zn anode).',
            bloom: 'Apply',
            difficulty: 'Medium',
          },
        ],
        flashcards: [
          {
            front: 'Salt bridge function',
            back: 'Maintains electrical neutrality by allowing ion migration without mixing solutions; completes the circuit and prevents charge build-up.',
          },
        ],
        concepts: [
          {
            title: 'Galvanic vs electrolytic cells',
            content:
              'Galvanic: spontaneous redox produces EMF (ΔG = −nFE). Electrolytic: external voltage drives non-spontaneous reaction. E°cell > 0 → spontaneous.',
          },
        ],
      },
      {
        name: 'Nernst Equation',
        questions: [
          {
            text: 'Nernst equation for Mⁿ⁺ + n e⁻ → M at 298 K is:',
            options: [
              'E = E° − (0.0591/n) log(1/[Mⁿ⁺])',
              'E = E° + (0.0591/n) log[Mⁿ⁺]',
              'E = E° − 0.0591 log Q',
              'E = E° − (RT/nF) ln Q (all equivalent with algebra)',
            ],
            answer: 'E = E° − (0.0591/n) log(1/[Mⁿ⁺])',
            solution:
              'General Nernst: E = E° − (RT/nF) ln Q. For Mⁿ⁺/M, Q = 1/[Mⁿ⁺], so E = E° − (0.0591/n) log(1/[Mⁿ⁺]) = E° + (0.0591/n) log[Mⁿ⁺].',
            bloom: 'Remember',
            difficulty: 'Medium',
          },
        ],
        flashcards: [
          {
            front: 'Relation ΔG°, E°, K',
            back: 'ΔG° = −n F E° = −R T ln K. So E° and equilibrium constant are linked: log K = n E° / 0.0591 at 298 K.',
          },
        ],
        concepts: [
          {
            title: 'Nernst applications',
            content:
              'Nernst predicts cell potential under non-standard concentrations, pH dependence of electrode potentials, and corrosion tendencies. At equilibrium E_cell = 0 and ΔG = 0.',
          },
        ],
      },
      {
        name: 'Conductance and Kohlrausch Law',
        questions: [
          {
            text: 'Molar conductivity at infinite dilution for a strong electrolyte follows:',
            options: [
              'Λ° = λ°+ + λ°−',
              'Λ° = λ°+ − λ°−',
              'Λ° = λ°+ · λ°−',
              'Λ° = λ°+ / λ°−',
            ],
            answer: 'Λ° = λ°+ + λ°−',
            solution:
              'Kohlrausch law of independent migration: Λ° is sum of ionic contributions at infinite dilution.',
            bloom: 'Remember',
            difficulty: 'Easy',
          },
        ],
        flashcards: [
          {
            front: 'Conductance terms',
            back: 'Conductance G = 1/R (S), conductivity κ = G·l/A (S/cm), molar conductivity Λ_m = κ·1000/Molarity (S·cm²/mol). Λ_m rises with dilution.',
          },
        ],
        concepts: [
          {
            title: 'Electrolysis and Faraday laws',
            content:
              'First law: mass deposited ∝ charge (m = Z·Q). Second: masses deposited by same charge are proportional to equivalent weights. Charge to deposit 1 mol Al³⁺ as Al requires 3F ≈ 289500 C.',
          },
        ],
      },
    ],
  },
  {
    subject: 'Chemistry',
    chapter: 'Chemical Kinetics',
    subtopics: [
      {
        name: 'Rate Laws and Order',
        questions: [
          {
            text: 'For a first-order reaction, half-life is:',
            options: ['0.693/k', 'k/0.693', '1/k', 'k·0.693'],
            answer: '0.693/k',
            solution:
              't½ = ln2/k ≈ 0.693/k, independent of initial concentration for first order.',
            bloom: 'Remember',
            difficulty: 'Easy',
          },
        ],
        flashcards: [
          {
            front: 'Order vs molecularity',
            back: 'Order: experimentally determined exponent in rate law (can be fractional/zero). Molecularity: number of molecules colliding in an elementary step (positive integer, ≤3).',
          },
        ],
        concepts: [
          {
            title: 'Rate law determination',
            content:
              'Rate = k[A]^m[B]^n. Orders m,n found by varying one concentration at a time. Overall order = m+n. Units of k depend on overall order: e.g. first order s^−1, second L mol^−1 s^−1.',
          },
        ],
      },
      {
        name: 'Integrated Rate Laws',
        questions: [
          {
            text: 'For a zero-order reaction, the unit of rate constant k is:',
            options: [
              'mol L^−1 s^−1',
              's^−1',
              'L mol^−1 s^−1',
              'mol^2 L^−2 s^−1',
            ],
            answer: 'mol L^−1 s^−1',
            solution:
              'Rate = k[A]^0 = k has same units as rate: concentration/time = mol L^−1 s^−1.',
            bloom: 'Understand',
            difficulty: 'Medium',
          },
        ],
        flashcards: [
          {
            front: 'First-order integrated forms',
            back: 'ln([A]0/[A]) = kt; [A] = [A]0 e^(−kt). Plot ln[A] vs t is linear with slope −k. 99% completion takes ~6.64 half-lives.',
          },
        ],
        concepts: [
          {
            title: 'Pseudo-first-order',
            content:
              'When one reactant is in large excess (e.g. hydrolysis of ethyl acetate in water, solvent), its concentration is nearly constant and the reaction appears first-order in the other reactant.',
          },
        ],
      },
      {
        name: 'Temperature Dependence and Catalysis',
        questions: [
          {
            text: 'Arrhenius equation is:',
            options: [
              'k = A e^(−Ea/RT)',
              'k = A e^(Ea/RT)',
              'k = A·Ea/RT',
              'k = A + e^(−Ea/RT)',
            ],
            answer: 'k = A e^(−Ea/RT)',
            solution: 'k = A exp(−Ea/RT); ln k vs 1/T gives slope −Ea/R.',
            bloom: 'Remember',
            difficulty: 'Easy',
          },
        ],
        flashcards: [
          {
            front: 'Catalyst effect',
            back: 'Catalyst provides an alternative path with lower activation energy Ea, increasing rate. It does not change ΔG or equilibrium position; it is regenerated.',
          },
        ],
        concepts: [
          {
            title: 'Activation energy and Arrhenius plot',
            content:
              'Ea is the minimum energy for effective collisions. Higher T or lower Ea increases fraction of molecules with energy ≥ Ea. Arrhenius plot ln k vs 1/T is linear.',
          },
        ],
      },
    ],
  },
  {
    subject: 'Chemistry',
    chapter: 'p-Block Elements',
    subtopics: [
      {
        name: 'Group 13 and 14',
        questions: [
          {
            text: 'Inert pair effect is most prominent in:',
            options: ['thallium', 'aluminium', 'boron', 'gallium'],
            answer: 'thallium',
            solution:
              'Down the group, +1 oxidation state becomes more stable than +3 due to poor shielding by d/f electrons; Tl⁺ dominates.',
            bloom: 'Remember',
            difficulty: 'Medium',
          },
        ],
        flashcards: [
          {
            front: 'Allotropes of carbon',
            back: 'Diamond (sp³ tetrahedral, hardest), graphite (sp² layers, conductor, lubricant), fullerene C60 (truncated icosahedron), graphene (single layer).',
          },
        ],
        concepts: [
          {
            title: 'Anomalous behaviour of first element',
            content:
              'First element of each p-block group (B, C, N, O, F) differs due to small size, high electronegativity, and absence of d-orbitals — e.g. carbon forms pπ–pπ multiple bonds, silicon does not readily.',
          },
        ],
      },
      {
        name: 'Group 15 to 18',
        questions: [
          {
            text: 'Which noble gas forms the most compounds?',
            options: ['xenon', 'helium', 'neon', 'argon'],
            answer: 'xenon',
            solution:
              'Xe has the lowest ionisation enthalpy among stable noble gases and large polarizable electron cloud, forming fluorides and oxides (XeF2, XeF4, XeO3).',
            bloom: 'Remember',
            difficulty: 'Easy',
          },
        ],
        flashcards: [
          {
            front: 'Interhalogen compounds',
            back: 'Compounds between halogens: e.g. ClF, BrF3, IF7. More electronegative halogen is typically central in higher stoichiometries; shapes follow VSEPR.',
          },
        ],
        concepts: [
          {
            title: 'Trends in p-block',
            content:
              'Atomic radius increases down a group, ionisation enthalpy generally decreases, electronegativity decreases. Oxidising power of halogens decreases down the group: F2 > Cl2 > Br2 > I2.',
          },
        ],
      },
    ],
  },
  {
    subject: 'Chemistry',
    chapter: 'd- and f-Block Elements',
    subtopics: [
      {
        name: 'Transition Metals General Properties',
        questions: [
          {
            text: 'Which ion is colourless (aqueous)?',
            options: ['Cu⁺', 'Cu²⁺', 'Fe³⁺', 'Mn²⁺'],
            answer: 'Cu⁺',
            solution:
              'Cu⁺ is d¹⁰ (filled) so no d–d transitions; others have partially filled d subshells giving colour. Zn²⁺ is also colourless for same reason.',
            bloom: 'Understand',
            difficulty: 'Medium',
          },
        ],
        flashcards: [
          {
            front: 'Why transition metals are coloured and paramagnetic',
            back: 'Colour: d–d electronic transitions within split d-orbitals (crystal field). Paramagnetism: unpaired d electrons; spin-only moment μ = √(n(n+2)) BM where n is unpaired count.',
          },
        ],
        concepts: [
          {
            title: 'Variable oxidation states',
            content:
              'Transition metals show multiple oxidation states due to close ns and (n−1)d energies. Highest states with O and F (e.g. Mn +7 in KMnO4, Os +8 in OsO4). Stability varies with ligand and pH.',
          },
        ],
      },
      {
        name: 'Lanthanoids and Actinoids',
        questions: [
          {
            text: 'Lanthanoid contraction is caused by:',
            options: [
              'poor shielding by 4f electrons',
              'high nuclear charge alone',
              'strong shielding by 4f',
              'absence of d electrons',
            ],
            answer: 'poor shielding by 4f electrons',
            solution:
              '4f electrons shield poorly, so effective nuclear charge rises steadily across the series, shrinking radii.',
            bloom: 'Understand',
            difficulty: 'Medium',
          },
        ],
        flashcards: [
          {
            front: 'Consequences of lanthanoid contraction',
            back: 'Zr and Hf have nearly identical radii and chemistry; basicity of lanthanoid hydroxides decreases across the series; ionisation enthalpies do not show a regular drop.',
          },
        ],
        concepts: [
          {
            title: 'f-block placement and properties',
            content:
              'Lanthanoids (4f, Ce–Lu) and actinoids (5f, Th–Lr) placed separately. Actinoids show wider oxidation range and are mostly radioactive. f-electrons are deeply buried, so chemistry is less varied than d-block.',
          },
        ],
      },
    ],
  },
  {
    subject: 'Chemistry',
    chapter: 'Coordination Compounds',
    subtopics: [
      {
        name: 'Werner Theory and Nomenclature',
        questions: [
          {
            text: 'Oxidation state of Fe in K4[Fe(CN)6] is:',
            options: ['+2', '+3', '+4', '0'],
            answer: '+2',
            solution:
              'K is +1 (×4), CN is −1 (×6), overall −4 on complex: Fe + (−6) = −4 → Fe = +2.',
            bloom: 'Apply',
            difficulty: 'Easy',
          },
        ],
        flashcards: [
          {
            front: 'Primary vs secondary valency (Werner)',
            back: 'Primary valency = oxidation state (ionisable, satisfied by anions). Secondary valency = coordination number (non-ionisable, satisfied by ligands, directional).',
          },
        ],
        concepts: [
          {
            title: 'Coordination number and geometry',
            content:
              'CN 2: linear, 4: tetrahedral or square planar, 5: trigonal bipyramidal/square pyramidal, 6: octahedral. Geometry depends on metal, oxidation state, and ligand field strength.',
          },
        ],
      },
      {
        name: 'Isomerism and Bonding',
        questions: [
          {
            text: 'Number of geometrical isomers for [Co(NH3)4Cl2]⁺ (octahedral) is:',
            options: ['2', '3', '4', '1'],
            answer: '2',
            solution:
              'MA4B2 octahedral has cis and trans isomers (Cl adjacent vs opposite).',
            bloom: 'Apply',
            difficulty: 'Medium',
          },
        ],
        flashcards: [
          {
            front: 'Crystal field splitting',
            back: 'Octahedral: t2g (lower, 3 orbitals) and eg (higher, 2 orbitals) with Δo. Tetrahedral: e lower, t2 higher with Δt ≈ 4/9 Δo. Strong vs weak field decides pairing.',
          },
        ],
        concepts: [
          {
            title: 'Chelate effect',
            content:
              'Multidentate ligands (en, EDTA) form more stable complexes than equivalent monodentate ligands due to entropy gain (more particles released). Chelates are important in bioinorganic chemistry (haem, chlorophyll) and water softening.',
          },
        ],
      },
    ],
  },
  {
    subject: 'Chemistry',
    chapter: 'Basic Principles of Organic Chemistry',
    subtopics: [
      {
        name: 'Electronic Effects',
        questions: [
          {
            text: 'Order of stability of carbocations: (CH3)3C⁺, (CH3)2CH⁺, CH3CH2⁺, CH3⁺',
            options: [
              '(CH3)3C⁺ > (CH3)2CH⁺ > CH3CH2⁺ > CH3⁺',
              'reverse',
              'CH3⁺ most stable',
              'all equal',
            ],
            answer: '(CH3)3C⁺ > (CH3)2CH⁺ > CH3CH2⁺ > CH3⁺',
            solution:
              'More alkyl groups → greater hyperconjugation and +I effect stabilising the positive charge; tertiary most stable.',
            bloom: 'Understand',
            difficulty: 'Medium',
          },
        ],
        flashcards: [
          {
            front: 'Inductive, resonance, hyperconjugation',
            back: 'Inductive: electronegativity pull through σ bonds. Resonance/mesomeric: delocalisation via p orbitals. Hyperconjugation: σ–p overlap from alkyl groups stabilises carbocations/radicals.',
          },
        ],
        concepts: [
          {
            title: 'Electrophile vs nucleophile',
            content:
              'Electrophile: electron-deficient, attacks electron-rich sites (H⁺, Br⁺, NO2⁺, carbocations). Nucleophile: electron-rich, attacks electron-poor sites (OH⁻, CN⁻, alkenes). Most organic reactions are classified this way.',
          },
        ],
      },
      {
        name: 'Reaction Intermediates',
        questions: [
          {
            text: 'Homolytic cleavage of a covalent bond produces:',
            options: [
              'free radicals',
              'carbocations and carbanions',
              'only carbocations',
              'only carbanions',
            ],
            answer: 'free radicals',
            solution:
              'Homolytic: each atom gets one electron → radicals. Heterolytic: both electrons to one atom → ions.',
            bloom: 'Remember',
            difficulty: 'Easy',
          },
        ],
        flashcards: [
          {
            front: 'Carbocation, carbanion, radical — geometry',
            back: 'Carbocation: sp² planar, electron-deficient. Carbanion: sp³ pyramidal (often), electron-rich. Radical: sp² planar-ish, one unpaired electron.',
          },
        ],
        concepts: [
          {
            title: 'Types of organic reactions',
            content:
              'Substitution (atom/group replaced), addition (π bond broken), elimination (atoms removed to form π bond), rearrangement (skeleton reorganisation). Each can be electrophilic, nucleophilic, or radical.',
          },
        ],
      },
    ],
  },
  {
    subject: 'Chemistry',
    chapter: 'Hydrocarbons',
    subtopics: [
      {
        name: 'Alkanes',
        questions: [
          {
            text: 'Wurtz reaction: 2 CH3Cl + 2 Na (dry ether) gives:',
            options: ['C2H6', 'C3H8', 'CH4', 'C2H4'],
            answer: 'C2H6',
            solution:
              'Wurtz couples two alkyl halides: 2 R–X + 2 Na → R–R + 2 NaX. Here ethane.',
            bloom: 'Remember',
            difficulty: 'Easy',
          },
        ],
        flashcards: [
          {
            front: 'Conformations of ethane',
            back: 'Staggered (more stable, 60° dihedral) vs eclipsed (less stable, torsional strain). Energy difference ~12 kJ/mol; Newman projections visualise them.',
          },
        ],
        concepts: [
          {
            title: 'Preparation of alkanes',
            content:
              'Hydrogenation of alkenes/alkynes, Wurtz, Kolbe electrolysis, decarboxylation of sodium carboxylates with soda lime (R–COONa + NaOH → R–H + Na2CO3), reduction of alkyl halides.',
          },
        ],
      },
      {
        name: 'Alkenes and Alkynes',
        questions: [
          {
            text: 'Addition of HBr to propene (CH3–CH=CH2) in the absence of peroxide gives:',
            options: [
              '2-bromopropane',
              '1-bromopropane',
              '1,2-dibromopropane',
              '2,2-dibromopropane',
            ],
            answer: '2-bromopropane',
            solution:
              'Markovnikov: H adds to the carbon with more H, Br to the more substituted carbon. With peroxide, anti-Markovnikov (peroxide effect, radical) gives 1-bromopropane.',
            bloom: 'Apply',
            difficulty: 'Medium',
          },
        ],
        flashcards: [
          {
            front: 'Ozonolysis',
            back: 'O3 cleaves C=C; reductive work-up (Zn/H2O or Me2S) gives carbonyl compounds. Used to locate double bonds: each C of C=C becomes C=O.',
          },
        ],
        concepts: [
          {
            title: 'Electrophilic addition mechanism',
            content:
              'π bond attacks electrophile → carbocation intermediate → nucleophile adds. Regioselectivity follows carbocation stability (Markovnikov). Stereochemistry can show syn/anti addition.',
          },
        ],
      },
      {
        name: 'Aromatic Hydrocarbons',
        questions: [
          {
            text: 'Electrophile in nitration of benzene (conc. HNO3 + conc. H2SO4) is:',
            options: ['NO2⁺', 'NO3⁻', 'NO⁺', 'HNO3'],
            answer: 'NO2⁺',
            solution:
              'H2SO4 protonates HNO3 → H2O leaves generating nitronium ion NO2⁺ which attacks benzene.',
            bloom: 'Remember',
            difficulty: 'Easy',
          },
        ],
        flashcards: [
          {
            front: 'Hückel’s rule',
            back: 'Aromatic: planar, cyclic, conjugated, (4n+2) π electrons. Benzene (6π) is aromatic; cyclooctatetraene (8π) is non-aromatic (non-planar).',
          },
        ],
        concepts: [
          {
            title: 'Directing effects in EAS',
            content:
              'Activating ortho/para directors: −OH, −NH2, alkyl, −OCH3. Deactivating meta: −NO2, −COOH, −CHO. Halogens: deactivating but ortho/para directing (lone pair donation vs inductive withdrawal).',
          },
        ],
      },
    ],
  },
  {
    subject: 'Chemistry',
    chapter: 'Haloalkanes and Haloarenes',
    subtopics: [
      {
        name: 'Nucleophilic Substitution',
        questions: [
          {
            text: 'For SN1, reactivity order of alkyl halides is:',
            options: [
              '3° > 2° > 1°',
              '1° > 2° > 3°',
              '2° > 1° > 3°',
              'all equal',
            ],
            answer: '3° > 2° > 1°',
            solution:
              'SN1 rate depends on carbocation stability: tertiary most stable ionises fastest. SN2 is opposite: 1° > 2° > 3° due to steric hindrance.',
            bloom: 'Remember',
            difficulty: 'Medium',
          },
        ],
        flashcards: [
          {
            front: 'SN1 vs SN2 — key differences',
            back: 'SN1: two steps, carbocation, racemisation, favoured by stable carbocations and polar protic solvents. SN2: one step, backside attack, inversion, favoured by primary substrates and polar aprotic solvents.',
          },
        ],
        concepts: [
          {
            title: 'Factors affecting substitution',
            content:
              'Substrate structure, nucleophile strength, leaving group ability (I⁻ > Br⁻ > Cl⁻ > F⁻), solvent, and temperature all tilt the competition between SN1, SN2, E1, E2.',
          },
        ],
      },
      {
        name: 'Elimination and Organometallics',
        questions: [
          {
            text: 'Dehydrohalogenation of 2-bromobutane with alc. KOH mainly gives:',
            options: ['but-2-ene', 'but-1-ene', 'butane', 'but-2-yne'],
            answer: 'but-2-ene',
            solution:
              'Saytzeff/Zaitsev: more substituted alkene is major product. But-2-ene (disubstituted) predominates over but-1-ene (monosubstituted).',
            bloom: 'Apply',
            difficulty: 'Medium',
          },
        ],
        flashcards: [
          {
            front: 'Grignard reagent',
            back: 'R–Mg–X in dry ether from R–X + Mg. Strong base and nucleophile; reacts with water to give alkane, with carbonyls to give alcohols. Must be prepared and used under anhydrous conditions.',
          },
        ],
        concepts: [
          {
            title: 'Haloarene reactivity',
            content:
              'Aryl halides are much less reactive toward substitution than alkyl halides due to partial double-bond character from resonance and sp² carbon. Reactivity restored with strong electron-withdrawing groups ortho/para to halogen (addition-elimination).',
          },
        ],
      },
    ],
  },
  {
    subject: 'Chemistry',
    chapter: 'Alcohols, Phenols and Ethers',
    subtopics: [
      {
        name: 'Alcohols',
        questions: [
          {
            text: 'Lucas test: anhydrous ZnCl2 + conc. HCl — turbidity appears fastest with:',
            options: [
              'tertiary alcohol',
              'primary alcohol',
              'secondary alcohol',
              'all at same rate',
            ],
            answer: 'tertiary alcohol',
            solution:
              'Tertiary carbocation forms instantly → immediate turbidity (alkyl chloride). Secondary in ~5 min, primary very slowly or on heating.',
            bloom: 'Remember',
            difficulty: 'Easy',
          },
        ],
        flashcards: [
          {
            front: 'Dehydration of alcohols',
            back: 'Conc. H2SO4, heat: ethanol at 443 K → ethene (intramolecular); at 413 K with excess ethanol → diethyl ether (intermolecular). Order of ease: 3° > 2° > 1°.',
          },
        ],
        concepts: [
          {
            title: 'Preparation of alcohols',
            content:
              'Hydration of alkenes (acid-catalysed), hydroboration-oxidation (anti-Markovnikov), reduction of aldehydes/ketones/acids/esters, Grignard + carbonyl, hydrolysis of alkyl halides.',
          },
        ],
      },
      {
        name: 'Phenols',
        questions: [
          {
            text: 'Phenol is more acidic than ethanol because:',
            options: [
              'phenoxide ion is resonance-stabilised',
              'ethanol is a stronger base',
              'phenol has higher molecular weight',
              'phenol is aromatic',
            ],
            answer: 'phenoxide ion is resonance-stabilised',
            solution:
              'Phenoxide negative charge delocalises into the benzene ring; ethoxide has no such stabilisation.',
            bloom: 'Understand',
            difficulty: 'Medium',
          },
        ],
        flashcards: [
          {
            front: 'Reimer-Tiemann reaction',
            back: 'Phenol + CHCl3 + NaOH → salicylaldehyde (o-hydroxybenzaldehyde) via dichlorocarbene :CCl2. Electrophilic substitution at ortho to OH.',
          },
        ],
        concepts: [
          {
            title: 'Kolbe and other phenol reactions',
            content:
              'Kolbe: phenol + CO2 + NaOH → salicylic acid. Coupling with diazonium salts gives azo dyes. Bromination of phenol in water gives 2,4,6-tribromophenol instantly (activation by OH).',
          },
        ],
      },
      {
        name: 'Ethers',
        questions: [
          {
            text: 'Williamson ether synthesis is an example of:',
            options: ['SN2', 'SN1', 'E2', 'electrophilic addition'],
            answer: 'SN2',
            solution:
              'Alkoxide RO⁻ attacks primary alkyl halide in an SN2 step: R–O⁻ + R′–X → R–O–R′ + X⁻.',
            bloom: 'Remember',
            difficulty: 'Medium',
          },
        ],
        flashcards: [
          {
            front: 'Cleavage of ethers',
            back: 'HI or HBr cleaves ethers: R–O–R′ + HI → R–OH + R′–I (or RI + R′OH). With excess HI, both sides become alkyl iodides.',
          },
        ],
        concepts: [
          {
            title: 'Uses and properties of ethers',
            content:
              'Ethers are relatively inert, good solvents, and can form peroxides on standing. Crown ethers selectively bind alkali metal ions. Diethyl ether is volatile and was an early anaesthetic.',
          },
        ],
      },
    ],
  },
  {
    subject: 'Chemistry',
    chapter: 'Aldehydes, Ketones and Carboxylic Acids',
    subtopics: [
      {
        name: 'Aldehydes and Ketones',
        questions: [
          {
            text: 'Tollens’ reagent gives a positive test (silver mirror) with:',
            options: [
              'acetaldehyde',
              'acetone',
              'benzophenone',
              'diethyl ketone',
            ],
            answer: 'acetaldehyde',
            solution:
              'Tollens [Ag(NH3)2]⁺ oxidises aldehydes to carboxylates and deposits Ag mirror; ketones do not react (except α-hydroxy ketones).',
            bloom: 'Remember',
            difficulty: 'Easy',
          },
        ],
        flashcards: [
          {
            front: 'Nucleophilic addition to carbonyl',
            back: 'C=O is polar: C δ+, O δ−. Nucleophiles attack C. Reactivity: aldehydes > ketones (less steric hindrance, less +I). Acid catalysis protonates O to increase electrophilicity.',
          },
        ],
        concepts: [
          {
            title: 'Aldol and Cannizzaro',
            content:
              'Aldol: enolisable aldehyde/ketone with dilute base → β-hydroxy carbonyl, then dehydration to α,β-unsaturated. Cannizzaro: non-enolisable aldehyde (HCHO, PhCHO) with conc. base → disproportionation to alcohol + carboxylate.',
          },
        ],
      },
      {
        name: 'Carboxylic Acids',
        questions: [
          {
            text: 'Hell-Volhard-Zelinsky (HVZ) reaction accomplishes:',
            options: [
              'α-halogenation of carboxylic acids',
              'reduction of acids to alcohols',
              'decarboxylation',
              'esterification',
            ],
            answer: 'α-halogenation of carboxylic acids',
            solution:
              'R–CH2–COOH + X2 / P → R–CHX–COOH (α-halo acid) via enolisation involving PBr3/ P.',
            bloom: 'Remember',
            difficulty: 'Medium',
          },
        ],
        flashcards: [
          {
            front: 'Acidity of carboxylic acids',
            back: 'Carboxylate resonance stabilisation makes acids more acidic than phenols and alcohols. Electron-withdrawing groups nearby (e.g. Cl) increase acidity; donating groups decrease it.',
          },
        ],
        concepts: [
          {
            title: 'Derivatives of carboxylic acids',
            content:
              'Acid chlorides, anhydrides, esters, amides — reactivity toward nucleophilic acyl substitution follows: RCOCl > (RCO)2O > RCOOR > RCONH2. Interconversions are central in synthesis.',
          },
        ],
      },
    ],
  },
  {
    subject: 'Chemistry',
    chapter: 'Amines',
    subtopics: [
      {
        name: 'Basicity and Preparation',
        questions: [
          {
            text: 'Which is the strongest base in aqueous solution?',
            options: ['(C2H5)2NH', 'C2H5NH2', '(C2H5)3N', 'NH3'],
            answer: '(C2H5)2NH',
            solution:
              'In aqueous solution, basicity: secondary > primary > tertiary > ammonia for ethyl series due to combined inductive, solvation, and steric effects.',
            bloom: 'Remember',
            difficulty: 'Medium',
          },
        ],
        flashcards: [
          {
            front: 'Gabriel phthalimide synthesis',
            back: 'Prepares primary amines free of over-alkylation: phthalimide → N-alkylation → hydrolysis → R–NH2. Cannot make 2°/3° amines or aryl amines.',
          },
        ],
        concepts: [
          {
            title: 'Basicity trends',
            content:
              'Aliphatic amines more basic than aromatic (lone pair delocalised in aniline). Gas-phase basicity: 3° > 2° > 1° (inductive). Aqueous order scrambles due to solvation of the conjugate acid.',
          },
        ],
      },
      {
        name: 'Reactions of Amines',
        questions: [
          {
            text: 'Carbylamine (isocyanide) test is given by:',
            options: [
              'primary amine',
              'secondary amine',
              'tertiary amine',
              'all amines',
            ],
            answer: 'primary amine',
            solution:
              'Primary amine + CHCl3 + KOH (heat) → foul-smelling isocyanide R–NC. Secondary and tertiary do not give this test.',
            bloom: 'Remember',
            difficulty: 'Easy',
          },
        ],
        flashcards: [
          {
            front: 'Hinsberg test',
            back: 'Benzenesulfonyl chloride distinguishes amines: 1° gives alkali-soluble sulfonamide, 2° gives alkali-insoluble, 3° does not react.',
          },
        ],
        concepts: [
          {
            title: 'Diazonium chemistry',
            content:
              'Ar–NH2 + NaNO2/HCl at 0–5°C → Ar–N2⁺Cl⁻. Diazonium undergoes Sandmeyer (CuCN/CuCl), coupling with phenols/anilines to azo dyes, and replacement to phenols. Aliphatic diazonium is unstable.',
          },
        ],
      },
    ],
  },
  {
    subject: 'Chemistry',
    chapter: 'Biomolecules',
    subtopics: [
      {
        name: 'Carbohydrates',
        questions: [
          {
            text: 'Sucrose is a:',
            options: [
              'non-reducing sugar',
              'reducing sugar',
              'polysaccharide',
              'aldose only',
            ],
            answer: 'non-reducing sugar',
            solution:
              'Sucrose is α-D-glucose (C1) linked to β-D-fructose (C2); both anomeric carbons are involved in the glycosidic bond, so no free hemiacetal to reduce Tollens/Fehling.',
            bloom: 'Remember',
            difficulty: 'Medium',
          },
        ],
        flashcards: [
          {
            front: 'Glucose: open vs cyclic forms',
            back: 'Open chain has an aldehyde; in solution it predominantly exists as cyclic hemiacetal: α- and β-pyranose (6-membered). Mutarotation interconverts α and β.',
          },
        ],
        concepts: [
          {
            title: 'Carbohydrate classification',
            content:
              'Monosaccharides (glucose, fructose), disaccharides (sucrose, maltose, lactose), polysaccharides (starch, cellulose, glycogen). Reducing sugars have a free anomeric OH; non-reducing like sucrose do not.',
          },
        ],
      },
      {
        name: 'Proteins and Nucleic Acids',
        questions: [
          {
            text: 'The linkage between amino acids in proteins is a:',
            options: [
              'peptide bond',
              'glycosidic bond',
              'ester bond',
              'hydrogen bond',
            ],
            answer: 'peptide bond',
            solution:
              'Peptide (amide) bond: −CO−NH− formed by condensation between carboxyl of one amino acid and amino of the next.',
            bloom: 'Remember',
            difficulty: 'Easy',
          },
        ],
        flashcards: [
          {
            front: 'DNA vs RNA',
            back: 'DNA: deoxyribose, A-T and G-C pairing, double helix, stores genetic information. RNA: ribose, A-U pairing, usually single-stranded, transfers and expresses information.',
          },
        ],
        concepts: [
          {
            title: 'Amino acids and zwitterions',
            content:
              'Amino acids have both −NH2 and −COOH, existing as zwitterions ⁺H3N−CHR−COO⁻ near neutral pH. Essential vs non-essential. Isoelectric point is the pH where net charge is zero.',
          },
        ],
      },
    ],
  },
];
