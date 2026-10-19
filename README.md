# Retain Frontend

React + TypeScript + Vite frontend for Retain.

## Live Deployment

Frontend (Vercel): https://retain-app-frontend-virid.vercel.app/

Backend API (Render): https://retainapp-backend.onrender.com

## Local Development

Install dependencies:

powershell
npm install

Run development server:

powershell
npm run dev

Build for production:

powershell
npm run build

## Environment Variable

Set this in Vercel project settings:

VITE_API_URL=https://retainapp-backend.onrender.com/api

## Demo Coverage Checklist (Summative)

- Expense management: create, update, delete, open details, responsive views
- Search, filters, sorting: category, payment method, date range, date/amount sorting
- Budget + dashboard: monthly budget, status, total spent, remaining, highest expense, by-category and recent expenses
- Authentication and authorization: sign up, sign in, sign out, protected routes, admin-only access
- Admin dashboard: category CRUD + required platform insights
- Deployment proof: run demo from deployed frontend with deployed backend/database

## Demo Recording Notes

- Use deployed app for the full walkthrough.
- Keep one normal user and one admin account ready.
- Ensure preloaded data exists for filters, dashboard, and admin insights.
- Briefly show code for:
	- React Context auth and protected routes
	- Redux filter/search/sort state
	- API integration layer
	- Backend role checks for admin routes
