#!/usr/bin/env node

/**
 * This script checks the installation and compatibility of dependencies
 * to help troubleshoot Expo startup issues.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk') || { green: (t) => t, red: (t) => t, yellow: (t) => t, blue: (t) => t };

console.log(chalk.blue('===== FDA Mobile App Installation Check ====='));

// Check if necessary directories exist
const requiredDirs = [
  'node_modules', 
  'assets', 
  'assets/images', 
  'src'
];

console.log(chalk.blue('\nChecking directory structure:'));
let allDirsExist = true;
requiredDirs.forEach(dir => {
  if (fs.existsSync(path.join(__dirname, dir))) {
    console.log(chalk.green(`✅ ${dir} directory exists`));
  } else {
    console.log(chalk.red(`❌ ${dir} directory is missing`));
    allDirsExist = false;
  }
});

// Check for important files
const requiredFiles = [
  'app.json', 
  'App.tsx', 
  'package.json', 
  'metro.config.js', 
  'assets/images/icon.png',
  'assets/images/splash-icon.png',
  'assets/images/adaptive-icon.png'
];

console.log(chalk.blue('\nChecking important files:'));
let allFilesExist = true;
requiredFiles.forEach(file => {
  if (fs.existsSync(path.join(__dirname, file))) {
    console.log(chalk.green(`✅ ${file} exists`));
  } else {
    console.log(chalk.red(`❌ ${file} is missing`));
    allFilesExist = false;
  }
});

// Check node and npm versions
console.log(chalk.blue('\nChecking environment:'));
try {
  const nodeVersion = execSync('node -v').toString().trim();
  console.log(chalk.green(`✅ Node.js: ${nodeVersion}`));
} catch (error) {
  console.log(chalk.red('❌ Could not detect Node.js'));
}

try {
  const npmVersion = execSync('npm -v').toString().trim();
  console.log(chalk.green(`✅ npm: ${npmVersion}`));
} catch (error) {
  console.log(chalk.red('❌ Could not detect npm'));
}

// Check critical dependencies
console.log(chalk.blue('\nChecking critical dependencies:'));
const criticalDeps = [
  'react-native',
  'expo',
  'react',
  '@react-navigation/native',
  '@react-native-async-storage/async-storage'
];

let allDepsInstalled = true;
criticalDeps.forEach(dep => {
  try {
    const packagePath = path.join(__dirname, 'node_modules', dep, 'package.json');
    if (fs.existsSync(packagePath)) {
      const packageJson = require(packagePath);
      console.log(chalk.green(`✅ ${dep}: ${packageJson.version}`));
    } else {
      console.log(chalk.red(`❌ ${dep} is not installed`));
      allDepsInstalled = false;
    }
  } catch (error) {
    console.log(chalk.red(`❌ Error checking ${dep}: ${error.message}`));
    allDepsInstalled = false;
  }
});

// Final report
console.log(chalk.blue('\n===== Installation Check Summary ====='));
if (allDirsExist && allFilesExist && allDepsInstalled) {
  console.log(chalk.green('\nAll checks passed! Your installation looks good.'));
  console.log('To start the app, run:');
  console.log(chalk.blue('  npx expo start --clear'));
} else {
  console.log(chalk.yellow('\nSome checks failed. Try these fixes:'));
  
  if (!allDepsInstalled) {
    console.log(chalk.blue('• Reinstall dependencies:'));
    console.log('  npm install');
  }
  
  if (!allFilesExist) {
    console.log(chalk.blue('• Fix missing files mentioned above'));
  }
  
  console.log(chalk.blue('• Try cleaning the project:'));
  console.log('  npm run clean');
  
  console.log(chalk.blue('• If issues persist, try with new dependencies:'));
  console.log('  rm -rf node_modules');
  console.log('  npm install');
}

console.log(chalk.blue('\n=======================================')); 