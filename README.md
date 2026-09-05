# Aerotech Bhutan — Company Calendar & Staff Portal

Internal company portal for schedules, meetings, events, leave, announcements, and a centralized company calendar.

## Project Structure

```
CompanyCalender/
├── frontend/          # React 19 + TypeScript + Vite + Tailwind CSS
├── backend/
│   └── CompanyCalendar.Api/   # ASP.NET Core 9 Web API + EF Core + SQL Server
└── CompanyCalendar.sln
```

## Quick Start (Demo Mode)

The frontend runs in **mock mode** by default — no backend required.

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

**Demo accounts:**
- Admin: `admin@aerotech.bt` / `Admin@123`
- Employee: `employee@aerotech.bt` / `Employee@123`

## Full Stack Setup

### Prerequisites
- Node.js 18+
- .NET 9 SDK
- SQL Server (LocalDB or full instance)

### Backend

1. Update the connection string in `backend/CompanyCalendar.Api/appsettings.json`
2. Run the API:

```bash
cd backend/CompanyCalendar.Api
dotnet restore
dotnet run
```

API: [http://localhost:5000](http://localhost:5000) — Swagger at `/swagger`

### Frontend (API mode)

Set in `frontend/.env`:

```
VITE_USE_MOCK=false
VITE_API_URL=http://localhost:5000/api
```

```bash
cd frontend
npm run dev
```
