import { useState } from 'react';
import { formatCurrency } from '../utils/calculations';
import { dataManager } from '../utils/storage';

const TransactionHistory = ({ bets, bookmakers, exchanges, onBackToDashboard }) => {
  const [filter, setFilter] = useState('all'); // 'all', 'today', '7days', 'month', 'quarter'
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');

  // Get all transactions (bets + deposits/withdrawals)
  const getAllTransactions = () => {
    const transactions = [];
    
    // Add bets as transactions
    bets.forEach(bet => {
      transactions.push({
        id: bet.id,
        type: 'bet',
        date: new Date(bet.betDate || bet.createdAt),
        description: bet.event,
        amount: bet.netProfit || 0,
        status: bet.status,
        bookmaker: bet.bookmaker,
        exchange: bet.exchange,
        stake: bet.backStake,
        betType: bet.type
      });
    });

    // Add deposits/withdrawals from bookmakers and exchanges
    bookmakers.forEach(bm => {
      if (bm.deposits) {
        bm.deposits.forEach(deposit => {
          transactions.push({
            id: `deposit_${bm.name}_${deposit.id}`,
            type: 'deposit',
            date: new Date(deposit.date),
            description: `Deposit to ${bm.name}`,
            amount: deposit.amount,
            status: 'completed',
            provider: bm.name
          });
        });
      }
      if (bm.withdrawals) {
        bm.withdrawals.forEach(withdrawal => {
          transactions.push({
            id: `withdrawal_${bm.name}_${withdrawal.id}`,
            type: 'withdrawal',
            date: new Date(withdrawal.date),
            description: `Withdrawal from ${bm.name}`,
            amount: -withdrawal.amount,
            status: 'completed',
            provider: bm.name
          });
        });
      }
    });

    exchanges.forEach(ex => {
      if (ex.deposits) {
        ex.deposits.forEach(deposit => {
          transactions.push({
            id: `deposit_${ex.name}_${deposit.id}`,
            type: 'deposit',
            date: new Date(deposit.date),
            description: `Deposit to ${ex.name}`,
            amount: deposit.amount,
            status: 'completed',
            provider: ex.name
          });
        });
      }
      if (ex.withdrawals) {
        ex.withdrawals.forEach(withdrawal => {
          transactions.push({
            id: `withdrawal_${ex.name}_${withdrawal.id}`,
            type: 'withdrawal',
            date: new Date(withdrawal.date),
            description: `Withdrawal from ${ex.name}`,
            amount: -withdrawal.amount,
            status: 'completed',
            provider: ex.name
          });
        });
      }
    });

    // Add new transaction system transactions
    const newTransactions = dataManager.getTransactions();
    console.log('New transactions loaded:', newTransactions);
    newTransactions.forEach(transaction => {
      let transactionType = 'transaction';
      let description = '';
      
      // Convert new transaction format to display format
      switch (transaction.transactionType) {
        case 'deposit':
          transactionType = 'deposit';
          description = `Deposit to ${transaction.providerName}`;
          break;
        case 'withdrawal':
          transactionType = 'withdrawal';
          description = `Withdrawal from ${transaction.providerName}`;
          break;
        case 'transfer':
          transactionType = 'transfer';
          description = `Transfer from ${transaction.providerName}`;
          break;
        case 'transfer_in':
          transactionType = 'transfer';
          description = `Transfer to ${transaction.providerName}`;
          break;
        case 'balance_update':
          transactionType = 'balance_update';
          description = `Balance update for ${transaction.providerName}`;
          break;
        default:
          transactionType = 'transaction';
          description = `${transaction.transactionType} for ${transaction.providerName}`;
      }

      transactions.push({
        id: transaction.id,
        type: transactionType,
        date: new Date(transaction.date),
        description: description,
        amount: transaction.transactionType === 'withdrawal' ? -transaction.amount : transaction.amount,
        status: 'completed',
        provider: transaction.providerName,
        notes: transaction.notes
      });
    });

    console.log('All transactions combined:', transactions);
    return transactions;
  };

  const allTransactions = getAllTransactions();

  // Filter transactions
  const getFilteredTransactions = () => {
    let filtered = allTransactions;

    // Date filter
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const quarterAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);

    switch (filter) {
      case 'today':
        filtered = filtered.filter(t => t.date >= today);
        break;
      case '7days':
        filtered = filtered.filter(t => t.date >= sevenDaysAgo);
        break;
      case 'month':
        filtered = filtered.filter(t => t.date >= monthAgo);
        break;
      case 'quarter':
        filtered = filtered.filter(t => t.date >= quarterAgo);
        break;
      default:
        break;
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.provider && t.provider.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.bookmaker && t.bookmaker.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.exchange && t.exchange.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortOrder === 'newest') {
        return b.date - a.date;
      } else {
        return a.date - b.date;
      }
    });

    return filtered;
  };

  const filteredTransactions = getFilteredTransactions();

  // Calculate running balance
  const getRunningBalance = () => {
    let balance = 0;
    const runningBalances = [];
    
    filteredTransactions.forEach(transaction => {
      // Ensure the amount is a valid number
      const validAmount = parseFloat(transaction.amount || 0) || 0;
      balance += validAmount;
      
      // Ensure the running balance is also a valid number
      const validBalance = parseFloat(balance) || 0;
      
      runningBalances.push({
        ...transaction,
        amount: validAmount, // Update the amount to be valid
        runningBalance: validBalance
      });
    });
    
    return runningBalances;
  };

  const transactionsWithBalance = getRunningBalance();

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'bet':
        return '🎯';
      case 'deposit':
        return '💰';
      case 'withdrawal':
        return '💸';
      case 'transfer':
        return '🔄';
      case 'balance_update':
        return '⚖️';
      default:
        return '📊';
    }
  };

  const getTransactionColor = (amount) => {
    if (amount > 0) return 'text-green-600';
    if (amount < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getTransactionBackground = (type, status) => {
    if (type === 'bet') {
      if (status === 'back_won') return 'bg-green-50 border-green-200';
      if (status === 'lay_won') return 'bg-red-50 border-red-200';
      return 'bg-gray-50 border-gray-200';
    }
    if (type === 'deposit') return 'bg-green-50 border-green-200';
    if (type === 'withdrawal') return 'bg-red-50 border-red-200';
    if (type === 'transfer') return 'bg-blue-50 border-blue-200';
    if (type === 'balance_update') return 'bg-yellow-50 border-yellow-200';
    return 'bg-white border-gray-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Transaction History</h2>
        <button
          onClick={onBackToDashboard}
          className="btn-secondary"
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Transactions</p>
              <p className="text-2xl font-bold text-gray-900">{allTransactions.length}</p>
            </div>
            <div className="text-3xl">📊</div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Profit/Loss</p>
              <p className={`text-2xl font-bold ${allTransactions.reduce((sum, t) => sum + (parseFloat(t.amount || 0) || 0), 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(allTransactions.reduce((sum, t) => sum + (parseFloat(t.amount || 0) || 0), 0))}
              </p>
            </div>
            <div className="text-3xl">📈</div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Showing</p>
              <p className="text-2xl font-bold text-gray-900">{filteredTransactions.length}</p>
            </div>
            <div className="text-3xl">🔍</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card bg-gray-50 border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Date Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Period:</span>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="7days">Last 7 Days</option>
              <option value="month">Last Month</option>
              <option value="quarter">Last Quarter</option>
            </select>
          </div>

          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Sort */}
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Sort:</span>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      {transactionsWithBalance.length === 0 ? (
        <div className="card">
          <p className="text-gray-500 text-center py-8">
            No transactions found for the selected filters.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactionsWithBalance.map((transaction) => (
            <div 
              key={transaction.id} 
              className={`card ${getTransactionBackground(transaction.type, transaction.status)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="text-2xl mt-1">{getTransactionIcon(transaction.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-lg">{transaction.description}</p>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 mt-1">
                      <span>{transaction.date.toLocaleDateString()}</span>
                      {transaction.type === 'bet' && (
                        <>
                          <span>• {transaction.bookmaker}</span>
                          <span>• {transaction.exchange}</span>
                          <span>• {transaction.betType === 'qualifying' ? 'Qualifying' : 'Free'} Bet</span>
                          <span>• Stake: {formatCurrency(transaction.stake)}</span>
                        </>
                      )}
                      {(transaction.type === 'deposit' || transaction.type === 'withdrawal' || transaction.type === 'transfer' || transaction.type === 'balance_update') && (
                        <span>• {transaction.provider}</span>
                      )}
                      {transaction.notes && (
                        <span>• {transaction.notes}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <p className={`font-semibold text-lg ${getTransactionColor(transaction.amount)}`}>
                    {formatCurrency(transaction.amount)}
                  </p>
                  <p className="text-sm text-gray-500">
                    Balance: {formatCurrency(transaction.runningBalance)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Footer */}
      <div className="card bg-gray-50 border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm">
          <span className="text-gray-600">
            Showing {transactionsWithBalance.length} of {allTransactions.length} transactions
          </span>
          <div className="flex flex-col sm:flex-row gap-4">
            <span className="text-gray-600">
              Total: <span className="font-medium">{formatCurrency(transactionsWithBalance.reduce((sum, t) => sum + (parseFloat(t.amount || 0) || 0), 0))}</span>
            </span>
            <span className="text-gray-600">
              Final Balance: <span className="font-medium">{formatCurrency(transactionsWithBalance.length > 0 ? (parseFloat(transactionsWithBalance[transactionsWithBalance.length - 1].runningBalance || 0) || 0) : 0)}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionHistory;
