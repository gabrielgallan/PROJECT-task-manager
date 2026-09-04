# Description

A personal productivity application that separates **what** needs to be done from **when** you intend to do it and **what** you actually did. It coordinates three independent, user-owned resources — Tasks (an outcome to accomplish), Plans (calendar time blocks reserving intended work), and Work Logs (records of time actually spent) — plus optional Categories used to visually classify Plans and Work Logs. Links between the resources are optional enhancements, so each module stays useful on its own.

The repository is a monorepo with two projects: `api/`, a NestJS backend, and `web/`, a React frontend.

# Tech Stack

### Backend

<div style="display:flex; flex-direction: column; gap: 0.5rem; margin-bottom: 2rem;">
    <div style="display:flex; align-items:center; gap: 0.5rem;">
        <img src="https://devicons.io/devicons/icons/nodejs-icon.svg" width="25"/> Node.js
    </div>
    <div style="display:flex; align-items:center; gap: 0.5rem;">
        <img src="https://devicons.io/devicons/icons/nestjs.svg" width="25"/> NestJS    
    </div>
    <div style="display:flex; align-items:center; gap: 0.5rem;">
        <img src="https://devicons.io/devicons/icons/docker-icon.svg" width="25"/> Docker
    </div>
    <div style="display:flex; align-items:center; gap: 0.5rem;">
        <img src="https://devicons.io/devicons/icons/postgresql.svg" width="25"/> PostgreSQL
    </div>
    <div style="display:flex; align-items:center; gap: 0.5rem;">
        <img src="https://devicons.io/devicons/icons/redis-icon.svg" width="25"/> Redis
    </div>
</div>

### Frontend

<div style="display:flex; flex-direction: column; gap: 0.5rem; margin-bottom: 2rem;">
<div style="display:flex; align-items:center; gap: 0.5rem;">
        <img src="https://devicons.io/devicons/icons/vite.svg" width="25"/> Vite
    </div>
    <div style="display:flex; align-items:center; gap: 0.5rem;">
        <img src="https://devicons.io/devicons/icons/react.svg" width="25"/> React
    </div>
    <div style="display:flex; align-items:center; gap: 0.5rem;">
        <img src="https://devicons.io/devicons/icons/tailwind-icon.svg" width="25"/> Tailwind CSS
    </div>
</div>

# Documentation

The API is documented with OpenAPI and can be explored in the Swagger UI at `/api/reference`.

Additionally, each project contains its own concise README.md with instructions on how to install and run it locally.
