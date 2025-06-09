import '@testing-library/react-native';

// Mock react-native-sqlite-storage
jest.mock('react-native-sqlite-storage', () => ({
  DEBUG: jest.fn(),
  enablePromise: jest.fn(),
  openDatabase: jest.fn(() => Promise.resolve({
    executeSql: jest.fn(() => Promise.resolve([{ rows: { length: 0, item: jest.fn() } }])),
    close: jest.fn(() => Promise.resolve()),
  })),
}));

// Mock react-native-image-picker
jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(),
  launchCamera: jest.fn(),
}));

// Mock axios
jest.mock('axios', () => ({
  get: jest.fn(() => Promise.resolve({ data: {} })),
  isAxiosError: jest.fn(() => false),
}));

// Mock react-navigation
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: jest.fn(),
  NavigationContainer: ({ children }: any) => children,
  createNavigatorFactory: jest.fn(),
}));

jest.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: jest.fn(() => ({
    Navigator: ({ children }: any) => children,
    Screen: ({ children }: any) => children,
  })),
}));

jest.mock('@react-navigation/stack', () => ({
  createStackNavigator: jest.fn(() => ({
    Navigator: ({ children }: any) => children,
    Screen: ({ children }: any) => children,
  })),
}));

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native/Libraries/Components/View/View');
  return {
    Swipeable: View,
    DrawerLayout: View,
    State: {},
    ScrollView: View,
    Slider: View,
    Switch: View,
    TextInput: View,
    ToolbarAndroid: View,
    ViewPagerAndroid: View,
    DrawerLayoutAndroid: View,
    WebView: View,
    NativeViewGestureHandler: View,
    TapGestureHandler: View,
    FlingGestureHandler: View,
    ForceTouchGestureHandler: View,
    LongPressGestureHandler: View,
    PanGestureHandler: View,
    PinchGestureHandler: View,
    RotationGestureHandler: View,
    RawButton: View,
    BaseButton: View,
    RectButton: View,
    BorderlessButton: View,
    FlatList: View,
    gestureHandlerRootHOC: jest.fn((component) => component),
    Directions: {},
  };
});

// Set up global mockAlert for tests
const { __mockAlert } = require('react-native');
global.mockAlert = __mockAlert;
