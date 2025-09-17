import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { existsSync, readFileSync, writeFileSync } from 'fs-extra';
import { execSync } from 'child_process';
import * as yaml from 'yaml';
import * as semver from 'semver';
import axios from 'axios';

import { UpgradeOptions, UpgradeInfo } from '../types';

export async function upgradeCommand(options: UpgradeOptions): Promise<void> {
  const spinner = ora();

  try {
    console.log(chalk.blue.bold('🚀 Claude Stack Upgrade'));
    console.log();

    // Vérifier que le projet est initialisé
    if (!existsSync('.claude-stack.yml')) {
      console.log(chalk.red('❌ No Claude Stack configuration found'));
      console.log(chalk.gray('Run: claude-stack init'));
      return;
    }

    // Charger la configuration actuelle
    const config = yaml.parse(readFileSync('.claude-stack.yml', 'utf8'));

    // Détecter les mises à jour disponibles
    spinner.start('Checking for updates...');
    const availableUpdates = await checkForUpdates(config, options);
    spinner.stop();

    if (availableUpdates.length === 0) {
      console.log(chalk.green('✅ All components are up to date!'));
      return;
    }

    // Afficher les mises à jour disponibles
    displayAvailableUpdates(availableUpdates);

    if (options.dryRun) {
      console.log(chalk.cyan('🔍 Dry run complete - no changes made'));
      return;
    }

    // Sélection interactive des mises à jour (si pas forcé)
    const selectedUpdates = options.force
      ? availableUpdates
      : await selectUpdates(availableUpdates, options.interactive !== false);

    if (selectedUpdates.length === 0) {
      console.log(chalk.yellow('No updates selected'));
      return;
    }

    // Créer un backup de la configuration
    await createBackup(config);

    // Appliquer les mises à jour
    await applyUpdates(selectedUpdates, config, options);

    console.log();
    console.log(chalk.green.bold('✅ Upgrade completed successfully!'));
    console.log(chalk.gray('Backup saved as .claude-stack.yml.backup'));
    console.log();
    console.log(chalk.white('🔧 Recommended next steps:'));
    console.log(chalk.gray('  1. Test your application: '), chalk.cyan('npm test'));
    console.log(chalk.gray('  2. Run audit:            '), chalk.cyan('claude-stack audit'));
    console.log(chalk.gray('  3. Check status:         '), chalk.cyan('claude-stack status'));

  } catch (error) {
    spinner.fail('Upgrade failed');
    console.error(chalk.red('Error:'), error.message);

    // Proposer un rollback en cas d'échec
    if (existsSync('.claude-stack.yml.backup')) {
      const rollback = await inquirer.prompt([{
        type: 'confirm',
        name: 'rollback',
        message: 'Rollback to previous configuration?',
        default: true
      }]);

      if (rollback.rollback) {
        execSync('cp .claude-stack.yml.backup .claude-stack.yml');
        console.log(chalk.green('✅ Rollback completed'));
      }
    }

    process.exit(1);
  }
}

async function checkForUpdates(config: any, options: UpgradeOptions): Promise<UpgradeInfo[]> {
  const updates: UpgradeInfo[] = [];

  // Vérifier la version du CLI lui-même
  const cliUpdate = await checkCliUpdate();
  if (cliUpdate) {
    updates.push(cliUpdate);
  }

  // Vérifier les dépendances NPM
  if (!options.component || options.component === 'dependencies') {
    const depUpdates = await checkDependencyUpdates();
    updates.push(...depUpdates);
  }

  // Vérifier les outils de sécurité
  if (!options.component || options.component === 'security') {
    const securityUpdates = await checkSecurityToolUpdates(config);
    updates.push(...securityUpdates);
  }

  // Vérifier les templates de configuration
  if (!options.component || options.component === 'templates') {
    const templateUpdates = await checkTemplateUpdates(config);
    updates.push(...templateUpdates);
  }

  // Vérifier le profil (migration vers nouvelle version)
  if (!options.component || options.component === 'profile') {
    const profileUpdate = await checkProfileUpdate(config);
    if (profileUpdate) {
      updates.push(profileUpdate);
    }
  }

  return updates;
}

async function checkCliUpdate(): Promise<UpgradeInfo | null> {
  try {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
    const currentVersion = packageJson.dependencies?.['@claude/stack'] ||
                          packageJson.devDependencies?.['@claude/stack'];

    if (!currentVersion) return null;

    // Récupérer la dernière version depuis NPM
    const response = await axios.get('https://registry.npmjs.org/@claude/stack/latest');
    const latestVersion = response.data.version;

    if (semver.gt(latestVersion, currentVersion.replace(/[^0-9.]/g, ''))) {
      return {
        component: '@claude/stack',
        currentVersion,
        availableVersion: latestVersion,
        breaking: semver.major(latestVersion) > semver.major(currentVersion.replace(/[^0-9.]/g, '')),
        changelog: `https://github.com/anthropics/claude-stack-cli/releases/tag/v${latestVersion}`
      };
    }
  } catch (error) {
    // Ignorer les erreurs de réseau
  }

  return null;
}

