import chalk from 'chalk';
import inquirer from 'inquirer';
import { existsSync, readFileSync, writeFileSync } from 'fs-extra';
import * as yaml from 'yaml';

import { ProfileOptions } from '../types';
import { getProfile, getAvailableProfiles, ProfileConfig } from '../profiles';
import { generateProjectStructure } from '../utils/generator';

export async function profileCommand(options: ProfileOptions): Promise<void> {
  const { action, name } = options;

  console.log(chalk.blue.bold('👤 Claude Stack Profiles'));
  console.log();

  try {
    switch (action) {
      case 'list':
        await handleListProfiles();
        break;
      case 'show':
        await handleShowProfile(name);
        break;
      case 'migrate':
        await handleMigrateProfile(name);
        break;
      case 'compare':
        await handleCompareProfiles();
        break;
      default:
        await handleInteractiveProfile();
        break;
    }
  } catch (error) {
    console.error(chalk.red('Profile operation failed:'), error.message);
    process.exit(1);
  }
}

async function handleListProfiles(): Promise<void> {
  const profiles = getAvailableProfiles();

  console.log(chalk.white.bold('📋 Available Profiles:'));
  console.log();

  profiles.forEach(profile => {
    const icon = getProfileIcon(profile.name);
    console.log(`${icon} ${chalk.cyan.bold(profile.name.toUpperCase())}`);
    console.log(`   ${chalk.gray(profile.description)}`);
    console.log();

    // Afficher les composants principaux
    console.log(chalk.white('   Components:'));
    Object.entries(profile.components).forEach(([component, config]: [string, any]) => {
      if (config.enabled) {
        const componentIcon = getComponentIcon(component);
        console.log(`     ${componentIcon} ${chalk.white(component)}`);

        if (config.tools && config.tools.length > 0) {
          console.log(`       ${chalk.gray('Tools:')} ${config.tools.join(', ')}`);
        }
      }
    });
    console.log();
  });

  // Afficher le profil actuel si on est dans un projet
  if (existsSync('.claude-stack.yml')) {
    const config = yaml.parse(readFileSync('.claude-stack.yml', 'utf8'));
    console.log(chalk.white.bold('📍 Current Profile:'));
    console.log(`   ${getProfileIcon(config.profile)} ${chalk.cyan.bold(config.profile.toUpperCase())}`);
  }
}

async function handleShowProfile(profileName?: string): Promise<void> {
  if (!profileName) {
    const profiles = getAvailableProfiles();
    const { selectedProfile } = await inquirer.prompt([{
      type: 'list',
      name: 'selectedProfile',
      message: 'Select a profile to view:',
      choices: profiles.map(p => ({
        name: `${p.name} - ${p.description}`,
        value: p.name
      }))
    }]);
    profileName = selectedProfile;
  }

  const profile = getProfile(profileName);
  if (!profile) {
    console.log(chalk.red(`Profile '${profileName}' not found`));
    return;
  }

  displayProfileDetails(profile);
}

async function handleMigrateProfile(targetProfile?: string): Promise<void> {
  // Vérifier qu'on est dans un projet Claude Stack
  if (!existsSync('.claude-stack.yml')) {
    console.log(chalk.red('❌ No Claude Stack configuration found'));
    console.log(chalk.gray('Run: claude-stack init'));
    return;
  }

  const currentConfig = yaml.parse(readFileSync('.claude-stack.yml', 'utf8'));
  const currentProfile = currentConfig.profile;

  if (!targetProfile) {
    const profiles = getAvailableProfiles();
    const availableProfiles = profiles.filter(p => p.name !== currentProfile);

    if (availableProfiles.length === 0) {
      console.log(chalk.yellow('No other profiles available for migration'));
      return;
    }

    const { selectedProfile } = await inquirer.prompt([{
      type: 'list',
      name: 'selectedProfile',
      message: `Migrate from ${currentProfile} to:`,
      choices: availableProfiles.map(p => ({
        name: `${p.name} - ${p.description}`,
        value: p.name
      }))
    }]);
    targetProfile = selectedProfile;
  }

  const targetProfileConfig = getProfile(targetProfile);
  if (!targetProfileConfig) {
    console.log(chalk.red(`Target profile '${targetProfile}' not found`));
    return;
  }

  // Analyser les changements
  const migration = analyzeMigration(currentConfig, targetProfileConfig);
  displayMigrationPlan(migration);

  // Confirmer la migration
  const { confirm } = await inquirer.prompt([{
    type: 'confirm',
    name: 'confirm',
    message: `Proceed with migration from ${currentProfile} to ${targetProfile}?`,
    default: false
  }]);

  if (!confirm) {
    console.log(chalk.yellow('Migration cancelled'));
    return;
  }

  // Créer un backup
  const backupPath = `.claude-stack.yml.backup-${Date.now()}`;
  writeFileSync(backupPath, yaml.stringify(currentConfig));

  // Effectuer la migration
  await performMigration(currentConfig, targetProfileConfig, migration);

  console.log();
  console.log(chalk.green.bold('✅ Migration completed successfully!'));
  console.log(chalk.gray(`Backup saved as: ${backupPath}`));
  console.log();
  console.log(chalk.white('🔧 Recommended next steps:'));
  console.log(chalk.gray('  1. Test your application'));
  console.log(chalk.gray('  2. Run audit: '), chalk.cyan('claude-stack audit'));
  console.log(chalk.gray('  3. Check status: '), chalk.cyan('claude-stack status'));
}

