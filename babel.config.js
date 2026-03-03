module.exports = function (api) {
    api.cache(true);
    return {
        presets: ['babel-preset-expo'],
        plugins: [
            // Transforms import.meta → process.env compatible code for web builds
            'babel-plugin-transform-import-meta',
        ]
    };
};
