import React from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import DatabaseInit from './src/database/DatabaseInit';

function App(): React.JSX.Element {
  return (
    <DatabaseInit>
      <AppNavigator />
    </DatabaseInit>
  );
}

export default App;
