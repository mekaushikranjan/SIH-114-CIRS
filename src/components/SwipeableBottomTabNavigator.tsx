import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

interface Tab {
  key: string;
  title: string;
  icon: string;
  component: React.ComponentType<any>;
}

interface SwipeableBottomTabNavigatorProps {
  tabs: Tab[];
  initialTab?: number;
}

const SwipeableBottomTabNavigator: React.FC<SwipeableBottomTabNavigatorProps> = ({
  tabs,
  initialTab = 0,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(initialTab);
  const [isScrolling, setIsScrolling] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  // Handle keyboard events
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidHideListener?.remove();
      keyboardDidShowListener?.remove();
    };
  }, []);

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

  return (
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
          return (
            <View key={tab.key} style={styles.page}>
              <TabComponent />
            </View>
          );
        })}
      </ScrollView>

      {/* Bottom Tab Bar - Hide when keyboard is visible */}
      {!isKeyboardVisible && (
        <SafeAreaView style={styles.tabBarContainer}>
          <View style={styles.tabBar}>
          {tabs.map((tab, index) => {
            const isActive = currentIndex === index;
            return (
              <TouchableOpacity
                key={tab.key}
                style={styles.tabButton}
                onPress={() => handleTabPress(index)}
                activeOpacity={0.7}
              >
                {isActive ? (
                  <View style={styles.activeTabContainer}>
                    <Ionicons
                      name={tab.icon as any}
                      size={24}
                      color="#2E7D32"
                    />
                  </View>
                ) : (
                  <Ionicons
                    name={`${tab.icon}-outline` as any}
                    size={24}
                    color="gray"
                  />
                )}
                <Text
                  style={[
                    styles.tabLabel,
                    { color: isActive ? '#2E7D32' : 'gray' },
                  ]}
                >
                  {tab.title}
                </Text>
              </TouchableOpacity>
            );
          })}
          </View>
        </SafeAreaView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  page: {
    width: screenWidth,
    flex: 1,
  },
  tabBarContainer: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    position: 'relative',
    zIndex: 1000, // Ensure it's above other elements
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingBottom: Platform.OS === 'ios' ? 0 : 10, // Platform-specific padding
    paddingTop: 5,
    height: 60, // Standard height for tab bar
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
  },
  activeTabContainer: {
    backgroundColor: 'rgba(46, 125, 50, 0.15)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
});

export default SwipeableBottomTabNavigator;
