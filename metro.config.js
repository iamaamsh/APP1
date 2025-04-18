// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Fix source and asset extensions - explicitly include all needed types
config.resolver.sourceExts = ['js', 'jsx', 'ts', 'tsx', 'json', 'cjs', 'mjs'];
config.resolver.assetExts = [
  // Images
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'psd', 'bmp', 'tiff',
  // Video/Audio
  'mp4', 'm4v', 'mov', 'mp3', 'wav',
  // Fonts
  'ttf', 'otf', 'woff', 'woff2',
  // Documents
  'pdf',
  // Archives
  'zip'
];

// Exclude specific directories from the watchman watch list to improve performance
config.watchFolders = [path.resolve(__dirname)];
config.resolver.blockList = [
  /node_modules\/.*\/node_modules\/react-native\/.*/,
  /.*\.git\/.*/,
];

// Fix symlink issues
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Custom handling for typical problematic modules
  if (moduleName.indexOf('react-native/Libraries') !== -1) {
    try {
      const moduleDir = path.dirname(require.resolve('react-native/package.json'));
      const newPath = path.join(moduleDir, moduleName.replace('react-native', ''));
      return context.resolveRequest(context, newPath, platform);
    } catch (e) {
      // Fall back to default if there's any issues
    }
  }
  return context.resolveRequest(context, moduleName, platform);
};

// Disable HMR which can cause issues with OTA updates and native modules
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Disable Hot module reloading - prevents update errors
      if (req.url.includes('hot')) {
        res.statusCode = 404;
        res.end();
        return;
      }
      
      // Fix CORS issues for development
      res.setHeader('Access-Control-Allow-Origin', '*');
      
      return middleware(req, res, next);
    };
  },
};

// Increase max workers for faster bundling
config.maxWorkers = Math.max(2, (process.env.NUMBER_OF_PROCESSORS || 4) - 1);

module.exports = config; 