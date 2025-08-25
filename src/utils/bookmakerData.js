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
  { name: 'Bet600', category: 'Major' },
  { name: 'Betano', category: 'Major' },
  { name: 'Betboro', category: 'Major' },
  { name: 'Betdaq Sportsbook', category: 'Major' },
  { name: 'Betfair', category: 'Major' },
  { name: 'Betfair Exchange', category: 'Major' },
  { name: 'Betfred', category: 'Major' },
  { name: 'BetGoodwin', category: 'Major' },
  { name: 'Betmaster', category: 'Major' },
  { name: 'BetMGM', category: 'Major' },
  { name: 'Betnero', category: 'Major' },
  { name: 'BetTOM', category: 'Major' },
  { name: 'BetUK', category: 'Major' },
  { name: 'BetVickers', category: 'Major' },
  { name: 'BetVictor', category: 'Major' },
  { name: 'Betway', category: 'Major' },
  { name: 'BetWright', category: 'Major' },
  { name: 'Betzone', category: 'Major' },
  { name: 'BoyleSports', category: 'Major' },
  { name: 'BresBet', category: 'Major' },
  { name: 'Bwin', category: 'Major' },
  { name: 'Casumo', category: 'Major' },
  { name: 'CopyBet', category: 'Major' },
  { name: 'Coral', category: 'Major' },
  { name: 'Dabble', category: 'Major' },
  { name: 'Dafabet', category: 'Major' },
  { name: 'DAZN Bet', category: 'Major' },
  { name: 'Double Bubble Bingo', category: 'Major' },
  { name: 'DragonBet', category: 'Major' },
  { name: 'Fafabet', category: 'Major' },
  { name: 'FanTeam', category: 'Major' },
  { name: 'Fitzdares', category: 'Major' },
  { name: 'Gentleman Jim', category: 'Major' },
  { name: 'Geoff Banks', category: 'Major' },
  { name: 'GGBET', category: 'Major' },
  { name: 'Grosvenor', category: 'Major' },
  { name: 'HighBet', category: 'Major' },
  { name: 'Hollywoodbets', category: 'Major' },
  { name: 'Jackpotjoy', category: 'Major' },
  { name: 'JeffBet', category: 'Major' },
  { name: 'Karamba', category: 'Major' },
  { name: 'Kwiff', category: 'Major' },
  { name: 'Ladbrokes', category: 'Major' },
  { name: 'LeoVegas', category: 'Major' },
  { name: 'LiveScore Bet', category: 'Major' },
  { name: 'Londonbet', category: 'Major' },
  { name: 'Lottoland', category: 'Major' },
  { name: 'Matchbook Exchange', category: 'Major' },
  { name: 'McBookie', category: 'Major' },
  { name: 'Meta Betting', category: 'Major' },
  { name: 'Midnite', category: 'Major' },
  { name: 'Monopoly Casino', category: 'Major' },
  { name: 'Mr.Play', category: 'Major' },
  { name: 'MrRex', category: 'Major' },
  { name: 'Net88', category: 'Major' },
  { name: 'NetBet', category: 'Major' },
  { name: 'NRG', category: 'Major' },
  { name: 'Octobet', category: 'Major' },
  { name: 'Paddy Power', category: 'Major' },
  { name: 'Parimatch', category: 'Major' },
  { name: 'Party Casino', category: 'Major' },
  { name: 'Party Poker', category: 'Major' },
  { name: 'Planet Sport Bet', category: 'Major' },
  { name: 'PokerStars', category: 'Major' },
  { name: 'PricedUp', category: 'Major' },
  { name: 'Pub Casino', category: 'Major' },
  { name: 'Puntit', category: 'Major' },
  { name: 'QuinnBet', category: 'Major' },
  { name: 'Rainbow Riches Casino', category: 'Major' },
  { name: 'Sky Bet', category: 'Major' },
  { name: 'Sporting Index', category: 'Major' },
  { name: 'Sportingbet', category: 'Major' },
  { name: 'Spreadex', category: 'Major' },
  { name: 'Stakemate', category: 'Major' },
  { name: 'Star Sports', category: 'Major' },
  { name: 'Swifty Sports', category: 'Major' },
  { name: 'talkSPORT Bet', category: 'Major' },
  { name: 'The Pools', category: 'Major' },
  { name: 'Tote', category: 'Major' },
  { name: 'Unibet', category: 'Major' },
  { name: 'VBet', category: 'Major' },
  { name: 'Virgin Bet', category: 'Major' },
  { name: 'William Hill', category: 'Major' },
  { name: 'Custom...', category: 'Custom' }
].sort((a, b) => a.name.localeCompare(b.name));

export const UK_EXCHANGES = [
  { name: 'Betdaq', category: 'Exchange', defaultCommission: 0.0 },
  { name: 'Betfair Exchange', category: 'Exchange', defaultCommission: 5.0 },
  { name: 'Matchbook', category: 'Exchange', defaultCommission: 0.0 },
  { name: 'Smarkets', category: 'Exchange', defaultCommission: 0.0 },
  { name: 'Custom...', category: 'Custom' }
].sort((a, b) => a.name.localeCompare(b.name));

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
