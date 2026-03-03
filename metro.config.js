const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Add mjs support for ESM packages
config.resolver.sourceExts = ['jsx', 'js', 'ts', 'tsx', 'cjs', 'json', 'mjs'];

// On web, alias @supabase/supabase-js to an empty stub to prevent
// the "Cannot use import.meta outside a module" error.
const isWeb = process.env.EXPO_TARGET === 'web' || process.env.EXPO_PLATFORM === 'web';

const originalResolver = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (platform === 'web' && moduleName === '@supabase/supabase-js') {
        return {
            filePath: path.resolve(__dirname, 'src/lib/supabase-stub.js'),
            type: 'sourceFile',
        };
    }
    if (originalResolver) {
        return originalResolver(context, moduleName, platform);
    }
    return context.resolveRequest(context, moduleName, platform);
};

config.transformer.getTransformOptions = async () => ({
    transform: {
        experimentalImportSupport: false,
        inlineRequires: false,
    },
});

module.exports = config;
