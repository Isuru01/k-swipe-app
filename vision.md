# Vision - K-Swipe Production Launch

K-Swipe is a high-energy Korean language learning app featuring "Seoul Synth" aesthetics, gamified swipe logic, and tactile card physics.

## Core Objectives
1. **Swipe Logic**: Primary artifact. Tactile cards with 15-degree rotation thresholds, neon directional glows, correction loops, and match/no-match dynamic distractors.
2. **Aesthetics**: "Seoul Synth" dark theme (Background `1A1A1A`), Glassmorphism, Neomorphism, Cyber Rose error glows, Carbon Mint success glows, Iridescent Cyan system accents.
3. **Data & Progression**: SQLite + Drizzle ORM tracking Spaced Repetition (SRS) via a `UserPerformance` table.
4. **Cloud Sync**: Supabase Auth (Email/Google OAuth) storing `supabase_uid` locally to ensure Daily Streaks and UserStats sync seamlessly.
5. **Boss Logic**: Every 10 cards triggers a typing challenge with a custom UI Hangeul Keyboard.

## Technical Stack
- **Framework**: React Native (Expo SDK latest, File-based routing)
- **Styling**: NativeWind v5 (Tailwind CSS v4)
- **Database**: Expo SQLite + Drizzle ORM
- **Authentication**: Supabase Auth
- **Animations**: Moti + Reanimated 3
- **Icons**: Lucide-React-Native
- **Typography**: `@expo-google-fonts/plus-jakarta-sans` for English, bundled `Tenada.ttf` for Hangeul.
