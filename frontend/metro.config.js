// Ye naya code hai
const { getDefaultConfig } = require('expo/metro-config');

// Default config ko load karo
const config = getDefaultConfig(__dirname);

// Yahaan hai jaadoo!
// Hum Metro ko bata rahe hain ki .ts aur .tsx files ko bhi pehchano
const { sourceExts } = config.resolver;
config.resolver.sourceExts = [...sourceExts, 'ts', 'tsx', 'mjs'];

// Nayi config ko export karo
module.exports = config;