import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './src/screens/HomeScreen';
import AddReceiptScreen from './src/screens/AddReceiptScreen';

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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
