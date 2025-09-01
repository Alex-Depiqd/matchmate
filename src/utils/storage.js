// Storage utility for managing app data
const STORAGE_KEYS = {
  BOOKMAKERS: 'matchMate_bookmakers',
  EXCHANGES: 'matchMate_exchanges',
  BETS: 'matchMate_bets',
  SEED: 'matchMate_seed',
  SETTINGS: 'matchMate_settings',
  FREE_BETS: 'matchMate_freeBets',
  TRANSACTIONS: 'matchMate_transactions'
};

// Helper functions for localStorage
const storage = {
  get: (key) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  },

  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Error writing to localStorage:', error);
      return false;
    }
  },

  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error removing from localStorage:', error);
      return false;
    }
  },

  clear: () => {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  }
};

// Data management functions
export const dataManager = {
  // Data repair function
  repairData: () => {
    try {
      console.log('Repairing data...');
      
      // Repair bookmakers
      const bookmakers = storage.get(STORAGE_KEYS.BOOKMAKERS);
      if (Array.isArray(bookmakers)) {
        const repairedBookmakers = bookmakers.filter(bm => 
          bm && typeof bm === 'object' && bm.name && typeof bm.name === 'string' && bm.name.trim() !== ''
        );
        if (repairedBookmakers.length !== bookmakers.length) {
          console.log('Repaired bookmakers data:', { original: bookmakers.length, repaired: repairedBookmakers.length });
          storage.set(STORAGE_KEYS.BOOKMAKERS, repairedBookmakers);
        }
      }
      
      // Repair exchanges
      const exchanges = storage.get(STORAGE_KEYS.EXCHANGES);
      if (Array.isArray(exchanges)) {
        const repairedExchanges = exchanges.filter(ex => 
          ex && typeof ex === 'object' && ex.name && typeof ex.name === 'string' && ex.name.trim() !== ''
        );
        if (repairedExchanges.length !== exchanges.length) {
          console.log('Repaired exchanges data:', { original: exchanges.length, repaired: repairedExchanges.length });
          storage.set(STORAGE_KEYS.EXCHANGES, repairedExchanges);
        }
      }
      
      console.log('Data repair completed');
    } catch (error) {
      console.error('Error repairing data:', error);
    }
  },

  // Bookmakers
  getBookmakers: () => {
    const bookmakers = storage.get(STORAGE_KEYS.BOOKMAKERS);
    if (bookmakers === null || bookmakers.length === 0) {
      // Initialize with default bookmakers if none exist or if empty array
      const defaultBookmakers = [
        { id: 'bm_default_1', name: 'Bet365', totalDeposits: 0, currentBalance: 0, commission: 0, notes: '', website: 'https://www.bet365.com', category: 'Major', createdAt: new Date().toISOString() },
        { id: 'bm_default_2', name: 'William Hill', totalDeposits: 0, currentBalance: 0, commission: 0, notes: '', website: 'https://sports.williamhill.com', category: 'Major', createdAt: new Date().toISOString() },
        { id: 'bm_default_3', name: 'Ladbrokes', totalDeposits: 0, currentBalance: 0, commission: 0, notes: '', website: 'https://sports.ladbrokes.com', category: 'Major', createdAt: new Date().toISOString() },
        { id: 'bm_default_4', name: 'Coral', totalDeposits: 0, currentBalance: 0, commission: 0, notes: '', website: 'https://sports.coral.co.uk', category: 'Major', createdAt: new Date().toISOString() },
        { id: 'bm_default_5', name: 'Paddy Power', totalDeposits: 0, currentBalance: 0, commission: 0, notes: '', website: 'https://sports.paddypower.com', category: 'Major', createdAt: new Date().toISOString() },
        { id: 'bm_default_6', name: 'Sky Bet', totalDeposits: 0, currentBalance: 0, commission: 0, notes: '', website: 'https://m.skybet.com', category: 'Major', createdAt: new Date().toISOString() },
        { id: 'bm_default_7', name: 'Betfair Sportsbook', totalDeposits: 0, currentBalance: 0, commission: 0, notes: '', website: 'https://sports.betfair.com', category: 'Major', createdAt: new Date().toISOString() },
        { id: 'bm_default_8', name: 'Unibet', totalDeposits: 0, currentBalance: 0, commission: 0, notes: '', website: 'https://www.unibet.co.uk', category: 'Major', createdAt: new Date().toISOString() }
      ];
      storage.set(STORAGE_KEYS.BOOKMAKERS, defaultBookmakers);
      return defaultBookmakers;
    }
    return bookmakers;
  },
  setBookmakers: (bookmakers) => storage.set(STORAGE_KEYS.BOOKMAKERS, bookmakers),
  addBookmaker: (bookmaker) => {
    const bookmakers = dataManager.getBookmakers();
    const newBookmaker = {
      id: bookmaker.id || `bm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: bookmaker.name,
      totalDeposits: bookmaker.totalDeposits || 0,
      currentBalance: bookmaker.currentBalance || 0,
      commission: bookmaker.commission || 0,
      notes: bookmaker.notes || '',
      website: bookmaker.website || '',
      category: bookmaker.category || 'Major',
      createdAt: new Date().toISOString()
    };
    bookmakers.push(newBookmaker);
    dataManager.setBookmakers(bookmakers);
    return newBookmaker;
  },
  updateBookmaker: (id, updates) => {
    const bookmakers = dataManager.getBookmakers();
    const index = bookmakers.findIndex(b => b.id === id);
    if (index !== -1) {
      bookmakers[index] = { ...bookmakers[index], ...updates };
      dataManager.setBookmakers(bookmakers);
      return bookmakers[index];
    }
    return null;
  },

  // Exchanges
  getExchanges: () => {
    const exchanges = storage.get(STORAGE_KEYS.EXCHANGES);
    if (exchanges === null || exchanges.length === 0) {
      // Initialize with default exchanges if none exist or if empty array
      const defaultExchanges = [
        { id: 'ex_default_1', name: 'Betfair Exchange', totalDeposits: 0, currentBalance: 0, exposure: 0, commission: 5.0, notes: '', website: 'https://www.betfair.com/exchange', category: 'Exchange', createdAt: new Date().toISOString() },
        { id: 'ex_default_2', name: 'Smarkets', totalDeposits: 0, currentBalance: 0, exposure: 0, commission: 0.0, notes: '', website: 'https://smarkets.com', category: 'Exchange', createdAt: new Date().toISOString() },
        { id: 'ex_default_3', name: 'Betdaq', totalDeposits: 0, currentBalance: 0, exposure: 0, commission: 0.0, notes: '', website: 'https://www.betdaq.com', category: 'Exchange', createdAt: new Date().toISOString() },
        { id: 'ex_default_4', name: 'Matchbook', totalDeposits: 0, currentBalance: 0, exposure: 0, commission: 0.0, notes: '', website: 'https://www.matchbook.com', category: 'Exchange', createdAt: new Date().toISOString() }
      ];
      storage.set(STORAGE_KEYS.EXCHANGES, defaultExchanges);
      return defaultExchanges;
    }
    return exchanges;
  },
  setExchanges: (exchanges) => storage.set(STORAGE_KEYS.EXCHANGES, exchanges),
  addExchange: (exchange) => {
    const exchanges = dataManager.getExchanges();
    const newExchange = {
      id: exchange.id || `ex_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: exchange.name,
      totalDeposits: exchange.totalDeposits || 0,
      currentBalance: exchange.currentBalance || 0,
      exposure: exchange.exposure || 0,
      commission: exchange.commission || 0,
      notes: exchange.notes || '',
      website: exchange.website || '',
      category: exchange.category || 'Exchange',
      createdAt: new Date().toISOString()
    };
    exchanges.push(newExchange);
    dataManager.setExchanges(exchanges);
    return newExchange;
  },
  updateExchange: (id, updates) => {
    const exchanges = dataManager.getExchanges();
    const index = exchanges.findIndex(e => e.id === id);
    if (index !== -1) {
      exchanges[index] = { ...exchanges[index], ...updates };
      dataManager.setExchanges(exchanges);
      return exchanges[index];
    }
    return null;
  },

  // Bets
  getBets: () => storage.get(STORAGE_KEYS.BETS) || [],
  setBets: (bets) => storage.set(STORAGE_KEYS.BETS, bets),
  addBet: (bet) => {
    const bets = dataManager.getBets();
    const newBet = {
      id: bet.id || `bet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      bookmaker: bet.bookmaker,
      exchange: bet.exchange,
      event: bet.event,
      type: bet.type, // 'qualifying' or 'free'
      backStake: bet.backStake,
      backOdds: bet.backOdds,
      layStake: bet.layStake,
      layOdds: bet.layOdds,
      liability: bet.liability,
      status: bet.status || 'unsettled', // 'unsettled', 'back_won', 'lay_won'
      result: bet.result || null,
      netProfit: bet.netProfit || 0,
      commission: bet.commission || 0,
      notes: bet.notes || '',
      betDate: bet.betDate || new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      settledAt: null
    };
    bets.push(newBet);
    dataManager.setBets(bets);
    return newBet;
  },

  // New function to add bet and update balances
  addBetAndUpdateBalances: (bet) => {
    // First add the bet
    const newBet = dataManager.addBet(bet);
    
    // Update bookmaker balance (reduce by back stake) - but NOT for free bets
    if (bet.type !== 'free') {
      const bookmakers = dataManager.getBookmakers();
      const bookmaker = bookmakers.find(bm => bm.name === bet.bookmaker);
      if (bookmaker) {
        const newBalance = bookmaker.currentBalance - bet.backStake;
        dataManager.updateBookmaker(bookmaker.id, {
          currentBalance: Math.max(0, newBalance) // Ensure balance doesn't go negative
        });
      }
    }
    
    // Update exchange balance and exposure (reduce balance by liability, add to exposure)
    const exchanges = dataManager.getExchanges();
    const exchange = exchanges.find(ex => ex.name === bet.exchange);
    if (exchange) {
      const newBalance = exchange.currentBalance - bet.liability;
      const newExposure = exchange.exposure + bet.liability;
      dataManager.updateExchange(exchange.id, {
        currentBalance: Math.max(0, newBalance),
        exposure: newExposure
      });
    }
    
    return newBet;
  },
  updateBet: (id, updates) => {
    const bets = dataManager.getBets();
    const index = bets.findIndex(b => b.id === id);
    if (index !== -1) {
      bets[index] = { ...bets[index], ...updates };
      dataManager.setBets(bets);
      return bets[index];
    }
    return null;
  },
  deleteBet: (id) => {
    const bets = dataManager.getBets();
    const filteredBets = bets.filter(b => b.id !== id);
    dataManager.setBets(filteredBets);
    return true;
  },

  // New function to settle bet and update balances
  settleBetAndUpdateBalances: (betId, result) => {
    const bets = dataManager.getBets();
    const bet = bets.find(b => b.id === betId);
    if (!bet) return null;
    
    // Calculate profit based on result
    let netProfit = 0;
    let bookmakerBalanceChange = 0;
    let exchangeBalanceChange = 0;
    
    if (result === 'back_won') {
      if (bet.type === 'qualifying') {
        // Qualifying bet: back stake returned + winnings, lay liability released
        const backWinnings = (bet.backStake * bet.backOdds) - bet.backStake;
        const layLoss = bet.liability;
        netProfit = backWinnings - layLoss;
        bookmakerBalanceChange = bet.backStake + backWinnings; // Stake returned + winnings
        exchangeBalanceChange = bet.liability - layLoss; // Liability released, lay loss applied
      } else {
        // Free bet: only winnings count as profit (stake is "free")
        const backWinnings = (bet.backStake * bet.backOdds) - bet.backStake;
        netProfit = backWinnings - bet.liability;
        bookmakerBalanceChange = backWinnings; // Only winnings (no stake returned)
        exchangeBalanceChange = bet.liability - bet.liability; // Liability released, lay loss applied
      }
    } else if (result === 'lay_won') {
      if (bet.type === 'qualifying') {
        // Qualifying bet: back stake lost, lay stake + winnings
        const layWinnings = bet.layStake;
        netProfit = layWinnings - bet.backStake;
        bookmakerBalanceChange = 0; // Back stake already deducted on placement
        exchangeBalanceChange = bet.liability + layWinnings; // Liability released + lay winnings
      } else {
        // Free bet: only lay winnings count as profit (back stake was free)
        const layWinnings = bet.layStake;
        netProfit = layWinnings; // No back stake loss since it's free
        bookmakerBalanceChange = 0; // No loss on free bet
        exchangeBalanceChange = bet.liability + layWinnings; // Liability released + lay winnings
      }
    }
    
    // Update the bet
    const updatedBet = dataManager.updateBet(betId, {
      status: result,
      result: result,
      netProfit: netProfit.toFixed(2),
      settledAt: new Date().toISOString()
    });
    
    // Update bookmaker balance
    const bookmakers = dataManager.getBookmakers();
    const bookmaker = bookmakers.find(bm => bm.name === bet.bookmaker);
    if (bookmaker) {
      const newBalance = bookmaker.currentBalance + bookmakerBalanceChange;
      dataManager.updateBookmaker(bookmaker.id, {
        currentBalance: Math.max(0, newBalance)
      });
    }
    
    // Update exchange balance and remove exposure
    const exchanges = dataManager.getExchanges();
    const exchange = exchanges.find(ex => ex.name === bet.exchange);
    if (exchange) {
      const newBalance = exchange.currentBalance + exchangeBalanceChange;
      const newExposure = exchange.exposure - bet.liability;
      dataManager.updateExchange(exchange.id, {
        currentBalance: Math.max(0, newBalance),
        exposure: Math.max(0, newExposure)
      });
    }
    
    return updatedBet;
  },

  // Seed
  getSeed: () => storage.get(STORAGE_KEYS.SEED) || { initialSeed: 0, repaidSoFar: 0 },
  setSeed: (seed) => storage.set(STORAGE_KEYS.SEED, seed),
  updateSeed: (updates) => {
    const seed = dataManager.getSeed();
    const updatedSeed = { ...seed, ...updates };
    dataManager.setSeed(updatedSeed);
    return updatedSeed;
  },

  // Settings
  getSettings: () => storage.get(STORAGE_KEYS.SETTINGS) || {},
  setSettings: (settings) => storage.set(STORAGE_KEYS.SETTINGS, settings),

  // Free Bets
  getFreeBets: () => storage.get(STORAGE_KEYS.FREE_BETS) || [],
  setFreeBets: (freeBets) => storage.set(STORAGE_KEYS.FREE_BETS, freeBets),
  addFreeBet: (freeBet) => {
    const freeBets = dataManager.getFreeBets();
    freeBets.push(freeBet);
    dataManager.setFreeBets(freeBets);
    return freeBet;
  },
  updateFreeBet: (id, updates) => {
    const freeBets = dataManager.getFreeBets();
    const index = freeBets.findIndex(fb => fb.id === id);
    if (index !== -1) {
      freeBets[index] = { ...freeBets[index], ...updates };
      dataManager.setFreeBets(freeBets);
      return freeBets[index];
    }
    return null;
  },
  deleteFreeBet: (id) => {
    const freeBets = dataManager.getFreeBets();
    const filteredFreeBets = freeBets.filter(fb => fb.id !== id);
    dataManager.setFreeBets(filteredFreeBets);
    return filteredFreeBets;
  },

  // Transactions
  getTransactions: () => storage.get(STORAGE_KEYS.TRANSACTIONS) || [],
  setTransactions: (transactions) => storage.set(STORAGE_KEYS.TRANSACTIONS, transactions),
  addTransaction: (transaction) => {
    const transactions = dataManager.getTransactions();
    const newTransaction = {
      id: transaction.id || `transaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      providerName: transaction.providerName,
      providerType: transaction.providerType, // 'bookmaker' or 'exchange'
      transactionType: transaction.transactionType, // 'deposit', 'withdrawal', 'transfer', 'transfer_in', 'balance_update'
      amount: parseFloat(transaction.amount),
      date: transaction.date,
      notes: transaction.notes || '',
      createdAt: new Date().toISOString()
    };
    transactions.push(newTransaction);
    dataManager.setTransactions(transactions);
    
    // Update provider balances based on transaction type
    if (transaction.providerType === 'bookmaker') {
      const bookmakers = dataManager.getBookmakers();
      const bookmaker = bookmakers.find(bm => bm.name === transaction.providerName);
      if (bookmaker) {
        let newTotalDeposits = bookmaker.totalDeposits || 0;
        let newCurrentBalance = bookmaker.currentBalance || 0;
        
        if (transaction.transactionType === 'deposit') {
          newTotalDeposits += transaction.amount;
          newCurrentBalance += transaction.amount;
        } else if (transaction.transactionType === 'withdrawal') {
          newCurrentBalance -= transaction.amount;
        } else if (transaction.transactionType === 'transfer') {
          // For transfers, only reduce the balance, don't affect total deposits
          newCurrentBalance -= transaction.amount;
        } else if (transaction.transactionType === 'transfer_in') {
          // For incoming transfers, only increase the balance, don't affect total deposits
          newCurrentBalance += transaction.amount;
        } else if (transaction.transactionType === 'balance_update') {
          newCurrentBalance = transaction.amount;
        }
        
        dataManager.updateBookmaker(bookmaker.id, {
          totalDeposits: newTotalDeposits,
          currentBalance: Math.max(0, newCurrentBalance)
        });
      }
    } else if (transaction.providerType === 'exchange') {
      const exchanges = dataManager.getExchanges();
      console.log('Transaction debug:', {
        providerName: transaction.providerName,
        availableExchanges: exchanges.map(ex => ex.name),
        foundExchange: exchanges.find(ex => ex.name === transaction.providerName)
      });
      
      const exchange = exchanges.find(ex => ex.name === transaction.providerName);
      if (exchange) {
        let newTotalDeposits = exchange.totalDeposits || 0;
        let newCurrentBalance = exchange.currentBalance || 0;
        
        console.log('Exchange balance update:', {
          exchangeName: exchange.name,
          oldTotalDeposits: newTotalDeposits,
          oldCurrentBalance: newCurrentBalance,
          transactionAmount: transaction.amount,
          transactionType: transaction.transactionType
        });
        
        if (transaction.transactionType === 'deposit') {
          newTotalDeposits += transaction.amount;
          newCurrentBalance += transaction.amount;
        } else if (transaction.transactionType === 'withdrawal') {
          newCurrentBalance -= transaction.amount;
        } else if (transaction.transactionType === 'transfer') {
          // For transfers, only reduce the balance, don't affect total deposits
          newCurrentBalance -= transaction.amount;
        } else if (transaction.transactionType === 'transfer_in') {
          // For incoming transfers, only increase the balance, don't affect total deposits
          newCurrentBalance += transaction.amount;
        } else if (transaction.transactionType === 'balance_update') {
          newCurrentBalance = transaction.amount;
        }
        
        console.log('New values:', {
          newTotalDeposits,
          newCurrentBalance
        });
        
        dataManager.updateExchange(exchange.id, {
          totalDeposits: newTotalDeposits,
          currentBalance: Math.max(0, newCurrentBalance)
        });
      } else {
        console.error('Exchange not found for transaction:', transaction.providerName);
      }
    }
    
    return newTransaction;
  },
  updateTransaction: (id, updates) => {
    const transactions = dataManager.getTransactions();
    const index = transactions.findIndex(t => t.id === id);
    if (index !== -1) {
      transactions[index] = { ...transactions[index], ...updates };
      dataManager.setTransactions(transactions);
      return transactions[index];
    }
    return null;
  },
  deleteTransaction: (id) => {
    const transactions = dataManager.getTransactions();
    const filteredTransactions = transactions.filter(t => t.id !== id);
    dataManager.setTransactions(filteredTransactions);
    return true;
  }
};

export default storage;
