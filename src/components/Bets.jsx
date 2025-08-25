import { useState } from 'react';
import { dataManager } from '../utils/storage';
import { calculateBetProfit, formatCurrency, calculateLiability, calculateLayStake } from '../utils/calculations';

const Bets = ({ bets, bookmakers, exchanges, onRefresh }) => {
  const [filter, setFilter] = useState('all'); // 'all', 'unsettled', 'settled'
  const [selectedBet, setSelectedBet] = useState(null);
  const [editingBet, setEditingBet] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [manualLayStake, setManualLayStake] = useState(false);

  const filteredBets = bets.filter(bet => {
    if (filter === 'unsettled') return bet.status === 'unsettled';
    if (filter === 'settled') return bet.status !== 'unsettled';
    return true;
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

    dataManager.updateBet(editingBet.id, updatedBet);
    
    // If status changed from settled to unsettled, we need to update balances
    if (editingBet.status !== 'unsettled' && editFormData.status === 'unsettled') {
      // Re-add the bet to balances (reverse the settlement)
      dataManager.addBetAndUpdateBalances(updatedBet);
    }
    
    // If status changed from unsettled to settled, we need to settle it
    if (editingBet.status === 'unsettled' && editFormData.status !== 'unsettled') {
      dataManager.settleBetAndUpdateBalances(editingBet.id, editFormData.status);
    }

    setEditingBet(null);
    setEditFormData({});
    onRefresh();
  };

  const handleCancelEdit = () => {
    setEditingBet(null);
    setEditFormData({});
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      unsettled: { color: 'bg-gray-100 text-gray-800', text: 'Unsettled' },
      back_won: { color: 'bg-green-100 text-green-800', text: 'Back Won' },
      lay_won: { color: 'bg-green-100 text-green-800', text: 'Lay Won' }
    };

    const config = statusConfig[status] || statusConfig.unsettled;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const getProfitColor = (profit) => {
    const numProfit = parseFloat(profit);
    if (numProfit > 0) return 'text-green-600';
    if (numProfit < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Bets</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All ({bets.length})
          </button>
          <button
            onClick={() => setFilter('unsettled')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              filter === 'unsettled' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Unsettled ({unsettledBets.length})
          </button>
          <button
            onClick={() => setFilter('settled')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              filter === 'settled' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Settled ({settledBets.length})
          </button>
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
          {filteredBets.map((bet) => (
            <div key={bet.id} className="card">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-semibold text-gray-900">{bet.event}</h3>
                    {getStatusBadge(bet.status)}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Bookmaker:</span>
                      <span className="font-medium ml-2">{bet.bookmaker}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Exchange:</span>
                      <span className="font-medium ml-2">{bet.exchange}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Type:</span>
                      <span className="font-medium ml-2 capitalize">{bet.type}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Back Stake:</span>
                      <span className="font-medium ml-2">{formatCurrency(bet.backStake)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm mt-2">
                    <div>
                      <span className="text-gray-500">Back Odds:</span>
                      <span className="font-medium ml-2">{bet.backOdds}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Lay Odds:</span>
                      <span className="font-medium ml-2">{bet.layOdds}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Liability:</span>
                      <span className="font-medium ml-2">{formatCurrency(bet.liability)}</span>
                    </div>
                    {bet.status !== 'unsettled' && (
                      <div>
                        <span className="text-gray-500">Profit:</span>
                        <span className={`font-medium ml-2 ${getProfitColor(bet.netProfit)}`}>
                          {formatCurrency(bet.netProfit)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-gray-400 mt-2">
                    Created: {new Date(bet.createdAt).toLocaleDateString()}
                    {bet.settledAt && (
                      <span className="ml-4">
                        Settled: {new Date(bet.settledAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col space-y-2 ml-4">
                  <button
                    onClick={() => handleEditBet(bet)}
                    className="btn-secondary text-sm px-3 py-1"
                  >
                    Edit
                  </button>
                  {bet.status === 'unsettled' && (
                    <>
                      <button
                        onClick={() => handleSettleBet(bet.id, 'back_won')}
                        className="btn-success text-sm px-3 py-1"
                      >
                        Back Won
                      </button>
                      <button
                        onClick={() => handleSettleBet(bet.id, 'lay_won')}
                        className="btn-danger text-sm px-3 py-1"
                      >
                        Lay Won
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
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

                {/* Bet Type and Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Bet Type</label>
                    <select
                      value={editFormData.type || ''}
                      onChange={(e) => handleEditFormChange('type', e.target.value)}
                      className="input"
                      required
                    >
                      <option value="qualifying">Qualifying Bet</option>
                      <option value="free">Free Bet</option>
                    </select>
                  </div>
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
                </div>

                {/* Back Bet Details */}
                <div className="card bg-blue-50 border-blue-200">
                  <h4 className="text-lg font-semibold text-blue-900 mb-3">Back Bet</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Stake (£)</label>
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
                      <label className="label">Odds</label>
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
                  </div>
                </div>

                {/* Lay Bet Details */}
                <div className="card bg-green-50 border-green-200">
                  <h4 className="text-lg font-semibold text-green-900 mb-3">Lay Bet</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                </div>

                {/* Notes */}
                <div>
                  <label className="label">Notes</label>
                  <textarea
                    value={editFormData.notes || ''}
                    onChange={(e) => handleEditFormChange('notes', e.target.value)}
                    className="input"
                    rows="3"
                    placeholder="Any additional notes..."
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
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
