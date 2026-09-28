# CodeReview AI

**CodeReview AI** is an autonomous code review dashboard for engineering teams. It brings repository health, pull request reviews, security findings, team standards, architecture rules, and agent memory into one interface.

The app includes an interactive React dashboard and an Express API. Add a Gemini API key to enable provider-backed code reviews; the Review Code Studio also includes a local static-analysis fallback for supported checks.

## Features

- **Dashboard:** code health metrics, lines scanned, estimated time saved, quality trends, open findings, and agent confidence.
- **Repositories:** connected repository overview, health scores, branch information, and review actions.
- **Review Code Studio:** submit code for an AI review and inspect suggested fixes.
- **Pull Requests:** review sample active pull requests from the dashboard.
- **Security Analysis:** inspect security-related findings and their severity.
- **Review History:** review activity and audit information.
- **Team Standards and Architecture Rules:** view and manage review rules and architectural boundaries.
- **Agent Memory:** inspect learned team preferences and confidence scores.
- **Analytics & Debt:** view code review and technical debt metrics.
- **Team Members and Settings:** manage the demo workspace and review preferences.
- **Responsive, minimal black interface** with a fixed navigation sidebar.

## Tech stack

- React 19 and TypeScript
- Vite 6
- Tailwind CSS 3
- Recharts and Lucide icons
- Express 5 API
- Gemini API for provider-backed reviews

## Requirements

- Node.js 20 or later
- npm
- A Gemini API key to enable provider-backed reviews (optional for the local UI and static fallback)

## Getting started

The application files are in the `code_review_agent 444` directory. From the repository root, run:

```powershell
cd "code_review_agent 444"
npm install
```

Create a `.env` file in that directory. You can start from `.env.example`:

```env
GEMINI_API_KEY=your_gemini_api_key
PORT=3001
CLIENT_ORIGIN=http://localhost:5173
```

Keep the API key private. The `.env` file is excluded from Git; do not commit credentials.

Start the frontend and API together:

```powershell
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The development server proxies `/api` requests to the Express API at `http://localhost:3001`.

## Available scripts

Run these from `code_review_agent 444`:

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite frontend and Express API in watch mode |
| `npm run dev:client` | Start only the Vite frontend |
| `npm run dev:server` | Start only the Express API in watch mode |
| `npm run build` | Type-check and create a production frontend build in `dist/` |
| `npm run preview` | Preview the production frontend build |
| `npm start` | Start the Express API |
| `npm run lint` | Run TypeScript checks without emitting files |

## API

### `GET /api/health`

Returns the API health status.

### `POST /api/reviews`

Accepts JSON containing `code` and an optional `repoId`. With `GEMINI_API_KEY` configured, it returns AI-generated findings. Requests must include non-empty code and are limited to 100,000 characters.

## Project structure

```text
.
├── README.md
└── code_review_agent 444/
    ├── server/             # Express API
    ├── code_review_agent.tsx # Main React application and views
    ├── main.tsx            # React entry point
    ├── index.css           # Global and theme styles
    ├── vite.config.ts      # Vite config and API proxy
    ├── package.json
    └── .env.example
```

## Notes

This project currently uses sample repositories, findings, pull requests, and team members to demonstrate the interface. Connectors for GitHub repositories, pull request synchronization, and persistent storage are not configured by default.

## License

No license has been specified yet. Add a `LICENSE` file before distributing this project under an open-source license.
