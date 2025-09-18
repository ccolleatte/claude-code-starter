# Claude v4.1 Framework - Architecture Diagrams

## 🏗️ Architecture Overview

```mermaid
graph TB
    subgraph "👤 User Layer"
        USER[Developer]
        IDE[IDE/Editor]
        CLI[Command Line]
    end

    subgraph "🤖 Claude Interface"
        CLAUDE[Claude Code Agent]
        CONFIG[Configuration Loader]
        HOOKS[Hook System]
    end

    subgraph "📋 Framework Core v4.1"
        subgraph "📁 .claude/"
            MAIN[CLAUDE.md<br/>Critical Rules]
            WORK[CLAUDE-WORKFLOWS.md<br/>Detailed Processes]
            VALID[CLAUDE-VALIDATION.md<br/>Anti-BS Rules]
            ERR[CLAUDE-ERRORS.md<br/>Pattern Library]
            SET[CLAUDE-SETTINGS.md<br/>Security Config]
        end
        
        subgraph "🔧 Scripts"
            CIPHER_MCP[cipher-mcp.sh]
            SERENA_MCP[serena-mcp.sh]
            SEMGREP_MCP[semgrep-mcp.sh]
            EXA_MCP[exa-mcp.sh]
            METRICS[claude-metrics.sh]
        end
    end

    subgraph "🌐 MCP Servers"
        CIPHER[(Cipher<br/>Memory)]
        SERENA[(Serena<br/>Code Analysis)]
        SEMGREP[(Semgrep<br/>Security)]
        EXA[(Exa<br/>Search)]
    end

    subgraph "🧪 Testing Layer"
        TEST_SYNTAX[test_templates_syntax.py]
        TEST_MCP[test_mcp_scripts.py]
        TEST_INTEGRATION[test_integration.py]
    end

    subgraph "📊 Monitoring"
        DASHBOARD[Real-time Dashboard]
        ALERTS[Alert System]
        REPORTS[Daily Reports]
    end

    subgraph "🚀 CI/CD"
        GITHUB[GitHub Actions]
        VALIDATION[Validation Pipeline]
        DEPLOY[Deployment]
    end

    %% User interactions
    USER --> IDE
    USER --> CLI
    IDE --> CLAUDE
    CLI --> CLAUDE

    %% Claude core interactions
    CLAUDE --> CONFIG
    CONFIG --> MAIN
    CONFIG --> WORK
    CONFIG --> VALID
    CONFIG --> ERR
    CONFIG --> SET

    %% MCP connections
    CLAUDE --> CIPHER_MCP --> CIPHER
    CLAUDE --> SERENA_MCP --> SERENA
    CLAUDE --> SEMGREP_MCP --> SEMGREP
    CLAUDE --> EXA_MCP --> EXA

    %% Testing connections
    GITHUB --> TEST_SYNTAX
    GITHUB --> TEST_MCP
    GITHUB --> TEST_INTEGRATION

    %% Monitoring flows
    CLAUDE --> METRICS
    METRICS --> DASHBOARD
    METRICS --> ALERTS
    METRICS --> REPORTS

    %% CI/CD flows
    USER --> GITHUB
    GITHUB --> VALIDATION
    VALIDATION --> DEPLOY

    %% Hook system
    CLAUDE --> HOOKS
    HOOKS --> METRICS

    %% Styling
    classDef userLayer fill:#e1f5fe
    classDef claudeLayer fill:#f3e5f5
    classDef frameworkCore fill:#e8f5e8
    classDef mcpLayer fill:#fff3e0
    classDef testLayer fill:#fce4ec
    classDef monitorLayer fill:#f1f8e9
    classDef cicdLayer fill:#e0f2f1

    class USER,IDE,CLI userLayer
    class CLAUDE,CONFIG,HOOKS claudeLayer
    class MAIN,WORK,VALID,ERR,SET,CIPHER_MCP,SERENA_MCP,SEMGREP_MCP,EXA_MCP,METRICS frameworkCore
    class CIPHER,SERENA,SEMGREP,EXA mcpLayer
    class TEST_SYNTAX,TEST_MCP,TEST_INTEGRATION testLayer
    class DASHBOARD,ALERTS,REPORTS monitorLayer
    class GITHUB,VALIDATION,DEPLOY cicdLayer
```

## 🔄 MCP Data Flow

