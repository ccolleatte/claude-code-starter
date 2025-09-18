#!/usr/bin/env node
/**
 * Claude Starter Kit - Setup Wizard
 * Interactive setup tool for configuring API keys and services
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const https = require('https');

class SetupWizard {
    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        this.envPath = '.env';
        this.envExamplePath = '.env.example';
        this.config = {};
        this.requiredKeys = [
            {
                key: 'ANTHROPIC_API_KEY',
                name: 'Anthropic Claude API',
                format: /^sk-ant-api03-[A-Za-z0-9_-]{95}$/,
                testEndpoint: 'api.anthropic.com',
                helpUrl: 'https://console.anthropic.com/account/keys'
            },
            {
                key: 'EXA_API_KEY', 
                name: 'Exa Search API',
                format: /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/,
                testEndpoint: 'api.exa.ai',
                helpUrl: 'https://dashboard.exa.ai/api-keys'
            },
            {
                key: 'OPENAI_API_KEY',
                name: 'OpenAI API (optional)',
                format: /^sk-[A-Za-z0-9]{48}$/,
                testEndpoint: 'api.openai.com',
                helpUrl: 'https://platform.openai.com/api-keys',
                optional: true
            }
        ];
    }

    async start() {
        console.log('🚀 Claude Starter Kit - Setup Wizard');
        console.log('====================================\\n');
        
        try {
            await this.copyEnvExample();
            await this.collectApiKeys();
            await this.testConnectivity();
            await this.showNextSteps();
        } catch (error) {
            console.error('❌ Setup failed:', error.message);
            process.exit(1);
        } finally {
            this.rl.close();
        }
    }

    async copyEnvExample() {
        console.log('📋 Step 1: Environment Setup');
        
        if (!fs.existsSync(this.envExamplePath)) {
            throw new Error(`${this.envExamplePath} not found`);
        }

        if (fs.existsSync(this.envPath)) {
            const answer = await this.question(`⚠️  .env already exists. Overwrite? (y/N): `);
            if (answer.toLowerCase() !== 'y') {
                console.log('✅ Using existing .env file\\n');
                this.loadExistingEnv();
                return;
            }
        }

        fs.copyFileSync(this.envExamplePath, this.envPath);
        console.log('✅ Copied .env.example to .env\\n');
    }

    loadExistingEnv() {
        try {
            const envContent = fs.readFileSync(this.envPath, 'utf8');
            const lines = envContent.split('\\n');
            
            lines.forEach(line => {
                const match = line.match(/^([A-Z_]+)=(.*)$/);
                if (match) {
                    this.config[match[1]] = match[2];
                }
            });
        } catch (error) {
            console.log('⚠️  Could not read existing .env file');
        }
    }

    async collectApiKeys() {
        console.log('🔑 Step 2: API Keys Configuration');
        console.log('Please provide your API keys (paste and press Enter):\\n');

        for (const keyInfo of this.requiredKeys) {
            await this.collectSingleKey(keyInfo);
        }

        await this.saveEnvFile();
    }

    async collectSingleKey(keyInfo) {
        const existing = this.config[keyInfo.key];
        let displayValue = '';
        
        if (existing && existing !== `your_${keyInfo.key.toLowerCase()}_here`) {
            displayValue = ` (current: ${existing.substring(0, 8)}...)`;
        }

        const prompt = keyInfo.optional 
            ? `🔹 ${keyInfo.name}${displayValue} [OPTIONAL]: `
            : `🔸 ${keyInfo.name}${displayValue}: `;

        while (true) {
            const value = await this.question(prompt);
            
            // Skip if optional and empty
            if (keyInfo.optional && !value.trim()) {
                console.log('   ⏭️  Skipped (optional)\\n');
                break;
            }

            // Keep existing if just pressed Enter
            if (!value.trim() && existing) {
                console.log('   ✅ Keeping existing value\\n');
                break;
            }

            // Validate format
            if (this.validateKeyFormat(value, keyInfo.format)) {
                this.config[keyInfo.key] = value.trim();
                console.log('   ✅ Valid format\\n');
                break;
            } else {
                console.log(`   ❌ Invalid format. Expected pattern: ${keyInfo.format}`);
                console.log(`   💡 Get your key at: ${keyInfo.helpUrl}\\n`);
                
                if (keyInfo.optional) {
                    const skip = await this.question('   Skip this optional key? (y/N): ');
                    if (skip.toLowerCase() === 'y') break;
                }
            }
        }
    }

    validateKeyFormat(value, pattern) {
        if (!value || !value.trim()) return false;
        return pattern.test(value.trim());
    }

    async saveEnvFile() {
        try {
            const envExample = fs.readFileSync(this.envExamplePath, 'utf8');
            let envContent = envExample;

            // Replace values in template
            for (const [key, value] of Object.entries(this.config)) {
                const regex = new RegExp(`^${key}=.*$`, 'm');
                envContent = envContent.replace(regex, `${key}=${value}`);
            }

            fs.writeFileSync(this.envPath, envContent);
            console.log('✅ Configuration saved to .env\\n');
        } catch (error) {
            throw new Error(`Failed to save .env: ${error.message}`);
        }
    }

    async testConnectivity() {
        console.log('🔗 Step 3: Testing API Connectivity');
        
        for (const keyInfo of this.requiredKeys) {
            const apiKey = this.config[keyInfo.key];
            
            if (!apiKey || apiKey.includes('your_') || keyInfo.optional) {
                console.log(`⏭️  Skipping ${keyInfo.name} connectivity test`);
                continue;
            }

            console.log(`🔍 Testing ${keyInfo.name}...`);
            
            try {
                const isConnected = await this.testApiEndpoint(keyInfo.testEndpoint, apiKey);
                if (isConnected) {
                    console.log(`   ✅ ${keyInfo.name} - Connected successfully`);
                } else {
                    console.log(`   ⚠️  ${keyInfo.name} - Connection test failed (API might still work)`);
                }
            } catch (error) {
                console.log(`   ⚠️  ${keyInfo.name} - Could not test connectivity: ${error.message}`);
            }
        }
        console.log('');
    }

    async testApiEndpoint(endpoint, apiKey) {
        return new Promise((resolve) => {
            const options = {
                hostname: endpoint,
                port: 443,
                path: '/',
                method: 'HEAD',
                timeout: 5000,
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'User-Agent': 'claude-starter-kit-setup/1.0'
                }
            };

            const req = https.request(options, (res) => {
                resolve(res.statusCode < 500); // Any non-server-error is considered success
            });

            req.on('error', () => resolve(false));
            req.on('timeout', () => {
                req.destroy();
                resolve(false);
            });

            req.setTimeout(5000);
            req.end();
        });
    }

    async showNextSteps() {
        console.log('🎉 Setup Complete!');
        console.log('=================\\n');
        
        console.log('📋 Next Steps:');
        console.log('1. Verify your configuration:');
        console.log('   npm run check:env');
        console.log('');
        console.log('2. Run validation tests:');
        console.log('   npm run validate');
        console.log('');
        console.log('3. Start using Claude Code:');
        console.log('   - Check .claude/CLAUDE.md for workflows');
        console.log('   - Run npm test to validate setup');
        console.log('   - Explore docs/ for advanced configuration');
        console.log('');
        
        if (this.config.ANTHROPIC_API_KEY) {
            console.log('🤖 Claude API configured - Ready for AI assistance!');
        }
        
        if (this.config.EXA_API_KEY) {
            console.log('🔍 Exa Search configured - Web research enabled!');
        }
        
        console.log('\\n📚 Documentation: README.md');
        console.log('🆘 Support: See .claude/CLAUDE-VALIDATION.md for troubleshooting');
        console.log('\\n✨ Happy coding with Claude Starter Kit! ✨');
    }

    question(prompt) {
        return new Promise((resolve) => {
            this.rl.question(prompt, resolve);
        });
    }
}

// Execute if run directly
if (require.main === module) {
    const wizard = new SetupWizard();
    wizard.start().catch(error => {
        console.error('Setup wizard failed:', error);
        process.exit(1);
    });
}

module.exports = SetupWizard;