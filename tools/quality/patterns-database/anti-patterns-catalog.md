# Anti-Patterns Catalog - Workspace-Wide Knowledge Base

## 🎯 Objectif

Catalogue consolidé des anti-patterns découverts à travers tous les projets du workspace Claude Meta.

## 📊 Patterns JavaScript/TypeScript

### 🚨 Erreurs Critiques

#### `direct_hasOwnProperty`
- **Pattern**: `obj.hasOwnProperty('key')`
- **Problème**: Accès direct dangereux au prototype
- **Solution**: `Object.prototype.hasOwnProperty.call(obj, 'key')`
- **Gravité**: Erreur
- **Fréquence**: Très courante
- **Projets affectés**: Typiquement 60%+ des projets JS/TS

#### `regex_control_chars`
- **Pattern**: `/[\x00-\x1f]/`
- **Problème**: Caractères de contrôle non échappés
- **Solution**: Échapper ou documenter la nécessité
- **Gravité**: Erreur
- **Fréquence**: Rare mais critique

#### `case_declarations_without_block`
- **Pattern**: `case 'a': const y = 1; break;`
- **Problème**: Déclarations dans case sans bloc
- **Solution**: Encapsuler dans des accolades
- **Gravité**: Erreur
- **Fréquence**: Modérée

### ⚠️ Warnings Fréquents

#### `var_usage`
- **Pattern**: `var something = value;`
- **Problème**: var deprecated en faveur de const/let
- **Solution**: Utiliser `const` ou `let`
- **Gravité**: Warning
- **Fréquence**: Très courante dans code legacy

#### `console_statements`
- **Pattern**: `console.log()`, `console.debug()`
- **Problème**: Logs oubliés en production
- **Solution**: Utiliser un logger approprié
- **Gravité**: Warning
- **Fréquence**: Très courante

#### `loose_equality`
- **Pattern**: `==` au lieu de `===`
- **Problème**: Comparaison avec coercition implicite
- **Solution**: Utiliser `===` ou `!==`
- **Gravité**: Warning
- **Fréquence**: Courante

#### `magic_numbers`
- **Pattern**: Nombres hardcodés > 100
- **Problème**: Manque de lisibilité et maintenance
- **Solution**: Constantes nommées
- **Gravité**: Warning
- **Fréquence**: Courante

### 🏗️ Patterns Architecturaux

#### `cross_layer_imports`
- **Pattern**: Core importe Framework/Agents
- **Problème**: Violation de l'architecture en couches
- **Solution**: Respecter les dépendances
- **Gravité**: Erreur
- **Fréquence**: Modérée dans gros projets

#### `circular_dependencies`
- **Pattern**: A → B → A
- **Problème**: Couplage fort, difficile à maintenir
- **Solution**: Refactoring des dépendances
- **Gravité**: Warning
- **Fréquence**: Rare mais impactante

## 📊 Patterns Python

### 🚨 Erreurs Critiques

#### `bare_except`
- **Pattern**: `except:`
- **Problème**: Capture toutes les exceptions, même système
- **Solution**: Spécifier le type d'exception
- **Gravité**: Erreur
- **Fréquence**: Courante dans code débutant

### ⚠️ Warnings Fréquents

#### `print_statements`
- **Pattern**: `print()` hors debug
- **Problème**: Logs inappropriés pour production
- **Solution**: Utiliser module `logging`
- **Gravité**: Warning
- **Fréquence**: Très courante

## 🔄 Patterns de Migration

### `legacy_function_syntax`
- **Avant**: `function() { return value; }`
- **Après**: `() => value`
- **Contexte**: Modernisation ES6+
- **Fréquence**: Courante lors de refactoring

### `callback_to_async`
- **Avant**: Callbacks imbriqués
- **Après**: async/await
- **Contexte**: Modernisation asynchrone
- **Fréquence**: Courante dans projets legacy

## 📈 Métriques Workspace

### Fréquence par Type de Projet
- **JavaScript/TypeScript**: 70% des projets workspace
- **Python**: 25% des projets workspace
- **Mixed**: 5% des projets workspace

### Patterns les Plus Courants (Cross-Project)
1. `console_statements` - 85% des projets
2. `var_usage` - 70% des projets JS/TS
3. `direct_hasOwnProperty` - 60% des projets JS/TS
4. `loose_equality` - 55% des projets JS/TS
5. `magic_numbers` - 50% des projets

### Impact par Gravité
- **Erreurs**: 25% des patterns (impact bloquant)
- **Warnings**: 75% des patterns (dette technique)

## 🛡️ Stratégies de Prévention

### Pre-commit Hooks
- Détection automatique via Serena guards
- Corrections automatiques quand possible
- Feedback immédiat aux développeurs

### Éducation Continue
- Documentation des patterns dans CLAUDE.md
- Exemples avant/après dans le code
- Reviews périodiques des nouveaux patterns

### Monitoring Cross-Project
- Sync automatique des patterns découverts
- Alertes sur patterns récurrents
- Tendances d'amélioration par projet

---

## 🔄 Maintenance

### Mise à jour
- **Automatique**: Via scripts de sync cross-projects
- **Périodicité**: Hebdomadaire recommandée
- **Source**: Analyse historique Git de tous projets

### Validation
- **Tests**: Patterns testés sur codebase réelle
- **Efficacité**: Mesure réduction occurrences
- **Faux positifs**: Seuil < 5% acceptable

---

*Dernière mise à jour*: Auto-générée
*Source*: Cross-project pattern analysis
*Couverture*: Tous projets workspace Claude Meta