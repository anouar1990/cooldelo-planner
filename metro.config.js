const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add mjs/cjs support for ESM packages like @supabase/supabase-js
config.resolver.sourceExts = ['jsx', 'js', 'ts', 'tsx', 'cjs', 'json', 'mjs'];

config.transformer.getTransformOptions = async () => ({
    transform: {
        experimentalImportSupport: false,
        inlineRequires: false,
    },
});

module.exports = config;
