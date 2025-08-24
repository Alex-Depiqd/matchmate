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
    const warnings = {};
    
    if (formData.bookmaker && formData.backStake) {
      const bookmaker = bookmakers.find(bm => bm.name === formData.bookmaker);
      if (bookmaker && parseFloat(formData.backStake) > bookmaker.currentBalance) {
        warnings.bookmaker = {
          required: parseFloat(formData.backStake),
          available: bookmaker.currentBalance,
          shortfall: parseFloat(formData.backStake) - bookmaker.currentBalance
        };
      }
    }
    
    if (formData.exchange && formData.liability) {
      const exchange = exchanges.find(ex => ex.name === formData.exchange);
      if (exchange && parseFloat(formData.liability) > exchange.currentBalance) {
        warnings.exchange = {
          required: parseFloat(formData.liability),
          available: exchange.currentBalance,
          shortfall: parseFloat(formData.liability) - exchange.currentBalance
        };
      }
    }
    
    setBalanceWarnings(warnings);
  }, [formData.bookmaker, formData.exchange, formData.backStake, formData.liability, bookmakers, exchanges]);

  // Auto-calculate lay stake when back stake, back odds, or lay odds change
  useEffect(() => {
    if (formData.backStake && formData.backOdds && formData.layOdds && !manualLayStake) {
      const layStake = calculateLayStake(
        parseFloat(formData.backStake), 
        parseFloat(formData.backOdds), 
        parseFloat(formData.layOdds)
      );
      const liability = calculateLiability(parseFloat(layStake), parseFloat(formData.layOdds));
      setFormData(prev => ({ ...prev, layStake, liability }));
    }
  }, [formData.backStake, formData.backOdds, formData.layOdds, manualLayStake]);

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
        const layStake = calculateLayStake(
          parseFloat(formData.backStake), 
          parseFloat(formData.backOdds), 
          parseFloat(formData.layOdds)
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

    // Check for balance warnings
    if (Object.keys(balanceWarnings).length > 0) {
      newErrors.balance = 'Insufficient funds detected';
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

      dataManager.addBet(newBet);
      
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
                <p><strong>{formData.bookmaker}:</strong> Need £{balanceWarnings.bookmaker.required.toFixed(2)}, have £{balanceWarnings.bookmaker.available.toFixed(2)}</p>
                <p className="text-xs">💡 Add £{balanceWarnings.bookmaker.shortfall.toFixed(2)} deposit in Cashflow tab</p>
              </div>
            )}
            {balanceWarnings.exchange && (
              <div>
                <p><strong>{formData.exchange}:</strong> Need £{balanceWarnings.exchange.required.toFixed(2)}, have £{balanceWarnings.exchange.available.toFixed(2)}</p>
                <p className="text-xs">💡 Add £{balanceWarnings.exchange.shortfall.toFixed(2)} deposit in Cashflow tab</p>
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
                  step="0.01"
                  min="1"
                  placeholder="2.00"
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label">Lay Odds</label>
                <input
                  type="number"
                  name="layOdds"
                  value={formData.layOdds}
                  onChange={handleInputChange}
                  step="0.01"
                  min="1"
                  placeholder="2.00"
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
                  step="0.01"
                  min="0"
                  placeholder="0.00"
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
                  step="0.01"
                  min="0"
                  placeholder="0.00"
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
