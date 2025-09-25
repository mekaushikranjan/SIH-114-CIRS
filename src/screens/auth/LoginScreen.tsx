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
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { loginSuccess } from '../../store/slices/authSlice';
import { updatePreferences } from '../../store/slices/userSlice';
import i18n from '../../i18n';
import { tokenStorage } from '../../utils/tokenStorage';
import { apiService, saveAuthToken } from '../../services/apiService';
import { signInWithGoogle } from '../../services/firebaseAuth';
import { ENABLE_MOCK_AUTH, isMockUser } from '../../config/mockAuth';
import LoadingScreen from '../../components/LoadingScreen';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
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

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t('common.error'), t('auth.fillAllFields'));
      return;
    }

    setLoading(true);
    
    try {
      // Check if mock authentication is enabled and user is a mock user
      const shouldUseMockAuth = ENABLE_MOCK_AUTH && isMockUser(email);
      
      const loginRes = shouldUseMockAuth 
        ? await apiService.mockLogin(email, password)
        : await apiService.login(email, password);

      if (!loginRes.success || !loginRes.data) {
        setLoading(false);
        Alert.alert(
          t('common.error'), 
          shouldUseMockAuth 
            ? 'Mock login failed. Check your credentials.'
            : t('auth.loginFailed')
        );
        return;
      }
      
      await saveAuthToken(loginRes.data.token);

      const userData = {
        id: loginRes.data.user.id,
        name: loginRes.data.user.name || loginRes.data.user.fullName || '',
        email: loginRes.data.user.email,
        phone: loginRes.data.user.phone || loginRes.data.user.phoneNumber || '',
        role: (() => {
          const userRole = (loginRes.data.user.role || '').toUpperCase();
          if (userRole === 'ADMIN') return 'admin' as const;
          if (userRole === 'GROUND_WORKER' || userRole === 'DEPARTMENT_HEAD' || userRole === 'GROUNDWORKER') return 'worker' as const;
          return 'citizen' as const;
        })(),
      };
      const token = loginRes.data.token;
      
      // Store token and user data
      await tokenStorage.storeAuthData(token, userData);
      
      dispatch(loginSuccess({
        user: userData,
        token: token,
      }));
      
    } catch (error: any) {
      console.error('Login error:', error);

      // Final fallback for user123
      if ((email === 'user123' || email === 'user123@example.com') && password === 'user') {
        try {
          const userData = {
            id: 'user123',
            name: 'User 123',
            email: email,
            phone: '',
            role: 'citizen' as 'citizen' | 'admin' | 'worker',
          };
          const token = 'mock-token-user123';

          await tokenStorage.storeAuthData(token, userData);
          dispatch(loginSuccess({ user: userData, token }));
          return;
        } catch (fallbackError) {
          console.error('Fallback login error:', fallbackError);
        }
      }

      const errorMessage = error?.message || 'Login failed. Please check your credentials and try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      console.log('[LoginScreen] Starting Firebase Google Sign-In...');
      
      // Use pure Firebase Google Sign-In
      const user = await signInWithGoogle();
      if (!user) return;

      console.log('[LoginScreen] Google Sign-In successful, getting ID token...');
      const idToken = await user.getIdToken();
      const res = await apiService.loginWithGoogle(idToken);

      if (res.success && res.data) {
        await saveAuthToken(res.data.token);

        const userData = {
          id: res.data.user.id,
          name: res.data.user.fullName || res.data.user.name || '',
          email: res.data.user.email,
          phone: res.data.user.phoneNumber || res.data.user.phone || '',
          role: mapRole(res.data.user.role || 'CITIZEN') as 'citizen' | 'admin' | 'worker',
        };
        await tokenStorage.storeAuthData(res.data.token, userData);
        dispatch(loginSuccess({ user: userData, token: res.data.token }));
      }
    } catch (error: any) {
      console.error('Google login error:', error);
      Alert.alert('Error', error.message || 'Google login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword' as never);
  };

  const handleTermsPress = () => {
    (navigation as any).navigate('TermsOfService');
  };

  const handleLanguageChange = () => {
    Alert.alert(
      t('profile.selectLanguage'),
      t('profile.chooseLanguage'),
      [
        { text: 'English', onPress: () => updateLanguage('en') },
        { text: 'हिंदी', onPress: () => updateLanguage('hi') },
        { text: 'বাংলা', onPress: () => updateLanguage('bn') },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  const updateLanguage = async (language: 'en' | 'hi' | 'bn') => {
    try {
      await i18n.changeLanguage(language);
      dispatch(updatePreferences({ language }));
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };


  // Show loading screen when loading
  if (loading) {
    return <LoadingScreen type="login" message="Signing you in..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="#f0f7f0" 
        translucent={false}
      />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
        keyboardVerticalOffset={0}
      >
        <ScrollView 
          contentContainerStyle={[styles.scrollContent, {
            paddingHorizontal: isTablet ? screenWidth * 0.15 : isSmallPhone ? 15 : 20,
            paddingTop: isLandscape ? 10 : 20,
            paddingBottom: isLandscape ? 10 : 20,
          }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          contentInsetAdjustmentBehavior="never"
          keyboardDismissMode="interactive"
          scrollEventThrottle={16}
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
              style={[styles.title, {
                fontSize: isTablet ? 28 : isSmallPhone ? 20 : 24,
              }]}
              accessible={true}
              accessibilityRole="header"
              accessibilityLabel="Civic Issue Reporter - Main application title"
            >
              Civic Issue Reporter
            </Text>
            <Text 
              style={[styles.subtitle, {
                fontSize: isTablet ? 18 : isSmallPhone ? 14 : 16,
              }]}
              accessible={true}
              accessibilityLabel="Government of Jharkhand"
            >
              Government of Jharkhand
            </Text>
          </View>

          {/* Login Form */}
          <View style={styles.formContainer}>
            <Text 
              style={[styles.formTitle, {
                fontSize: isTablet ? 22 : isSmallPhone ? 18 : 20,
              }]}
              accessible={true}
              accessibilityRole="header"
              accessibilityLabel="Welcome back - Login form"
            >
              {t('auth.welcome')}
            </Text>
            
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
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                accessible={true}
                accessibilityLabel="Email address input field"
                accessibilityHint="Enter your email address to login"
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => {
                  // Focus next input (password)
                }}
              />
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
                placeholder={t('auth.password')}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                accessible={true}
                accessibilityLabel="Password input field"
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

            <TouchableOpacity 
              onPress={handleForgotPassword}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Forgot password"
              accessibilityHint="Tap to reset your password"
            >
              <Text style={styles.forgotPassword}>{t('auth.forgotPassword')}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={loading ? "Logging in, please wait" : "Login button"}
              accessibilityHint="Tap to login with your email and password"
              accessibilityState={{ disabled: loading }}
            >
              <Ionicons 
                name="log-in-outline" 
                size={20} 
                color="white"
                style={styles.buttonIcon}
              />
              <Text style={styles.loginButtonText}>
                {loading ? t('common.loading') : 'Login'}
              </Text>
            </TouchableOpacity>

            {/* OAuth Buttons */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{t('common.or')}</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity 
              style={styles.googleButton} 
              onPress={handleGoogleLogin}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Continue with Google"
              accessibilityHint="Tap to login using your Google account"
            >
              <Ionicons 
                name="logo-google" 
                size={20} 
                color="#DB4437"
                accessible={false}
              />
              <Text style={styles.googleButtonText}>{t('auth.continueWithGoogle')}</Text>
            </TouchableOpacity>

            {/* Terms & Conditions */}
            <View 
              style={styles.termsContainer}
              accessible={true}
              accessibilityRole="text"
              accessibilityLabel="By logging in, you agree to our Terms and Conditions"
            >
              <Text style={styles.termsText}>By logging in, you agree to our </Text>
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

            {/* Register Link */}
            <View 
              style={styles.registerContainer}
              accessible={true}
              accessibilityRole="text"
              accessibilityLabel="Don't have an account? Register here"
            >
              <Text style={styles.registerText}>{t('auth.noAccount')} </Text>
              <TouchableOpacity 
                onPress={() => navigation.navigate('Register' as never)}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Register for new account"
                accessibilityHint="Tap to create a new account"
              >
                <Text style={styles.registerLink}>{t('auth.register')}</Text>
              </TouchableOpacity>
            </View>

            {/* Language Switcher - Footer */}
            <View style={styles.langFooterContainer}>
              <TouchableOpacity
                onPress={handleLanguageChange}
                style={styles.langFooterButton}
                accessibilityRole="button"
                accessibilityLabel="Change language"
                accessibilityHint="Opens language selection"
              >
                <Ionicons name="language-outline" size={18} color="#2E7D32" />
                <Text style={styles.langFooterText}>Change Language</Text>
                <View style={styles.langCodeBadge}>
                  <Text style={styles.langCodeText}>{(i18n.language || 'en').toUpperCase()}</Text>
                </View>
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
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    minHeight: '100%',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 25,
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
  langFooterContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  langFooterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#C8E6C9',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  langFooterText: {
    marginLeft: 8,
    color: '#2E7D32',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  langCodeBadge: {
    marginLeft: 8,
    backgroundColor: '#E8F5E9',
    borderColor: '#C8E6C9',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  langCodeText: {
    color: '#2E7D32',
    fontWeight: '700',
    fontSize: 11,
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
    marginTop: -8,
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
  forgotPassword: {
    color: '#1B5E20',
    textAlign: 'right',
    marginBottom: 20,
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    height: 56,
  },
  loginButtonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  loginButtonText: {
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
    marginBottom: 20,
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
    marginBottom: 15,
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
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  registerText: {
    color: '#424242',
    fontSize: 14,
  },
  registerLink: {
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
});

export default LoginScreen;
