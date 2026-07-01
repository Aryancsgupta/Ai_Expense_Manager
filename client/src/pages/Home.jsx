import { Link } from 'react-router-dom';
import { Wallet, TrendingUp, Target, Sparkles, Scan, Download, Shield, Globe } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const Home = () => {
  const token = localStorage.getItem('token');

  const features = [
    { icon: <Wallet size={32} />, title: 'Track Expenses', description: 'Add and categorize all your transactions with ease.' },
    { icon: <TrendingUp size={32} />, title: 'AI Insights', description: 'Get personalized financial insights powered by AI.' },
    { icon: <Target size={32} />, title: 'Budget Management', description: 'Set monthly budgets and track your spending limits.' },
    { icon: <Sparkles size={32} />, title: 'Smart Categorization', description: 'AI automatically suggests categories for your expenses.' },
    { icon: <Scan size={32} />, title: 'Bill Scanning', description: 'Upload and scan bills with OCR technology.' },
    { icon: <Download size={32} />, title: 'Export Data', description: 'Download your expense history as CSV files.' },
    { icon: <Globe size={32} />, title: 'Multi-Language', description: 'Get insights in multiple languages.' },
    { icon: <Shield size={32} />, title: 'Secure', description: 'Your data is safe with secure authentication.' },
  ];

  return (
    <>
      <Helmet>
        <title>AI Expense Manager | Smart Financial Tracking & Budgeting</title>
        <meta name="description" content="AI-powered expense manager with smart tracking, budgeting, OCR bill scanning, and personalized insights to help you take control of your finances." />
        <meta name="keywords" content="expense manager, budget tracker, AI finance, OCR bill scan, financial insights, money management" />
        <meta property="og:title" content="AI Expense Manager | Smart Financial Tracking & Budgeting" />
        <meta property="og:description" content="AI-powered expense manager with smart tracking, budgeting, OCR bill scanning, and personalized insights to help you take control of your finances." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="AI Expense Manager | Smart Financial Tracking & Budgeting" />
        <meta name="twitter:description" content="AI-powered expense manager with smart tracking, budgeting, OCR bill scanning, and personalized insights to help you take control of your finances." />
      </Helmet>
      <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-6">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/10 to-transparent pointer-events-none"></div>
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-accent to-pink-500">
            AI Expense Manager
          </h1>
          <p className="text-xl md:text-2xl text-text-secondary mb-10 max-w-3xl mx-auto">
            Take control of your finances with smart AI-powered expense tracking, budgeting, and insights.
          </p>
          {!token && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register" className="btn btn-primary text-lg px-8 py-3">
                Get Started
              </Link>
              <Link to="/login" className="btn btn-secondary text-lg px-8 py-3">
                Login
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-white">
            Powerful Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="card group hover:border-accent/30 transition-all duration-300">
                <div className="p-4 bg-accent/10 rounded-xl text-accent mb-4 w-fit group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-2 text-white">{feature.title}</h3>
                <p className="text-text-secondary">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
    </>
  );
};

export default Home;
