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
        <span className="text-gray-400">
          {isOpen ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </span>
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

// Searchable Dropdown Component
const SearchableDropdown = ({ value, onChange, options, placeholder, className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleSelect = (option) => {
    onChange(option);
    setIsOpen(false);
    setSearchTerm('');
  };

  const filteredOptions = options.filter(option => 
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <span className="text-gray-400">
          {isOpen ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </span>
      </button>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-200">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
          </div>
          
          {/* Options List */}
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className="w-full px-4 py-3 text-left text-gray-900 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none border-b border-gray-100 last:border-b-0"
                >
                  {option}
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-gray-500 text-sm">
                No matches found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const Cashflow = ({ bookmakers, exchanges, onRefresh }) => {
  try {
    // Safety check to ensure data is valid
    const safeBookmakers = Array.isArray(bookmakers) ? bookmakers.filter(bm => bm && bm.name) : [];
    const safeExchanges = Array.isArray(exchanges) ? exchanges.filter(ex => ex && ex.name) : [];

    const [activeTab, setActiveTab] = useState('bookmakers');
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [sortBy, setSortBy] = useState('name');
    const [sortOrder, setSortOrder] = useState('asc');
    const [isWorkflowGuideCollapsed, setIsWorkflowGuideCollapsed] = useState(false);
    const [isBookmakersCollapsed, setIsBookmakersCollapsed] = useState(false);
    const [isExchangesCollapsed, setIsExchangesCollapsed] = useState(false);
    const [bookmakerSearchTerm, setBookmakerSearchTerm] = useState('');
    const [exchangeSearchTerm, setExchangeSearchTerm] = useState('');

    const [formData, setFormData] = useState({
      type: 'bookmaker',
      name: '',
      amount: '',
      transactionType: 'deposit',
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });

    const totalDeposits = safeBookmakers.reduce((sum, bm) => sum + (bm.totalDeposits || 0), 0) +
                         safeExchanges.reduce((sum, ex) => sum + (ex.totalDeposits || 0), 0);
    
    const totalBalance = safeBookmakers.reduce((sum, bm) => sum + (bm.currentBalance || 0), 0) +
                        safeExchanges.reduce((sum, ex) => sum + (ex.currentBalance || 0), 0);

    const showCustomInput = !formData.name || 
      (!safeBookmakers.some(bm => bm.name === formData.name) && 
       !safeExchanges.some(ex => ex.name === formData.name));

    const sortedItems = () => {
      const items = activeTab === 'bookmakers' ? safeBookmakers : safeExchanges;
      const filteredItems = items.filter(item => {
        const searchTerm = activeTab === 'bookmakers' ? bookmakerSearchTerm : exchangeSearchTerm;
        return searchTerm === '' || item.name.toLowerCase().includes(searchTerm.toLowerCase());
      });
      
      return filteredItems.sort((a, b) => {
        let aValue, bValue;
        
        switch (sortBy) {
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

    const handleSubmit = (e) => {
      e.preventDefault();
      
      if (!formData.name || !formData.amount) return;

      // Check if this is a new provider or existing provider
      const existingProvider = formData.type === 'bookmaker' 
        ? safeBookmakers.find(bm => bm.name === formData.name)
        : safeExchanges.find(ex => ex.name === formData.name);

      if (!existingProvider && !editingItem) {
        // Add new provider first
        if (formData.type === 'bookmaker') {
          dataManager.addBookmaker({
            name: formData.name,
            notes: formData.notes
          });
        } else {
          dataManager.addExchange({
            name: formData.name,
            notes: formData.notes
          });
        }
      } else if (editingItem) {
        // Update existing provider
        if (formData.type === 'bookmaker') {
          dataManager.updateBookmaker(editingItem.id, {
            name: formData.name,
            notes: formData.notes
          });
        } else {
          dataManager.updateExchange(editingItem.id, {
            name: formData.name,
            notes: formData.notes
          });
        }
      }

      // Add the transaction
      const transactionData = {
        providerName: formData.name,
        providerType: formData.type,
        transactionType: formData.transactionType,
        amount: parseFloat(formData.amount),
        date: formData.date,
        notes: formData.notes
      };

      dataManager.addTransaction(transactionData);

      resetForm();
      setShowAddForm(false);
      onRefresh();
    };

    const resetForm = () => {
      setFormData({
        type: 'bookmaker',
        name: '',
        amount: '',
        transactionType: 'deposit',
        date: new Date().toISOString().split('T')[0],
        notes: ''
      });
      setEditingItem(null);
    };

    const handleEdit = (item) => {
      setEditingItem(item);
      setFormData({
        type: activeTab === 'bookmakers' ? 'bookmaker' : 'exchange',
        name: item.name,
        amount: '',
        transactionType: 'deposit',
        date: new Date().toISOString().split('T')[0],
        notes: item.notes || ''
      });
      setShowAddForm(true);
    };

    const handleAddTransaction = (item) => {
      setEditingItem(null); // Not editing, just adding transaction
      setFormData({
        type: activeTab === 'bookmakers' ? 'bookmaker' : 'exchange',
        name: item.name,
        amount: '',
        transactionType: 'deposit',
        date: new Date().toISOString().split('T')[0],
        notes: ''
      });
      setShowAddForm(true);
    };

    const handleDelete = (item) => {
      const confirmMessage = `Are you sure you want to delete ${item.name}? This will also remove all associated transactions.`;
      
      if (window.confirm(confirmMessage)) {
        if (activeTab === 'bookmakers') {
          const bookmakers = dataManager.getBookmakers();
          const updatedBookmakers = bookmakers.filter(bm => bm.id !== item.id);
          dataManager.setBookmakers(updatedBookmakers);
        } else {
          const exchanges = dataManager.getExchanges();
          const updatedExchanges = exchanges.filter(ex => ex.id !== item.id);
          dataManager.setExchanges(updatedExchanges);
        }
        onRefresh();
      }
    };

    const getProviderOptions = () => {
      if (formData.type === 'bookmaker') {
        return UK_BOOKMAKERS;
      } else {
        return UK_EXCHANGES;
      }
    };

    return (
      <div className="space-y-6">
        {/* Test Header - Simple version to test if component loads */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-900">Cashflow</h2>
          <div className="text-sm text-gray-600">
            Bookmakers: {safeBookmakers.length} | Exchanges: {safeExchanges.length}
          </div>
        </div>

        {/* Simple Test Content */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Test</h3>
          <div className="space-y-2">
            <p><strong>Bookmakers:</strong> {safeBookmakers.length} items</p>
            <p><strong>Exchanges:</strong> {safeExchanges.length} items</p>
            {safeBookmakers.length > 0 && (
              <div>
                <p><strong>First Bookmaker:</strong> {safeBookmakers[0].name}</p>
              </div>
            )}
            {safeExchanges.length > 0 && (
              <div>
                <p><strong>First Exchange:</strong> {safeExchanges[0].name}</p>
              </div>
            )}
          </div>
        </div>

        {/* Add Transaction Button */}
        <div className="text-center">
          <button
            onClick={() => alert('Add Transaction button works!')}
            className="btn-primary"
          >
            Test Add Transaction
          </button>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Cashflow component error:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      bookmakers: bookmakers,
      exchanges: exchanges
    });
    return (
      <div className="text-center py-10">
        <div className="text-red-600 mb-4">
          <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
          <p>An error occurred while loading the Cashflow page.</p>
        </div>
        <button 
          onClick={() => window.location.reload()} 
          className="btn-primary"
        >
          Refresh Page
        </button>
      </div>
    );
  }
};

export default Cashflow;
