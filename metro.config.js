const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);
config.resolver.sourceExts.push('sql'); // For Drizzle migrations
config.resolver.unstable_enablePackageExports = true; // Required for @next versions on SDK 55

module.exports = withNativeWind(config, { input: "./global.css" });
