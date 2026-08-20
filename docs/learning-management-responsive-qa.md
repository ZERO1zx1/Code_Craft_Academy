# Learning Management Responsive QA

The teacher dashboard, learner project-assessment route, and in-app notification settings were reviewed in the live preview after the development server restart. These checks complement the automated route tests in `server/learning-management.routes.test.tsx`; they do not replace the API, database, and authorization tests in `server/teacher-features.test.ts`.

| Route | Desktop observation (1280px) | Mobile observation (375px) | Result |
|---|---|---|---|
| `/projects/python` | The project brief, submission form, rubric, and later feedback area are arranged in a readable two-column view. | The brief, form, and rubric stack in a single readable column without controls or score labels overlapping. | Passed |
| `/notifications` | Settings switches remain adjacent to their labels and the inbox is visible alongside the preferences panel. | Each setting keeps a full-width label and reachable switch; the inbox stacks below the settings card. | Passed |
| `/teacher` | Learner summary, lesson-update publisher, and project-review section are all visible within the dashboard shell. | Statistic cards stack, the lesson publisher remains usable, and the project-review area follows below without horizontal clipping. | Passed |

The live reviewer account was an admin during the teacher-dashboard check. A non-admin receives the dedicated access-denied state, which is also covered in the route-level component test.
