import { StackProfile } from '../types';

export const PROFILES: Record<string, StackProfile> = {
  starter: {
    name: 'Starter',
    description: 'Essentials only - Tests + Basic linting',
    level: 'starter',
    components: {
      testing: {
        enabled: true,
        tools: ['jest', 'pytest'],
        configuration: {
          coverage_threshold: 70,
          test_timeout: 30000,
          parallel_tests: true
        }
      },
      security: {
        enabled: true,
        tools: ['eslint', 'ruff'],
        configuration: {
          rules: 'recommended',
          auto_fix: true
        }
      },
      quality: {
        enabled: true,
        tools: ['prettier', 'black'],
        configuration: {
          auto_format: true,
          line_length: 100
        }
      }
    }
  },

  standard: {
    name: 'Standard',
    description: 'Recommended setup - SAST + Secrets + Dependencies',
    level: 'standard',
    components: {
      testing: {
        enabled: true,
        tools: ['jest', 'pytest', 'playwright'],
        configuration: {
          coverage_threshold: 80,
          branch_coverage: 70,
          mutation_testing: false,
          e2e_tests: true
        }
      },
      security: {
        enabled: true,
        tools: ['semgrep', 'gitleaks', 'eslint', 'ruff'],
        configuration: {
          sast_rules: 'p/ci',
          secret_detection: true,
          fail_on: ['HIGH', 'CRITICAL'],
          daily_scans: true
        }
      },
      quality: {
        enabled: true,
        tools: ['prettier', 'black', 'sonarjs'],
        configuration: {
          code_complexity_max: 10,
          duplication_threshold: 3,
          maintainability_rating: 'A'
        }
      },
      observability: {
        enabled: true,
        tools: ['winston', 'prometheus'],
        configuration: {
          log_level: 'info',
          metrics_collection: true,
          error_tracking: true
        }
      }
    }
  },

  enterprise: {
    name: 'Enterprise',
    description: 'Full stack - Governance + Compliance + Advanced security',
    level: 'enterprise',
    components: {
      testing: {
        enabled: true,
        tools: ['jest', 'pytest', 'playwright', 'stryker'],
        configuration: {
          coverage_threshold: 85,
          branch_coverage: 80,
          mutation_threshold: 75,
          performance_testing: true,
          accessibility_testing: true
        }
      },
      security: {
        enabled: true,
        tools: ['semgrep', 'gitleaks', 'syft', 'grype', 'trivy', 'codeql'],
        configuration: {
          sast_rules: 'p/security-audit',
          sca_enabled: true,
          container_scanning: true,
          iac_scanning: true,
          license_compliance: true,
          supply_chain_security: true
        }
      },
      quality: {
        enabled: true,
        tools: ['prettier', 'black', 'sonarjs', 'eslint-enterprise'],
        configuration: {
          code_complexity_max: 7,
          duplication_threshold: 2,
          technical_debt_ratio: 5,
          quality_gates_strict: true
        }
      },
      observability: {
        enabled: true,
        tools: ['winston', 'prometheus', 'grafana', 'jaeger'],
        configuration: {
          structured_logging: true,
          distributed_tracing: true,
          apm_monitoring: true,
          custom_dashboards: true
        }
      },
      governance: {
        enabled: true,
        tools: ['opa', 'conftest', 'policy-engine'],
        configuration: {
          policy_as_code: true,
          compliance_checks: ['SOX', 'PCI', 'GDPR'],
          approval_workflows: true,
          audit_trails: true
        }
      }
    }
  }
};

export function getProfile(name: string): StackProfile | undefined {
  return PROFILES[name.toLowerCase()];
}

export function listProfiles(): StackProfile[] {
  return Object.values(PROFILES);
}

export function validateProfile(name: string): boolean {
  return name.toLowerCase() in PROFILES;
}