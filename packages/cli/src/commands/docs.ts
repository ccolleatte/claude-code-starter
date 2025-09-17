import chalk from 'chalk';
import inquirer from 'inquirer';
import { existsSync, readFileSync } from 'fs-extra';
import { execSync } from 'child_process';
import * as path from 'path';
import * as os from 'os';

import { DocsOptions } from '../types';

interface DocSection {
  id: string;
  title: string;
  description: string;
  file?: string;
  children?: DocSection[];
}

const DOCS_STRUCTURE: DocSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    description: 'Installation, quick start, and first project setup',
    children: [
      {
        id: 'installation',
        title: 'Installation',
        description: 'How to install Claude Stack CLI on your system',
        file: 'getting-started/installation.md'
      },
      {
        id: 'quick-start',
        title: 'Quick Start',
        description: 'Get up and running in 5 minutes',
        file: 'getting-started/quick-start.md'
      },
      {
        id: 'first-project',
        title: 'Your First Project',
        description: 'Step-by-step project creation guide',
        file: 'getting-started/first-project.md'
      }
    ]
  },
  {
    id: 'guides',
    title: 'User Guides',
    description: 'In-depth guides for advanced usage',
    children: [
      {
        id: 'profiles',
        title: 'Security Profiles',
        description: 'Understanding starter, standard, and enterprise profiles',
        file: 'guides/profiles.md'
      },
      {
        id: 'security',
        title: 'Security Management',
        description: 'Advanced security configuration and best practices',
        file: 'guides/security.md'
      },
      {
        id: 'ci-cd',
        title: 'CI/CD Integration',
        description: 'Integrate with GitHub Actions, GitLab CI, and other platforms',
        file: 'guides/ci-cd.md'
      },
      {
        id: 'migration',
        title: 'Project Migration',
        description: 'Migrate existing projects to Claude Stack',
        file: 'guides/migration.md'
      }
    ]
  },
  {
    id: 'commands',
    title: 'Command Reference',
    description: 'Complete reference for all CLI commands',
    children: [
      {
        id: 'init',
        title: 'claude-stack init',
        description: 'Initialize Claude Stack in your project',
        file: 'commands/init.md'
      },
      {
        id: 'audit',
        title: 'claude-stack audit',
        description: 'Run comprehensive security audits',
        file: 'commands/audit.md'
      },
      {
        id: 'upgrade',
        title: 'claude-stack upgrade',
        description: 'Update components and migrate configurations',
        file: 'commands/upgrade.md'
      },
      {
        id: 'status',
        title: 'claude-stack status',
        description: 'Check project health and component status',
        file: 'commands/status.md'
      },
      {
        id: 'doctor',
        title: 'claude-stack doctor',
        description: 'Diagnose and fix common issues',
        file: 'commands/doctor.md'
      }
    ]
  },
  {
    id: 'configuration',
    title: 'Configuration',
    description: 'Advanced configuration and customization',
    children: [
      {
        id: 'profiles-config',
        title: 'Profile Configuration',
        description: 'Detailed profile configuration options',
        file: 'configuration/profiles.md'
      },
      {
        id: 'custom-config',
        title: 'Custom Configuration',
        description: 'Advanced customization and overrides',
        file: 'configuration/custom.md'
      },
      {
        id: 'claude-integration',
        title: 'Claude Code Integration',
        description: 'MCP servers and hooks setup',
        file: 'configuration/claude-integration.md'
      }
    ]
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    description: 'Common issues and solutions',
    children: [
      {
        id: 'common-issues',
        title: 'Common Issues',
        description: 'Solutions to frequent problems',
        file: 'troubleshooting/common-issues.md'
      },
      {
        id: 'diagnostics',
        title: 'Diagnostic Tools',
        description: 'Using doctor command and debugging',
        file: 'troubleshooting/diagnostics.md'
      },
      {
        id: 'support',
        title: 'Getting Support',
        description: 'Community resources and bug reporting',
        file: 'troubleshooting/support.md'
      }
    ]
  }
];

export async function docsCommand(options: DocsOptions): Promise<void> {
  console.log(chalk.blue.bold('📚 Claude Stack Documentation'));
  console.log();

  try {
    if (options.command) {
      await showCommandHelp(options.command);
    } else if (options.search) {
      await searchDocumentation(options.search);
    } else if (options.open) {
      await openDocumentationBrowser();
    } else {
      await showInteractiveDocumentation();
    }
  } catch (error) {
    console.error(chalk.red('Documentation access failed:'), error.message);
    process.exit(1);
  }
}

