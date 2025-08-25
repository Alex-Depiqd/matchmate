import { useState, useEffect } from 'react';
import { dataManager } from '../utils/storage';
import { calculateLiability, calculateLayStake } from '../utils/calculations';

// Custom Dropdown Component
const CustomDropdown = ({ label, value, onChange, options, error, placeholder, fieldName }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (option) => {
    onChange({ target: { name: fieldName, value: option } });
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <label className="label">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-3 text-left border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white ${error ? 'border-red-500' : ''} ${!value ? 'text-gray-500' : 'text-gray-900'}`}
        style={{ fontSize: '16px', minHeight: '44px' }}
      >
        {value || placeholder}
        <span className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {isOpen ? '▲' : '▼'}
        </span>
      </button>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {options.map((option) => (
            <button
              key={option.value || option}
              type="button"
              onClick={() => handleSelect(option.value || option)}
              className="w-full px-4 py-3 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none border-b border-gray-100 last:border-b-0"
              style={{ fontSize: '16px', minHeight: '44px' }}
            >
              {option.label || option}
            </button>
          ))}
        </div>
      )}
      
      {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
    </div>
  );
};

const AddBet = ({ bookmakers, exchanges, onBetAdded }) => {
  const [formData, setFormData] = useState({
    bookmaker: '',
    exchange: '',
    event: '',
    type: 'qualifying',
    backStake: '',
    backOdds: '',
    layOdds: '',
    layStake: '',
    liability: ''
  });

  const [selectedFreeBet, setSelectedFreeBet] = useState(null);
  const [stakeReturned, setStakeReturned] = useState(false);

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [manualLayStake, setManualLayStake] = useState(false);
  const [showWorkflowGuide, setShowWorkflowGuide] = useState(false);
  const [balanceWarnings, setBalanceWarnings] = useState({});

  // Check if this is the first time user is adding a bet
  useEffect(() => {
    const hasAddedBets = dataManager.getBets().length > 0;
    const hasDeposits = bookmakers.some(bm => bm.totalDeposits > 0) || exchanges.some(ex => ex.totalDeposits > 0);
    
    if (!hasAddedBets && !hasDeposits) {
      setShowWorkflowGuide(true);
    }
  }, [bookmakers, exchanges]);

  // Check balances when bookmaker/exchange/stake changes
  useEffect(() => {
    try {
      const warnings = {};
      
      // Only check bookmaker balance if it's NOT a free bet
      if (formData.bookmaker && formData.backStake && formData.type !== 'free') {
        const bookmaker = bookmakers.find(bm => bm.name === formData.bookmaker);
        if (bookmaker && parseFloat(formData.backStake) > (bookmaker.currentBalance || 0)) {
          warnings.bookmaker = {
            required: parseFloat(formData.backStake),
            available: bookmaker.currentBalance || 0,
            shortfall: parseFloat(formData.backStake) - (bookmaker.currentBalance || 0)
          };
        }
      }
      
      if (formData.exchange && formData.liability) {
        const exchange = exchanges.find(ex => ex.name === formData.exchange);
        if (exchange && parseFloat(formData.liability) > (exchange.currentBalance || 0)) {
          warnings.exchange = {
            required: parseFloat(formData.liability),
            available: exchange.currentBalance || 0,
            shortfall: parseFloat(formData.liability) - (exchange.currentBalance || 0)
          };
        }
      }
      
      setBalanceWarnings(warnings);
    } catch (error) {
      console.error('Error checking balances:', error);
      setBalanceWarnings({});
    }
  }, [formData.bookmaker, formData.exchange, formData.backStake, formData.liability, bookmakers, exchanges, formData.type]);

  // Auto-calculate lay stake when back stake, back odds, or lay odds change
  useEffect(() => {
    if (formData.backStake && formData.backOdds && formData.layOdds && !manualLayStake) {
      // Get commission from selected exchange
      const selectedExchange = exchanges.find(ex => ex.name === formData.exchange);
      const commission = selectedExchange ? (selectedExchange.commission || 0) / 100 : 0;
      
      console.log('Calculating lay stake with:', {
        backStake: formData.backStake,
        backOdds: formData.backOdds,
        layOdds: formData.layOdds,
        isFreeBet: formData.type === 'free',
        stakeReturned: stakeReturned,
        commission: commission
      });
      
      const layStake = calculateLayStake(
        parseFloat(formData.backStake), 
        parseFloat(formData.backOdds), 
        parseFloat(formData.layOdds),
        formData.type === 'free',
        stakeReturned,
        commission
      );
      const liability = calculateLiability(parseFloat(layStake), parseFloat(formData.layOdds));
      
      console.log('Calculated:', { layStake, liability });
      
      setFormData(prev => ({ ...prev, layStake, liability }));
    }
  }, [formData.backStake, formData.backOdds, formData.layOdds, manualLayStake, formData.type, stakeReturned, formData.exchange, exchanges]);

  // Update liability when lay stake is manually changed
  useEffect(() => {
    if (manualLayStake && formData.layStake && formData.layOdds) {
      const liability = calculateLiability(parseFloat(formData.layStake), parseFloat(formData.layOdds));
      setFormData(prev => ({ ...prev, liability }));
    }
  }, [formData.layStake, formData.layOdds, manualLayStake]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleManualLayStakeToggle = (e) => {
    setManualLayStake(e.target.checked);
    if (!e.target.checked) {
      // Re-enable auto-calculation
      if (formData.backStake && formData.backOdds && formData.layOdds) {
        // Get commission from selected exchange
        const selectedExchange = exchanges.find(ex => ex.name === formData.exchange);
        const commission = selectedExchange ? (selectedExchange.commission || 0) / 100 : 0;
        
        const layStake = calculateLayStake(
          parseFloat(formData.backStake), 
          parseFloat(formData.backOdds), 
          parseFloat(formData.layOdds),
          formData.type === 'free',
          stakeReturned,
          commission
        );
        const liability = calculateLiability(parseFloat(layStake), parseFloat(formData.layOdds));
        setFormData(prev => ({ ...prev, layStake, liability }));
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.bookmaker) newErrors.bookmaker = 'Bookmaker is required';
    if (!formData.exchange) newErrors.exchange = 'Exchange is required';
    if (!formData.event) newErrors.event = 'Event description is required';
    if (!formData.backStake || parseFloat(formData.backStake) <= 0) {
      newErrors.backStake = 'Valid back stake is required';
    }
    if (!formData.backOdds || parseFloat(formData.backOdds) <= 1) {
      newErrors.backOdds = 'Valid back odds are required';
    }
    if (!formData.layOdds || parseFloat(formData.layOdds) <= 1) {
      newErrors.layOdds = 'Valid lay odds are required';
    }
    if (!formData.liability || parseFloat(formData.liability) <= 0) {
      newErrors.liability = 'Valid liability is required';
    }
    if (!formData.layStake || parseFloat(formData.layStake) <= 0) {
      newErrors.layStake = 'Valid lay stake is required';
    }

    // Check for balance warnings (but allow free bets to bypass bookmaker balance check)
    if (Object.keys(balanceWarnings).length > 0) {
      // Only show balance error if it's not a free bet OR if it's an exchange balance issue
      const hasBookmakerBalanceIssue = balanceWarnings.bookmaker && formData.type !== 'free';
      const hasExchangeBalanceIssue = balanceWarnings.exchange;
      
      if (hasBookmakerBalanceIssue || hasExchangeBalanceIssue) {
        newErrors.balance = 'Insufficient funds detected';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const newBet = {
        bookmaker: formData.bookmaker,
        exchange: formData.exchange,
        event: formData.event,
        type: formData.type,
        backStake: parseFloat(formData.backStake),
        backOdds: parseFloat(formData.backOdds),
        layStake: parseFloat(formData.layStake),
        layOdds: parseFloat(formData.layOdds),
        liability: parseFloat(formData.liability),
        status: 'unsettled'
      };

      dataManager.addBetAndUpdateBalances(newBet);
      
      // If this was a free bet and we have a selected free bet, mark it as used
      if (formData.type === 'free' && selectedFreeBet) {
        dataManager.updateFreeBet(selectedFreeBet.id, {
          status: 'used',
          usedAt: new Date().toISOString()
        });
      }
      
      // Reset form
      setFormData({
        bookmaker: '',
        exchange: '',
        event: '',
        type: 'qualifying',
        backStake: '',
        backOdds: '',
        layOdds: '',
        layStake: '',
        liability: ''
      });
      setSelectedFreeBet(null);

      onBetAdded();
      
      // Show success message
      alert('Bet added successfully!');
    } catch (error) {
      console.error('Error adding bet:', error);
      alert('Error adding bet. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add error boundary for the entire component
  if (!bookmakers || !exchanges) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card bg-red-50 border-red-200">
          <h3 className="text-lg font-semibold text-red-900 mb-2">⚠️ Error Loading Data</h3>
          <p className="text-sm text-red-800">Unable to load bookmakers and exchanges. Please refresh the page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Workflow Guide */}
      {showWorkflowGuide && (
        <div className="card bg-blue-50 border-blue-200 mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">🎯 Getting Started with Matched Betting</h3>
              <div className="text-sm text-blue-800 space-y-2">
                <p><strong>Step 1:</strong> Record your deposits in the Cashflow tab first</p>
                <p><strong>Step 2:</strong> Add your matched bet details below</p>
                <p><strong>Step 3:</strong> Track your profits and seed repayment progress</p>
              </div>
            </div>
            <button
              onClick={() => setShowWorkflowGuide(false)}
              className="bg-blue-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 text-sm self-start whitespace-nowrap"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Balance Warnings */}
      {Object.keys(balanceWarnings).length > 0 && (
        <div className="card bg-red-50 border-red-200 mb-6">
          <h3 className="text-lg font-semibold text-red-900 mb-2">⚠️ Insufficient Funds Detected</h3>
          <div className="text-sm text-red-800 space-y-2">
            {balanceWarnings.bookmaker && (
              <div>
                <p><strong>{formData.bookmaker || 'Bookmaker'}:</strong> Need £{(balanceWarnings.bookmaker.required || 0).toFixed(2)}, have £{(balanceWarnings.bookmaker.available || 0).toFixed(2)}</p>
                <p className="text-xs">
                  {formData.type === 'free' ? 
                    "💡 Free bets don't require bookmaker balance" :
                    `💡 Add £${(balanceWarnings.bookmaker.shortfall || 0).toFixed(2)} deposit in Cashflow tab`
                  }
                </p>
              </div>
            )}
            {balanceWarnings.exchange && (
              <div>
                <p><strong>{formData.exchange || 'Exchange'}:</strong> Need £{(balanceWarnings.exchange.required || 0).toFixed(2)}, have £{(balanceWarnings.exchange.available || 0).toFixed(2)}</p>
                <p className="text-xs">💡 Add £{(balanceWarnings.exchange.shortfall || 0).toFixed(2)} deposit in Cashflow tab</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Workflow Reminder */}
      {!showWorkflowGuide && (
        <div className="card bg-green-50 border-green-200 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-sm text-green-800 flex-1">
              <strong>💡 Tip:</strong> Remember to record deposits in Cashflow before placing bets
            </div>
            <button
              onClick={() => setShowWorkflowGuide(true)}
              className="bg-green-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-green-700 transition-colors duration-200 text-sm self-start whitespace-nowrap"
            >
              Show guide
            </button>
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Bet</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Bookmaker and Exchange */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CustomDropdown
              label="Bookmaker"
              value={formData.bookmaker}
              onChange={handleInputChange}
              options={bookmakers.map(bm => ({ value: bm.name, label: bm.name }))}
              error={errors.bookmaker}
              placeholder="Select Bookmaker"
              fieldName="bookmaker"
            />

            <CustomDropdown
              label="Exchange"
              value={formData.exchange}
              onChange={handleInputChange}
              options={exchanges.map(ex => ({ value: ex.name, label: ex.name }))}
              error={errors.exchange}
              placeholder="Select Exchange"
              fieldName="exchange"
            />
          </div>

          {/* Bet Type */}
          <CustomDropdown
            label="Bet Type"
            value={formData.type === 'qualifying' ? 'Qualifying Bet' : 'Free Bet'}
            onChange={handleInputChange}
            options={[
              { value: 'qualifying', label: 'Qualifying Bet' },
              { value: 'free', label: 'Free Bet' }
            ]}
            placeholder="Select Bet Type"
            fieldName="type"
          />

          {/* Free Bet Selector */}
          {formData.type === 'free' && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <label className="label text-blue-900">Select Free Bet to Use</label>
              <select
                value={selectedFreeBet ? selectedFreeBet.id : ''}
                onChange={(e) => {
                  const freeBets = dataManager.getFreeBets();
                  const selected = freeBets.find(fb => fb.id === e.target.value);
                  setSelectedFreeBet(selected);
                  if (selected) {
                    setFormData(prev => ({ ...prev, backStake: selected.value.toString() }));
                  }
                }}
                className="input"
              >
                <option value="">Choose a free bet...</option>
                {dataManager.getFreeBets()
                  .filter(fb => fb.status === 'pending' && fb.bookmaker === formData.bookmaker)
                  .map(fb => (
                    <option key={fb.id} value={fb.id}>
                      {fb.bookmaker} - £{fb.value} {fb.expiryDate ? `(expires ${new Date(fb.expiryDate).toLocaleDateString()})` : ''}
                    </option>
                  ))}
              </select>
              {selectedFreeBet && (
                <p className="text-sm text-blue-700 mt-2">
                  Using free bet: £{selectedFreeBet.value} from {selectedFreeBet.bookmaker}
                </p>
              )}
              
              {/* Stake Returned Checkbox for Free Bets */}
              <div className="mt-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={stakeReturned}
                    onChange={(e) => {
                      setStakeReturned(e.target.checked);
                      console.log('Stake returned changed to:', e.target.checked);
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-blue-800">
                    Stake is returned (rare - only for certain bookmakers)
                  </span>
                </label>
                <p className="text-xs text-blue-600 mt-1">
                  Most free bets only return winnings, not the stake. Only check this if your bookmaker specifically returns the stake.
                </p>
              </div>
            </div>
          )}

          {/* Event Details */}
          <div>
            <label className="label">Event Description</label>
            <input
              type="text"
              name="event"
              value={formData.event}
              onChange={handleInputChange}
              placeholder="e.g., Arsenal v Spurs - Draw"
              className={`input min-h-[44px] text-base ${errors.event ? 'border-red-500' : ''}`}
              style={{ fontSize: '16px' }} // Prevents zoom on iOS
            />
            {errors.event && <p className="text-red-600 text-sm mt-1">{errors.event}</p>}
          </div>

          {/* Result Selection (Optional) */}
          <div>
            <label className="label">Result (Optional)</label>
            <select
              name="result"
              value={formData.result || ''}
              onChange={handleInputChange}
              className="input"
            >
              <option value="">Select result...</option>
              <option value="home">Home Win</option>
              <option value="away">Away Win</option>
              <option value="draw">Draw</option>
            </select>
          </div>

          {/* Back Bet Details */}
          <div className="card bg-blue-50 border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">Back Bet</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Stake (£)</label>
                <input
                  type="number"
                  name="backStake"
                  value={formData.backStake}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className={`input min-h-[44px] text-base ${errors.backStake ? 'border-red-500' : ''}`}
                  style={{ fontSize: '16px' }} // Prevents zoom on iOS
                />
                {errors.backStake && <p className="text-red-600 text-sm mt-1">{errors.backStake}</p>}
              </div>

              <div>
                <label className="label">Odds</label>
                <input
                  type="number"
                  name="backOdds"
                  value={formData.backOdds}
                  onChange={handleInputChange}
                  step="0.001"
                  min="1"
                  placeholder="2.000"
                  className={`input min-h-[44px] text-base ${errors.backOdds ? 'border-red-500' : ''}`}
                  style={{ fontSize: '16px' }} // Prevents zoom on iOS
                />
                {errors.backOdds && <p className="text-red-600 text-sm mt-1">{errors.backOdds}</p>}
              </div>
            </div>
          </div>

          {/* Lay Bet Details */}
          <div className="card bg-green-50 border-green-200">
            <h3 className="text-lg font-semibold text-green-900 mb-4">Lay Bet</h3>
            
            {/* Calculation Method Indicator */}
            {formData.backStake && formData.backOdds && formData.layOdds && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                {(() => {
                  const selectedExchange = exchanges.find(ex => ex.name === formData.exchange);
                  const commission = selectedExchange ? (selectedExchange.commission || 0) / 100 : 0;
                  const commissionPercent = (commission * 100).toFixed(1);
                  
                  return (
                    <>
                      <p className="text-sm text-blue-800">
                        <strong>Calculation Method:</strong> {
                          formData.type === 'free' && !stakeReturned 
                            ? `Free bet (winnings only): (£${formData.backStake} × ${formData.backOdds - 1}) ÷ (${formData.layOdds} - ${commission})`
                            : `Standard: (£${formData.backStake} × ${formData.backOdds}) ÷ (${formData.layOdds} - ${commission})`
                        }
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Using {commissionPercent}% exchange commission. Lay stake = {formData.layStake || 'calculating...'}
                      </p>
                    </>
                  );
                })()}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div>
                      <label className="label">Lay Odds</label>
                      <input
                        type="number"
                        name="layOdds"
                        value={formData.layOdds}
                        onChange={handleInputChange}
                        step="0.001"
                        min="1"
                        placeholder="2.000"
                        className={`input min-h-[44px] text-base ${errors.layOdds ? 'border-red-500' : ''}`}
                        style={{ fontSize: '16px' }} // Prevents zoom on iOS
                      />
                      {errors.layOdds && <p className="text-red-600 text-sm mt-1">{errors.layOdds}</p>}
                    </div>

              <div>
                <label className="label">Liability (£)</label>
                <input
                  type="number"
                  name="liability"
                  value={formData.liability}
                  onChange={handleInputChange}
                  step="0.001"
                  min="0"
                  placeholder="0.000"
                  className={`input min-h-[44px] text-base ${errors.liability ? 'border-red-500' : ''}`}
                  style={{ fontSize: '16px' }} // Prevents zoom on iOS
                />
                {errors.liability && <p className="text-red-600 text-sm mt-1">{errors.liability}</p>}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="label mb-0">Lay Stake (£)</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="manualLayStake"
                      checked={manualLayStake}
                      onChange={handleManualLayStakeToggle}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="manualLayStake" className="text-sm text-gray-600">
                      Manual override
                    </label>
                  </div>
                </div>
                <input
                  type="number"
                  name="layStake"
                  value={formData.layStake}
                  onChange={handleInputChange}
                  readOnly={!manualLayStake}
                  step="0.001"
                  min="0"
                  placeholder="0.000"
                  className={`input min-h-[44px] text-base ${!manualLayStake ? 'bg-gray-100' : ''} ${errors.layStake ? 'border-red-500' : ''}`}
                  style={{ fontSize: '16px' }} // Prevents zoom on iOS
                />
                <p className="text-xs text-gray-500 mt-1">
                  {manualLayStake ? 'Manual entry enabled' : 'Auto-calculated'}
                </p>
                {errors.layStake && <p className="text-red-600 text-sm mt-1">{errors.layStake}</p>}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary px-8 py-3"
            >
              {isSubmitting ? 'Adding...' : 'Add Bet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBet;
