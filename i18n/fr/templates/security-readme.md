# 🔐 Security Templates for Claude Code Projects

This directory contains reusable security templates for setting up secure Claude Code projects from scratch.

## 📁 Templates Included

| Template | Purpose | Usage |
|----------|---------|-------|
| `env.template` | Secure environment variables setup | Copy to `.env` and customize |
| `gitignore.template` | Comprehensive gitignore patterns | Merge with project `.gitignore` |
| `settings.local.template.json` | Claude Code permissions | Copy to `.claude/settings.local.json` |
| `setup-wizard.js` | Interactive security setup | Run with `node templates/security/setup-wizard.js` |

## 🚀 Quick Start

### 1. **Automated Setup (Recommended)**
```bash
# Run the interactive security wizard
node templates/security/setup-wizard.js

# Or add to package.json and run
npm run setup
```

### 2. **Manual Setup**
```bash
# Copy environment template
cp templates/security/env.template .env

# Merge gitignore patterns
cat templates/security/gitignore.template >> .gitignore

# Setup Claude Code permissions
mkdir -p .claude
cp templates/security/settings.local.template.json .claude/settings.local.json

# Validate setup
npm run check:env
npm run validate:security
```

## 🔒 Security Features

### **Environment Protection**
- ✅ All API key patterns covered
- ✅ Template prevents real keys in version control
- ✅ Format validation for each service
- ✅ Connectivity testing included

### **Gitignore Protection**
- ✅ 100+ sensitive file patterns
- ✅ OS-specific temporary files
- ✅ IDE and editor configurations
- ✅ Package manager artifacts
- ✅ Proprietary business data

### **Permission Model**
- ✅ Principle of least privilege
- ✅ Explicit allow/deny/ask lists
- ✅ Security-focused defaults
- ✅ Easy customization for different environments

### **Interactive Wizard**
- ✅ Step-by-step secure configuration
- ✅ Real-time validation and testing
- ✅ Format checking for API keys
- ✅ Connectivity verification
- ✅ Clear next steps guidance

## 🎯 Customization Guide

### **For Development Projects**
```json
// Add to settings.local.json allow list
"Bash(npm run dev:*)",
"Bash(docker-compose:*)",
"Bash(yarn:*)"
```

### **For Production Projects**
```json
// Add to settings.local.json allow list
"Bash(npm run build:*)",
"Bash(docker build:*)",
// Remove debug permissions
```

### **For Testing Projects**
```json
// Add to settings.local.json allow list
"Bash(jest:*)",
"Bash(cypress:*)",
"Bash(playwright:*)"
```

## 🧪 Validation Checklist

After setup, verify security with:

```bash
# ✅ Environment configured
npm run check:env

# ✅ No secrets in git
git status # Should not show .env
git log --all --full-history -- .env* # Should be empty

# ✅ Permissions working
claude code # Should work with configured permissions

# ✅ Security scan clean
npm run validate:security

# ✅ Dependencies secure
npm audit
pip-audit
```

## 🚨 Emergency Procedures

### **Secret Exposed in Git**
```bash
# 1. Immediately revoke the exposed key on the service
# 2. Generate new key
# 3. Update .env with new key
# 4. Clean git history (if needed)
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch .env' \
  --prune-empty --tag-name-filter cat -- --all
```

### **Permission Issues**
```bash
# Reset permissions to template defaults
cp templates/security/settings.local.template.json .claude/settings.local.json

# Or remove for prompting mode
rm .claude/settings.local.json
```

### **Validation Failures**
```bash
# Debug environment issues
node -e "require('dotenv').config(); console.log(process.env.ANTHROPIC_API_KEY ? 'Key loaded' : 'Key missing');"

# Test API connectivity
curl -H "Authorization: Bearer $ANTHROPIC_API_KEY" https://api.anthropic.com/v1/messages
```

## 📚 Additional Resources

- **Security Best Practices**: See `docs/security/ARCHITECTURE-DEFENSIVE.md`
- **Claude Code Documentation**: https://docs.anthropic.com/claude-code
- **API Key Security**: Each template includes service-specific validation
- **Incident Response**: See project `SECURITY-SETUP.md`

## 🔄 Maintenance

### **Monthly Security Review**
- [ ] Rotate API keys
- [ ] Audit permissions for new team members
- [ ] Review gitignore for new patterns
- [ ] Update dependencies
- [ ] Test security validation scripts

### **Template Updates**
This template is versioned and should be updated when:
- New services are integrated
- Security vulnerabilities are discovered
- Claude Code adds new permission types
- Team workflow changes

---

**Template Version**: 1.0
**Last Updated**: 19 September 2025
**Compatible With**: Claude Code v4.1+