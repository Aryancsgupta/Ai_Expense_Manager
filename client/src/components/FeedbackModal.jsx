import { useState } from 'react';
import { X, Send, MessageSquare } from 'lucide-react';
import axios from 'axios';
import API_URL from '../utils/api';

const FeedbackModal = ({ isOpen, onClose }) => {
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!feedback.trim()) return;

    setLoading(true);
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/feedback`, { feedback }, {
        headers: { 'x-auth-token': token }
      });
      setSuccess('Thank you for your feedback!');
      setFeedback('');
      setTimeout(() => {
        onClose();
        setSuccess('');
      }, 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="card w-full max-w-md animate-fade-in">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent/10 rounded-xl text-accent">
              <MessageSquare size={24} />
            </div>
            <h2 className="text-2xl font-bold text-white">Send Feedback</h2>
          </div>
          <button onClick={onClose} className="text-text-secondary hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {success && (
          <div className="mb-6 bg-green-500/10 border border-green-500/20 text-green-400 p-3 rounded-xl text-center">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Share your thoughts, suggestions, or issues..."
            className="input-field min-h-[150px] resize-none"
            required
          />
          <button type="submit" disabled={loading || !feedback.trim()} className="btn btn-primary w-full flex items-center justify-center gap-2">
            <Send size={18} />
            {loading ? 'Sending...' : 'Submit Feedback'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default FeedbackModal;
