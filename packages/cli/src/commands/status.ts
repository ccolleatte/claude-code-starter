import chalk from 'chalk';
import { existsSync, readFileSync } from 'fs-extra';
import { execSync } from 'child_process';
import * as yaml from 'yaml';

export async function statusCommand(options: any): Promise<void> {
  console.log(chalk.blue.bold('📊 Claude Stack Status'));
  console.log();

  try {
    // Vérifier l'initialisation
    if (!existsSync('.claude-stack.yml')) {
      console.log(chalk.red('❌ Claude Stack not initialized'));
      console.log(chalk.gray('Run: claude-stack init'));
      return;
    }

    const config = yaml.parse(readFileSync('.claude-stack.yml', 'utf8'));

    // Informations générales
    displayGeneralInfo(config);

    // Statut des composants
    await displayComponentStatus(config, options.verbose);

    // Métriques de qualité
    await displayQualityMetrics(options.verbose);

    // Statut des outils
    await displayToolStatus(config, options.verbose);

    // Recommandations
    displayRecommendations(config);

  } catch (error) {
    console.error(chalk.red('Error checking status:'), error.message);
    process.exit(1);
  }
}

function displayGeneralInfo(config: any): void {
  console.log(chalk.white.bold('🏗️  Project Information:'));
  console.log(`   Name: ${chalk.cyan(config.name || 'Unknown')}`);
  console.log(`   Profile: ${chalk.cyan(config.profile.toUpperCase())}`);
  console.log(`   Version: ${chalk.cyan(config.version || '1.0.0')}`);
  console.log(`   Last Updated: ${chalk.gray(config.lastUpdated || 'Unknown')}`);
  console.log();
}

async function displayComponentStatus(config: any, verbose: boolean): Promise<void> {
  console.log(chalk.white.bold('🔧 Component Status:'));

  const components = ['testing', 'security', 'quality', 'observability', 'governance'];

  for (const component of components) {
    const status = await checkComponentStatus(component, config);
    const icon = status.healthy ? '✅' : '❌';
    const color = status.healthy ? 'green' : 'red';

    console.log(`   ${icon} ${chalk.white(component)}: ${chalk[color](status.status)}`);

    if (verbose && status.details) {
      status.details.forEach((detail: string) => {
        console.log(`      ${chalk.gray('•')} ${detail}`);
      });
    }
  }
  console.log();
}

async function checkComponentStatus(component: string, config: any): Promise<any> {
  switch (component) {
    case 'testing':
      return checkTestingStatus();
    case 'security':
      return checkSecurityStatus(config);
    case 'quality':
      return checkQualityStatus();
    case 'observability':
      return checkObservabilityStatus(config);
    case 'governance':
      return checkGovernanceStatus(config);
    default:
      return { healthy: false, status: 'Unknown', details: [] };
  }
}

function checkTestingStatus(): any {
  const details: string[] = [];
  let healthy = true;

  // Vérifier la présence de tests
  const hasTests = existsSync('test') || existsSync('tests') || existsSync('src/__tests__');
  if (!hasTests) {
    healthy = false;
    details.push('No test directory found');
  } else {
    details.push('Test directory exists');
  }

  // Vérifier la configuration Jest/Pytest
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
  if (packageJson.scripts?.test) {
    details.push('Test script configured');
  } else {
    healthy = false;
    details.push('No test script found');
  }

  return {
    healthy,
    status: healthy ? 'Operational' : 'Issues detected',
    details
  };
}

function checkSecurityStatus(config: any): any {
  const details: string[] = [];
  let healthy = true;

  // Vérifier npm audit
  try {
    execSync('npm audit --audit-level=high', { stdio: 'pipe' });
    details.push('No high/critical npm vulnerabilities');
  } catch {
    healthy = false;
    details.push('High/critical npm vulnerabilities detected');
  }

  // Vérifier la présence de .gitignore
  if (existsSync('.gitignore')) {
    details.push('.gitignore configured');
  } else {
    healthy = false;
    details.push('.gitignore missing');
  }

  // Vérifier les outils de sécurité
  if (config.profile !== 'starter') {
    const securityTools = ['semgrep', 'gitleaks'];
    securityTools.forEach(tool => {
      if (existsSync(`node_modules/.bin/${tool}`)) {
        details.push(`${tool} installed`);
      } else {
        details.push(`${tool} not found`);
      }
    });
  }

  return {
    healthy,
    status: healthy ? 'Secure' : 'Vulnerabilities detected',
    details
  };
}

function checkQualityStatus(): any {
  const details: string[] = [];
  let healthy = true;

  // Vérifier ESLint
  if (existsSync('.eslintrc.json') || existsSync('.eslintrc.js')) {
    details.push('ESLint configured');

    try {
      execSync('npx eslint . --quiet', { stdio: 'pipe' });
      details.push('No ESLint violations');
    } catch {
      details.push('ESLint violations detected');
    }
  } else {
    healthy = false;
    details.push('ESLint not configured');
  }

  // Vérifier Prettier
  if (existsSync('.prettierrc') || existsSync('.prettierrc.json')) {
    details.push('Prettier configured');
  } else {
    details.push('Prettier not configured');
  }

  return {
    healthy,
    status: healthy ? 'Good quality' : 'Quality issues',
    details
  };
}

