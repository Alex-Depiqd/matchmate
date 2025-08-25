import { useState, useEffect } from 'react';
import { dataManager } from '../utils/storage';
import { formatCurrency } from '../utils/calculations';

const FreeBetTracker = ({ bookmakers, onRefresh }) => {
  const [freeBets, setFreeBets] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    bookmaker: '',
    value: '',
    expiryDate: '',
    notes: ''
  });

  // Load free bets from storage
  useEffect(() => {
    const storedFreeBets = dataManager.getFreeBets();
    setFreeBets(storedFreeBets);
  }, []);

  const handleAddFreeBet = () => {
    if (!formData.bookmaker || !formData.value) return;

    const newFreeBet = {
      id: `freebet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      bookmaker: formData.bookmaker,
      value: parseFloat(formData.value),
      expiryDate: formData.expiryDate,
      notes: formData.notes,
      status: 'pending', // 'pending', 'used', 'expired'
      createdAt: new Date().toISOString(),
      usedAt: null
    };

    dataManager.addFreeBet(newFreeBet);
    setFreeBets(prev => [...prev, newFreeBet]);
    
    // Reset form
    setFormData({
      bookmaker: '',
      value: '',
      expiryDate: '',
      notes: ''
    });
    setShowAddForm(false);
    onRefresh();
  };

  const handleMarkAsUsed = (freeBetId) => {
    const updatedFreeBets = freeBets.map(fb => 
      fb.id === freeBetId 
        ? { ...fb, status: 'used', usedAt: new Date().toISOString() }
        : fb
    );
    setFreeBets(updatedFreeBets);
    dataManager.setFreeBets(updatedFreeBets);
    onRefresh();
  };

  const handleDeleteFreeBet = (freeBetId) => {
    const updatedFreeBets = freeBets.filter(fb => fb.id !== freeBetId);
    setFreeBets(updatedFreeBets);
    dataManager.setFreeBets(updatedFreeBets);
    onRefresh();
  };

  const getStatusBadge = (status, expiryDate) => {
    if (status === 'used') {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Used</span>;
    }
    
    if (status === 'expired') {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Expired</span>;
    }
    
    // Check if expired
    if (expiryDate && new Date(expiryDate) < new Date()) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Expired</span>;
    }
    
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pending</span>;
  };

  const getDaysUntilExpiry = (expiryDate) => {
    if (!expiryDate) return null;
    const days = Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const pendingFreeBets = freeBets.filter(fb => fb.status === 'pending');
  const usedFreeBets = freeBets.filter(fb => fb.status === 'used');
  const totalValue = pendingFreeBets.reduce((sum, fb) => sum + fb.value, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Free Bet Tracker</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn-primary"
        >
          Add Free Bet
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-yellow-50 border-yellow-200">
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">Pending Free Bets</h3>
          <p className="text-2xl font-bold text-yellow-800">{pendingFreeBets.length}</p>
          <p className="text-sm text-yellow-700">Total Value: {formatCurrency(totalValue)}</p>
        </div>
        <div className="card bg-green-50 border-green-200">
          <h3 className="text-lg font-semibold text-green-900 mb-2">Used Free Bets</h3>
          <p className="text-2xl font-bold text-green-800">{usedFreeBets.length}</p>
        </div>
        <div className="card bg-blue-50 border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Total Tracked</h3>
          <p className="text-2xl font-bold text-blue-800">{freeBets.length}</p>
        </div>
      </div>

      {/* Add Free Bet Form */}
      {showAddForm && (
        <div className="card bg-gray-50 border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Free Bet</h3>
          <form onSubmit={(e) => { e.preventDefault(); handleAddFreeBet(); }} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Bookmaker</label>
                <select
                  value={formData.bookmaker}
                  onChange={(e) => setFormData(prev => ({ ...prev, bookmaker: e.target.value }))}
                  className="input"
                  required
                >
                  <option value="">Select Bookmaker</option>
                  {bookmakers.map(bm => (
                    <option key={bm.name} value={bm.name}>{bm.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Value (£)</label>
                <input
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="input"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Expiry Date (Optional)</label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Notes (Optional)</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="e.g., Welcome offer, Reload bonus"
                  className="input"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
              >
                Add Free Bet
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Free Bets List */}
      {freeBets.length === 0 ? (
        <div className="card">
          <p className="text-gray-500 text-center py-8">
            No free bets tracked yet. Add your first free bet to get started!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {freeBets.map((freeBet) => (
            <div key={freeBet.id} className="card">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-semibold text-gray-900">{freeBet.bookmaker}</h3>
                    {getStatusBadge(freeBet.status, freeBet.expiryDate)}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Value:</span>
                      <span className="font-medium ml-2">{formatCurrency(freeBet.value)}</span>
                    </div>
                    {freeBet.expiryDate && (
                      <div>
                        <span className="text-gray-500">Expires:</span>
                        <span className="font-medium ml-2">
                          {new Date(freeBet.expiryDate).toLocaleDateString()}
                          {getDaysUntilExpiry(freeBet.expiryDate) !== null && (
                            <span className={`ml-2 text-xs ${getDaysUntilExpiry(freeBet.expiryDate) <= 3 ? 'text-red-600' : 'text-gray-500'}`}>
                              ({getDaysUntilExpiry(freeBet.expiryDate)} days)
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-500">Added:</span>
                      <span className="font-medium ml-2">{new Date(freeBet.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {freeBet.notes && (
                    <div className="text-sm text-gray-600 mt-2">
                      <span className="text-gray-500">Notes:</span>
                      <span className="ml-2">{freeBet.notes}</span>
                    </div>
                  )}

                  {freeBet.usedAt && (
                    <div className="text-xs text-gray-400 mt-2">
                      Used: {new Date(freeBet.usedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col space-y-2 ml-4">
                  {freeBet.status === 'pending' && (
                    <button
                      onClick={() => handleMarkAsUsed(freeBet.id)}
                      className="btn-success text-sm px-3 py-1"
                    >
                      Mark Used
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteFreeBet(freeBet.id)}
                    className="btn-danger text-sm px-3 py-1"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FreeBetTracker;
