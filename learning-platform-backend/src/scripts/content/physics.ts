import type { ChapterSeed } from './syllabus.types';

export const PHYSICS_CHAPTERS: ChapterSeed[] = [
  {
    subject: 'Physics',
    chapter: 'Units and Measurements',
    subtopics: [
      {
        name: 'Units and Dimensions',
        questions: [
          {
            text: 'The dimensional formula of Planck constant h is:',
            options: ['[ML^2T^-1]', '[ML^2T^-2]', '[MLT^-1]', '[ML^-1T^-1]'],
            answer: '[ML^2T^-1]',
            solution:
              'E = hν so h = E/ν has dimensions [ML^2T^-2]/[T^-1] = [ML^2T^-1].',
            bloom: 'Remember',
            difficulty: 'Medium',
          },
        ],
        flashcards: [
          {
            front: 'Dimensions of power',
            back: 'Power = work/time = [ML^2T^-2]/[T] = [ML^2T^-3]. SI unit watt (W).',
          },
        ],
        concepts: [
          {
            title: 'SI base quantities',
            content:
              'Seven SI base quantities: length (m), mass (kg), time (s), current (A), temperature (K), amount (mol), luminous intensity (cd). Every derived quantity, e.g. force [MLT^-2] or energy [ML^2T^-2], is a product of powers of these base dimensions. Dimensional analysis checks homogeneity and converts units.',
          },
        ],
      },
      {
        name: 'Dimensional Analysis',
        questions: [
          {
            text: 'If force F, length L and time T are taken as fundamental quantities, the dimensional formula of mass is:',
            options: ['[FL^-1T^2]', '[FLT^-2]', '[F^-1LT^2]', '[FL^-1T^-2]'],
            answer: '[FL^-1T^2]',
            solution: 'F = MLT^-2 so M = F L^-1 T^2, i.e. [FL^-1T^2].',
            bloom: 'Apply',
            difficulty: 'Medium',
          },
        ],
        flashcards: [
          {
            front: 'Principle of homogeneity',
            back: 'An equation is dimensionally correct only if dimensions of every term on both sides match. It can detect wrong formulas but cannot fix dimensionless constants (e.g. 1/2, π).',
          },
        ],
        concepts: [
          {
            title: 'Uses and limits of dimensional analysis',
            content:
              'Uses: (1) check correctness of relations, (2) derive relations among physical quantities, (3) convert units between systems. Limits: cannot determine dimensionless constants, cannot handle trigonometric/exponential functions directly.',
          },
        ],
      },
      {
        name: 'Errors in Measurement',
        questions: [
          {
            text: 'The period of a pendulum is measured as 2.00 s with an absolute error of 0.05 s. The percentage error is:',
            options: ['2.5%', '5%', '0.05%', '0.25%'],
            answer: '2.5%',
            solution: 'Percentage error = (ΔT/T)×100 = (0.05/2.00)×100 = 2.5%.',
            bloom: 'Apply',
            difficulty: 'Easy',
          },
        ],
        flashcards: [
          {
            front: 'Error propagation: product and power',
            back: 'If Z = A^p B^q / C^r then ΔZ/Z = p·ΔA/A + q·ΔB/B + r·ΔC/C (absolute fractional errors add with powers as coefficients; use maximum).',
          },
        ],
        concepts: [
          {
            title: 'Significant figures and error combination',
            content:
              'Significant figures count from the first non-zero digit. For addition/subtraction, result has decimals equal to the least precise term. For multiplication/division, result has sig figs equal to the least precise factor. Random errors reduce by averaging; systematic errors do not.',
          },
        ],
      },
      {
        name: 'Significant Figures and Instruments',
        questions: [
          {
            text: 'The number of significant figures in 0.004080 is:',
            options: ['4', '5', '3', '6'],
            answer: '4',
            solution:
              'Leading zeros are not significant; trailing zero after a non-zero digit with a decimal point is significant: 4, 0, 8, 0 → 4.',
            bloom: 'Understand',
            difficulty: 'Easy',
          },
        ],
        flashcards: [
          {
            front: 'Least count of vernier calipers',
            back: 'Least count = 1 MSD − 1 VSD = value of 1 MSD / number of vernier divisions. Common lab vernier: 1 mm / 10 = 0.1 mm = 0.01 cm.',
          },
        ],
        concepts: [
          {
            title: 'Vernier and screw gauge',
            content:
              'Vernier calipers extend precision beyond the main scale by a sliding vernier scale; screw gauge (micrometer) uses pitch and circular scale. Zero error is corrected by subtracting the zero reading (positive) or adding its magnitude (negative).',
          },
        ],
      },
    ],
  },
  {
    subject: 'Physics',
    chapter: 'Rotational Motion',
    subtopics: [
      {
        name: 'Centre of Mass',
        questions: [
          {
            text: 'Two masses 2 kg at x=0 and 3 kg at x=6 m lie on the x-axis. The centre of mass is at:',
            options: ['x = 3.6 m', 'x = 3.0 m', 'x = 2.4 m', 'x = 6.0 m'],
            answer: 'x = 3.6 m',
            solution: 'x_cm = (m1 x1 + m2 x2)/(m1+m2) = (0 + 18)/5 = 3.6 m.',
            bloom: 'Apply',
            difficulty: 'Easy',
          },
        ],
        flashcards: [
          {
            front: 'Centre of mass vs centre of gravity',
            back: 'Centre of mass depends only on mass distribution; centre of gravity depends on g-field. They coincide in a uniform gravitational field.',
          },
        ],
        concepts: [
          {
            title: 'Centre of mass of a system',
            content:
              'For discrete masses r_cm = Σ m_i r_i / Σ m_i. For continuous bodies, replace sum by integral. Internal forces cannot shift the centre of mass; external forces govern its motion via F_ext = M_total · a_cm.',
          },
        ],
      },
      {
        name: 'Moment of Inertia',
        questions: [
          {
            text: 'Moment of inertia of a uniform thin rod of mass M and length L about an axis through its centre and perpendicular to its length is:',
            options: ['ML^2/12', 'ML^2/3', 'ML^2/2', '2ML^2/5'],
            answer: 'ML^2/12',
            solution:
              'Standard result: I_cm = ML^2/12; about an end it is ML^2/3 by parallel-axis theorem.',
            bloom: 'Remember',
            difficulty: 'Easy',
          },
        ],
        flashcards: [
          {
            front: 'Parallel and perpendicular axis theorems',
            back: 'Parallel: I = I_cm + M d^2. Perpendicular (planar lamina): I_z = I_x + I_y where x,y lie in the plane and z is perpendicular through the intersection.',
          },
        ],
        concepts: [
          {
            title: 'Moments of inertia — standard bodies',
            content:
              'Ring about central axis: MR^2. Disc about central axis: MR^2/2. Solid sphere about diameter: 2MR^2/5. Hollow sphere: 2MR^2/3. Rod about end: ML^2/3. These assume uniform mass.',
          },
        ],
      },
      {
        name: 'Torque and Angular Momentum',
        questions: [
          {
            text: 'A skater spinning with I = 4 kg·m² at 2 rad/s pulls arms in so I becomes 2 kg·m². New angular speed (no external torque) is:',
            options: ['4 rad/s', '2 rad/s', '1 rad/s', '8 rad/s'],
            answer: '4 rad/s',
            solution:
              'Angular momentum conserved: I1 ω1 = I2 ω2 so 4·2 = 2·ω2 → ω2 = 4 rad/s.',
            bloom: 'Apply',
            difficulty: 'Medium',
          },
        ],
        flashcards: [
          {
            front: 'Torque — rotational analogue',
            back: 'τ = r × F, magnitude rF sinθ. Rotational dynamics: τ = I α and τ = dL/dt where L = Iω is angular momentum.',
          },
        ],
        concepts: [
          {
            title: 'Angular momentum conservation',
            content:
              'If net external torque about an axis is zero, L about that axis is conserved. Internal redistribution of mass changes I and thus ω, as in a skater or a collapsing star.',
          },
        ],
      },
      {
        name: 'Rolling Motion',
        questions: [
          {
            text: 'Condition for rolling without slipping on a fixed surface is:',
            options: ['v_cm = ωR', 'v_cm = ω/R', 'a_cm = ωR', 'v_cm = 2ωR'],
            answer: 'v_cm = ωR',
            solution:
              'No-slip: the contact point is instantaneously at rest, so translational speed equals tangential speed ωR.',
            bloom: 'Understand',
            difficulty: 'Easy',
          },
        ],
        flashcards: [
          {
            front: 'Kinetic energy of rolling',
            back: 'KE = (1/2) M v_cm^2 + (1/2) I_cm ω^2. For rolling without slipping, ω = v_cm / R so KE depends on the shape factor I_cm/(MR^2).',
          },
        ],
        concepts: [
          {
            title: 'Rolling down an incline',
            content:
              'Acceleration down incline angle θ: a = g sinθ / (1 + I_cm/(M R^2)). For solid sphere I=2/5 MR^2 → a = 5g sinθ/7; for ring I=MR^2 → a = g sinθ/2 (slowest).',
          },
        ],
      },
    ],
  },
  {
    subject: 'Physics',
    chapter: 'Properties of Solids and Liquids',
    subtopics: [
      {
        name: 'Elasticity',
        questions: [
          {
            text: 'Within the elastic limit, the ratio of longitudinal stress to longitudinal strain is called:',
            options: [
              "Young's modulus",
              'Bulk modulus',
              'Shear modulus',
              'Poisson ratio',
            ],
            answer: "Young's modulus",
            solution:
              'Y = stress/strain = (F/A)/(ΔL/L) for longitudinal deformation.',
            bloom: 'Remember',
            difficulty: 'Easy',
          },
        ],
        flashcards: [
          {
            front: 'Hooke’s law and moduli',
            back: 'Hooke: stress ∝ strain within elastic limit. Y (longitudinal), B = −V ΔP/ΔV (bulk), η or G = shear stress / shear strain, Poisson ratio ν = −(lateral strain)/(longitudinal strain).',
          },
        ],
        concepts: [
          {
            title: 'Stress–strain behaviour',
            content:
              'Proportional limit → elastic limit → yield point → plastic region → ultimate strength → fracture. Energy stored per unit volume = (1/2)·stress·strain = (1/2) Y·(strain)^2 within elastic region.',
          },
        ],
      },
      {
        name: 'Pressure and Buoyancy',
        questions: [
          {
            text: 'A body of volume 0.01 m³ is fully submerged in water (ρ=1000 kg/m³). Taking g=10 m/s², the buoyant force is:',
            options: ['100 N', '10 N', '1000 N', '1 N'],
            answer: '100 N',
            solution:
              'Buoyant force = weight of displaced fluid = ρ V g = 1000×0.01×10 = 100 N (Archimedes).',
            bloom: 'Apply',
            difficulty: 'Easy',
          },
        ],
        flashcards: [
          {
            front: 'Bernoulli’s principle (statement)',
            back: 'For steady, incompressible, non-viscous flow along a streamline: P + (1/2)ρv^2 + ρgh = constant. Faster flow → lower pressure.',
          },
        ],
        concepts: [
          {
            title: 'Pascal and Archimedes',
            content:
              'Pascal: pressure applied to an enclosed fluid is transmitted equally in all directions (hydraulic lift). Archimedes: buoyant force equals weight of displaced fluid; a body floats when average density ≤ fluid density.',
          },
        ],
      },
      {
        name: 'Viscosity',
        questions: [
          {
            text: 'Terminal velocity of a small sphere falling in a viscous liquid (Stokes regime) is proportional to:',
            options: ['r²', 'r', '1/r', 'r³'],
            answer: 'r²',
            solution:
              'Stokes: 6πηrv balanced against weight minus buoyancy; solving gives v_t = 2r²(ρ_s−ρ_l)g/(9η) ∝ r².',
            bloom: 'Understand',
            difficulty: 'Medium',
          },
        ],
        flashcards: [
          {
            front: 'Stokes’ law',
            back: 'Drag on a sphere at low Reynolds number: F = 6π η r v. Leads to terminal velocity and is used to measure viscosity or determine electronic charge (Millikan).',
          },
        ],
        concepts: [
          {
            title: 'Viscous flow and Reynolds number',
            content:
              'Viscosity η is the internal friction of a fluid. Poiseuille: volume flow rate ∝ r^4 ΔP/(η L) for laminar flow in a tube. Low Re → laminar; high Re → turbulent. Critical velocity marks the transition.',
          },
        ],
      },
      {
        name: 'Surface Tension',
        questions: [
          {
            text: 'Excess pressure inside a soap bubble of radius R and surface tension T is:',
            options: ['4T/R', '2T/R', 'T/R', '8T/R'],
            answer: '4T/R',
            solution:
              'A soap bubble has two liquid surfaces, so ΔP = 4T/R; a single liquid drop has 2T/R.',
            bloom: 'Remember',
            difficulty: 'Medium',
          },
        ],
        flashcards: [
          {
            front: 'Surface tension — definition',
            back: 'Force per unit length along a line on the surface, or energy per unit area. SI unit N/m = J/m². Caused by unbalanced cohesive forces at the surface.',
          },
        ],
        concepts: [
          {
            title: 'Capillary rise',
            content:
              'Capillary rise h = 2T cosθ / (r ρ g), where θ is contact angle and r tube radius. Smaller tube or lower density → higher rise. Concave meniscus (θ < 90°) rises; convex depresses.',
          },
        ],
      },
    ],
  },
  {
    subject: 'Physics',
    chapter: 'Kinetic Theory of Gases',
    subtopics: [
      {
        name: 'Ideal Gas Equation',
        questions: [
          {
            text: 'For an ideal gas, PV = nRT. The SI unit of R is:',
            options: ['J mol^-1 K^-1', 'J K^-1', 'N m^-2', 'J mol^-1'],
            answer: 'J mol^-1 K^-1',
            solution:
              'R = 8.314 J mol^-1 K^-1; Boltzmann constant k_B = R/N_A.',
            bloom: 'Remember',
            difficulty: 'Easy',
          },
        ],
        flashcards: [
          {
            front: 'Ideal gas assumptions',
            back: 'Point molecules, no intermolecular forces except elastic collisions, large number, random motion, negligible molecular volume vs container, Newtonian mechanics applies.',
          },
        ],
        concepts: [
          {
            title: 'Ideal gas law and its forms',
            content:
              'PV = nRT = Nk_B T; combined law P1V1/T1 = P2V2/T2. At STP one mole occupies 22.4 L. Deviations at high P/low T due to molecular size and attractions (van der Waals correction).',
          },
        ],
      },
      {
        name: 'Degrees of Freedom and Equipartition',
        questions: [
          {
            text: 'Degrees of freedom of a monatomic ideal gas molecule is:',
            options: ['3', '5', '6', '2'],
            answer: '3',
            solution:
              'Monatomic: 3 translational; diatomic at moderate T: 3 translational + 2 rotational = 5.',
            bloom: 'Remember',
            difficulty: 'Easy',
          },
        ],
        flashcards: [
          {
            front: 'Equipartition theorem',
            back: 'Each quadratic degree of freedom contributes (1/2) k_B T per molecule (or (1/2) RT per mole) to the average energy. Internal energy U = (f/2) nRT where f is effective degrees of freedom.',
          },
        ],
        concepts: [
          {
            title: 'Molar heat capacities',
            content:
              'C_V = (f/2) R, C_P = C_V + R, γ = C_P/C_V. Monatomic: f=3 → C_V=3R/2, γ=5/3. Diatomic (moderate T, f=5) → C_V=5R/2, γ=7/5. Vibrations add 2 per mode at high T.',
          },
        ],
      },
      {
        name: 'Molecular Speeds',
        questions: [
          {
            text: 'RMS speed of gas molecules is given by:',
            options: ['√(3RT/M)', '√(2RT/M)', '√(8RT/πM)', '3RT/M'],
            answer: '√(3RT/M)',
            solution:
              'v_rms = √(3RT/M) = √(3k_B T/m). Mean speed = √(8RT/πM); most probable = √(2RT/M).',
            bloom: 'Remember',
            difficulty: 'Medium',
          },
        ],
        flashcards: [
          {
            front: 'Three characteristic speeds',
            back: 'Most probable v_mp = √(2RT/M) < mean v̄ = √(8RT/πM) < rms v_rms = √(3RT/M). Ratio v_mp : v̄ : v_rms ≈ 1 : 1.128 : 1.224.',
          },
        ],
        concepts: [
          {
            title: 'Pressure from kinetic theory',
            content:
              'P = (1/3) ρ v_rms^2 = (1/3) (M/V) v_rms^2. Equating to nRT/V gives (1/2) m v_rms^2 = (3/2) k_B T — temperature is a measure of average translational kinetic energy.',
          },
        ],
      },
    ],
  },
  {
    subject: 'Physics',
    chapter: 'Oscillations',
    subtopics: [
      {
        name: 'Simple Harmonic Motion Basics',
        questions: [
          {
            text: 'For SHM x = A cos(ωt), the magnitude of maximum velocity is:',
            options: ['Aω', 'Aω^2', 'A/ω', 'A^2 ω'],
            answer: 'Aω',
            solution: 'v = dx/dt = −Aω sin(ωt), so v_max = Aω; a_max = Aω^2.',
            bloom: 'Remember',
            difficulty: 'Easy',
          },
        ],
        flashcards: [
          {
            front: 'SHM differential equation',
            back: 'd²x/dt² + ω² x = 0 where ω = √(k/m) for a mass-spring. Solution x = A cos(ωt+φ). The restoring force is F = −k x.',
          },
        ],
        concepts: [
          {
            title: 'Characteristics of SHM',
            content:
              'SHM is periodic motion where acceleration ∝ −displacement. Period T = 2π/ω = 2π√(m/k) for a spring. Velocity leads displacement by π/2 and acceleration is opposite to displacement.',
          },
        ],
      },
      {
        name: 'Energy in SHM',
        questions: [
          {
            text: 'In SHM with amplitude A, at displacement x = A/2 the fraction of total energy that is kinetic is:',
            options: ['3/4', '1/4', '1/2', '3/8'],
            answer: '3/4',
            solution:
              'Total E = (1/2)kA^2. PE = (1/2)k x^2 = (1/4)E at A/2, so KE = E − PE = 3E/4.',
            bloom: 'Apply',
            difficulty: 'Medium',
          },
        ],
        flashcards: [
          {
            front: 'Energy partition in SHM',
            back: 'KE = (1/2)k(A^2−x^2), PE = (1/2)k x^2, total (1/2)kA^2 constant (ignoring damping). KE is max at equilibrium, PE max at extremes.',
          },
        ],
        concepts: [
          {
            title: 'Phase and energy over a cycle',
            content:
              'Displacement and velocity are π/2 out of phase. Energy oscillates between KE and PE at twice the SHM frequency, but total mechanical energy is conserved without damping.',
          },
        ],
      },
      {
        name: 'Simple Pendulum',
        questions: [
          {
            text: 'Time period of a simple pendulum of length L in gravity g (small amplitude) is:',
            options: ['2π√(L/g)', '2π√(g/L)', '2π√(m/k)', 'π√(L/g)'],
            answer: '2π√(L/g)',
            solution:
              'For small angles, T = 2π√(L/g), independent of mass and amplitude.',
            bloom: 'Remember',
            difficulty: 'Easy',
          },
        ],
        flashcards: [
          {
            front: 'Pendulum isochronism',
            back: 'For small amplitudes T is independent of amplitude (isochronous). Effective g changes in accelerating frames: e.g. in a lift accelerating up, g_eff = g + a.',
          },
        ],
        concepts: [
          {
            title: 'Physical and torsional pendulums',
            content:
              'Physical pendulum: T = 2π√(I/(m g d)). Torsional: T = 2π√(I/κ) where κ is torsional constant. Compound pendulums exhibit the same SHM form with a different ω.',
          },
        ],
      },
    ],
  },
  {
    subject: 'Physics',
    chapter: 'Waves',
    subtopics: [
      {
        name: 'Wave Equation and Speed',
        questions: [
          {
            text: 'Speed of a transverse wave on a stretched string with tension T and linear mass density μ is:',
            options: ['√(T/μ)', '√(μ/T)', 'T/μ', 'μ/T'],
            answer: '√(T/μ)',
            solution:
              'Dimensional and force analysis gives v = √(T/μ). Heavier string or lower tension reduces speed.',
            bloom: 'Remember',
            difficulty: 'Easy',
          },
        ],
        flashcards: [
          {
            front: 'General wave relation',
            back: 'v = f λ, and ω = 2πf, k = 2π/λ, v = ω/k. Wave equation: y(x,t) = A sin(kx ∓ ωt) (− for +x propagation).',
          },
        ],
        concepts: [
          {
            title: 'Transverse vs longitudinal waves',
            content:
              'Transverse: particle vibration ⊥ propagation (string, EM waves). Longitudinal: vibration ∥ propagation (sound). Sound needs a medium; EM waves do not. In solids, both types can propagate.',
          },
        ],
      },
      {
        name: 'Superposition and Beats',
        questions: [
          {
            text: 'Two tuning forks of frequencies 512 Hz and 508 Hz sounded together produce beats with frequency:',
            options: ['4 Hz', '1020 Hz', '510 Hz', '2 Hz'],
            answer: '4 Hz',
            solution: 'Beat frequency = |f1 − f2| = |512 − 508| = 4 Hz.',
            bloom: 'Apply',
            difficulty: 'Easy',
          },
        ],
        flashcards: [
          {
            front: 'Principle of superposition',
            back: 'When waves overlap, resultant displacement is the algebraic sum of individual displacements. Leads to interference (coherent), beats (slightly different f), and standing waves (opposite directions).',
          },
        ],
        concepts: [
          {
            title: 'Interference types',
            content:
              'Constructive: path difference = nλ (in phase). Destructive: (n+½)λ. Coherent sources maintain constant phase difference; beats are periodic loud-soft variation at |f1−f2|.',
          },
        ],
      },
      {
        name: 'Standing Waves and Organ Pipes',
        questions: [
          {
            text: 'Fundamental frequency of a closed organ pipe of length L with sound speed v is:',
            options: ['v/4L', 'v/2L', 'v/L', '2v/L'],
            answer: 'v/4L',
            solution:
              'Closed pipe has node at closed end and antinode at open end: L = λ/4 for fundamental, so f = v/λ = v/4L. Open pipe fundamental is v/2L.',
            bloom: 'Remember',
            difficulty: 'Medium',
          },
        ],
        flashcards: [
          {
            front: 'Standing wave on a string fixed at both ends',
            back: 'Allowed wavelengths λ_n = 2L/n, frequencies f_n = n·v/(2L), n=1,2,3... Nodes at ends. n=1 is fundamental.',
          },
        ],
        concepts: [
          {
            title: 'Harmonics and overtones',
            content:
              'String fixed both ends: all harmonics present. Closed pipe: only odd harmonics (f, 3f, 5f...). Open pipe: all harmonics. Resonance selects the harmonic matching the driving frequency.',
          },
        ],
      },
      {
        name: 'Doppler Effect',
        questions: [
          {
            text: 'Source moving towards a stationary observer: observed frequency (vs = source speed, v = wave speed)',
            options: ['f·v/(v−vs)', 'f·v/(v+vs)', 'f·(v+vs)/v', 'f'],
            answer: 'f·v/(v−vs)',
            solution:
              'Approaching source compresses wavefronts: f_obs = f·v/(v − v_s). Receding uses v+v_s in denominator.',
            bloom: 'Remember',
            difficulty: 'Medium',
          },
        ],
        flashcards: [
          {
            front: 'Doppler for observer moving',
            back: "Observer towards source: f' = f·(v+v_o)/v. General: f' = f·(v±v_o)/(v∓v_s) with upper signs for approach.",
          },
        ],
        concepts: [
          {
            title: 'Applications of Doppler',
            content:
              'Radar speed guns, astrophysical red/blue shift, medical ultrasound. Sonic boom occurs when v_s ≥ v (Mach ≥ 1); shock wave forms.',
          },
        ],
      },
    ],
  },
  {
    subject: 'Physics',
    chapter: 'Magnetic Effects of Current and Magnetism',
    subtopics: [
      {
        name: 'Biot-Savart and Ampere Law',
        questions: [
          {
            text: 'Magnetic field at the centre of a circular loop of radius R carrying current I is:',
            options: ['μ0 I / 2R', 'μ0 I / 4πR', 'μ0 n I', 'μ0 I R /2'],
            answer: 'μ0 I / 2R',
            solution:
              'Integrating Biot-Savart around the loop gives B = μ0 I / 2R at the centre, direction by right-hand rule.',
            bloom: 'Remember',
            difficulty: 'Easy',
          },
        ],
        flashcards: [
          {
            front: 'Ampère’s circuital law',
            back: '∮ B·dl = μ0 I_enc. For a long solenoid B = μ0 n I inside (uniform) and ~0 outside; for a toroid B = μ0 N I /(2πr).',
          },
        ],
        concepts: [
          {
            title: 'Biot-Savart law',
            content:
              'dB = (μ0/4π) I dl × r̂ / r^2. Gives fields of straight wire (B = μ0 I /2πr), circular loop, and finite segments. Direction by right-hand screw rule.',
          },
        ],
      },
      {
        name: 'Force on Moving Charges',
        questions: [
          {
            text: 'A charge q moving with velocity v parallel to a uniform magnetic field B experiences a magnetic force:',
            options: ['0', 'qvB', 'qvB/2', 'qvB sin45°'],
            answer: '0',
            solution:
              'F = q v × B, magnitude qvB sinθ. Parallel means θ=0 so sinθ=0.',
            bloom: 'Understand',
            difficulty: 'Easy',
          },
        ],
        flashcards: [
          {
            front: 'Cyclotron motion',
            back: 'Charge in uniform B moves in a circle of radius r = mv/(qB) with period T = 2πm/(qB) independent of speed. Helical if v has a component along B.',
          },
        ],
        concepts: [
          {
            title: 'Lorentz force',
            content:
              'F = q(E + v × B). Electric part does work; magnetic part does no work (always ⊥ v) but changes direction. Used in velocity selector where qE = qvB.',
          },
        ],
      },
      {
        name: 'Force on Current-Carrying Conductors',
        questions: [
          {
            text: 'Force per unit length between two parallel long currents I1, I2 separated by distance r is:',
            options: [
              'μ0 I1 I2 / 2πr',
              'μ0 I1 I2 / 4πr',
              'μ0 I1 I2 r /2π',
              'μ0(I1+I2)/2πr',
            ],
            answer: 'μ0 I1 I2 / 2πr',
            solution:
              'One wire produces B = μ0 I1/2πr at the other; F/L = I2 B gives the expression. Parallel currents attract.',
            bloom: 'Remember',
            difficulty: 'Medium',
          },
        ],
        flashcards: [
          {
            front: 'Definition of ampere',
            back: 'One ampere is the current which, in two parallel wires 1 m apart in vacuum, produces a force of 2×10^-7 N per metre of length between them.',
          },
        ],
        concepts: [
          {
            title: 'Torque on a current loop',
            content:
              'τ = N I A × B, magnitude N I A B sinθ. Magnetic moment μ = N I A. Potential energy U = −μ·B. Basis of galvanometer and electric motor.',
          },
        ],
      },
      {
        name: 'Magnetism and Matter',
        questions: [
          {
            text: 'A bar magnet has a magnetic moment M. If it is cut into two equal halves along its length, each half has moment:',
            options: ['M/2', 'M', '2M', 'M/4'],
            answer: 'M/2',
            solution:
              'Pole strength halves when cut along length (area halves), length same, so M = m·2l halves to M/2.',
            bloom: 'Apply',
            difficulty: 'Medium',
          },
        ],
        flashcards: [
          {
            front: 'Earth’s magnetic elements',
            back: 'Declination (angle between geographic and magnetic north), inclination/dip (angle of field with horizontal), horizontal component B_H = B cos(dip).',
          },
        ],
        concepts: [
          {
            title: 'Magnetic properties of matter',
            content:
              'Diamagnetic: χ < 0, repelled (Cu, Bi). Paramagnetic: small χ > 0, attracted weakly (Al, O2). Ferromagnetic: large χ, domains, hysteresis, Curie temperature above which it becomes paramagnetic.',
          },
        ],
      },
    ],
  },
  {
    subject: 'Physics',
    chapter: 'Electromagnetic Induction and Alternating Currents',
    subtopics: [
      {
        name: 'Faraday and Lenz Laws',
        questions: [
          {
            text: 'Faraday law: magnitude of induced emf in a coil with N turns is:',
            options: ['N |dΦ/dt|', '|dΦ/dt|', 'NΦ', 'Φ/N'],
            answer: 'N |dΦ/dt|',
            solution:
              'emf = −N dΦ/dt; magnitude is N times the rate of change of flux through one turn.',
            bloom: 'Remember',
            difficulty: 'Easy',
          },
        ],
        flashcards: [
          {
            front: 'Lenz’s law (statement)',
            back: 'Induced current opposes the change in flux that produced it — a consequence of energy conservation. The minus sign in Faraday’s law encodes Lenz’s law.',
          },
        ],
        concepts: [
          {
            title: 'Magnetic flux and induction',
            content:
              'Flux Φ = ∫ B·dA. Changing B, area, or orientation induces emf. Eddy currents are circulating currents in bulk conductors; they cause damping and are reduced by laminations.',
          },
        ],
      },
      {
        name: 'Inductance',
        questions: [
          {
            text: 'Self-induced emf in an inductor L carrying current changing at rate di/dt is:',
            options: ['−L di/dt', 'L di/dt', '−iL', 'L/i'],
            answer: '−L di/dt',
            solution: 'emf = −L di/dt; L = NΦ/I, SI unit henry (H).',
            bloom: 'Remember',
            difficulty: 'Easy',
          },
        ],
        flashcards: [
          {
            front: 'Energy stored in an inductor',
            back: 'U = (1/2) L I^2, stored in its magnetic field. Analogous to (1/2) C V^2 in a capacitor’s electric field.',
          },
        ],
        concepts: [
          {
            title: 'Mutual inductance',
            content:
              'emf in coil 2 due to coil 1: emf2 = −M dI1/dt where M = N2 Φ21 / I1. Depends on geometry, separation, orientation, and core material. Transformers are an application.',
          },
        ],
      },
      {
        name: 'AC Circuits',
        questions: [
          {
            text: 'In a purely inductive AC circuit, current lags voltage by:',
            options: ['90°', '0°', '45°', '180°'],
            answer: '90°',
            solution:
              'Inductor: current lags voltage by π/2; capacitor: current leads by π/2; resistor: in phase.',
            bloom: 'Remember',
            difficulty: 'Easy',
          },
        ],
        flashcards: [
          {
            front: 'Reactances',
            back: 'Inductive reactance X_L = ωL, capacitive reactance X_C = 1/(ωC). Impedance Z = √(R^2 + (X_L − X_C)^2) for series RLC.',
          },
        ],
        concepts: [
          {
            title: 'Phasors in AC',
            content:
              'Sinusoidal voltages/currents are represented as rotating phasors. RMS values: V_rms = V0/√2, I_rms = I0/√2. Impedance is the AC analogue of resistance.',
          },
        ],
      },
      {
        name: 'Resonance and Power',
        questions: [
          {
            text: 'Resonance in a series RLC circuit occurs when:',
            options: ['X_L = X_C', 'X_L = R', 'X_C = R', 'X_L + X_C = R'],
            answer: 'X_L = X_C',
            solution:
              'At resonance ω0 = 1/√(LC), net reactance zero, impedance minimal (=R), current maximal, and voltage and current in phase.',
            bloom: 'Remember',
            difficulty: 'Medium',
          },
        ],
        flashcards: [
          {
            front: 'Power in AC circuits',
            back: 'Average power P = V_rms I_rms cosφ, where cosφ = R/Z is the power factor. At resonance cosφ=1 (max power). Pure L or C gives zero average power.',
          },
        ],
        concepts: [
          {
            title: 'Transformer',
            content:
              'Ideal transformer: V_s/V_p = N_s/N_p = I_p/I_s; power in ≈ power out. Step-up increases voltage, decreases current for efficient transmission; core losses (eddy, hysteresis, copper) reduce efficiency.',
          },
        ],
      },
    ],
  },
  {
    subject: 'Physics',
    chapter: 'Electromagnetic Waves',
    subtopics: [
      {
        name: 'Maxwell and Displacement Current',
        questions: [
          {
            text: 'Displacement current arises due to:',
            options: [
              'time-varying electric field',
              'steady current',
              'static charge',
              'constant magnetic field',
            ],
            answer: 'time-varying electric field',
            solution:
              'Maxwell added I_d = ε0 dΦ_E/dt to Ampère’s law to maintain continuity when electric flux changes (e.g. charging capacitor).',
            bloom: 'Understand',
            difficulty: 'Medium',
          },
        ],
        flashcards: [
          {
            front: 'Maxwell’s equations (names)',
            back: '1. Gauss for E, 2. Gauss for B (no monopoles), 3. Faraday, 4. Ampère-Maxwell. Together they predict EM waves.',
          },
        ],
        concepts: [
          {
            title: 'Nature of EM waves',
            content:
              'EM waves are transverse, E ⊥ B ⊥ propagation, E/B = c, carry energy with Poynting vector S = (1/μ0) E×B. Speed c = 1/√(μ0ε0) ≈ 3×10^8 m/s in vacuum; slower in media.',
          },
        ],
      },
      {
        name: 'EM Spectrum',
        questions: [
          {
            text: 'Which has the longest wavelength among: visible, X-ray, radio, ultraviolet?',
            options: ['radio', 'visible', 'X-ray', 'ultraviolet'],
            answer: 'radio',
            solution:
              'Order by increasing frequency (decreasing λ): radio < microwave < IR < visible < UV < X-ray < gamma. Radio has longest λ.',
            bloom: 'Remember',
            difficulty: 'Easy',
          },
        ],
        flashcards: [
          {
            front: 'Rough EM spectrum bands',
            back: 'Radio (~10^−1–10^4 m), microwave (mm–30 cm), IR (700 nm–1 mm), visible (400–700 nm), UV (10–400 nm), X-ray (0.01–10 nm), gamma (<0.01 nm). Boundaries are conventional.',
          },
        ],
        concepts: [
          {
            title: 'Uses of EM bands',
            content:
              'Radio: broadcasting; microwave: radar/ovens; IR: thermal imaging; visible: sight; UV: sterilisation; X-ray: imaging; gamma: cancer therapy and nuclear processes. Higher frequency generally means higher photon energy E=hf.',
          },
        ],
      },
    ],
  },
  {
    subject: 'Physics',
    chapter: 'Optics',
    subtopics: [
      {
        name: 'Reflection and Refraction',
        questions: [
          {
            text: 'Snell’s law relates incident angle i and refracted angle r as:',
            options: [
              'n1 sin i = n2 sin r',
              'n1 cos i = n2 cos r',
              'n1 tan i = n2 tan r',
              'n1 sin r = n2 sin i',
            ],
            answer: 'n1 sin i = n2 sin r',
            solution:
              'n1 sin i = n2 sin r; equivalently sin i / sin r = n2/n1. Total internal reflection occurs when i > C = arcsin(n2/n1) for n1>n2.',
            bloom: 'Remember',
            difficulty: 'Easy',
          },
        ],
        flashcards: [
          {
            front: 'Critical angle and TIR',
            back: 'C = arcsin(n2/n1) for light going from denser n1 to rarer n2. If i > C, total internal reflection occurs — basis of optical fibres and mirages.',
          },
        ],
        concepts: [
          {
            title: 'Refraction through a prism',
            content:
              'Deviation δ = (i+e) − A. Minimum deviation δ_m when i=e; then n = sin((A+δ_m)/2)/sin(A/2). For small-angle prism δ ≈ (n−1)A.',
          },
        ],
      },
      {
        name: 'Lenses and Mirrors',
        questions: [
          {
            text: 'A convex lens of focal length 20 cm in air is immersed in water (μ_water=4/3, μ_glass=3/2). Its focal length becomes approximately:',
            options: ['80 cm', '20 cm', '10 cm', '40 cm'],
            answer: '80 cm',
            solution:
              'Lens-maker: 1/f ∝ (μ_glass/μ_medium −1). In water factor drops from 0.5 to 0.125 (1/4), so f quadruples to ~80 cm.',
            bloom: 'Apply',
            difficulty: 'Hard',
          },
        ],
        flashcards: [
          {
            front: 'Mirror and lens formulas',
            back: 'Mirror: 1/v + 1/u = 1/f (sign convention: distances in front of mirror negative in Cartesian). Lens: 1/v − 1/u = 1/f. Magnification m = v/u (transverse).',
          },
        ],
        concepts: [
          {
            title: 'Power of a lens',
            content:
              'P = 1/f (metres) in dioptres. Converging (convex) P>0, diverging P<0. Combination in contact: P = P1+P2; 1/F = 1/f1+1/f2. Used to correct myopia (concave) and hypermetropia (convex).',
          },
        ],
      },
      {
        name: 'Wave Optics — Interference',
        questions: [
          {
            text: 'In Young’s double-slit experiment, fringe width β is:',
            options: ['λD/d', 'λd/D', 'dD/λ', 'λ/Dd'],
            answer: 'λD/d',
            solution:
              'β = λD/d where D is slit-to-screen distance and d is slit separation; all fringes equally spaced for monochromatic light.',
            bloom: 'Remember',
            difficulty: 'Medium',
          },
        ],
        flashcards: [
          {
            front: 'Coherent sources condition',
            back: 'Constant phase difference. Obtained by deriving two sources from one (division of wavefront/amplitude). Interference needs coherence; beats analogy for sound.',
          },
        ],
        concepts: [
          {
            title: 'YDSE intensity pattern',
            content:
              'Maxima at path difference nλ, minima at (n+½)λ. Intensity varies as I = I0 cos^2(π d sinθ / λ). White light gives central white fringe with coloured edges.',
          },
        ],
      },
      {
        name: 'Wave Optics — Diffraction and Polarisation',
        questions: [
          {
            text: 'First minimum of single-slit diffraction (slit width a) occurs at angle θ where:',
            options: [
              'a sinθ = λ',
              'a sinθ = λ/2',
              'a cosθ = λ',
              'a sinθ = 2λ',
            ],
            answer: 'a sinθ = λ',
            solution:
              'Single-slit minima: a sinθ = nλ, n=±1,±2... Central maximum width = 2λD/a.',
            bloom: 'Remember',
            difficulty: 'Medium',
          },
        ],
        flashcards: [
          {
            front: 'Brewster’s angle',
            back: 'At polarising angle i_p, reflected and refracted rays are perpendicular and reflected light is fully polarised: tan i_p = n2/n1.',
          },
        ],
        concepts: [
          {
            title: 'Polarisation of light',
            content:
              'EM waves are transverse so E can be polarised; sound cannot be polarised (longitudinal). Polaroids, scattering, and reflection can produce polarised light. Malus law: I = I0 cos^2θ.',
          },
        ],
      },
    ],
  },
  {
    subject: 'Physics',
    chapter: 'Dual Nature of Matter and Radiation',
    subtopics: [
      {
        name: 'Photoelectric Effect',
        questions: [
          {
            text: 'In the photoelectric effect, the maximum kinetic energy of photoelectrons depends on:',
            options: [
              'frequency of incident light',
              'intensity of incident light',
              'both frequency and intensity',
              'neither',
            ],
            answer: 'frequency of incident light',
            solution:
              'Einstein: K_max = hν − φ. Frequency determines photon energy; intensity determines number of photoelectrons (photocurrent), not K_max.',
            bloom: 'Understand',
            difficulty: 'Medium',
          },
        ],
        flashcards: [
          {
            front: 'Einstein photoelectric equation',
            back: 'hν = φ + K_max, where φ = hν0 is work function and ν0 threshold frequency. If ν < ν0, no emission regardless of intensity.',
          },
        ],
        concepts: [
          {
            title: 'Characteristics of photoelectric effect',
            content:
              'Instantaneous emission, threshold frequency, K_max independent of intensity, photocurrent ∝ intensity above threshold. Stopping potential V0 satisfies eV0 = K_max.',
          },
        ],
      },
      {
        name: 'de Broglie Hypothesis',
        questions: [
          {
            text: 'de Broglie wavelength of a particle with momentum p is:',
            options: ['h/p', 'p/h', 'hp', 'h·p'],
            answer: 'h/p',
            solution:
              'λ = h/p = h/(mv). For an electron accelerated through V volts, λ(Å) ≈ 12.27/√V.',
            bloom: 'Remember',
            difficulty: 'Easy',
          },
        ],
        flashcards: [
          {
            front: 'Davisson-Germer experiment',
            back: 'Electron diffraction by nickel crystal confirmed de Broglie waves: measured λ matched h/p, establishing wave nature of matter.',
          },
        ],
        concepts: [
          {
            title: 'Wave-particle duality',
            content:
              'Light shows particle nature (photoelectric, Compton) and wave nature (interference). Matter shows wave nature (electron diffraction) and particle nature (detection). Complementarity: both descriptions are needed.',
          },
        ],
      },
    ],
  },
  {
    subject: 'Physics',
    chapter: 'Atoms and Nuclei',
    subtopics: [
      {
        name: 'Bohr Model of Hydrogen',
        questions: [
          {
            text: 'Energy of the electron in the n-th Bohr orbit of hydrogen is:',
            options: ['−13.6/n² eV', '−13.6·n² eV', '13.6/n eV', '−13.6·n eV'],
            answer: '−13.6/n² eV',
            solution:
              'E_n = −13.6 Z² / n² eV (Z=1 for H). Radius r_n = 0.529·n² Å.',
            bloom: 'Remember',
            difficulty: 'Easy',
          },
        ],
        flashcards: [
          {
            front: 'Bohr quantisation and spectral series',
            back: 'Angular momentum L = n h/2π. Lyman (UV, n→1), Balmer (visible, n→2), Paschen (IR, n→3). Rydberg formula: 1/λ = R(1/n1²−1/n2²).',
          },
        ],
        concepts: [
          {
            title: 'Bohr radius scaling',
            content:
              'r_n ∝ n²/Z, v_n ∝ Z/n, E_n ∝ −Z²/n². Higher Z pulls orbits inward and deepens binding. Fine structure and nuclear size are beyond Bohr.',
          },
        ],
      },
      {
        name: 'Nuclear Structure and Binding Energy',
        questions: [
          {
            text: 'Mass defect Δm corresponds to binding energy:',
            options: [
              'Δm·931.5 MeV/u',
              'Δm·0.511 MeV/u',
              'Δm·13.6 eV/u',
              'Δm·1.6e−19 J/u',
            ],
            answer: 'Δm·931.5 MeV/u',
            solution:
              '1 u·c² = 931.5 MeV. Binding energy per nucleon peaks near iron-56 (~8.8 MeV/nucleon), explaining fusion of light and fission of heavy nuclei.',
            bloom: 'Remember',
            difficulty: 'Medium',
          },
        ],
        flashcards: [
          {
            front: 'Nuclear radius and density',
            back: 'R = R0 A^(1/3) with R0≈1.2 fm. Density ~2.3×10^17 kg/m³, nearly constant for all nuclei — nuclei are incompressible.',
          },
        ],
        concepts: [
          {
            title: 'Binding energy curve',
            content:
              'BE/A rises to Fe-56 then falls. Fusion releases energy below Fe; fission above Fe. Mass defect is the source: Δm = Z m_p + N m_n − M_nucleus.',
          },
        ],
      },
      {
        name: 'Radioactivity',
        questions: [
          {
            text: 'A radioactive sample has half-life 4 hours. After 8 hours, the fraction remaining is:',
            options: ['1/4', '1/2', '1/8', '1/16'],
            answer: '1/4',
            solution: 'Two half-lives: (1/2)^2 = 1/4 remains.',
            bloom: 'Apply',
            difficulty: 'Easy',
          },
        ],
        flashcards: [
          {
            front: 'Decay law',
            back: 'N = N0 e^(−λt), activity A = λN, half-life T½ = ln2/λ, mean life τ = 1/λ. α decay reduces A by 4, Z by 2; β− increases Z by 1; γ is photon emission.',
          },
        ],
        concepts: [
          {
            title: 'Uses and hazards of radioactivity',
            content:
              'Carbon dating (C-14), medical tracers and therapy, smoke detectors (Am-241), thickness gauges. Hazards scale with dose and half-life; shielding and distance reduce exposure.',
          },
        ],
      },
    ],
  },
  {
    subject: 'Physics',
    chapter: 'Electronic Devices',
    subtopics: [
      {
        name: 'Semiconductors and Energy Bands',
        questions: [
          {
            text: 'At absolute zero, an intrinsic semiconductor behaves as:',
            options: [
              'an insulator',
              'a conductor',
              'a superconductor',
              'a perfect metal',
            ],
            answer: 'an insulator',
            solution:
              'At 0 K the valence band is full and conduction band empty, so no free carriers — effectively an insulator. Conductivity rises with T.',
            bloom: 'Understand',
            difficulty: 'Easy',
          },
        ],
        flashcards: [
          {
            front: 'n-type vs p-type doping',
            back: 'n-type: pentavalent donor (P, As) adds electrons; p-type: trivalent acceptor (B, Al) adds holes. Fermi level shifts toward conduction band (n) or valence band (p).',
          },
        ],
        concepts: [
          {
            title: 'Energy bands',
            content:
              'Conductors: overlapping bands. Insulators: large gap (>3 eV). Semiconductors: small gap (~1 eV for Si, 0.7 eV for Ge). Doping creates extra levels in the gap, enabling control of conductivity.',
          },
        ],
      },
      {
        name: 'p-n Junction and Diodes',
        questions: [
          {
            text: 'Forward biasing a p-n junction:',
            options: [
              'reduces depletion width and barrier',
              'increases depletion width',
              'has no effect on depletion region',
              'reverses the junction',
            ],
            answer: 'reduces depletion width and barrier',
            solution:
              'Forward bias pushes majority carriers toward the junction, narrowing depletion region and lowering barrier so current flows. Reverse bias widens it.',
            bloom: 'Understand',
            difficulty: 'Easy',
          },
        ],
        flashcards: [
          {
            front: 'Rectifier action',
            back: 'p-n junction conducts in forward bias and blocks in reverse — used as half-wave (one diode) and full-wave/bridge rectifiers, with filter capacitors to smooth DC.',
          },
        ],
        concepts: [
          {
            title: 'Special diodes',
            content:
              'Zener (reverse breakdown for regulation), LED (forward recombination emits light, band gap sets colour), photodiode (reverse, light generates current), solar cell (photovoltaic).',
          },
        ],
      },
      {
        name: 'Transistors and Logic Gates',
        questions: [
          {
            text: 'Which gate is universal (can implement any Boolean function alone)?',
            options: ['NAND', 'AND', 'OR', 'XOR'],
            answer: 'NAND',
            solution:
              'NAND and NOR are universal. NOT, AND, OR can all be built from NAND gates alone.',
            bloom: 'Remember',
            difficulty: 'Easy',
          },
        ],
        flashcards: [
          {
            front: 'Transistor as switch/amplifier',
            back: 'BJT: n-p-n or p-n-p; active mode (emitter-base forward, collector-base reverse) gives current gain β = Ic/Ib. As switch: saturation (ON) vs cut-off (OFF).',
          },
        ],
        concepts: [
          {
            title: 'Basic logic gates — truth tables',
            content:
              'AND: Y=A·B, OR: Y=A+B, NOT: Y=Ā, NAND: Y=Ā·B̅, NOR: Y=Ā+̅B̅, XOR: Y=A⊕B. Boolean algebra underpins digital circuits.',
          },
        ],
      },
    ],
  },
];