async function showCommandHelp(commandName: string): Promise<void> {
  console.log(chalk.white.bold(`📖 Help for: ${commandName}`));
  console.log();

  // Find command documentation
  const commandDoc = findDocumentationByCommand(commandName);

  if (commandDoc) {
    await displayDocumentationContent(commandDoc);
  } else {
    // Fallback to CLI help
    console.log(chalk.yellow('📄 Command-specific documentation not found. Showing CLI help:'));
    console.log();

    try {
      execSync(`claude-stack ${commandName} --help`, { stdio: 'inherit' });
    } catch (error) {
      console.log(chalk.red(`Command '${commandName}' not found.`));
      console.log();
      await showAvailableCommands();
    }
  }
}

async function searchDocumentation(query: string): Promise<void> {
  console.log(chalk.white.bold(`🔍 Searching documentation for: "${query}"`));
  console.log();

  const results = searchInDocumentation(query);

  if (results.length === 0) {
    console.log(chalk.yellow('No results found.'));
    console.log();
    console.log(chalk.white('💡 Try searching for:'));
    console.log('  • init, audit, upgrade (commands)');
    console.log('  • security, profiles, configuration (topics)');
    console.log('  • installation, troubleshooting (guides)');
    return;
  }

  console.log(chalk.green(`Found ${results.length} result(s):`));
  console.log();

  results.forEach((result, index) => {
    console.log(`${chalk.cyan(`${index + 1}.`)} ${chalk.white.bold(result.title)}`);
    console.log(`   ${chalk.gray(result.description)}`);
    if (result.matches && result.matches.length > 0) {
      console.log(`   ${chalk.yellow('Matches:')} ${result.matches.slice(0, 2).join(', ')}${result.matches.length > 2 ? '...' : ''}`);
    }
    console.log();
  });

  // Interactive selection
  if (results.length > 1) {
    const { selectedDoc } = await inquirer.prompt([{
      type: 'list',
      name: 'selectedDoc',
      message: 'Select documentation to view:',
      choices: [
        ...results.map((result, index) => ({
          name: `${result.title} - ${result.description}`,
          value: result
        })),
        { name: 'Cancel', value: null }
      ]
    }]);

    if (selectedDoc) {
      console.log();
      await displayDocumentationContent(selectedDoc);
    }
  } else {
    // Show single result
    await displayDocumentationContent(results[0]);
  }
}

async function openDocumentationBrowser(): Promise<void> {
  const docsUrl = 'https://docs.anthropic.com/claude-stack';

  console.log(chalk.white.bold('🌐 Opening documentation in browser...'));
  console.log(chalk.gray(`URL: ${docsUrl}`));

  try {
    const platform = os.platform();
    let command: string;

    switch (platform) {
      case 'darwin':
        command = `open ${docsUrl}`;
        break;
      case 'win32':
        command = `start ${docsUrl}`;
        break;
      default:
        command = `xdg-open ${docsUrl}`;
        break;
    }

    execSync(command, { stdio: 'pipe' });
    console.log(chalk.green('✅ Documentation opened in browser'));
  } catch (error) {
    console.log(chalk.yellow('⚠️  Could not open browser automatically'));
    console.log(chalk.white('Please visit manually: '), chalk.cyan(docsUrl));
  }
}

async function showInteractiveDocumentation(): Promise<void> {
  const { action } = await inquirer.prompt([{
    type: 'list',
    name: 'action',
    message: 'What would you like to do?',
    choices: [
      { name: '📖 Browse documentation sections', value: 'browse' },
      { name: '🔍 Search documentation', value: 'search' },
      { name: '💻 Get command help', value: 'command' },
      { name: '🌐 Open online documentation', value: 'online' },
      { name: '📋 Show quick reference', value: 'quick-ref' }
    ]
  }]);

  switch (action) {
    case 'browse':
      await browseDocumentationSections();
      break;
    case 'search':
      const { searchQuery } = await inquirer.prompt([{
        type: 'input',
        name: 'searchQuery',
        message: 'Enter search term:'
      }]);
      await searchDocumentation(searchQuery);
      break;
    case 'command':
      const { commandName } = await inquirer.prompt([{
        type: 'input',
        name: 'commandName',
        message: 'Enter command name (e.g., init, audit):',
        default: 'init'
      }]);
      await showCommandHelp(commandName);
      break;
    case 'online':
      await openDocumentationBrowser();
      break;
    case 'quick-ref':
      await showQuickReference();
      break;
  }
}

