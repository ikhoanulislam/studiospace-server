# StudioSpace — Backend API

StudioSpace is a studio rental and booking platform backend built with Node.js, Express.js, and MongoDB. It provides REST APIs for user authentication, studio management, bookings, host applications, and administrative operations.

## Features

- User registration and login with JWT authentication.
- HTTP-only cookie-based authentication.
- Google authentication support.
- Studio creation, viewing, updating, and deletion.
- Studio booking management.
- Booking cancellation and host confirmation.
- Host application and approval management.
- Admin and host role-based access control.
- MongoDB database integration.

## Technology Stack

- Node.js
- Express.js
- MongoDB
- Mongoose
- JSON Web Token (JWT)
- Cookie Parser
- CORS
- JavaScript

## Project Structure

```text
server/
├── src/
│   ├── middleware/
│   │   ├── admin.js
│   │   └── auth.js
│   ├── models/
│   │   ├── Booking.js
│   │   ├── Contact.js
│   │   ├── HostApplication.js
│   │   ├── Studio.js
│   │   └── User.js
│   ├── scripts/
│   │   ├── activateApprovedHost.js
│   │   └── makeAdmin.js
│   ├── seedStudios.js
│   └── server.js
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/ikhoanulislam/studiospace-server.git
```

### 2. Navigate to the Project

```bash
cd studiospace-server
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

Create a `.env` file in the project root directory.

Add your MongoDB connection string:

```env
PORT=5002
MONGODB_URI=your_mongodb_connection_string
```

Also configure the JWT secret and any other environment variables required by the backend source code.

**Important:** Never share or upload your real `.env` file or database credentials to GitHub.

### 5. Run the Development Server

```bash
npm run dev
```

Backend API will run at:

`http://localhost:5002`

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/signup` | Register a user |
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/google` | Google login |
| POST | `/api/auth/logout` | User logout |
| GET | `/api/auth/me` | Get logged-in user |

### Studios

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/studios` | Get all studios |
| GET | `/api/studios/:id` | Get studio details |
| POST | `/api/studios` | Create a studio |
| PUT | `/api/studios/:id` | Update a studio |
| DELETE | `/api/studios/:id` | Delete a studio |
| GET | `/api/my-studios` | Get host's studios |

### Bookings

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/bookings` | Create a booking |
| GET | `/api/bookings` | Get user bookings |
| PATCH | `/api/bookings/:id/cancel` | Cancel a booking |
| GET | `/api/host/bookings` | Get host bookings |
| PATCH | `/api/host/bookings/:id/confirm` | Confirm a booking |

### Host Applications

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/host/application` | Get host application |
| POST | `/api/host/apply` | Submit host application |

## Authentication & Security

- JWT-based authentication.
- HTTP-only authentication cookies.
- Protected routes using authentication middleware.
- Role-based access for hosts and administrators.
- CORS configured for the frontend application.

## Frontend Repository

[StudioSpace Client](https://github.com/ikhoanulislam/studiospace-client)

## Project Repository

[StudioSpace Server](https://github.com/ikhoanulislam/studiospace-server)

## Developer

**Ikhoanul Islam**

Civil Engineering Student  
Gopalganj Science and Technology University

---

*StudioSpace — Find Your Perfect Creative Space.*