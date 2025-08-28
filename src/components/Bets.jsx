import { useState } from 'react';
import { dataManager } from '../utils/storage';
import { calculateBetProfit, formatCurrency, calculateLiability, calculateLayStake, calculateSettledProfit } from '../utils/calculations';

const Bets = ({ bets, bookmakers, exchanges, onRefresh }) => {
  const [filter, setFilter] = useState('all'); // 'all', 'unsettled', 'settled'
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest', 'oldest'
  const [selectedBet, setSelectedBet] = useState(null);
  const [editingBet, setEditingBet] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [manualLayStake, setManualLayStake] = useState(false);
  const [expandedBets, setExpandedBets] = useState(new Set()); // Track which bets are expanded

  // Calculate settled profit
  const settledProfit = calculateSettledProfit(bets);

  const filteredBets = bets
    .filter(bet => {
      if (filter === 'unsettled') return bet.status === 'unsettled';
      if (filter === 'settled') return bet.status !== 'unsettled';
      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdAt || a.id);
      const dateB = new Date(b.createdAt || b.id);
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

  const unsettledBets = bets.filter(bet => bet.status === 'unsettled');
  const settledBets = bets.filter(bet => bet.status !== 'unsettled');

  const handleSettleBet = (betId, result) => {
    // Use the new function that updates balances and exposure
    dataManager.settleBetAndUpdateBalances(betId, result);
    
    onRefresh();
    setSelectedBet(null);
  };

  const handleEditBet = (bet) => {
    setEditingBet(bet);
    setEditFormData({
      event: bet.event,
      bookmaker: bet.bookmaker,
      exchange: bet.exchange,
      type: bet.type,
      backStake: bet.backStake.toString(),
      backOdds: bet.backOdds.toString(),
      layOdds: bet.layOdds.toString(),
      layStake: bet.layStake.toString(),
      liability: bet.liability.toString(),
      status: bet.status,
      notes: bet.notes || ''
    });
    setManualLayStake(false);
  };

  // Auto-calculate lay stake when back stake, back odds, or lay odds change
  const handleEditFormChange = (field, value) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-calculate lay stake and liability if we have all required fields
    if (field === 'backStake' || field === 'backOdds' || field === 'layOdds') {
      const backStake = parseFloat(editFormData.backStake || value);
      const backOdds = parseFloat(editFormData.backOdds || value);
      const layOdds = parseFloat(editFormData.layOdds || value);
      
      if (backStake && backOdds && layOdds && !manualLayStake) {
        // Get commission from selected exchange
        const selectedExchange = exchanges.find(ex => ex.name === editFormData.exchange);
        const commission = selectedExchange ? (selectedExchange.commission || 0) / 100 : 0;
        
        const layStake = calculateLayStake(backStake, backOdds, layOdds, editFormData.type === 'free', false, commission);
        const liability = calculateLiability(layStake, layOdds);
        setEditFormData(prev => ({ 
          ...prev, 
          layStake: layStake.toString(),
          liability: liability.toString()
        }));
      }
    }
  };

  const handleSaveEdit = () => {
    if (!editingBet) return;

    // Update the bet with new data
    const updatedBet = {
      ...editingBet,
      event: editFormData.event,
      bookmaker: editFormData.bookmaker,
      exchange: editFormData.exchange,
      type: editFormData.type,
      backStake: parseFloat(editFormData.backStake),
      backOdds: parseFloat(editFormData.backOdds),
      layOdds: parseFloat(editFormData.layOdds),
      layStake: parseFloat(editFormData.layStake),
      liability: parseFloat(editFormData.liability),
      status: editFormData.status,
      notes: editFormData.notes
    };

    dataManager.updateBet(updatedBet);
    setEditingBet(null);
    setEditFormData({});
    onRefresh();
  };

  const toggleBetExpansion = (betId) => {
    setExpandedBets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(betId)) {
        newSet.delete(betId);
      } else {
        newSet.add(betId);
      }
      return newSet;
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'back_won':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Back Won</span>;
      case 'lay_won':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Lay Won</span>;
      case 'unsettled':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Unsettled</span>;
      default:
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  const getProfitColor = (profit) => {
    if (profit > 0) return 'text-green-600';
    if (profit < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Bets</h2>
          <p className="text-sm text-gray-600 mt-1">
            Settled Profit: <span className={getProfitColor(settledProfit)}>{formatCurrency(settledProfit)}</span>
          </p>
        </div>
        
        {/* Filter and Sort Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Filter Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All ({bets.length})
            </button>
            <button
              onClick={() => setFilter('unsettled')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'unsettled' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Unsettled ({unsettledBets.length})
            </button>
            <button
              onClick={() => setFilter('settled')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'settled' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Settled ({settledBets.length})
            </button>
          </div>
          
          {/* Sort Buttons */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Sort:</span>
            <button
              onClick={() => setSortOrder('newest')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                sortOrder === 'newest' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Newest
            </button>
            <button
              onClick={() => setSortOrder('oldest')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                sortOrder === 'oldest' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Oldest
            </button>
          </div>
        </div>
      </div>

      {/* Open Bets Summary */}
      {unsettledBets.length > 0 && (
        <div className="card bg-orange-50 border-orange-200">
          <h3 className="text-lg font-semibold text-orange-900 mb-3">Open Bets</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-orange-700">Total Exposure:</span>
              <span className="font-medium ml-2">{formatCurrency(exchanges.reduce((sum, e) => sum + (e.exposure || 0), 0))}</span>
            </div>
            <div>
              <span className="text-orange-700">Open Stakes:</span>
              <span className="font-medium ml-2">{formatCurrency(unsettledBets.reduce((sum, bet) => sum + (bet.backStake || 0), 0))}</span>
            </div>
            <div>
              <span className="text-orange-700">Unsettled Bets:</span>
              <span className="font-medium ml-2">{unsettledBets.length}</span>
            </div>
          </div>
        </div>
      )}

      {/* Bets List */}
      {filteredBets.length === 0 ? (
        <div className="card">
          <p className="text-gray-500 text-center py-8">
            {filter === 'all' ? 'No bets logged yet.' : `No ${filter} bets found.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBets.map((bet) => {
            const isExpanded = expandedBets.has(bet.id);
            return (
              <div key={bet.id} className="card">
                {/* Main Bet Info */}
                <div className="flex items-start justify-between gap-4">
                  {/* Left side - Event and basic info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-4">
                      <h3 className="font-semibold text-gray-900 truncate text-lg">{bet.event}</h3>
                      {getStatusBadge(bet.status)}
                    </div>
                    
                    {/* Key metrics in a clean grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Profit</div>
                        <div className={`font-semibold text-lg ${getProfitColor(bet.netProfit || 0)}`}>
                          {bet.status !== 'unsettled' ? formatCurrency(bet.netProfit) : 'Pending'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Stake</div>
                        <div className="font-semibold text-lg text-gray-900">{formatCurrency(bet.backStake)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Type</div>
                        <div className="font-semibold text-lg text-gray-900 capitalize">{bet.type}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Date</div>
                        <div className="font-semibold text-lg text-gray-900">{new Date(bet.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>

                    {/* Settlement date if available */}
                    {bet.settledAt && (
                      <div className="text-xs text-gray-400 mb-3">
                        Settled: {new Date(bet.settledAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  {/* Right side - Action buttons */}
                  <div className="flex flex-col items-end gap-3 flex-shrink-0">
                    <button
                      onClick={() => toggleBetExpansion(bet.id)}
                      className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 transition-colors"
                      title={isExpanded ? "Collapse details" : "Expand details"}
                    >
                      {isExpanded ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                    </button>
                    
                    <button
                      onClick={() => handleEditBet(bet)}
                      className="btn-secondary text-sm px-4 py-2 whitespace-nowrap"
                    >
                      Edit
                    </button>
                    
                    {bet.status === 'unsettled' && (
                      <div className="flex flex-col gap-2 w-full">
                        <button
                          onClick={() => handleSettleBet(bet.id, 'back_won')}
                          className="btn-success text-sm px-4 py-2 w-full"
                        >
                          Back Won
                        </button>
                        <button
                          onClick={() => handleSettleBet(bet.id, 'lay_won')}
                          className="btn-danger text-sm px-4 py-2 w-full"
                        >
                          Lay Won
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Expandable Details */}
                {isExpanded && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Bookmaker</div>
                        <div className="font-medium text-gray-900">{bet.bookmaker}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Exchange</div>
                        <div className="font-medium text-gray-900">{bet.exchange}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Back Odds</div>
                        <div className="font-medium text-gray-900">{bet.backOdds}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Lay Odds</div>
                        <div className="font-medium text-gray-900">{bet.layOdds}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm mt-4">
                      <div>
                        <span className="text-gray-500">Lay Stake:</span>
                        <span className="font-medium ml-2">{formatCurrency(bet.layStake)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Liability:</span>
                        <span className="font-medium ml-2">{formatCurrency(bet.liability)}</span>
                      </div>
                      {bet.notes && (
                        <div className="md:col-span-2">
                          <span className="text-gray-500">Notes:</span>
                          <span className="font-medium ml-2">{bet.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Bet Modal */}
      {editingBet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Edit Bet</h3>
              
              <form onSubmit={(e) => { e.preventDefault(); handleSaveEdit(); }} className="space-y-4">
                {/* Event */}
                <div>
                  <label className="label">Event Description</label>
                  <input
                    type="text"
                    value={editFormData.event || ''}
                    onChange={(e) => handleEditFormChange('event', e.target.value)}
                    className="input"
                    required
                  />
                </div>

                {/* Bookmaker and Exchange */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Bookmaker</label>
                    <select
                      value={editFormData.bookmaker || ''}
                      onChange={(e) => handleEditFormChange('bookmaker', e.target.value)}
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
                    <label className="label">Exchange</label>
                    <select
                      value={editFormData.exchange || ''}
                      onChange={(e) => handleEditFormChange('exchange', e.target.value)}
                      className="input"
                      required
                    >
                      <option value="">Select Exchange</option>
                      {exchanges.map(ex => (
                        <option key={ex.name} value={ex.name}>{ex.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Bet Type */}
                <div>
                  <label className="label">Bet Type</label>
                  <select
                    value={editFormData.type || ''}
                    onChange={(e) => handleEditFormChange('type', e.target.value)}
                    className="input"
                    required
                  >
                    <option value="">Select Type</option>
                    <option value="qualifying">Qualifying Bet</option>
                    <option value="free">Free Bet</option>
                  </select>
                </div>

                {/* Bet Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="label">Back Stake (£)</label>
                    <input
                      type="number"
                      value={editFormData.backStake || ''}
                      onChange={(e) => handleEditFormChange('backStake', e.target.value)}
                      step="0.01"
                      min="0"
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Back Odds</label>
                    <input
                      type="number"
                      value={editFormData.backOdds || ''}
                      onChange={(e) => handleEditFormChange('backOdds', e.target.value)}
                      step="0.01"
                      min="1"
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Lay Odds</label>
                    <input
                      type="number"
                      value={editFormData.layOdds || ''}
                      onChange={(e) => handleEditFormChange('layOdds', e.target.value)}
                      step="0.01"
                      min="1"
                      className="input"
                      required
                    />
                  </div>
                </div>

                {/* Lay Bet Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Lay Stake (£)</label>
                    <input
                      type="number"
                      value={editFormData.layStake || ''}
                      onChange={(e) => handleEditFormChange('layStake', e.target.value)}
                      step="0.01"
                      min="0"
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Liability (£)</label>
                    <input
                      type="number"
                      value={editFormData.liability || ''}
                      onChange={(e) => handleEditFormChange('liability', e.target.value)}
                      step="0.01"
                      min="0"
                      className="input"
                      required
                    />
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="label">Status</label>
                  <select
                    value={editFormData.status || ''}
                    onChange={(e) => handleEditFormChange('status', e.target.value)}
                    className="input"
                    required
                  >
                    <option value="unsettled">Unsettled</option>
                    <option value="back_won">Back Won</option>
                    <option value="lay_won">Lay Won</option>
                  </select>
                </div>

                {/* Notes */}
                <div>
                  <label className="label">Notes (Optional)</label>
                  <textarea
                    value={editFormData.notes || ''}
                    onChange={(e) => handleEditFormChange('notes', e.target.value)}
                    className="input"
                    rows="3"
                    placeholder="Add any notes about this bet..."
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditingBet(null)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bets;
