# Migration Status: Express to Next.js API Routes

The backend logic has been fully migrated from the external Express server (`backend/`) to Next.js API Routes located in `frontend/app/api/`.

## Architecture Changes
- **Database**: Prisma Schema moved to `frontend/prisma/schema.prisma`.
- **API**: All REST endpoints are now at `frontend/app/api/*`.
- **Auth**: Replaced token-based Express middleware with built-in NextAuth session verification.
- **Shared Logic**: Business logic (allocator, skills, mailer) moved to `frontend/lib/`.

## Cleanup
The `backend/` folder is now obsolete. You can safely stop the Express server.

## Running the App
1. Navigate to `frontend`.
2. Ensure `.env` contains your `DATABASE_URL` and `NEXTAUTH_SECRET`.
3. Run `npm run dev` to start the full-stack application (Frontend + API).
