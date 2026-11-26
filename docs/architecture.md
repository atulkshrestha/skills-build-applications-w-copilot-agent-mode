# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- **Presentation tier decision**: React components (Activities, Teams, Leaderboard, Workouts) use `src/api/client.ts` to fetch data from `/api` endpoints. Each component implements four states: loading (spinner), empty (meaningful message), success (rendered data), and error (accessible alert). React Router handles navigation between routes.

- **Logic tier decision**: Express TypeScript routes and service functions implement business logic. Routes validate input and return deliberate 4xx responses (never 500s from cast errors) for invalid requests. Services handle data aggregation and filtering. All routes live under `/api/`.

- **Data tier decision**: Mongoose schemas define User, Team, Activity, and Workout models with validation rules. Required fields are enforced at the schema level. The seed script uses upserts to maintain stable demo data without clearing existing records.

- **Activity tracking approach**: POST `/api/activities` accepts `userId`, `teamId`, `type`, and `minutes`; validates that both IDs reference existing documents; calculates `points` from `minutes`; and stores with `occurredAt` timestamp. GET `/api/activities` returns the full list. Invalid IDs return 400, not 500.

- **Team management approach**: POST `/api/teams` requires `name` and `mascot`; rejects payloads without a name with 400. Teams store a `members` array of User IDs. GET `/api/teams` lists all teams with their members populated.

- **Leaderboard approach**: GET `/api/leaderboard` aggregates activities by team, sums points per team, and ranks teams by total points (highest first). Each entry includes `teamName`, `totalPoints`, and 1-based `rank`.

- **Workout suggestions approach**: GET `/api/workouts/suggestions/:userEmail` finds the user, analyzes their recent activity types, and returns suggestions matching their fitness goal or most frequent activity. Each suggestion includes `title`, `focus`, `difficulty`, `minutes`, and a `reason` field explaining why the suggestion matches.

## Test plan

Record the commands you run and what each failure means.

- **Data-tier command**: `npm run test:data --prefix octofit-tracker/backend` — Validates Mongoose schema constraints. Expects User to enforce `name`, `email`, and `fitnessGoal`; Team to enforce `name`, `mascot`, and `members` array; Activity to enforce `type`, `user`, `team`, `minutes`, and `points`; Workout to enforce `focus`, `minutes`, and `difficulty`. Failures indicate missing or incomplete validation rules in model schemas.

- **API command**: `npm run test:api --prefix octofit-tracker/backend` — Validates API contracts and HTTP behavior. Tests that POST endpoints return 400 (not 501) for invalid input, that GET endpoints return correct response shapes and status codes, that validation rejects malformed IDs with 4xx (never 500), and that leaderboard and suggestion endpoints compute and return expected data. Failures indicate missing routes, unhandled validation, or incorrect response formats.

- **Frontend command**: `npm test --prefix octofit-tracker/frontend` — Validates component rendering and accessibility. Tests that each route (Activities, Teams, Leaderboard, Workouts) shows a loading state while fetching, an empty state when no data is available, the correct data when the API succeeds, and an accessible error alert when the API fails. Failures indicate missing state management, absent components, or inaccessible UI.

- **Backend build command**: `npm run build --prefix octofit-tracker/backend` — Compiles TypeScript to JavaScript. Catches type errors in routes, services, and models. Must succeed before the API can run.

- **Frontend build command**: `npm run build --prefix octofit-tracker/frontend` — Builds optimized Vite bundle. Catches TypeScript errors and missing imports in components. Must succeed before deployment.
