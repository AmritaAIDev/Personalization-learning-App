import type { ChapterSeed } from './syllabus.types';

export const MATHS_CHAPTERS: ChapterSeed[] = [
  {
    subject: 'Mathematics',
    chapter: 'Matrices and Determinants',
    subtopics: [
      {
        name: 'Matrices Basics',
        questions: [
          {
            text: 'If A is a square matrix with det(A) ≠ 0, then A is:',
            options: [
              'invertible (non-singular)',
              'singular',
              'symmetric',
              'null matrix',
            ],
            answer: 'invertible (non-singular)',
            solution:
              'A matrix is invertible iff its determinant is non-zero; inverse A⁻¹ = adj(A)/det(A).',
            bloom: 'Remember',
            difficulty: 'Easy',
          },
        ],
        flashcards: [
          {
            front: 'Types of matrices',
            back: 'Square, diagonal, scalar, identity, symmetric (A^T=A), skew-symmetric (A^T=−A, diagonal zeros), orthogonal (A^T A = I). Invertible requires det≠0.',
          },
        ],
        concepts: [
          {
            title: 'Matrix operations',
            content:
              'Addition and scalar multiplication element-wise; multiplication (AB)_{ij}=Σ_k A_{ik}B_{kj} requires columns of A = rows of B. Generally AB≠BA.',
          },
        ],
      },
      {
        name: 'Determinants',
        questions: [
          {
            text: 'Determinant of [[3,2],[1,4]] is:',
            options: ['10', '14', '12', '5'],
            answer: '10',
            solution: 'det = 3·4 − 2·1 = 12 − 2 = 10.',
            bloom: 'Apply',
            difficulty: 'Easy',
          },
        ],
        flashcards: [
          {
            front: 'Properties of determinants',
            back: 'Swapping two rows flips sign; adding a multiple of one row to another leaves det unchanged; det(AB)=det(A)·det(B); det(A^T)=det(A).',
          },
        ],
        concepts: [
          {
            title: 'Adjoint and inverse',
            content:
              'Cofactor C_{ij}=(−1)^{i+j}M_{ij}. Adjoint adj(A) is transpose of cofactor matrix. A^{−1}=adj(A)/det(A). Cramers rule solves linear systems when det≠0.',
          },
        ],
      },
      {
        name: 'Transpose and Special Matrices',
        questions: [
          {
            text: 'For any matrices A, B of compatible sizes, (AB)^T equals:',
            options: ['B^T A^T', 'A^T B^T', 'AB', 'B A'],
            answer: 'B^T A^T',
            solution: 'Transpose reverses order: (AB)^T = B^T A^T.',
            bloom: 'Remember',
            difficulty: 'Easy',
          },
        ],
        flashcards: [
          {
            front: 'Skew-symmetric matrix',
            back: 'A^T = −A; all diagonal entries are zero; det of odd-order skew-symmetric matrix is zero.',
          },
        ],
        concepts: [
          {
            title: 'Rank and singularity',
            content:
              'Rank is number of linearly independent rows/columns. Singular means det=0 and no inverse exists. Used to test consistency of linear systems.',
          },
        ],
      },
    ],
  },
  {
    subject: 'Mathematics',
    chapter: 'Three Dimensional Geometry',
    subtopics: [
      {
        name: 'Points and Distances',
        questions: [
          {
            text: 'Distance between points (1,2,3) and (4,6,3) is:',
            options: ['5', '6', '7', '√35'],
            answer: '5',
            solution: 'Distance = √[(4−1)²+(6−2)²+(3−3)²] = √[9+16+0] = 5.',
            bloom: 'Apply',
            difficulty: 'Easy',
          },
        ],
        flashcards: [
          {
            front: 'Section formula',
            back: 'Point dividing A(x1,y1,z1) and B(x2,y2,z2) in ratio m:n — internal: (mx2+nx1)/(m+n) etc.; external: (mx2−nx1)/(m−n). Midpoint is m=n=1.',
          },
        ],
        concepts: [
          {
            title: 'Coordinates in 3D',
            content:
              'Three mutually perpendicular axes; octants; distance formula is the 3D Pythagoras. Direction cosines satisfy l²+m²+n²=1.',
          },
        ],
      },
      {
        name: 'Direction Cosines and Ratios',
        questions: [
          {
            text: 'Direction ratios of the normal to the plane 2x − 3y + 6z = 7 are:',
            options: ['(2, −3, 6)', '(1, 1, 1)', '(2, 3, 6)', '(−2, 3, −6)'],
            answer: '(2, −3, 6)',
            solution:
              'Plane ax+by+cz=d has normal vector (a,b,c) giving direction ratios (2,−3,6).',
            bloom: 'Understand',
            difficulty: 'Easy',
          },
        ],
        flashcards: [
          {
            front: 'Direction cosines vs ratios',
            back: 'If line makes angles α,β,γ with axes, direction cosines are (cosα, cosβ, cosγ) with l²+m²+n²=1. Direction ratios are proportional to cosines (a,b,c) ∝ (l,m,n).',
          },
        ],
        concepts: [
          {
            title: 'Angle between lines and planes',
            content:
              'Angle between lines from direction vectors via cosθ=(a1·a2)/(|a1||a2|). Line-plane angle uses sinθ = |direction·normal|/(|direction||normal|).',
          },
        ],
      },
      {
        name: 'Planes and Lines',
        questions: [
          {
            text: 'Shortest distance between skew lines requires:',
            options: [
              'a common perpendicular exists',
              'lines are parallel',
              'lines intersect',
              'lines are coplanar',
            ],
            answer: 'a common perpendicular exists',
            solution:
              'Skew lines are non-parallel, non-intersecting; the shortest distance is the length of their common perpendicular.',
            bloom: 'Understand',
            difficulty: 'Medium',
          },
        ],
        flashcards: [
          {
            front: 'Equation of a plane',
            back: 'General: ax+by+cz=d. Intercept form: x/p+y/q+z/r=1. Normal form: lx+my+nz=p where (l,m,n) are direction cosines of normal and p is distance from origin.',
          },
        ],
        concepts: [
          {
            title: 'Line in 3D',
            content:
              'Vector: r = a + λb. Cartesian symmetric form: (x−x1)/a = (y−y1)/b = (z−z1)/c. Intersection, parallelism, and skewness are tested via direction vectors and a point on each line.',
          },
        ],
      },
    ],
  },
  {
    subject: 'Mathematics',
    chapter: 'Vector Algebra',
    subtopics: [
      {
        name: 'Vectors Basics and Types',
        questions: [
          {
            text: 'Two vectors are equal if they have:',
            options: [
              'same magnitude and direction',
              'same magnitude only',
              'same direction only',
              'same initial point',
            ],
            answer: 'same magnitude and direction',
            solution:
              'Vectors are equal as free vectors when magnitude and direction match, regardless of position.',
            bloom: 'Remember',
            difficulty: 'Easy',
          },
        ],
        flashcards: [
          {
            front: 'Position vector',
            back: 'Vector from origin to point P(x,y,z) is OP = x i + y j + z k. Its magnitude is √(x²+y²+z²).',
          },
        ],
        concepts: [
          {
            title: 'Types of vectors',
            content:
              'Zero/null vector, unit vector (magnitude 1), collinear, coplanar, equal, negative. Unit vector in direction of a is â = a/|a|.',
          },
        ],
      },
      {
        name: 'Dot Product',
        questions: [
          {
            text: 'If vectors a and b are perpendicular, then a·b equals:',
            options: ['0', '1', '|a||b|', '−1'],
            answer: '0',
            solution: 'a·b = |a||b|cosθ; θ=90° gives cosθ=0.',
            bloom: 'Remember',
            difficulty: 'Easy',
          },
        ],
        flashcards: [
          {
            front: 'Projection of a onto b',
            back: 'Scalar projection = (a·b)/|b| = |a|cosθ. Vector projection = ((a·b)/|b|²) b.',
          },
        ],
        concepts: [
          {
            title: 'Properties of dot product',
            content:
              'Commutative: a·b=b·a. Distributive over addition. a·a = |a|². Angle between vectors: cosθ=(a·b)/(|a||b|). Used for work W=F·d.',
          },
        ],
      },
      {
        name: 'Cross Product',
        questions: [
          {
            text: 'If a = i + j and b = j + k, the magnitude |a × b| equals:',
            options: ['√3', '1', '√2', '2'],
            answer: '√3',
            solution:
              'a=(1,1,0), b=(0,1,1). a×b=(1·1−0·1, 0·0−1·1, 1·1−1·0)=(1,−1,1); magnitude √(1+1+1)=√3.',
            bloom: 'Apply',
            difficulty: 'Medium',
          },
        ],
        flashcards: [
          {
            front: 'Geometric meaning of cross product',
            back: '|a×b| = |a||b|sinθ is the area of the parallelogram with sides a and b. Direction given by right-hand rule, perpendicular to both.',
          },
        ],
        concepts: [
          {
            title: 'Scalar triple product',
            content:
              '[a b c] = a·(b×c) is the volume of the parallelepiped with coterminous edges a,b,c. Zero means vectors are coplanar.',
          },
        ],
      },
    ],
  },
  {
    subject: 'Mathematics',
    chapter: 'Statistics and Probability',
    subtopics: [
      {
        name: 'Measures of Central Tendency and Dispersion',
        questions: [
          {
            text: 'Variance of the data set {1,2,3,4,5} is:',
            options: ['2', '3', '1', '2.5'],
            answer: '2',
            solution:
              'Mean=3, variance = [(4+1+0+1+4)/5]=2 (population variance). Sample variance would be 2.5.',
            bloom: 'Apply',
            difficulty: 'Medium',
          },
        ],
        flashcards: [
          {
            front: 'Mean, median, mode',
            back: 'Mean = Σx/n. Median = middle value when sorted (average of two middles for even n). Mode = most frequent value. For symmetric distributions they coincide.',
          },
        ],
        concepts: [
          {
            title: 'Standard deviation',
            content:
              'σ = √variance. Measures spread. For first n natural numbers, variance = (n²−1)/12. Coefficient of variation = σ/mean ×100% compares variability across data sets.',
          },
        ],
      },
      {
        name: 'Probability Basics',
        questions: [
          {
            text: 'Two fair dice are thrown. The probability that the sum is 8 is:',
            options: ['5/36', '1/6', '1/9', '1/12'],
            answer: '5/36',
            solution:
              'Favourable pairs: (2,6),(3,5),(4,4),(5,3),(6,2) =5 out of 36.',
            bloom: 'Apply',
            difficulty: 'Easy',
          },
        ],
        flashcards: [
          {
            front: 'Addition and multiplication rules',
            back: 'P(A∪B)=P(A)+P(B)−P(A∩B). For independent events P(A∩B)=P(A)P(B). Conditional: P(A|B)=P(A∩B)/P(B).',
          },
        ],
        concepts: [
          {
            title: 'Bayes’ theorem',
            content:
              'P(A_i|E) = P(E|A_i)P(A_i) / Σ P(E|A_j)P(A_j). Used to invert conditional probabilities — e.g. disease testing, spam filtering.',
          },
        ],
      },
      {
        name: 'Random Variables and Distributions',
        questions: [
          {
            text: 'For a binomial distribution with n trials and success probability p, the mean is:',
            options: ['np', 'np(1−p)', 'n/p', 'p/n'],
            answer: 'np',
            solution:
              'Mean = np, variance = np(1−p). Example: 10 trials, p=0.3 → mean 3.',
            bloom: 'Remember',
            difficulty: 'Easy',
          },
        ],
        flashcards: [
          {
            front: 'Binomial probability mass function',
            back: 'P(X=k)=C(n,k) p^k (1−p)^{n−k} for k=0..n. Models number of successes in n independent Bernoulli trials.',
          },
        ],
        concepts: [
          {
            title: 'Normal approximation',
            content:
              'For large n, binomial approximates normal with μ=np, σ²=npq. Continuity correction improves accuracy. Central limit theorem generalises this.',
          },
        ],
      },
    ],
  },
  {
    subject: 'Mathematics',
    chapter: 'Differential Equations',
    subtopics: [
      {
        name: 'Order and Degree',
        questions: [
          {
            text: 'Order and degree of d²y/dx² + (dy/dx)³ + y = 0 are respectively:',
            options: ['2 and 1', '1 and 3', '2 and 3', '3 and 1'],
            answer: '2 and 1',
            solution:
              'Order is the highest derivative (2). Degree is the power of the highest derivative after clearing radicals/fractions (1).',
            bloom: 'Understand',
            difficulty: 'Easy',
          },
        ],
        flashcards: [
          {
            front: 'General vs particular solution',
            back: 'General solution contains arbitrary constants equal in number to the order. Particular solution fixes them using initial/boundary conditions.',
          },
        ],
        concepts: [
          {
            title: 'Formation of differential equations',
            content:
              'Differentiate the family of curves as many times as there are arbitrary constants and eliminate the constants. Example: y = A e^x gives dy/dx = y.',
          },
        ],
      },
      {
        name: 'Variable Separable',
        questions: [
          {
            text: 'Solution of dy/dx = k y (k constant) is:',
            options: ['y = C e^(k x)', 'y = k x + C', 'y = C x^k', 'y = k e^x'],
            answer: 'y = C e^(k x)',
            solution: 'Separable: dy/y = k dx → ln y = kx + C → y = C e^{kx}.',
            bloom: 'Apply',
            difficulty: 'Easy',
          },
        ],
        flashcards: [
          {
            front: 'Variable separable method',
            back: 'If dy/dx = g(x)h(y), rewrite as dy/h(y) = g(x)dx and integrate both sides. Often needs partial fractions.',
          },
        ],
        concepts: [
          {
            title: 'Applications of separable equations',
            content:
              'Population growth, radioactive decay, cooling (Newton), and orthogonal trajectories all reduce to separable forms.',
          },
        ],
      },
      {
        name: 'Linear Differential Equations',
        questions: [
          {
            text: 'Integrating factor for dy/dx + P(x)·y = Q(x) is:',
            options: ['e^(∫P dx)', 'e^(∫Q dx)', '∫P dx', 'e^(P·x)'],
            answer: 'e^(∫P dx)',
            solution:
              'I.F. = exp(∫P dx). Multiplying through makes left side d/dx(I.F.·y), giving y·I.F. = ∫ Q·I.F. dx + C.',
            bloom: 'Remember',
            difficulty: 'Easy',
          },
        ],
        flashcards: [
          {
            front: 'Linear differential equation — form',
            back: 'First-order linear: dy/dx + P(x)y = Q(x). Solution: y·e^{∫P dx} = ∫ Q·e^{∫P dx} dx + C. P and Q are functions of x alone.',
          },
        ],
        concepts: [
          {
            title: 'Homogeneous equations',
            content:
              'dy/dx = f(y/x) where f is homogeneous of degree zero. Substitute y = vx to make it separable in v and x.',
          },
        ],
      },
    ],
  },
];
