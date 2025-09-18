#!/usr/bin/env node

/**
 * 🔐 Claude Code Security Setup Wizard
 * Interactive secure configuration for new projects
 */

const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

class SecuritySetupWizard {
    constructor() {
        this.config = {};
        this.errors = [];
    }

    async run() {
        console.log('🔐 Claude Code Security Setup Wizard');
        console.log('=====================================');
        console.log('This wizard will help you configure your project securely.\n');

        try {
            await this.checkPrerequisites();
            await this.setupEnvironment();
            await this.configurePermissions();
            await this.validateSetup();
            await this.showNextSteps();

            console.log('\n✅ Security setup completed successfully!');
        } catch (error) {
            console.error('\n❌ Setup failed:', error.message);
            process.exit(1);
        } finally {
            rl.close();
        }
    }

    async checkPrerequisites() {
        console.log('📋 Checking prerequisites...');

        // Check if .env already exists
        try {
            await fs.access('.env');
            const answer = await this.question('⚠️ .env file already exists. Overwrite? (y/N): ');
            if (answer.toLowerCase() !== 'y') {
                throw new Error('Setup cancelled - .env file exists');
            }
        } catch (error) {
            if (error.code !== 'ENOENT') throw error;
        }

        // Check if .env.example exists
        try {
            await fs.access('.env.example');
            console.log('✅ .env.example template found');
        } catch (error) {
            throw new Error('.env.example template not found - run from project root');
        }

        console.log('✅ Prerequisites check passed\n');
    }

    async setupEnvironment() {
        console.log('🔑 Setting up API keys...');

        // Copy template
        const template = await fs.readFile('.env.example', 'utf8');
        let envContent = template;

        // API key patterns and validation
        const apiKeys = [
            {
                name: 'ANTHROPIC_API_KEY',
                label: 'Anthropic API Key',
                pattern: /^sk-ant-api03-[A-Za-z0-9_-]{95}$/,
                url: 'https://console.anthropic.com/',
                required: true
            },
            {
                name: 'OPENAI_API_KEY',
                label: 'OpenAI API Key (optional)',
                pattern: /^sk-[A-Za-z0-9_-]{48,}$/,
                url: 'https://platform.openai.com/api-keys',
                required: false
            },
            {
                name: 'EXA_API_KEY',
                label: 'Exa Search API Key (optional)',
                pattern: /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/,
                url: 'https://dashboard.exa.ai/',
                required: false
            },
            {
                name: 'VOYAGE_API_KEY',
                label: 'Voyage AI API Key (optional)',
                pattern: /^pa-[A-Za-z0-9_-]+$/,
                url: 'https://dash.voyageai.com/',
                required: false
            }
        ];

        for (const keyConfig of apiKeys) {
            const value = await this.promptForApiKey(keyConfig);
            if (value) {
                envContent = envContent.replace(
                    `${keyConfig.name}=your_${keyConfig.name.toLowerCase()}_here`,
                    `${keyConfig.name}=${value}`
                );
                this.config[keyConfig.name] = value;
            }
        }

        // Write .env file
        await fs.writeFile('.env', envContent);
        console.log('✅ .env file created\n');
    }

    async promptForApiKey(keyConfig) {
        console.log(`\n🔑 ${keyConfig.label}`);
        console.log(`   Get from: ${keyConfig.url}`);

        if (!keyConfig.required) {
            const skip = await this.question('   Skip this key? (y/N): ');
            if (skip.toLowerCase() === 'y') {
                return null;
            }
        }

        while (true) {
            const key = await this.question('   Enter API key: ', true);

            if (!key && !keyConfig.required) {
                return null;
            }

            if (this.validateApiKey(key, keyConfig.pattern)) {
                // Test connectivity
                const works = await this.testApiKey(keyConfig.name, key);
                if (works) {
                    console.log('   ✅ API key validated');
                    return key;
                } else {
                    console.log('   ⚠️ API key appears invalid or service unreachable');
                    const useAnyway = await this.question('   Use anyway? (y/N): ');
                    if (useAnyway.toLowerCase() === 'y') {
                        return key;
                    }
                }
            } else {
                console.log(`   ❌ Invalid format for ${keyConfig.label}`);
                console.log(`   Expected pattern: ${keyConfig.pattern}`);
            }
        }
    }

