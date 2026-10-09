import type { AuthoredChapterMeta } from '../../catalog/chapter-meta.types';

/**
 * Hand-authored study-guide metadata for the 27 JEE chapters that
 * jee-compass has no equivalent of (its curriculum is CBSE Class 12 only;
 * ours is the full JEE Main syllabus — see docs/JEE-COMPASS-ADOPTION-PLAN.md
 * §4.4).
 *
 * The seed writes these as source `AI_DRAFT` / status `DRAFT`: they are
 * hidden from students until an admin reviews and publishes them (Phase 2
 * admin PATCH, or GenerationStudio). Never mark entries here PUBLISHED by
 * editing this file.
 *
 * Formulas are plain-text/Unicode in the same style as the compass data;
 * the frontend renders them through the existing KaTeX-safe markdown
 * component. Difficulty and study minutes are guidance, not computed data.
 */
export const AUTHORED_CHAPTER_META: readonly AuthoredChapterMeta[] = [
  // ── Physics ────────────────────────────────────────────────────────────
  {
    subject: 'Physics',
    chapter: 'Units and Measurements',
    overview:
      'Foundations of measurement: SI base and derived units, dimensional analysis, significant figures, and error propagation. Dimensional checks are a fast way to validate any formula you derive later in the course.',
    objectives: [
      'Convert between SI base and derived units confidently',
      'Apply dimensional analysis to check formulas and find relations',
      'Compute mean error, percentage error and propagate errors through products and powers',
      'Use vernier callipers and screw gauge readings, including least count and zero error',
    ],
    keyFormulas: [
      'Least count (vernier) = 1 MSD − 1 VSD',
      'Least count (screw gauge) = pitch / number of divisions',
      'Percentage error = (Δx / x) × 100%',
      'If X = M^a L^b T^c, error adds as a·(ΔM/M) + b·(ΔL/L) + c·(ΔT/T)',
    ],
    difficulty: 'Easy',
    studyMinutes: 60,
  },
  {
    subject: 'Physics',
    chapter: 'Kinematics',
    overview:
      'Description of motion without its causes: one-dimensional equations of motion, graphs of position/velocity/acceleration, relative velocity, vectors, projectile motion and uniform circular motion.',
    objectives: [
      'Choose and apply the right equation of motion for uniform acceleration',
      'Extract velocity and acceleration from position–time graphs',
      'Solve relative-velocity problems (rivers, trains, rain)',
      'Derive range, maximum height and time of flight for projectiles',
    ],
    keyFormulas: [
      'v = u + at',
      's = ut + ½at²',
      'v² = u² + 2as',
      'R = u² sin 2θ / g, H = u² sin²θ / 2g',
      'a_centripetal = v² / r',
    ],
    difficulty: 'Medium',
    studyMinutes: 100,
  },
  {
    subject: 'Physics',
    chapter: 'Laws of Motion',
    overview:
      'Newton’s three laws and their applications: free-body diagrams, tension and normal reaction, friction (static and kinetic), circular motion on level and banked roads, and impulse–momentum.',
    objectives: [
      'Draw clean free-body diagrams and write constraint equations',
      'Apply Newton’s second law to connected bodies and pulleys',
      'Distinguish limiting, kinetic and rolling friction with μₛ > μₖ',
      'Analyse circular motion on banked roads and conical pendulums',
    ],
    keyFormulas: [
      'F = dp/dt (general form of the second law)',
      'fₛ ≤ μₛN, fₖ = μₖN',
      'Impulse J = F·Δt = Δp',
      'Banking: tan θ = v² / rg (frictionless)',
      'Maximum safe speed on level road: v = √(μrg)',
    ],
    difficulty: 'Medium',
    studyMinutes: 95,
  },
  {
    subject: 'Physics',
    chapter: 'Work, Energy and Power',
    overview:
      'Work–energy theorem, conservative and non-conservative forces, potential energy curves, power, and collisions in one and two dimensions with the coefficient of restitution.',
    objectives: [
      'Compute work for variable forces as the area under F–x',
      'Apply the work–energy theorem with friction present',
      'Read stability of equilibrium from potential-energy curves',
      'Solve elastic and inelastic collisions using momentum and restitution',
    ],
    keyFormulas: [
      'W = F·d cos θ, K = ½mv², U = mgh',
      'W_net = ΔK (work–energy theorem)',
      'P = W/t = F·v',
      'e = (v₂ − v₁)/(u₁ − u₂)',
      'Elastic head-on: v₁ = ((m₁−m₂)u₁ + 2m₂u₂)/(m₁+m₂)',
    ],
    difficulty: 'Medium',
    studyMinutes: 90,
  },
  {
    subject: 'Physics',
    chapter: 'Rotational Motion',
    overview:
      'Rotation about a fixed axis: moment of inertia of standard bodies, torque, rotational form of Newton’s second law, angular momentum, and the parallel and perpendicular axis theorems.',
    objectives: [
      'Compute moment of inertia using the parallel and perpendicular axis theorems',
      'Relate torque and angular acceleration for rolling and pulley systems',
      'Apply conservation of angular momentum to spinning and merging systems',
      'Split rolling motion into translation plus rotation for energy counts',
    ],
    keyFormulas: [
      'τ = Iα, L = Iω',
      'K_rot = ½Iω²; rolling: K = ½mv² + ½Iω²',
      'Parallel axis: I = I_cm + Md²',
      'L conservation: I₁ω₁ = I₂ω₂',
      'Rolling acceleration: a = g sin θ / (1 + I/mr²)',
    ],
    difficulty: 'Hard',
    studyMinutes: 115,
  },
  {
    subject: 'Physics',
    chapter: 'Gravitation',
    overview:
      'Newton’s universal law and its consequences: variation of g with height, depth and latitude, gravitational potential and energy, planetary orbits, Kepler’s laws, escape and orbital velocities, and satellites.',
    objectives: [
      'Apply the inverse-square law inside and outside spherical bodies',
      'Derive g at height/depth and explain latitude effects',
      'Use energy methods for orbits, escape velocity and satellite periods',
      'State and apply Kepler’s three laws',
    ],
    keyFormulas: [
      'F = Gm₁m₂ / r²',
      'g_h = g(1 − 2h/R) for h ≪ R; g_d = g(1 − d/R)',
      'v_orbit = √(GM/r); v_escape = √(2GM/R) = √2 · v_orbit',
      'U = −GMm / r; total orbit energy E = −GMm / 2r',
      'Kepler III: T² ∝ r³',
    ],
    difficulty: 'Medium',
    studyMinutes: 95,
  },
  {
    subject: 'Physics',
    chapter: 'Properties of Solids and Liquids',
    overview:
      'Elasticity (stress, strain, Young’s modulus), hydraulic pressure, Pascal’s and Archimedes’ principles, surface tension and capillarity, viscosity with Stokes’ law, and Bernoulli’s equation with its applications.',
    objectives: [
      'Solve series/parallel wire problems with Young’s modulus',
      'Apply pressure hydrostatics, buoyancy and floatation conditions',
      'Relate surface tension to excess pressure and capillary rise',
      'Use the equation of continuity and Bernoulli for flow problems',
    ],
    keyFormulas: [
      'Y = (F/A)/(ΔL/L); elastic energy density = ½ × stress × strain',
      'P = P₀ + ρgh; upthrust = weight of displaced fluid',
      'Capillary rise: h = 2T cos θ / (rρg)',
      'Stokes’ drag: F = 6πηrv',
      'Bernoulli: P + ½ρv² + ρgh = constant',
    ],
    difficulty: 'Medium',
    studyMinutes: 105,
  },
  {
    subject: 'Physics',
    chapter: 'Thermodynamics',
    overview:
      'First law applied to isothermal, adiabatic, isobaric and isochoric processes, work from P–V diagrams, specific heat relations, second law, heat engines and refrigerators, Carnot cycle.',
    objectives: [
      'Track ΔU, Q and W through each standard process',
      'Read work as area on P–V diagrams for cycles',
      'Derive γ − 1 = R/Cᵥ (Mayer’s relation) and use adiabatic laws',
      'Compute maximum efficiency with the Carnot cycle',
    ],
    keyFormulas: [
      'ΔQ = ΔU + ΔW (first law)',
      'Isothermal W = nRT ln(V₂/V₁); adiabatic PV^γ = const',
      'W_adiabatic = nR(T₁ − T₂)/(γ − 1)',
      'η_Carnot = 1 − T_cold / T_hot',
      'Cₚ − Cᵥ = R',
    ],
    difficulty: 'Medium',
    studyMinutes: 95,
  },
  {
    subject: 'Physics',
    chapter: 'Kinetic Theory of Gases',
    overview:
      'Microscopic picture of pressure from molecular collisions, the ideal gas equation in kinetic form, molecular speeds (rms, average, most probable), degrees of freedom and equipartition, mean free path.',
    objectives: [
      'Derive pressure from momentum transfer of molecules',
      'Relate temperature to mean translational kinetic energy',
      'Compare rms, mean and most-probable speeds',
      'Apply equipartition to molar heat capacities (Cᵥ = fR/2)',
    ],
    keyFormulas: [
      'PV = ⅓Nm v_rms²; v_rms = √(3RT/M)',
      'Mean KE per molecule = (3/2)kT',
      'v_rms : v_avg : v_mp = √3 : √(8/π) : √2',
      'Cᵥ = fR/2, γ = 1 + 2/f',
      'Mean free path λ = 1 / (√2 π d² n)',
    ],
    difficulty: 'Easy',
    studyMinutes: 70,
  },
  {
    subject: 'Physics',
    chapter: 'Oscillations',
    overview:
      'Simple harmonic motion from force and energy viewpoints, the reference circle, spring combinations, simple and compound pendulums, damped and forced oscillations, and resonance.',
    objectives: [
      'Identify SHM from a = −ω²x and write x(t) with phase',
      'Exchange energy between kinetic and potential in SHM',
      'Handle series/parallel springs and effective k',
      'Explain damping curves, forced oscillation and resonance',
    ],
    keyFormulas: [
      'x = A sin(ωt + φ), a = −ω²x, ω = 2π/T',
      'Spring: T = 2π√(m/k); simple pendulum: T = 2π√(L/g)',
      'E = ½kA² = ½mv² + ½kx²',
      'Energy of damped SHM decays as A² = A₀² e^(−bt/m)',
    ],
    difficulty: 'Medium',
    studyMinutes: 90,
  },
  {
    subject: 'Physics',
    chapter: 'Waves',
    overview:
      'Travelling and standing waves, the wave equation, superposition, beats, harmonics in strings and organ pipes, and the Doppler effect for sound including wind and reflection cases.',
    objectives: [
      'Write travelling-wave expressions y(x,t) and read off λ, f, v',
      'Construct standing waves and locate nodes/antinodes',
      'Derive string and pipe harmonics, open vs closed',
      'Solve beat-frequency and Doppler-shift problems',
    ],
    keyFormulas: [
      'v = fλ; string speed v = √(T/μ)',
      'Standing wave: y = 2A sin kx cos ωt',
      'Pipe closed end: f_n = (2n−1)v/4L; open: f_n = nv/2L',
      'Beats: f_beat = |f₁ − f₂|',
      'Doppler: f′ = f (v ± v_o)/(v ∓ v_s)',
    ],
    difficulty: 'Medium',
    studyMinutes: 95,
  },
  // ── Chemistry ──────────────────────────────────────────────────────────
  {
    subject: 'Chemistry',
    chapter: 'Some Basic Concepts of Chemistry',
    overview:
      'The mole as the chemist’s counting unit: significant figures, the laws of chemical combination, stoichiometry, limiting reagents, and expressing concentration (molarity, molality, mole fraction).',
    objectives: [
      'Convert between mass, moles and particles without slips',
      'Balance equations and do stoichiometric yield calculations',
      'Spot the limiting reagent and compute product amounts',
      'Interconvert molarity, molality and mole fraction',
    ],
    keyFormulas: [
      'n = mass / molar mass; N = n × 6.022×10²³',
      'Molarity M = mol solute / L solution; Molality m = mol / kg solvent',
      'Mole fraction x_A = n_A / n_total',
      '% yield = actual / theoretical × 100',
      'Dilution: M₁V₁ = M₂V₂',
    ],
    difficulty: 'Easy',
    studyMinutes: 75,
  },
  {
    subject: 'Chemistry',
    chapter: 'Structure of Atom',
    overview:
      'From Bohr’s planetary model to quantum mechanics: spectral lines of hydrogen, dual behaviour of matter, Heisenberg’s principle, quantum numbers, orbital shapes, and electronic configurations with Hund, Aufbau and Pauli.',
    objectives: [
      'Compute hydrogen transition energies and wavelengths',
      'Apply de Broglie and Heisenberg relations numerically',
      'Assign the four quantum numbers to any electron',
      'Write ground-state configurations up to Z = 36 with exceptions',
    ],
    keyFormulas: [
      'Eₙ = −13.6 Z²/n² eV for hydrogen-like ions',
      '1/λ = R_H (1/n₁² − 1/n₂²), R_H = 1.097×10⁷ m⁻¹',
      'λ_dB = h / mv',
      'Δx · Δp ≥ h / 4π',
      'Kepler-like: mvr = nh / 2π (Bohr quantisation)',
    ],
    difficulty: 'Medium',
    studyMinutes: 90,
  },
  {
    subject: 'Chemistry',
    chapter: 'States of Matter',
    overview:
      'Gas laws and the ideal gas equation, how real gases deviate and why (van der Waals correction, compressibility factor), kinetic-molecular interpretation of temperature, and the behaviour of liquids (vapour pressure, surface tension, viscosity).',
    objectives: [
      'Combine Boyle, Charles and Gay-Lussac into PV = nRT problems',
      'Use partial pressures and Dalton’s law with collection over water',
      'Explain deviations from ideality with Z and van der Waals constants',
      'Relate Graham’s law rates to molar masses',
    ],
    keyFormulas: [
      'PV = nRT; combined law P₁V₁/T₁ = P₂V₂/T₂',
      '(P + an²/V²)(V − nb) = nRT',
      'Z = PV/nRT (Z = 1 ideal)',
      'P_total = ΣP_i (Dalton); P_i = x_i P_total (Raoult)',
      'Graham: r₁/r₂ = √(M₂/M₁)',
    ],
    difficulty: 'Medium',
    studyMinutes: 85,
  },
  {
    subject: 'Chemistry',
    chapter: 'Chemical Thermodynamics',
    overview:
      'Energy changes in reactions: internal energy and enthalpy, work of expansion, calorimetry, Hess’s law and formation enthalpies, entropy as disorder, and Gibbs energy as the test of spontaneity.',
    objectives: [
      'Distinguish state vs path functions and ΔU vs ΔH',
      'Calculate expansion work for reversible and irreversible paths',
      'Apply Hess’s law with formation and combustion data',
      'Predict spontaneity and equilibrium temperature from ΔG = ΔH − TΔS',
    ],
    keyFormulas: [
      'ΔH = ΔU + Δn_g RT',
      'w = −P_ext ΔV; reversible: w = −nRT ln(V₂/V₁)',
      'q = mcΔT (calorimetry)',
      'ΔG° = −RT ln K',
      'ΔS_univ > 0 ⇔ spontaneous (second law)',
    ],
    difficulty: 'Medium',
    studyMinutes: 95,
  },
  {
    subject: 'Chemistry',
    chapter: 'Equilibrium',
    overview:
      'Dynamic equilibrium in reversible reactions; Kc vs Kp and reaction quotient; Le Chatelier’s response to pressure, temperature and concentration; ionic equilibrium with acid–base theories, pH, buffers, hydrolysis and solubility products.',
    objectives: [
      'Set up ICE tables and solve Kc problems with approximations',
      'Convert Kc ↔ Kp and predict direction via Q vs K',
      'Apply Le Chatelier to industrial processes (Haber, Ostwald)',
      'Compute pH, Ka/Kb, buffer pH and salt-hydrolysis effects',
      'Use Ksp to decide precipitation and solubility order',
    ],
    keyFormulas: [
      'Kp = Kc (RT)^Δn',
      'pH = −log[H⁺]; pKw = pH + pOH = 14 at 298 K',
      'Ostwald dilution law: K_a = Cα² for weak acids',
      'Henderson–Hasselbalch: pH = pK_a + log([A⁻]/[HA])',
      'Hydrolysis: pH = 7 + ½(pK_a + log C) for salt of WA + SB',
    ],
    difficulty: 'Hard',
    studyMinutes: 110,
  },
  {
    subject: 'Chemistry',
    chapter: 'Redox Reactions',
    overview:
      'Oxidation numbers as electron bookkeeping, identifying oxidising and reducing agents, balancing redox equations by the ion–electron method in acidic and basic media, and displacement reactions with equivalent concepts.',
    objectives: [
      'Assign oxidation numbers reliably, including unusual cases',
      'Classify reactions as redox vs non-redox',
      'Balance full redox equations in acid and in base',
      'Use n-factor and equivalents in titration arithmetic',
    ],
    keyFormulas: [
      'Oxidation = loss of e⁻; reduction = gain of e⁻ (GER / OIL)',
      'n-factor = electrons gained or lost per formula unit',
      'Equivalent weight = molar mass / n-factor',
      'At equivalence: N₁V₁ = N₂V₂ (normality titration)',
    ],
    difficulty: 'Medium',
    studyMinutes: 75,
  },
  {
    subject: 'Chemistry',
    chapter: 'Classification of Elements',
    overview:
      'The modern periodic law and long-form table; s, p, d, f blocks; periodic trends in atomic and ionic radii, ionisation enthalpy, electron gain enthalpy and electronegativity; and the anomalies that JEE loves to test.',
    objectives: [
      'Place any element from its configuration into period, group, block',
      'Explain every trend and its exceptions across/in a group',
      'Rationalise IE anomalies (Be vs B, N vs O) with configuration',
      'Compare radii of isoelectronic species and screening effects',
    ],
    keyFormulas: [
      'Effective nuclear charge: Z_eff = Z − σ (shielding)',
      'Radius order (isoelectronic): larger Z ⇒ smaller radius',
      'IE₁ < IE₂ < IE₃ always',
      'Electronegativity order across period: increases left → right',
    ],
    difficulty: 'Easy',
    studyMinutes: 70,
  },
  {
    subject: 'Chemistry',
    chapter: 'Chemical Bonding and Molecular Structure',
    overview:
      'Why atoms bond: ionic vs covalent formation, Lewis structures and octet defects, VSEPR geometry, valence bond theory with hybridisation, molecular orbital theory with bond order and magnetism, hydrogen bonding and dipole moments.',
    objectives: [
      'Draw Lewis structures including expanded octets and formal charge',
      'Predict shape and bond angle with VSEPR for ABₓE_y',
      'Assign hybridisation from steric number',
      'Fill MO diagrams and compute bond order and magnetic behaviour',
      'Relate polarity (μ = q × d) to molecular geometry',
    ],
    keyFormulas: [
      'Formal charge = V − L − B/2',
      'Steric number = σ bonds + lone pairs ⇒ hybridisation',
      'Bond order = (N_bonding − N_antibonding) / 2',
      'VSEPR angles: 109.5° (sp³), 120° (sp²), 180° (sp); lp compresses',
      'μ = q × 2a (1 D = 3.336×10⁻³⁰ C·m)',
    ],
    difficulty: 'Hard',
    studyMinutes: 110,
  },
  {
    subject: 'Chemistry',
    chapter: 'Basic Principles of Organic Chemistry',
    overview:
      'How organic molecules behave: IUPAC naming, structural and stereochemical isomerism, electronic effects (inductive, resonance, hyperconjugation, electromeric), bond cleavage, reactive intermediates, and purity/quantification techniques.',
    objectives: [
      'Name any compound correctly in IUPAC form',
      'Rank carbocation/carbanion/radical stability using effects',
      'Predict acidities and basicities from conjugate-base stability',
      'Count stereoisomers with symmetry and identify isomer pairs',
      'Use Lassaigne’s test, Duma/Kjeldahl and index of hydrogen deficiency',
    ],
    keyFormulas: [
      'Index of hydrogen deficiency = (2C + 2 − H ± N… )/2',
      'Carbocation stability: 3° > 2° > 1° > CH₃⁺ (hyperconjugation)',
      'Resonance donors (+M): –OH, –OR, –NH₂; withdrawers (−M): –NO₂, –CHO',
      '% element from combustion data (C from CO₂, H from H₂O)',
    ],
    difficulty: 'Hard',
    studyMinutes: 115,
  },
  {
    subject: 'Chemistry',
    chapter: 'Hydrocarbons',
    overview:
      'Alkanes, alkenes, alkynes and aromatic hydrocarbons: preparation, physical properties, combustion, free-radical halogenation, electrophilic addition with Markovnikov/anti-Markovnikov regiochemistry, ozonolysis, acidity of alkynes, and electrophilic substitution on benzene with directing effects.',
    objectives: [
      'Choose reagents for each standard preparation route',
      'Predict addition products with peroxide and rearrangement effects',
      'Work backwards from ozonolysis fragments to the alkene',
      'Rank aromatic reactivity and direct incoming electrophiles',
    ],
    keyFormulas: [
      'Markovnikov: H adds to the carbon with more H; peroxide ⇒ anti-Markovnikov (HBr only)',
      'Wurtz: 2R–X + 2Na → R–R; decarboxylation: RCOONa + NaOH/CaO → RH',
      'Ozonolysis cleaves C=C to C=O fragments (reductive work-up)',
      'Acidity: HC≡CH > H₂C=CH₂ > CH₃CH₃ (sp > sp² > sp³)',
      'Benzene + Br₂/FeBr₃ → bromobenzene (EAS, not addition)',
    ],
    difficulty: 'Medium',
    studyMinutes: 100,
  },
  // ── Mathematics ────────────────────────────────────────────────────────
  {
    subject: 'Mathematics',
    chapter: 'Complex Numbers and Quadratic Equations',
    overview:
      'The complex plane: algebra of i, modulus–argument (polar) form, De Moivre’s theorem and roots of unity, geometry with complex numbers, plus quadratic equations — discriminant, nature and transformation of roots.',
    objectives: [
      'Convert between rectangular and polar forms of z',
      'Apply De Moivre to powers and nth roots, and sketch root polygons',
      'Interpret loci |z−z₁| = |z−z₂| geometrically',
      'Use discriminant and Vieta to analyse and construct quadratics',
    ],
    keyFormulas: [
      'i² = −1; z = a + ib = r(cos θ + i sin θ), r = √(a² + b²)',
      'e^{iθ} = cos θ + i sin θ; zⁿ = rⁿ cis nθ (De Moivre)',
      'Sum/product of roots: α + β = −b/a, αβ = c/a',
      'Discriminant D = b² − 4ac determines nature of roots',
      'Roots of unity: zⁿ = 1 ⇒ |z| = 1, sum of all roots = 0',
    ],
    difficulty: 'Medium',
    studyMinutes: 100,
  },
  {
    subject: 'Mathematics',
    chapter: 'Permutations and Combinations',
    overview:
      'Counting without listing: the fundamental principle, arrangements vs selections, factorials with restrictions, identical objects, circular arrangements, distribution principles, and derangements.',
    objectives: [
      'Decide correctly between addition and multiplication principles',
      'Arrange with constraints (together, apart, repeated letters)',
      'Handle circular and mirror-symmetric arrangements',
      'Apply nCr symmetry and the division principle to selections',
    ],
    keyFormulas: [
      'ⁿPᵣ = n!/(n−r)!; ⁿCᵣ = n!/(r!(n−r)!)',
      'ⁿCᵣ = ⁿC_{n−r}; ⁿCᵣ + ⁿC_{r−1} = ⁿ⁺¹Cᵣ',
      'Circular permutations of n distinct: (n−1)!',
      'Identical items: n!/(p!q!…)',
      'Derangements: Dₙ = n! Σ (−1)ᵏ/k!',
    ],
    difficulty: 'Medium',
    studyMinutes: 85,
  },
  {
    subject: 'Mathematics',
    chapter: 'Binomial Theorem',
    overview:
      'Expanding powers of a sum: general and middle terms, symmetry and identities of binomial coefficients, multi-term expansions, and the infinite binomial series for rational exponents.',
    objectives: [
      'Write any term directly with T_{r+1}',
      'Find coefficients of specific powers in products of expansions',
      'Prove and apply Σ ⁿCᵣ = 2ⁿ and alternating-sum identities',
      'Expand (1+x)ⁿ for rational n and state |x| < 1 validity',
    ],
    keyFormulas: [
      'T_{r+1} = ⁿCᵣ x^{n−r} yʳ',
      'Σ_{r=0}^{n} ⁿCᵣ = 2ⁿ; Σ(−1)ʳ ⁿCᵣ = 0',
      'ⁿC₁ + 2·ⁿC₂ + … = n·2^{n−1}',
      '(1+x)^{p/q} ≈ 1 + (p/q)x + ((p/q)(p/q−1)/2!)x², |x| < 1',
    ],
    difficulty: 'Medium',
    studyMinutes: 80,
  },
  {
    subject: 'Mathematics',
    chapter: 'Sequences and Series',
    overview:
      'Patterns with rules: arithmetic and geometric progressions, harmonic mean, arithmetico-geometric series, special sums (Σn, Σn², Σn³), and AM–GM–HM inequalities for maximisation.',
    objectives: [
      'Identify AP/GP/HP from any recurrence or three terms',
      'Sum finite and infinite GPs and mixed AGPs by subtract-and-shift',
      'Apply special-sum formulas in coordinate and calculus problems',
      'Use AM ≥ GM ≥ HM to settle max/min questions',
    ],
    keyFormulas: [
      'AP: aₙ = a + (n−1)d; Sₙ = n/2 · (2a + (n−1)d)',
      'GP: aₙ = ar^{n−1}; Sₙ = a(rⁿ − 1)/(r − 1); S_∞ = a/(1−r), |r| < 1',
      'Σk = n(n+1)/2; Σk² = n(n+1)(2n+1)/6; Σk³ = [n(n+1)/2]²',
      'AM ≥ GM ≥ HM for positive numbers',
    ],
    difficulty: 'Medium',
    studyMinutes: 90,
  },
  {
    subject: 'Mathematics',
    chapter: 'Trigonometric Functions',
    overview:
      'The unit circle done properly: ratios and identities, sign by quadrant, sum/difference and multiple-angle formulas, product-to-sum transformations, general solutions of equations, and inverse trigonometric functions with their ranges.',
    objectives: [
      'Manipulate identities fluently (Pythagorean, double, half angle)',
      'Solve trig equations with complete general solutions',
      'Graph sin/cos/tan with correct period and amplitude',
      'Apply inverse-trig principal-value rules without sign slips',
    ],
    keyFormulas: [
      'sin²θ + cos²θ = 1; sec²θ = 1 + tan²θ',
      'sin 2θ = 2 sin θ cos θ; cos 2θ = 1 − 2sin²θ',
      'General solution: sin θ = sin α ⇒ θ = nπ + (−1)ⁿα',
      'a sin θ + b cos θ = R sin(θ + φ), R = √(a² + b²)',
      'sin⁻¹x + cos⁻¹x = π/2 for |x| ≤ 1',
    ],
    difficulty: 'Medium',
    studyMinutes: 95,
  },
  {
    subject: 'Mathematics',
    chapter: 'Coordinate Geometry',
    overview:
      'Geometry with algebra: straight lines and their families, pairs of lines, circles in three forms, then the conics — parabola, ellipse and hyperbola — with tangents, chords and eccentricity as the recurring handle.',
    objectives: [
      'Switch between slope, intercept, normal and parametric line forms',
      'Find circle equations from three points or tangent conditions',
      'Use focus/directrix definitions and standard tangents of conics',
      'Compute chord lengths, eccentricity and locus problems',
    ],
    keyFormulas: [
      'Distance d = √((x₂−x₁)² + (y₂−y₁)²); slope m = (y₂−y₁)/(x₂−x₁)',
      'Circle: x² + y² + 2gx + 2fy + c = 0, centre (−g,−f), r = √(g²+f²−c)',
      'Parabola y² = 4ax: focus (a,0), tangent y = mx + a/m',
      'Ellipse x²/a² + y²/b² = 1: e = √(1 − b²/a²)',
      'Hyperbola x²/a² − y²/b² = 1: asymptotes y = ±(b/a)x, e = √(1 + b²/a²)',
    ],
    difficulty: 'Hard',
    studyMinutes: 115,
  },
];
