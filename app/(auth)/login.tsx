import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert, Dimensions, Animated, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Lock, LogIn, UserPlus, Sparkles, X, ShieldCheck, Eye, EyeOff } from 'lucide-react-native';
import { MotiView, AnimatePresence } from 'moti';

const { width, height } = Dimensions.get('window');

const BACKGROUND_WORDS = [
  { ko: '케이팝', en: 'K-POP' },
  { ko: '연애', en: 'DATING' },
  { ko: '여행', en: 'TRAVEL' },
  { ko: '인사', en: 'GREETINGS' },
  { ko: '음식', en: 'FOOD' },
  { ko: '드라마', en: 'DRAMA' },
  { ko: '친구', en: 'FRIEND' },
  { ko: '사랑', en: 'LOVE' },
  { ko: '한글', en: 'HANGEUL' },
  { ko: '서울', en: 'SEOUL' },
  { ko: '열정', en: 'PASSION' },
];


export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [splashDone, setSplashDone] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isVerifyingReset, setIsVerifyingReset] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const router = useRouter();

  // Animation for scrolling background words
  const scrollAnim = useRef(new Animated.Value(0)).current;

  // Memoize randomized styles for background words
  const randomizedWords = useMemo(() => {
    return [...BACKGROUND_WORDS, ...BACKGROUND_WORDS, ...BACKGROUND_WORDS].map((word) => ({
      ...word,
      id: Math.random().toString(),
      fontSize: Math.floor(Math.random() * (40 - 24 + 1)) + 24,
      opacity: Math.random() * (0.05 - 0.02) + 0.02,
      letterSpacing: Math.floor(Math.random() * (20 - 10 + 1)) + 10,
    }));
  }, []);

  const SLOT_HEIGHT = 100;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scrollAnim, {
          toValue: -randomizedWords.length * SLOT_HEIGHT / 2,
          duration: 80000, // Significantly slower for premium feel
          useNativeDriver: true,
        }),
        Animated.timing(scrollAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Custom splash delay
    setTimeout(() => setSplashDone(true), 2500);
  }, []);

  async function handleAuth() {
    if (!email || !password) {
      Alert.alert('Incomplete Entry', 'Please provide your credentials.');
      return;
    }

    if (isSignUp) {
      if (password !== confirmPassword) {
        Alert.alert('Security Clash', 'Passwords do not match. Please re-verify.');
        return;
      }
      if (password.length < 6) {
        Alert.alert('Weak Protocol', 'Password must be at least 6 characters.');
        return;
      }
    }

    setLoading(true);
    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) Alert.alert('Registration Error', error.message);
      else {
        // Shift to OTP stage
        setIsVerifying(true);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) Alert.alert('Authentication Error', error.message);
      else router.replace('/(tabs)');
    }
    setLoading(false);
  }

  async function handleVerify() {
    if (verificationCode.length < 6) {
      Alert.alert('Incomplete Code', 'Please enter your neural access code.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: verificationCode,
      type: 'signup',
    });

    if (error) {
      Alert.alert('Sync Failure', 'The access code is invalid or has expired.');
    } else {
      // Redirect new residents to Onboarding
      router.replace('/');
    }
    setLoading(false);
  }

  async function handleResetRequest() {
    if (!email) {
      Alert.alert('Incomplete Entry', 'Please provide your email address.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setLoading(false);
    if (error) {
      Alert.alert('Reset Failure', error.message);
    } else {
      setIsResetting(false);
      setIsVerifyingReset(true);
      setVerificationCode('');
      setPassword('');
    }
  }

  async function handleResetVerify() {
    if (verificationCode.length < 6 || !password) {
      Alert.alert('Incomplete Entry', 'Please enter the access code and a new password.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak Protocol', 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: verificationCode,
      type: 'recovery',
    });

    if (error) {
      Alert.alert('Verification Failure', error.message);
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: password,
    });

    setLoading(false);

    if (updateError) {
      Alert.alert('Password Update Failure', updateError.message);
    } else {
      Alert.alert('Protocol Complete', 'Your security clearance has been updated.');
      router.replace('/(tabs)');
    }
  }

  if (!splashDone) {
    return (
      <View className="flex-1 bg-[#0D0D0D] items-center justify-center">
        <MotiView
          from={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 12 }}
          className="items-center"
        >
          <View className="w-32 h-32 rounded-full items-center justify-center mb-8">
            <LinearGradient
              colors={['#00FFC2', '#EF5777']}
              className="absolute inset-0 rounded-full opacity-20"
            />
             <Sparkles size={60} color="#00FFC2" fill="#00FFC2" />
          </View>
          <Text className="text-white text-6xl tracking-tighter" style={{ fontFamily: 'Tenada' }}>K-SWIPE</Text>
          <MotiView
             from={{ width: 0 }}
             animate={{ width: 200 }}
             transition={{ type: 'timing', duration: 2000 }}
             className="h-[2px] bg-[#00FFC2] mt-4"
          />
        </MotiView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#0D0D0D]">
      {/* Dynamic Word Matrix Background */}
      <View className="absolute inset-0 overflow-hidden">
        <Animated.View style={{ transform: [{ translateY: scrollAnim }] }}>
          {randomizedWords.map((word, i) => (
            <View key={i} className="justify-center items-center px-10" style={{ height: SLOT_HEIGHT }}>
               <Text 
                 numberOfLines={1}
                 adjustsFontSizeToFit
                 className="text-white font-black uppercase" 
                 style={{ 
                   fontFamily: 'Tenada', 
                   fontSize: word.fontSize, 
                   opacity: word.opacity,
                   letterSpacing: word.letterSpacing,
                   width: '100%',
                   textAlign: 'center'
                 }}
               >
                 {word.ko} {word.en}
               </Text>
            </View>
          ))}
        </Animated.View>
      </View>

      {/* Main Gradients */}
      <View className="absolute inset-0">
        <MotiView
          animate={{ opacity: 0.15, scale: [1, 1.2, 1] }}
          transition={{ type: 'timing', duration: 10000, loop: true }}
          className="absolute top-[-50] right-[-140] w-96 h-96 rounded-full"
          style={{ backgroundColor: '#00FFC2' }}
        />
        <MotiView
          animate={{ opacity: 0.12, scale: [1, 1.3, 1] }}
          transition={{ type: 'timing', duration: 8000, loop: true }}
          className="absolute bottom-[-50] left-[-140] w-96 h-96 rounded-full"
          style={{ backgroundColor: '#EF5777' }}
        />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, justifyContent: 'center' }}
          showsVerticalScrollIndicator={false}
        >
          <AnimatePresence mode="wait">
            {isResetting ? (
              <MotiView
                key="reset-request-form"
                from={{ scale: 0.9, opacity: 0, translateY: 20 }}
                animate={{ scale: 1, opacity: 1, translateY: 0 }}
                exit={{ scale: 0.9, opacity: 0, translateY: -20 }}
                className="bg-[#1A1A1A] rounded-[48px] border border-white/5 py-12 px-8 shadow-2xl"
              >
                <View className="items-center mb-12">
                  <Text className="text-white text-5xl mb-2 text-center" style={{ fontFamily: 'Tenada' }}>
                    Reset Access
                  </Text>
                  <Text className="text-white/30 text-[10px] font-black uppercase tracking-[3px] text-center">
                    Recover your residency status
                  </Text>
                </View>

                <View className="gap-y-5">
                  <View className="bg-black/40 border border-white/5 h-16" style={{ borderRadius: 999 }}>
                    <View className="flex-row items-center px-6 h-full">
                      <Mail size={18} color="rgba(255,255,255,0.2)" />
                      <TextInput
                        placeholder="Email Address"
                        placeholderTextColor="rgba(255,255,255,0.15)"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        className="flex-1 ml-4 text-white text-base font-bold"
                      />
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={handleResetRequest}
                    disabled={loading}
                    activeOpacity={0.9}
                    className="mt-6"
                  >
                    <LinearGradient
                      colors={['#00FFC2', '#00DFB0']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      className="h-16 rounded-full items-center justify-center flex-row shadow-xl"
                      style={{ borderRadius: 999 }}
                    >
                      <Text className="text-black font-black uppercase tracking-widest text-base">
                        {loading ? 'Transmitting...' : 'Send Recovery Code'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={() => setIsResetting(false)}
                  className="mt-10 items-center"
                >
                  <Text className="text-white/30 text-[10px] font-black uppercase tracking-widest">
                    Remembered? <Text className="text-[#00FFC2]">Return to Login</Text>
                  </Text>
                </TouchableOpacity>
              </MotiView>
            ) : isVerifyingReset ? (
              <MotiView
                key="reset-verify-form"
                from={{ scale: 0.9, opacity: 0, translateY: 20 }}
                animate={{ scale: 1, opacity: 1, translateY: 0 }}
                exit={{ scale: 0.9, opacity: 0, translateY: -20 }}
                className="bg-[#1A1A1A] rounded-[48px] border border-white/5 py-12 px-8 shadow-2xl"
              >
                <View className="items-center mb-10">
                  <View className="w-20 h-20 bg-[#00FFC2]/10 rounded-full items-center justify-center mb-6 border border-[#00FFC2]/30">
                    <ShieldCheck size={40} color="#00FFC2" />
                  </View>
                  <Text className="text-white text-3xl mb-2 text-center" style={{ fontFamily: 'Tenada' }}>
                    NEW PROTOCOL
                  </Text>
                  <Text className="text-white/30 text-[10px] font-black uppercase tracking-[2px] text-center px-4 leading-4">
                    Enter the Recovery Code sent to{'\n'}
                    <Text className="text-[#00FFC2]">{email}</Text>
                  </Text>
                </View>

                <View className="gap-y-5 mb-8">
                  <View className="bg-black/40 border border-white/10 h-16" style={{ borderRadius: 999 }}>
                    <TextInput
                      placeholder="ACCESS CODE"
                      placeholderTextColor="rgba(255,255,255,0.1)"
                      value={verificationCode}
                      onChangeText={setVerificationCode}
                      maxLength={8}
                      keyboardType="default"
                      className="flex-1 text-center text-white text-2xl font-black tracking-[10px]"
                    />
                  </View>

                  <View className="bg-black/40 border border-white/5 h-16" style={{ borderRadius: 999 }}>
                    <View className="flex-row items-center px-6 h-full">
                      <Lock size={18} color="rgba(255,255,255,0.2)" />
                      <TextInput
                        placeholder="New Password"
                        placeholderTextColor="rgba(255,255,255,0.15)"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        className="flex-1 ml-4 text-white text-base font-bold"
                      />
                      <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff size={18} color="rgba(255,255,255,0.3)" /> : <Eye size={18} color="rgba(255,255,255,0.3)" />}
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handleResetVerify}
                  disabled={loading}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={['#00FFC2', '#00DFB0']}
                    className="h-16 rounded-full items-center justify-center shadow-xl"
                    style={{ borderRadius: 999 }}
                  >
                    <Text className="text-black font-black uppercase tracking-widest text-base">
                      {loading ? 'Synchronizing...' : 'Update Security'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setIsVerifyingReset(false);
                    setVerificationCode('');
                    setPassword('');
                  }}
                  className="mt-8 items-center"
                >
                  <Text className="text-white/30 text-[10px] font-black uppercase tracking-widest">
                    Abort Recovery Protocol
                  </Text>
                </TouchableOpacity>
              </MotiView>
            ) : !isVerifying ? (
              <MotiView
                key="auth-form"
                from={{ scale: 0.9, opacity: 0, translateY: 20 }}
                animate={{ scale: 1, opacity: 1, translateY: 0 }}
                exit={{ scale: 0.9, opacity: 0, translateY: -20 }}
                className="bg-[#1A1A1A] rounded-[48px] border border-white/5 py-12 px-8 shadow-2xl"
              >
                {/* Header Identity */}
                <View className="items-center mb-12">
                  <Text className="text-white text-5xl mb-2 text-center" style={{ fontFamily: 'Tenada' }}>
                    {isSignUp ? "Create Residence" : "Welcome Back"}
                  </Text>
                  <Text className="text-white/30 text-[10px] font-black uppercase tracking-[3px] text-center">
                    {isSignUp ? "Enter the rhythm of global connections" : "Continue your K-culture journey"}
                  </Text>
                </View>

                <View className="gap-y-5">
                  {/* Email Input */}
                  <View className="bg-black/40 border border-white/5 h-16" style={{ borderRadius: 999 }}>
                    <View className="flex-row items-center px-6 h-full">
                      <Mail size={18} color="rgba(255,255,255,0.2)" />
                      <TextInput
                        placeholder="Email Address"
                        placeholderTextColor="rgba(255,255,255,0.15)"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        className="flex-1 ml-4 text-white text-base font-bold"
                      />
                    </View>
                  </View>

                  {/* Password Input */}
                  <View className="bg-black/40 border border-white/5 h-16" style={{ borderRadius: 999 }}>
                    <View className="flex-row items-center px-6 h-full">
                      <Lock size={18} color="rgba(255,255,255,0.2)" />
                      <TextInput
                        placeholder="Password"
                        placeholderTextColor="rgba(255,255,255,0.15)"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        className="flex-1 ml-4 text-white text-base font-bold"
                      />
                      <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff size={18} color="rgba(255,255,255,0.3)" /> : <Eye size={18} color="rgba(255,255,255,0.3)" />}
                      </TouchableOpacity>
                    </View>
                  </View>

                  {!isSignUp && (
                    <TouchableOpacity onPress={() => setIsResetting(true)} className="items-end px-4 -mt-2">
                      <Text className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Forgot Password?</Text>
                    </TouchableOpacity>
                  )}

                  {/* Confirm Password - Exact Symmetry Match */}
                  <AnimatePresence>
                    {isSignUp && (
                      <MotiView
                        from={{ opacity: 0, height: 0, marginBottom: 0 }}
                        animate={{ opacity: 1, height: 64, marginBottom: 0 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        className="bg-black/40 border border-white/5 overflow-hidden"
                        style={{ borderRadius: 999 }}
                      >
                        <View className="flex-row items-center px-6 h-16">
                          <ShieldCheck size={18} color={password === confirmPassword && confirmPassword ? '#00FFC2' : 'rgba(255,255,255,0.2)'} />
                          <TextInput
                            placeholder="Retype Password"
                            placeholderTextColor="rgba(255,255,255,0.15)"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry={!showPassword}
                            className="flex-1 ml-4 text-white text-base font-bold"
                          />
                        </View>
                      </MotiView>
                    )}
                  </AnimatePresence>

                  <TouchableOpacity
                    onPress={handleAuth}
                    disabled={loading}
                    activeOpacity={0.9}
                    className="mt-6"
                  >
                    <LinearGradient
                      colors={isSignUp ? ['#EF5777', '#FF7E9F'] : ['#00FFC2', '#00DFB0']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      className="h-16 rounded-full items-center justify-center flex-row shadow-xl"
                      style={{ borderRadius: 999 }}
                    >
                      <Text className="text-black font-black uppercase tracking-widest text-base">
                        {loading ? 'Validating...' : (isSignUp ? 'Apply for Residency' : 'Initialize Session')}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={() => setIsSignUp(!isSignUp)}
                  className="mt-10 items-center"
                >
                  <Text className="text-white/30 text-[10px] font-black uppercase tracking-widest">
                    {isSignUp ? 'Already a member? ' : "Don't have an account? "}
                    <Text className={isSignUp ? 'text-[#EF5777]' : 'text-[#00FFC2]'}>
                      {isSignUp ? 'Sign In' : 'Sign Up Now'}
                    </Text>
                  </Text>
                </TouchableOpacity>
              </MotiView>
            ) : (
              <MotiView
                key="otp-form"
                from={{ scale: 0.9, opacity: 0, translateY: 20 }}
                animate={{ scale: 1, opacity: 1, translateY: 0 }}
                exit={{ scale: 0.9, opacity: 0, translateY: -20 }}
                className="bg-[#1A1A1A] rounded-[48px] border border-white/5 py-12 px-8 shadow-2xl"
              >
                <View className="items-center mb-10">
                  <View className="w-20 h-20 bg-[#EF5777]/10 rounded-full items-center justify-center mb-6 border border-[#EF5777]/30">
                    <ShieldCheck size={40} color="#EF5777" />
                  </View>
                  <Text className="text-white text-3xl mb-2 text-center" style={{ fontFamily: 'Tenada' }}>
                    VERIFY IDENTITY
                  </Text>
                  <Text className="text-white/30 text-[10px] font-black uppercase tracking-[2px] text-center px-4 leading-4">
                    Enter the Neural Access Code sent to{'\n'}
                    <Text className="text-[#EF5777]">{email}</Text>
                  </Text>
                </View>

                <View className="bg-black/40 border border-white/10 h-16 mb-8" style={{ borderRadius: 999 }}>
                  <TextInput
                    placeholder="ACCESS CODE"
                    placeholderTextColor="rgba(255,255,255,0.1)"
                    value={verificationCode}
                    onChangeText={setVerificationCode}
                    maxLength={8}
                    keyboardType="default"
                    className="flex-1 text-center text-white text-2xl font-black tracking-[10px]"
                  />
                </View>

                <TouchableOpacity
                  onPress={handleVerify}
                  disabled={loading}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={['#EF5777', '#FF7E9F']}
                    className="h-16 rounded-full items-center justify-center shadow-xl"
                    style={{ borderRadius: 999 }}
                  >
                    <Text className="text-black font-black uppercase tracking-widest text-base">
                      {loading ? 'Synchronizing...' : 'Authorize Residency'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setIsVerifying(false);
                    setVerificationCode('');
                  }}
                  className="mt-8 items-center"
                >
                  <Text className="text-white/30 text-[10px] font-black uppercase tracking-widest">
                    Entered wrong email? <Text className="text-white underline">Abort Protocol</Text>
                  </Text>
                </TouchableOpacity>
              </MotiView>
            )}
          </AnimatePresence>

          <TouchableOpacity onPress={() => Linking.openURL('https://isuru01.github.io/k-swipe/')} className="mt-12 mb-8">
            <Text className="text-white/10 text-[9px] font-black uppercase tracking-[4px] text-center px-8 leading-4">
              BY JOINING DISTRICT 01, YOU AGREE TO OUR{'\n'}
              <Text className="text-white/30 underline">TERMS OF SERVICE</Text> AND <Text className="text-white/30 underline">PRIVACY PROTOCOL</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