async function browseDocumentationSections(): Promise<void> {
  const choices = DOCS_STRUCTURE.map(section => ({
    name: `${section.title} - ${section.description}`,
    value: section
  }));

  const { selectedSection } = await inquirer.prompt([{
    type: 'list',
    name: 'selectedSection',
    message: 'Select documentation section:',
    choices
  }]);

  if (selectedSection.children) {
    // Show subsections
    const subChoices = selectedSection.children.map((subsection: DocSection) => ({
      name: `${subsection.title} - ${subsection.description}`,
      value: subsection
    }));

    const { selectedSubsection } = await inquirer.prompt([{
      type: 'list',
      name: 'selectedSubsection',
      message: `Select ${selectedSection.title} topic:`,
      choices: [...subChoices, { name: '← Back to main menu', value: null }]
    }]);

    if (selectedSubsection) {
      await displayDocumentationContent(selectedSubsection);
    } else {
      await showInteractiveDocumentation();
    }
  } else {
    await displayDocumentationContent(selectedSection);
  }
}

async function displayDocumentationContent(doc: DocSection): Promise<void> {
  console.log(chalk.white.bold(`📄 ${doc.title}`));
  console.log(chalk.gray(doc.description));
  console.log();

  if (doc.file) {
    const content = await getDocumentationContent(doc.file);
    if (content) {
      // Display first part of the content
      const lines = content.split('\n');
      const preview = lines.slice(0, 30).join('\n');

      console.log(preview);

      if (lines.length > 30) {
        console.log();
        console.log(chalk.gray('... (content truncated)'));

        const { viewFull } = await inquirer.prompt([{
          type: 'confirm',
          name: 'viewFull',
          message: 'View full documentation?',
          default: true
        }]);

        if (viewFull) {
          // Try to open in pager
          await openInPager(content, doc.title);
        }
      }
    } else {
      console.log(chalk.yellow('📝 Documentation content not available locally.'));
      console.log(chalk.white('💡 Try: '), chalk.cyan('claude-stack docs --open'));
    }
  } else {
    console.log(chalk.gray('This is a section overview. Select a specific topic for detailed information.'));
  }

  console.log();
  console.log(chalk.white.bold('🔗 Related:'));
  showRelatedDocumentation(doc.id);
}

async function getDocumentationContent(filePath: string): Promise<string | null> {
  const fullPath = path.join(__dirname, '..', '..', 'docs', filePath);

  if (existsSync(fullPath)) {
    try {
      return readFileSync(fullPath, 'utf8');
    } catch (error) {
      return null;
    }
  }

  return null;
}

async function openInPager(content: string, title: string): Promise<void> {
  try {
    const platform = os.platform();
    const pager = process.env.PAGER || (platform === 'win32' ? 'more' : 'less');

    // Write content to temporary file
    const tmpFile = path.join(os.tmpdir(), `claude-stack-docs-${Date.now()}.md`);
    require('fs').writeFileSync(tmpFile, `# ${title}\n\n${content}`);

    // Open in pager
    execSync(`${pager} "${tmpFile}"`, { stdio: 'inherit' });

    // Clean up
    require('fs').unlinkSync(tmpFile);
  } catch (error) {
    console.log(chalk.yellow('⚠️  Could not open in pager, showing full content:'));
    console.log();
    console.log(content);
  }
}

function findDocumentationByCommand(commandName: string): DocSection | null {
  for (const section of DOCS_STRUCTURE) {
    if (section.children) {
      for (const child of section.children) {
        if (child.id === commandName || child.title.includes(commandName)) {
          return child;
        }
      }
    }
  }
  return null;
}

function searchInDocumentation(query: string): Array<DocSection & { matches?: string[] }> {
  const results: Array<DocSection & { matches?: string[] }> = [];
  const searchTerms = query.toLowerCase().split(' ');

  function searchInSection(section: DocSection, parentPath: string = ''): void {
    const fullTitle = `${parentPath}${section.title}`.toLowerCase();
    const fullDescription = section.description.toLowerCase();
    const fullId = section.id.toLowerCase();

    const matches: string[] = [];

    // Check for matches in title, description, and ID
    searchTerms.forEach(term => {
      if (fullTitle.includes(term)) matches.push(`title: ${term}`);
      if (fullDescription.includes(term)) matches.push(`description: ${term}`);
      if (fullId.includes(term)) matches.push(`topic: ${term}`);
    });

    if (matches.length > 0) {
      results.push({ ...section, matches });
    }

    // Search in children
    if (section.children) {
      section.children.forEach(child => {
        searchInSection(child, `${section.title} > `);
      });
    }
  }

  DOCS_STRUCTURE.forEach(section => searchInSection(section));

  // Sort by relevance (number of matches)
  return results.sort((a, b) => (b.matches?.length || 0) - (a.matches?.length || 0));
}

