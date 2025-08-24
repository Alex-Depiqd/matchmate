import { useState } from 'react';
import { dataManager } from '../utils/storage';
import { formatCurrency } from '../utils/calculations';

// Custom Dropdown Component (reusing from AddBet)
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

const Cashflow = ({ bookmakers, exchanges, onRefresh }) => {
  const [activeTab, setActiveTab] = useState('bookmakers');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    type: 'bookmaker', // 'bookmaker' or 'exchange'
    name: '',
    action: 'deposit', // 'deposit' or 'withdrawal'
    amount: '',
    balance: '',
    exposure: '' // Only for exchanges
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      type: 'bookmaker',
      name: '',
      action: 'deposit',
      amount: '',
      balance: '',
      exposure: ''
    });
    setEditingItem(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const amount = parseFloat(formData.amount) || 0;
    const balance = parseFloat(formData.balance) || 0;
    const exposure = parseFloat(formData.exposure) || 0;

    if (formData.type === 'bookmaker') {
      const existingBookmaker = bookmakers.find(bm => bm.name === formData.name);
      
      if (existingBookmaker) {
        // Update existing bookmaker
        const newTotalDeposits = formData.action === 'deposit' 
          ? existingBookmaker.totalDeposits + amount
          : existingBookmaker.totalDeposits;
        
        const newBalance = formData.action === 'deposit'
          ? existingBookmaker.currentBalance + amount
          : balance;

        dataManager.updateBookmaker(existingBookmaker.id, {
          totalDeposits: newTotalDeposits,
          currentBalance: newBalance
        });
      } else {
        // Add new bookmaker
        dataManager.addBookmaker({
          name: formData.name,
          totalDeposits: formData.action === 'deposit' ? amount : 0,
          currentBalance: formData.action === 'deposit' ? amount : balance
        });
      }
    } else {
      const existingExchange = exchanges.find(ex => ex.name === formData.name);
      
      if (existingExchange) {
        // Update existing exchange
        const newTotalDeposits = formData.action === 'deposit' 
          ? existingExchange.totalDeposits + amount
          : existingExchange.totalDeposits;
        
        const newBalance = formData.action === 'deposit'
          ? existingExchange.currentBalance + amount
          : balance;

        dataManager.updateExchange(existingExchange.id, {
          totalDeposits: newTotalDeposits,
          currentBalance: newBalance,
          exposure: editingItem ? exposure : existingExchange.exposure
        });
      } else {
        // Add new exchange
        dataManager.addExchange({
          name: formData.name,
          totalDeposits: formData.action === 'deposit' ? amount : 0,
          currentBalance: formData.action === 'deposit' ? amount : balance,
          exposure: exposure
        });
      }
    }

    resetForm();
    setShowAddForm(false);
    onRefresh();
  };

  const handleEdit = (item, type) => {
    setEditingItem({ ...item, type });
    setFormData({
      type: type,
      name: item.name,
      action: 'withdrawal',
      amount: '',
      balance: item.currentBalance.toString(),
      exposure: type === 'exchange' ? (item.exposure || 0).toString() : ''
    });
    setShowAddForm(true);
  };

  const totalBookmakerDeposits = bookmakers.reduce((sum, bm) => sum + (bm.totalDeposits || 0), 0);
  const totalBookmakerBalances = bookmakers.reduce((sum, bm) => sum + (bm.currentBalance || 0), 0);
  const totalExchangeDeposits = exchanges.reduce((sum, ex) => sum + (ex.totalDeposits || 0), 0);
  const totalExchangeBalances = exchanges.reduce((sum, ex) => sum + (ex.currentBalance || 0), 0);
  const totalExposure = exchanges.reduce((sum, ex) => sum + (ex.exposure || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Cashflow</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn-primary"
        >
          Add Transaction
        </button>
      </div>

      {/* Workflow Guidance */}
      <div className="card bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">💡 Workflow Guide</h3>
        <div className="text-sm text-blue-800 space-y-1">
          <p>1. <strong>Record deposits</strong> before placing bets to track your funds</p>
          <p>2. <strong>Update balances</strong> regularly to maintain accurate positions</p>
          <p>3. <strong>Track exposure</strong> on exchanges to monitor your liability</p>
          <p>4. <strong>Review net positions</strong> to see your overall financial status</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bookmakers Summary */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Bookmakers</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Deposits:</span>
              <span className="font-medium">{formatCurrency(totalBookmakerDeposits)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Current Balances:</span>
              <span className="font-medium">{formatCurrency(totalBookmakerBalances)}</span>
            </div>
            <hr className="border-gray-200" />
            <div className="flex justify-between font-semibold">
              <span>Net Position:</span>
              <span className={totalBookmakerBalances >= totalBookmakerDeposits ? 'text-green-600' : 'text-red-600'}>
                {formatCurrency(totalBookmakerBalances - totalBookmakerDeposits)}
              </span>
            </div>
          </div>
        </div>

        {/* Exchanges Summary */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Exchanges</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Deposits:</span>
              <span className="font-medium">{formatCurrency(totalExchangeDeposits)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Current Balances:</span>
              <span className="font-medium">{formatCurrency(totalExchangeBalances)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Exposure:</span>
              <span className="font-medium">{formatCurrency(totalExposure)}</span>
            </div>
            <hr className="border-gray-200" />
            <div className="flex justify-between font-semibold">
              <span>Net Position:</span>
              <span className={totalExchangeBalances >= totalExchangeDeposits ? 'text-green-600' : 'text-red-600'}>
                {formatCurrency(totalExchangeBalances - totalExchangeDeposits)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('bookmakers')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'bookmakers'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Bookmakers ({bookmakers.length})
          </button>
          <button
            onClick={() => setActiveTab('exchanges')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'exchanges'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Exchanges ({exchanges.length})
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {activeTab === 'bookmakers' ? (
          bookmakers.length === 0 ? (
            <div className="card">
              <p className="text-gray-500 text-center py-8">No bookmakers added yet. Add your first deposit to get started!</p>
            </div>
          ) : (
            bookmakers.map((bookmaker) => (
              <div key={bookmaker.id} className="card">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold text-gray-900">{bookmaker.name}</h4>
                    <div className="text-sm text-gray-500 mt-1">
                      Deposits: {formatCurrency(bookmaker.totalDeposits)} • 
                      Balance: {formatCurrency(bookmaker.currentBalance)}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className={`font-medium ${
                        bookmaker.currentBalance >= bookmaker.totalDeposits ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(bookmaker.currentBalance - bookmaker.totalDeposits)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Net Position
                      </div>
                    </div>
                    <button
                      onClick={() => handleEdit(bookmaker, 'bookmaker')}
                      className="btn-secondary text-sm px-3 py-1"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))
          )
        ) : (
          exchanges.length === 0 ? (
            <div className="card">
              <p className="text-gray-500 text-center py-8">No exchanges added yet. Add your first deposit to get started!</p>
            </div>
          ) : (
            exchanges.map((exchange) => (
              <div key={exchange.id} className="card">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold text-gray-900">{exchange.name}</h4>
                    <div className="text-sm text-gray-500 mt-1">
                      Deposits: {formatCurrency(exchange.totalDeposits)} • 
                      Balance: {formatCurrency(exchange.currentBalance)} • 
                      Exposure: {formatCurrency(exchange.exposure || 0)}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className={`font-medium ${
                        exchange.currentBalance >= exchange.totalDeposits ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(exchange.currentBalance - exchange.totalDeposits)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Net Position
                      </div>
                    </div>
                    <button
                      onClick={() => handleEdit(exchange, 'exchange')}
                      className="btn-secondary text-sm px-3 py-1"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))
          )
        )}
      </div>

      {/* Add/Edit Transaction Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingItem ? 'Edit Transaction' : 'Add Transaction'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Type</label>
                <CustomDropdown
                  label=""
                  value={formData.type === 'bookmaker' ? 'Bookmaker' : 'Exchange'}
                  onChange={handleInputChange}
                  options={[
                    { value: 'bookmaker', label: 'Bookmaker' },
                    { value: 'exchange', label: 'Exchange' }
                  ]}
                  placeholder="Select Type"
                  fieldName="type"
                />
              </div>

              <div>
                <label className="label">Name</label>
                {editingItem ? (
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    className="input min-h-[44px] text-base bg-gray-100"
                    style={{ fontSize: '16px' }}
                    disabled
                  />
                ) : (
                  <CustomDropdown
                    label=""
                    value={formData.name}
                    onChange={handleInputChange}
                    options={formData.type === 'bookmaker' 
                      ? bookmakers.map(bm => ({ value: bm.name, label: bm.name }))
                      : exchanges.map(ex => ({ value: ex.name, label: ex.name }))
                    }
                    placeholder={`Select ${formData.type}`}
                    fieldName="name"
                  />
                )}
              </div>

              <div>
                <label className="label">Action</label>
                <CustomDropdown
                  label=""
                  value={formData.action === 'deposit' ? 'Deposit' : 'Withdrawal/Update Balance'}
                  onChange={handleInputChange}
                  options={[
                    { value: 'deposit', label: 'Deposit' },
                    { value: 'withdrawal', label: 'Withdrawal/Update Balance' }
                  ]}
                  placeholder="Select Action"
                  fieldName="action"
                />
              </div>

              {formData.action === 'deposit' && (
                <div>
                  <label className="label">Amount (£)</label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="input min-h-[44px] text-base"
                    style={{ fontSize: '16px' }}
                    required
                  />
                </div>
              )}

              {formData.action === 'withdrawal' && (
                <div>
                  <label className="label">Current Balance (£)</label>
                  <input
                    type="number"
                    name="balance"
                    value={formData.balance}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="input min-h-[44px] text-base"
                    style={{ fontSize: '16px' }}
                    required
                  />
                </div>
              )}

              {/* Exposure field for exchanges */}
              {formData.type === 'exchange' && (
                <div>
                  <label className="label">Current Exposure (£)</label>
                  <input
                    type="number"
                    name="exposure"
                    value={formData.exposure}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="input min-h-[44px] text-base"
                    style={{ fontSize: '16px' }}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Total liability from your lay bets
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    resetForm();
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  {editingItem ? 'Update' : 'Add Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cashflow;
