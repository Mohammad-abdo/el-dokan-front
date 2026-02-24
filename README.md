# Green RX Dashboard

Modern React dashboard for Green RX Pharmacy Management System with authentication, animations, and backend integration.

## Features

- ✅ **Modern UI** - Built with Tailwind CSS and shadcn/ui components
- ✅ **Smooth Animations** - Powered by Framer Motion
- ✅ **Authentication** - JWT-based auth with admin-only access
- ✅ **Protected Routes** - Role-based access control
- ✅ **Responsive Design** - Works on desktop and mobile
- ✅ **Backend Integration** - Connected to Green RX API

## Tech Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS v4
- Framer Motion (animations)
- React Router (routing)
- Axios (API client)
- shadcn/ui (components)

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create `.env` file (optional):**
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   ```
   http://localhost:5173
   ```

## Default Login

- **Email:** `admin@greenrx.com`
- **Password:** `admin123`

## Project Structure

```
src/
├── components/        # Reusable components
│   ├── Layout.tsx     # Main layout with sidebar
│   └── ProtectedRoute.tsx
├── contexts/          # React contexts
│   └── AuthContext.tsx
├── lib/               # Utilities
│   └── api.ts         # Axios API client
├── pages/             # Page components
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   ├── Medicines.tsx
│   └── ...
└── App.tsx            # Main app component
```

## Backend Connection

The dashboard connects to the backend API at `http://localhost:5000/api` by default.

Make sure the backend server is running:
```bash
cd ../backend
npm run dev
```

## Available Routes

- `/login` - Login page
- `/dashboard` - Main dashboard (admin only)
- `/dashboard/medicines` - Medicines management
- `/dashboard/patients` - Patients list
- `/dashboard/doctors` - Doctors list
- `/dashboard/prescriptions` - Prescriptions
- `/dashboard/appointments` - Appointments
- `/dashboard/lab-tests` - Lab tests
- `/dashboard/orders` - Orders

## Authentication

- JWT tokens are stored in `localStorage`
- Tokens are automatically added to API requests
- 401 errors automatically redirect to login
- Only admin users can access the dashboard

## Development

```bash
# Development
npm run dev

# Build
npm run build

# Preview production build
npm run preview
```