async function showAvailableCommands(): Promise<void> {
  console.log(chalk.white.bold('📋 Available Commands:'));
  console.log();

  const commands = [
    { name: 'init', description: 'Initialize Claude Stack in your project' },
    { name: 'audit', description: 'Run comprehensive security audits' },
    { name: 'upgrade', description: 'Update components and migrate configurations' },
    { name: 'status', description: 'Check project health and component status' },
    { name: 'doctor', description: 'Diagnose and fix common issues' },
    { name: 'config', description: 'Manage global and project configurations' },
    { name: 'profile', description: 'View, compare, and migrate between profiles' },
    { name: 'generate', description: 'Generate workflows, hooks, and configuration files' },
    { name: 'validate', description: 'Validate configurations and project structure' },
    { name: 'clean', description: 'Clean up caches, artifacts, and temporary files' },
    { name: 'info', description: 'Display system and project information' },
    { name: 'docs', description: 'Access documentation and help' }
  ];

  commands.forEach(cmd => {
    console.log(`   ${chalk.cyan(cmd.name.padEnd(10))} ${cmd.description}`);
  });

  console.log();
  console.log(chalk.white('💡 Get help for any command: '), chalk.cyan('claude-stack [command] --help'));
}

async function showQuickReference(): Promise<void> {
  console.log(chalk.white.bold('📋 Claude Stack Quick Reference'));
  console.log();

  console.log(chalk.cyan.bold('🚀 Getting Started:'));
  console.log('   claude-stack init --profile=standard    Initialize project');
  console.log('   claude-stack audit --auto-fix           Run security audit');
  console.log('   claude-stack status                     Check project health');
  console.log();

  console.log(chalk.cyan.bold('🔧 Daily Commands:'));
  console.log('   claude-stack audit                      Security scan');
  console.log('   claude-stack upgrade --dry-run          Check updates');
  console.log('   claude-stack doctor                     Diagnose issues');
  console.log();

  console.log(chalk.cyan.bold('⚙️  Configuration:'));
  console.log('   claude-stack config list                View settings');
  console.log('   claude-stack config set key value       Change setting');
  console.log('   claude-stack profile migrate NAME       Change profile');
  console.log();

  console.log(chalk.cyan.bold('🏗️  Generation:'));
  console.log('   claude-stack generate workflow          GitHub Actions');
  console.log('   claude-stack generate hook              Claude Code hooks');
  console.log('   claude-stack generate docs              Documentation');
  console.log();

  console.log(chalk.cyan.bold('🧹 Maintenance:'));
  console.log('   claude-stack clean --cache              Clean caches');
  console.log('   claude-stack validate                   Check config');
  console.log('   claude-stack info                       System info');
  console.log();

  console.log(chalk.white.bold('📚 More Help:'));
  console.log('   claude-stack docs --search TERM         Search docs');
  console.log('   claude-stack docs --command COMMAND     Command help');
  console.log('   claude-stack docs --open                Online docs');
}

function showRelatedDocumentation(currentDocId: string): void {
  const related: string[] = [];

  // Add contextual suggestions based on current doc
  switch (currentDocId) {
    case 'installation':
      related.push('quick-start', 'first-project');
      break;
    case 'quick-start':
      related.push('profiles', 'security', 'init');
      break;
    case 'init':
      related.push('audit', 'status', 'profiles');
      break;
    case 'audit':
      related.push('doctor', 'security', 'upgrade');
      break;
    case 'profiles':
      related.push('migration', 'security', 'custom-config');
      break;
    default:
      related.push('quick-start', 'commands');
  }

  related.forEach(docId => {
    const doc = findDocumentationById(docId);
    if (doc) {
      console.log(`   • ${chalk.cyan(doc.title)} - ${chalk.gray(doc.description)}`);
    }
  });
}

function findDocumentationById(id: string): DocSection | null {
  for (const section of DOCS_STRUCTURE) {
    if (section.id === id) return section;
    if (section.children) {
      for (const child of section.children) {
        if (child.id === id) return child;
      }
    }
  }
  return null;
}