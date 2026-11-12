# LabTrack — Laboratory Equipment Tracking System

A MERN-stack web application for managing laboratory equipment, tracking inventory, and handling equipment issue and return operations.

## Features

### Dashboard
- View total equipment inventory.
- Track available, issued, and maintenance equipment.
- Monitor overdue equipment.
- View active allocations.

### Equipment Management
- Add new equipment.
- Edit existing equipment details.
- Delete equipment when it is not issued.
- Search equipment by name.
- Filter by category and status.
- Store equipment records in MongoDB.

### Issue and Return Management
- Issue available equipment to a borrower.
- Record the expected return date.
- Track the issue date and borrower.
- Identify overdue equipment.
- Record equipment returns.
- Automatically update equipment availability.

### Data Protection
- Prevent issuing equipment that is unavailable or requires maintenance.
- Prevent direct status changes for issued equipment.
- Prevent deletion of issued equipment.
- Require the issue workflow to allocate equipment.

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React, Vite, JavaScript, CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas, Mongoose |
| API communication | REST API, Axios |
| API testing | Postman |
| Development tools | VS Code, Git, GitHub |

## Project Structure

```text
LabTrack/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── server.js
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── index.css
│   └── package.json
│
├── docs/
├── .gitignore
└── README.md
```

## Installation and Setup

### Prerequisites

- Node.js and npm
- MongoDB Atlas account
- Git
- VS Code

### 1. Clone the repository

```bash
git clone https://github.com/trisha-uskelwar/laboratory-equipment-tracking-system
cd LabTrack
```

### 2. Set up the backend

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend` directory:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
```

Start the backend:

```bash
npm run dev
```

The backend runs at:

`http://localhost:5000`

### 3. Set up the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local frontend URL displayed by Vite, normally:

`http://localhost:5173`

## REST API Endpoints

Base URL: `http://localhost:5000/api/equipment`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Retrieve all equipment |
| GET | `/:id` | Retrieve equipment by ID |
| POST | `/` | Add new equipment |
| PUT | `/:id` | Update equipment |
| DELETE | `/:id` | Delete equipment |
| POST | `/:id/issue` | Issue equipment |
| POST | `/:id/return` | Record equipment return |

## Database

LabTrack uses MongoDB to persist equipment records.

Each equipment record includes:
- Equipment name
- Category
- Laboratory
- Condition
- Availability status
- Borrower information
- Issue date
- Expected return date

## Testing

API endpoints were tested using Postman.

The application was also checked for:
- Equipment creation, editing, and deletion.
- Data persistence after browser refresh.
- Equipment issue and return operations.
- Overdue equipment tracking.
- Backend protection against invalid equipment operations.
- Successful frontend production build.

## Production Build

To generate the frontend production build:

```bash
cd frontend
npm run build
```

The generated files are stored in `frontend/dist`.

## Future Improvements

- User authentication and role-based access.
- Admin and laboratory staff dashboards.
- Equipment usage and allocation history.
- Email notifications for overdue equipment.
- Deployment with publicly accessible frontend and backend.
- Advanced inventory analytics.

## Author

Developed as a hands-on MERN-stack project to demonstrate frontend development, REST API integration, database operations, and full-stack application development.