import request from 'supertest';
import { app } from '../src/index';

describe('Auth API', () => {
  const testUser = {
    email: `test${Date.now()}@example.com`,
    password: 'Test123!',
    name: 'Test User',
  };
  let authToken: string;

  describe('POST /api/auth/signup', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send(testUser)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testUser.email);
      expect(res.body.data.user.name).toBe(testUser.name);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.password).toBeUndefined();
    });

    it('should reject duplicate email', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send(testUser)
        .expect(409);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('already registered');
    });

    it('should reject invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({ ...testUser, email: 'invalid-email' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should reject short password', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({ ...testUser, email: 'new@test.com', password: '123' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe(testUser.email);
      
      authToken = res.body.data.token;
    });

    it('should reject invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        })
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Invalid credentials');
    });

    it('should reject non-existent user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'password123',
        })
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/profile', () => {
    it('should return user profile with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(testUser.email);
    });

    it('should reject request without token', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should reject request with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });
});

describe('Board API', () => {
  let authToken: string;
  let boardId: string;

  beforeAll(async () => {
    // Login to get token
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'demo@taskcollab.com',
        password: 'Demo123!',
      });
    
    authToken = res.body.data?.token;
  });

  describe('POST /api/boards', () => {
    it('should create a new board', async () => {
      const res = await request(app)
        .post('/api/boards')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Board',
          description: 'A test board',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Test Board');
      expect(res.body.data.lists).toBeDefined();
      expect(res.body.data.lists.length).toBe(3); // Default lists
      
      boardId = res.body.data.id;
    });

    it('should reject board without name', async () => {
      const res = await request(app)
        .post('/api/boards')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ description: 'No name' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/boards', () => {
    it('should return user boards', async () => {
      const res = await request(app)
        .get('/api/boards')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should support pagination', async () => {
      const res = await request(app)
        .get('/api/boards?page=1&limit=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(5);
    });
  });

  describe('GET /api/boards/:id', () => {
    it('should return board details', async () => {
      if (!boardId) return;

      const res = await request(app)
        .get(`/api/boards/${boardId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(boardId);
      expect(res.body.data.lists).toBeDefined();
    });

    it('should return 404 for non-existent board', async () => {
      const res = await request(app)
        .get('/api/boards/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(res.body.success).toBe(false);
    });
  });
});

describe('Task API', () => {
  let authToken: string;
  let boardId: string;
  let listId: string;
  let taskId: string;

  beforeAll(async () => {
    // Login
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'demo@taskcollab.com',
        password: 'Demo123!',
      });
    authToken = loginRes.body.data?.token;

    // Create a board
    const boardRes = await request(app)
      .post('/api/boards')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Task Test Board' });
    
    boardId = boardRes.body.data?.id;
    listId = boardRes.body.data?.lists?.[0]?.id;
  });

  describe('POST /api/tasks', () => {
    it('should create a new task', async () => {
      if (!listId) return;

      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Task',
          description: 'Task description',
          listId,
          priority: 'high',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Test Task');
      expect(res.body.data.priority).toBe('high');
      
      taskId = res.body.data.id;
    });
  });

  describe('PUT /api/tasks/:id', () => {
    it('should update a task', async () => {
      if (!taskId) return;

      const res = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Task',
          priority: 'urgent',
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Updated Task');
      expect(res.body.data.priority).toBe('urgent');
    });
  });

  describe('PUT /api/tasks/:id/move', () => {
    it('should move task to different position', async () => {
      if (!taskId || !listId) return;

      const res = await request(app)
        .put(`/api/tasks/${taskId}/move`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          listId,
          position: 0,
        })
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/tasks/search', () => {
    it('should search tasks', async () => {
      const res = await request(app)
        .get('/api/tasks/search?query=Updated')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});

describe('Health Check', () => {
  it('should return health status', async () => {
    const res = await request(app)
      .get('/health')
      .expect(200);

    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
  });
});
