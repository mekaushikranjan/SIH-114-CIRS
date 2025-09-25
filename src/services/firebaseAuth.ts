import { firebaseAuth } from './firebase';
import {
	onAuthStateChanged,
	onIdTokenChanged,
	signOut,
	signInWithEmailAndPassword,
	createUserWithEmailAndPassword,
	signInWithPhoneNumber,
	signInWithCredential,
	GoogleAuthProvider,
	RecaptchaVerifier,
	ConfirmationResult,
	sendEmailVerification,
	applyActionCode,
	reload,
} from 'firebase/auth';
import { Platform, Alert } from 'react-native';
import type { User } from 'firebase/auth';

export function subscribeAuth(callback: (user: any) => void) {
	return onAuthStateChanged(firebaseAuth, callback);
}

export function subscribeIdToken(callback: (token: string | null) => void) {
	return onIdTokenChanged(firebaseAuth, (user) => {
		if (user) {
			user.getIdToken().then(callback);
		} else {
			callback(null);
		}
	});
}

export async function logout() {
	return signOut(firebaseAuth);
}

export async function login(email: string, password: string) {
	const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
	return userCredential.user;
}

export async function register(email: string, password: string) {
	const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
	return userCredential.user;
}

// Phone Authentication with Invisible reCAPTCHA
export async function signInWithPhone(phoneNumber: string): Promise<ConfirmationResult> {
	// Create a reCAPTCHA verifier
	const recaptchaVerifier = new RecaptchaVerifier('recaptcha-container', {
		size: 'invisible',
		callback: (response: any) => {
			console.log('reCAPTCHA resolved');
		}
	}, firebaseAuth);

	const confirmationResult = await signInWithPhoneNumber(firebaseAuth, phoneNumber, recaptchaVerifier);
	return confirmationResult;
}

export async function phoneConfirmCode(confirmation: ConfirmationResult, code: string) {
	const cred = await confirmation.confirm(code);
	return cred.user;
}

// Google Sign-In using Firebase Web SDK (Expo Compatible)
export async function signInWithGoogle(): Promise<User> {
	try {
		console.log('[Firebase Google Auth] Starting Firebase Web SDK Google Sign-In...');
		
		// For Expo managed workflow, we'll use a simple approach
		// This will show an alert explaining the limitation
		Alert.alert(
			'Google Sign-In',
			'Google Sign-In requires additional configuration for Expo managed workflow.\n\n' +
			'For now, please use:\n' +
			'• Email/Password authentication\n' +
			'• Phone number authentication\n\n' +
			'To enable Google Sign-In, you would need to:\n' +
			'1. Eject to bare React Native workflow, OR\n' +
			'2. Use Expo Development Build, OR\n' +
			'3. Configure Google OAuth in Google Console',
			[{ text: 'OK' }]
		);
		
		throw new Error('Google Sign-In requires additional configuration. Please use email/password or phone authentication.');
		
	} catch (error: any) {
		console.error('Firebase Google Sign-In error:', error);
		throw error;
	}
}

// Email verification functions
export async function sendEmailVerificationLink(user: any) {
	await sendEmailVerification(user);
}

export async function verifyEmailWithCode(oobCode: string) {
	await applyActionCode(firebaseAuth, oobCode);
}

export async function checkEmailVerified(user: any) {
	await reload(user);
	return user.emailVerified;
}

// Anonymous authentication (optional)
export async function signInAnonymously() {
	const { signInAnonymously } = await import('firebase/auth');
	const userCredential = await signInAnonymously(firebaseAuth);
	return userCredential.user;
}

// Password reset
export async function resetPassword(email: string) {
	const { sendPasswordResetEmail } = await import('firebase/auth');
	await sendPasswordResetEmail(firebaseAuth, email);
}

// Update user profile
export async function updateUserProfile(user: User, profile: { displayName?: string; photoURL?: string }) {
	const { updateProfile } = await import('firebase/auth');
	await updateProfile(user, profile);
}