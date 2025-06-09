// __mocks__/react-native.js
const React = require('react');
const mockAlert = jest.fn();

const mockComponent = (name) => {
  const MockedComponent = (props) => {
    return React.createElement(name, props, props.children);
  };
  MockedComponent.displayName = `Mocked${name}`;
  return MockedComponent;
};

const mockScrollTo = jest.fn();

module.exports = {
  // Core components
  View: mockComponent('View'),
  Text: mockComponent('Text'),
  ScrollView: mockComponent('ScrollView'),
  TouchableOpacity: mockComponent('TouchableOpacity'),
  TouchableHighlight: mockComponent('TouchableHighlight'),
  TouchableWithoutFeedback: mockComponent('TouchableWithoutFeedback'),
  TextInput: mockComponent('TextInput'),
  Image: mockComponent('Image'),
  FlatList: mockComponent('FlatList'),
  Modal: mockComponent('Modal'),
  SafeAreaView: mockComponent('SafeAreaView'),
  KeyboardAvoidingView: mockComponent('KeyboardAvoidingView'),
  ActivityIndicator: mockComponent('ActivityIndicator'),
  
  // StyleSheet
  StyleSheet: {
    create: (styles) => styles,
    flatten: (styles) => styles,
  },
  
  // Alert
  Alert: {
    alert: mockAlert,
  },
  
  // Platform
  Platform: {
    OS: 'ios',
    select: (objs) => objs.ios,
  },
  
  // Dimensions
  Dimensions: {
    get: jest.fn(() => ({ width: 375, height: 667 })),
  },
  
  // Keyboard
  Keyboard: {
    addListener: jest.fn(),
    removeListener: jest.fn(),
    removeAllListeners: jest.fn(),
  },
  
  // BackHandler
  BackHandler: {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  },
  
  // Linking
  Linking: {
    openURL: jest.fn(),
    canOpenURL: jest.fn(() => Promise.resolve(true)),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  },
  
  // PixelRatio
  PixelRatio: {
    get: jest.fn(() => 2),
    getFontScale: jest.fn(() => 1),
  },
  
  // StatusBar
  StatusBar: {
    setBarStyle: jest.fn(),
    setBackgroundColor: jest.fn(),
    setHidden: jest.fn(),
  },
  
  // AppState
  AppState: {
    currentState: 'active',
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  },
  
  // NativeModules
  NativeModules: {},
  
  // findNodeHandle
  findNodeHandle: jest.fn(),
  
  // Global mock alert reference
  __mockAlert: mockAlert,
};