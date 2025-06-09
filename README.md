# PlantTracker 🌱

A React Native mobile app to help you track your houseplants, their watering schedules, and care information.

## Features

- **Plant Management**: Add, view, and manage your plant collection
- **Species Database**: Search and select from plant species with care information
- **Watering Tracking**: Log watering sessions and view history
- **Care Information**: Get species-specific care instructions and watering schedules
- **Photo Support**: Capture and store photos of your plants
- **Smart Reminders**: Receive notifications when plants need watering

## Tech Stack

- **Frontend**: React Native 0.79.3 with TypeScript
- **Navigation**: React Navigation 7.x (Tab + Stack)
- **Database**: SQLite with react-native-sqlite-storage
- **API Integration**: Plant care data from Perenual API
- **Image Handling**: react-native-image-picker
- **HTTP Client**: Axios

## Getting Started

### Prerequisites

- Node.js (>=18)
- React Native development environment
- Android Studio (for Android) or Xcode (for iOS)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/dtrouton/plants.git
cd plants/PlantTracker
```

2. Install dependencies:
```bash
npm install
```

3. For iOS, install pods:
```bash
cd ios && pod install && cd ..
```

4. Start the Metro bundler:
```bash
npm start
```

5. Run the app:
```bash
# For Android
npm run android

# For iOS
npm run ios
```

## Project Structure

```
src/
├── components/          # Reusable UI components
├── database/           # SQLite database setup and services
├── navigation/         # React Navigation configuration
├── screens/           # App screens/pages
├── services/          # API services and external integrations
├── types/             # TypeScript type definitions
└── utils/             # Utility functions
```

## Database Schema

### Plants Table
- Basic plant information (name, location, photos)
- Links to species data for care information
- Tracks last watering date

### Plant Species Table
- Cached plant care data from APIs
- Watering frequency, light requirements
- Care instructions and tips

### Watering Records Table
- Complete watering history for each plant
- Notes and observations
- Used for tracking and analytics

## Development Status

### Completed ✅
- [x] Project setup and basic structure
- [x] Navigation system (tabs + stack)
- [x] SQLite database schema and services
- [x] TypeScript type definitions
- [x] Complete plant list screen with CRUD operations
- [x] Add plant form with photo capture (camera + library)
- [x] Plant species search and selection with API integration
- [x] Plant detail view with comprehensive care information
- [x] Watering log functionality with history tracking
- [x] Plant care API integration (Perenual API)
- [x] Local caching of species data for offline access
- [x] Professional UI/UX with loading states and error handling
- [x] Comprehensive test suite with 75%+ coverage

### Planned 📋
- [ ] Push notifications for watering reminders
- [ ] Weather-based care adjustments
- [ ] Plant health tracking and analytics
- [ ] Export and backup features
- [ ] Widget support for quick plant status
- [ ] Social features (plant sharing, community tips)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Plant care data provided by [Perenual API](https://perenual.com/)
- Icons and UI inspiration from the plant care community