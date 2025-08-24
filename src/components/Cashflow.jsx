import { useState } from 'react';
import { dataManager } from '../utils/storage';
import { formatCurrency } from '../utils/calculations';
import { UK_BOOKMAKERS, UK_EXCHANGES, searchProviders } from '../utils/bookmakerData';

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
  const [isWorkflowGuideCollapsed, setIsWorkflowGuideCollapsed] = useState(false);
  const [sortBy, setSortBy] = useState('name'); // 'name', 'deposits', 'netPosition'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc', 'desc'
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [formData, setFormData] = useState({
    type: 'bookmaker', // 'bookmaker' or 'exchange'
    name: '',
    action: 'deposit', // 'deposit' or 'withdrawal'
    amount: '',
    balance: '',
    exposure: '', // Only for exchanges
    commission: '',
    notes: '',
    website: ''
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
      exposure: '',
      commission: '',
      notes: '',
      website: ''
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
        let newTotalDeposits = existingBookmaker.totalDeposits;
        let newBalance = existingBookmaker.currentBalance;
        
        if (formData.action === 'deposit') {
          newTotalDeposits += amount;
          newBalance += amount;
        } else {
          // For withdrawal/update balance, only update the balance
          newBalance = parseFloat(balance);
        }

        const updateData = {
          totalDeposits: newTotalDeposits,
          currentBalance: newBalance
        };

        // Add additional fields if editing
        if (editingItem) {
          updateData.commission = parseFloat(formData.commission) || 0;
          updateData.notes = formData.notes;
          updateData.website = formData.website;
        }

        dataManager.updateBookmaker(existingBookmaker.id, updateData);
      } else {
        // Add new bookmaker
        dataManager.addBookmaker({
          name: formData.name,
          totalDeposits: formData.action === 'deposit' ? amount : 0,
          currentBalance: formData.action === 'deposit' ? amount : parseFloat(balance)
        });
      }
    } else {
      const existingExchange = exchanges.find(ex => ex.name === formData.name);
      
      if (existingExchange) {
        // Update existing exchange
        let newTotalDeposits = existingExchange.totalDeposits;
        let newBalance = existingExchange.currentBalance;
        
        if (formData.action === 'deposit') {
          newTotalDeposits += amount;
          newBalance += amount;
        } else {
          // For withdrawal/update balance, only update the balance
          newBalance = parseFloat(balance);
        }

        const updateData = {
          totalDeposits: newTotalDeposits,
          currentBalance: newBalance,
          exposure: editingItem ? parseFloat(exposure) : existingExchange.exposure
        };

        // Add additional fields if editing
        if (editingItem) {
          updateData.commission = parseFloat(formData.commission) || 0;
          updateData.notes = formData.notes;
          updateData.website = formData.website;
        }

        dataManager.updateExchange(existingExchange.id, updateData);
      } else {
        // Add new exchange
        dataManager.addExchange({
          name: formData.name,
          totalDeposits: formData.action === 'deposit' ? amount : 0,
          currentBalance: formData.action === 'deposit' ? amount : parseFloat(balance),
          exposure: parseFloat(exposure)
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
      exposure: type === 'exchange' ? (item.exposure || 0).toString() : '',
      commission: (item.commission || 0).toString(),
      notes: item.notes || '',
      website: item.website || ''
    });
    setShowAddForm('transaction');
  };

  const totalBookmakerDeposits = bookmakers.reduce((sum, bm) => sum + (bm.totalDeposits || 0), 0);
  const totalBookmakerBalances = bookmakers.reduce((sum, bm) => sum + (bm.currentBalance || 0), 0);
  const totalExchangeDeposits = exchanges.reduce((sum, ex) => sum + (ex.totalDeposits || 0), 0);
  const totalExchangeBalances = exchanges.reduce((sum, ex) => sum + (ex.currentBalance || 0), 0);
  const totalExposure = exchanges.reduce((sum, ex) => sum + (ex.exposure || 0), 0);

  // Sorting function
  const sortProviders = (providers) => {
    return [...providers].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'deposits':
          aValue = a.totalDeposits || 0;
          bValue = b.totalDeposits || 0;
          break;
        case 'netPosition':
          aValue = (a.currentBalance || 0) - (a.totalDeposits || 0);
          bValue = (b.currentBalance || 0) - (b.totalDeposits || 0);
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  };

  const sortedBookmakers = sortProviders(bookmakers);
  const sortedExchanges = sortProviders(exchanges);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <h2 className="text-2xl font-bold text-gray-900">Cashflow</h2>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          <button
            onClick={() => setShowAddForm('new-provider')}
            className="btn-secondary w-full sm:w-auto px-4 py-3 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
          >
            Add Provider
          </button>
          <button
            onClick={() => setShowAddForm('transaction')}
            className="btn-primary w-full sm:w-auto px-4 py-3 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
          >
            Add Transaction
          </button>
        </div>
      </div>

      {/* Workflow Guidance */}
      <div className="card bg-blue-50 border-blue-200">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold text-blue-900">💡 Workflow Guide</h3>
          <button
            onClick={() => setIsWorkflowGuideCollapsed(!isWorkflowGuideCollapsed)}
            className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
            aria-label={isWorkflowGuideCollapsed ? "Expand workflow guide" : "Collapse workflow guide"}
          >
            {isWorkflowGuideCollapsed ? '▼' : '▲'}
          </button>
        </div>
        <div 
          className={`text-sm text-blue-800 space-y-1 overflow-hidden transition-all duration-300 ease-in-out ${
            isWorkflowGuideCollapsed ? 'max-h-0 opacity-0' : 'max-h-32 opacity-100'
          }`}
        >
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

      {/* Tabs and Sorting */}
      <div className="border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
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
          
          {/* Sorting Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
            <label className="text-sm font-medium text-gray-700">Sort by:</label>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <button
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  className="text-base border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white min-h-[44px] w-full sm:w-auto flex items-center justify-between"
                  style={{ fontSize: '16px' }}
                >
                  <span>
                    {sortBy === 'name' ? 'Name' : 
                     sortBy === 'deposits' ? 'Deposits' : 
                     sortBy === 'netPosition' ? 'Net Position' : 'Name'}
                  </span>
                  <span className="ml-2">▼</span>
                </button>
                
                {showSortDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                    <div className="py-1">
                      {[
                        { value: 'name', label: 'Name' },
                        { value: 'deposits', label: 'Deposits' },
                        { value: 'netPosition', label: 'Net Position' }
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setSortBy(option.value);
                            setShowSortDropdown(false);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0 text-base"
                          style={{ fontSize: '16px' }}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="text-base text-gray-600 hover:text-gray-800 bg-white border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px] min-w-[44px] flex items-center justify-center"
                style={{ fontSize: '16px' }}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {activeTab === 'bookmakers' ? (
          sortedBookmakers.length === 0 ? (
            <div className="card">
              <p className="text-gray-500 text-center py-8">No bookmakers added yet. Add your first deposit to get started!</p>
            </div>
          ) : (
            sortedBookmakers.map((bookmaker) => (
              <div key={bookmaker.id} className="card">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-3 sm:space-y-0">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h4 className="font-semibold text-gray-900">{bookmaker.name}</h4>
                      {bookmaker.commission > 0 && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {bookmaker.commission}% commission
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 space-y-1">
                      <div className="flex flex-col sm:flex-row sm:gap-4">
                        <span>Deposits: {formatCurrency(bookmaker.totalDeposits)}</span>
                        <span>Balance: {formatCurrency(bookmaker.currentBalance)}</span>
                      </div>
                      {bookmaker.website && (
                        <div>
                          <a href={bookmaker.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            Visit Website →
                          </a>
                        </div>
                      )}
                      {bookmaker.notes && (
                        <div className="text-xs text-gray-600 italic">"{bookmaker.notes}"</div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-end sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                    <div className="text-right">
                      <div className={`font-medium text-lg ${
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
                      className="btn-secondary text-sm px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 w-full sm:w-auto"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))
          )
        ) : (
          sortedExchanges.length === 0 ? (
            <div className="card">
              <p className="text-gray-500 text-center py-8">No exchanges added yet. Add your first deposit to get started!</p>
            </div>
          ) : (
            sortedExchanges.map((exchange) => (
              <div key={exchange.id} className="card">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-3 sm:space-y-0">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h4 className="font-semibold text-gray-900">{exchange.name}</h4>
                      {exchange.commission > 0 && (
                        <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                          {exchange.commission}% commission
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 space-y-1">
                      <div className="flex flex-col sm:flex-row sm:gap-4">
                        <span>Deposits: {formatCurrency(exchange.totalDeposits)}</span>
                        <span>Balance: {formatCurrency(exchange.currentBalance)}</span>
                        <span>Exposure: {formatCurrency(exchange.exposure || 0)}</span>
                      </div>
                      {exchange.website && (
                        <div>
                          <a href={exchange.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            Visit Website →
                          </a>
                        </div>
                      )}
                      {exchange.notes && (
                        <div className="text-xs text-gray-600 italic">"{exchange.notes}"</div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-end sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                    <div className="text-right">
                      <div className={`font-medium text-lg ${
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
                      className="btn-secondary text-sm px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 w-full sm:w-auto"
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
      {showAddForm === 'transaction' && (
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

              {/* Additional fields when editing */}
              {editingItem && (
                <>
                  <div>
                    <label className="label">Commission Rate (%)</label>
                    <input
                      type="number"
                      name="commission"
                      value={formData.commission}
                      onChange={handleInputChange}
                      step="0.1"
                      min="0"
                      max="100"
                      placeholder="0.0"
                      className="input min-h-[44px] text-base"
                      style={{ fontSize: '16px' }}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.type === 'exchange' ? 'Exchange commission rate' : 'Bookmaker commission/fees'}
                    </p>
                  </div>

                  <div>
                    <label className="label">Website URL</label>
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      placeholder="https://example.com"
                      className="input min-h-[44px] text-base"
                      style={{ fontSize: '16px' }}
                    />
                  </div>

                  <div>
                    <label className="label">Notes</label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder="Any additional notes..."
                      className="input min-h-[80px] text-base resize-none"
                      style={{ fontSize: '16px' }}
                      rows="3"
                    />
                  </div>
                </>
              )}

              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    resetForm();
                  }}
                  className="btn-secondary w-full sm:w-auto px-4 py-3 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary w-full sm:w-auto px-4 py-3 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
                >
                  {editingItem ? 'Update' : 'Add Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Provider Modal */}
      {showAddForm === 'new-provider' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Provider</h3>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const amount = parseFloat(formData.amount) || 0;
              
              if (formData.type === 'bookmaker') {
                dataManager.addBookmaker({
                  name: formData.name,
                  totalDeposits: amount,
                  currentBalance: amount,
                  commission: parseFloat(formData.commission) || 0,
                  notes: formData.notes,
                  website: formData.website,
                  category: 'Major'
                });
              } else {
                dataManager.addExchange({
                  name: formData.name,
                  totalDeposits: amount,
                  currentBalance: amount,
                  exposure: 0,
                  commission: parseFloat(formData.commission) || 0,
                  notes: formData.notes,
                  website: formData.website,
                  category: 'Exchange'
                });
              }
              
              resetForm();
              setShowAddForm(false);
              onRefresh();
            }} className="space-y-4">
              
              <div>
                <label className="label">Provider Type</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-6 py-4 text-left border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white min-h-[56px] text-lg"
                  style={{ fontSize: '18px' }}
                  required
                >
                  <option value="">Select Type</option>
                  <option value="bookmaker">Bookmaker</option>
                  <option value="exchange">Exchange</option>
                </select>
              </div>

              <div>
                <label className="label">Select from UK List</label>
                <select
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-6 py-4 text-left border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white min-h-[56px] text-lg"
                  style={{ fontSize: '18px' }}
                  required
                >
                  <option value="">{`Select ${formData.type}`}</option>
                  {(formData.type === 'bookmaker' ? UK_BOOKMAKERS : UK_EXCHANGES).map((provider) => (
                    <option key={provider.name} value={provider.name}>
                      {formData.type === 'bookmaker' 
                        ? provider.name 
                        : `${provider.name} (${provider.defaultCommission}% commission)`
                      }
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Initial Deposit (£)</label>
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

              <div>
                <label className="label">Commission Rate (%)</label>
                <input
                  type="number"
                  name="commission"
                  value={formData.commission}
                  onChange={handleInputChange}
                  step="0.1"
                  min="0"
                  max="100"
                  placeholder="0.0"
                  className="input min-h-[44px] text-base"
                  style={{ fontSize: '16px' }}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.type === 'exchange' ? 'Exchange commission rate' : 'Bookmaker commission/fees'}
                </p>
              </div>

              <div>
                <label className="label">Website URL</label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  placeholder="https://example.com"
                  className="input min-h-[44px] text-base"
                  style={{ fontSize: '16px' }}
                />
              </div>

              <div>
                <label className="label">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Any additional notes..."
                  className="input min-h-[80px] text-base resize-none"
                  style={{ fontSize: '16px' }}
                  rows="3"
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    resetForm();
                  }}
                  className="btn-secondary w-full sm:w-auto px-4 py-3 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary w-full sm:w-auto px-4 py-3 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
                >
                  Add Provider
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
