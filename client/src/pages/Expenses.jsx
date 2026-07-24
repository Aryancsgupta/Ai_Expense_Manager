import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Trash2, Sparkles, Plus, FileText, Download, Search, RefreshCw, Scan, Pencil, X, Check, LayoutList, Scissors, AlertTriangle } from 'lucide-react';
import { getCurrencySymbol } from '../utils/currency';
import { CURRENCIES } from '../utils/currencies';
import API_URL from '../utils/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Expenses = () => {
    const user = (() => {
        try {
            const u = localStorage.getItem('user');
            return u ? JSON.parse(u) : null;
        } catch (e) {
            return null;
        }
    })();

    const [expenses, setExpenses] = useState([]);
    // Helper function to format current time as HH:MM
    const getCurrentTime = () => {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    };

    const [formData, setFormData] = useState({
        title: '',
        amount: '',
        category: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        time: getCurrentTime(),
        isRecurring: false,
        frequency: 'none',
        currency: user?.currency || 'USD'
    });
    const [filters, setFilters] = useState({
        search: '',
        category: '',
        startDate: '',
        endDate: ''
    });
    const [bill, setBill] = useState(null);
    const [loading, setLoading] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [scanLoading, setScanLoading] = useState(false);

    // Edit state
    const [editingExpense, setEditingExpense] = useState(null);
    const [editForm, setEditForm] = useState({
        title: '',
        amount: '',
        category: '',
        description: '',
        date: '',
        time: ''
    });
    const [editLoading, setEditLoading] = useState(false);

    // New feature states
    const [activeTab, setActiveTab] = useState('history'); // 'history' | 'recurring'
    const [recurringTemplates, setRecurringTemplates] = useState([]);
    const [splitBillLoading, setSplitBillLoading] = useState(false);
    const [splitItems, setSplitItems] = useState(null); // array of {title, amount, category}
    const [savingAllItems, setSavingAllItems] = useState(false);
    const [splitBillFile, setSplitBillFile] = useState(null);
    const [pdfLoading, setPdfLoading] = useState(false);

    const token = localStorage.getItem('token');
    const currencySymbol = getCurrencySymbol(user?.currency || 'USD');

    const fetchExpenses = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (filters.search) params.append('search', filters.search);
            if (filters.category) params.append('category', filters.category);
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);

            const res = await axios.get(`${API_URL}/api/expenses?${params.toString()}`, {
                headers: { 'x-auth-token': token },
            });
            setExpenses(res.data);
        } catch (err) {
            console.error(err);
        }
    }, [filters, token]);

    useEffect(() => {
        fetchExpenses();
    }, [fetchExpenses]);

    const onChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
    };

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const exportToCSV = () => {
        window.open(`${API_URL}/api/expenses/export?token=${token}`, '_blank');
    };

    const fetchRecurringTemplates = useCallback(async () => {
        try {
            const res = await axios.get(`${API_URL}/api/expenses/recurring-templates`, {
                headers: { 'x-auth-token': token },
            });
            setRecurringTemplates(res.data);
        } catch (err) {
            console.error(err);
        }
    }, [token]);

    useEffect(() => {
        if (activeTab === 'recurring') fetchRecurringTemplates();
    }, [activeTab, fetchRecurringTemplates]);

    const exportToPDF = async () => {
        setPdfLoading(true);
        try {
            const doc = new jsPDF();
            // Header
            doc.setFillColor(109, 40, 217);
            doc.rect(0, 0, 210, 30, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(20);
            doc.setFont('helvetica', 'bold');
            doc.text('AI Expense Manager', 14, 12);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 22);
            // Summary
            const totalAmt = expenses.reduce((s, e) => s + e.amount, 0);
            doc.setTextColor(50, 50, 50);
            doc.setFontSize(12);
            const totalCurrency = expenses[0]?.currency || user?.currency || 'USD';
            doc.text(`Total Expenses: ${totalAmt.toFixed(2)} ${totalCurrency}   |   Records: ${expenses.length}`, 14, 42);
            // Table
            const tableRows = expenses.map(e => [
                new Date(e.date).toLocaleDateString(),
                e.title,
                e.category,
                `${e.amount.toFixed(2)} ${e.currency || user?.currency || 'USD'}`,
                e.description || ''
            ]);
            autoTable(doc, {
                startY: 50,
                head: [['Date', 'Title', 'Category', 'Amount', 'Description']],
                body: tableRows,
                styles: { fontSize: 9, cellPadding: 3 },
                headStyles: { fillColor: [109, 40, 217], textColor: 255, fontStyle: 'bold' },
                alternateRowStyles: { fillColor: [245, 243, 255] },
            });
            doc.save(`expenses_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (err) {
            console.error('PDF Error:', err);
            alert('Failed to generate PDF');
        }
        setPdfLoading(false);
    };

    const splitBill = async () => {
        if (!splitBillFile) return alert('Please select a bill image first');
        setSplitBillLoading(true);
        setSplitItems(null);
        const data = new FormData();
        data.append('bill', splitBillFile);
        try {
            const res = await axios.post(`${API_URL}/api/ai/split-bill`, data, {
                headers: { 'x-auth-token': token, 'Content-Type': 'multipart/form-data' },
            });
            setSplitItems(res.data.items || []);
        } catch (err) {
            console.error(err);
            alert('Failed to split bill. Please try again.');
        }
        setSplitBillLoading(false);
    };

    const saveAllSplitItems = async () => {
        if (!splitItems || splitItems.length === 0) return;
        setSavingAllItems(true);
        try {
            for (const item of splitItems) {
                const data = new FormData();
                data.append('title', item.title);
                data.append('amount', item.amount);
                data.append('category', item.category);
                data.append('date', new Date().toISOString());
                data.append('currency', user?.currency || 'INR');
                data.append('isRecurring', 'false');
                data.append('frequency', 'none');
                await axios.post(`${API_URL}/api/expenses`, data, {
                    headers: { 'x-auth-token': token },
                });
            }
            setSplitItems(null);
            setSplitBillFile(null);
            fetchExpenses();
            alert(`${splitItems.length} expenses saved successfully!`);
        } catch (err) {
            console.error(err);
            alert('Failed to save all items');
        }
        setSavingAllItems(false);
    };

    const scanBill = async () => {
        if (!bill) return alert('Please select a bill image first');
        setScanLoading(true);
        const data = new FormData();
        data.append('bill', bill);
        try {
            const res = await axios.post(`${API_URL}/api/ai/scan`, data, {
                headers: { 'x-auth-token': token, 'Content-Type': 'multipart/form-data' }
            });
            setFormData({
                ...formData,
                title: res.data.title || '',
                amount: res.data.amount || '',
                category: res.data.category || '',
                date: res.data.date || formData.date
            });
            alert('Bill scanned successfully!');
        } catch (err) {
            console.error(err);
            alert('Failed to scan bill');
        }
        setScanLoading(false);
    };

    const suggestCategory = async () => {
        if (!formData.title && !formData.description) return alert('Enter title or description first');
        setAiLoading(true);
        try {
            const res = await axios.post(
                `${API_URL}/api/ai/categorize`,
                {
                    description: formData.description || formData.title,
                    title: formData.title,
                    amount: formData.amount
                },
                { headers: { 'x-auth-token': token } }
            );
            if (res.data.category) {
                setFormData(prev => ({ ...prev, category: res.data.category }));
            }
        } catch (err) {
            console.error('AI Suggestion Error:', err);
        }
        setAiLoading(false);
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const data = new FormData();
        // Combine date and time into a single Date string
        const combinedDate = new Date(`${formData.date}T${formData.time}`);
        Object.keys(formData).forEach(key => {
            if (key === 'date') {
                data.append(key, combinedDate.toISOString());
            } else if (key !== 'time') { // Skip time field since we combined it
                data.append(key, formData[key]);
            }
        });
        if (bill) data.append('bill', bill);

        try {
            await axios.post(`${API_URL}/api/expenses`, data, {
                headers: { 'x-auth-token': token },
            });
            setFormData({
                title: '',
                amount: '',
                category: '',
                description: '',
                date: new Date().toISOString().split('T')[0],
                time: getCurrentTime(),
                isRecurring: false,
                frequency: 'none',
                currency: user?.currency || 'USD'
            });
            setBill(null);
            fetchExpenses();
        } catch (err) {
            console.error('Error adding expense:', err);
            const msg = err.response?.data?.msg || err.response?.data?.error || err.message;
            alert(`Failed to add expense: ${msg}`);
        }
        setLoading(false);
    };

    const deleteExpense = async (id) => {
        if (!confirm('Are you sure?')) return;
        try {
            await axios.delete(`${API_URL}/api/expenses/${id}`, {
                headers: { 'x-auth-token': token },
            });
            fetchExpenses();
        } catch (err) {
            console.error(err);
        }
    };

    // Open edit modal with pre-filled values
    const openEditModal = (exp) => {
        const expDate = new Date(exp.date);
        const dateStr = expDate.toISOString().split('T')[0];
        const timeStr = `${String(expDate.getHours()).padStart(2, '0')}:${String(expDate.getMinutes()).padStart(2, '0')}`;
        setEditForm({
            title: exp.title,
            amount: exp.amount,
            category: exp.category,
            description: exp.description || '',
            date: dateStr,
            time: timeStr
        });
        setEditingExpense(exp);
    };

    const closeEditModal = () => {
        setEditingExpense(null);
    };

    const onEditChange = (e) => {
        setEditForm({ ...editForm, [e.target.name]: e.target.value });
    };

    const onEditSubmit = async (e) => {
        e.preventDefault();
        setEditLoading(true);
        try {
            const combinedDate = new Date(`${editForm.date}T${editForm.time}`);
            await axios.put(`${API_URL}/api/expenses/${editingExpense._id}`, {
                title: editForm.title,
                amount: editForm.amount,
                category: editForm.category,
                description: editForm.description,
                date: combinedDate.toISOString()
            }, {
                headers: { 'x-auth-token': token }
            });
            closeEditModal();
            fetchExpenses();
        } catch (err) {
            console.error('Error updating expense:', err);
            alert('Failed to update expense');
        }
        setEditLoading(false);
    };

    const categories = ['Food', 'Transport', 'Utilities', 'Entertainment', 'Health', 'Shopping', 'Travel', 'Education', 'Other'];

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-12 animate-fade-in pt-8 w-full overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <h1 className="text-3xl sm:text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-accent to-pink-500">Expenses</h1>
                <div className="flex gap-2 flex-wrap">
                    <button onClick={exportToCSV} className="btn btn-secondary flex items-center gap-2">
                        <Download size={16} /> CSV
                    </button>
                    <button onClick={exportToPDF} disabled={pdfLoading || expenses.length === 0} className="btn btn-secondary flex items-center gap-2">
                        <FileText size={16} /> {pdfLoading ? 'Generating...' : 'PDF'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                <div className="card h-fit lg:col-span-1 overflow-hidden">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <div className="bg-accent/10 p-2 rounded-lg text-accent"><Plus size={20} /></div>
                        Add New
                    </h3>
                    <form onSubmit={onSubmit} className="flex flex-col gap-5">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-secondary">Title</label>
                            <input type="text" name="title" value={formData.title} onChange={onChange} required placeholder="e.g. Starbucks" className="input-field" />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-text-secondary">Amount</label>
                                <input type="number" name="amount" value={formData.amount} onChange={onChange} required placeholder="0.00" min="0.01" step="0.01" className="input-field" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-text-secondary">Currency</label>
                                <select name="currency" value={formData.currency} onChange={onChange} className="input-field">
                                    {CURRENCIES.map((curr) => (
                                        <option key={curr.code} value={curr.code}>{curr.code} ({getCurrencySymbol(curr.code)})</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-text-secondary">Date</label>
                                <input type="date" name="date" value={formData.date} onChange={onChange} required className="input-field" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-text-secondary">Time</label>
                                <input type="time" name="time" value={formData.time} onChange={onChange} required className="input-field" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex gap-2 items-end">
                                <div className="w-full">
                                    <label className="text-sm font-medium text-text-secondary">Category</label>
                                    <select name="category" value={formData.category} onChange={onChange} required className="input-field">
                                        <option value="">Select Category</option>
                                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    </select>
                                </div>
                                <button type="button" onClick={suggestCategory} className="btn btn-secondary h-[52px] flex-shrink-0" title="AI Suggest Category" disabled={aiLoading}>
                                    <Sparkles size={20} className={aiLoading ? 'animate-spin' : 'text-accent'} />
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 py-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" name="isRecurring" checked={formData.isRecurring} onChange={onChange} className="w-4 h-4 rounded border-white/10 bg-white/5 text-accent focus:ring-accent" />
                                <span className="text-sm font-medium text-text-secondary flex items-center gap-1"><RefreshCw size={14} /> Recurring?</span>
                            </label>
                            {formData.isRecurring && (
                                <select name="frequency" value={formData.frequency} onChange={onChange} className="input-field py-1 px-2 h-auto text-xs w-full sm:w-32">
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                    <option value="yearly">Yearly</option>
                                </select>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-secondary">Attachment / OCR Scan</label>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <input type="file" accept="image/*" onChange={(e) => setBill(e.target.files[0])} className="input-field text-xs w-full" />
                                <button type="button" onClick={scanBill} className="btn btn-secondary w-full sm:w-auto justify-center" title="Scan with AI OCR" disabled={scanLoading || !bill}>
                                    <Scan size={20} className={scanLoading ? 'animate-spin text-accent' : 'text-accent'} />
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary w-full mt-2" disabled={loading}>
                            {loading ? 'Adding...' : 'Add Expense'}
                        </button>
                    </form>
                </div>

                <div className="card lg:col-span-2 overflow-hidden">
                    <div className="flex flex-col gap-6">
                        {/* Tab switcher */}
                        <div className="flex gap-2 bg-slate-800/50 p-1 rounded-xl border border-white/5 w-fit">
                            <button
                                onClick={() => setActiveTab('history')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                                    activeTab === 'history' ? 'bg-slate-700 text-white shadow-lg' : 'text-text-secondary hover:text-white'
                                }`}
                            >
                                <LayoutList size={16} /> History
                            </button>
                            <button
                                onClick={() => setActiveTab('recurring')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                                    activeTab === 'recurring' ? 'bg-slate-700 text-white shadow-lg' : 'text-text-secondary hover:text-white'
                                }`}
                            >
                                <RefreshCw size={16} /> Recurring
                            </button>
                            <button
                                onClick={() => setActiveTab('splitbill')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                                    activeTab === 'splitbill' ? 'bg-slate-700 text-white shadow-lg' : 'text-text-secondary hover:text-white'
                                }`}
                            >
                                <Scissors size={16} /> Split Bill
                            </button>
                        </div>

                        {/* History Tab */}
                        {activeTab === 'history' && (<>
                        <div className="flex flex-col gap-4 w-full">
                            <div className="relative w-full">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                                <input type="text" name="search" value={filters.search} onChange={handleFilterChange} placeholder="Search expenses..." className="input-field pl-10 w-full" />
                            </div>
                            <div className="flex flex-wrap gap-2 w-full">
                                <select name="category" value={filters.category} onChange={handleFilterChange} className="input-field py-2 px-3 h-auto text-sm flex-1 min-w-[120px]">
                                    <option value="">All Categories</option>
                                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                                <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="input-field py-2 px-3 h-auto text-sm flex-1 min-w-[120px]" placeholder="From" />
                                <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="input-field py-2 px-3 h-auto text-sm flex-1 min-w-[120px]" placeholder="To" />
                            </div>
                        </div>

                        <div className="table-container overflow-x-auto">
                            <table className="glass-table min-w-[600px]">
                                <thead>
                                    <tr>
                                        <th className="whitespace-nowrap">Date</th>
                                        <th className="whitespace-nowrap">Title</th>
                                        <th className="whitespace-nowrap">Category</th>
                                        <th className="whitespace-nowrap">Amount</th>
                                        <th className="whitespace-nowrap">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {expenses.map(exp => (
                                        <tr key={exp._id}>
                                            <td className="text-text-secondary text-sm whitespace-nowrap">{new Date(exp.date).toLocaleDateString()}</td>
                                            <td>
                                                <div className="font-semibold text-white flex items-center gap-2">
                                                    {exp.title}
                                                    {exp.isRecurring && <RefreshCw size={12} className="text-accent flex-shrink-0" />}
                                                </div>
                                                {exp.description && <div className="text-xs text-text-secondary mt-0.5 truncate max-w-[120px] sm:max-w-[150px]">{exp.description}</div>}
                                            </td>
                                            <td className="whitespace-nowrap"><span className="badge badge-accent">{exp.category}</span></td>
                                            <td className="font-bold text-white whitespace-nowrap">-{getCurrencySymbol(exp.currency || 'USD')}{exp.amount.toFixed(2)}</td>
                                            <td className="whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    {exp.billUrl && <a href={`${API_URL}${exp.billUrl}`} target="_blank" rel="noreferrer" className="p-1.5 hover:bg-white/5 rounded-lg text-text-secondary transition-colors"><FileText size={18} /></a>}
                                                    <button
                                                        onClick={() => openEditModal(exp)}
                                                        className="p-1.5 hover:bg-accent/10 rounded-lg text-text-secondary hover:text-accent transition-colors"
                                                        title="Edit expense"
                                                    >
                                                        <Pencil size={18} />
                                                    </button>
                                                    <button onClick={() => deleteExpense(exp._id)} className="p-1.5 hover:bg-red-500/10 rounded-lg text-text-secondary hover:text-red-400 transition-colors"><Trash2 size={18} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        </>)}

                        {/* Recurring Templates Tab */}
                        {activeTab === 'recurring' && (
                            <div className="flex flex-col gap-4">
                                <p className="text-sm text-text-secondary">These are your active recurring expense templates. Deleting a template will stop future auto-generation.</p>
                                {recurringTemplates.length === 0 ? (
                                    <div className="text-center py-10 text-text-secondary">
                                        <RefreshCw size={40} className="mx-auto mb-3 opacity-30" />
                                        <p>No recurring templates found.</p>
                                        <p className="text-xs mt-1">Add an expense with &quot;Recurring?&quot; checked to create one.</p>
                                    </div>
                                ) : (
                                    <div className="table-container overflow-x-auto">
                                        <table className="glass-table min-w-[500px]">
                                            <thead><tr>
                                                <th>Title</th>
                                                <th>Amount</th>
                                                <th>Frequency</th>
                                                <th>Started</th>
                                                <th>Last Generated</th>
                                                <th>Actions</th>
                                            </tr></thead>
                                            <tbody>
                                                {recurringTemplates.map(t => (
                                                    <tr key={t._id}>
                                                        <td className="font-semibold text-white flex items-center gap-2"><RefreshCw size={12} className="text-accent" />{t.title}</td>
                                                        <td className="font-bold text-white">-{getCurrencySymbol(t.currency || 'INR')}{t.amount.toFixed(2)}</td>
                                                        <td><span className="badge badge-accent capitalize">{t.frequency}</span></td>
                                                        <td className="text-text-secondary text-sm">{new Date(t.date).toLocaleDateString()}</td>
                                                        <td className="text-text-secondary text-sm">{t.lastGeneratedDate ? new Date(t.lastGeneratedDate).toLocaleDateString() : 'Not yet'}</td>
                                                        <td>
                                                            <button onClick={() => deleteExpense(t._id)} className="p-1.5 hover:bg-red-500/10 rounded-lg text-text-secondary hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Split Bill Tab */}
                        {activeTab === 'splitbill' && (
                            <div className="flex flex-col gap-6">
                                <div className="bg-accent/5 border border-accent/20 rounded-xl p-4">
                                    <p className="text-sm text-text-secondary mb-3">Upload a receipt to automatically detect and split all individual line items into separate expenses using AI.</p>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <input type="file" accept="image/*" onChange={e => setSplitBillFile(e.target.files[0])} className="input-field text-xs flex-1" />
                                        <button
                                            onClick={splitBill}
                                            disabled={splitBillLoading || !splitBillFile}
                                            className="btn btn-primary flex items-center gap-2 justify-center"
                                        >
                                            <Scissors size={16} className={splitBillLoading ? 'animate-spin' : ''} />
                                            {splitBillLoading ? 'Splitting...' : 'Split with AI'}
                                        </button>
                                    </div>
                                </div>

                                {splitItems && splitItems.length > 0 && (
                                    <div className="flex flex-col gap-4">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-bold text-white">Detected Items ({splitItems.length})</h4>
                                            <button
                                                onClick={saveAllSplitItems}
                                                disabled={savingAllItems}
                                                className="btn btn-primary flex items-center gap-2"
                                            >
                                                <Check size={16} />
                                                {savingAllItems ? 'Saving...' : `Save All ${splitItems.length} Expenses`}
                                            </button>
                                        </div>
                                        <div className="table-container overflow-x-auto">
                                            <table className="glass-table min-w-[400px]">
                                                <thead><tr>
                                                    <th>Item</th>
                                                    <th>Category</th>
                                                    <th>Amount</th>
                                                </tr></thead>
                                                <tbody>
                                                    {splitItems.map((item, idx) => (
                                                        <tr key={idx}>
                                                            <td className="font-semibold text-white">{item.title}</td>
                                                            <td><span className="badge badge-accent">{item.category}</span></td>
                                                            <td className="font-bold text-white">{getCurrencySymbol(user?.currency || 'INR')}{Number(item.amount).toFixed(2)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {splitItems && splitItems.length === 0 && (
                                    <div className="text-center py-6 text-text-secondary">
                                        <AlertTriangle size={36} className="mx-auto mb-2 opacity-40" />
                                        <p>No items detected. Try a clearer image.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Edit Expense Modal */}
            {editingExpense && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={closeEditModal}
                    />
                    {/* Modal */}
                    <div className="relative card w-full max-w-md shadow-2xl animate-fade-in">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <div className="bg-accent/10 p-2 rounded-lg text-accent"><Pencil size={18} /></div>
                                Edit Expense
                            </h3>
                            <button
                                onClick={closeEditModal}
                                className="p-1.5 hover:bg-white/10 rounded-lg text-text-secondary transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={onEditSubmit} className="flex flex-col gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-text-secondary">Title</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={editForm.title}
                                    onChange={onEditChange}
                                    required
                                    className="input-field"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-text-secondary">Amount</label>
                                    <input
                                        type="number"
                                        name="amount"
                                        value={editForm.amount}
                                        onChange={onEditChange}
                                        required
                                        min="0.01"
                                        step="0.01"
                                        className="input-field"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-text-secondary">Category</label>
                                    <select name="category" value={editForm.category} onChange={onEditChange} required className="input-field">
                                        <option value="">Select</option>
                                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-text-secondary">Date</label>
                                    <input
                                        type="date"
                                        name="date"
                                        value={editForm.date}
                                        onChange={onEditChange}
                                        required
                                        className="input-field"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-text-secondary">Time</label>
                                    <input
                                        type="time"
                                        name="time"
                                        value={editForm.time}
                                        onChange={onEditChange}
                                        required
                                        className="input-field"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-text-secondary">Description</label>
                                <input
                                    type="text"
                                    name="description"
                                    value={editForm.description}
                                    onChange={onEditChange}
                                    placeholder="Optional"
                                    className="input-field"
                                />
                            </div>

                            <div className="flex gap-3 mt-2">
                                <button
                                    type="button"
                                    onClick={closeEditModal}
                                    className="btn btn-secondary flex-1"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary flex-1 flex items-center justify-center gap-2"
                                    disabled={editLoading}
                                >
                                    {editLoading ? 'Saving...' : <><Check size={16} /> Save Changes</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Expenses;
