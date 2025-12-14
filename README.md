# Travel Agency Dashboard

A minimal internal web app to track vehicles and trips for a small agency.

## Tech Stack
- **Next.js** (App Router)
- **Firebase Auth + Firestore**
- **Vanilla CSS Modules** (no Tailwind)
- **pnpm** Package Manager

## Features
- **Authentication**: Firebase Email/Password Login.
- **Dashboard**: Summary stats, Today's trips, Upcoming vehicle expiries.
- **Vehicles Management**: CRUD operations, track expiry dates.
- **Trips Management**: Log trips, calculate amounts, filter by date/vehicle/status.
- **Reports**: Generate simple date-range reports for revenue and vehicle utilization.

## Setup

1. **Install Dependencies**:
   ```bash
   pnpm install
   ```

2. **Environment Variables**:
   Create a `.env.local` file with your Firebase configuration:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

   *Note: Access to Firestore requires Authentication.*

3. **Run Locally**:
   ```bash
   pnpm dev
   ```

4. **Build**:
   ```bash
   pnpm build
   ```

## Design
- **Theme**: Dark premium theme using CSS variables (`app/globals.css`).
- **Icons**: Lucide React.
- **Font**: Outfit (Google Fonts).

## Project Structure
- `app/`: Next.js App Router pages.
- `components/`: Reusable UI components (`ui`, `layout`).
- `lib/`: Firebase init, services, hooks.
- `types/`: TypeScript definitions.
