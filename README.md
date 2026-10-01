# Food Wave — Food Delivery App

Food Wave is a full-stack food delivery application built with React and
Express. Customers can browse restaurants and menus, add food to a cart, place
Cash on Delivery orders, track order statuses, and view or print an invoice.
An administrator can manage restaurants, menu items, and orders.

## Features

- Restaurant browsing with cuisine/category filters and food details
- Cart and checkout with server-calculated item prices, tax, and delivery fee
- Cash on Delivery checkout
- Customer registration, login, and authenticated order history
- Order tracking with automatic status refresh
- Demo order status progression: `Placed` → `Accepted` → `Preparing` →
  `Out for Delivery` → `Delivered` (three minutes between stages)
- Estimated arrival countdown based on the restaurant's delivery-time range
- Printable order invoices
- Administrator dashboard for managing orders, restaurants, and food items
- MongoDB persistence through Mongoose

> **Demo behavior:** Automatic status progression is for demonstration only;
> it does not represent real restaurant or courier activity. Keep the backend
> running for automatic transitions. Public registration creates customer
> accounts only. Privileged accounts must be provisioned by a trusted
> administrator.

## Tech stack

- **Frontend:** React 19, Vite, React Router, Tailwind CSS, Axios, Lucide
- **Backend:** Node.js, Express 5, Mongoose
- **Database:** MongoDB
- **Authentication:** JSON Web Tokens and bcrypt

## Requirements

- Node.js 18 or newer and npm
- MongoDB running locally, or a MongoDB connection string

## Setup

### 1. Clone the repository

```bash
git clone <your-github-repository-url>
cd FoodDeliveryApp
```

### 2. Configure the backend

```bash
cd Backend
npm install
cp .env.example .env
```

Edit `Backend/.env` and set at least:

```env
PORT=5001
MONGODB_URL=mongodb://127.0.0.1:27017/food-delivery
JWT_SECRET=replace-with-a-long-random-secret
```

Use a unique, randomly generated `JWT_SECRET` for each deployed environment.
The example MongoDB URL is for a local MongoDB server; replace it with your
MongoDB Atlas connection string if you use Atlas.

Cash on Delivery works without payment-provider credentials. The current
customer checkout offers Cash on Delivery; online payment integrations are not
enabled in that checkout flow. Optional Razorpay and Cashfree backend settings
are documented in [Backend/README.md](./Backend/README.md). Never commit `.env`
or paste secret values into source code.

### 3. Install frontend dependencies

From the repository root:

```bash
cd Frontend
npm install
```

### 4. Start the backend and frontend

Open two terminals from the repository root.

Terminal 1 — backend:

```bash
cd Backend
npm run dev
```

The API listens on `http://localhost:5001`.

Terminal 2 — frontend:

```bash
cd Frontend
npm run dev
```

Open the Vite URL printed in the terminal, usually
`http://localhost:3000`. The Vite development server proxies `/api` requests to
the backend on port `5001`.

Alternatively, from the repository root, use the convenience scripts:

```bash
npm run backend
npm run frontend
```

Run each command in a separate terminal.

## Optional sample data

The seed script adds sample restaurants, categories, and menu items:

```bash
cd Backend
node seed.js
```

> **Warning:** The seed script deletes existing categories, restaurants, and
> food items before inserting its sample data. Do not run it against a
> production database.

## Administrator account

Public sign-up always assigns the `customer` role. To provision the single
administrator, create a normal account through the app and have a trusted
operator assign the `admin` role to that account directly in the intended
MongoDB database (for example, using MongoDB Compass). Do not expose an
administrator registration option or share database credentials. Sign in
again after changing the role so the application receives a token for the
updated account.

## Useful commands

Frontend:

```bash
cd Frontend
npm run dev
npm run build
npm run lint
npm run preview
```

Backend:

```bash
cd Backend
npm run dev
npm start
```

## Project structure

```text
FoodDeliveryApp/
├── Backend/
│   ├── config/           # MongoDB connection
│   ├── controllers/      # API business logic
│   ├── jobs/             # Automatic order status scheduler
│   ├── middleware/       # Authentication and authorization
│   ├── models/           # Mongoose schemas
│   ├── routes/           # Express API routes
│   ├── .env.example      # Backend environment template
│   └── server.js         # API entry point
├── Frontend/
│   └── src/
│       ├── components/   # Shared UI components
│       ├── context/      # Authentication and cart state
│       └── pages/        # Application screens
└── README.md
```

## Troubleshooting

- **MongoDB connection fails:** Confirm MongoDB is running and `MONGODB_URL`
  points to the correct database.
- **Frontend cannot reach the API:** Start the backend on port `5001` and
  check `Backend/.env`.
- **Order status does not advance:** Keep the backend process running; the
  demo status scheduler runs in the backend.
- **Admin dashboard access is denied:** Confirm the account has been
  provisioned as `admin` in the same database configured for the backend, then
  sign out and sign in again.

## Security notes

- Keep `.env` files and database credentials private.
- Use a strong `JWT_SECRET`; do not deploy with the example value.
- Use HTTPS and production-ready MongoDB access controls when deploying.
- Public registration creates customer accounts only; privileged roles should
  be assigned through a trusted process.

## Views

<img width="1470" height="956" alt="Screenshot 2026-10-01 at 6 20 48 PM" src="https://github.com/user-attachments/assets/8306fc71-a065-47b3-aa19-416409affa8a" />

<img width="1470" height="956" alt="Screenshot 2026-10-01 at 6 21 21 PM" src="https://github.com/user-attachments/assets/c01669c1-68d9-4b21-81cc-e30e190a7fd6" />

<img width="1470" height="956" alt="Screenshot 2026-10-01 at 6 21 44 PM" src="https://github.com/user-attachments/assets/73e889d7-a110-41f0-a795-da9ab8b9611e" />

<img width="1470" height="956" alt="Screenshot 2026-10-01 at 6 25 10 PM" src="https://github.com/user-attachments/assets/d8a4a858-6c26-4783-a3cc-eb5e2bd19129" />

<img width="1470" height="956" alt="Screenshot 2026-10-01 at 6 25 31 PM" src="https://github.com/user-attachments/assets/cac7d844-a481-41d4-b860-08b32b22d503" />

 <img width="1470" height="956" alt="Screenshot 2026-10-01 at 6 26 16 PM" src="https://github.com/user-attachments/assets/78872f04-e17f-4bf1-a4ac-2a7f765ca07d" />
 

