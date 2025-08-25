import { useState, useEffect } from 'react';
import { dataManager } from './utils/storage';
import { calculateTotalDeposits, calculateCurrentFloat, calculateSettledProfit, calculateSeedProgress } from './utils/calculations';
import Dashboard from './components/Dashboard';
import Bets from './components/Bets';
import AddBet from './components/AddBet';
import Cashflow from './components/Cashflow';
import Settings from './components/Settings';
import FreeBetTracker from './components/FreeBetTracker';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
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
      setBookmakers(dataManager.getBookmakers());
      setExchanges(dataManager.getExchanges());
      setBets(dataManager.getBets());
      setSeed(dataManager.getSeed());
    } catch (error) {
      console.error('Error in loadData:', error);
    }
  };

  const refreshData = () => {
    loadData();
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
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Match Mate</h1>
            </div>
            <div className="flex items-center space-x-4">
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
      </main>

      {/* Bottom Navigation */}
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

      {/* Bottom padding to account for fixed navigation */}
      <div className="h-32 pb-safe"></div>
    </div>
  );
}

export default App;