async function handleCompareProfiles(): Promise<void> {
  const profiles = getAvailableProfiles();

  const { profile1, profile2 } = await inquirer.prompt([
    {
      type: 'list',
      name: 'profile1',
      message: 'Select first profile:',
      choices: profiles.map(p => ({ name: p.name, value: p.name }))
    },
    {
      type: 'list',
      name: 'profile2',
      message: 'Select second profile:',
      choices: profiles.filter(p => p.name !== 'profile1').map(p => ({ name: p.name, value: p.name }))
    }
  ]);

  const profileConfig1 = getProfile(profile1);
  const profileConfig2 = getProfile(profile2);

  if (!profileConfig1 || !profileConfig2) {
    console.log(chalk.red('One or both profiles not found'));
    return;
  }

  displayProfileComparison(profileConfig1, profileConfig2);
}

async function handleInteractiveProfile(): Promise<void> {
  const actions = [
    { name: 'List all profiles', value: 'list' },
    { name: 'Show profile details', value: 'show' },
    { name: 'Compare profiles', value: 'compare' }
  ];

  // Ajouter l'option de migration si on est dans un projet
  if (existsSync('.claude-stack.yml')) {
    actions.splice(2, 0, { name: 'Migrate to different profile', value: 'migrate' });
  }

  const { action } = await inquirer.prompt([{
    type: 'list',
    name: 'action',
    message: 'What would you like to do?',
    choices: actions
  }]);

  switch (action) {
    case 'list':
      await handleListProfiles();
      break;
    case 'show':
      await handleShowProfile();
      break;
    case 'migrate':
      await handleMigrateProfile();
      break;
    case 'compare':
      await handleCompareProfiles();
      break;
  }
}

function displayProfileDetails(profile: ProfileConfig): void {
  const icon = getProfileIcon(profile.name);

  console.log(`${icon} ${chalk.cyan.bold(profile.name.toUpperCase())} Profile`);
  console.log(chalk.gray(profile.description));
  console.log();

  console.log(chalk.white.bold('📦 Components:'));
  Object.entries(profile.components).forEach(([component, config]: [string, any]) => {
    const componentIcon = getComponentIcon(component);
    const status = config.enabled ? chalk.green('✅ Enabled') : chalk.gray('❌ Disabled');

    console.log(`   ${componentIcon} ${chalk.white.bold(component)} ${status}`);

    if (config.enabled) {
      if (config.tools && config.tools.length > 0) {
        console.log(`      ${chalk.gray('Tools:')} ${config.tools.join(', ')}`);
      }

      if (config.configuration) {
        Object.entries(config.configuration).forEach(([key, value]) => {
          console.log(`      ${chalk.gray(key + ':')} ${value}`);
        });
      }
    }
  });

  console.log();
  console.log(chalk.white.bold('⚙️  Features:'));
  const features = getProfileFeatures(profile);
  features.forEach(feature => {
    console.log(`   • ${feature}`);
  });

  console.log();
  console.log(chalk.white.bold('🎯 Best For:'));
  const useCases = getProfileUseCases(profile.name);
  useCases.forEach(useCase => {
    console.log(`   • ${useCase}`);
  });
}

function analyzeMigration(currentConfig: any, targetProfile: ProfileConfig): any {
  const changes = {
    added: [] as string[],
    removed: [] as string[],
    modified: [] as string[],
    dependencies: {
      toInstall: [] as string[],
      toRemove: [] as string[]
    }
  };

  const currentComponents = currentConfig.components || {};
  const targetComponents = targetProfile.components;

  // Analyser les composants ajoutés/supprimés
  Object.keys(targetComponents).forEach(component => {
    if (!currentComponents[component] || !currentComponents[component].enabled) {
      if (targetComponents[component].enabled) {
        changes.added.push(component);
      }
    }
  });

  Object.keys(currentComponents).forEach(component => {
    if (currentComponents[component].enabled &&
        (!targetComponents[component] || !targetComponents[component].enabled)) {
      changes.removed.push(component);
    }
  });

  // Analyser les modifications
  Object.keys(targetComponents).forEach(component => {
    if (currentComponents[component] && currentComponents[component].enabled &&
        targetComponents[component].enabled) {
      const currentTools = currentComponents[component].tools || [];
      const targetTools = targetComponents[component].tools || [];

      if (JSON.stringify(currentTools) !== JSON.stringify(targetTools)) {
        changes.modified.push(component);
      }
    }
  });

  return changes;
}

