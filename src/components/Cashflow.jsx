import { useState } from 'react';
import { dataManager } from '../utils/storage';
import { formatCurrency } from '../utils/calculations';
import { UK_BOOKMAKERS, UK_EXCHANGES } from '../utils/bookmakerData';

// Custom Dropdown Component
const CustomDropdown = ({ value, onChange, options, placeholder, className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (option) => {
    onChange(option);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px] bg-white text-gray-900 flex justify-between items-center"
      >
        <span className={value ? 'text-gray-900' : 'text-gray-500'}>
          {value || placeholder}
        </span>
        <span className="text-gray-400">{isOpen ? '▲' : '▼'}</span>
      </button>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {options.map((option, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelect(option)}
              className="w-full px-4 py-3 text-left text-gray-900 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none border-b border-gray-100 last:border-b-0"
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const Cashflow = ({ bookmakers, exchanges, onRefresh }) => {
  const [activeTab, setActiveTab] = useState('bookmakers');
  const [showAddForm, setShowAddForm] = useState(false);
  const [isWorkflowGuideCollapsed, setIsWorkflowGuideCollapsed] = useState(false);
  const [formData, setFormData] = useState({
    type: 'bookmaker',
    name: '',
    amount: '',
    transactionType: 'deposit',
    commission: '',
    website: '',
    notes: ''
  });
  const [editingItem, setEditingItem] = useState(null);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customProviderName, setCustomProviderName] = useState('');



  const resetForm = () => {
    setFormData({
      type: 'bookmaker',
      name: '',
      amount: '',
      transactionType: 'deposit',
      commission: '',
      website: '',
      notes: ''
    });
    setEditingItem(null);
    setShowCustomInput(false);
    setCustomProviderName('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Clean and validate the provider name
    const providerName = formData.name.trim();
    

    
    if (!providerName || !formData.amount) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const amount = parseFloat(formData.amount);
      
      if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid amount');
        return;
      }
      
      if (editingItem) {
        // Update existing provider
        if (editingItem.type === 'bookmaker') {
          dataManager.updateBookmaker(editingItem.id, {
            ...editingItem,
            currentBalance: amount,
            commission: formData.commission || editingItem.commission,
            website: formData.website || editingItem.website,
            notes: formData.notes || editingItem.notes
          });
        } else {
          dataManager.updateExchange(editingItem.id, {
            ...editingItem,
            currentBalance: amount,
            commission: formData.commission || editingItem.commission,
            website: formData.website || editingItem.website,
            notes: formData.notes || editingItem.notes
          });
        }
      } else {
        // Add new provider
        if (formData.type === 'bookmaker') {
          dataManager.addBookmaker({
            id: `bm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: providerName,
            totalDeposits: amount,
            currentBalance: amount,
            commission: formData.commission || '',
            website: formData.website || '',
            notes: formData.notes || '',
            category: 'UK'
          });
        } else {
          dataManager.addExchange({
            id: `ex_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: providerName,
            totalDeposits: amount,
            currentBalance: amount,
            commission: formData.commission || '2.5',
            website: formData.website || '',
            notes: formData.notes || '',
            category: 'UK'
          });
        }
      }
      
      onRefresh();
      setShowAddForm(false);
      resetForm();
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('An error occurred. Please try again.');
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      type: item.type || 'bookmaker',
      name: item.name,
      amount: item.currentBalance.toString(),
      transactionType: 'deposit',
      commission: item.commission || '',
      website: item.website || '',
      notes: item.notes || ''
    });
    setShowAddForm('transaction');
  };

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
  


  const totalBookmakerDeposits = bookmakers.reduce((sum, bm) => sum + (bm.totalDeposits || 0), 0);
  const totalBookmakerBalances = bookmakers.reduce((sum, bm) => sum + (bm.currentBalance || 0), 0);
  const totalExchangeDeposits = exchanges.reduce((sum, ex) => sum + (ex.totalDeposits || 0), 0);
  const totalExchangeBalances = exchanges.reduce((sum, ex) => sum + (ex.currentBalance || 0), 0);

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
          <div className="flex items-center space-x-2">
            <span className="text-blue-600">💡</span>
            <h3 className="font-semibold text-blue-900">Workflow Guide</h3>
          </div>
          <button
            onClick={() => setIsWorkflowGuideCollapsed(!isWorkflowGuideCollapsed)}
            className="text-blue-600 hover:text-blue-800 transition-colors"
          >
            {isWorkflowGuideCollapsed ? '▼' : '▲'}
          </button>
        </div>
        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isWorkflowGuideCollapsed ? 'max-h-0 opacity-0' : 'max-h-32 opacity-100'
        }`}>
          <ol className="list-decimal list-inside space-y-1 text-blue-800 text-sm">
            <li>Record deposits before placing bets to track your funds</li>
            <li>Update balances regularly to maintain accurate profit/loss calculations</li>
          </ol>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Bookmakers</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Deposits:</span>
              <span className="font-medium">{formatCurrency(totalBookmakerDeposits)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Current Balances:</span>
              <span className="font-medium">{formatCurrency(totalBookmakerBalances)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span className="text-gray-600">Net Position:</span>
              <span className={`font-medium ${totalBookmakerBalances - totalBookmakerDeposits >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(totalBookmakerBalances - totalBookmakerDeposits)}
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Exchanges</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Deposits:</span>
              <span className="font-medium">{formatCurrency(totalExchangeDeposits)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Current Balances:</span>
              <span className="font-medium">{formatCurrency(totalExchangeBalances)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span className="text-gray-600">Net Position:</span>
              <span className={`font-medium ${totalExchangeBalances - totalExchangeDeposits >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(totalExchangeBalances - totalExchangeDeposits)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sorting Controls */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
        <div className="flex items-center space-x-3">
          <CustomDropdown
            value={sortBy}
            onChange={(value) => setSortBy(value)}
            options={[
              { value: 'name', label: 'Sort by Name' },
              { value: 'deposits', label: 'Sort by Deposits' },
              { value: 'netPosition', label: 'Sort by Net Position' }
            ].map(opt => opt.value)}
            placeholder="Sort by..."
            className="w-48"
          />
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="p-3 text-gray-600 hover:text-gray-800 transition-colors"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
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
          sortedBookmakers.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No bookmakers added yet.</p>
          ) : (
            sortedBookmakers.map((bookmaker) => (
              <div key={`bookmaker-${bookmaker.id}`} className="card">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-3 sm:space-y-0">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                                                                  <h3 className="text-lg font-semibold text-gray-900">
                        {bookmaker.name}
                      </h3>
                      {parseFloat(bookmaker.commission) > 0 && (
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                          {bookmaker.commission}% commission
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Total Deposits:</span>
                        <span className="ml-2 font-medium">£{(Number(bookmaker.totalDeposits) || 0).toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Current Balance:</span>
                        <span className="ml-2 font-medium">£{(Number(bookmaker.currentBalance) || 0).toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Net Position:</span>
                        <span className={`ml-2 font-medium ${(Number(bookmaker.currentBalance) || 0) - (Number(bookmaker.totalDeposits) || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          £{((Number(bookmaker.currentBalance) || 0) - (Number(bookmaker.totalDeposits) || 0)).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    {bookmaker.website && (
                      <div className="mt-2">
                        <a href={bookmaker.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-sm">
                          Visit Website →
                        </a>
                      </div>
                    )}
                    {bookmaker.notes && (
                      <div className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">Notes:</span> {bookmaker.notes}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleEdit(bookmaker)}
                    className="btn-secondary text-sm px-3 py-1"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))
          )
        ) : (
          sortedExchanges.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No exchanges added yet.</p>
          ) : (
            sortedExchanges.map((exchange) => (
              <div key={`exchange-${exchange.id}`} className="card">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-3 sm:space-y-0">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{exchange.name}</h3>
                      {exchange.commission && (
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                          {exchange.commission}% commission
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Total Deposits:</span>
                        <span className="ml-2 font-medium">{formatCurrency(Number(exchange.totalDeposits) || 0)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Current Balance:</span>
                        <span className="ml-2 font-medium">{formatCurrency(Number(exchange.currentBalance) || 0)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Net Position:</span>
                        <span className={`ml-2 font-medium ${(Number(exchange.currentBalance) || 0) - (Number(exchange.totalDeposits) || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency((Number(exchange.currentBalance) || 0) - (Number(exchange.totalDeposits) || 0))}
                        </span>
                      </div>
                    </div>
                    {exchange.website && (
                      <div className="mt-2">
                        <a href={exchange.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-sm">
                          Visit Website →
                        </a>
                      </div>
                    )}
                    {exchange.notes && (
                      <div className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">Notes:</span> {exchange.notes}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleEdit(exchange)}
                    className="btn-secondary text-sm px-3 py-1"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))
          )
        )}
      </div>

      {/* Add Provider Modal */}
      {showAddForm === 'new-provider' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Provider</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <CustomDropdown
                  value={formData.type}
                  onChange={(value) => setFormData({...formData, type: value})}
                  options={['bookmaker', 'exchange']}
                  placeholder="Select type..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                {!showCustomInput ? (
                  <CustomDropdown
                    value={formData.name}
                    onChange={(value) => {
                      if (value === 'Custom...') {
                        setShowCustomInput(true);
                        setFormData({...formData, name: ''});
                      } else {
                        setFormData({...formData, name: value});
                      }
                    }}
                    options={formData.type === 'bookmaker' 
                      ? UK_BOOKMAKERS.map(bm => bm.name)
                      : UK_EXCHANGES.map(ex => ex.name)
                    }
                    placeholder="Select a provider..."
                  />
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={customProviderName}
                      onChange={(e) => {
                        const cleanName = e.target.value.trim();
                        setCustomProviderName(cleanName);
                        setFormData({...formData, name: cleanName});
                      }}
                      className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px] bg-white text-gray-900"
                      placeholder="Enter custom provider name..."
                      required
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setShowCustomInput(false);
                        setCustomProviderName('');
                        setFormData({...formData, name: ''});
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      ← Back to list
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Initial Deposit</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Commission (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.commission}
                  onChange={(e) => setFormData({...formData, commission: e.target.value})}
                  className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
                  placeholder={formData.type === 'exchange' ? '2.5' : '0'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website (optional)</label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({...formData, website: e.target.value})}
                  className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
                  placeholder="Any additional notes..."
                  rows="3"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    resetForm();
                  }}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary"
                >
                  Add Provider
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Transaction Modal */}
      {showAddForm === 'transaction' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingItem ? `Edit ${editingItem.name}` : 'Add Transaction'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingItem && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Provider Type</label>
                    <CustomDropdown
                      value={formData.type}
                      onChange={(value) => setFormData({...formData, type: value, name: ''})}
                      options={['bookmaker', 'exchange']}
                      placeholder="Select type..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
                    <CustomDropdown
                      value={formData.name}
                      onChange={(value) => setFormData({...formData, name: value})}
                      options={formData.type === 'bookmaker' 
                        ? bookmakers.map(bm => bm.name)
                        : exchanges.map(ex => ex.name)
                      }
                      placeholder="Select a provider..."
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Type</label>
                <CustomDropdown
                  value={formData.transactionType}
                  onChange={(value) => setFormData({...formData, transactionType: value})}
                  options={['deposit', 'withdrawal']}
                  placeholder="Select transaction type..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
                  placeholder="0.00"
                  required
                />
              </div>

              {editingItem && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Commission (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.commission}
                      onChange={(e) => setFormData({...formData, commission: e.target.value})}
                      className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Website (optional)</label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({...formData, website: e.target.value})}
                      className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
                      placeholder="https://..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
                      placeholder="Any additional notes..."
                      rows="3"
                    />
                  </div>
                </>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    resetForm();
                  }}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary"
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
