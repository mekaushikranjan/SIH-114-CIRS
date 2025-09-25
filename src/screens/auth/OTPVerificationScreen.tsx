import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { loginSuccess } from '../../store/slices/authSlice';
import { tokenStorage } from '../../utils/tokenStorage';
import { apiService } from '../../services/apiService';
import { 
  phoneSendCode, 
  phoneConfirmCode, 
  useEmailVerificationHandler, 
  checkEmailVerified,
  signOutFirebase,
  sendEmailVerificationLink
} from '../../services/firebaseAuth';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { firebaseApp } from '../../services/firebase';

const OTPVerificationScreen = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [phoneConfirmation, setPhoneConfirmation] = useState<any>(null);
  const [emailVerified, setEmailVerified] = useState(false);
  
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();
  const { handleEmailVerification: handleEmailLink } = useEmailVerificationHandler();

  // Get user data from registration
  const { userData } = (route.params as any) || {};
  const registrationType = userData?.registrationType || 'email';
  const recaptchaVerifier = useRef<any>(null);

  // Get screen dimensions for responsive design
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const isTablet = screenWidth >= 768;
  const isSmallPhone = screenWidth < 350;
  const isLandscape = screenWidth > screenHeight;

  // Refs for OTP inputs
  const otpRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    // Initialize verification based on registration type
    const initializeVerification = async () => {
      if (registrationType === 'phone' && userData?.phone) {
        try {
          const confirmation = await phoneSendCode(userData.phone, recaptchaVerifier.current);
          setPhoneConfirmation(confirmation);
        } catch (error) {
          console.error('Error sending phone OTP:', error);
          Alert.alert('Error', 'Failed to send OTP to your phone number');
        }
      } else if (registrationType === 'email') {
        // For email, check if already verified
        try {
          const verified = await checkEmailVerified(userData?.tempUser);
          setEmailVerified(verified);
        } catch (error) {
          console.error('Error checking email verification:', error);
        }
      }
    };

    initializeVerification();

    // Start countdown timer for phone OTP
    if (registrationType === 'phone') {
      const interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [registrationType, userData]);

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    // Handle backspace
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    if (registrationType === 'phone') {
      await handlePhoneVerification();
    } else if (registrationType === 'email') {
      await handleEmailVerification();
    }
  };

  const handlePhoneVerification = async () => {
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      Alert.alert(t('common.error'), t('auth.enterValidOTP'));
      return;
    }

    if (!phoneConfirmation) {
      Alert.alert(t('common.error'), 'Phone verification not initialized');
      return;
    }

    setLoading(true);

    try {
      const user = await phoneConfirmCode(phoneConfirmation, otpCode);
      
      // Update user profile with real email if provided
      // Firebase's updateProfile does not support updating email, must use updateEmail separately
      if (userData?.name && userData.name !== user.displayName) {
        await user.updateProfile({ displayName: userData.name });
      }
      if (userData?.email && userData.email !== user.email) {
        await user.updateEmail(userData.email);
      }

      // Upsert user in backend
      const idToken = await user.getIdToken();
      const res = await apiService.firebaseLoginUpsert(idToken);
      
      if (res.success && res.data) {
        const verifiedUserData = {
          id: res.data.user.id,
          name: res.data.user.name,
          email: res.data.user.email,
          phone: res.data.user.phone,
          role: 'citizen' as const,
        };

        dispatch(loginSuccess({
          user: verifiedUserData,
          token: await user.getIdToken(),
        }));
        return;
      }
    } catch (error: any) {
      console.error('Phone verification error:', error);
      Alert.alert(t('common.error'), error.message || 'Phone verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailVerification = async () => {
    setLoading(true);

    try {
      // Check if email is verified
      const verified = await checkEmailVerified(userData?.tempUser);
      
      if (verified) {
        setEmailVerified(true);
        
        // Upsert user in backend
        const idToken = await user.getIdToken();
        const res = await apiService.firebaseLoginUpsert(idToken);
        
        if (res.success && res.data) {
          const verifiedUserData = {
            id: res.data.user.id,
            name: res.data.user.name,
            email: res.data.user.email,
            phone: res.data.user.phone,
            role: 'citizen' as const,
          };

          dispatch(loginSuccess({
            user: verifiedUserData,
            token: await userData?.tempUser?.getIdToken(),
          }));
          
          return;
        }
      } else {
        Alert.alert(t('common.error'), 'Please check your email and click the verification link');
      }
    } catch (error: any) {
      console.error('Email verification error:', error);
      Alert.alert(t('common.error'), error.message || 'Email verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;

    setResendLoading(true);
    
    try {
      if (registrationType === 'phone' && userData?.phone) {
        // Resend phone OTP
        const confirmation = await phoneSendCode(userData.phone, recaptchaVerifier.current);
        setPhoneConfirmation(confirmation);
        
        // Reset timer and disable resend
        setTimer(60);
        setCanResend(false);
        setOtp(['', '', '', '', '', '']);
        
        // Restart countdown
        const interval = setInterval(() => {
          setTimer((prev) => {
            if (prev <= 1) {
              setCanResend(true);
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        Alert.alert(t('common.success'), 'OTP resent to your phone number');
      } else if (registrationType === 'email') {
        // Resend email verification link
        await sendEmailVerificationLink(userData?.tempUser);
        Alert.alert(t('common.success'), 'Verification link resent to your email');
      }
    } catch (error: any) {
      console.error('Resend error:', error);
      Alert.alert(t('common.error'), error.message || 'Failed to resend verification');
    } finally {
      setResendLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingHorizontal: isTablet ? screenWidth * 0.15 : isSmallPhone ? 15 : 20,
              paddingTop: isLandscape ? 10 : 20,
              paddingBottom: isLandscape ? 10 : 20,
            }
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          contentInsetAdjustmentBehavior="never"
        >
          {/* Header */}
          <View style={styles.header} accessible={true} accessibilityRole="header">
            <Image 
              source={require('../../../assets/Jharkhand_Rajakiya_Chihna.png')} 
              style={styles.logo}
              resizeMode="contain"
              accessible={true}
              accessibilityLabel="Government of Jharkhand official emblem"
            />
            <Text 
              style={[
                styles.title,
                {
                  fontSize: isTablet ? 28 : isSmallPhone ? 20 : 24,
                }
              ]}
              accessible={true}
              accessibilityRole="header"
              accessibilityLabel="Civic Issue Reporter - Main application title"
            >
              Civic Issue Reporter
            </Text>
            <Text 
              style={[
                styles.subtitle,
                {
                  fontSize: isTablet ? 18 : isSmallPhone ? 14 : 16,
                }
              ]}
              accessible={true}
              accessibilityLabel="Government of Jharkhand"
            >
              Government of Jharkhand
            </Text>
          </View>

          {/* OTP Verification Form */}
          <View style={[
            styles.form,
            {
              maxWidth: isTablet ? 400 : '100%',
              alignSelf: 'center',
              padding: isSmallPhone ? 15 : 20,
              marginHorizontal: isTablet ? 0 : 5,
            }
          ]}>
            <Text 
              style={[
                styles.formTitle,
                {
                  fontSize: isTablet ? 22 : isSmallPhone ? 18 : 20,
                }
              ]}
              accessible={true}
              accessibilityRole="header"
              accessibilityLabel={`Verify Your ${registrationType === 'phone' ? 'Phone' : 'Email'} - Verification form`}
            >
              {registrationType === 'phone' ? 'Verify Your Phone Number' : 'Verify Your Email'}
            </Text>

            <Text style={styles.description}>
              {registrationType === 'phone' 
                ? `We've sent an OTP to ${userData?.phone}` 
                : `We've sent a verification link to ${userData?.email}. Please check your email and click the link to verify.`
              }
            </Text>

            {/* OTP Input Fields - Only show for phone verification */}
            {registrationType === 'phone' && (
              <View style={styles.otpContainer}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => { otpRefs.current[index] = ref; }}
                    style={[
                      styles.otpInput,
                      digit ? styles.otpInputFilled : null
                    ]}
                    value={digit}
                    onChangeText={(value) => handleOtpChange(value, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    keyboardType="numeric"
                    maxLength={1}
                    textAlign="center"
                    accessible={true}
                    accessibilityLabel={`OTP digit ${index + 1}`}
                    accessibilityHint="Enter one digit of the OTP code"
                  />
                ))}
              </View>
            )}

            {/* Email verification status */}
            {registrationType === 'email' && (
              <View style={styles.emailVerificationContainer}>
                <Text style={styles.emailVerificationText}>
                  {emailVerified 
                    ? '✅ Email verified successfully!' 
                    : '📧 Please check your email and click the verification link'
                  }
                </Text>
              </View>
            )}

            <TouchableOpacity 
              style={[styles.verifyButton, loading && styles.verifyButtonDisabled]}
              onPress={handleVerifyOTP}
              disabled={loading}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={loading ? "Verifying, please wait" : `Verify ${registrationType}`}
              accessibilityHint={`Tap to verify your ${registrationType}`}
              accessibilityState={{ disabled: loading }}
            >
              <Text style={styles.verifyButtonText}>
                {loading ? t('common.loading') : `Verify ${registrationType === 'phone' ? 'OTP' : 'Email'}`}
              </Text>
            </TouchableOpacity>

            {/* Resend verification */}
            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>
                {registrationType === 'phone' ? "Didn't receive OTP?" : "Didn't receive email?"} 
              </Text>
              {registrationType === 'phone' ? (
                canResend ? (
                  <TouchableOpacity 
                    onPress={handleResendOTP}
                    disabled={resendLoading}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel="Resend OTP"
                    accessibilityHint="Tap to resend the OTP code to your phone"
                  >
                    <Text style={styles.resendLink}>
                      {resendLoading ? t('common.loading') : 'Resend OTP'}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.timerText}>
                    Resend in {formatTime(timer)}
                  </Text>
                )
              ) : (
                <TouchableOpacity 
                  onPress={handleResendOTP}
                  disabled={resendLoading}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Resend email"
                  accessibilityHint="Tap to resend the verification link to your email"
                >
                  <Text style={styles.resendLink}>
                    {resendLoading ? t('common.loading') : 'Resend Email'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Back to Register Link */}
            <View 
              style={styles.backContainer}
              accessible={true}
              accessibilityRole="text"
              accessibilityLabel={`Wrong ${registrationType}? Go back to registration`}
            >
              <Text style={styles.backText}>Wrong {registrationType}? </Text>
              <TouchableOpacity 
                onPress={() => navigation.goBack()}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Go back to registration"
                accessibilityHint="Tap to go back to the registration screen"
              >
                <Text style={styles.backLink}>Go Back</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Firebase reCAPTCHA Modal for phone verification */}
      {registrationType === 'phone' && (
        <FirebaseRecaptchaVerifierModal
          ref={recaptchaVerifier}
          firebaseConfig={firebaseApp.options as any}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f7f0',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 15,
    marginTop: 15,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  form: {
    backgroundColor: 'white',
    borderRadius: 24,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 20,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
    paddingHorizontal: 10,
  },
  otpInput: {
    width: 45,
    height: 45,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    backgroundColor: '#f9f9f9',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  otpInputFilled: {
    borderColor: '#2E7D32',
    backgroundColor: '#f0f7f0',
  },
  verifyButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    minHeight: 42,
  },
  verifyButtonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  verifyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    flexWrap: 'wrap',
  },
  resendText: {
    color: '#424242',
    fontSize: 14,
  },
  resendLink: {
    color: '#1B5E20',
    fontWeight: 'bold',
    fontSize: 14,
  },
  timerText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  backContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  backText: {
    color: '#424242',
    fontSize: 14,
  },
  backLink: {
    color: '#1B5E20',
    fontWeight: 'bold',
  },
  // Email verification styles
  emailVerificationContainer: {
    backgroundColor: '#f0f7f0',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#c8e6c9',
  },
  emailVerificationText: {
    fontSize: 14,
    color: '#2E7D32',
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default OTPVerificationScreen;
