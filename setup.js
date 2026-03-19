const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

// Helper functions
const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const logSuccess = (message) => log(`✅ ${message}`, 'green');
const logError = (message) => log(`❌ ${message}`, 'red');
const logInfo = (message) => log(`ℹ️  ${message}`, 'blue');
const logWarning = (message) => log(`⚠️  ${message}`, 'yellow');
const logHeader = (message) => log(`\n${colors.bold}${colors.cyan}${message}${colors.reset}`);

class ProjectSetup {
  constructor() {
    this.projectRoot = __dirname;
    this.envPath = path.join(this.projectRoot, '.env');
    this.envExamplePath = path.join(this.projectRoot, '.env.example');
  }

  // Check if required files exist
  checkRequiredFiles() {
    logHeader('📁 Checking Required Files...');

    const requiredFiles = [
      'package.json',
      'server.js',
      'src/config/config.js',
      'src/config/database.js',
      '.env.example'
    ];

    let allFilesExist = true;

    requiredFiles.forEach(file => {
      const filePath = path.join(this.projectRoot, file);
      if (fs.existsSync(filePath)) {
        logSuccess(`Found ${file}`);
      } else {
        logError(`Missing ${file}`);
        allFilesExist = false;
      }
    });

    return allFilesExist;
  }

  // Check Node.js version
  checkNodeVersion() {
    logHeader('🟢 Checking Node.js Version...');

    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));

    if (majorVersion >= 18) {
      logSuccess(`Node.js version ${nodeVersion} is compatible`);
      return true;
    } else {
      logError(`Node.js version ${nodeVersion} is not supported. Please upgrade to Node.js 18 or higher.`);
      return false;
    }
  }

  // Check if dependencies are installed
  checkDependencies() {
    logHeader('📦 Checking Dependencies...');

    const nodeModulesPath = path.join(this.projectRoot, 'node_modules');

    if (fs.existsSync(nodeModulesPath)) {
      logSuccess('Dependencies are installed');
      return true;
    } else {
      logWarning('Dependencies not installed');
      return false;
    }
  }

  // Install dependencies
  installDependencies() {
    logHeader('📦 Installing Dependencies...');

    try {
      log('Running npm install...', 'yellow');
      execSync('npm install', { cwd: this.projectRoot, stdio: 'inherit' });
      logSuccess('Dependencies installed successfully');
      return true;
    } catch (error) {
      logError(`Failed to install dependencies: ${error.message}`);
      return false;
    }
  }

  // Setup environment file
  setupEnvironment() {
    logHeader('🔧 Setting up Environment Configuration...');

    if (fs.existsSync(this.envPath)) {
      logInfo('.env file already exists');
      return true;
    }

    if (!fs.existsSync(this.envExamplePath)) {
      logError('.env.example file not found');
      return false;
    }

    try {
      // Copy .env.example to .env
      const envExample = fs.readFileSync(this.envExamplePath, 'utf8');
      fs.writeFileSync(this.envPath, envExample);
      logSuccess('Created .env file from template');

      log('\n📝 Important: Please update the following values in your .env file:', 'yellow');
      log('   • MONGODB_URI - Your MongoDB Atlas connection string', 'yellow');
      log('   • TICKETMASTER_API_KEY - Your Ticketmaster API key', 'yellow');
      log('   • SPOTIFY_CLIENT_ID - Your Spotify client ID', 'yellow');
      log('   • SPOTIFY_CLIENT_SECRET - Your Spotify client secret', 'yellow');

      return true;
    } catch (error) {
      logError(`Failed to create .env file: ${error.message}`);
      return false;
    }
  }

  // Check environment variables
  checkEnvironmentVariables() {
    logHeader('🔐 Checking Environment Variables...');

    if (!fs.existsSync(this.envPath)) {
      logWarning('.env file not found. Run setup first.');
      return false;
    }

    const envContent = fs.readFileSync(this.envPath, 'utf8');
    const lines = envContent.split('\n');

    const requiredVars = [
      'MONGODB_URI',
      'TICKETMASTER_API_KEY',
      'SPOTIFY_CLIENT_ID',
      'SPOTIFY_CLIENT_SECRET'
    ];

    const missingVars = [];
    const placeholderVars = [];

    requiredVars.forEach(varName => {
      const line = lines.find(line => line.startsWith(`${varName}=`));
      if (!line) {
        missingVars.push(varName);
      } else {
        const value = line.split('=')[1];
        if (!value || value.includes('your_') || value.includes('username:password')) {
          placeholderVars.push(varName);
        } else {
          logSuccess(`${varName} is set`);
        }
      }
    });

    if (missingVars.length > 0) {
      logError(`Missing environment variables: ${missingVars.join(', ')}`);
    }

    if (placeholderVars.length > 0) {
      logWarning(`Please update placeholder values: ${placeholderVars.join(', ')}`);
    }

    return missingVars.length === 0 && placeholderVars.length === 0;
  }

  // Test basic server startup
  async testServerStartup() {
    logHeader('🚀 Testing Server Startup...');

    try {
      // Import the server module
      const serverModule = require('./server.js');

      log('Server module loaded successfully', 'green');

      // Try to start the server briefly
      const server = await serverModule.start();

      if (server) {
        logSuccess('Server started successfully');

        // Stop the server immediately
        await serverModule.stop();
        logSuccess('Server stopped gracefully');
        return true;
      }
    } catch (error) {
      logError(`Server startup test failed: ${error.message}`);
      return false;
    }
  }

  // Display setup instructions
  displayInstructions() {
    logHeader('📖 Setup Instructions');

    log('\n1. API Keys Setup:', 'cyan');
    log('   🎟️  Ticketmaster API:', 'blue');
    log('      • Visit: https://developer.ticketmaster.com/', 'blue');
    log('      • Create account and get Consumer Key', 'blue');
    log('      • Add key to TICKETMASTER_API_KEY in .env', 'blue');

    log('\n   🎵 Spotify API:', 'blue');
    log('      • Visit: https://developer.spotify.com/dashboard/', 'blue');
    log('      • Create app and get Client ID & Secret', 'blue');
    log('      • Add to SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env', 'blue');

    log('\n2. Database Setup:', 'cyan');
    log('   🍃 MongoDB Atlas:', 'blue');
    log('      • Visit: https://www.mongodb.com/atlas', 'blue');
    log('      • Create free cluster', 'blue');
    log('      • Create database user with ReadWrite permissions', 'blue');
    log('      • Whitelist IP address (0.0.0.0/0 for development)', 'blue');
    log('      • Get connection string and add to MONGODB_URI in .env', 'blue');

    log('\n3. Development Commands:', 'cyan');
    log('   • npm run dev    - Start development server with auto-reload', 'blue');
    log('   • npm start      - Start production server', 'blue');
    log('   • node test-api.js - Run API tests', 'blue');

    log('\n4. Deployment:', 'cyan');
    log('   • Google App Engine: gcloud app deploy', 'blue');
    log('   • Google Cloud Run: ./deploy.sh --cloud-run', 'blue');

    log('\n5. Testing Endpoints:', 'cyan');
    log('   • Health Check: http://localhost:8080/health', 'blue');
    log('   • API Info: http://localhost:8080/api/info', 'blue');
    log('   • Sample URLs: http://localhost:8080/api/sample-urls', 'blue');
  }

  // Generate project status report
  generateStatusReport() {
    logHeader('📊 Project Status Report');

    const status = {
      nodeVersion: this.checkNodeVersion(),
      requiredFiles: this.checkRequiredFiles(),
      dependencies: this.checkDependencies(),
      environment: fs.existsSync(this.envPath),
      envVariables: false
    };

    // Only check env vars if .env exists
    if (status.environment) {
      status.envVariables = this.checkEnvironmentVariables();
    }

    log('\n📋 Status Summary:', 'cyan');
    Object.entries(status).forEach(([key, value]) => {
      const icon = value ? '✅' : '❌';
      const color = value ? 'green' : 'red';
      log(`   ${icon} ${key}: ${value ? 'OK' : 'NEEDS ATTENTION'}`, color);
    });

    const readyForDevelopment = Object.values(status).every(Boolean);

    if (readyForDevelopment) {
      log('\n🎉 Project is ready for development!', 'green');
      log('   Run: npm run dev', 'green');
    } else {
      log('\n⚠️  Project needs setup before development', 'yellow');
      log('   Run: node setup.js --install', 'yellow');
    }

    return status;
  }

  // Main setup process
  async runSetup() {
    log(`\n${colors.bold}${colors.cyan}🚀 Event Manager Backend Setup${colors.reset}\n`);

    const steps = [
      { name: 'Node.js Version', fn: () => this.checkNodeVersion() },
      { name: 'Required Files', fn: () => this.checkRequiredFiles() },
      { name: 'Dependencies', fn: () => this.installDependencies() },
      { name: 'Environment', fn: () => this.setupEnvironment() }
    ];

    let allSuccessful = true;

    for (const step of steps) {
      const success = await step.fn();
      if (!success) {
        allSuccessful = false;
        break;
      }
    }

    if (allSuccessful) {
      logSuccess('\n🎉 Setup completed successfully!');
      this.displayInstructions();
    } else {
      logError('\n❌ Setup failed. Please resolve the issues above and try again.');
    }

    return allSuccessful;
  }
}