```mermaid
sequenceDiagram
    participant U as User
    participant C as Claude Agent
    participant CM as claude-metrics.sh
    participant S as Serena MCP
    participant CI as Cipher MCP
    participant SE as Semgrep MCP
    participant E as Exa MCP

    Note over U,E: Task: "Implement new feature"

    U->>C: Request feature implementation
    
    C->>CM: track_response_time("task_start")
    
    C->>S: mcp__serena__list_dir(".")
    S-->>C: Project structure
    
    C->>CI: Read memory for architecture patterns
    CI-->>C: Previous decisions & patterns
    
    C->>SE: Security scan for existing code
    SE-->>C: Security analysis results
    
    C->>E: Search documentation for best practices
    E-->>C: Relevant documentation
    
    Note over C: Decision making based on inputs
    
    C->>S: mcp__serena__create_text_file(implementation)
    S-->>C: File created
    
    C->>CM: track_template_usage("CLAUDE-WORKFLOWS.md", "read", "true")
    
    C->>S: Run tests via mcp__serena__execute_shell_command
    S-->>C: Test results
    
    alt Tests pass
        C->>CM: track_hallucination("none", "info", "tests_pass_first_try")
        C->>CI: Store successful pattern
    else Tests fail
        C->>CM: track_config_error("test_failure", "implementation", error_msg)
        C->>S: Fix implementation
        S-->>C: Updated code
    end
    
    C->>CM: track_response_time("task_complete")
    C-->>U: Feature implemented with validation
    
    Note over CM: Generate metrics for dashboard
```

## 🌳 Template Decision Tree

```mermaid
flowchart TD
    START([User Request]) --> TYPE{Request Type?}
    
    TYPE -->|"Code Implementation"| IMPL[Read CLAUDE-WORKFLOWS.md]
    TYPE -->|"Error/Debug"| ERR[Read CLAUDE-ERRORS.md]
    TYPE -->|"Validation Question"| VAL[Read CLAUDE-VALIDATION.md]
    TYPE -->|"Configuration"| CONF[Read CLAUDE-SETTINGS.md]
    TYPE -->|"General Rules"| MAIN[Read CLAUDE.md]
    
    IMPL --> CODE_TYPE{Code Complexity?}
    CODE_TYPE -->|"Simple (<50 lines)"| DIRECT[Direct implementation]
    CODE_TYPE -->|"Complex (>50 lines)"| TDD[Follow TDD workflow]
    CODE_TYPE -->|"Architecture change"| ARCH[Check Cipher memory first]
    
    ERR --> ERR_TYPE{Error Category?}
    ERR_TYPE -->|"Hallucination"| HALL[Anti-hallucination patterns]
    ERR_TYPE -->|"Performance"| PERF[Performance debugging]
    ERR_TYPE -->|"Structure"| STRUCT[Architecture validation]
    ERR_TYPE -->|"Git/CI"| GIT[Version control patterns]
    
    VAL --> VAL_TYPE{Validation Level?}
    VAL_TYPE -->|"Proof Required"| PROOF[Execute and show output]
    VAL_TYPE -->|"Metrics Check"| METRICS[Measure before/after]
    VAL_TYPE -->|"Quality Gate"| QUALITY[Run full test suite]
    
    CONF --> CONF_TYPE{Configuration Scope?}
    CONF_TYPE -->|"Permissions"| PERM[Security permissions]
    CONF_TYPE -->|"MCP Setup"| MCP[Server configuration]
    CONF_TYPE -->|"CI/CD"| CICD[Pipeline configuration]
    
    MAIN --> CRITICAL{Critical Rule?}
    CRITICAL -->|"Yes"| STOP[STOP - Review rule]
    CRITICAL -->|"No"| PROCEED[Proceed with caution]
    
    %% Actions
    DIRECT --> EXECUTE[Execute with validation]
    TDD --> RED[RED: Write failing test]
    ARCH --> MEMORY[Check architectural memory]
    HALL --> ROLLBACK[Consider rollback]
    PERF --> BENCHMARK[Run benchmarks]
    STRUCT --> ANALYZE[Analyze structure]
    GIT --> SAFETY[Use safe git practices]
    PROOF --> SHOW[Show execution output]
    METRICS --> MEASURE[Measure and compare]
    QUALITY --> TEST[Run comprehensive tests]
    PERM --> SECURE[Apply security rules]
    MCP --> SETUP[Configure MCP servers]
    CICD --> PIPELINE[Setup pipeline]
    STOP --> CLARIFY[Ask for clarification]
    PROCEED --> VALIDATE[Validate approach]
    
    %% Test flows
    RED --> GREEN[GREEN: Make test pass]
    GREEN --> REFACTOR[REFACTOR: Improve code]
    REFACTOR --> COMPLETE[Task complete]
    
    EXECUTE --> COMPLETE
    MEMORY --> TDD
    ROLLBACK --> RESTART[Restart with correct approach]
    BENCHMARK --> OPTIMIZE[Optimize if needed]
    ANALYZE --> FIX[Fix structure issues]
    SAFETY --> COMMIT[Safe commit]
    SHOW --> DOCUMENT[Document results]
    MEASURE --> REPORT[Report metrics]
    TEST --> COMPLETE
    SECURE --> APPLY[Apply configuration]
    SETUP --> TEST_MCP[Test MCP connection]
    PIPELINE --> DEPLOY[Deploy configuration]
    CLARIFY --> START
    VALIDATE --> EXECUTE
    
    TEST_MCP --> COMPLETE
    APPLY --> COMPLETE
    DEPLOY --> COMPLETE
    OPTIMIZE --> COMPLETE
    FIX --> COMPLETE
    COMMIT --> COMPLETE
    DOCUMENT --> COMPLETE
    REPORT --> COMPLETE
    RESTART --> START
    
    %% Styling
    classDef startEnd fill:#e8f5e8,stroke:#4caf50,stroke-width:3px
    classDef decision fill:#fff3e0,stroke:#ff9800,stroke-width:2px
    classDef action fill:#e3f2fd,stroke:#2196f3,stroke-width:2px
    classDef critical fill:#ffebee,stroke:#f44336,stroke-width:2px
    classDef complete fill:#e8f5e8,stroke:#4caf50,stroke-width:2px
    
    class START,COMPLETE startEnd
    class TYPE,CODE_TYPE,ERR_TYPE,VAL_TYPE,CONF_TYPE,CRITICAL decision
    class IMPL,ERR,VAL,CONF,MAIN,DIRECT,TDD,ARCH,HALL,PERF,STRUCT,GIT,PROOF,METRICS,QUALITY,PERM,MCP,CICD action
    class STOP critical
```

