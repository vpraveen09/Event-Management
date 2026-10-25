# Event Management

A full-stack event management app.

- **Backend**: Node/Express + SQLite (`server/`) — organizer auth (JWT), events, ticket types, registrations.
- **Frontend**: React + Vite (`client/`) — public event listing/registration, organizer dashboard.

## Run locally

```
npm run install:all
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:4000

## Features

- Organizer sign up / log in (JWT auth)
- Create, edit, delete events with ticket types and capacity
- Public event listing and detail pages
- Attendee registration (no account needed)
- Organizer dashboard: manage events, view attendee lists per event
