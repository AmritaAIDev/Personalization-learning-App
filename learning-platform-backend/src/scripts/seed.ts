import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { Topic, TopicLevel } from '../topics/topic.entity';
import { TestSession } from '../sessions/test-session.entity';
import { Repository } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const userRepository = app.get<Repository<User>>(getRepositoryToken(User));
  const topicRepository = app.get<Repository<Topic>>(getRepositoryToken(Topic));
  const sessionRepository = app.get<Repository<TestSession>>(
    getRepositoryToken(TestSession),
  );

  console.log('Seeding database...');

  // 1. Clear existing data
  await sessionRepository.query('TRUNCATE test_sessions CASCADE;');
  await topicRepository.query('TRUNCATE topics CASCADE;');
  await userRepository.query('TRUNCATE users CASCADE;');

  // 2. Create User
  const student = userRepository.create({
    name: 'Arjun Student',
    email: 'arjun@student.edu',
    passwordHash: 'dummy_hash',
    role: 'student',
  });
  await userRepository.save(student);
  console.log('User created:', student.name);

  // 3. Create Topics Hierarchy
  const physics = topicRepository.create({
    name: 'Physics',
    level: TopicLevel.SUBJECT,
  });
  await topicRepository.save(physics);

  const chaptersData = [
    {
      name: 'Units & Math',
      status: 'completed',
      score: 98,
      subtopics: [
        { name: 'Vectors', score: 100 },
        { name: 'Calculus', score: 96 },
      ],
    },
    {
      name: 'Kinematics',
      status: 'completed',
      score: 92,
      subtopics: [
        { name: '1D Motion', score: 100 },
        { name: '2D Motion', score: 85 },
      ],
    },
    {
      name: "Newton's Laws",
      status: 'completed',
      score: 88,
      subtopics: [
        { name: 'Inertia', score: 95 },
        { name: 'F=ma', score: 82 },
      ],
    },
    {
      name: 'Work & Energy',
      status: 'completed',
      score: 95,
      subtopics: [
        { name: 'Kinetic Energy', score: 95 },
        { name: 'Potential Energy', score: 95 },
      ],
    },
    {
      name: 'Electric Fields',
      status: 'active',
      score: 65,
      subtopics: [
        { name: "Coulomb's Law", score: 100 },
        { name: 'Superposition', score: 45 },
        { name: 'Electric Flux', score: null },
      ],
    },
    {
      name: "Gauss's Law",
      status: 'locked',
      subtopics: [
        { name: 'Symmetry', score: null },
        { name: 'Applications', score: null },
      ],
    },
    {
      name: 'Capacitance',
      status: 'locked',
      subtopics: [
        { name: 'Dielectrics', score: null },
        { name: 'Circuits', score: null },
      ],
    },
    {
      name: 'Current Elec.',
      status: 'locked',
      subtopics: [{ name: 'Ohm Law', score: null }],
    },
    {
      name: 'Magnetism',
      status: 'locked',
      subtopics: [{ name: 'Biot-Savart', score: null }],
    },
  ];

  for (const chData of chaptersData) {
    const chapter = topicRepository.create({
      name: chData.name,
      level: TopicLevel.CHAPTER,
      parent: physics,
    });
    await topicRepository.save(chapter);

    // Save subtopics
    for (const sub of chData.subtopics) {
      const subtopic = topicRepository.create({
        name: sub.name,
        level: TopicLevel.SUB_TOPIC,
        parent: chapter,
      });
      await topicRepository.save(subtopic);

      // Create test sessions for subtopics if they have a score
      if (sub.score !== null) {
        const subSession = sessionRepository.create({
          user: student,
          topic: subtopic,
          currentScore: sub.score,
          status: 'completed',
        });
        await sessionRepository.save(subSession);
      }
    }

    // Create session for chapter based on state
    if (chData.status !== 'locked') {
      const chSession = sessionRepository.create({
        user: student,
        topic: chapter,
        currentScore: chData.score,
        status: chData.status === 'active' ? 'in-progress' : 'completed',
      });
      await sessionRepository.save(chSession);
    }
  }

  // Mathematics
  const math = topicRepository.create({
    name: 'Mathematics',
    level: TopicLevel.SUBJECT,
  });
  await topicRepository.save(math);
  const mathChapters = [
    {
      name: 'Calculus',
      status: 'completed',
      score: 85,
      subtopics: [
        { name: 'Limits', score: 90 },
        { name: 'Derivatives', score: 80 },
      ],
    },
    {
      name: 'Algebra',
      status: 'active',
      score: 40,
      subtopics: [
        { name: 'Matrices', score: 100 },
        { name: 'Complex Numbers', score: null },
      ],
    },
    {
      name: 'Coordinate Geo',
      status: 'locked',
      subtopics: [
        { name: 'Straight Lines', score: null },
        { name: 'Circles', score: null },
      ],
    },
  ];

  for (const chData of mathChapters) {
    const chapter = topicRepository.create({
      name: chData.name,
      level: TopicLevel.CHAPTER,
      parent: math,
    });
    await topicRepository.save(chapter);
    for (const sub of chData.subtopics) {
      const subtopic = topicRepository.create({
        name: sub.name,
        level: TopicLevel.SUB_TOPIC,
        parent: chapter,
      });
      await topicRepository.save(subtopic);
      if (sub.score !== null) {
        await sessionRepository.save(
          sessionRepository.create({
            user: student,
            topic: subtopic,
            currentScore: sub.score,
            status: 'completed',
          }),
        );
      }
    }
    if (chData.status !== 'locked') {
      await sessionRepository.save(
        sessionRepository.create({
          user: student,
          topic: chapter,
          currentScore: chData.score,
          status: chData.status === 'active' ? 'in-progress' : 'completed',
        }),
      );
    }
  }

  // Chemistry
  const chem = topicRepository.create({
    name: 'Chemistry',
    level: TopicLevel.SUBJECT,
  });
  await topicRepository.save(chem);
  const chemChapters = [
    {
      name: 'Physical Chem',
      status: 'completed',
      score: 75,
      subtopics: [
        { name: 'Mole Concept', score: 80 },
        { name: 'Thermodynamics', score: 70 },
      ],
    },
    {
      name: 'Organic Chem',
      status: 'active',
      score: 55,
      subtopics: [
        { name: 'IUPAC', score: 90 },
        { name: 'Isomerism', score: 20 },
      ],
    },
    {
      name: 'Inorganic Chem',
      status: 'locked',
      subtopics: [
        { name: 'Periodic Table', score: null },
        { name: 'Chemical Bonding', score: null },
      ],
    },
  ];

  for (const chData of chemChapters) {
    const chapter = topicRepository.create({
      name: chData.name,
      level: TopicLevel.CHAPTER,
      parent: chem,
    });
    await topicRepository.save(chapter);
    for (const sub of chData.subtopics) {
      const subtopic = topicRepository.create({
        name: sub.name,
        level: TopicLevel.SUB_TOPIC,
        parent: chapter,
      });
      await topicRepository.save(subtopic);
      if (sub.score !== null) {
        await sessionRepository.save(
          sessionRepository.create({
            user: student,
            topic: subtopic,
            currentScore: sub.score,
            status: 'completed',
          }),
        );
      }
    }
    if (chData.status !== 'locked') {
      await sessionRepository.save(
        sessionRepository.create({
          user: student,
          topic: chapter,
          currentScore: chData.score,
          status: chData.status === 'active' ? 'in-progress' : 'completed',
        }),
      );
    }
  }

  console.log('Seeding completed successfully!');
  await app.close();
}

bootstrap().catch((err) => {
  console.error('Seeding failed!', err);
  process.exit(1);
});
