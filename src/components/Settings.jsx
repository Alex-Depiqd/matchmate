import { useState } from 'react';
import { dataManager } from '../utils/storage';
import { formatCurrency, calculateTotalDeposits } from '../utils/calculations';

const Settings = ({ seed, onSeedUpdated }) => {
  const [showSeedForm, setShowSeedForm] = useState(false);
  const [seedAmount, setSeedAmount] = useState(seed.initialSeed.toString());
  
  // Get current total deposits for the "Set from Deposits" feature
  const currentTotalDeposits = calculateTotalDeposits(
    dataManager.getBookmakers(),
    dataManager.getExchanges()
  );

  const handleSeedUpdate = (e) => {
    e.preventDefault();
    
    const newSeedAmount = parseFloat(seedAmount);
    if (isNaN(newSeedAmount) || newSeedAmount < 0) {
      alert('Please enter a valid seed amount');
      return;
    }

    dataManager.updateSeed({
      initialSeed: newSeedAmount,
      repaidSoFar: seed.repaidSoFar
    });

    setShowSeedForm(false);
    onSeedUpdated();
  };

  const handleSetSeedFromDeposits = () => {
    if (confirm(`Set your seed amount to your current total deposits of ${formatCurrency(currentTotalDeposits)}? This will be your baseline for tracking profit.`)) {
      dataManager.updateSeed({
        initialSeed: currentTotalDeposits,
        repaidSoFar: seed.repaidSoFar
      });
      onSeedUpdated();
      alert(`Seed set to ${formatCurrency(currentTotalDeposits)}. You can now track profit against this amount.`);
    }
  };

  const handleResetData = () => {
    if (confirm('Are you sure you want to reset all data? This action cannot be undone.')) {
      try {
        // Clear localStorage completely
        localStorage.clear();
        
        // Trigger a refresh to reload default data
        onSeedUpdated();
        
        alert('Data reset successfully! Default bookmakers and exchanges have been restored.');
      } catch (error) {
        console.error('Error resetting data:', error);
        alert('Error resetting data. Please try again.');
      }
    }
  };

  const handleExportData = () => {
    const data = {
      bookmakers: dataManager.getBookmakers(),
      exchanges: dataManager.getExchanges(),
      bets: dataManager.getBets(),
      seed: dataManager.getSeed(),
      settings: dataManager.getSettings(),
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `match-mate-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        
        if (data.bookmakers) dataManager.setBookmakers(data.bookmakers);
        if (data.exchanges) dataManager.setExchanges(data.exchanges);
        if (data.bets) dataManager.setBets(data.bets);
        if (data.seed) dataManager.setSeed(data.seed);
        if (data.settings) dataManager.setSettings(data.settings);
        
        onSeedUpdated();
        alert('Data imported successfully!');
      } catch (error) {
        console.error('Error importing data:', error);
        alert('Error importing data. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
      </div>

      {/* Seed Management */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Seed Management</h3>
          <button
            onClick={() => setShowSeedForm(true)}
            className="btn-primary text-sm"
          >
            Update Seed
          </button>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Initial Seed:</span>
            <span className="font-medium">{formatCurrency(seed.initialSeed)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Repaid So Far:</span>
            <span className="font-medium">{formatCurrency(seed.repaidSoFar)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Remaining:</span>
            <span className="font-medium">{formatCurrency(Math.max(0, seed.initialSeed - seed.repaidSoFar))}</span>
          </div>
          
          {/* Set Seed from Current Deposits */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-blue-900">Current Total Deposits:</span>
              <span className="font-medium text-blue-900">{formatCurrency(currentTotalDeposits)}</span>
            </div>
            <p className="text-xs text-blue-700 mb-3">
              Set your seed to your current total deposits to track profit from this point forward.
            </p>
            <button
              onClick={handleSetSeedFromDeposits}
              className="btn-primary text-sm w-full"
            >
              Set Seed from Current Deposits
            </button>
          </div>
        </div>
      </div>

      {/* Quick Start for Existing Matched Bettors */}
      <div className="card bg-green-50 border-green-200">
        <h3 className="text-lg font-semibold text-green-900 mb-4">🚀 Quick Start for Existing Matched Bettors</h3>
        
        <div className="space-y-3 text-sm text-green-800">
          <p><strong>Step 1:</strong> Add your existing bookmakers and exchanges in the Cashflow tab</p>
          <p><strong>Step 2:</strong> Record your current deposits and balances</p>
          <p><strong>Step 3:</strong> Use the "Set Seed from Current Deposits" button above to set your baseline</p>
          <p><strong>Step 4:</strong> Start tracking your profits from this point forward!</p>
        </div>
      </div>

      {/* Data Management */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Management</h3>
        
        <div className="space-y-4">
          <div>
            <label className="label">Export Data</label>
            <p className="text-sm text-gray-500 mb-2">
              Download a backup of all your data as a JSON file.
            </p>
            <button
              onClick={handleExportData}
              className="btn-secondary"
            >
              Export Backup
            </button>
          </div>

          <div>
            <label className="label">Import Data</label>
            <p className="text-sm text-gray-500 mb-2">
              Restore data from a previously exported backup file.
            </p>
            <input
              type="file"
              accept=".json"
              onChange={handleImportData}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          <div>
            <label className="label">Reset All Data</label>
            <p className="text-sm text-gray-500 mb-2">
              Permanently delete all data and start fresh. This action cannot be undone.
            </p>
            <button
              onClick={handleResetData}
              className="btn-danger"
            >
              Reset All Data
            </button>
          </div>
        </div>
      </div>

      {/* App Information */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">App Information</h3>
        
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Version:</span>
            <span className="font-medium">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Storage:</span>
            <span className="font-medium">Local Storage</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Offline Support:</span>
            <span className="font-medium">Yes</span>
          </div>
        </div>
      </div>

      {/* Seed Update Modal */}
      {showSeedForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Seed Amount</h3>
            
            <form onSubmit={handleSeedUpdate} className="space-y-4">
              <div>
                <label className="label">Initial Seed Amount (£)</label>
                <input
                  type="number"
                  value={seedAmount}
                  onChange={(e) => setSeedAmount(e.target.value)}
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="input"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  This is the amount you initially deposited to start matched betting.
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowSeedForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Update Seed
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
