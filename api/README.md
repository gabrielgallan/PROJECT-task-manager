# Description

The backend of the task manager: a NestJS 11 REST API serving the Identity domain (registration, authentication, profile, credentials, and sessions) and the Task Manager domain (Tasks, Plans, Work Logs, and Categories).

It follows a domain-centered architecture with `core`, `domain`, and `infra` layers, persists data in PostgreSQL through Prisma 7, validates input with Zod, and authenticates requests with opaque session tokens delivered in an HTTP-only cookie. Redis, Cloudinary, and Resend are integrated as adapters behind application ports.

# How to run locally

```bash
# 1. Enter the api directory
cd api

# 2. Install dependencies
pnpm install

# 3. Create and configure .env based on .env.example

# 4. Start the database
docker compose up -d

# 5. Apply the migrations and generate the Prisma client
pnpm prisma migrate dev

# 6. Start the application
pnpm start:dev
```
