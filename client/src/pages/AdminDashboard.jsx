import { useEffect, useState } from 'react';
import axios from 'axios';
import { Users, DollarSign, Activity } from 'lucide-react';
import API_URL from '../utils/api';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const config = { headers: { 'x-auth-token': token } };

                const statsRes = await axios.get(`${API_URL}/api/admin/system-stats`, config);
                const usersRes = await axios.get(`${API_URL}/api/admin/users`, config);

                setStats(statsRes.data);
                setUsers(usersRes.data);
            } catch (err) {
                console.error(err);
            }
            setLoading(false);
        };
        fetchData();
    }, []);

    if (loading) return <div className="min-h-[60vh] flex justify-center items-center"><Activity className="animate-spin text-accent" size={48} /></div>;

    return (
        <div className="max-w-7xl mx-auto px-6 pb-12 animate-fade-in pt-8">
            <h1 className="text-4xl font-extrabold mb-8 text-red-500">Admin Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="card flex items-center gap-5">
                    <div className="p-4 rounded-xl bg-sky-500/10 text-sky-500">
                        <Users size={32} />
                    </div>
                    <div>
                        <h3 className="text-text-secondary text-sm font-medium m-0">Total Users</h3>
                        <div className="text-2xl font-bold text-white">{stats?.totalUsers}</div>
                    </div>
                </div>
                <div className="card flex items-center gap-5">
                    <div className="p-4 rounded-xl bg-green-500/10 text-green-500">
                        <Activity size={32} />
                    </div>
                    <div>
                        <h3 className="text-text-secondary text-sm font-medium m-0">Total Expenses</h3>
                        <div className="text-2xl font-bold text-white">{stats?.totalExpenses}</div>
                    </div>
                </div>
                <div className="card flex items-center gap-5">
                    <div className="p-4 rounded-xl bg-yellow-500/10 text-yellow-500">
                        <DollarSign size={32} />
                    </div>
                    <div>
                        <h3 className="text-text-secondary text-sm font-medium m-0">Total Volume</h3>
                        <div className="text-2xl font-bold text-white">${stats?.totalVolume.toFixed(2)}</div>
                    </div>
                </div>
            </div>

            <div className="card">
                <h3 className="text-xl font-bold mb-6">System Users</h3>
                <div className="table-container">
                    <table className="glass-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Currency</th>
                                <th>Joined</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user._id}>
                                    <td className="font-medium text-white">{user.name}</td>
                                    <td className="text-text-secondary">{user.email}</td>
                                    <td>
                                        <span className={`badge ${user.role === 'admin' ? 'bg-red-500/20 text-red-500 border border-red-500/20' : 'badge-accent'}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td>{user.currency}</td>
                                    <td className="text-text-secondary text-sm">{new Date(user.createdAt).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
