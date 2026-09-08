const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);
config.resolver.sourceExts.push('sql');
// expo-sqlite's web implementation (wa-sqlite) needs .wasm treated as an asset, not a source
// module - https://docs.expo.dev/versions/v57.0.0/sdk/sqlite/#web-support
config.resolver.assetExts.push('wasm');

module.exports = withNativeWind(config, { input: './src/global.css', inlineRem: 16 });
