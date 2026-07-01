# AI Expense Manager

A modern, AI-powered expense management web application built with React, Node.js, Express, and MongoDB.

## Features

- **Expense Tracking**: Add, edit, delete expenses with categories and attachments
- **Recurring Expenses**: Daily/weekly/monthly/yearly recurring expense support
- **AI-Powered Features**:
  - Smart expense categorization using AI
  - OCR bill scanning to auto-fill expense details
- **Budget Management**: Set and track monthly budgets
- **Multi-Currency Support**: USD, INR, EUR, GBP
- **Data Export**: Export expenses to CSV
- **Authentication**: JWT-based secure login/register
- **Admin Dashboard**: Admin-only features for user management
- **Responsive Design**: Modern UI with glassmorphism effects

## Tech Stack

- **Frontend**: React, Tailwind CSS, Vite
- **Backend**: Node.js, Express
- **Database**: MongoDB
- **AI Integration**: Custom AI endpoints for categorization and OCR
- **Authentication**: JWT (JSON Web Tokens)
- **Deployment**: Vercel (frontend), Cloud platform (backend)

## Installation

### Prerequisites

- Node.js (v16 or higher)
- MongoDB
- npm or yarn

### Backend Setup

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the server directory:
```
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
PORT=5000
```

4. Start the backend server:
```bash
npm start
```

### Frontend Setup

1. Navigate to the client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the client directory:
```
VITE_API_URL=http://localhost:5000
```

4. Start the frontend dev server:
```bash
npm run dev
```

## Usage

1. Register an account or login
2. Add new expenses (optionally with AI features)
3. Set up recurring expenses for regular payments
4. Track budgets and generate reports
5. Export expenses to CSV for further analysis

## Project Structure

```
├── client/               # React frontend
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   └── utils/       # Utility functions
└── server/              # Node.js backend
    ├── middleware/      # Auth and admin middleware
    ├── models/          # MongoDB schemas
    ├── routes/          # API routes
    └── utils/           # Recurring expense logic
```

## License

MIT



<!-- EXCALIDRAW, eraser.io, TLDRAW, LucidChart , WhiteBoard  -->