function checkObservabilityStatus(config: any): any {
  const details: string[] = [];
  let healthy = true;

  if (config.profile === 'starter') {
    return {
      healthy: true,
      status: 'Not applicable',
      details: ['Observability not included in starter profile']
    };
  }

  // Vérifier la configuration de logging
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
  const hasLogging = packageJson.dependencies?.winston ||
                    packageJson.dependencies?.pino ||
                    packageJson.devDependencies?.winston ||
                    packageJson.devDependencies?.pino;

  if (hasLogging) {
    details.push('Logging library configured');
  } else {
    healthy = false;
    details.push('No logging library found');
  }

  return {
    healthy,
    status: healthy ? 'Monitoring active' : 'Limited observability',
    details
  };
}

function checkGovernanceStatus(config: any): any {
  const details: string[] = [];
  let healthy = true;

  if (config.profile !== 'enterprise') {
    return {
      healthy: true,
      status: 'Not applicable',
      details: ['Governance only included in enterprise profile']
    };
  }

  // Vérifier les policies OPA
  if (existsSync('policy') || existsSync('.opa')) {
    details.push('Policy directory found');
  } else {
    healthy = false;
    details.push('No policy configuration found');
  }

  return {
    healthy,
    status: healthy ? 'Governed' : 'Governance gaps',
    details
  };
}

async function displayQualityMetrics(verbose: boolean): Promise<void> {
  console.log(chalk.white.bold('📈 Quality Metrics:'));

  try {
    // Coverage
    const coverage = await getCoverageInfo();
    if (coverage) {
      const coverageColor = coverage.percentage >= 80 ? 'green' :
                           coverage.percentage >= 60 ? 'yellow' : 'red';
      console.log(`   📊 Coverage: ${chalk[coverageColor](coverage.percentage + '%')}`);
    }

    // Complexité (si disponible)
    console.log(`   🔧 Complexity: ${chalk.gray('Not available')}`);

    // Technical debt (estimation)
    console.log(`   💳 Tech Debt: ${chalk.gray('Not available')}`);

  } catch (error) {
    console.log(`   ${chalk.gray('Quality metrics not available')}`);
  }

  console.log();
}

async function getCoverageInfo(): Promise<any> {
  try {
    // Essayer de lire le rapport de coverage Jest
    if (existsSync('coverage/coverage-summary.json')) {
      const summary = JSON.parse(readFileSync('coverage/coverage-summary.json', 'utf8'));
      return {
        percentage: Math.round(summary.total.lines.pct || 0)
      };
    }

    // Essayer de lire le rapport Python
    if (existsSync('coverage.xml')) {
      // Parse basique du XML coverage
      const content = readFileSync('coverage.xml', 'utf8');
      const match = content.match(/line-rate="([0-9.]+)"/);
      if (match) {
        return {
          percentage: Math.round(parseFloat(match[1]) * 100)
        };
      }
    }
  } catch (error) {
    // Ignore
  }

  return null;
}

async function displayToolStatus(config: any, verbose: boolean): Promise<void> {
  console.log(chalk.white.bold('🛠️  Tool Status:'));

  const tools = [
    { name: 'node', command: 'node --version' },
    { name: 'npm', command: 'npm --version' },
    { name: 'git', command: 'git --version' },
    { name: 'python', command: 'python --version' }
  ];

  if (config.profile !== 'starter') {
    tools.push(
      { name: 'semgrep', command: 'semgrep --version' },
      { name: 'gitleaks', command: 'gitleaks version' }
    );
  }

  if (config.profile === 'enterprise') {
    tools.push(
      { name: 'syft', command: 'syft version' },
      { name: 'grype', command: 'grype version' },
      { name: 'trivy', command: 'trivy --version' }
    );
  }

  for (const tool of tools) {
    try {
      const version = execSync(tool.command, { encoding: 'utf8', stdio: 'pipe' })
        .trim().split('\n')[0];

      console.log(`   ✅ ${chalk.white(tool.name)}: ${chalk.green(version)}`);
    } catch {
      console.log(`   ❌ ${chalk.white(tool.name)}: ${chalk.red('Not found')}`);
    }
  }

  console.log();
}

function displayRecommendations(config: any): void {
  const recommendations: string[] = [];

  // Analyser et générer des recommandations
  if (!existsSync('test') && !existsSync('tests')) {
    recommendations.push('Add test directory and write tests');
  }

  if (config.profile === 'starter') {
    recommendations.push('Consider upgrading to standard profile for better security');
  }

  if (!existsSync('.github/workflows')) {
    recommendations.push('Add GitHub Actions for CI/CD automation');
  }

  if (recommendations.length > 0) {
    console.log(chalk.white.bold('💡 Recommendations:'));
    recommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec}`);
    });
    console.log();
  }

  // Actions suggérées
  console.log(chalk.white.bold('🔧 Suggested Actions:'));
  console.log(`   • Run audit: ${chalk.cyan('claude-stack audit')}`);
  console.log(`   • Check updates: ${chalk.cyan('claude-stack upgrade --dry-run')}`);
  console.log(`   • Fix issues: ${chalk.cyan('claude-stack doctor --fix')}`);
}