# CONNECTIFY — Connect. Share. Discover.

A full-stack social networking application developed for the **CodeAlpha Full Stack Development Internship — Task 2: Social Media Platform**.

Connectify provides a modern community space where people can create accounts, personalise their profiles, share posts and 24-hour stories, discover other members, follow accounts, react to posts, comment, receive notifications and chat in real time.

> **Project folder and suggested GitHub repository name:** `CodeAlpha_Connectify`

## Features

### Accounts and profiles
- Register and sign in with an email address or username.
- Passwords are hashed with bcrypt before they are stored.
- JWT-protected API endpoints.
- Add an optional profile photo during registration; edit your name, bio, location, website, profile photo and cover image later.
- Switch an account between public and private.
- Follow and unfollow other members.

### Social feed
- Create text posts and image posts.
- Upload JPG, PNG, WEBP and GIF images (up to 8 MB each).
- Edit captions and delete your own posts.
- Like and unlike posts; add and delete comments (authors and post owners can delete comments).
- Bookmark posts and copy a shareable post URL.
- Detect hashtags and create mention notifications using `@username`.
- Explore community posts and trending hashtags.
- 24-hour image stories, with view tracking and story deletion by the owner.

### Community and messaging
- Search for members and browse suggested accounts.
- Notifications for likes, comments, follows, mentions and messages.
- Direct conversations backed by MongoDB.
- Socket.IO events for live message delivery, online presence, typing indicators and live emoji reactions.
- Message read state is updated when a conversation is opened.

### Interface
- Separate landing, sign-in, registration, feed, explore, profile, messages, notifications and settings pages.
- Responsive layouts for desktop, tablet and mobile screens.
- Light and dark themes. The selected theme is saved in `localStorage`.
- Loading skeletons, toast feedback, modal story viewer and small interaction animations.

## Technology stack

| Layer | Technologies |
| --- | --- |
| Frontend | React 18, Vite, JavaScript, HTML5, CSS3 |
| Navigation | React Router |
| UI | Lucide React, Framer Motion, custom responsive CSS |
| Backend | Node.js, Express |
| Database | MongoDB with Mongoose |
| Authentication | JWT and bcryptjs |
| Real-time | Socket.IO |
| Image uploads | Multer with local file storage |

## Folder structure

```text
CodeAlpha_Connectify/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── styles/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   ├── index.html
│   └── package.json
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── sockets/
│   ├── uploads/
│   ├── .env.example
│   ├── server.js
│   └── package.json
├── .gitignore
├── package.json
└── README.md
```

## Requirements

Install the following before running the project:

- **Node.js 20 or newer** (Node.js 22 LTS is recommended).
- npm (included with Node.js).
- **MongoDB Community Server** running locally, or a MongoDB Atlas connection string.
- VS Code or Cursor (recommended editor).

## Run locally on Windows

### 1. Open the project

Extract the ZIP file. Open the folder named `CodeAlpha_Connectify` in VS Code or Cursor. Open the integrated terminal in that root folder.

### 2. Start MongoDB

For a local MongoDB installation, make sure the MongoDB service is running. The default connection used by this project is:

```text
mongodb://127.0.0.1:27017/connectify
```

If you use MongoDB Atlas, create a database user and replace the local URI with your Atlas connection string in the environment file. Do not commit the connection string.

### 3. Configure the backend

Copy `server/.env.example` and name the copy `.env` inside the same `server` folder. In PowerShell:

```powershell
Copy-Item server/.env.example server/.env
```

