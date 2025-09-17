export interface StackProfile {
  name: string;
  description: string;
  level: 'starter' | 'standard' | 'enterprise';
  components: {
    testing: ComponentConfig;
    security: ComponentConfig;
    quality: ComponentConfig;
    observability?: ComponentConfig;
    governance?: ComponentConfig;
  };
}

export interface ComponentConfig {
  enabled: boolean;
  tools: string[];
  configuration: Record<string, any>;
  thresholds?: Record<string, number>;
}

export interface ProjectConfig {
  name: string;
  profile: string;
  version: string;
  components: ComponentConfig[];
  customization: Record<string, any>;
}

export interface AuditResult {
  component: string;
  status: 'healthy' | 'warning' | 'error';
  issues: AuditIssue[];
  autoFixable: boolean;
}

export interface AuditIssue {
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  fix?: string;
  autoFix?: () => Promise<boolean>;
}

export interface UpgradeInfo {
  component: string;
  currentVersion: string;
  availableVersion: string;
  breaking: boolean;
  changelog?: string;
}

export interface InitOptions {
  profile: string;
  projectName?: string;
  skipInteractive?: boolean;
  dryRun?: boolean;
  force?: boolean;
}

export interface AuditOptions {
  fix?: boolean;
  autoFix?: boolean;
  severity?: string;
  component?: string;
}

export interface UpgradeOptions {
  dryRun?: boolean;
  component?: string;
  force?: boolean;
  interactive?: boolean;
}

// Doctor command types
export interface DoctorOptions {
  fix?: boolean;
}

export interface DiagnosticResult {
  component: string;
  status: 'healthy' | 'warning' | 'error';
  issues: DiagnosticIssue[];
}

export interface DiagnosticIssue {
  severity: 'low' | 'medium' | 'high';
  message: string;
  fix: string;
  category: string;
  autoFix?: () => Promise<boolean>;
}

// Config command types
export interface ConfigOptions {
  action?: string;
  key?: string;
  value?: any;
  global?: boolean;
}

// Profile command types
export interface ProfileOptions {
  action?: string;
  name?: string;
}

// Generate command types
export interface GenerateOptions {
  type: string;
  template?: string;
  output?: string;
}

// Validate command types
export interface ValidateOptions {
  strict?: boolean;
  schema?: string;
}

export interface ValidationResult {
  component: string;
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

export interface ValidationError {
  severity: 'error' | 'warning';
  message: string;
  file?: string;
  line?: number;
  fix?: string;
}

// Clean command types
export interface CleanOptions {
  cache?: boolean;
  artifacts?: boolean;
  all?: boolean;
}

// Info command types
export interface InfoOptions {
  json?: boolean;
}

// Docs command types
export interface DocsOptions {
  command?: string;
  search?: string;
  open?: boolean;
}