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

## Deploy for public trials

The Vercel frontend needs a separately hosted backend and a cloud MongoDB
database. For example, deploy the backend as a Render Web Service and use
MongoDB Atlas for the database:

1. Create a MongoDB Atlas database and copy its connection string. Create a
   database user with a strong password, and allow network access from the
   backend host. Atlas's `0.0.0.0/0` option allows connections from anywhere;
   use it only with a strong database password and a dedicated database user.
2. Create a Render Web Service from this repository with **Root Directory**
   `Backend`, **Build Command** `npm install`, and **Start Command** `npm start`.
   Set `MONGODB_URL` to the Atlas connection string, `JWT_SECRET` to a unique
   random secret, and `CORS_ORIGIN` to your Vercel site URL (for example
   `https://your-app.vercel.app`, without a trailing slash). Add more
   comma-separated origins if you need to allow additional Vercel domains.
3. In Vercel, set the project **Root Directory** to `Frontend`, the build
   command to `npm run build`, and the output directory to `dist`. Add the
   environment variable `VITE_API_URL` with your backend's public origin
   (for example `https://your-api.onrender.com`, without a trailing slash).
   Redeploy the frontend after setting or changing this variable.
4. Populate the new database with sample restaurants and menu items only if
   it is empty. The seed script deletes existing sample-data collections, so
   never run it against a database containing data you need to keep. To seed
   from your computer, run `node seed.js` from `Backend` with `MONGODB_URL`
   set to the intended Atlas database.
5. Open the Vercel URL and test browsing, registration, login, and Cash on
   Delivery checkout. Public users can create customer accounts; do not give
   visitors administrator access or production payment credentials.

Keep `MONGODB_URL` and `JWT_SECRET` only in the backend host's environment
settings. `VITE_API_URL` is public and should contain only the backend URL.
Free backend instances may sleep when idle, so the first request after a
period of inactivity can take longer.

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




## Views

<img width="1470" height="956" alt="Screenshot 2026-10-01 at 7 40 43 PM" src="https://github.com/user-attachments/assets/0920dc91-dcb2-49aa-9709-4f656d4cf225" />


<img width="1470" height="956" alt="Screenshot 2026-10-01 at 6 21 21 PM" src="https://github.com/user-attachments/assets/ce988c99-50c1-4a5d-80f9-b5616a2dd654" />

<img width="1470" height="956" alt="Screenshot 2026-10-01 at 6 21 44 PM" src="https://github.com/user-attachments/assets/5303ef64-f2fd-40d1-8584-27efa17ab052" />

<img width="1470" height="956" alt="Screenshot 2026-10-01 at 6 25 10 PM" src="https://github.com/user-attachments/assets/ae28db0f-2b1c-4430-8bf2-2e9b8ef68638" />



<img width="1470" height="956" alt="Screenshot 2026-10-01 at 6 25 31 PM" src="https://github.com/user-attachments/assets/22a354d7-d0e1-4f9a-957c-4cdd6e960821" />

<img width="1470" height="956" alt="Screenshot 2026-10-01 at 6 26 24 PM" src="https://github.com/user-attachments/assets/c3950e55-da24-4a4f-90dc-c1abab535aea" />


<img width="1470" height="956" alt="Screenshot 2026-10-01 at 6 26 16 PM" src="https://github.com/user-attachments/assets/c1e9e5e8-07a9-4aed-875d-6b3f661e98e6" />







