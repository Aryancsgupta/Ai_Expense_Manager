# 🤖 AI Expense Manager

> A feature-rich, modern AI-powered expense tracking and budget forecasting platform.

🌐 **Live Demo**: [https://ai-expense-manager-pi.vercel.app/](https://ai-expense-manager-pi.vercel.app/)

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-brightgreen?style=for-the-badge&logo=vercel)](https://ai-expense-manager-pi.vercel.app/)

---

## 🌟 Key Features

### 1. 🤖 AI-Powered Intelligence
- **AI OCR Bill Scanner**: Upload receipt image files; Tesseract OCR and AI automatically extract item details (title, amount, category, date).
- **AI Bill Splitter**: Scan complex bills/receipts to break down individual line items and automatically split them into separate independent expenses.
- **Smart Categorization**: Auto-suggests expense categories (Food, Transport, Utilities, Entertainment, Health, Shopping, Travel, Education, Other) based on description.
- **AI Budget Forecasting**: Predicts end-of-month spend based on daily velocity, calculates projected totals, identifies high-risk categories, and provides actionable tips to prevent budget overruns.
- **Multi-Language AI Analysis Reports**: Generates personalized spending habit reports and saving tips based on recent transaction history with multi-language support (English, Hindi, Spanish, French, German).

### 2. 🔄 Interactive Recurring Expense Manager
- Set up recurring payment templates (**Daily**, **Weekly**, **Monthly**, **Yearly**).
- Dedicated **Recurring Templates** tab under Expenses to view, track, and manage active templates.
- Automatic background & on-demand generation of child expense entries based on schedule and timezone.

### 3. 🎯 Financial Goals & Savings Tracker
- Set custom financial saving milestones (Target Amount, Current Savings, Deadline).
- Interactive visual progress bars, completion percentage, and remaining amount calculations.
- Quick deposit modal to log new savings toward specific goals.

### 4. 📄 Reports & Data Export
- **Custom PDF Reports with AI Summary**: Download beautifully formatted PDF expense reports (using `jspdf` & `jspdf-autotable`) featuring structured tables and AI savings insights.
- **CSV Data Export**: Export expense records to CSV format for external analysis.

### 5. 💱 Multi-Currency & Conversion
- Native support for **INR (₹)**, **USD ($)**, **EUR (€)**, **GBP (£)**.
- Integrated real-time exchange rate API to auto-convert foreign transactions into the user's preferred currency.

### 6. 📊 Analytics & Budgeting
- Visual dashboards with interactive **Recharts** (Category Breakdown Pie Chart, Spending Trend Charts, Monthly Progress).
### 🎨 8. Dynamic Theme Switcher (11 Custom Color Palettes)
- **Header Theme Integration**: Changing the theme dynamically updates the header background, nav pills, dropdowns, and borders to match seamlessly.
- **11 Curated Themes**:
  - 💜 **Cyber Purple** (Default Glassmorphism)
  - 🔴 **Burnt Sienna** (`#E35336`, `#F5F5DC`, `#F4A460`, `#A0522D`)
  - 🍫 **Chocolate Truffle** (`#713600`, `#C05800`, `#FDFBD4`, `#38240D`)
  - 🧃 **Green Juice** (`#4CBB17`, `#48872B`, `#39542C`, `#293325`)
  - 🌲 **Lush Forest** (`#2E6F40`, `#CFFFDC`, `#68BA7F`, `#253D2C`)
  - 🌌 **Blue Eclipse** (`#272757`, `#8686AC`, `#505081`, `#0F0E47`)
  - ⛵ **Yacht Club** (`#F2F0EF`, `#BBBDBC`, `#245F73`, `#733E24`)
  - 🧂 **Salt & Pepper** (`#FFFFFF`, `#D4D4D4`, `#B3B3B3`, `#2B2B2B`)
  - 🌩️ **Stormy Morning** (`#6A89A7`, `#BDDDFC`, `#88BDF2`, `#384959`)
  - 🌊 **Calm Blue** (`#90D5FF`, `#57B9FF`, `#77B1D4`, `#517891`)
  - 🧊 **Cool & Collected** (`#003135`, `#024950`, `#964734`, `#0FA4AF`, `#AFDDE5`)

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Recharts, Lucide Icons, jsPDF, Axios
- **Backend**: Node.js, Express.js, MongoDB (Mongoose), Multer, Tesseract.js
- **AI Models**: Groq (Llama-3.3-70b-versatile) / OpenAI (GPT-3.5-Turbo)
- **Authentication**: JWT (JSON Web Tokens)

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v16+
- **MongoDB**: Local instance or MongoDB Atlas URI
- **API Keys**: Groq API Key (`gsk_...`) or OpenAI API Key

---

### 1. Server (Backend) Setup

```bash
cd server
npm install
```

Create a `.env` file in the `server` directory:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/ai-expense-manager
JWT_SECRET=your_super_secret_jwt_key
GROQ_API_KEY=gsk_your_groq_api_key_here
# OPENAI_API_KEY=your_openai_api_key_here (optional fallback)
```

Start the backend server:

```bash
npm start
# or for development mode:
npm run dev
```

---

### 2. Client (Frontend) Setup

```bash
cd client
npm install
```

Create a `.env` file in the `client` directory:

```env
VITE_API_URL=http://localhost:5000
```

Start the frontend development server:

```bash
npm run dev
```

Open your browser and navigate to `http://localhost:5173`.

---

## 📁 Project Structure

```
Ai_Expense_Manager/
├── client/                     # React Frontend
│   ├── src/
│   │   ├── components/        # Reusable UI components (Navbar, Modal, etc.)
│   │   ├── pages/             # App pages (Dashboard, Expenses, Budget, Insights, Admin)
│   │   └── utils/             # Helper utilities
│   └── public/                # Static assets
└── server/                     # Node.js Express Backend
    ├── middleware/            # Auth & Admin middlewares
    ├── models/                # Mongoose Models (Expense, Goal, User)
    ├── routes/                # API Endpoints (ai, expenses, goals, auth, admin)
    ├── utils/                 # Recurring expense background logic
    └── uploads/               # Uploaded receipt bill images
```

---

## 📜 License

This project is open-source and available under the [MIT License](LICENSE).