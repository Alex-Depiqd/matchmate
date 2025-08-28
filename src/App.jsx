import { useState, useEffect } from 'react';
import { dataManager } from './utils/storage';
import { calculateTotalDeposits, calculateCurrentFloat, calculateSettledProfit, calculateSeedProgress } from './utils/calculations';
import Dashboard from './components/Dashboard';
import Bets from './components/Bets';
import AddBet from './components/AddBet';
import Cashflow from './components/Cashflow';
import Settings from './components/Settings';
import FreeBetTracker from './components/FreeBetTracker';
import TransactionHistory from './components/TransactionHistory';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);
  const [bookmakers, setBookmakers] = useState([]);
  const [exchanges, setExchanges] = useState([]);
  const [bets, setBets] = useState([]);
  const [seed, setSeed] = useState({ initialSeed: 0, repaidSoFar: 0 });

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    try {
      const rawBookmakers = dataManager.getBookmakers();
      const rawExchanges = dataManager.getExchanges();
      const rawBets = dataManager.getBets();
      const rawSeed = dataManager.getSeed();
      
      // Validate and clean bookmakers data
      const validBookmakers = Array.isArray(rawBookmakers) 
        ? rawBookmakers.filter(bm => bm && typeof bm === 'object' && bm.name && typeof bm.name === 'string' && bm.name.trim() !== '')
        : [];
      
      // Validate and clean exchanges data
      const validExchanges = Array.isArray(rawExchanges)
        ? rawExchanges.filter(ex => ex && typeof ex === 'object' && ex.name && typeof ex.name === 'string' && ex.name.trim() !== '')
        : [];
      
      // Validate and clean bets data
      const validBets = Array.isArray(rawBets) ? rawBets : [];
      
      // Validate seed data
      const validSeed = rawSeed && typeof rawSeed === 'object' ? rawSeed : { initialSeed: 0, repaidSoFar: 0 };
      
      setBookmakers(validBookmakers);
      setExchanges(validExchanges);
      setBets(validBets);
      setSeed(validSeed);
    } catch (error) {
      console.error('Error in loadData:', error);
      // Set safe defaults if there's an error
      setBookmakers([]);
      setExchanges([]);
      setBets([]);
      setSeed({ initialSeed: 0, repaidSoFar: 0 });
    }
  };

  const refreshData = () => {
    loadData();
  };

  const handleNavigateToHistory = () => {
    setShowTransactionHistory(true);
  };

  const handleBackToDashboard = () => {
    setShowTransactionHistory(false);
  };

  // Calculate dashboard metrics
  const totalDeposits = calculateTotalDeposits(bookmakers, exchanges);
  const unsettledBets = bets.filter(bet => bet.status === 'unsettled');
  const currentFloat = calculateCurrentFloat(bookmakers, exchanges, unsettledBets);
  const settledProfit = calculateSettledProfit(bets);
  const seedProgress = calculateSeedProgress(seed, settledProfit);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'cashflow', label: 'Cashflow', icon: '💰' },
    { id: 'add-bet', label: 'Add Bet', icon: '➕' },
    { id: 'bets', label: 'Bets', icon: '🎯' },
    { id: 'free-bets', label: 'Free Bets', icon: '🎁' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ];

  const renderActiveTab = () => {
    try {
      // Show transaction history if requested
      if (showTransactionHistory) {
        return (
          <TransactionHistory
            bets={bets}
            bookmakers={bookmakers}
            exchanges={exchanges}
            onBackToDashboard={handleBackToDashboard}
          />
        );
      }

      switch (activeTab) {
        case 'dashboard':
          return (
            <Dashboard
              bookmakers={bookmakers}
              exchanges={exchanges}
              bets={bets}
              seed={seed}
              totalDeposits={totalDeposits}
              currentFloat={currentFloat}
              settledProfit={settledProfit}
              seedProgress={seedProgress}
              onRefresh={refreshData}
              onNavigateToHistory={handleNavigateToHistory}
            />
          );
        case 'bets':
          return (
            <Bets
              bets={bets}
              bookmakers={bookmakers}
              exchanges={exchanges}
              onRefresh={refreshData}
            />
          );
        case 'free-bets':
          return (
            <FreeBetTracker
              bookmakers={bookmakers}
              onRefresh={refreshData}
            />
          );
        case 'add-bet':
          return (
            <AddBet
              bookmakers={bookmakers}
              exchanges={exchanges}
              onBetAdded={refreshData}
            />
          );
        case 'cashflow':
          return (
            <Cashflow
              bookmakers={bookmakers}
              exchanges={exchanges}
              onRefresh={refreshData}
            />
          );
        case 'settings':
          return (
            <Settings
              seed={seed}
              onSeedUpdated={refreshData}
            />
          );
        default:
          return <Dashboard />;
      }
    } catch (error) {
      console.error('Error rendering tab:', error);
      return (
        <div className="card">
          <p className="text-red-600">Error loading content. Please refresh the page.</p>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center min-w-0 flex-1">
              <h1 className="text-xl font-bold text-gray-900 truncate">Match Mate</h1>
            </div>
            <div className="flex items-center space-x-4 flex-shrink-0">
              <div className="text-sm text-gray-500">
                Profit: <span className={`font-medium ${parseFloat(settledProfit) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  £{settledProfit}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-12">
        {renderActiveTab()}
        
        {/* Copyright Notice */}
        <div className="mt-8 pt-4 border-t border-gray-100">
          <p className="text-center text-xs text-gray-400">
            © 2025 Alex Cameron. All rights reserved.
          </p>
        </div>
      </main>

      {/* Bottom Navigation - Only show when not in transaction history */}
      {!showTransactionHistory && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-around">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-center py-2 px-3 text-xs font-medium transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <span className="text-lg mb-1">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </nav>
      )}

      {/* Bottom padding to account for fixed navigation */}
      {!showTransactionHistory && <div className="h-32 pb-safe"></div>}
    </div>
  );
}

export default App;
