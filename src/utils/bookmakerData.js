// UK Bookmakers and Exchanges data
export const UK_BOOKMAKERS = [
  { name: '10bet', category: 'Major' },
  { name: '888sport', category: 'Major' },
  { name: 'AmuletoBet', category: 'Major' },
  { name: 'BAR ONE', category: 'Major' },
  { name: 'Bet365', category: 'Major' },
  { name: 'BetHero', category: 'Major' },
  { name: 'BetMGM', category: 'Major' },
  { name: 'BetUK', category: 'Major' },
  { name: 'BetVictor', category: 'Major' },
  { name: 'Betbull', category: 'Major' },
  { name: 'Betfair Sportsbook', category: 'Major' },
  { name: 'Betfred', category: 'Major' },
  { name: 'BetGoodwin', category: 'Major' },
  { name: 'Betting.com', category: 'Major' },
  { name: 'Betway', category: 'Major' },
  { name: 'Bollybet', category: 'Major' },
  { name: 'BoyleSports', category: 'Major' },
  { name: 'Bresbet', category: 'Major' },
  { name: 'bwin', category: 'Major' },
  { name: 'Coral', category: 'Major' },
  { name: 'COVAL+', category: 'Major' },
  { name: 'DAZN Bet', category: 'Major' },
  { name: 'Dafabet', category: 'Major' },
  { name: 'DIBZ', category: 'Major' },
  { name: 'Fofobet', category: 'Major' },
  { name: 'GetBet', category: 'Major' },
  { name: 'Grosvenor Sport', category: 'Major' },
  { name: 'Kwiff', category: 'Major' },
  { name: 'Ladbrokes', category: 'Major' },
  { name: 'LiveScore Bet', category: 'Major' },
  { name: 'Mobilebet', category: 'Major' },
  { name: 'Mr Green', category: 'Major' },
  { name: 'N/A Sports', category: 'Major' },
  { name: 'NetBet', category: 'Major' },
  { name: 'Paddy Power', category: 'Major' },
  { name: 'Parimatch', category: 'Major' },
  { name: 'PlatinCasino', category: 'Major' },
  { name: 'Punttit', category: 'Major' },
  { name: 'QBet', category: 'Major' },
  { name: 'QuinnBet', category: 'Major' },
  { name: 'Sky Bet', category: 'Major' },
  { name: 'Spreadex', category: 'Major' },
  { name: 'Sportingbet', category: 'Major' },
  { name: 'The Pools', category: 'Major' },
  { name: 'Tote', category: 'Major' },
  { name: 'Unibet', category: 'Major' },
  { name: 'Vickers.Bet', category: 'Major' },
  { name: 'Virgin Bet', category: 'Major' },
  { name: 'William Hill', category: 'Major' },
  { name: 'Youwin', category: 'Major' },
  { name: 'Betzone', category: 'Major' }
];

export const UK_EXCHANGES = [
  { name: 'Betdaq', category: 'Exchange', defaultCommission: 0.0 },
  { name: 'Betfair Exchange', category: 'Exchange', defaultCommission: 5.0 },
  { name: 'Matchbook', category: 'Exchange', defaultCommission: 0.0 },
  { name: 'Smarkets', category: 'Exchange', defaultCommission: 0.0 }
];

// Helper function to get all bookmakers and exchanges
export const getAllProviders = () => {
  return {
    bookmakers: UK_BOOKMAKERS,
    exchanges: UK_EXCHANGES
  };
};

// Helper function to search providers
export const searchProviders = (query, type = 'all') => {
  const searchTerm = query.toLowerCase();
  
  if (type === 'bookmakers' || type === 'all') {
    const bookmakerResults = UK_BOOKMAKERS.filter(bm => 
      bm.name.toLowerCase().includes(searchTerm)
    );
    if (type === 'bookmakers') return bookmakerResults;
  }
  
  if (type === 'exchanges' || type === 'all') {
    const exchangeResults = UK_EXCHANGES.filter(ex => 
      ex.name.toLowerCase().includes(searchTerm)
    );
    if (type === 'exchanges') return exchangeResults;
  }
  
  return {
    bookmakers: UK_BOOKMAKERS.filter(bm => bm.name.toLowerCase().includes(searchTerm)),
    exchanges: UK_EXCHANGES.filter(ex => ex.name.toLowerCase().includes(searchTerm))
  };
};
