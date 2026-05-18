import { eq } from 'drizzle-orm';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronUp, Globe, Trophy, Zap, Crown, Star, TrendingUp } from 'lucide-react-native';
import { MotiView } from 'moti';
import React, { useEffect, useState } from 'react';
import { Dimensions, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinguisticAvatar from '../../components/LinguisticAvatar';
import { db } from '../../db';
import { localUserStats } from '../../db/schema';
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');

export default function LeaguesScreen() {
  const [players, setPlayers] = useState<any[]>([]);
  const [userName, setUserName] = useState('Agent');
  const [userRank, setUserRank] = useState<number | null>(null);
  const [userXp, setUserXp] = useState(0);
  const [leagueTier, setLeagueTier] = useState('Silver');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeagueStats();

    // Subscribe to REALTIME updates for the profiles table
    const channelId = `leagues_profiles_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const channel = supabase
      .channel(channelId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        console.log('Realtime update detected in the Oasis!');
        loadLeagueStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadLeagueStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || 'Agent');

      // Fetch Top 50 Users from global profiles
      const { data: allProfiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('total_xp', { ascending: false })
        .limit(50);

      if (!error && allProfiles) {
        setPlayers(allProfiles);
        
        // Find current user's rank and XP
        const me = allProfiles.find(p => p.id === user.id);
        if (me) {
          setUserXp(me.total_xp || 0);
          setUserRank(allProfiles.findIndex(p => p.id === user.id) + 1);
          setLeagueTier(me.proficiency_level === 'expert' ? 'Platinum' : 'Silver');
        } else {
          // Fallback if user is not in top 50
          const localStats = await db.select().from(localUserStats).where(eq(localUserStats.userId, user.id));
          if (localStats.length > 0) {
            setUserXp(localStats[0].totalXP || 0);
            setLeagueTier(localStats[0].proficiencyLevel === 'expert' ? 'Platinum' : 'Silver');
          }
        }
      }
      setLoading(false);
    } catch (e) {
      console.error('Failed to load league stats', e);
      setLoading(false);
    }
  };

  const top3 = players.slice(0, 3);
  // THE FIX: Show ALL players in the list below, including the ones on the podium
  const allList = players;

  return (
    <View className="flex-1 bg-[#477579]">
      <LinearGradient
        colors={['#477579', '#8D9C70', '#273C43']}
        className="absolute inset-0"
      />

      {/* Ghost Architectural Hangeul */}
      <Text
        className="absolute text-white pointer-events-none"
        style={{ fontFamily: 'Tenada', fontSize: 240, opacity: 0.012, top: 200, left: -60, transform: [{ rotate: '-15deg' }] }}
      >
        경쟁
      </Text>

      <SafeAreaView className="flex-1">
        <View className="px-8 pt-4 pb-4 flex-row justify-between items-end">
          <View>
            <Text className="text-white/30 text-[9px] font-black uppercase tracking-[6px] mb-1">Weekly Standings</Text>
            <Text className="text-white text-3xl" style={{ fontFamily: 'Tenada' }}>ARENA</Text>
          </View>
          <View className="bg-white/10 p-2.5 rounded-xl border border-white/20">
            <Globe color="white" size={16} />
          </View>
        </View>

        <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Main Tier Card - Ultra-Compact Edition */}
          <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-10 px-1"
          >
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.02)']}
              className="py-4 px-6 rounded-[28px] border border-white/15 items-center overflow-hidden"
            >
              <View className="absolute top-0 right-0 p-3 opacity-5">
                <Trophy color="white" size={60} />
              </View>

              <View className="flex-row items-center gap-3">
                <View className="bg-white/10 p-2 rounded-full border border-white/10">
                  <Trophy color={leagueTier === 'Platinum' ? '#00E5E5' : '#FFFFFF'} size={18} />
                </View>
                <View>
                  <Text className="text-white text-xl font-black uppercase tracking-widest leading-none" style={{ fontFamily: 'Tenada' }}>
                    {leagueTier} DISTRICT
                  </Text>
                  <View className="flex-row items-center gap-1 mt-1">
                    <TrendingUp color="rgba(255,255,255,0.4)" size={10} />
                    <Text className="text-white/40 text-[7px] font-black uppercase tracking-widest">Promotion Zone Active</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </MotiView>

          {/* The Podium Spotlight - Increased Buffer */}
          {top3.length > 0 && (
            <View className="flex-row items-end justify-center mb-12 h-60 gap-1.5 mt-4">
              {/* Rank 2 */}
              {top3[1] ? (
                <PodiumNode 
                  player={top3[1]} 
                  rank={2} 
                  color="#C0C0C0" 
                  height={110} 
                  isMe={userRank === 2}
                />
              ) : <View className="flex-1 opacity-0" />}
              
              {/* Rank 1 */}
              {top3[0] && (
                <PodiumNode 
                  player={top3[0]} 
                  rank={1} 
                  color="#FFD700" 
                  height={140} 
                  isMe={userRank === 1}
                />
              )}

              {/* Rank 3 */}
              {top3[2] ? (
                <PodiumNode 
                  player={top3[2]} 
                  rank={3} 
                  color="#CD7F32" 
                  height={90} 
                  isMe={userRank === 3}
                />
              ) : <View className="flex-1 opacity-0" />}
            </View>
          )}

          {/* Ranking List */}
          <View className="px-1 mt-2">
            <View className="flex-row items-center justify-between mb-4 px-4">
                <Text className="text-white/20 text-[9px] font-black uppercase tracking-[4px]">District Members</Text>
                <TrendingUp color="rgba(255,255,255,0.1)" size={12} />
            </View>

            {allList.length > 0 ? (
              allList.map((player, index) => {
                const actualRank = index + 1;
                const isMe = userRank === actualRank;
                const displayName = player.username || 'Anonymous Agent';
                
                return (
                  <MotiView
                    key={player.id}
                    from={{ opacity: 0, translateX: -20 }}
                    animate={{ opacity: 1, translateX: 0 }}
                    transition={{ delay: index * 50 }}
                    className={`flex-row items-center justify-between p-4 rounded-[28px] border mb-3 ${isMe ? 'bg-white/20 border-white/40' : 'bg-white/5 border-white/10'
                      }`}
                  >
                    <View className="flex-row items-center gap-4 flex-1">
                      <View className="w-7 h-7 rounded-full items-center justify-center bg-black/40">
                        <Text className="text-white text-[10px] font-black">{actualRank}</Text>
                      </View>
  
                      <View className="shrink-0 bg-white/5 p-1 rounded-full border border-white/10 overflow-hidden">
                        <LinguisticAvatar name={displayName} size={40} />
                      </View>
  
                      <View className="flex-1">
                        <Text className={`text-sm font-bold ${isMe ? 'text-white' : 'text-white/60'}`}>{displayName}</Text>
                        <View className="flex-row items-center gap-1.5">
                          <Zap color="#FFD32A" size={9} fill="#FFD32A" />
                          <Text className="text-white/30 text-[7px] font-black uppercase tracking-widest">{player.total_xp || 0} Power Level</Text>
                        </View>
                      </View>
                    </View>
  
                    {isMe && (
                      <View className="bg-white/20 px-2.5 py-0.5 rounded-full border border-white/30">
                        <Text className="text-white text-[7px] font-black uppercase">YOU</Text>
                      </View>
                    )}
                  </MotiView>
                );
              })
            ) : (
                <View className="py-10 items-center justify-center bg-white/5 rounded-[40px] border border-white/5 border-dashed">
                    <Text className="text-white/10 text-[9px] font-black uppercase tracking-[4px]">Awaiting Residents...</Text>
                </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function PodiumNode({ player, rank, color, height, isMe }: { player: any, rank: number, color: string, height: number, isMe: boolean }) {
  const displayName = player.username || 'Agent';
  const Icon = rank === 1 ? Crown : Star;

  return (
    <MotiView 
      from={{ opacity: 0, scale: 0.8, translateY: 20 }}
      animate={{ opacity: 1, scale: 1, translateY: 0 }}
      transition={{ delay: rank * 100, type: 'spring' }}
      className="flex-1 items-center"
    >
      <View className="items-center mb-2">
        <View className={`p-1 rounded-full border-2 overflow-hidden shadow-2xl ${isMe ? 'border-white' : ''}`} style={{ borderColor: isMe ? '#FFFFFF' : `${color}50` }}>
          <LinguisticAvatar name={displayName} size={rank === 1 ? 64 : 48} />
        </View>
        <View 
          style={{ backgroundColor: color }} 
          className={`w-6 h-6 rounded-full items-center justify-center -mt-4 z-10 border-2 border-black ${rank === 1 ? 'w-7 h-7' : ''}`}
        >
          <Icon color="black" size={rank === 1 ? 14 : 12} fill="black" />
        </View>
      </View>
      
      <View 
        style={{ 
          height, 
          backgroundColor: isMe ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)',
          borderColor: isMe ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)'
        }} 
        className="w-full rounded-t-[32px] border-t border-x items-center pt-3 px-2"
      >
        <Text numberOfLines={1} adjustsFontSizeToFit className={`text-[9px] font-black uppercase tracking-widest text-center ${isMe ? 'text-white' : 'text-white/80'}`}>
             {displayName}
        </Text>
        <View className="flex-row items-center gap-1 mt-1">
             <Zap color="#FFD32A" size={8} fill="#FFD32A" />
             <Text className="text-white/30 text-[7px] font-black uppercase">{player.total_xp || 0}</Text>
        </View>
        
        <View className="mt-auto mb-3 bg-black/40 w-8 h-8 rounded-full items-center justify-center border border-white/5">
            <Text className="text-white text-base font-black" style={{ fontFamily: 'Tenada' }}>{rank}</Text>
        </View>
      </View>
    </MotiView>
  );
}
