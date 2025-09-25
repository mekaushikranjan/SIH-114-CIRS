import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  ScrollView,
  Dimensions,
  Modal,
  Keyboard,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { loginSuccess } from '../../store/slices/authSlice';
import { tokenStorage } from '../../utils/tokenStorage';
import { apiService } from '../../services/apiService';
import { signInWithGoogle } from '../../services/firebaseAuth';
import LoadingScreen from '../../components/LoadingScreen';

const RegisterScreen = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    address: {
      street: '',
      city: '',
      state: 'Jharkhand',
      postalCode: '',
    },
    departmentId: null as number | null,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [registrationType, setRegistrationType] = useState<'email'>('email');
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { t } = useTranslation();
  
  // Map backend roles to frontend roles
  const mapRole = (backendRole: string) => {
    switch (backendRole?.toUpperCase()) {
      case 'ADMIN':
        return 'admin' as const;
      case 'GROUND_WORKER':
      case 'DEPARTMENT_HEAD':
        return 'worker' as const;
      case 'CITIZEN':
      default:
        return 'citizen' as const;
    }
  };
  
  // Initialize Google Auth hook
  // No hooks needed for pure Firebase Google auth

  // Get screen dimensions for responsive design
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const isTablet = screenWidth >= 768;
  const isSmallPhone = screenWidth < 350;
  const isLandscape = screenWidth > screenHeight;

  // Keyboard visibility listener
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  // Force layout adjustment on mount
  useEffect(() => {
    // Small delay to ensure proper layout calculation
    const timer = setTimeout(() => {
      // Trigger a layout update if needed
      setKeyboardVisible(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);


  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Tab selection handler
  const handleTabSelect = (type: 'email' | 'phone') => {
    setRegistrationType(type);
    // Don't clear fields to prevent UI movement
  };

  const handleEmailRegister = async () => {
    const { fullName, email, phoneNumber, password, confirmPassword, address } = formData;
    
    if (!fullName || !email || !phoneNumber || !password || !confirmPassword) {
      Alert.alert(t('common.error'), t('auth.fillAllFields'));
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(t('common.error'), t('auth.passwordMismatch'));
      return;
    }

    if (password.length < 6) {
      Alert.alert(t('common.error'), t('auth.passwordTooShort'));
      return;
    }

    setLoading(true);
    
    try {
      // Register with backend API
      const response = await apiService.register({
        fullName: fullName,
        email: email,
        phoneNumber: phoneNumber,
        password: password,
        confirmPassword: confirmPassword,
        address: address,
        departmentId: formData.departmentId,
      });
      
      if (response.success && response.data) {
        // Store auth data and redirect to home
        const userData = {
          id: response.data.user.id,
          name: response.data.user.fullName || response.data.user.name || '',
          email: response.data.user.email,
          phone: response.data.user.phoneNumber || response.data.user.phone || '',
          role: mapRole(response.data.user.role || 'CITIZEN') as 'citizen' | 'admin' | 'worker',
        };
        
        await tokenStorage.storeAuthData(response.data.token, userData);
        
        dispatch(loginSuccess({
          user: userData,
          token: response.data.token,
        }));
        
        Alert.alert(
          'Registration Successful!', 
          'Welcome to Civic Issue Reporter! Your account has been created successfully.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigation will be handled automatically by the auth state change
              },
            },
          ]
        );
      } else {
        Alert.alert(t('common.error'), response.error?.message || 'Registration failed. Please try again.');
      }
    } catch (error: any) {
      console.error('Email registration error:', error);
      Alert.alert(t('common.error'), error.message || t('auth.registrationError'));
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneRegister = async () => {
    const { fullName, phoneNumber, password, confirmPassword, address } = formData;
    
    if (!fullName || !phoneNumber || !password || !confirmPassword) {
      Alert.alert(t('common.error'), t('auth.fillAllFields'));
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(t('common.error'), t('auth.passwordMismatch'));
      return;
    }

    if (password.length < 6) {
      Alert.alert(t('common.error'), t('auth.passwordTooShort'));
      return;
    }

    setLoading(true);
    
    try {
      // Register with backend API (phone-based registration)
      const response = await apiService.register({
        fullName: fullName,
        email: formData.email || '',
        phoneNumber: phoneNumber,
        password: password,
        confirmPassword: confirmPassword,
        address: address,
        departmentId: formData.departmentId,
      });
      
      if (response.success && response.data) {
        // Store auth data and redirect to home
        const userData = {
          id: response.data.user.id,
          name: response.data.user.fullName || response.data.user.name || '',
          email: response.data.user.email,
          phone: response.data.user.phoneNumber || response.data.user.phone || '',
          role: mapRole(response.data.user.role || 'CITIZEN') as 'citizen' | 'admin' | 'worker',
        };
        
        await tokenStorage.storeAuthData(response.data.token, userData);
        
        dispatch(loginSuccess({
          user: userData,
          token: response.data.token,
        }));
        
        Alert.alert(
          'Registration Successful!', 
          'Welcome to Civic Issue Reporter! Your account has been created successfully.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigation will be handled automatically by the auth state change
              },
            },
          ]
        );
      } else {
        Alert.alert(t('common.error'), response.error?.message || 'Registration failed. Please try again.');
      }
    } catch (error: any) {
      console.error('Phone registration error:', error);
      Alert.alert(t('common.error'), error.message || t('auth.registrationError'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    try {
      setLoading(true);
      console.log('[RegisterScreen] Starting Firebase Google Sign-In...');
      
      // Use pure Firebase Google Sign-In
      const user = await signInWithGoogle();
      if (!user) return;

      const idToken = await user.getIdToken();
      const response = await apiService.loginWithGoogle(idToken);

      if (response.success && response.data) {
        const userData = {
          id: response.data.user.id,
          name: response.data.user.fullName || response.data.user.name || '',
          email: response.data.user.email,
          phone: response.data.user.phoneNumber || response.data.user.phone || '',
          role: mapRole(response.data.user.role || 'CITIZEN') as 'citizen' | 'admin' | 'worker',
        };
        
        await tokenStorage.storeAuthData(response.data.token, userData);
        
        dispatch(loginSuccess({
          user: userData,
          token: response.data.token,
        }));
        
      } else {
        Alert.alert('Error', 'Google registration failed. Please try again.');
      }
    } catch (error: any) {
      console.error('Google registration error:', error);
      Alert.alert('Error', 'Google registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTermsPress = () => {
    (navigation as any).navigate('TermsOfService');
  };

  // Show loading screen when loading
  if (loading) {
    return <LoadingScreen type="register" message="Creating your account..." />;
  }

  return (
    <SafeAreaView 
      style={[styles.container, { borderBottomWidth: 0 }]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="#f0f7f0" 
        translucent={false}
      />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView 
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingHorizontal: isTablet ? screenWidth * 0.15 : isSmallPhone ? 15 : 20,
              paddingTop: isLandscape ? 10 : 20,
              paddingBottom: 20,
            }
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
          showsHorizontalScrollIndicator={false}
          contentInsetAdjustmentBehavior="automatic"
          bounces={true}
          scrollEventThrottle={16}
          scrollEnabled={true}
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

          {/* Registration Form */}
          <View style={styles.formContainer}>

            <Text 
              style={[
                styles.formTitle,
                {
                  fontSize: isTablet ? 22 : isSmallPhone ? 18 : 20,
                }
              ]}
              accessible={true}
              accessibilityRole="header"
              accessibilityLabel="Create Account - Registration form"
            >
              Create Account
            </Text>

              
            {/* Name Field - Always show */}
            <View style={styles.inputContainer}>
              <Ionicons 
                name="person-outline" 
                size={20} 
                color="#555" 
                style={styles.inputIcon}
                accessible={false}
              />
              <TextInput
                style={styles.input}
                placeholder={t('auth.fullName')}
                value={formData.fullName}
                onChangeText={(value) => handleInputChange('fullName', value)}
                autoCapitalize="words"
                autoCorrect={false}
                accessible={true}
                accessibilityLabel="Full name input field"
                accessibilityHint="Enter your full name"
                returnKeyType="next"
              />
            </View>

            {/* Email Field */}
            <View style={styles.inputContainer}>
              <Ionicons 
                name="mail-outline" 
                size={20} 
                color="#555" 
                style={styles.inputIcon}
                accessible={false}
              />
              <TextInput
                style={styles.input}
                placeholder={t('auth.email')}
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                accessible={true}
                accessibilityLabel="Email address input field"
                accessibilityHint="Enter your email address"
                returnKeyType="next"
              />
            </View>

            {/* Phone Number Field */}
            <View style={styles.inputContainer}>
              <Ionicons 
                name="call-outline" 
                size={20} 
                color="#555" 
                style={styles.inputIcon}
                accessible={false}
              />
              <TextInput
                style={styles.input}
                placeholder={t('auth.phoneNumber')}
                value={formData.phoneNumber}
                onChangeText={(value) => handleInputChange('phoneNumber', value)}
                keyboardType="phone-pad"
                autoCapitalize="none"
                autoCorrect={false}
                accessible={true}
                accessibilityLabel="Phone number input field"
                accessibilityHint="Enter your phone number"
                returnKeyType="next"
              />
            </View>

            {/* Password Fields - Always show */}
            <View style={styles.inputContainer}>
              <Ionicons 
                name="lock-closed-outline" 
                size={20} 
                color="#555" 
                style={styles.inputIcon}
                accessible={false}
              />
              <TextInput
                style={styles.input}
                placeholder={t('auth.password')}
                value={formData.password}
                onChangeText={(value) => handleInputChange('password', value)}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                accessible={true}
                accessibilityLabel="Password input field"
                accessibilityHint="Enter your password"
                returnKeyType="next"
              />
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                accessibilityHint={showPassword ? "Tap to hide your password" : "Tap to show your password"}
              >
                <Ionicons 
                  name={showPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color="#555" 
                />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Ionicons 
                name="lock-closed-outline" 
                size={20} 
                color="#555" 
                style={styles.inputIcon}
                accessible={false}
              />
              <TextInput
                style={styles.input}
                placeholder={t('auth.confirmPassword')}
                value={formData.confirmPassword}
                onChangeText={(value) => handleInputChange('confirmPassword', value)}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
                accessible={true}
                accessibilityLabel="Confirm password input field"
                accessibilityHint="Re-enter your password to confirm"
                returnKeyType="done"
              />
              <TouchableOpacity 
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeIcon}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                accessibilityHint={showConfirmPassword ? "Tap to hide your confirm password" : "Tap to show your confirm password"}
              >
                <Ionicons 
                  name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color="#555" 
                />
              </TouchableOpacity>
            </View>

            {/* Address Fields */}
            <View style={styles.addressContainer}>
              <Text style={styles.sectionTitle}>Address Information</Text>
              
              <View style={styles.inputContainer}>
                <Ionicons 
                  name="location-outline" 
                  size={20} 
                  color="#555" 
                  style={styles.inputIcon}
                  accessible={false}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Street Address"
                  value={formData.address.street}
                  onChangeText={(value) => setFormData(prev => ({
                    ...prev,
                    address: { ...prev.address, street: value }
                  }))}
                  autoCapitalize="words"
                  autoCorrect={false}
                  accessible={true}
                  accessibilityLabel="Street address input field"
                  accessibilityHint="Enter your street address"
                  returnKeyType="next"
                />
              </View>

              <View style={styles.rowContainer}>
                <View style={[styles.inputContainer, styles.halfWidth]}>
                  <Ionicons 
                    name="business-outline" 
                    size={20} 
                    color="#555" 
                    style={styles.inputIcon}
                    accessible={false}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="City"
                    value={formData.address.city}
                    onChangeText={(value) => setFormData(prev => ({
                      ...prev,
                      address: { ...prev.address, city: value }
                    }))}
                    autoCapitalize="words"
                    autoCorrect={false}
                    accessible={true}
                    accessibilityLabel="City input field"
                    accessibilityHint="Enter your city"
                    returnKeyType="next"
                  />
                </View>

                <View style={[styles.inputContainer, styles.halfWidth]}>
                  <Ionicons 
                    name="mail-outline" 
                    size={20} 
                    color="#555" 
                    style={styles.inputIcon}
                    accessible={false}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Postal Code"
                    value={formData.address.postalCode}
                    onChangeText={(value) => setFormData(prev => ({
                      ...prev,
                      address: { ...prev.address, postalCode: value }
                    }))}
                    keyboardType="numeric"
                    autoCapitalize="none"
                    autoCorrect={false}
                    accessible={true}
                    accessibilityLabel="Postal code input field"
                    accessibilityHint="Enter your postal code"
                    returnKeyType="done"
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Ionicons 
                  name="flag-outline" 
                  size={20} 
                  color="#555" 
                  style={styles.inputIcon}
                  accessible={false}
                />
                <TextInput
                  style={styles.input}
                  placeholder="State"
                  value={formData.address.state}
                  onChangeText={(value) => setFormData(prev => ({
                    ...prev,
                    address: { ...prev.address, state: value }
                  }))}
                  autoCapitalize="words"
                  autoCorrect={false}
                  accessible={true}
                  accessibilityLabel="State input field"
                  accessibilityHint="Enter your state"
                  returnKeyType="next"
                />
              </View>
            </View>

            {/* Register Button */}
            <TouchableOpacity 
              style={[styles.registerButton, loading && styles.registerButtonDisabled]}
              onPress={handleEmailRegister}
              disabled={loading}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={loading ? "Creating account, please wait" : "Create account"}
              accessibilityHint="Tap to create your account"
              accessibilityState={{ disabled: loading }}
            >
              <Ionicons 
                name="person-add-outline" 
                size={20} 
                color="white"
                style={styles.buttonIcon}
              />
              <Text style={styles.registerButtonText}>
                {loading ? t('common.loading') : 'Create Account'}
              </Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Sign-in Button */}
            <TouchableOpacity 
              style={styles.googleButton}
              onPress={handleGoogleRegister}
              disabled={loading}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Sign up with Google"
              accessibilityHint="Tap to create your account using Google"
              accessibilityState={{ disabled: loading }}
            >
              <Ionicons name="logo-google" size={20} color="#DB4437" />
              <Text style={styles.googleButtonText}>Sign up with Google</Text>
            </TouchableOpacity>


            {/* Terms & Conditions */}
            <View 
              style={styles.termsContainer}
              accessible={true}
              accessibilityRole="text"
              accessibilityLabel="By creating an account, you agree to our Terms and Conditions"
            >
              <Text style={styles.termsText}>By creating an account, you agree to our </Text>
              <TouchableOpacity 
                onPress={handleTermsPress}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Terms and Conditions"
                accessibilityHint="Tap to view terms and conditions"
              >
                <Text style={styles.termsLink}>Terms & Conditions</Text>
              </TouchableOpacity>
              <Text style={styles.termsText}>.</Text>
            </View>

            {/* Login Link */}
            <View 
              style={styles.loginContainer}
              accessible={true}
              accessibilityRole="text"
              accessibilityLabel="Already have an account? Sign in here"
            >
              <Text style={styles.loginText}>{t('auth.hasAccount')} </Text>
              <TouchableOpacity 
                onPress={() => navigation.navigate('Login' as never)}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Sign in to existing account"
                accessibilityHint="Tap to go to login screen"
              >
                <Text style={styles.loginLink}>{t('auth.signIn')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f7f0',
    borderBottomWidth: 0,
  },
  keyboardView: {
    flex: 1,
    borderBottomWidth: 0,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
    borderBottomWidth: 0,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 4,
    marginTop: 4,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginTop: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 2,
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    width: '100%',
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#ffffff',
    height: 56,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 0,
    paddingLeft: 12,
    fontSize: 16,
    color: '#333',
    height: '100%',
  },
  eyeIcon: {
    padding: 5,
  },
  registerButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    height: 56,
  },
  registerButtonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  registerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  buttonIcon: {
    marginRight: 4,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#666',
    fontSize: 14,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#dadce0',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    height: 56,
  },
  googleButtonText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#3c4043',
    fontWeight: '500',
  },
  // Method Selection Styles
  methodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  methodButtonText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },

  backToLoginText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#2E7D32',
    fontWeight: '500',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingVertical: 8,
  },
  backButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#2E7D32',
    fontWeight: '500',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  loginText: {
    color: '#424242',
    fontSize: 14,
  },
  loginLink: {
    color: '#1B5E20',
    fontWeight: 'bold',
  },
  termsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5,
    marginBottom: 10,
    paddingHorizontal: 20,
    flexWrap: 'wrap',
  },
  termsText: {
    fontSize: 12,
    color: '#424242',
    textAlign: 'center',
  },
  termsLink: {
    fontSize: 12,
    color: '#1B5E20',
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  // Registration type selection styles
  registrationTypeContainer: {
    marginBottom: 20,
  },
  registrationTypeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
  },
  registrationTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  registrationTypeTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  registrationTypeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  registrationTypeSubtext: {
    fontSize: 12,
    color: '#666',
  },
  backToTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 15,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backToTypeText: {
    marginLeft: 5,
    color: '#666',
    fontSize: 14,
  },
  // Tab styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    height: 48,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    height: 40,
  },
  tabButtonActive: {
    backgroundColor: '#2E7D32',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  tabButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  // Address section styles
  addressContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    textAlign: 'left',
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
});

export default RegisterScreen;
