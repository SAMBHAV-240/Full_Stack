import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo users
  const hashedPassword = await bcrypt.hash('Demo123!', 12);

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@taskcollab.com' },
    update: {},
    create: {
      email: 'demo@taskcollab.com',
      password: hashedPassword,
      name: 'Demo User',
      avatar: null,
    },
  });

  const johnDoe = await prisma.user.upsert({
    where: { email: 'john@taskcollab.com' },
    update: {},
    create: {
      email: 'john@taskcollab.com',
      password: hashedPassword,
      name: 'John Doe',
      avatar: null,
    },
  });

  const janeSmith = await prisma.user.upsert({
    where: { email: 'jane@taskcollab.com' },
    update: {},
    create: {
      email: 'jane@taskcollab.com',
      password: hashedPassword,
      name: 'Jane Smith',
      avatar: null,
    },
  });

  // Create a demo board
  const projectBoard = await prisma.board.create({
    data: {
      name: 'Project Alpha',
      description: 'Main project board for Alpha development',
      background: '#1e3a5f',
      ownerId: demoUser.id,
      members: {
        create: [
          { userId: demoUser.id, role: 'owner' },
          { userId: johnDoe.id, role: 'admin' },
          { userId: janeSmith.id, role: 'member' },
        ],
      },
    },
  });

  // Create lists
  const todoList = await prisma.list.create({
    data: {
      name: 'To Do',
      position: 0,
      boardId: projectBoard.id,
    },
  });

  const inProgressList = await prisma.list.create({
    data: {
      name: 'In Progress',
      position: 1,
      boardId: projectBoard.id,
    },
  });

  const reviewList = await prisma.list.create({
    data: {
      name: 'Review',
      position: 2,
      boardId: projectBoard.id,
    },
  });

  const doneList = await prisma.list.create({
    data: {
      name: 'Done',
      position: 3,
      boardId: projectBoard.id,
    },
  });

  // Create tasks
  const task1 = await prisma.task.create({
    data: {
      title: 'Setup project repository',
      description: 'Initialize Git repository and setup CI/CD pipeline',
      position: 0,
      priority: 'high',
      listId: doneList.id,
      labels: JSON.stringify(['setup', 'devops']),
      assignees: {
        create: [{ userId: demoUser.id }],
      },
    },
  });

  const task2 = await prisma.task.create({
    data: {
      title: 'Design database schema',
      description: 'Create comprehensive database schema for all entities',
      position: 0,
      priority: 'high',
      listId: inProgressList.id,
      labels: JSON.stringify(['database', 'architecture']),
      assignees: {
        create: [{ userId: johnDoe.id }],
      },
    },
  });

  const task3 = await prisma.task.create({
    data: {
      title: 'Implement authentication',
      description: 'Add JWT-based authentication with signup and login',
      position: 1,
      priority: 'urgent',
      listId: todoList.id,
      labels: JSON.stringify(['security', 'backend']),
      assignees: {
        create: [{ userId: demoUser.id }, { userId: janeSmith.id }],
      },
    },
  });

  const task4 = await prisma.task.create({
    data: {
      title: 'Create UI components',
      description: 'Build reusable React components for the application',
      position: 0,
      priority: 'medium',
      listId: todoList.id,
      labels: JSON.stringify(['frontend', 'ui']),
    },
  });

  const task5 = await prisma.task.create({
    data: {
      title: 'Setup WebSocket server',
      description: 'Implement real-time communication with Socket.io',
      position: 2,
      priority: 'high',
      listId: todoList.id,
      labels: JSON.stringify(['realtime', 'backend']),
      assignees: {
        create: [{ userId: johnDoe.id }],
      },
    },
  });

  const task6 = await prisma.task.create({
    data: {
      title: 'Code review: API endpoints',
      description: 'Review all REST API endpoints for consistency',
      position: 0,
      priority: 'medium',
      listId: reviewList.id,
      labels: JSON.stringify(['review', 'backend']),
      assignees: {
        create: [{ userId: janeSmith.id }],
      },
    },
  });

  // Create some activities
  await prisma.activity.createMany({
    data: [
      {
        action: 'created',
        entityType: 'board',
        entityId: projectBoard.id,
        description: 'created board "Project Alpha"',
        userId: demoUser.id,
        boardId: projectBoard.id,
      },
      {
        action: 'created',
        entityType: 'task',
        entityId: task1.id,
        description: 'created task "Setup project repository"',
        userId: demoUser.id,
        boardId: projectBoard.id,
        taskId: task1.id,
      },
      {
        action: 'moved',
        entityType: 'task',
        entityId: task1.id,
        description: 'moved task "Setup project repository" to Done',
        userId: demoUser.id,
        boardId: projectBoard.id,
        taskId: task1.id,
      },
    ],
  });

  // Create a second board
  const marketingBoard = await prisma.board.create({
    data: {
      name: 'Marketing Campaign',
      description: 'Q1 Marketing initiatives',
      background: '#2d5a3d',
      ownerId: janeSmith.id,
      members: {
        create: [
          { userId: janeSmith.id, role: 'owner' },
          { userId: demoUser.id, role: 'member' },
        ],
      },
    },
  });

  await prisma.list.createMany({
    data: [
      { name: 'Ideas', position: 0, boardId: marketingBoard.id },
      { name: 'Planning', position: 1, boardId: marketingBoard.id },
      { name: 'Execution', position: 2, boardId: marketingBoard.id },
      { name: 'Completed', position: 3, boardId: marketingBoard.id },
    ],
  });

  console.log('✅ Database seeded successfully!');
  console.log('');
  console.log('Demo Credentials:');
  console.log('  Email: demo@taskcollab.com');
  console.log('  Password: Demo123!');
  console.log('');
  console.log('Additional test users:');
  console.log('  Email: john@taskcollab.com | Password: Demo123!');
  console.log('  Email: jane@taskcollab.com | Password: Demo123!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
