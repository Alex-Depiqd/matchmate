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

      if (formData.type === 'bookmaker') {
        const existingBookmaker = bookmakers.find(bm => bm.name === providerName);
        
        if (existingBookmaker) {
          // Update existing bookmaker
          const newTotalDeposits = formData.transactionType === 'deposit' 
            ? existingBookmaker.totalDeposits + amount
            : existingBookmaker.totalDeposits;
          
          const newBalance = formData.transactionType === 'deposit'
            ? existingBookmaker.currentBalance + amount
            : existingBookmaker.currentBalance - amount;

          dataManager.updateBookmaker(existingBookmaker.id, {
            totalDeposits: newTotalDeposits,
            currentBalance: newBalance
          });
        } else {
          // Add new bookmaker
          dataManager.addBookmaker({
            name: providerName,
            totalDeposits: formData.transactionType === 'deposit' ? amount : 0,
            currentBalance: formData.transactionType === 'deposit' ? amount : 0,
            commission: parseFloat(formData.commission) || 0,
            website: formData.website || '',
            notes: formData.notes || ''
          });
        }
      } else {
        const existingExchange = exchanges.find(ex => ex.name === providerName);
        
        if (existingExchange) {
          // Update existing exchange
          const newTotalDeposits = formData.transactionType === 'deposit' 
            ? existingExchange.totalDeposits + amount
            : existingExchange.totalDeposits;
          
          const newBalance = formData.transactionType === 'deposit'
            ? existingExchange.currentBalance + amount
            : existingExchange.currentBalance - amount;

          dataManager.updateExchange(existingExchange.id, {
            totalDeposits: newTotalDeposits,
            currentBalance: newBalance
          });
        } else {
          // Add new exchange
          dataManager.addExchange({
            name: providerName,
            totalDeposits: formData.transactionType === 'deposit' ? amount : 0,
            currentBalance: formData.transactionType === 'deposit' ? amount : 0,
            exposure: 0,
            commission: parseFloat(formData.commission) || 0,
            website: formData.website || '',
            notes: formData.notes || ''
          });
        }
      }

      resetForm();
      setShowAddForm(false);
      onRefresh();
      
      alert(`${formData.transactionType === 'deposit' ? 'Deposit' : 'Withdrawal'} recorded successfully!`);
    } catch (error) {
      console.error('Error handling cashflow:', error);
      alert('Error recording transaction. Please try again.');
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      type: item.category === 'Exchange' ? 'exchange' : 'bookmaker',
      name: item.name,
      amount: '',
      transactionType: 'deposit',
      commission: item.commission || '',
      website: item.website || '',
      notes: item.notes || ''
    });
    setShowAddForm(true);
  };

  const handleDelete = (item) => {
    if (confirm(`Are you sure you want to delete ${item.name}? This will remove all associated data.`)) {
      try {
        if (item.category === 'Exchange') {
          const updatedExchanges = exchanges.filter(ex => ex.id !== item.id);
          dataManager.setExchanges(updatedExchanges);
        } else {
          const updatedBookmakers = bookmakers.filter(bm => bm.id !== item.id);
          dataManager.setBookmakers(updatedBookmakers);
        }
        onRefresh();
        alert(`${item.name} deleted successfully!`);
      } catch (error) {
        console.error('Error deleting item:', error);
        alert('Error deleting item. Please try again.');
      }
    }
  };

  const getProviderOptions = () => {
    if (formData.type === 'bookmaker') {
      // Get existing bookmakers and add them to the list
      const existingNames = bookmakers.map(bm => bm.name);
      const ukBookmakers = UK_BOOKMAKERS.map(bm => bm.name);
      // Combine and remove duplicates, keeping existing ones first
      const allOptions = [...new Set([...existingNames, ...ukBookmakers])];
      return allOptions;
    } else {
      // Get existing exchanges and add them to the list
      const existingNames = exchanges.map(ex => ex.name);
      const ukExchanges = UK_EXCHANGES.map(ex => ex.name);
      // Combine and remove duplicates, keeping existing ones first
      const allOptions = [...new Set([...existingNames, ...ukExchanges])];
      return allOptions;
    }
  };

  const handleProviderSelect = (providerName) => {
    if (providerName === 'Custom...') {
      setShowCustomInput(true);
      setFormData(prev => ({ ...prev, name: '' }));
    } else {
      setShowCustomInput(false);
      setFormData(prev => ({ ...prev, name: providerName }));
      
      // Check if this is an existing provider first
      const existingProvider = formData.type === 'bookmaker' 
        ? bookmakers.find(bm => bm.name === providerName)
        : exchanges.find(ex => ex.name === providerName);
      
      if (existingProvider) {
        // Use existing provider's data
        setFormData(prev => ({
          ...prev,
          commission: existingProvider.commission || '',
          website: existingProvider.website || '',
          notes: existingProvider.notes || ''
        }));
      } else {
        // Auto-fill commission and website if available from UK providers
        const providers = formData.type === 'bookmaker' ? UK_BOOKMAKERS : UK_EXCHANGES;
        const provider = providers.find(p => p.name === providerName);
        if (provider) {
          setFormData(prev => ({
            ...prev,
            commission: provider.defaultCommission || '',
            website: provider.website || ''
          }));
        }
      }
    }
  };

  const sortedItems = () => {
    const items = activeTab === 'bookmakers' ? bookmakers : exchanges;
    return [...items].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'balance':
          aValue = a.currentBalance || 0;
          bValue = b.currentBalance || 0;
          break;
        case 'deposits':
          aValue = a.totalDeposits || 0;
          bValue = b.totalDeposits || 0;
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

  const totalDeposits = bookmakers.reduce((sum, bm) => sum + (bm.totalDeposits || 0), 0) + 
                       exchanges.reduce((sum, ex) => sum + (ex.totalDeposits || 0), 0);
  
  const totalBalance = bookmakers.reduce((sum, bm) => sum + (bm.currentBalance || 0), 0) + 
                      exchanges.reduce((sum, ex) => sum + (ex.currentBalance || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Cashflow Management</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-primary"
        >
          {showAddForm ? 'Cancel' : 'Add Transaction'}
        </button>
      </div>

      {/* Workflow Guide */}
      {!isWorkflowGuideCollapsed && (
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">💰 Cashflow Management Guide</h3>
              <div className="text-sm text-blue-800 space-y-1">
                <p><strong>Step 1:</strong> Record all deposits to bookmakers and exchanges</p>
                <p><strong>Step 2:</strong> Update balances after withdrawals or losses</p>
                <p><strong>Step 3:</strong> Monitor your total float and exposure</p>
                <p><strong>Step 4:</strong> Keep track of commission rates for accurate profit calculations</p>
              </div>
            </div>
            <button
              onClick={() => setIsWorkflowGuideCollapsed(true)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Hide guide
            </button>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Deposits</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalDeposits)}</p>
            </div>
            <div className="text-3xl">💰</div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Current Balance</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalBalance)}</p>
            </div>
            <div className="text-3xl">🏦</div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Net Position</p>
              <p className={`text-2xl font-bold ${totalBalance >= totalDeposits ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(totalBalance - totalDeposits)}
              </p>
            </div>
            <div className="text-3xl">📊</div>
          </div>
        </div>
      </div>

      {/* Add Transaction Form */}
      {showAddForm && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingItem ? `Edit ${editingItem.name}` : 
             (formData.name && (bookmakers.some(bm => bm.name === formData.name) || exchanges.some(ex => ex.name === formData.name)) 
              ? `Update ${formData.name}` 
              : 'Add New Transaction')}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Provider Type */}
            <div>
              <label className="label">Provider Type</label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="type"
                    value="bookmaker"
                    checked={formData.type === 'bookmaker'}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value, name: '' }))}
                    className="mr-2"
                  />
                  Bookmaker
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="type"
                    value="exchange"
                    checked={formData.type === 'exchange'}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value, name: '' }))}
                    className="mr-2"
                  />
                  Exchange
                </label>
              </div>
            </div>

            {/* Provider Selection */}
            <div>
              <label className="label">Provider</label>
              {showCustomInput ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter custom provider name"
                  className="input"
                />
              ) : (
                <CustomDropdown
                  value={formData.name}
                  onChange={handleProviderSelect}
                  options={getProviderOptions()}
                  placeholder="Select provider"
                />
              )}
            </div>

            {/* Transaction Type */}
            <div>
              <label className="label">Transaction Type</label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="transactionType"
                    value="deposit"
                    checked={formData.transactionType === 'deposit'}
                    onChange={(e) => setFormData(prev => ({ ...prev, transactionType: e.target.value }))}
                    className="mr-2"
                  />
                  Deposit
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="transactionType"
                    value="withdrawal"
                    checked={formData.transactionType === 'withdrawal'}
                    onChange={(e) => setFormData(prev => ({ ...prev, transactionType: e.target.value }))}
                    className="mr-2"
                  />
                  Withdrawal
                </label>
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="label">Amount (£)</label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                step="0.01"
                min="0"
                placeholder="0.00"
                className="input"
                required
              />
              {formData.name && (bookmakers.some(bm => bm.name === formData.name) || exchanges.some(ex => ex.name === formData.name)) && (
                <p className="text-sm text-gray-600 mt-1">
                  Current balance: {formatCurrency(
                    formData.type === 'bookmaker' 
                      ? bookmakers.find(bm => bm.name === formData.name)?.currentBalance || 0
                      : exchanges.find(ex => ex.name === formData.name)?.currentBalance || 0
                  )}
                </p>
              )}
            </div>

            {/* Commission */}
            <div>
              <label className="label">Commission Rate (%)</label>
              <input
                type="number"
                name="commission"
                value={formData.commission}
                onChange={(e) => setFormData(prev => ({ ...prev, commission: e.target.value }))}
                step="0.1"
                min="0"
                max="100"
                placeholder="0.0"
                className="input"
              />
            </div>

            {/* Website */}
            <div>
              <label className="label">Website (optional)</label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                placeholder="https://example.com"
                className="input"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="label">Notes (optional)</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any additional notes..."
                className="input"
                rows="3"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setShowAddForm(false);
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
                             <button
                 type="submit"
                 className="btn-primary"
               >
                 {editingItem ? 'Update' : 
                  (formData.name && (bookmakers.some(bm => bm.name === formData.name) || exchanges.some(ex => ex.name === formData.name))
                   ? 'Update Transaction'
                   : 'Add Transaction')}
               </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('bookmakers')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'bookmakers'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Bookmakers ({bookmakers.length})
        </button>
        <button
          onClick={() => setActiveTab('exchanges')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'exchanges'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Exchanges ({exchanges.length})
        </button>
      </div>

      {/* Items List */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {activeTab === 'bookmakers' ? 'Bookmakers' : 'Exchanges'}
          </h3>
          
          {/* Sort Controls */}
          <div className="flex items-center space-x-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="name">Name</option>
              <option value="balance">Balance</option>
              <option value="deposits">Deposits</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>

        {sortedItems().length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No {activeTab} added yet. Add your first {activeTab.slice(0, -1)} to get started!
          </p>
        ) : (
          <div className="space-y-3">
            {sortedItems().map((item) => (
              <div key={item.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h4 className="font-medium text-gray-900">{item.name}</h4>
                    {item.website && (
                      <a
                        href={item.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        🌐
                      </a>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    <span>Balance: {formatCurrency(item.currentBalance || 0)}</span>
                    <span className="mx-2">•</span>
                    <span>Deposits: {formatCurrency(item.totalDeposits || 0)}</span>
                    {item.commission > 0 && (
                      <>
                        <span className="mx-2">•</span>
                        <span>Commission: {item.commission}%</span>
                      </>
                    )}
                  </div>
                  {item.notes && (
                    <p className="text-xs text-gray-500 mt-1">{item.notes}</p>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEdit(item)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Cashflow;