function displayMigrationPlan(migration: any): void {
  console.log(chalk.white.bold('📋 Migration Plan:'));
  console.log();

  if (migration.added.length > 0) {
    console.log(chalk.green.bold('➕ Components to add:'));
    migration.added.forEach((component: string) => {
      console.log(`   • ${component}`);
    });
    console.log();
  }

  if (migration.removed.length > 0) {
    console.log(chalk.red.bold('➖ Components to remove:'));
    migration.removed.forEach((component: string) => {
      console.log(`   • ${component}`);
    });
    console.log();
  }

  if (migration.modified.length > 0) {
    console.log(chalk.yellow.bold('🔄 Components to modify:'));
    migration.modified.forEach((component: string) => {
      console.log(`   • ${component}`);
    });
    console.log();
  }

  if (migration.added.length === 0 && migration.removed.length === 0 && migration.modified.length === 0) {
    console.log(chalk.gray('No significant changes required'));
  }
}

async function performMigration(currentConfig: any, targetProfile: ProfileConfig, migration: any): Promise<void> {
  // Mettre à jour la configuration
  currentConfig.profile = targetProfile.name;
  currentConfig.components = targetProfile.components;
  currentConfig.lastUpdated = new Date().toISOString();

  // Sauvegarder la nouvelle configuration
  writeFileSync('.claude-stack.yml', yaml.stringify(currentConfig));

  // Régénérer les fichiers de configuration
  await generateProjectStructure(currentConfig);
}

function displayProfileComparison(profile1: ProfileConfig, profile2: ProfileConfig): void {
  console.log(chalk.white.bold(`📊 Profile Comparison: ${profile1.name.toUpperCase()} vs ${profile2.name.toUpperCase()}`));
  console.log();

  // Comparer les composants
  const allComponents = new Set([
    ...Object.keys(profile1.components),
    ...Object.keys(profile2.components)
  ]);

  console.log(chalk.white.bold('📦 Components:'));
  allComponents.forEach(component => {
    const comp1 = profile1.components[component];
    const comp2 = profile2.components[component];

    const status1 = comp1?.enabled ? '✅' : '❌';
    const status2 = comp2?.enabled ? '✅' : '❌';

    console.log(`   ${chalk.white(component)}`);
    console.log(`     ${profile1.name}: ${status1}`);
    console.log(`     ${profile2.name}: ${status2}`);

    // Comparer les outils si les deux sont activés
    if (comp1?.enabled && comp2?.enabled && comp1.tools && comp2.tools) {
      const tools1 = comp1.tools || [];
      const tools2 = comp2.tools || [];

      const uniqueTo1 = tools1.filter((tool: string) => !tools2.includes(tool));
      const uniqueTo2 = tools2.filter((tool: string) => !tools1.includes(tool));

      if (uniqueTo1.length > 0) {
        console.log(`     ${chalk.cyan('Only in ' + profile1.name + ':')} ${uniqueTo1.join(', ')}`);
      }
      if (uniqueTo2.length > 0) {
        console.log(`     ${chalk.cyan('Only in ' + profile2.name + ':')} ${uniqueTo2.join(', ')}`);
      }
    }
  });
}

function getProfileIcon(profileName: string): string {
  switch (profileName) {
    case 'starter': return '🚀';
    case 'standard': return '⭐';
    case 'enterprise': return '🏢';
    default: return '📦';
  }
}

function getComponentIcon(componentName: string): string {
  switch (componentName) {
    case 'testing': return '🧪';
    case 'security': return '🔒';
    case 'quality': return '✨';
    case 'observability': return '📊';
    case 'governance': return '📋';
    default: return '🔧';
  }
}

function getProfileFeatures(profile: ProfileConfig): string[] {
  const features: string[] = [];

  Object.entries(profile.components).forEach(([component, config]: [string, any]) => {
    if (config.enabled && config.tools) {
      features.push(`${component}: ${config.tools.join(', ')}`);
    }
  });

  return features;
}

function getProfileUseCases(profileName: string): string[] {
  switch (profileName) {
    case 'starter':
      return [
        'Small personal projects',
        'Learning and experimentation',
        'Quick prototypes',
        'Open source side projects'
      ];
    case 'standard':
      return [
        'Production applications',
        'Team collaboration',
        'CI/CD pipelines',
        'Security-conscious projects'
      ];
    case 'enterprise':
      return [
        'Large-scale applications',
        'Regulated industries',
        'Compliance requirements',
        'Advanced security needs',
        'Multi-team organizations'
      ];
    default:
      return [];
  }
}