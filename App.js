import { useEffect, useState } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { LinearGradient } from 'expo-linear-gradient';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import screens
import OnboardingScreen from './screens/OnboardingScreen';
import SignupScreen from './screens/SignupScreen';
import AdditionalInfoScreen from './screens/AdditionalInfoScreen';
import SuccessModalScreen from './screens/SuccessModalScreen';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import HeartRateDetailScreen from './screens/HeartRateDetailScreen';
import TemperatureDetailScreen from './screens/TemperatureDetailScreen';
import OxygenDetailScreen from './screens/OxygenDetailScreen';
import MovementDetailScreen from './screens/MovementDetailScreen';

import VitalsTimelineScreen from './screens/VitalsTimelineScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import SettingsScreen from './screens/SettingsScreen';
import SleepPatternsScreen from './screens/SleepPatternsScreen';
import ParentAccountScreen from './screens/ParentAccountScreen';
import ChangePasswordScreen from './screens/ChangePasswordScreen';


// Prevent auto-hiding right away
SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator();

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(async () => {
      setShowSplash(false);
      await SplashScreen.hideAsync();
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return (
      <LinearGradient colors={['#86d7fc', '#cffafc']} style={styles.container}>
        <Image source={require('./assets/Splash.png')} style={styles.logo} />
      </LinearGradient>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Onboarding"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        {/* Auth Flow */}
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
       
        <Stack.Screen name="AdditionalInfo" component={AdditionalInfoScreen} />
        <Stack.Screen 
          name="SuccessModal" 
          component={SuccessModalScreen}
          options={{
            presentation: 'transparentModal',
            animation: 'fade',
          }}
        />
        <Stack.Screen name="Login" component={LoginScreen} />
        
        {/* Main App */}
        <Stack.Screen name="Home" component={HomeScreen} />
        
        {/* Vital Details - Each has its own screen now */}
        <Stack.Screen name="HeartRateDetail" component={HeartRateDetailScreen} />
        <Stack.Screen name="TemperatureDetail" component={TemperatureDetailScreen} />
        <Stack.Screen name="OxygenDetail" component={OxygenDetailScreen} />
        <Stack.Screen name="MovementDetail" component={MovementDetailScreen} />

        {/* Sleep Pattern */}
        <Stack.Screen name="SleepPatterns" component={SleepPatternsScreen} options={{ title: 'Sleep Patterns' }} />
        
        <Stack.Screen name="ParentAccount" component={ParentAccountScreen} />
        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />




        
      
        
        
        
        {/* TODO: Create these screens */}
        <Stack.Screen name="VitalsTimeline" component={VitalsTimelineScreen} /> 
        <Stack.Screen name="Notifications" component={NotificationsScreen} /> 
        <Stack.Screen name="Settings" component={SettingsScreen} /> 
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 250,
    height: 250,
    resizeMode: 'contain',
  },
});