Open `server/.env` and set a new random `JWT_SECRET` (at least 32 characters). Example configuration:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/connectify
JWT_SECRET=put_a_long_random_secret_string_here_at_least_32_chars
CLIENT_URL=http://localhost:5173
```

Keep the `.env` file private. It is excluded from Git by `.gitignore`.

### 4. Install packages

From the project root, run:

```bash
npm run install:all
```

This installs the frontend and backend dependencies.

### 5. Start the application

Keep MongoDB running, then run from the project root:

```bash
npm run dev
```

The frontend is available at **http://localhost:5173** and the backend API is available at **http://localhost:5000**.

The backend health check is:

```text
http://localhost:5000/api/health
```

### 6. Create an account

Open the frontend URL, choose **Join Connectify**, and register with your name, username, email and a password of at least 8 characters. Sign in with the email or username you registered.

## Run frontend and backend separately

Open two terminals in the project root.

**Terminal 1 — backend:**

```bash
npm run dev --prefix server
```

**Terminal 2 — frontend:**

```bash
npm run dev --prefix client
```

## Environment variables

### Backend (`server/.env`)

| Variable | Purpose | Default |
| --- | --- | --- |
| `PORT` | Express and Socket.IO server port | `5000` |
| `NODE_ENV` | Runtime mode | `development` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/connectify` |
| `JWT_SECRET` | Secret used to sign authentication tokens | Must be supplied by you |
| `CLIENT_URL` | Allowed frontend origin for CORS and Socket.IO | `http://localhost:5173` |

### Frontend (`client/.env`, optional)

Copy `client/.env.example` to `client/.env` only when you need to change the backend URL. The default is `http://localhost:5000/api`.

## API overview

All routes below are prefixed with `/api`. Routes other than registration, login and health require a valid bearer token.

| Area | Endpoints |
| --- | --- |
| Authentication | `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `PATCH /auth/password` |
| Users | `GET /users/search`, `GET /users/suggested`, `GET /users/:username`, `PATCH /users/me`, `POST /users/:id/follow`, `GET /users/:id/posts` |
| Posts | `GET /posts/feed`, `GET /posts/explore`, `POST /posts`, `PATCH /posts/:id`, `DELETE /posts/:id`, `POST /posts/:id/like` |
| Comments | `GET /posts/:id/comments`, `POST /posts/:id/comments`, `DELETE /posts/:id/comments/:commentId` |
| Bookmarks | `POST /users/bookmarks/:id`, `GET /users/bookmarks` |
| Stories | `GET /stories`, `POST /stories`, `POST /stories/:id/view`, `DELETE /stories/:id` |
| Notifications | `GET /notifications`, `PATCH /notifications/read` |
| Messaging | `GET /messages/conversations`, `POST /messages/conversations`, `GET /messages/:id`, `POST /messages/:id`, `PATCH /messages/:id/reaction` |

## Database models

The server uses Mongoose models for `User`, `Post`, `Comment`, `Story`, `Notification`, `Conversation` and `Message`. Followers, following, likes, bookmarks, story viewers and message read receipts are represented through MongoDB references. `$addToSet` and unique user/email/username indexes are used to avoid duplicate follow relationships, likes are toggled on the post document, and message membership is checked before protected conversation operations.

## Image storage

Images are saved locally in `server/uploads` and served through `/uploads/...`. This makes the project straightforward to run locally. For a deployed production application, use a managed image service such as Cloudinary or object storage and configure its credentials through environment variables.

## Screenshots

Add your own screenshots here after starting the project. Suggested screenshots:

- Landing page (light and dark themes)
- Home feed with a post and story strip
- Explore page
- User profile and settings
- Real-time messages and notifications

## GitHub submission

From the project root:

```bash
git init
git add .
git commit -m "Build Connectify social media platform"
git branch -M main
git remote add origin <YOUR_GITHUB_REPOSITORY_URL>
git push -u origin main
```

Before pushing, confirm that `.env`, `node_modules`, `client/dist` and private database credentials are not included. The provided `.gitignore` excludes them.

## Future improvements

- Cloudinary or S3 image storage for deployment.
- Follow requests and approval workflow for private accounts.
- Message pagination, attachment sharing and stronger delivery/read receipt UX.
- Report, block and moderation tools.
- Automated backend and frontend tests, CI workflow and production deployment configuration.

## Internship reference

**CodeAlpha — Full Stack Development Internship**  
**Task 2 — Social Media Platform**  
Project: **CONNECTIFY – Connect. Share. Discover.**