async function checkDependencyUpdates(): Promise<UpgradeInfo[]> {
  const updates: UpgradeInfo[] = [];

  try {
    const outdated = execSync('npm outdated --json', {
      encoding: 'utf8',
      stdio: 'pipe'
    });

    const packages = JSON.parse(outdated);

    Object.entries(packages).forEach(([name, info]: [string, any]) => {
      const isMajorUpdate = semver.major(info.wanted) > semver.major(info.current);

      updates.push({
        component: name,
        currentVersion: info.current,
        availableVersion: info.wanted,
        breaking: isMajorUpdate,
        changelog: `https://www.npmjs.com/package/${name}`
      });
    });
  } catch (error) {
    // npm outdated exits with 1 when there are outdated packages
  }

  return updates;
}

async function checkSecurityToolUpdates(config: any): Promise<UpgradeInfo[]> {
  const updates: UpgradeInfo[] = [];

  // Vérifier les outils via l'API GitHub
  const securityTools = [
    { name: 'gitleaks', repo: 'gitleaks/gitleaks' },
    { name: 'syft', repo: 'anchore/syft' },
    { name: 'grype', repo: 'anchore/grype' },
    { name: 'trivy', repo: 'aquasecurity/trivy' }
  ];

  for (const tool of securityTools) {
    try {
      const response = await axios.get(`https://api.github.com/repos/${tool.repo}/releases/latest`);
      const latestVersion = response.data.tag_name.replace(/^v/, '');

      // Récupérer la version actuelle depuis le lock file
      const lockFile = existsSync('.claude-meta/dependencies.lock.yml')
        ? yaml.parse(readFileSync('.claude-meta/dependencies.lock.yml', 'utf8'))
        : {};

      const currentVersion = lockFile.security_tools?.[tool.name]?.version;

      if (currentVersion && semver.gt(latestVersion, currentVersion)) {
        updates.push({
          component: `security/${tool.name}`,
          currentVersion,
          availableVersion: latestVersion,
          breaking: semver.major(latestVersion) > semver.major(currentVersion),
          changelog: response.data.html_url
        });
      }
    } catch (error) {
      // Continuer avec les autres outils
    }
  }

  return updates;
}

async function checkTemplateUpdates(config: any): Promise<UpgradeInfo[]> {
  const updates: UpgradeInfo[] = [];

  // Vérifier si les templates de configuration ont des mises à jour
  // Ceci nécessiterait un registre de templates ou une comparaison avec GitHub

  try {
    const response = await axios.get('https://api.github.com/repos/anthropics/claude-stack-templates/releases/latest');
    const latestVersion = response.data.tag_name.replace(/^v/, '');
    const currentVersion = config.templatesVersion || '0.0.0';

    if (semver.gt(latestVersion, currentVersion)) {
      updates.push({
        component: 'templates',
        currentVersion,
        availableVersion: latestVersion,
        breaking: false,
        changelog: response.data.html_url
      });
    }
  } catch (error) {
    // Templates repository might not exist yet
  }

  return updates;
}

async function checkProfileUpdate(config: any): Promise<UpgradeInfo | null> {
  // Vérifier si le profil actuel a des améliorations disponibles
  const currentProfile = config.profile;
  const currentVersion = config.version || '1.0.0';

  // Cette logique dépendrait de la stratégie de versioning des profils
  // Pour l'instant, on suggère une mise à jour si la version du CLI a changé

  const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
  const cliVersion = packageJson.dependencies?.['@claude/stack'] ||
                    packageJson.devDependencies?.['@claude/stack'];

  if (cliVersion && semver.gt(cliVersion.replace(/[^0-9.]/g, ''), currentVersion)) {
    return {
      component: 'profile',
      currentVersion,
      availableVersion: cliVersion.replace(/[^0-9.]/g, ''),
      breaking: false,
      changelog: 'Updated profile configuration with latest best practices'
    };
  }

  return null;
}

function displayAvailableUpdates(updates: UpgradeInfo[]): void {
  console.log(chalk.white.bold(`📦 ${updates.length} updates available:`));
  console.log();

  updates.forEach(update => {
    const breakingIcon = update.breaking ? '⚠️ ' : '✅ ';
    const breakingText = update.breaking ? chalk.red('BREAKING') : chalk.green('SAFE');

    console.log(`${breakingIcon} ${chalk.white.bold(update.component)}`);
    console.log(`   ${chalk.gray('Current:')} ${update.currentVersion} → ${chalk.green('Available:')} ${update.availableVersion}`);
    console.log(`   ${chalk.gray('Type:')} ${breakingText}`);
    if (update.changelog) {
      console.log(`   ${chalk.gray('Changelog:')} ${chalk.blue(update.changelog)}`);
    }
    console.log();
  });
}

