import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { apiService } from '../../services/apiService';

interface RouteParams {
  email?: string;
  token?: string;
}

const EmailVerificationScreen = () => {
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();
  const params = route.params as RouteParams;

  // Get screen dimensions for responsive design
  const { width: screenWidth } = Dimensions.get('window');
  const isTablet = screenWidth >= 768;
  const isSmallPhone = screenWidth < 350;

  useEffect(() => {
    // If token is provided in route params, verify automatically
    if (params?.token) {
      handleVerifyEmail(params.token);
    }
  }, [params?.token]);

  useEffect(() => {
    // Countdown timer for resend cooldown
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleVerifyEmail = async (token: string) => {
    setLoading(true);
    
    try {
      const response = await apiService.verifyEmail(token);
      
      if (response.success) {
        setVerified(true);
        Alert.alert(
          'Email Verified!',
          'Your email has been successfully verified. You can now access all features.',
          [
            {
              text: 'Continue',
              onPress: () => navigation.navigate('Login' as never),
            },
          ]
        );
      } else {
        Alert.alert(
          'Verification Failed',
          'The verification link is invalid or has expired. Please request a new verification email.'
        );
      }
    } catch (error) {
      console.error('Email verification error:', error);
      Alert.alert(
        'Verification Failed',
        'Failed to verify email. Please try again or request a new verification email.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!params?.email) {
      Alert.alert('Error', 'Email address not found. Please go back and try again.');
      return;
    }

    setResendLoading(true);
    
    try {
      const response = await apiService.resendEmailVerification(params.email);
      
      if (response.success) {
        setResendCooldown(60); // 60 seconds cooldown
        Alert.alert(
          'Email Sent',
          'A new verification email has been sent to your email address. Please check your inbox and spam folder.'
        );
      } else {
        Alert.alert('Error', 'Failed to send verification email. Please try again.');
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      Alert.alert('Error', 'Failed to send verification email. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigation.navigate('Login' as never);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={[styles.scrollContent, {
          paddingHorizontal: isTablet ? screenWidth * 0.15 : isSmallPhone ? 15 : 20,
        }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons 
              name={verified ? "checkmark-circle" : "mail-outline"} 
              size={80} 
              color={verified ? "#4CAF50" : "#2E7D32"} 
            />
          </View>
          
          <Text style={styles.title}>
            {verified ? 'Email Verified!' : 'Verify Your Email'}
          </Text>
          
          <Text style={styles.subtitle}>
            {verified 
              ? 'Your email has been successfully verified. You can now access all features of the app.'
              : params?.email 
                ? `We've sent a verification link to ${params.email}. Please check your inbox and click the link to verify your account.`
                : 'Please verify your email address to continue using the app.'
            }
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {!verified && (
            <>
              <TouchableOpacity
                style={[
                  styles.resendButton,
                  (resendLoading || resendCooldown > 0) && styles.disabledButton
                ]}
                onPress={handleResendVerification}
                disabled={resendLoading || resendCooldown > 0 || !params?.email}
                accessible={true}
                accessibilityLabel="Resend verification email"
                accessibilityRole="button"
              >
                <Text style={styles.resendButtonText}>
                  {resendLoading 
                    ? 'Sending...' 
                    : resendCooldown > 0 
                      ? `Resend in ${resendCooldown}s`
                      : 'Resend Verification Email'
                  }
                </Text>
              </TouchableOpacity>

              <View style={styles.helpText}>
                <Text style={styles.helpTextContent}>
                  Didn't receive the email? Check your spam folder or try resending.
                </Text>
              </View>
            </>
          )}

          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackToLogin}
            accessible={true}
            accessibilityLabel="Back to login"
            accessibilityRole="button"
          >
            <Text style={styles.backButtonText}>
              {verified ? 'Continue to Login' : 'Back to Login'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Loading indicator */}
        {loading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Verifying your email...</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  actions: {
    width: '100%',
  },
  resendButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#2E7D32',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: '#A5D6A7',
    shadowOpacity: 0.1,
  },
  resendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  helpText: {
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  helpTextContent: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  backButton: {
    borderWidth: 2,
    borderColor: '#2E7D32',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  backButtonText: {
    color: '#2E7D32',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default EmailVerificationScreen;
