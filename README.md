# 🛠️ Claude Code Starter Kit

> Personal project consolidating Claude Code best practices
> in a continuous improvement approach

**Status**: Experimental • **Focus**: Quality > Quantity • **Community**: Contributions welcome

[![Test Status](https://github.com/ccolleatte/claude-code-starter/workflows/Claude%20Config%20Validation/badge.svg)](https://github.com/ccolleatte/claude-code-starter/actions)
[![Version](https://img.shields.io/badge/Version-v4.2.0-blue.svg)](https://github.com/ccolleatte/claude-code-starter)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 💡 Why this project?

I developed this kit for **my own needs** while working with Claude Code.
Rather than keeping these practices to myself, I'm sharing them hoping they
might be useful to other developers.

**This is not** an enterprise-ready framework.
**This is** a collection of tested and documented best practices.

---

## 📈 Current status

**🌱 Project in development**
- **Goal**: Document and share Claude Code best practices
- **Approach**: Iteration and improvement based on real usage
- **Philosophy**: Transparency and authenticity first
- **Community**: Building, all contributions appreciated

### What already works
- ✅ Claude v2 instructions with adaptive workflow
- ✅ Native TodoWrite integration
- ✅ Autonomous MCP configuration
- ✅ Proof-driven documentation
- ✅ Basic test suite

### What remains to be done
- 🔄 Reusable templates (in progress)
- 🔄 Real performance metrics
- 🔄 Community feedback

---

## 🚀 Quick start

```bash
# Clone and setup
git clone https://github.com/ccolleatte/claude-code-starter.git
cd claude-code-starter

# Environment setup
cp .env.example .env
# Edit .env with your API keys

# Installation validation
npm run validate

# Run tests
npm test
```

## 📁 Project structure

```
├── .claude/                    # 🔧 Central configuration
│   ├── CLAUDE.md              # Critical rules (v2)
│   ├── CLAUDE-WORKFLOWS.md    # Detailed workflows
│   ├── CLAUDE-VALIDATION.md   # Proof-driven validation
│   ├── CLAUDE-ERRORS.md       # Error library
│   ├── scripts/               # MCP server scripts
│   └── metrics/               # Monitoring (basic)
├── docs/                      # 📖 Documentation
├── tests/                     # 🧪 Tests (18 tests)
└── scripts/                   # 🛠️ Utilities
```

## 🎯 Key innovations

### 1. **Adaptive workflow (v2)**
- Automatic task classification (Simple/Complex/Critical)
- Graduated communication based on complexity
- Conditional validation (no over-processing)

### 2. **Native TodoWrite**
- Abandon external files (tasks/todo.md)
- Real-time tracking integrated with Claude Code
- Single in_progress task at a time

### 3. **Proof-driven validation**
- Never claim without execution proof
- Automatic stop conditions
- Strict anti-hallucination

## 🔴 Critical rules

```bash
1. NEVER create without analyzing: mcp__serena__list_dir MANDATORY
2. ALWAYS prove by execution: No claims without output
3. TodoWrite MANDATORY: Integrated tool exclusively
4. Tests before code: RED → GREEN → REFACTOR without exception
```

*[Complete rules in .claude/CLAUDE.md]*

## ⚡ Essential commands

```bash
# Development
npm run validate          # Complete validation
npm test                  # Test suite
npm run check:env        # Environment verification

# Quality
npm run lint             # Linting
npm run format           # Formatting

# CI/CD
npm run ci:local         # Pre-commit validation
```

## 🧪 Testing and quality

**Basic test suite** (18 tests):
- Template syntax validation
- MCP scripts functionality
- Integration tests

```bash
# All tests
npm test

# Specific tests
pytest tests/claude/test_templates_syntax.py
pytest tests/claude/test_mcp_scripts.py
```

**Quality objectives** (modest but real):
- ✅ Valid template syntax
- ✅ Functional MCP scripts
- ✅ Coherent configuration
- 🔄 Test coverage to improve

## 🔧 Integrated MCP servers

| Server | Usage | Status |
|---------|-------|---------|
| **Serena** | Code analysis & editing | ✅ Tested |
| **Cipher** | Persistent memory | ✅ Tested |
| **Semgrep** | Security analysis | ✅ Tested |
| **Exa** | Documentation search | 🔄 Optional |

*Configuration: [.claude/scripts/](.claude/scripts/)*

## 📚 Documentation

| Document | Content | Audience |
|----------|---------|----------|
| [CLAUDE.md](.claude/CLAUDE.md) | Critical rules v2 | Everyone |
| [CLAUDE-WORKFLOWS.md](.claude/CLAUDE-WORKFLOWS.md) | TodoWrite workflows | Developers |
| [CLAUDE-VALIDATION.md](.claude/CLAUDE-VALIDATION.md) | Adaptive validation | Quality |

## 🤝 Contributing

**All contributions are welcome!**

1. **Fork** the repository
2. **Create** a branch: `git checkout -b feature/improvement`
3. **Test**: `npm test`
4. **Commit**: `git commit -m "feat: add improvement"`
5. **Push** and create PR

**No strict requirements** - any help is appreciated, even small improvements.

## 📊 Real metrics

**Current performance** (measured):
- Config loading time: ~45ms
- Test suite duration: ~12s
- Kit size: ~2.1MB

**Usage** (honest):
- Active users: Under evaluation
- Open issues: See [GitHub Issues](https://github.com/ccolleatte/claude-code-starter/issues)
- Contributions: First PRs expected

## 🔍 Next steps

**Short-term priorities**:
- 📋 Improve basic templates
- 🧪 Extend test coverage
- 📖 Enrich documentation
- 🔄 Gather user feedback

**Long-term vision**:
- Develop a real community if adoption happens
- Integrate more useful MCP servers
- Create use-case specific guides

## 🚨 Current limitations

**Let's be transparent**:
- Configuration can be complex for beginners
- Tests still basic (no E2E)
- Incomplete documentation on some aspects
- Limited metrics (no fancy dashboard)

**But it's an honest start!**

## 📞 Support and contact

- **🐛 Bugs**: [GitHub Issues](https://github.com/ccolleatte/claude-code-starter/issues)
- **💬 Questions**: [GitHub Discussions](https://github.com/ccolleatte/claude-code-starter/discussions)
- **📧 Direct contact**: GitHub Issues preferred

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

**Claude Code Starter Kit v4.2** - *A modest project growing with its community*

⭐ **Star this repo** if these practices helped you in your Claude development!