# StudioSpace — Backend API

StudioSpace is a RESTful backend API for a creative studio rental and booking platform. It allows users to discover studios, manage bookings, and apply to become hosts. Hosts can manage their studio listings, while administrators can manage platform operations.

## Features

- **User Authentication:** Register and log in using JWT authentication.
- **HTTP-Only Cookies:** Secure cookie-based authentication.
- **Google Authentication:** Support for Google login.
- **Studio Management:** Create, view, update, and delete studio listings.
- **Booking Management:** Create and manage studio bookings.
- **Booking Cancellation:** Allow eligible users to cancel bookings.
- **Host Confirmation:** Hosts can manage booking requests.
- **Host Applications:** Submit and manage host applications.
- **Role-Based Authorization:** Separate permissions for users, hosts, and administrators.
- **Events API:** Manage creative events and experiences.
- **MongoDB Integration:** Store application data using MongoDB and Mongoose.

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
│   │   ├── Event.js
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

Configure the required environment variables:

```env
PORT=5002
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
```

Use the actual variable names required by the backend source code. Never upload real credentials or secret keys to GitHub.

### 5. Run the Development Server

```bash
npm run dev
```

The backend API will run at:

http://localhost:5002

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

### Events

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/events` | Get available events |
| GET | `/api/host/events` | Get host events |
| POST | `/api/events` | Create an event |
| PUT | `/api/events/:id` | Update an event |
| DELETE | `/api/events/:id` | Delete an event |

*Note: Verify all endpoint paths and HTTP methods against the current backend source code before submission.*

## Authentication & Security

- JWT-based authentication.
- HTTP-only authentication cookies.
- Protected routes using authentication middleware.
- Role-based access control for hosts and administrators.
- CORS configured for the frontend application.

## Frontend Repository

[StudioSpace Client](https://github.com/ikhoanulislam/studiospace-client)

## Live Backend

https://studiospace-server-5r5z.onrender.com

## Developer

**Ikhoanul Islam**

Civil Engineering Student  
Gopalganj Science and Technology University

---

*StudioSpace — Find Your Perfect Creative Space.*
