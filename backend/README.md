# Backend

This folder contains a starter Express + MongoDB backend for the SaaS app.

## Structure

- `src/schemas/user.schema.js` for the Mongoose schema and hooks
- `src/models/user.model.js` for the compiled Mongoose model
- `src/controllers/` for request handlers
- `src/routes/` for API wiring

## Setup

1. Copy `backend/.env.example` to `backend/.env`.
2. Fill in your MongoDB connection string and JWT secret.
3. Install dependencies with `npm install` inside `backend/`.
4. Start the API with `npm run dev`.

## Included routes

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/users`
- `POST /api/users`
- `GET /api/users/:userId`
- `PATCH /api/users/:userId`
- `DELETE /api/users/:userId`
- `GET /api/users/me`
- `PATCH /api/users/me`

## Notes

The user model is ready for admin, employee, and team-lead roles so it can grow with the frontend screens already in this project.