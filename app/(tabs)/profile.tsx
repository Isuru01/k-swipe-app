import { eq } from 'drizzle-orm';
import { LinearGradient } from 'expo-linear-gradient';
import { Award, Briefcase, Coffee, FileText, Flame, Heart, Inbox, Music, Plane, Scale, Share2, Shield, Star, Target, Tv2, X, Zap } from 'lucide-react-native';
import { MotiView } from 'moti';
import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, Modal, ScrollView, Text, TouchableOpacity, View, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinguisticAvatar from '../../components/LinguisticAvatar';
import { db } from '../../db';
import { localPerformance, localUserStats } from '../../db/schema';
import { useAuth } from '../../lib/auth-context';
import { supabase } from '../../lib/supabase';
import Constants from 'expo-constants';

const { width } = Dimensions.get('window');

const INTEREST_ICONS: any = {
  'casual': Coffee,
  'dating': Heart,
  'k-drama': Tv2,
  'k-pop': Music,
  'work': Briefcase,
  'travel': Plane,
};

const BADGES = [
  { id: 'first_10', label: 'DECA-CORE', sub: '10 Sessions', icon: Zap, color: '#00E5E5', threshold: 10 },
  { id: 'streak_3', label: 'PHOENIX', sub: '3 Day Streak', icon: Flame, color: '#EF5777', threshold: 3 },
  { id: 'mastery', label: 'COLLECTOR', sub: '50 Mastered', icon: Target, color: '#9dff00', threshold: 50 },
];

const LEVEL_MAP: any = {
  'Beginner': { ko: '초보자', color: '#8D9C70' },
  'Intermediate': { ko: '중급자', color: '#00D1FF' },
  'Expert': { ko: '전문가', color: '#FFD32A' },
};

const PRIVACY_PROTOCOL = `
K-SWIPE PRIVACY PROTOCOL
Effective Date: May 10, 2026

1. DATA COLLECTION
We collect your email for authentication and security, alongside profile aliases to track your linguistic proficiency. We do not store or have access to raw passwords.

2. PERFORMANCE & ANALYTICS
Your study performance, word mastery (success/failure metrics), and XP are stored locally on your device for maximum speed and privacy. They are securely mirrored to our cloud framework to preserve your progress across devices.

3. SECURITY PROTOCOLS
We employ robust backend infrastructure. All data transmitted is heavily encrypted using industry-standard TLS/SSL. Your data is shielded by strict Row-Level Security policies, ensuring only your authenticated signature can access it.

4. THIRD-PARTY AGENTS
We do not sell, rent, or trade your personal information. We only interface with our trusted infrastructure provider strictly to host the database and manage identity verification.

5. NEURAL DISSOLVE & DATA RIGHTS
You maintain absolute authority over your records. You can permanently erase your existence from our grid at any time using the "Delete Account & Data" protocol. Initiating this executes a complete, irreversible purge of your email, profile, and learning statistics.

6. YOUTH PROTECTION
K-Swipe does not knowingly collect personally identifiable information from individuals under 13 years of age.
`;

const TERMS_OF_RESIDENCY = `
K-SWIPE TERMS OF RESIDENCY

Welcome to the Neo-Oasis. By authorizing your residency, you agree to:

1. INTELLECTUAL GROWTH
Engage with the linguistic districts respectfully and maintain consistent study pulses.

2. ACCOUNT SECURITY
Protect your access tokens. Unauthorized sharing of neuro-links is strictly prohibited.

3. DATA RESPONSIBILITY
Acknowledge that local data storage requires user-side maintenance for device migrations.
`;

