// Utility functions for betting calculations

// Calculate liability for lay bet
export const calculateLiability = (stake, odds) => {
  return (stake * (odds - 1)).toFixed(2);
};

// Calculate lay stake using the standard formula: (Back Stake × Back Odds) ÷ Lay Odds
export const calculateLayStake = (backStake, backOdds, layOdds) => {
  return ((backStake * backOdds) / layOdds).toFixed(2);
};

// Calculate profit/loss for a bet
export const calculateBetProfit = (bet) => {
  if (bet.status === 'unsettled') return 0;
  
  if (bet.status === 'back_won') {
    const backWinnings = (bet.backStake * bet.backOdds) - bet.backStake;
    const layLoss = bet.liability;
    return (backWinnings - layLoss).toFixed(2);
  } else if (bet.status === 'lay_won') {
    const backLoss = bet.backStake;
    const layWinnings = bet.layStake;
    return (layWinnings - backLoss).toFixed(2);
  }
  
  return 0;
};

// Calculate profit/loss for a bet with commission
export const calculateBetProfitWithCommission = (bet, bookmakers, exchanges) => {
  if (bet.status === 'unsettled') return 0;
  
  // Find the bookmaker and exchange to get their commission rates
  const bookmaker = bookmakers.find(bm => bm.name === bet.bookmaker);
  const exchange = exchanges.find(ex => ex.name === bet.exchange);
  
  const bookmakerCommission = bookmaker ? (bookmaker.commission || 0) / 100 : 0;
  const exchangeCommission = exchange ? (exchange.commission || 0) / 100 : 0;
  
  if (bet.status === 'back_won') {
    const backWinnings = (bet.backStake * bet.backOdds) - bet.backStake;
    const backCommission = backWinnings * bookmakerCommission;
    const layLoss = bet.liability;
    const layCommission = bet.layStake * exchangeCommission;
    return (backWinnings - backCommission - layLoss - layCommission).toFixed(2);
  } else if (bet.status === 'lay_won') {
    const backLoss = bet.backStake;
    const backCommission = 0; // No commission on losses
    const layWinnings = bet.layStake;
    const layCommission = layWinnings * exchangeCommission;
    return (layWinnings - layCommission - backLoss - backCommission).toFixed(2);
  }
  
  return 0;
};

// Calculate total deposits
export const calculateTotalDeposits = (bookmakers, exchanges) => {
  const bookmakerDeposits = bookmakers.reduce((sum, b) => sum + (b.totalDeposits || 0), 0);
  const exchangeDeposits = exchanges.reduce((sum, e) => sum + (e.totalDeposits || 0), 0);
  return bookmakerDeposits + exchangeDeposits;
};

// Calculate total withdrawals (money back to bank account)
export const calculateTotalWithdrawals = (bookmakers, exchanges) => {
  // This would need to be tracked separately in the data structure
  // For now, we'll calculate it as: Total Deposits - Current Balances - Open Stakes - Exposure
  const totalDeposits = calculateTotalDeposits(bookmakers, exchanges);
  const totalBalances = bookmakers.reduce((sum, b) => sum + (b.currentBalance || 0), 0) + 
                       exchanges.reduce((sum, e) => sum + (e.currentBalance || 0), 0);
  const totalExposure = exchanges.reduce((sum, e) => sum + (e.exposure || 0), 0);
  
  // This is a rough estimate - ideally withdrawals would be tracked separately
  return Math.max(0, totalDeposits - totalBalances - totalExposure);
};

// Calculate current float
export const calculateCurrentFloat = (bookmakers, exchanges, unsettledBets) => {
  const bookmakerBalances = bookmakers.reduce((sum, b) => sum + (b.currentBalance || 0), 0);
  const exchangeBalances = exchanges.reduce((sum, e) => sum + (e.currentBalance || 0), 0);
  const openStakes = unsettledBets.reduce((sum, bet) => sum + (bet.backStake || 0), 0);
  const totalExposure = exchanges.reduce((sum, e) => sum + (e.exposure || 0), 0);
  
  return bookmakerBalances + exchangeBalances + openStakes + totalExposure;
};

// Calculate settled profit
export const calculateSettledProfit = (bets) => {
  return bets
    .filter(bet => bet.status !== 'unsettled')
    .reduce((sum, bet) => sum + parseFloat(bet.netProfit || 0), 0)
    .toFixed(2);
};

// Calculate settled profit with commission
export const calculateSettledProfitWithCommission = (bets, bookmakers, exchanges) => {
  return bets
    .filter(bet => bet.status !== 'unsettled')
    .reduce((sum, bet) => sum + parseFloat(calculateBetProfitWithCommission(bet, bookmakers, exchanges)), 0)
    .toFixed(2);
};

// Calculate total commission paid
export const calculateTotalCommission = (bets, bookmakers, exchanges) => {
  return bets
    .filter(bet => bet.status !== 'unsettled')
    .reduce((sum, bet) => {
      const bookmaker = bookmakers.find(bm => bm.name === bet.bookmaker);
      const exchange = exchanges.find(ex => ex.name === bet.exchange);
      
      const bookmakerCommission = bookmaker ? (bookmaker.commission || 0) / 100 : 0;
      const exchangeCommission = exchange ? (exchange.commission || 0) / 100 : 0;
      
      let commission = 0;
      
      if (bet.status === 'back_won') {
        const backWinnings = (bet.backStake * bet.backOdds) - bet.backStake;
        commission += backWinnings * bookmakerCommission;
        commission += bet.layStake * exchangeCommission;
      } else if (bet.status === 'lay_won') {
        const layWinnings = bet.layStake;
        commission += layWinnings * exchangeCommission;
      }
      
      return sum + commission;
    }, 0)
    .toFixed(2);
};

// Calculate seed repayment progress
export const calculateSeedProgress = (seed, settledProfit) => {
  const repaid = Math.min(parseFloat(settledProfit), seed.initialSeed);
  const percentage = seed.initialSeed > 0 ? (repaid / seed.initialSeed) * 100 : 0;
  return {
    repaid: repaid.toFixed(2),
    remaining: Math.max(0, seed.initialSeed - repaid).toFixed(2),
    percentage: Math.min(100, percentage).toFixed(1)
  };
};

// Format currency
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP'
  }).format(amount);
};

// Format percentage
export const formatPercentage = (value) => {
  return `${parseFloat(value).toFixed(1)}%`;
};

// Calculate commission (typically 2% for most exchanges)
export const calculateCommission = (amount, rate = 0.02) => {
  return (amount * rate).toFixed(2);
};

// Calculate lay stake with commission
export const calculateLayStakeWithCommission = (backStake, backOdds, layOdds, commissionRate = 0.02) => {
  const layStakeWithoutCommission = calculateLayStake(backStake, backOdds, layOdds);
  const commission = calculateCommission(layStakeWithoutCommission, commissionRate);
  return (parseFloat(layStakeWithoutCommission) + parseFloat(commission)).toFixed(2);
};
