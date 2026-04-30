# TeamTask

> Full-stack project management application with role-based access control, Kanban board, and real-time task tracking.

**Live URL:** _Add Railway URL after deployment_  
**GitHub:** _Add repo URL_

---

## Features

- **Authentication** — Secure JWT-based signup/login with httpOnly cookies
- **Project Management** — Create projects with custom colors, invite team members
- **Kanban Board** — Drag-and-drop tasks across TODO / IN PROGRESS / DONE columns
- **Task Management** — Create tasks with priority, due dates, assignees, and comments
- **Role-Based Access Control** — Admin (full access) / Member (view + status updates only)
- **Dashboard** — Aggregated stats: total tasks, by status, overdue count, assigned to me

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Custom CSS |
| Backend | Node.js + Express |
| Database | MongoDB via Mongoose |
| Auth | JWT (httpOnly cookies) |
| Deployment | Railway |

---

## Local Development

### Prerequisites
- Node.js 18+
- MongoDB (local or Railway dev instance)

### Setup

```bash
# Clone the repository
git clone <repo-url>
cd teamtask

# Install all dependencies
npm run install:all

# Configure environment
cp server/.env.example server/.env
# Edit server/.env with your DATABASE_URL and JWT_SECRET

# Run database migrations
cd server && 

# Start development servers (runs frontend + backend concurrently)
cd .. && npm run dev
```

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001/api

---

## API Reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Sign in |
| POST | `/api/auth/logout` | Sign out |
| GET | `/api/auth/me` | Get current user |

### Projects
| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/projects` | All members |
| POST | `/api/projects` | Authenticated users |
| GET | `/api/projects/:id` | Project members |
| PUT | `/api/projects/:id` | Admins only |
| DELETE | `/api/projects/:id` | Admins only |
| POST | `/api/projects/:id/members` | Admins only |
| DELETE | `/api/projects/:id/members/:userId` | Admins only |

### Tasks
| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/tasks/project/:id` | Project members |
| POST | `/api/tasks/project/:id` | Admins only |
| GET | `/api/tasks/:id` | Project members |
| PUT | `/api/tasks/:id` | Admin: all fields / Member: status only |
| DELETE | `/api/tasks/:id` | Admins only |
| POST | `/api/tasks/:id/comments` | Project members |

---

## Railway Deployment

1. Push code to GitHub
2. Create a new Railway project → **Deploy from GitHub repo**
3. Add a **MongoDB** plugin to the project
4. Set environment variables in Railway:
   ```
   DATABASE_URL=<from Railway MongoDB plugin>
   JWT_SECRET=<generate a strong random string>
   CLIENT_URL=<your Railway app URL>
   NODE_ENV=production
   ```
5. Railway auto-detects `railway.toml` — build and deploy runs automatically

---

## Role-Based Access Control

| Action | Admin | Member |
|---|---|---|
| Create / Delete Project | ✅ | ❌ |
| Invite / Remove Members | ✅ | ❌ |
| Create / Delete Tasks | ✅ | ❌ |
| Update Task (all fields) | ✅ | ❌ |
| Update Task Status | ✅ | ✅ |
| View Project & Tasks | ✅ | ✅ |
| Add Comments | ✅ | ✅ |

---

## Project Structure

```
teamtask/
├── client/                 # React + Vite frontend
│   └── src/
│       ├── api/            # Axios client
│       ├── components/     # Reusable components
│       ├── context/        # Auth context
│       ├── pages/          # Route pages
│       └── styles/         # CSS design system
│
├── server/                 # Express backend
│   └── src/
│       ├── controllers/    # Business logic
│       ├── middleware/     # Auth middleware
│       ├── routes/         # API routes
│       └── utils/          # Shared utilities
│
└── railway.toml            # Deployment config
```
