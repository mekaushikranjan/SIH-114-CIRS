import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  SafeAreaView,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Voice from '@react-native-voice/voice';
import { apiService } from '../../services/apiService';
import uploadService from '../../services/uploadService';
import { MediaItem, Issue } from '../../types';
import { RootState } from '../../store/store';
import { addIssue } from '../../store/slices/issuesSlice';
import SuccessTickAnimation from '../../components/SuccessTickAnimation';

const { width } = Dimensions.get('window');

const ComplaintWizardScreen = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    subcategory: '',
    location: null as any,
    media: [] as MediaItem[],
  });
  const [loading, setLoading] = useState(false);
  const [isSubcategoryDropdownOpen, setIsSubcategoryDropdownOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingText, setRecordingText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { user, token } = useSelector((state: RootState) => state.auth);

  // Create a simple video component that doesn't use hooks in render
  const VideoComponent = ({ uri, style }: { uri: string; style: any }) => {
    const player = useVideoPlayer(uri, player => {
      player.loop = false;
      player.pause();
    });
    
    return <VideoView style={style} player={player} />;
  };

  // Initialize Voice recognition for native builds
  useEffect(() => {
    if (Voice && typeof Voice.start === 'function') {
      Voice.onSpeechStart = () => {
        setIsListening(true);
        setRecordingText('Listening...');
      };

      Voice.onSpeechEnd = () => {
        setIsListening(false);
        setIsRecording(false);
        setRecordingText('');
      };

      Voice.onSpeechResults = (event: any) => {
        const transcript = event.value[0];
        setFormData(prev => ({ 
          ...prev, 
          description: prev.description + (prev.description ? ' ' : '') + transcript 
        }));
        
        Alert.alert(
          t('complaint.voiceInputComplete'), 
          t('complaint.voiceInputCompleteDesc'),
          [{ text: t('common.ok') }]
        );
      };

      Voice.onSpeechError = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        setRecordingText('');
        
        Alert.alert(t('complaint.voiceRecognitionError'), 'Speech recognition failed. Please try again.', [{ text: t('common.ok') }]);
      };

      return () => {
        Voice.destroy().then(Voice.removeAllListeners);
      };
    }
  }, []);

  // Check if Voice is available (for development builds or web)
  const isVoiceAvailable = () => {
    try {
      // Check for Web Speech API (works in browsers)
      if (typeof window !== 'undefined' && 
          (('webkitSpeechRecognition' in window) || ('SpeechRecognition' in window))) {
        return true;
      }
      // Check for native Voice module (for physical app builds)
      if (Voice && typeof Voice.start === 'function') {
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Voice recording functions with fallback for Expo Go
  const startVoiceRecording = async () => {
    if (!isVoiceAvailable()) {
      // Fallback for Expo Go - show options
      Alert.alert(
        t('complaint.voiceRecognition'),
        'Choose an option:',
        [
          {
            text: t('complaint.useSampleText'),
            onPress: () => {
              setIsRecording(true);
              setRecordingText('Adding sample text...');
              
              setTimeout(() => {
                const sampleTexts = [
                  "There is a large pothole on Main Street that needs immediate attention. It's causing damage to vehicles and is dangerous for pedestrians.",
                  "The garbage bins in our area haven't been emptied for over a week. There's a bad smell and it's attracting pests.",
                  "The street lights on Park Avenue have been broken for several days. It's very dark and unsafe at night.",
                  "There's a water leak near the community center that's been going on for days. It's wasting water and creating a mess."
                ];
                
                const randomText = sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
                setFormData(prev => ({ 
                  ...prev, 
                  description: prev.description + (prev.description ? ' ' : '') + randomText 
                }));
                
                setIsRecording(false);
                setRecordingText('');
                
                Alert.alert(
                  t('complaint.sampleTextAdded'), 
                  t('complaint.sampleTextAddedDesc'),
                  [{ text: t('common.ok') }]
                );
              }, 1500);
            }
          },
          {
            text: t('complaint.buildAppForRealVoice'),
            onPress: () => {
              Alert.alert(
                t('complaint.developmentBuildRequired'),
                t('complaint.developmentBuildDesc'),
                [{ text: t('common.ok') }]
              );
            }
          },
          {
            text: t('common.cancel'),
            style: 'cancel'
          }
        ]
      );
      return;
    }

    // Real voice recognition (Web Speech API or native builds)
    try {
      setIsRecording(true);
      setRecordingText('Starting...');
      
      // Use Web Speech API if available
      if (typeof window !== 'undefined' && 
          (('webkitSpeechRecognition' in window) || ('SpeechRecognition' in window))) {
        
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          setRecordingText('Listening... Speak now');
        };

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          console.log('Speech recognition result:', transcript);
          
          setFormData(prev => ({ 
            ...prev, 
            description: prev.description + (prev.description ? ' ' : '') + transcript 
          }));
          
          setIsRecording(false);
          setRecordingText('');
          
          Alert.alert(
            t('complaint.voiceInputComplete'), 
            t('complaint.voiceInputCompleteDesc'),
            [{ text: t('common.ok') }]
          );
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsRecording(false);
          setRecordingText('');
          
          let errorMessage = 'Speech recognition failed. Please try again.';
          if (event.error === 'no-speech') {
            errorMessage = 'No speech detected. Please speak clearly and try again.';
          } else if (event.error === 'not-allowed') {
            errorMessage = 'Microphone access denied. Please allow microphone permission.';
          }
          
          Alert.alert(t('complaint.voiceRecognitionError'), errorMessage, [{ text: t('common.ok') }]);
        };

        recognition.onend = () => {
          setIsRecording(false);
          setRecordingText('');
        };

        recognition.start();
      } else if (Voice && typeof Voice.start === 'function') {
        // For native builds with react-native-voice
        await Voice.start('en-US');
      } else {
        throw new Error('Voice recognition not available');
      }
      
    } catch (error) {
      console.error('Error starting voice recognition:', error);
      setIsRecording(false);
      setRecordingText('');
      
      Alert.alert(
        t('complaint.voiceRecognitionError'),
        t('complaint.couldNotStartVoice'),
        [{ text: t('common.ok') }]
      );
    }
  };

  const stopVoiceRecording = async () => {
    setIsRecording(false);
    setRecordingText('');
  };

  const categories = [
    { name: 'Potholes', icon: 'construct-outline' },
    { name: 'Garbage', icon: 'trash-outline' },
    { name: 'Trash Bin', icon: 'trash-bin-outline' },
    { name: 'Sanitation', icon: 'water-outline' },
    { name: 'Street Lights', icon: 'bulb-outline' },
    { name: 'Water Supply', icon: 'water-outline' },
    { name: 'Drainage', icon: 'funnel-outline' },
  ];

  const subcategories: { [key: string]: string[] } = {
    'Potholes': [
      'Small surface cracks',
      'Shallow potholes (<3 inches)',
      'Deep potholes (>3 inches)',
      'Repeated/reopened potholes',
      'Manhole cover damage / missing',
      'Uneven road patching',
      'Shoulder erosion (roadside collapse)',
      'Others'
    ],
    'Garbage': [
      'Uncollected household waste',
      'Market/commercial waste',
      'Overflowing street corner dump',
      'Open waste burning',
      'Dead animals on road',
      'Bulk waste (construction/demolition debris)',
      'Hazardous waste (batteries, paint, e-waste)',
      'Others'
    ],
    'Trash Bin': [
      'Missing dustbin',
      'Damaged dustbin (broken/melted)',
      'Overflowing bin',
      'No regular collection from bin',
      'Illegal placement of bins',
      'Community bin vs individual bins issues',
      'Others'
    ],
    'Sanitation': [
      'Open defecation area',
      'Blocked public toilet',
      'Non-functional urinal',
      'Lack of water in public toilets',
      'Lack of maintenance/cleaning staff',
      'Bad odor from drains/toilets',
      'Lack of sanitary napkin disposal facility',
      'Others'
    ],
    'Street Lights': [
      'Light not working (completely fused)',
      'Flickering streetlight',
      'Dim/broken lamp',
      'Pole damage/leaning',
      'Electrical wire exposed',
      'Streetlight timing issue (ON in daytime, OFF at night)',
      'Missing streetlight in dark spot',
      'Others'
    ],
    'Water Supply': [
      'No water supply in area',
      'Low water pressure',
      'Irregular timings of supply',
      'Dirty/contaminated water',
      'Broken/missing water pipelines',
      'Leakage (continuous water wastage)',
      'Illegal water connections',
      'Others'
    ],
    'Drainage': [
      'Blocked drain (garbage/silt)',
      'Open drain (uncovered, safety risk)',
      'Broken/overflowing manhole',
      'Waterlogging after rain',
      'Bad odor from drains',
      'Stagnant water causing mosquito breeding',
      'Broken stormwater drain cover',
      'Others'
    ],
  };

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
    
    console.log('Permission statuses:', { cameraStatus, mediaStatus, locationStatus });
    
    if (cameraStatus !== 'granted' || mediaStatus !== 'granted' || locationStatus !== 'granted') {
      Alert.alert(
        'Permissions Required', 
        'Please grant camera, media, and location permissions to use this feature. Video recording requires camera and microphone access.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => console.log('Open settings') }
        ]
      );
    }
  };

  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      const location = await Location.getCurrentPositionAsync({});
      const address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      
      const formattedAddress = address[0] ? 
        [
          address[0].streetNumber,
          address[0].name || address[0].street,
          address[0].subregion,
          address[0].city,
          address[0].region
        ].filter(Boolean).join(', ') : 
        'Unknown location';
      
      setFormData(prev => ({
        ...prev,
        location: {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
          address: formattedAddress,
        },
      }));
      setLoading(false);
    } catch (error) {
      setLoading(false);
      Alert.alert(t('common.error'), t('complaint.couldNotGetLocation'));
    }
  };

  const takeVideo = async () => {
    try {
      console.log('Starting video recording...');
      
      // Check permissions first
      const { status: cameraStatus } = await ImagePicker.getCameraPermissionsAsync();
      const { status: mediaStatus } = await ImagePicker.getMediaLibraryPermissionsAsync();
      
      console.log('Camera permission status:', cameraStatus);
      console.log('Media permission status:', mediaStatus);
      
      if (cameraStatus !== 'granted') {
        const { status: newCameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
        if (newCameraStatus !== 'granted') {
          Alert.alert(t('complaint.permissionRequired'), t('complaint.cameraPermissionMsg'));
          return;
        }
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.8,
        videoMaxDuration: 60, // 60 seconds max
      });

      console.log('Video recording result:', result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        console.log('Video recorded successfully:', result.assets[0]);
        
        // Get current location when taking video
        let currentLocation = formData.location;
        if (!currentLocation) {
          try {
            console.log('Getting location for video...');
            const location = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });
            const address = await Location.reverseGeocodeAsync({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            });
            
            const formattedAddress = address[0] ? 
              [
                address[0].streetNumber,
                address[0].name || address[0].street,
                address[0].subregion,
                address[0].city,
                address[0].region
              ].filter(Boolean).join(', ') : 
              'Unknown location';
            
            currentLocation = {
              lat: location.coords.latitude,
              lng: location.coords.longitude,
              address: formattedAddress,
            };
            console.log('Location captured for video:', currentLocation);
          } catch (error) {
            console.log('Could not get location for video:', error);
          }
        }

        const videoAsset = result.assets[0];
        setFormData(prev => ({
          ...prev,
          location: currentLocation || prev.location,
          media: [...prev.media, {
            uri: videoAsset.uri,
            type: 'video',
            duration: videoAsset.duration || 0,
            width: videoAsset.width || 0,
            height: videoAsset.height || 0,
          }],
        }));

        if (currentLocation && !formData.location) {
          Alert.alert(t('complaint.locationCaptured'), t('complaint.locationCapturedDesc'));
        }
        
        Alert.alert(t('common.success'), t('complaint.videoSuccess'));
      } else {
        console.log('Video recording was canceled or failed');
      }
    } catch (error) {
      console.error('Error recording video:', error);
      Alert.alert('Error', `Could not record video: ${(error as Error).message || 'Please try again.'}`);
    }
  };

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        // Automatically get current location when taking photo
        let currentLocation = formData.location;
        if (!currentLocation) {
          try {
            const location = await Location.getCurrentPositionAsync({});
            const address = await Location.reverseGeocodeAsync({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            });
            
            const formattedAddress = address[0] ? 
              [
                address[0].streetNumber,
                address[0].name || address[0].street,
                address[0].subregion,
                address[0].city,
                address[0].region
              ].filter(Boolean).join(', ') : 
              'Unknown location';
            
            currentLocation = {
              lat: location.coords.latitude,
              lng: location.coords.longitude,
              address: formattedAddress,
            };
          } catch (error) {
            console.log('Could not get location for photo:', error);
          }
        }

        setFormData(prev => ({
          ...prev,
          location: currentLocation || prev.location,
          media: [...prev.media, {
            uri: result.assets[0].uri,
            type: 'image'
          }],
        }));

        if (currentLocation && !formData.location) {
          Alert.alert(t('complaint.locationCaptured'), t('complaint.locationCapturedDesc'));
        }
      }
    } catch (error) {
      Alert.alert(t('common.error'), 'Could not take photo. Please try again.');
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      media: prev.media.filter((_, i) => i !== index),
    }));
  };

  const nextStep = () => {
    if (currentStep === 1) {
      if (!formData.title || !formData.category || !formData.subcategory || !formData.description) {
        Alert.alert(t('common.error'), t('complaint.fillAllFields'));
        return;
      }
    }
    if (currentStep === 2) {
      if (!formData.location) {
        Alert.alert(t('common.error'), t('complaint.addLocation'));
        return;
      }
    }
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      let uploadedMediaUrls: string[] = [];
      let uploadedImageUrls: string[] = [];
      let uploadedVideoUrls: string[] = [];

      // First, upload media to Cloudinary if there are any media files
      if (formData.media.length > 0) {
        console.log('Uploading media to Cloudinary...');
        
        const mediaFiles = formData.media.map((mediaItem, index) => ({
          uri: mediaItem.uri,
          type: mediaItem.type === 'image' ? 'image/jpeg' : 'video/mp4',
          name: mediaItem.type === 'image' ? `image_${index}.jpg` : `video_${index}.mp4`
        }));

        const uploadResponse = await uploadService.uploadIssueMedia(mediaFiles);
        
        if (uploadResponse.success && uploadResponse.data) {
          uploadedMediaUrls = uploadResponse.data.uploadedMedia.map(media => media.url);
          uploadedImageUrls = uploadResponse.data.images.map(img => img.url);
          uploadedVideoUrls = uploadResponse.data.videos.map(vid => vid.url);
          
          console.log('Media uploaded successfully:', {
            totalFiles: uploadResponse.data.totalFiles,
            images: uploadedImageUrls.length,
            videos: uploadedVideoUrls.length
          });
        } else {
          throw new Error(uploadResponse.error?.message || 'Failed to upload media');
        }
      }

      // Prepare form data for API submission with Cloudinary URLs
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('category', formData.category);
      if (formData.subcategory) {
        formDataToSend.append('subcategory', formData.subcategory);
      }
      
      // Add location data
      if (formData.location) {
        formDataToSend.append('address', formData.location.address || '');
        formDataToSend.append('latitude', formData.location.lat?.toString() || '');
        formDataToSend.append('longitude', formData.location.lng?.toString() || '');
      }

      // Add Cloudinary URLs instead of files
      uploadedImageUrls.forEach(url => {
        formDataToSend.append('imageUrls', url);
      });
      
      uploadedVideoUrls.forEach(url => {
        formDataToSend.append('videoUrls', url);
      });

      console.log('Submitting issue with data:', {
        title: formData.title,
        category: formData.category,
        subcategory: formData.subcategory,
        location: formData.location,
        mediaCount: formData.media.length,
        cloudinaryUrls: uploadedMediaUrls.length
      });

      // Submit to API
      const response = await apiService.reportIssue(formDataToSend);
      
      if (response.success) {
        // Show success animation
        setShowSuccessAnimation(true);
      } else {
        throw new Error(response.error?.message || 'Failed to submit issue');
      }
    } catch (error) {
      console.error('Error submitting issue:', error);
      
      // Fallback: Save locally if API fails
      const newIssue: Issue = {
        id: Date.now().toString(),
        title: formData.title,
        description: formData.description,
        category: formData.category,
        location: {
          lat: formData.location?.lat || 0,
          lng: formData.location?.lng || 0,
          address: formData.location?.address || '',
        },
        media: formData.media,
        status: 'pending' as const,
        upvotes: 0,
        submittedBy: user?.id || 'unknown',
        submittedAt: new Date().toISOString(),
        department: 'Public Works', // Default department
        priority: 'medium' as const,
      };

      dispatch(addIssue(newIssue));
      
      Alert.alert(
        'Saved Locally',
        'Issue saved locally. Will sync when connection is available.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } finally {
      setLoading(false);
    }
  };

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBar}>
        {[1, 2, 3].map((step) => (
          <View key={step} style={styles.progressStepContainer}>
            <View style={[
              styles.progressStep,
              currentStep >= step ? styles.progressStepActive : styles.progressStepInactive
            ]}>
              <Text style={[
                styles.progressStepText,
                currentStep >= step ? styles.progressStepTextActive : styles.progressStepTextInactive
              ]}>
                {step}
              </Text>
            </View>
            {step < 3 && (
              <View style={[
                styles.progressLine,
                currentStep > step ? styles.progressLineActive : styles.progressLineInactive
              ]} />
            )}
          </View>
        ))}
      </View>
      <View style={styles.progressLabels}>
        <Text style={[styles.progressLabel, currentStep === 1 && styles.progressLabelActive]}>
          {t('complaint.step1')}
        </Text>
        <Text style={[styles.progressLabel, currentStep === 2 && styles.progressLabelActive]}>
          {t('complaint.step2')}
        </Text>
        <Text style={[styles.progressLabel, currentStep === 3 && styles.progressLabelActive]}>
          {t('complaint.step3')}
        </Text>
      </View>
    </View>
  );

  const renderStep1 = () => (
    <View>
      <Text style={styles.stepTitle}>Step 1: {t('complaint.step1')}</Text>
      
      <View style={styles.section}>
        <Text style={styles.label}>{t('complaint.title')} *</Text>
        <TextInput
          style={styles.input}
          placeholder={t('complaint.titlePlaceholder')}
          value={formData.title}
          onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>{t('complaint.category')} *</Text>
        <Text style={styles.sectionHint}>{t('complaint.selectCategory')}</Text>
        <View style={styles.categoryVerticalContainer}>
          {categories.map((category, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.categoryVerticalItem,
                formData.category === category.name && styles.categoryVerticalItemSelected,
              ]}
              onPress={() => {
                setFormData(prev => ({ ...prev, category: category.name, subcategory: '' }));
              }}
              activeOpacity={0.8}
            >
              <View style={styles.categoryVerticalIconContainer}>
                <Ionicons 
                  name={category.icon as any} 
                  size={24} 
                  color={formData.category === category.name ? "#FFFFFF" : "#2E7D32"} 
                />
              </View>
              <Text
                style={[
                  styles.categoryVerticalText,
                  formData.category === category.name && styles.categoryVerticalTextSelected,
                ]}
              >
                {t(`complaint.categories.${category.name}`)}
              </Text>
              {formData.category === category.name && (
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {formData.category && (
        <View style={styles.section}>
          <Text style={styles.label}>{t('complaint.subcategory')} *</Text>
          <Text style={styles.sectionHint}>Choose the specific type of {formData.category.toLowerCase()} issue</Text>
          
          {/* Dropdown Button */}
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setIsSubcategoryDropdownOpen(!isSubcategoryDropdownOpen)}
            activeOpacity={0.7}
          >
            <Text style={styles.dropdownButtonText}>
              {formData.subcategory ? t(`complaint.subcategories.${formData.subcategory}`) : t('complaint.selectSubcategory')}
            </Text>
            <Ionicons 
              name={isSubcategoryDropdownOpen ? "chevron-up" : "chevron-down"} 
              size={20} 
              color="#2E7D32" 
            />
          </TouchableOpacity>

          {/* Dropdown List */}
          {isSubcategoryDropdownOpen && (
            <View style={styles.dropdownList}>
              <ScrollView 
                style={styles.dropdownScrollView}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={true}
                bounces={false}
              >
                {subcategories[formData.category]?.map((subcategory, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dropdownItem,
                      formData.subcategory === subcategory && styles.dropdownItemSelected,
                      index === subcategories[formData.category].length - 1 && styles.dropdownItemLast,
                    ]}
                    onPress={() => {
                      setFormData(prev => ({ ...prev, subcategory }));
                      setIsSubcategoryDropdownOpen(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        formData.subcategory === subcategory && styles.dropdownItemTextSelected,
                      ]}
                    >
                      {t(`complaint.subcategories.${subcategory}`)}
                    </Text>
                    {subcategory === 'Others' && (
                      <Ionicons name="add-circle-outline" size={16} color={formData.subcategory === subcategory ? "white" : "#2E7D32"} />
                    )}
                    {formData.subcategory === subcategory && (
                      <Ionicons name="checkmark" size={16} color="#4CAF50" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.label}>{t('complaint.description')} *</Text>
        <Text style={styles.sectionHint}>
          Type your description or use the microphone to speak
        </Text>
        <View style={styles.descriptionContainer}>
          <TextInput
            style={[styles.input, styles.textArea, styles.textAreaWithMic]}
            placeholder={t('complaint.descriptionPlaceholder')}
            value={formData.description}
            onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
            multiline
            numberOfLines={4}
          />
          <TouchableOpacity
            style={[
              styles.microphoneButton,
              isRecording && styles.microphoneButtonActive
            ]}
            onPress={isRecording ? stopVoiceRecording : startVoiceRecording}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isRecording ? "stop" : "mic"}
              size={20}
              color={isRecording ? "#fff" : "#2E7D32"}
            />
          </TouchableOpacity>
        </View>
        {isRecording && (
          <View style={styles.recordingIndicator}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>{recordingText}</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View>
      <Text style={styles.stepTitle}>Step 2: {t('complaint.step2')}</Text>
      
      <View style={styles.section}>
        <Text style={styles.label}>{t('complaint.location')} *</Text>
        {formData.location ? (
          <View style={styles.locationCard}>
            <Ionicons name="location" size={20} color="#2E7D32" />
            <Text style={styles.locationText}>{formData.location.address}</Text>
            <TouchableOpacity onPress={() => setFormData(prev => ({ ...prev, location: null }))}>
              <Ionicons name="close-circle" size={20} color="#f44336" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.locationButton} onPress={getCurrentLocation}>
            <Ionicons name="location-outline" size={20} color="#2E7D32" />
            <Text style={styles.locationButtonText}>
              {loading ? t('complaint.gettingLocation') : t('complaint.getCurrentLocation')}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Photos/Videos (Optional)</Text>
        
        {formData.media.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.mediaContainer}>
              {formData.media.map((mediaItem: MediaItem, index) => (
                <View key={index} style={styles.mediaItem}>
                  {mediaItem.type === 'image' ? (
                    <Image source={{ uri: mediaItem.uri }} style={styles.mediaImage} />
                  ) : (
                    <View style={styles.videoContainer}>
                      <VideoComponent 
                        uri={mediaItem.uri} 
                        style={styles.mediaImage}
                      />
                      <View style={styles.videoOverlay}>
                        <Ionicons name="play-circle" size={20} color="white" />
                      </View>
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.removeMediaButton}
                    onPress={() => removeImage(index)}
                  >
                    <Ionicons name="close-circle" size={20} color="#f44336" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </ScrollView>
        )}

        <View style={styles.mediaButtonsGrid}>
          <TouchableOpacity style={styles.mediaButton} onPress={takePhoto}>
            <Ionicons name="camera-outline" size={20} color="#2E7D32" />
            <Text style={styles.mediaButtonText}>{t('complaint.takePhoto')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.mediaButton} onPress={takeVideo}>
            <Ionicons name="videocam-outline" size={20} color="#2E7D32" />
            <Text style={styles.mediaButtonText}>{t('complaint.recordVideo')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View>
      <Text style={styles.stepTitle}>Step 3: {t('complaint.step3')}</Text>
      
      <View style={styles.reviewCard}>
        <Text style={styles.reviewLabel}>{t('complaint.title')}</Text>
        <Text style={styles.reviewValue}>{formData.title}</Text>
      </View>

      <View style={styles.reviewCard}>
        <Text style={styles.reviewLabel}>{t('complaint.category')}</Text>
        <Text style={styles.reviewValue}>{t(`complaint.categories.${formData.category}`)} - {formData.subcategory ? t(`complaint.subcategories.${formData.subcategory}`) : ''}</Text>
      </View>

      <View style={styles.reviewCard}>
        <Text style={styles.reviewLabel}>{t('complaint.description')}</Text>
        <Text style={styles.reviewValue}>{formData.description}</Text>
      </View>

      <View style={styles.reviewCard}>
        <Text style={styles.reviewLabel}>{t('complaint.location')}</Text>
        <Text style={styles.reviewValue}>{formData.location?.address}</Text>
      </View>

      {formData.media.length > 0 && (
        <View style={styles.reviewCard}>
          <Text style={styles.reviewLabel}>Media ({formData.media.length} files)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.mediaContainer}>
              {formData.media.map((mediaItem: MediaItem, index) => (
                <View key={index} style={styles.mediaItem}>
                  {mediaItem.type === 'image' ? (
                    <Image source={{ uri: mediaItem.uri }} style={styles.reviewMediaImage} />
                  ) : (
                    <View style={styles.videoContainer}>
                      <VideoComponent 
                        uri={mediaItem.uri} 
                        style={styles.reviewMediaImage}
                      />
                      <View style={styles.videoOverlay}>
                        <Ionicons name="play-circle" size={20} color="white" />
                      </View>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      )}
    </View>
  );

  const renderNavigationButtons = () => (
    <View style={styles.navigationContainer}>
      {currentStep > 1 && (
        <TouchableOpacity style={styles.backButton} onPress={prevStep}>
          <Ionicons name="arrow-back" size={20} color="#2E7D32" />
          <Text style={styles.backButtonText}>{t('common.back')}</Text>
        </TouchableOpacity>
      )}
      
      <View style={styles.spacer} />
      
      {currentStep < 3 ? (
        <TouchableOpacity style={styles.nextButton} onPress={nextStep}>
          <Text style={styles.nextButtonText}>{t('common.next')}</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? t('complaint.submitting') : t('complaint.submitIssue')}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {renderProgressBar()}
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {renderNavigationButtons()}
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Success Animation */}
      <SuccessTickAnimation
        visible={showSuccessAnimation}
        onClose={() => {
          setShowSuccessAnimation(false);
          navigation.goBack();
        }}
        message="Issue Submitted Successfully!"
        duration={5000}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  sectionHint: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  // Progress Bar Styles
  progressContainer: {
    backgroundColor: 'white',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  progressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  progressStepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressStep: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  progressStepActive: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  progressStepInactive: {
    backgroundColor: 'white',
    borderColor: '#ddd',
  },
  progressStepText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressStepTextActive: {
    color: 'white',
  },
  progressStepTextInactive: {
    color: '#999',
  },
  progressLine: {
    width: 40,
    height: 2,
    marginHorizontal: 10,
  },
  progressLineActive: {
    backgroundColor: '#2E7D32',
  },
  progressLineInactive: {
    backgroundColor: '#ddd',
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 12,
    color: '#666',
    flex: 1,
    textAlign: 'center',
  },
  progressLabelActive: {
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  // Category Styles
  categoryScrollView: {
    marginBottom: 5,
  },
  categoryContainer: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 5,
  },
  categoryEmojiContainer: {
    backgroundColor: 'rgba(46, 125, 50, 0.1)',
    borderRadius: 15,
    padding: 4,
    marginRight: 6,
  },
  categoryChip: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#E8F5E8',
    borderRadius: 25,
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginRight: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoryChipSelected: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
    elevation: 6,
    shadowOpacity: 0.25,
  },
  categoryChipText: {
    color: '#2E7D32',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  categoryChipTextSelected: {
    color: 'white',
    fontWeight: 'bold',
  },
  subcategoryScrollContainer: {
    maxHeight: 120,
    marginVertical: 8,
  },
  subcategoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: 8,
    gap: 8,
  },
  subcategoryChip: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1.5,
    borderColor: '#E3F2FD',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 6,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    minWidth: 80,
    alignItems: 'center',
  },
  subcategoryChipSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
    elevation: 4,
    shadowOpacity: 0.2,
  },
  subcategoryChipText: {
    color: '#2E7D32',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 16,
  },
  subcategoryChipTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  // Dropdown Styles
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  dropdownList: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginTop: 4,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    maxHeight: 180,
    overflow: 'hidden',
  },
  dropdownScrollView: {
    maxHeight: 180,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownItemSelected: {
    backgroundColor: '#E8F5E9',
  },
  dropdownItemLast: {
    borderBottomWidth: 0,
  },
  dropdownItemText: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  dropdownItemTextSelected: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  othersIndicator: {
    marginLeft: 4,
  },
  // Location Styles
  locationCard: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  locationText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#333',
  },
  locationButton: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2E7D32',
  },
  locationButtonText: {
    marginLeft: 10,
    color: '#2E7D32',
    fontSize: 16,
    fontWeight: '600',
  },
  // Media Styles
  mediaContainer: {
    flexDirection: 'row',
    paddingVertical: 10,
  },
  mediaItem: {
    position: 'relative',
    marginRight: 10,
  },
  mediaImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },
  removeMediaButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'white',
    borderRadius: 10,
  },
  mediaButtonsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mediaButton: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '48%',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2E7D32',
    marginBottom: 10,
  },
  mediaButtonText: {
    marginLeft: 8,
    color: '#2E7D32',
    fontSize: 14,
    fontWeight: '600',
  },
  // Review Styles
  reviewCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#eee',
  },
  reviewLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 5,
  },
  reviewValue: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  reviewMediaImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 10,
  },
  // Video Styles
  videoContainer: {
    position: 'relative',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 10,
  },
  // Navigation Styles
  navigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginTop: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#2E7D32',
    borderRadius: 6,
  },
  backButtonText: {
    marginLeft: 6,
    color: '#2E7D32',
    fontSize: 14,
    fontWeight: '600',
  },
  spacer: {
    flex: 1,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2E7D32',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  nextButtonText: {
    marginRight: 6,
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // Vertical Category Styles
  categoryVerticalContainer: {
    marginBottom: 10,
  },
  categoryVerticalItem: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#E8F5E8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoryVerticalItemSelected: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
    elevation: 6,
    shadowOpacity: 0.25,
  },
  categoryVerticalIconContainer: {
    backgroundColor: 'rgba(46, 125, 50, 0.1)',
    borderRadius: 20,
    padding: 8,
    marginRight: 12,
  },
  categoryVerticalText: {
    color: '#2E7D32',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  categoryVerticalTextSelected: {
    color: 'white',
    fontWeight: 'bold',
  },
  // Voice Recording Styles
  descriptionContainer: {
    position: 'relative',
  },
  textAreaWithMic: {
    paddingRight: 50, // Make space for microphone button
  },
  microphoneButton: {
    position: 'absolute',
    right: 10,
    top: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  microphoneButtonActive: {
    backgroundColor: '#FF4444',
    elevation: 4,
    shadowOpacity: 0.3,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFF3E0',
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF4444',
    marginRight: 8,
  },
  recordingText: {
    fontSize: 14,
    color: '#FF6F00',
    fontWeight: '500',
  },
});

export default ComplaintWizardScreen;