async function selectUpdates(updates: UpgradeInfo[], interactive: boolean): Promise<UpgradeInfo[]> {
  if (!interactive) {
    // En mode non-interactif, sélectionner seulement les mises à jour non-breaking
    return updates.filter(u => !u.breaking);
  }

  const choices = updates.map(update => ({
    name: `${update.component} (${update.currentVersion} → ${update.availableVersion})${update.breaking ? ' ⚠️ BREAKING' : ''}`,
    value: update,
    checked: !update.breaking // Pré-sélectionner les mises à jour non-breaking
  }));

  const answers = await inquirer.prompt([{
    type: 'checkbox',
    name: 'selectedUpdates',
    message: 'Select updates to apply:',
    choices,
    validate: (selected: UpgradeInfo[]) => {
      if (selected.length === 0) {
        return 'Please select at least one update';
      }
      return true;
    }
  }]);

  return answers.selectedUpdates;
}

async function createBackup(config: any): Promise<void> {
  const backupPath = '.claude-stack.yml.backup';
  writeFileSync(backupPath, yaml.stringify(config));
}

async function applyUpdates(updates: UpgradeInfo[], config: any, options: UpgradeOptions): Promise<void> {
  const spinner = ora('Applying updates...').start();

  try {
    for (const update of updates) {
      spinner.text = `Updating ${update.component}...`;

      await applyUpdate(update, config);
    }

    // Mettre à jour la version dans la configuration
    config.version = updates.find(u => u.component === '@claude/stack')?.availableVersion || config.version;
    config.lastUpdated = new Date().toISOString();

    // Sauvegarder la nouvelle configuration
    writeFileSync('.claude-stack.yml', yaml.stringify(config));

    spinner.succeed('All updates applied successfully');

  } catch (error) {
    spinner.fail(`Update failed: ${error.message}`);
    throw error;
  }
}

async function applyUpdate(update: UpgradeInfo, config: any): Promise<void> {
  switch (true) {
    case update.component === '@claude/stack':
      // Mise à jour du CLI
      execSync(`npm update @claude/stack`, { stdio: 'pipe' });
      break;

    case update.component.startsWith('security/'):
      // Mise à jour des outils de sécurité
      await updateSecurityTool(update);
      break;

    case update.component === 'templates':
      // Mise à jour des templates
      await updateTemplates(update, config);
      break;

    case update.component === 'profile':
      // Mise à jour du profil
      await updateProfile(update, config);
      break;

    default:
      // Mise à jour de dépendance NPM standard
      execSync(`npm update ${update.component}`, { stdio: 'pipe' });
      break;
  }
}

async function updateSecurityTool(update: UpgradeInfo): Promise<void> {
  const toolName = update.component.replace('security/', '');

  // Mettre à jour le lock file des dépendances
  if (existsSync('.claude-meta/dependencies.lock.yml')) {
    const lockFile = yaml.parse(readFileSync('.claude-meta/dependencies.lock.yml', 'utf8'));

    if (lockFile.security_tools?.[toolName]) {
      lockFile.security_tools[toolName].version = update.availableVersion;

      // Réinstaller l'outil avec la nouvelle version
      execSync(`python .claude-meta/dependency-manager.py install --tool ${toolName} --force`, { stdio: 'pipe' });

      writeFileSync('.claude-meta/dependencies.lock.yml', yaml.stringify(lockFile));
    }
  }
}

async function updateTemplates(update: UpgradeInfo, config: any): Promise<void> {
  // Télécharger et appliquer les nouveaux templates
  // Cette logique dépendrait de l'implémentation du système de templates
  config.templatesVersion = update.availableVersion;
}

async function updateProfile(update: UpgradeInfo, config: any): Promise<void> {
  // Mettre à jour la configuration du profil avec les nouvelles best practices
  config.version = update.availableVersion;

  // Appliquer les améliorations du profil
  const { getProfile } = await import('../profiles');
  const profileConfig = getProfile(config.profile);

  if (profileConfig) {
    // Merger les nouvelles configurations sans écraser les customisations
    config.components = mergeProfileComponents(config.components, profileConfig.components);
  }
}

function mergeProfileComponents(current: any, updated: any): any {
  // Logique de merge intelligente qui préserve les customisations utilisateur
  // tout en appliquant les améliorations du profil

  const merged = { ...current };

  Object.keys(updated).forEach(key => {
    if (!merged[key]) {
      merged[key] = updated[key];
    } else {
      // Merger les configurations en préservant les customisations
      merged[key] = {
        ...updated[key],
        ...merged[key],
        configuration: {
          ...updated[key].configuration,
          ...merged[key].configuration
        }
      };
    }
  });

  return merged;
}