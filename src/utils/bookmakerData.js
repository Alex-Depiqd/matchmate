// UK Bookmakers and Exchanges data
export const UK_BOOKMAKERS = [
  { name: '10Bet', category: 'Major' },
  { name: '32Red', category: 'Major' },
  { name: '7bet', category: 'Major' },
  { name: '888sport', category: 'Major' },
  { name: 'AKBets', category: 'Major' },
  { name: 'All British Casino', category: 'Major' },
  { name: 'Bally Casino', category: 'Major' },
  { name: 'Bar-One', category: 'Major' },
  { name: 'Bet365', category: 'Major' },
  { name: 'Betfair', category: 'Major' },
  { name: 'Betfred', category: 'Major' },
  { name: 'Betway', category: 'Major' },
  { name: 'BoyleSports', category: 'Major' },
  { name: 'Bwin', category: 'Major' },
  { name: 'Casumo', category: 'Major' },
  { name: 'Coral', category: 'Major' },
  { name: 'Dafabet', category: 'Major' },
  { name: 'Ladbrokes', category: 'Major' },
  { name: 'LeoVegas', category: 'Major' },
  { name: 'Paddy Power', category: 'Major' },
  { name: 'PokerStars', category: 'Major' },
  { name: 'Sky Bet', category: 'Major' },
  { name: 'Unibet', category: 'Major' },
  { name: 'William Hill', category: 'Major' },
  { name: 'Custom...', category: 'Custom' }
];

export const UK_EXCHANGES = [
  { name: 'Betdaq', category: 'Exchange', defaultCommission: 0.0 },
  { name: 'Betfair Exchange', category: 'Exchange', defaultCommission: 5.0 },
  { name: 'Matchbook', category: 'Exchange', defaultCommission: 0.0 },
  { name: 'Smarkets', category: 'Exchange', defaultCommission: 0.0 },
  { name: 'Custom...', category: 'Custom' }
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
