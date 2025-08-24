// UK Bookmakers and Exchanges data
export const UK_BOOKMAKERS = [
  { name: 'Bet365', category: 'Major' },
  { name: 'William Hill', category: 'Major' },
  { name: 'Ladbrokes', category: 'Major' },
  { name: 'Coral', category: 'Major' },
  { name: 'Paddy Power', category: 'Major' },
  { name: 'Sky Bet', category: 'Major' },
  { name: 'Betfair Sportsbook', category: 'Major' },
  { name: 'Unibet', category: 'Major' },
  { name: 'Betway', category: 'Major' },
  { name: '888sport', category: 'Major' },
  { name: 'Mr Green', category: 'Major' },
  { name: 'BoyleSports', category: 'Major' },
  { name: 'Betfred', category: 'Major' },
  { name: 'Tote', category: 'Major' },
  { name: 'Virgin Bet', category: 'Major' },
  { name: 'QuinnBet', category: 'Major' },
  { name: 'Grosvenor Sport', category: 'Major' },
  { name: 'LeoVegas Sport', category: 'Major' },
  { name: 'Royal Panda', category: 'Major' },
  { name: 'Casumo', category: 'Major' },
  { name: 'Bwin', category: 'Major' },
  { name: 'PartyPoker', category: 'Major' },
  { name: 'PokerStars', category: 'Major' },
  { name: 'BetVictor', category: 'Major' },
  { name: 'Marathon Bet', category: 'Major' },
  { name: 'NetBet', category: 'Major' },
  { name: 'ComeOn', category: 'Major' },
  { name: 'MansionBet', category: 'Major' },
  { name: 'SportNation', category: 'Major' },
  { name: 'VBet', category: 'Major' },
  { name: 'Kwiff', category: 'Major' },
  { name: 'SBK', category: 'Major' },
  { name: 'LiveScore Bet', category: 'Major' },
  { name: 'BetBull', category: 'Major' },
  { name: 'BetUK', category: 'Major' },
  { name: 'BetGoodwin', category: 'Major' },
  { name: 'BetRegal', category: 'Major' },
  { name: 'BetRivers', category: 'Major' },
  { name: 'Betsson', category: 'Major' },
  { name: 'Betsafe', category: 'Major' },
  { name: 'Noxwin', category: 'Major' },
  { name: 'Playson', category: 'Major' },
  { name: 'RedZone', category: 'Major' },
  { name: 'Slotty Vegas', category: 'Major' },
  { name: 'Spela', category: 'Major' },
  { name: 'Thrills', category: 'Major' },
  { name: 'Yggdrasil', category: 'Major' },
  { name: 'Zimpler', category: 'Major' }
];

export const UK_EXCHANGES = [
  { name: 'Betfair Exchange', category: 'Exchange', defaultCommission: 5.0 },
  { name: 'Smarkets', category: 'Exchange', defaultCommission: 2.0 },
  { name: 'Betdaq', category: 'Exchange', defaultCommission: 5.0 },
  { name: 'Matchbook', category: 'Exchange', defaultCommission: 1.0 },
  { name: 'BetConnect', category: 'Exchange', defaultCommission: 3.0 },
  { name: 'BetAngel', category: 'Exchange', defaultCommission: 5.0 },
  { name: 'Geeks Toy', category: 'Exchange', defaultCommission: 5.0 }
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