// Command line interface
async function main() {
  const setup = new ProjectSetup();
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    log('\n📖 Event Manager Backend Setup Script\n', 'cyan');
    log('Usage: node setup.js [options]\n', 'blue');
    log('Options:', 'blue');
    log('  --install, -i    Run full setup process', 'blue');
    log('  --check, -c      Check project status only', 'blue');
    log('  --env, -e        Setup environment file only', 'blue');
    log('  --test, -t       Test server startup', 'blue');
    log('  --help, -h       Show this help message', 'blue');
    log('\nExamples:', 'yellow');
    log('  node setup.js --install    # Full setup', 'yellow');
    log('  node setup.js --check      # Status check', 'yellow');
    log('  node setup.js --env        # Setup .env file', 'yellow');
    return;
  }

  if (args.includes('--install') || args.includes('-i')) {
    await setup.runSetup();
  } else if (args.includes('--check') || args.includes('-c')) {
    setup.generateStatusReport();
  } else if (args.includes('--env') || args.includes('-e')) {
    setup.setupEnvironment();
  } else if (args.includes('--test') || args.includes('-t')) {
    await setup.testServerStartup();
  } else {
    // Default: show status and offer to run setup
    const status = setup.generateStatusReport();

    if (!Object.values(status).every(Boolean)) {
      log('\n❓ Would you like to run the setup process? (Ctrl+C to cancel)', 'yellow');

      // Wait for user input (simple approach)
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.on('data', async (key) => {
        if (key[0] === 3) { // Ctrl+C
          process.exit(0);
        } else {
          process.stdin.setRawMode(false);
          process.stdin.pause();
          await setup.runSetup();
          process.exit(0);
        }
      });
    }
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    logError(`Setup script failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = ProjectSetup;
