# Career Stack

Career Stack is a career platform focused on accurate job matching, especially for freshers.

## Main features
- Candidate registration and login
- Fresher / experienced profile
- Skills and preferred location
- Job search and filters
- Experience-accurate matching
- Skill match percentage
- Apply to jobs
- Application status tracking
- Interview preparation questions
- Skill-gap information
- PostgreSQL database
- React frontend
- Express backend
- Render deployment configuration

## Local setup

1. Create a PostgreSQL database.
2. Copy `server/.env.example` to `server/.env`.
3. Add your `DATABASE_URL` and `JWT_SECRET`.
4. From the root:
   - `npm install`
   - `npm run install-all`
   - `npm run dev`

## Render

Create a PostgreSQL database on Render and copy its internal connection string into the web service environment variable `DATABASE_URL`.

Set:
- `JWT_SECRET` = a strong random secret
- `NODE_ENV` = production

The included `render.yaml` can be used as the deployment configuration.

## Important

This first version uses manually created job data through the database. It does not scrape LinkedIn/Naukri. Recruiter/admin functionality can be added as the next phase.
