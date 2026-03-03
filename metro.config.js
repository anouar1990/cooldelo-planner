const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Supabase and some modern packages use 'import.meta' which Metro struggles with.
// Adding this transformer flag helps resolve it on React Native Web
config.resolver.sourceExts = ['jsx', 'js', 'ts', 'tsx', 'cjs', 'json', 'mjs'];

config.transformer.getTransformOptions = async () => ({
    transform: {
        experimentalImportSupport: false,
        inlineRequires: false,
    },
});

module.exports = config;
