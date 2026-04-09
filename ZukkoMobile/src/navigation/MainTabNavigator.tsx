import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../screens/HomeScreen';
import QuizzesScreen from '../screens/QuizzesScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: '#09090b',
                    borderTopWidth: 1,
                    borderTopColor: 'rgba(255,255,255,0.05)',
                    paddingBottom: 5,
                    paddingTop: 5,
                    height: 60,
                },
                tabBarActiveTintColor: '#3b82f6',
                tabBarInactiveTintColor: 'rgba(255,255,255,0.4)',
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    if (route.name === 'HomeTab') {
                        iconName = focused ? 'home' : 'home-outline';
                    } else if (route.name === 'QuizzesTab') {
                        iconName = focused ? 'library' : 'library-outline';
                    } else if (route.name === 'ProfileTab') {
                        iconName = focused ? 'person' : 'person-outline';
                    }

                    return <Ionicons name={iconName as any} size={size} color={color} />;
                },
            })}
        >
            <Tab.Screen
                name="HomeTab"
                component={HomeScreen}
                options={{ title: 'Asosiy' }}
            />
            <Tab.Screen
                name="QuizzesTab"
                component={QuizzesScreen}
                options={{ title: 'Viktorinalar' }}
            />
            <Tab.Screen
                name="ProfileTab"
                component={ProfileScreen}
                options={{ title: 'Profil' }}
            />
        </Tab.Navigator>
    );
}
