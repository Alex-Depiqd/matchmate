import { useState } from 'react';
import { formatCurrency } from '../utils/calculations';
import { dataManager } from '../utils/storage';

// Transaction History Modal Component
const TransactionHistoryModal = ({ isOpen, onClose, bets, bookmakers, exchanges }) => {
  const [filter, setFilter] = useState('all'); // 'all', 'today', '7days', 'month', 'quarter'
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');

  if (!isOpen) return null;

  // Get all transactions (bets + deposits/withdrawals)
  const getAllTransactions = () => {
    const transactions = [];
    
    // Add bets as transactions
    bets.forEach(bet => {
      transactions.push({
        id: bet.id,
        type: 'bet',
        date: new Date(bet.createdAt),
        description: bet.event,
        amount: bet.netProfit || 0,
        status: bet.status,
        bookmaker: bet.bookmaker,
        exchange: bet.exchange,
        stake: bet.backStake
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
      balance += transaction.amount;
      runningBalances.push({
        ...transaction,
        runningBalance: balance
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
      default:
        return '📊';
    }
  };

  const getTransactionColor = (amount) => {
    if (amount > 0) return 'text-green-600';
    if (amount < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-900">Transaction History</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
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
        <div className="flex-1 overflow-y-auto">
          {transactionsWithBalance.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No transactions found for the selected filters.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {transactionsWithBalance.map((transaction) => (
                <div key={transaction.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{getTransactionIcon(transaction.type)}</div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{transaction.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                          <span>{transaction.date.toLocaleDateString()}</span>
                          {transaction.type === 'bet' && (
                            <>
                              <span>• {transaction.bookmaker}</span>
                              <span>• {transaction.exchange}</span>
                              <span>• Stake: {formatCurrency(transaction.stake)}</span>
                            </>
                          )}
                          {(transaction.type === 'deposit' || transaction.type === 'withdrawal') && (
                            <span>• {transaction.provider}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${getTransactionColor(transaction.amount)}`}>
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
        </div>

        {/* Summary */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">
              Showing {transactionsWithBalance.length} of {allTransactions.length} transactions
            </span>
            <div className="flex space-x-4">
              <span className="text-gray-600">
                Total: <span className="font-medium">{formatCurrency(transactionsWithBalance.reduce((sum, t) => sum + t.amount, 0))}</span>
              </span>
              <span className="text-gray-600">
                Final Balance: <span className="font-medium">{formatCurrency(transactionsWithBalance.length > 0 ? transactionsWithBalance[transactionsWithBalance.length - 1].runningBalance : 0)}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Dashboard = ({
  bookmakers,
  exchanges,
  bets,
  seed,
  totalDeposits,
  currentFloat,
  settledProfit,
  seedProgress,
  onRefresh
}) => {
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);
  
  const freeBets = dataManager.getFreeBets();
  const pendingFreeBets = freeBets.filter(fb => fb.status === 'pending');
  const totalFreeBetValue = pendingFreeBets.reduce((sum, fb) => sum + fb.value, 0);
  const unsettledBets = bets.filter(bet => bet.status === 'unsettled');
  const totalExposure = exchanges.reduce((sum, e) => sum + (e.exposure || 0), 0);
  const openStakes = unsettledBets.reduce((sum, bet) => sum + (bet.backStake || 0), 0);

  const isSeedRepaid = parseFloat(seedProgress.percentage) >= 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <button
          onClick={onRefresh}
          className="btn-secondary text-sm self-start sm:self-auto"
        >
          Refresh
        </button>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Seed Deposited */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Seed Deposited</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(seed.initialSeed)}
              </p>
            </div>
            <div className="text-3xl">🌱</div>
          </div>
        </div>

        {/* Total Deposits */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Deposits</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(totalDeposits)}
              </p>
            </div>
            <div className="text-3xl">💰</div>
          </div>
        </div>

        {/* Current Float */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Current Float</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(currentFloat)}
              </p>
            </div>
            <div className="text-3xl">🏊</div>
          </div>
        </div>

        {/* Settled Profit */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Settled Profit</p>
              <p className={`text-2xl font-bold ${parseFloat(settledProfit) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(settledProfit)}
              </p>
              <p className="text-xs text-gray-500 mt-1">From completed bets</p>
            </div>
            <div className="text-3xl">📈</div>
          </div>
        </div>
      </div>

      {/* Seed Repayment Progress */}
      <div className="card">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Seed Repayment Progress</h3>
          {isSeedRepaid ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="text-green-600 text-2xl mr-3">🎉</div>
                <div>
                  <p className="text-green-800 font-medium">Seed Fully Repaid!</p>
                  <p className="text-green-700 text-sm">Congratulations! You've successfully repaid your initial seed investment.</p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">
                  {formatCurrency(seedProgress.repaid)} / {formatCurrency(seed.initialSeed)}
                </span>
                <span className="text-sm font-medium text-gray-700">
                  {seedProgress.percentage}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${seedProgress.percentage}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Float Breakdown */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Float Breakdown</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Bookmaker Balances</span>
            <span className="font-medium">
              {formatCurrency(bookmakers.reduce((sum, b) => sum + (b.currentBalance || 0), 0))}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Exchange Balances</span>
            <span className="font-medium">
              {formatCurrency(exchanges.reduce((sum, e) => sum + (e.currentBalance || 0), 0))}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Open Stakes</span>
            <span className="font-medium">{formatCurrency(openStakes)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Total Exposure</span>
            <span className="font-medium">{formatCurrency(totalExposure)}</span>
          </div>
          <hr className="border-gray-200" />
          <div className="flex justify-between font-semibold">
            <span>Total Float</span>
            <span>{formatCurrency(currentFloat)}</span>
          </div>
        </div>
      </div>

      {/* Free Bet Summary */}
      {pendingFreeBets.length > 0 && (
        <div className="card bg-yellow-50 border-yellow-200">
          <h3 className="text-lg font-semibold text-yellow-900 mb-4">🎁 Pending Free Bets</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-yellow-700">Total Pending</span>
              <span className="font-medium text-yellow-800">{pendingFreeBets.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-yellow-700">Total Value</span>
              <span className="font-medium text-yellow-800">{formatCurrency(totalFreeBetValue)}</span>
            </div>
            <div className="pt-2">
              <a href="#free-bets" className="text-sm text-yellow-600 hover:text-yellow-800 underline">
                View all free bets →
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          <button
            onClick={() => setShowTransactionHistory(true)}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            View Full History
          </button>
        </div>
        {bets.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No bets logged yet. Add your first bet to get started!</p>
        ) : (
          <div className="space-y-3">
            {bets.slice(0, 5).map((bet) => (
              <div key={bet.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{bet.event}</p>
                  <p className="text-sm text-gray-500">
                    {bet.bookmaker} • {bet.type === 'qualifying' ? 'Qualifying' : 'Free Bet'}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-medium ${
                    bet.status === 'unsettled' ? 'text-gray-600' :
                    parseFloat(bet.netProfit) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {bet.status === 'unsettled' ? 'Pending' : formatCurrency(bet.netProfit)}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {bet.status.replace('_', ' ')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transaction History Modal */}
      <TransactionHistoryModal
        isOpen={showTransactionHistory}
        onClose={() => setShowTransactionHistory(false)}
        bets={bets}
        bookmakers={bookmakers}
        exchanges={exchanges}
      />
    </div>
  );
};

export default Dashboard;
