import { formatCurrency } from '../utils/calculations';

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
  const unsettledBets = bets.filter(bet => bet.status === 'unsettled');
  const totalExposure = exchanges.reduce((sum, e) => sum + (e.exposure || 0), 0);
  const openStakes = unsettledBets.reduce((sum, bet) => sum + (bet.backStake || 0), 0);

  const isSeedRepaid = parseFloat(seedProgress.percentage) >= 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <button
          onClick={onRefresh}
          className="btn-secondary text-sm"
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
                  <p className="text-green-800 font-medium">All balances are now house money!</p>
                  <p className="text-green-600 text-sm">Your seed has been fully repaid.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Repaid: {formatCurrency(seedProgress.repaid)}</span>
                <span className="text-gray-600">{seedProgress.percentage}%</span>
                <span className="text-gray-600">Remaining: {formatCurrency(seedProgress.remaining)}</span>
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

      {/* Recent Activity */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
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
    </div>
  );
};

export default Dashboard;
