# Real-Time Task Collaboration Platform

A production-ready, full-stack task management application similar to Trello/Notion, featuring real-time collaboration, drag-and-drop functionality, and user authentication.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?logo=node.js&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?logo=socket.io&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?logo=prisma&logoColor=white)

## 🚀 Features

### Core Functionality
- **User Authentication**: JWT-based secure authentication with signup/login
- **Boards Management**: Create, read, update, delete boards with customizable backgrounds
- **Lists & Tasks**: Full CRUD operations for lists and tasks within boards
- **Drag & Drop**: Intuitive drag-and-drop for tasks between lists (using @dnd-kit)
- **Task Assignment**: Assign multiple users to tasks
- **Real-Time Sync**: WebSocket-powered live updates across all connected clients
- **Activity History**: Track all changes with detailed activity logs
- **Search & Pagination**: Find boards quickly with search functionality

### Technical Highlights
- TypeScript throughout (frontend + backend)
- Production-ready architecture with proper error handling
- Optimistic UI updates for smooth UX
- RESTful API design
- Database with Prisma ORM (SQLite for dev, PostgreSQL-ready)
- Comprehensive API documentation

## 🏗️ Architecture

```
task-collab-platform/
├── backend/                    # Express.js API Server
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema
│   │   └── seed.ts             # Demo data seeding
│   ├── src/
│   │   ├── controllers/        # Request handlers
│   │   ├── middleware/         # Auth, validation, error handling
│   │   ├── routes/             # API routes
│   │   ├── services/           # WebSocket, Activity logging
│   │   ├── types/              # TypeScript definitions
│   │   ├── utils/              # Utilities (JWT)
│   │   └── index.ts            # Server entry point
│   └── tests/                  # Jest test suites
│
└── frontend/                   # React SPA
    ├── src/
    │   ├── components/         # Reusable UI components
    │   │   ├── Auth/           # Login, Signup forms
    │   │   ├── Board/          # Board, List, Task components
    │   │   └── Common/         # Button, Input, Modal, etc.
    │   ├── pages/              # Page components
    │   ├── services/           # API client, WebSocket client
    │   ├── store/              # Redux store & slices
    │   ├── types/              # TypeScript interfaces
    │   └── App.tsx             # Main app with routing
    └── index.html
```

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: SQLite (dev) / PostgreSQL (prod)
- **ORM**: Prisma
- **Authentication**: JWT + bcrypt
- **Real-time**: Socket.io
- **Validation**: express-validator
- **Testing**: Jest + Supertest

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **State Management**: Redux Toolkit
- **Styling**: TailwindCSS
- **Drag & Drop**: @dnd-kit
- **HTTP Client**: Axios
- **Real-time**: Socket.io-client
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd task-collab-platform
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   
   # Generate Prisma client
   npx prisma generate
   
   # Run database migrations
   npx prisma migrate dev
   
   # Seed demo data
   npm run db:seed
   
   # Start development server
   npm run dev
   ```
   Backend runs at http://localhost:3001

3. **Frontend Setup** (new terminal)
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Frontend runs at http://localhost:3000

## 🔐 Demo Credentials

After seeding the database, you can log in with these demo accounts:

| Email | Password | Description |
|-------|----------|-------------|
| demo@taskcollab.com | Demo123! | Primary demo account |
| john@taskcollab.com | Demo123! | Secondary user |
| jane@taskcollab.com | Demo123! | Secondary user |

The seed data includes:
- 2 sample boards ("Product Roadmap" and "Marketing Campaign")
- Multiple lists per board (Backlog, In Progress, Review, Done)
- Sample tasks with descriptions and priorities
- Pre-configured board memberships

## 📡 API Documentation

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |

### Boards

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/boards` | List user's boards |
| POST | `/api/boards` | Create board |
| GET | `/api/boards/:id` | Get board with lists & tasks |
| PUT | `/api/boards/:id` | Update board |
| DELETE | `/api/boards/:id` | Delete board |
| POST | `/api/boards/:id/members` | Add board member |
| DELETE | `/api/boards/:id/members/:userId` | Remove member |

### Lists

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/lists` | Create list |
| PUT | `/api/lists/:id` | Update list |
| DELETE | `/api/lists/:id` | Delete list |
| PUT | `/api/lists/:id/move` | Reorder list |

### Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tasks` | Create task |
| GET | `/api/tasks/:id` | Get task details |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |
| PUT | `/api/tasks/:id/move` | Move task to list |
| POST | `/api/tasks/:id/assignees` | Assign user |
| DELETE | `/api/tasks/:id/assignees/:userId` | Unassign user |
| GET | `/api/tasks/:id/activities` | Get task activities |

### Request/Response Examples

**Create Task**
```bash
POST /api/tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Implement feature X",
  "description": "Detailed description...",
  "listId": "list-uuid",
  "priority": "high",
  "dueDate": "2024-12-31"
}
```

**Response**
```json
{
  "id": "task-uuid",
  "title": "Implement feature X",
  "description": "Detailed description...",
  "priority": "high",
  "position": 0,
  "listId": "list-uuid",
  "createdBy": "user-uuid",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

## 🔄 WebSocket Events

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `join:board` | `{ boardId }` | Join board room |
| `leave:board` | `{ boardId }` | Leave board room |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `board:update` | Board object | Board was updated |
| `list:create` | List object | New list created |
| `list:update` | List object | List updated |
| `list:delete` | `{ listId }` | List deleted |
| `task:create` | Task object | New task created |
| `task:update` | Task object | Task updated |
| `task:delete` | `{ taskId }` | Task deleted |
| `task:move` | Move details | Task moved |
| `member:add` | Member object | Member added |
| `member:remove` | `{ userId }` | Member removed |
| `activity:new` | Activity object | New activity logged |

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

Tests cover:
- Authentication (signup, login, protected routes)
- Board CRUD operations
- Task operations and assignments
- Authorization checks

## 🚀 Production Deployment

### Environment Variables

**Backend (.env)**
```env
DATABASE_URL="postgresql://user:pass@host:5432/dbname"
JWT_SECRET="your-secure-secret-key"
PORT=3001
NODE_ENV=production
FRONTEND_URL="https://your-frontend-domain.com"
```

**Frontend (.env)**
```env
VITE_API_URL=https://your-api-domain.com
```

### Database Migration (PostgreSQL)

1. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

2. Run migrations:
   ```bash
   npx prisma migrate deploy
   ```

### Docker Deployment

```dockerfile
# Backend Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

## 📁 Project Structure Details

### Backend Controllers
- **authController**: User registration, login, profile
- **boardController**: Board CRUD, member management
- **listController**: List CRUD, reordering
- **taskController**: Task CRUD, movement, assignment

### Frontend State Management
- **authSlice**: Authentication state, user info
- **boardSlice**: Boards, lists, tasks, optimistic updates
- **uiSlice**: Modals, sidebar, UI preferences

### Component Architecture
- **Common**: Reusable primitives (Button, Input, Modal, Avatar)
- **Auth**: Authentication forms with validation
- **Board**: Kanban components with drag-and-drop

## 🎨 Customization

### Adding a New Board Background
Edit the `CreateBoardModal.tsx` to add more color options:
```tsx
const backgrounds = [
  '#3b82f6', // blue
  '#8b5cf6', // purple
  // Add more colors
];
```

### Changing Priority Colors
Edit `index.css`:
```css
.priority-custom {
  @apply bg-custom-100 text-custom-700;
}
```

## 📝 License

MIT License - feel free to use this project for learning or production.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

Built with ❤️ as a Full-Stack Engineering Interview Assignment