## 🚀 Deployment Architecture

```mermaid
graph TB
    subgraph "🌍 Development Environment"
        DEV_LOCAL[Local Development]
        DEV_IDE[IDE Integration]
        DEV_HOOKS[Git Hooks]
    end

    subgraph "🔧 Local Claude Setup"
        LOCAL_CONFIG[.claude/ Configuration]
        LOCAL_MCP[MCP Servers Local]
        LOCAL_METRICS[Local Metrics Collection]
        LOCAL_DASHBOARD[Local Dashboard]
    end

    subgraph "☁️ GitHub Repository"
        REPO[Source Repository]
        SECRETS[GitHub Secrets]
        WORKFLOWS[.github/workflows/]
    end

    subgraph "🤖 CI/CD Pipeline"
        TRIGGER[Push/PR Trigger]
        
        subgraph "🧪 Validation Jobs"
            JOB1[Template Syntax]
            JOB2[MCP Scripts]
            JOB3[Security Scan]
            JOB4[Performance Tests]
        end
        
        COMPREHENSIVE[Comprehensive Validation]
        REPORT[Validation Report]
    end

    subgraph "📊 Monitoring Infrastructure"
        METRICS_STORE[Metrics Storage]
        ALERT_SYSTEM[Alert System]
        DASHBOARD_WEB[Web Dashboard]
        REPORTS_GEN[Report Generator]
    end

    subgraph "🔒 Security Layer"
        GITLEAKS[Secret Scanning]
        SEMGREP_CI[SAST Analysis]
        DEPENDENCY[Dependency Check]
        PERMISSIONS[Permission Validation]
    end

    subgraph "📈 Observability"
        LOGS[Centralized Logs]
        TRACES[Execution Traces]
        HEALTH[Health Checks]
        PERF_MON[Performance Monitoring]
    end

    subgraph "🌐 Production/Staging"
        STAGING[Staging Environment]
        PROD[Production Deployment]
        ROLLBACK[Rollback Capability]
    end

    %% Development flow
    DEV_LOCAL --> DEV_IDE
    DEV_IDE --> DEV_HOOKS
    DEV_HOOKS --> LOCAL_CONFIG
    
    LOCAL_CONFIG --> LOCAL_MCP
    LOCAL_MCP --> LOCAL_METRICS
    LOCAL_METRICS --> LOCAL_DASHBOARD
    
    %% CI/CD flow
    DEV_LOCAL --> REPO
    REPO --> TRIGGER
    TRIGGER --> JOB1
    TRIGGER --> JOB2
    TRIGGER --> JOB3
    TRIGGER --> JOB4
    
    JOB1 --> COMPREHENSIVE
    JOB2 --> COMPREHENSIVE
    JOB3 --> COMPREHENSIVE
    JOB4 --> COMPREHENSIVE
    
    COMPREHENSIVE --> REPORT
    
    %% Security integration
    JOB3 --> GITLEAKS
    JOB3 --> SEMGREP_CI
    JOB3 --> DEPENDENCY
    JOB3 --> PERMISSIONS
    
    %% Monitoring integration
    LOCAL_METRICS --> METRICS_STORE
    METRICS_STORE --> ALERT_SYSTEM
    METRICS_STORE --> DASHBOARD_WEB
    METRICS_STORE --> REPORTS_GEN
    
    %% Observability
    COMPREHENSIVE --> LOGS
    COMPREHENSIVE --> TRACES
    DASHBOARD_WEB --> HEALTH
    METRICS_STORE --> PERF_MON
    
    %% Deployment flow
    REPORT --> STAGING
    STAGING --> PROD
    PROD --> ROLLBACK
    
    %% Secret management
    SECRETS --> LOCAL_CONFIG
    SECRETS --> JOB1
    SECRETS --> JOB2
    SECRETS --> JOB3
    SECRETS --> JOB4
    
    %% Feedback loops
    ALERT_SYSTEM --> DEV_LOCAL
    REPORTS_GEN --> DEV_LOCAL
    HEALTH --> ROLLBACK
    
    %% Styling
    classDef devEnv fill:#e1f5fe,stroke:#0277bd
    classDef localSetup fill:#f3e5f5,stroke:#7b1fa2
    classDef github fill:#f1f8e9,stroke:#388e3c
    classDef cicd fill:#fff3e0,stroke:#f57c00
    classDef monitoring fill:#e8eaf6,stroke:#3f51b5
    classDef security fill:#ffebee,stroke:#d32f2f
    classDef observability fill:#e0f2f1,stroke:#00695c
    classDef production fill:#fce4ec,stroke:#c2185b
    
    class DEV_LOCAL,DEV_IDE,DEV_HOOKS devEnv
    class LOCAL_CONFIG,LOCAL_MCP,LOCAL_METRICS,LOCAL_DASHBOARD localSetup
    class REPO,SECRETS,WORKFLOWS github
    class TRIGGER,JOB1,JOB2,JOB3,JOB4,COMPREHENSIVE,REPORT cicd
    class METRICS_STORE,ALERT_SYSTEM,DASHBOARD_WEB,REPORTS_GEN monitoring
    class GITLEAKS,SEMGREP_CI,DEPENDENCY,PERMISSIONS security
    class LOGS,TRACES,HEALTH,PERF_MON observability
    class STAGING,PROD,ROLLBACK production
```

