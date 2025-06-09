# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Build and run**: `npm run android` or `npm run ios`
- **Start Metro bundler**: `npm start`
- **Linting**: `npm run lint` (with auto-fix) or `npm run lint:check`
- **Type checking**: `npm run type-check`
- **Testing**: `npm test` (single run), `npm run test:watch` (watch mode), `npm run test:coverage` (with coverage)
- **Run single test**: `npm test -- --testNamePattern="test name"`

## Architecture Overview

This is a React Native 0.79.3 plant tracking app with TypeScript. The app uses a **singleton pattern** for core services (DatabaseService, PlantAPIService) and follows a **screen-based architecture** with shared components.

### Key Architectural Patterns

**Database Layer**: SQLite with a centralized `DatabaseService` singleton that manages three main entities:
- Plants (user's plant collection)
- PlantSpecies (cached API data for care information)
- WateringRecords (watering history and tracking)

**Navigation**: Hybrid tab + stack navigation structure:
- Tab navigator at root level (Plants tab, Add Plant tab)
- Stack navigator nested within Plants tab for detail views
- Navigation types should be defined if adding new screens

**API Integration**: External plant data from Perenual API with caching:
- `PlantAPIService` handles all external API calls
- Species data is cached locally in SQLite to reduce API calls
- API responses are transformed to match internal types

**Data Flow**: 
1. Screens interact with DatabaseService for local data
2. PlantAPIService fetches external species data when needed
3. API data is cached in local database for offline access
4. Components receive data as props, no global state management

### Key Files to Understand

- `src/database/DatabaseService.ts` - SQLite operations and schema
- `src/services/PlantAPIService.ts` - External API integration with Perenual
- `src/navigation/AppNavigator.tsx` - Navigation structure
- `src/types/Plant.ts` - Core data models

### Testing Setup

- Jest with React Native preset
- Testing Library for component testing  
- Integration tests for DatabaseService
- Setup file: `src/setupTests.ts`
- Test coverage excludes setup files and type definitions

### API Configuration

The app integrates with Perenual plant API (API key in `src/constants/api.ts`). The service handles rate limiting, timeouts, and transforms API responses to match internal data models.