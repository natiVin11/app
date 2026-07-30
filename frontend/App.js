import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Dashboard from './screens/Dashboard';
import AddItem from './screens/AddItem';

const Stack = createStackNavigator();

export default function App() {
    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName="Dashboard" screenOptions={{ headerTitleAlign: 'center' }}>
                <Stack.Screen name="Dashboard" component={Dashboard} options={{ title: 'ניהול תזרים' }} />
                <Stack.Screen name="AddItem" component={AddItem} options={{ title: 'הוספת תנועה' }} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}