## 🔍 Error Flow Diagram

```mermaid
stateDiagram-v2
    [*] --> Normal_Operation
    
    Normal_Operation --> Error_Detected : Issue occurs
    
    state Error_Detected {
        [*] --> Classify_Error
        Classify_Error --> Hallucination : AI invented content
        Classify_Error --> Performance : Slow response
        Classify_Error --> Configuration : Config issue
        Classify_Error --> Security : Security violation
        Classify_Error --> Test_Failure : Test broken
    }
    
    state Hallucination {
        [*] --> Log_Hallucination
        Log_Hallucination --> Check_Threshold
        Check_Threshold --> Alert_High : >3/day
        Check_Threshold --> Log_Only : ≤3/day
        Alert_High --> Emergency_Response
        Log_Only --> Update_Metrics
    }
    
    state Performance {
        [*] --> Measure_Impact
        Measure_Impact --> Minor_Degradation : <20% slower
        Measure_Impact --> Major_Degradation : >20% slower
        Minor_Degradation --> Log_Warning
        Major_Degradation --> Immediate_Action
        Log_Warning --> Update_Metrics
        Immediate_Action --> Emergency_Response
    }
    
    state Configuration {
        [*] --> Validate_Config
        Validate_Config --> Syntax_Error : Invalid syntax
        Validate_Config --> Permission_Error : Access denied
        Validate_Config --> Missing_Dependency : Dependency missing
        Syntax_Error --> Auto_Fix
        Permission_Error --> Security_Review
        Missing_Dependency --> Install_Dependency
    }
    
    state Security {
        [*] --> Assess_Severity
        Assess_Severity --> Critical_Security : High/Critical
        Assess_Severity --> Minor_Security : Low/Medium
        Critical_Security --> Emergency_Response
        Minor_Security --> Security_Review
    }
    
    state Test_Failure {
        [*] --> Analyze_Failure
        Analyze_Failure --> Flaky_Test : Intermittent
        Analyze_Failure --> Real_Bug : Consistent
        Analyze_Failure --> Environment_Issue : Environment
        Flaky_Test --> Fix_Test
        Real_Bug --> Debug_Code
        Environment_Issue --> Fix_Environment
    }
    
    state Emergency_Response {
        [*] --> Stop_Operations
        Stop_Operations --> Notify_Team
        Notify_Team --> Rollback_Changes
        Rollback_Changes --> Incident_Report
        Incident_Report --> Post_Mortem
    }
    
    state Resolution {
        Update_Metrics --> Monitor_Trends
        Auto_Fix --> Verify_Fix
        Security_Review --> Apply_Fix
        Install_Dependency --> Test_Fix
        Fix_Test --> Verify_Fix
        Debug_Code --> Verify_Fix
        Fix_Environment --> Verify_Fix
        Post_Mortem --> Learn_Improve
        
        Verify_Fix --> Success : Fix works
        Verify_Fix --> Escalate : Fix fails
        
        Success --> Normal_Operation
        Escalate --> Emergency_Response
        
        Monitor_Trends --> Normal_Operation
        Apply_Fix --> Verify_Fix
        Test_Fix --> Verify_Fix
        Learn_Improve --> Normal_Operation
    }
    
    Error_Detected --> Resolution
    Emergency_Response --> Resolution
```