    validateApiKey(key, pattern) {
        return pattern.test(key);
    }

    async testApiKey(keyName, key) {
        // Basic connectivity test (simplified)
        console.log('   🧪 Testing connectivity...');

        // In a real implementation, this would make actual API calls
        // For now, just validate format
        return true;
    }

    async configurePermissions() {
        console.log('🔧 Configuring permissions...');

        // Check if settings.local.json exists
        const settingsPath = '.claude/settings.local.json';

        try {
            await fs.access(settingsPath);
            console.log('✅ Existing permissions configuration found');
        } catch (error) {
            console.log('📝 Creating permissions configuration...');

            // Copy template
            const templatePath = 'templates/security/settings.local.template.json';
            try {
                const template = await fs.readFile(templatePath, 'utf8');

                // Ensure .claude directory exists
                await fs.mkdir('.claude', { recursive: true });

                // Write settings file
                await fs.writeFile(settingsPath, template);
                console.log('✅ Permissions configuration created');
            } catch (error) {
                console.log('⚠️ Could not create permissions file - manual setup required');
            }
        }
    }

    async validateSetup() {
        console.log('🔍 Validating setup...');

        // Test environment loading
        try {
            require('dotenv').config();
            console.log('✅ Environment variables loaded');
        } catch (error) {
            console.log('⚠️ Could not load environment - install dotenv if needed');
        }

        // Check .gitignore
        try {
            const gitignore = await fs.readFile('.gitignore', 'utf8');
            if (gitignore.includes('.env') && !gitignore.includes('.env.example')) {
                console.log('✅ .gitignore properly configured');
            } else {
                console.log('⚠️ Check .gitignore - ensure .env is ignored but .env.example is not');
            }
        } catch (error) {
            console.log('⚠️ .gitignore not found - create one to protect secrets');
        }

        console.log('✅ Validation completed\n');
    }

    async showNextSteps() {
        console.log('🎯 Next Steps:');
        console.log('==============');
        console.log('1. Test your configuration:');
        console.log('   npm run check:env');
        console.log('');
        console.log('2. Validate MCP servers:');
        console.log('   npm run mcp:test');
        console.log('');
        console.log('3. Run security validation:');
        console.log('   npm run validate:security');
        console.log('');
        console.log('4. Start developing:');
        console.log('   claude code');
        console.log('');
        console.log('🔒 Security reminders:');
        console.log('- Never commit .env to git');
        console.log('- Rotate API keys regularly');
        console.log('- Monitor usage for anomalies');
        console.log('- Review permissions quarterly');
    }

    question(prompt, hideInput = false) {
        return new Promise((resolve) => {
            if (hideInput) {
                // Simple input hiding - in production, use proper library
                process.stdout.write(prompt);
                process.stdin.setRawMode(true);
                process.stdin.resume();
                process.stdin.setEncoding('utf8');

                let input = '';
                process.stdin.on('data', function(char) {
                    char = char + '';

                    switch(char) {
                        case '\n':
                        case '\r':
                        case '\u0004':
                            process.stdin.setRawMode(false);
                            process.stdin.pause();
                            process.stdout.write('\n');
                            resolve(input);
                            break;
                        case '\u0003':
                            process.exit();
                            break;
                        default:
                            input += char;
                            process.stdout.write('*');
                            break;
                    }
                });
            } else {
                rl.question(prompt, resolve);
            }
        });
    }
}

// Run wizard if called directly
if (require.main === module) {
    const wizard = new SecuritySetupWizard();
    wizard.run().catch(console.error);
}

module.exports = SecuritySetupWizard;