// Storage utility for managing app data
const STORAGE_KEYS = {
  BOOKMAKERS: 'matchMate_bookmakers',
  EXCHANGES: 'matchMate_exchanges',
  BETS: 'matchMate_bets',
  SEED: 'matchMate_seed',
  SETTINGS: 'matchMate_settings'
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
    
    // Update exchange exposure (add liability)
    const exchanges = dataManager.getExchanges();
    const exchange = exchanges.find(ex => ex.name === bet.exchange);
    if (exchange) {
      const newExposure = exchange.exposure + bet.liability;
      dataManager.updateExchange(exchange.id, {
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
        // Qualifying bet: small loss due to odds difference
        const backWinnings = (bet.backStake * bet.backOdds) - bet.backStake;
        const layLoss = bet.liability;
        netProfit = backWinnings - layLoss;
        bookmakerBalanceChange = backWinnings;
        exchangeBalanceChange = -bet.liability;
      } else {
        // Free bet: only winnings count as profit (stake is "free")
        const backWinnings = (bet.backStake * bet.backOdds) - bet.backStake;
        netProfit = backWinnings - bet.liability;
        bookmakerBalanceChange = backWinnings;
        exchangeBalanceChange = -bet.liability;
      }
    } else if (result === 'lay_won') {
      if (bet.type === 'qualifying') {
        // Qualifying bet: small loss due to odds difference
        const backLoss = bet.backStake;
        const layWinnings = bet.layStake;
        netProfit = layWinnings - backLoss;
        bookmakerBalanceChange = -bet.backStake;
        exchangeBalanceChange = bet.layStake;
      } else {
        // Free bet: only winnings count as profit (stake is "free")
        const layWinnings = bet.layStake;
        netProfit = layWinnings; // No back stake loss since it's free
        bookmakerBalanceChange = 0; // No loss on free bet
        exchangeBalanceChange = bet.layStake;
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
  setSettings: (settings) => storage.set(STORAGE_KEYS.SETTINGS, settings)
};

export default storage;
