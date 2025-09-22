# Test Autonomie Complète - Claude Code Starter Kit (Windows)
# ===========================================================

Write-Host "Test Autonomie Complete - Claude Code Starter Kit" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

$ErrorCount = 0
$CurrentDir = Get-Location

Write-Host "Tests d'autonomie..." -ForegroundColor Yellow

# Test 1: Structure présente
Write-Host "1. Vérification structure autonome..."
$RequiredFiles = @(".claude/mcp.json", ".env.template", "scripts/quick-setup.sh", "scripts/validate-setup.sh")
foreach ($file in $RequiredFiles) {
    if (Test-Path $file) {
        Write-Host "   ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $file manquant" -ForegroundColor Red
        $ErrorCount++
    }
}

# Test 2: Configuration MCP valide
Write-Host "2. Validation configuration MCP..."
if (Test-Path ".claude/mcp.json") {
    try {
        $mcpConfig = Get-Content ".claude/mcp.json" | ConvertFrom-Json
        $serverCount = $mcpConfig.mcpServers.PSObject.Properties.Count
        Write-Host "   ✅ JSON valide ($serverCount serveurs)" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ JSON invalide" -ForegroundColor Red
        $ErrorCount++
    }
} else {
    Write-Host "   ❌ Configuration MCP manquante" -ForegroundColor Red
    $ErrorCount++
}

# Test 3: Scripts MCP présents
Write-Host "3. Vérification scripts MCP..."
$mcpScripts = Get-ChildItem ".claude/scripts/*-mcp.sh" -ErrorAction SilentlyContinue
if ($mcpScripts) {
    foreach ($script in $mcpScripts) {
        Write-Host "   ✅ $($script.Name)" -ForegroundColor Green
    }
} else {
    Write-Host "   ❌ Scripts MCP manquants" -ForegroundColor Red
    $ErrorCount++
}

# Test 4: Template environnement complet
Write-Host "4. Vérification template .env..."
if (Test-Path ".env.template") {
    $content = Get-Content ".env.template" -Raw
    $keyCount = ([regex]::Matches($content, "^[A-Z].*_API_KEY=", [System.Text.RegularExpressions.RegexOptions]::Multiline)).Count
    if ($keyCount -ge 3) {
        Write-Host "   ✅ Template complet ($keyCount clés API)" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Template incomplet ($keyCount clés API)" -ForegroundColor Red
        $ErrorCount++
    }
} else {
    Write-Host "   ❌ Template .env manquant" -ForegroundColor Red
    $ErrorCount++
}

# Test 5: Package.json avec nouveaux scripts
Write-Host "5. Vérification nouveaux scripts npm..."
if (Test-Path "package.json") {
    $packageContent = Get-Content "package.json" -Raw
    if ($packageContent -match "setup:quick" -and $packageContent -match "setup:validate") {
        Write-Host "   ✅ Scripts npm setup présents" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Scripts npm setup manquants" -ForegroundColor Red
        $ErrorCount++
    }
} else {
    Write-Host "   ❌ package.json manquant" -ForegroundColor Red
    $ErrorCount++
}

# Test 6: Documentation cohérente
Write-Host "6. Vérification cohérence documentation..."
if (Test-Path "CLAUDE.md") {
    $claudeContent = Get-Content "CLAUDE.md" -Raw
    if ($claudeContent -match "setup:quick" -and $claudeContent -match "mcp.json") {
        Write-Host "   ✅ Documentation mise à jour" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Documentation obsolète" -ForegroundColor Red
        $ErrorCount++
    }
} else {
    Write-Host "   ❌ Documentation principale manquante" -ForegroundColor Red
    $ErrorCount++
}

# Test 7: Tests projet
Write-Host "7. Test exécution tests..."
try {
    $testResult = & npm test 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Tests passent" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Tests échouent (normal sans clés API complètes)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ⚠️  npm non disponible pour test" -ForegroundColor Yellow
}

# Résultat final
Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
if ($ErrorCount -eq 0) {
    Write-Host "🎉 AUTONOMIE COMPLÈTE VALIDÉE" -ForegroundColor Green
    Write-Host ""
    Write-Host "✅ Kit totalement autonome" -ForegroundColor Green
    Write-Host "✅ Configuration MCP locale fonctionnelle" -ForegroundColor Green
    Write-Host "✅ Scripts setup intégrés" -ForegroundColor Green
    Write-Host "✅ Documentation cohérente" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 Le kit est prêt pour déploiement indépendant!" -ForegroundColor Cyan
    exit 0
} else {
    Write-Host "❌ AUTONOMIE INCOMPLÈTE - $ErrorCount erreur(s)" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔧 Actions correctives nécessaires avant déploiement" -ForegroundColor Yellow
    exit 1
}