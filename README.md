# Match Mate - Matched Betting Tracker PWA

A Progressive Web App (PWA) designed to help matched bettors track their deposits, balances, bets, exposure, and profits without needing spreadsheets. The app provides clear visibility into overall position, profit, and seed repayment progress.

## 🎯 Features

### Core Functionality
- **Dashboard**: Overview of key metrics including seed deposited, total deposits, current float, and settled profit
- **Seed Repayment Tracking**: Visual progress bar showing how much of your initial seed has been repaid
- **Bet Management**: Log qualifying and free bets with automatic calculations
- **Settlement System**: Mark bets as settled and automatically calculate profits
- **Cashflow Tracking**: Manage deposits and withdrawals for bookmakers and exchanges
- **Offline Support**: Works without internet connection using local storage

### Key Metrics Tracked
- Seed deposited (user-entered once)
- Total deposits (sum of bookmaker + exchange deposits)
- Current float (bookmaker balance + exchange balance + open stakes + exposure)
- Settled profit to date (running total)
- Seed repayment progress with visual indicators

## 🚀 Getting Started

### Prerequisites
- Node.js (version 16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd match-mate
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

### Building for Production

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Preview the production build**
   ```bash
   npm run preview
   ```

## 📱 PWA Features

### Installation
- **Desktop**: Click the install button in your browser's address bar
- **Mobile**: Add to home screen from your browser's menu
- **iOS**: Use Safari and tap "Add to Home Screen"

### Offline Support
- All data is stored locally using localStorage
- App works completely offline
- Data persists between sessions

## 🏗️ Project Structure

```
match-mate/
├── public/
│   ├── manifest.json          # PWA manifest
│   ├── sw.js                  # Service worker
│   └── index.html             # Main HTML file
├── src/
│   ├── components/
│   │   ├── Dashboard.jsx      # Main dashboard view
│   │   ├── AddBet.jsx         # Bet logging form
│   │   ├── Bets.jsx           # Bets management
│   │   ├── Cashflow.jsx       # Cashflow tracking
│   │   └── Settings.jsx       # App settings
│   ├── utils/
│   │   ├── storage.js         # Data management
│   │   └── calculations.js    # Betting calculations
│   ├── App.jsx                # Main app component
│   ├── main.jsx               # App entry point
│   └── index.css              # Global styles
├── tailwind.config.js         # Tailwind configuration
└── package.json               # Dependencies
```

## 💾 Data Management

### Local Storage
- All data is stored locally in the browser
- No external servers or databases required
- Data persists between browser sessions

### Backup & Restore
- Export all data as JSON file
- Import data from previously exported backups
- Reset all data option available

### Data Structure
```javascript
{
  bookmakers: [
    {
      id: string,
      name: string,
      totalDeposits: number,
      currentBalance: number
    }
  ],
  exchanges: [
    {
      id: string,
      name: string,
      totalDeposits: number,
      currentBalance: number,
      exposure: number
    }
  ],
  bets: [
    {
      id: string,
      bookmaker: string,
      exchange: string,
      event: string,
      type: 'qualifying' | 'free',
      backStake: number,
      backOdds: number,
      layStake: number,
      layOdds: number,
      liability: number,
      status: 'unsettled' | 'back_won' | 'lay_won',
      netProfit: number
    }
  ],
  seed: {
    initialSeed: number,
    repaidSoFar: number
  }
}
```

## 🎨 Styling

The app uses **Tailwind CSS** for styling with a custom color scheme:
- **Primary**: Blue (#3b82f6)
- **Success**: Green (#22c55e)
- **Danger**: Red (#ef4444)
- **Warning**: Orange (#f59e0b)

## 🔧 Configuration

### Tailwind CSS
The app includes custom Tailwind configuration with:
- Custom color palette
- Responsive design utilities
- Custom component classes

### PWA Configuration
- Manifest file for app installation
- Service worker for offline functionality
- Meta tags for mobile optimization

## 📊 Usage Guide

### Getting Started
1. **Set your seed amount** in Settings
2. **Add bookmakers and exchanges** in Cashflow
3. **Log your first bet** using the Add Bet form
4. **Monitor your progress** on the Dashboard

### Adding Bets
1. Navigate to "Add Bet"
2. Fill in event details and bet type
3. Enter back bet details (stake and odds)
4. Enter lay bet details (odds and liability)
5. Lay stake is calculated automatically
6. Submit to log the bet

### Settling Bets
1. Go to "Bets" tab
2. Find your unsettled bet
3. Click "Back Won" or "Lay Won"
4. Profit is calculated automatically
5. Balances are updated accordingly

### Managing Cashflow
1. Use "Cashflow" tab to track deposits
2. Add new bookmakers/exchanges as needed
3. Update balances when making withdrawals
4. Monitor net positions for each account

## 🚀 Deployment

### Netlify
1. Connect your repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Deploy automatically on push

### Vercel
1. Import your repository to Vercel
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Deploy automatically on push

## 🔮 Future Enhancements

### Phase 2 Features
- CSV import/export functionality
- Charts and analytics
- Notifications for exposure warnings
- Multi-device sync with Firebase
- PDF export for record keeping

### Technical Improvements
- IndexedDB for larger datasets
- Real-time data sync
- Advanced filtering and search
- Performance optimizations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ⚠️ Disclaimer

This app is designed to help track matched betting activities for educational and organizational purposes. Please ensure you comply with all local gambling laws and regulations. The developers are not responsible for any financial losses incurred through betting activities.

## 🆘 Support

For support or questions:
- Check the documentation above
- Review the code comments
- Open an issue on GitHub

---

**Match Mate** - Making matched betting tracking simple and efficient! 🎯
