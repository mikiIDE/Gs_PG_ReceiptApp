import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './src/screens/HomeScreen';
import AddReceiptScreen from './src/screens/AddReceiptScreen';
import OCRScreen from './src/screens/OCRScreen';
import ReceiptDetailScreen from './src/screens/ReceiptDetailScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ title: 'レシート一覧' }}
        />
        <Stack.Screen 
          name="AddReceipt" 
          component={AddReceiptScreen} 
          options={{ title: 'レシート追加' }}
        />
        <Stack.Screen 
          name="OCR" 
          component={OCRScreen} 
          options={{ title: 'レシート撮影' }}
        />
        <Stack.Screen 
          name="ReceiptDetail" 
          component={ReceiptDetailScreen} 
          options={{ title: 'レシート詳細' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