export default function ProfileScreen() {
  const { signOut } = useAuth();
  const [streak, setStreak] = useState(0);
  const [setCount, setSetCount] = useState(0);
  const [masteredTotal, setMasteredTotal] = useState(0);
  const [userName, setUserName] = useState('Agent');
  const [level, setLevel] = useState('Beginner');
  const [interests, setInterests] = useState<string[]>([]);
  const [showLegal, setShowLegal] = useState(false);
  const [legalTitle, setLegalTitle] = useState('');
  const [legalContent, setLegalContent] = useState('');

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const uid = user.id;

      const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Agent';
      setUserName(displayName);

      const stats = await db.select().from(localUserStats).where(eq(localUserStats.userId, uid));
      if (stats.length > 0) {
        setStreak(stats[0].dailyStreak || 0);
        setLevel(stats[0].proficiencyLevel || 'Beginner');
        if (stats[0].interests) {
          try { setInterests(JSON.parse(stats[0].interests)); } catch (e) { }
        }
      }

      const performance = await db.select().from(localPerformance).where(eq(localPerformance.userId, uid));
      const mastered = performance.filter(p => (p.successCount || 0) > (p.failureCount || 0)).length;
      const totalSessions = performance.reduce((acc, curr) => acc + (curr.successCount || 0) + (curr.failureCount || 0), 0);

      setMasteredTotal(mastered);
      setSetCount(Math.floor(totalSessions / 10));
    } catch (e) {
      console.error('Failed to load profile data', e);
    }
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      "EXTERMINATE RESIDENCY?",
      "This action is irreversible. All your linguistic progress, mastery records, and agent profile will be permanently deleted from the Neo-Oasis database.",
      [
        { text: "Abort", style: "cancel" },
        {
          text: "Confirm Deletion",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "FINAL DISCONNECT",
              "We're genuinely sad to see you go. Your linguistic soul will be lost to the void. Proceed with final termination?",
              [
                { text: "Stay with us", style: "cancel" },
                {
                  text: "Goodbye",
                  style: "destructive",
                  onPress: async () => {
                    try {
                      const { data: { user } } = await supabase.auth.getUser();
                      if (user) {
                        // 1. Wipe local tables first (The Vault)
                        await db.delete(localPerformance).where(eq(localPerformance.userId, user.id));
                        await db.delete(localUserStats).where(eq(localUserStats.userId, user.id));

                        // 2. TRIGGER NEURAL DISSOLVE (The Identity)
                        // This requires the SQL function "delete_user_account" to be set up in Supabase
                        const { error: rpcError } = await supabase.rpc('delete_user_account');
                        
                        if (rpcError) {
                            console.error("RPC Identity Wipe Failed", rpcError);
                        }
                      }

                      // 3. Clear Session & Persistent Tokens
                      await signOut();
                      
                      Alert.alert("DISCONNECTED", "Your residency has been terminated. The Oasis has no memory of you.");
                    } catch (e) {
                      console.error("Deletion failure", e);
                      Alert.alert("Deletion Error", "The district protocols refused to release you.");
                    }
                  }
                }
              ]
            );
          }
        }
      ]
    );
  };

  const currentLevelInfo = LEVEL_MAP[level] || LEVEL_MAP['Beginner'];

  return (
    <View className="flex-1 bg-[#0A0A0A]">
      <LinearGradient
        colors={['#1A1B2E', '#0A0A0A']}
        className="absolute inset-0"
      />

      <SafeAreaView className="flex-1">
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          {/* Top Bar with Status Tag */}
          <View className="px-8 pt-6 flex-row justify-between items-center">
            <View>
              <Text className="text-white/30 text-[10px] font-black uppercase tracking-[6px] mb-1">Account Details</Text>
              <Text className="text-white text-3xl" style={{ fontFamily: 'Tenada' }}>PROFILE</Text>
            </View>
            <View
              style={{ backgroundColor: `${currentLevelInfo.color}15`, borderColor: `${currentLevelInfo.color}30` }}
              className="px-6 py-2 rounded-full border"
            >
              <Text style={{ color: currentLevelInfo.color }} className="text-[10px] font-black uppercase tracking-widest">
                {level} - {currentLevelInfo.ko}
              </Text>
            </View>
          </View>

          {/* Identity Hub */}
          <MotiView
            from={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="items-center mt-10 px-8"
          >
            <LinguisticAvatar name={userName} size={144} borderWidth={4} />

            <View className="items-center mt-6">
              <Text className="text-white text-5xl font-black text-center" style={{ fontFamily: 'Tenada' }}>{userName.toUpperCase()}</Text>

              {/* Interest Chips */}
              <View className="flex-row flex-wrap justify-center gap-2 mt-4">
                {interests.map((it) => {
                  const Icon = INTEREST_ICONS[it] || Star;
                  return (
                    <View key={it} className="bg-white/5 px-4 py-2 rounded-full border border-white/10 flex-row items-center gap-2">
                      <Icon color="#00FFC2" size={12} />
                      <Text className="text-white/60 text-[9px] font-black uppercase tracking-widest">{it}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </MotiView>

          {/* Optimized Vital Statistics Row */}
          <View className="flex-row justify-between px-6 mt-12 gap-3">
            <View className="flex-1 bg-white/5 p-5 rounded-[28px] border border-white/10 items-center justify-center h-32">
              <Flame color="#EF5777" size={24} fill="#EF5777" className="mb-2" />
              <Text className="text-white text-2xl font-black">{streak}</Text>
              <Text className="text-white/30 text-[8px] font-bold uppercase tracking-[2px]">Streak</Text>
            </View>

            <View className="flex-1 bg-white/10 p-5 rounded-[28px] border border-white/20 items-center justify-center h-32">
              <Inbox color="white" size={24} className="mb-2" />
              <Text className="text-white text-2xl font-black">{masteredTotal}</Text>
              <Text className="text-white/30 text-[8px] font-bold uppercase tracking-[2px]">Mastered</Text>
            </View>

            <View className="flex-1 bg-white/5 p-5 rounded-[28px] border border-white/10 items-center justify-center h-32">
              <Award color="#FFD32A" size={24} className="mb-2" />
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                className="text-white text-xl font-black uppercase w-full text-center"
              >
                {level}
              </Text>
              <Text className="text-white/30 text-[8px] font-bold uppercase tracking-[2px]">Rank</Text>
            </View>
          </View>

          {/* Badge District */}
          <View className="px-8 mt-16">
            <View className="mb-8 items-start">
              <Text className="text-white text-3xl" style={{ fontFamily: 'Tenada' }}>BADGES</Text>
              <View className="w-12 h-1 bg-[#00FFC2]/40 mt-1 rounded-full" />
              <Text className="text-white/30 text-[10px] font-black uppercase tracking-widest mt-2">Linguistic Achievements</Text>
            </View>

            <View className="flex-row flex-wrap justify-between">
              {BADGES.map((badge, i) => {
                const isUnlocked =
                  (badge.id === 'first_10' && setCount >= badge.threshold) ||
                  (badge.id === 'streak_3' && streak >= badge.threshold) ||
                  (badge.id === 'mastery' && masteredTotal >= badge.threshold);

                return (
                  <MotiView
                    key={badge.id}
                    from={{ opacity: 0, translateY: 10 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ delay: i * 80 }}
                    style={{ width: (width - 84) / 2 }}
                    className="mb-6"
                  >
                    <View className={`p-5 rounded-[32px] border items-center justify-center aspect-square ${isUnlocked ? 'bg-white/10 border-white/20' : 'bg-white/5 border-white/10'}`}>
                      <View
                        style={{ backgroundColor: isUnlocked ? `${badge.color}25` : 'rgba(255,255,255,0.05)' }}
                        className="w-14 h-14 rounded-full items-center justify-center mb-3"
                      >
                        <badge.icon color={isUnlocked ? badge.color : 'rgba(255,255,255,0.25)'} size={28} />
                      </View>
                      <Text
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        className={`text-xs font-black uppercase tracking-widest text-center ${isUnlocked ? 'text-white' : 'text-white/20'}`}
                      >
                        {badge.label}
                      </Text>
                    </View>
                  </MotiView>
                );
              })}
            </View>

            <View className="mb-8 items-start mt-12">
              <Text className="text-white text-3xl" style={{ fontFamily: 'Tenada' }}>PROTOCOLS</Text>
              <View className="w-12 h-1 bg-[#00FFC2]/40 mt-1 rounded-full" />
              <Text className="text-white/30 text-[10px] font-black uppercase tracking-widest mt-2">Privacy & Accountability</Text>
            </View>

            <View className="bg-white/5 border border-white/10 rounded-[32px] overflow-hidden mb-6">
              <TouchableOpacity 
                onPress={() => Linking.openURL('https://isuru01.github.io/k-swipe/')}
                className="p-6 border-b border-white/5 flex-row justify-between items-center"
              >
                <Text className="text-white/60 text-xs font-bold uppercase tracking-widest">Privacy Policy</Text>
                <Shield color="#00FFC2" size={14} />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => {
                  setLegalTitle('TERMS OF RESIDENCY');
                  setLegalContent(TERMS_OF_RESIDENCY);
                  setShowLegal(true);
                }}
                className="p-6 flex-row justify-between items-center"
              >
                <Text className="text-white/60 text-xs font-bold uppercase tracking-widest">Terms of Residency</Text>
                <Scale color="#00FFC2" size={14} />
              </TouchableOpacity>
            </View>

            <View className="mb-10 p-6 bg-[#00FFC2]/5 rounded-[24px] border border-[#00FFC2]/10">
              <Text className="text-[#00FFC2] text-[8px] font-black uppercase tracking-[2px] mb-2">Transparency Note</Text>
              <Text className="text-white/30 text-[10px] leading-[14px]">
                K-Swipe stores your linguistic progress and vocabulary mastery locally. Deleting your account will permanently erase this data from your device and terminate your global authentication session.
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => Alert.alert("Disconnecting Agent", "Safely terminate session?", [
                { text: "Cancel", style: "cancel" },
                { text: "Log Out", onPress: () => signOut() }
              ])}
              className="mt-4 bg-white/5 py-5 rounded-[32px] border border-white/10 items-center"
            >
              <Text className="text-white/40 text-[10px] font-black uppercase tracking-[6px]">Terminate Session</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDeleteAccount}
              className="mt-4 bg-red-500/10 py-5 rounded-[32px] border border-red-500/20 items-center"
            >
              <Text className="text-red-500/60 text-[10px] font-black uppercase tracking-[6px]">Delete Account & Data</Text>
            </TouchableOpacity>

            <Text className="mt-12 text-center text-white/20 text-[10px] font-black uppercase tracking-[4px] mb-4">
              Protocol v{Constants.expoConfig?.version || '1.0.0'} (Build {Constants.expoConfig?.android?.versionCode || '1'})
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Legal Protocol Modal */}
      <Modal
        visible={showLegal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLegal(false)}
      >
        <View className="flex-1 justify-end">
          <View className="h-[80%] bg-[#1A1A1A] rounded-t-[48px] border-t border-white/10 p-8 shadow-2xl">
            <View className="flex-row justify-between items-center mb-8">
              <Text className="text-white text-3xl font-black" style={{ fontFamily: 'Tenada' }}>{legalTitle}</Text>
              <TouchableOpacity onPress={() => setShowLegal(false)} className="bg-white/5 p-3 rounded-full">
                <X color="white" size={24} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text className="text-white/60 text-base leading-7 font-medium">
                {legalContent}
              </Text>
              <View className="h-20" />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
