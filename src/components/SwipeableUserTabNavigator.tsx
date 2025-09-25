import React, { useRef, useState, createContext, useContext, useImperativeHandle, forwardRef } from 'react';
import {
  View,
  ScrollView,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: screenWidth } = Dimensions.get('window');

interface Tab {
  key: string;
  title: string;
  icon: string;
  iconOutline: string;
  component: React.ComponentType<any>;
}

interface SwipeableUserTabNavigatorProps {
  tabs: Tab[];
  initialTab?: number;
}

// Navigation context for programmatic navigation
const UserTabNavigationContext = createContext<{
  navigateToTab: (tabKey: string, params?: any) => void;
} | null>(null);

export const useUserTabNavigation = () => {
  const context = useContext(UserTabNavigationContext);
  if (!context) {
    throw new Error('useUserTabNavigation must be used within SwipeableUserTabNavigator');
  }
  return context;
};

// Ref interface for external navigation
export interface SwipeableUserTabNavigatorRef {
  navigateToTab: (tabKey: string, params?: any) => void;
}

const SwipeableUserTabNavigator = forwardRef<SwipeableUserTabNavigatorRef, SwipeableUserTabNavigatorProps>(({
  tabs,
  initialTab = 0,
}, ref) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(initialTab);
  const [isScrolling, setIsScrolling] = useState(false);
  const [tabParams, setTabParams] = useState<Record<string, any>>({});
  const insets = useSafeAreaInsets();

  // Handle tab press
  const handleTabPress = (index: number) => {
    if (index !== currentIndex && !isScrolling) {
      setCurrentIndex(index);
      scrollViewRef.current?.scrollTo({
        x: index * screenWidth,
        animated: true,
      });
    }
  };

  // Handle scroll end
  const handleScrollEnd = (event: any) => {
    if (!isScrolling) return;
    
    const offsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / screenWidth);
    
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < tabs.length) {
      setCurrentIndex(newIndex);
    }
    setIsScrolling(false);
  };

  const handleScrollBeginDrag = () => {
    setIsScrolling(true);
  };

  // Navigation function
  const navigateToTab = (tabKey: string, params?: any) => {
    const tabIndex = tabs.findIndex(tab => tab.key === tabKey);
    if (tabIndex !== -1) {
      // Store params for the target tab
      if (params) {
        setTabParams(prev => ({ ...prev, [tabKey]: params }));
      }
      
      // Navigate to the tab
      setCurrentIndex(tabIndex);
      scrollViewRef.current?.scrollTo({
        x: tabIndex * screenWidth,
        animated: true,
      });
    }
  };

  // Expose navigation function via ref
  useImperativeHandle(ref, () => ({
    navigateToTab,
  }));

  return (
    <UserTabNavigationContext.Provider value={{ navigateToTab }}>
      <View style={styles.container}>
        {/* Swipeable Content */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScrollEnd}
          onScrollBeginDrag={handleScrollBeginDrag}
          scrollEventThrottle={16}
          bounces={false}
          style={styles.scrollView}
        >
          {tabs.map((tab, index) => {
            const TabComponent = tab.component;
            const params = tabParams[tab.key];
            return (
              <View key={tab.key} style={styles.page}>
                <TabComponent {...(params || {})} />
              </View>
            );
          })}
        </ScrollView>

      {/* Bottom Tab Bar */}
      <View style={[
        styles.tabBar,
        {
          paddingBottom: Math.max(insets.bottom, 8),
          height: Platform.OS === 'ios' ? 60 + Math.max(insets.bottom - 10, 0) : 60,
        }
      ]}>
        {tabs.map((tab, index) => {
          const isActive = currentIndex === index;
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabButton}
              onPress={() => handleTabPress(index)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isActive ? tab.icon as any : tab.iconOutline as any}
                size={24}
                color={isActive ? '#2E7D32' : '#666'}
              />
              <Text
                style={[
                  styles.tabLabel,
                  { 
                    color: isActive ? '#2E7D32' : '#666',
                    marginBottom: Platform.OS === 'ios' ? 0 : 4,
                  },
                ]}
              >
                {tab.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      </View>
    </UserTabNavigationContext.Provider>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  page: {
    width: screenWidth,
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
  },
});

export default SwipeableUserTabNavigator;
