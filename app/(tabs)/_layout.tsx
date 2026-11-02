import { SymbolView } from 'expo-symbols';
import { Tabs } from 'expo-router';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme].tint,
        tabBarInactiveTintColor: '#849087',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#111713',
          borderTopColor: '#29332D',
          height: 66,
          paddingTop: 7,
          paddingBottom: 8,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
        tabBarHideOnKeyboard: true,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Training',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: 'figure.boxing',
                android: 'sports_mma',
                web: 'sports_mma',
              }}
              tintColor={color}
              size={22}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: 'Fight Card',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: 'calendar',
                android: 'event',
                web: 'event',
              }}
              tintColor={color}
              size={22}
            />
          ),
        }}
      />
    </Tabs>
  );
}