## 📊 Metrics Flow

```mermaid
graph LR
    subgraph "📥 Data Collection"
        A1[Hallucination Events]
        A2[Response Times]
        A3[Template Usage]
        A4[Config Errors]
        A5[Test Results]
    end
    
    subgraph "🔄 Processing"
        B1[claude-metrics.sh]
        B2[Log Parser]
        B3[Aggregator]
        B4[Validator]
    end
    
    subgraph "💾 Storage"
        C1[Raw Logs]
        C2[Daily JSON]
        C3[Historical DB]
        C4[Alert Cache]
    end
    
    subgraph "📊 Visualization"
        D1[Real-time Dashboard]
        D2[Daily Reports]
        D3[Weekly Trends]
        D4[Alert Notifications]
    end
    
    subgraph "🚨 Actions"
        E1[Auto-alerts]
        E2[Threshold Checks]
        E3[Remediation]
        E4[Escalation]
    end
    
    A1 --> B1
    A2 --> B1
    A3 --> B1
    A4 --> B1
    A5 --> B1
    
    B1 --> B2
    B2 --> B3
    B3 --> B4
    
    B4 --> C1
    B4 --> C2
    C1 --> C3
    B4 --> C4
    
    C2 --> D1
    C2 --> D2
    C3 --> D3
    C4 --> D4
    
    C4 --> E1
    B4 --> E2
    E1 --> E3
    E2 --> E3
    E3 --> E4
    
    E4 --> A1
    
    classDef collection fill:#e3f2fd
    classDef processing fill:#f3e5f5
    classDef storage fill:#e8f5e8
    classDef visualization fill:#fff3e0
    classDef actions fill:#ffebee
    
    class A1,A2,A3,A4,A5 collection
    class B1,B2,B3,B4 processing
    class C1,C2,C3,C4 storage
    class D1,D2,D3,D4 visualization
    class E1,E2,E3,E4 actions
```

---
**Note**: Ces diagrammes sont rendus par Mermaid et peuvent être intégrés dans la documentation GitHub, GitLab, ou tout système supportant la syntaxe Mermaid.

**Utilisation**: 
- Copier le code Mermaid dans un fichier `.md`
- Afficher dans un visualiseur Mermaid
- Intégrer dans la documentation projet