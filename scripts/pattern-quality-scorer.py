#!/usr/bin/env python3
"""
Pattern Quality Scorer
Evaluates and displays quality scores for patterns in the Claude Starter Kit
"""

import os
import json
import sys
import argparse
from pathlib import Path
from typing import Dict, List, Any, Optional
import re
import subprocess
from dataclasses import dataclass, asdict
from datetime import datetime

@dataclass
class QualityMetrics:
    """Quality metrics for a pattern"""
    test_coverage: float = 0.0
    documentation_score: float = 0.0
    complexity_score: float = 0.0
    security_score: float = 0.0
    maintainability_score: float = 0.0
    usage_frequency: int = 0
    last_updated: str = ""
    
    @property
    def overall_score(self) -> float:
        """Calculate weighted overall score"""
        weights = {
            'test_coverage': 0.25,
            'documentation_score': 0.20,
            'complexity_score': 0.15,
            'security_score': 0.25,
            'maintainability_score': 0.15
        }
        
        score = (
            self.test_coverage * weights['test_coverage'] +
            self.documentation_score * weights['documentation_score'] +
            (100 - self.complexity_score) * weights['complexity_score'] +  # Lower complexity is better
            self.security_score * weights['security_score'] +
            self.maintainability_score * weights['maintainability_score']
        )
        
        return min(100.0, max(0.0, score))
    
    @property
    def grade(self) -> str:
        """Convert score to letter grade"""
        score = self.overall_score
        if score >= 90: return "A+"
        elif score >= 85: return "A"
        elif score >= 80: return "A-"
        elif score >= 75: return "B+"
        elif score >= 70: return "B"
        elif score >= 65: return "B-"
        elif score >= 60: return "C+"
        elif score >= 55: return "C"
        elif score >= 50: return "C-"
        else: return "F"
    
    @property
    def emoji(self) -> str:
        """Get emoji representation of quality"""
        score = self.overall_score
        if score >= 90: return "🏆"
        elif score >= 80: return "⭐"
        elif score >= 70: return "✅"
        elif score >= 60: return "⚠️"
        else: return "❌"

class PatternQualityScorer:
    """Main scorer class"""
    
    def __init__(self, project_root: str = "."):
        self.project_root = Path(project_root)
        self.patterns_dir = self.project_root / "templates"
        self.scores_file = self.project_root / ".pattern-scores.json"
        self.cache_file = self.project_root / ".scorer-cache.json"
        
    def analyze_pattern(self, pattern_path: Path) -> QualityMetrics:
        """Analyze a single pattern and return quality metrics"""
        metrics = QualityMetrics()
        
        try:
            # Test Coverage Score
            metrics.test_coverage = self._calculate_test_coverage(pattern_path)
            
            # Documentation Score
            metrics.documentation_score = self._calculate_documentation_score(pattern_path)
            
            # Complexity Score
            metrics.complexity_score = self._calculate_complexity_score(pattern_path)
            
            # Security Score
            metrics.security_score = self._calculate_security_score(pattern_path)
            
            # Maintainability Score
            metrics.maintainability_score = self._calculate_maintainability_score(pattern_path)
            
            # Usage Frequency
            metrics.usage_frequency = self._get_usage_frequency(pattern_path)
            
            # Last Updated
            metrics.last_updated = self._get_last_updated(pattern_path)
            
        except Exception as e:
            print(f"[ERROR] Failed to analyze {pattern_path}: {e}", file=sys.stderr)
            
        return metrics
    
    def _calculate_test_coverage(self, pattern_path: Path) -> float:
        """Calculate test coverage for pattern"""
        test_files = []
        pattern_name = pattern_path.name
        
        # Look for test files
        possible_test_locations = [
            self.project_root / "tests" / f"test_{pattern_name}.py",
            self.project_root / "tests" / pattern_name / "test_*.py",
            pattern_path / "tests" / "*.py",
            pattern_path / f"test_{pattern_name}.py"
        ]
        
        for test_location in possible_test_locations:
            if test_location.exists():
                test_files.append(test_location)
            elif test_location.parent.exists():
                test_files.extend(test_location.parent.glob(test_location.name))
        
        if not test_files:
            return 0.0
        
        # Simple heuristic: if tests exist and have reasonable content
        total_test_lines = 0
        for test_file in test_files:
            try:
                content = test_file.read_text(encoding='utf-8')
                test_lines = len([line for line in content.split('\n') 
                                if line.strip() and not line.strip().startswith('#')])
                total_test_lines += test_lines
            except:
                continue
        
        # Score based on test comprehensiveness
        if total_test_lines > 100: return 95.0
        elif total_test_lines > 50: return 85.0
        elif total_test_lines > 20: return 75.0
        elif total_test_lines > 10: return 60.0
        elif total_test_lines > 0: return 40.0
        else: return 0.0
    
    def _calculate_documentation_score(self, pattern_path: Path) -> float:
        """Calculate documentation quality score"""
        score = 0.0
        
        # Check for README
        readme_files = list(pattern_path.glob("README*.md"))
        if readme_files:
            readme_content = readme_files[0].read_text(encoding='utf-8')
            
            # Score based on README content quality
            if len(readme_content) > 1000: score += 30
            elif len(readme_content) > 500: score += 20
            elif len(readme_content) > 200: score += 10
            
            # Check for key sections
            required_sections = ['usage', 'example', 'installation', 'configuration']
            for section in required_sections:
                if section.lower() in readme_content.lower():
                    score += 10
            
            # Check for code examples
            if '```' in readme_content: score += 20
            
        # Check for inline documentation in code files
        code_files = list(pattern_path.glob("**/*.py")) + list(pattern_path.glob("**/*.js")) + list(pattern_path.glob("**/*.sh"))
        
        if code_files:
            total_lines = 0
            comment_lines = 0
            
            for code_file in code_files:
                try:
                    content = code_file.read_text(encoding='utf-8')
                    lines = content.split('\n')
                    total_lines += len(lines)
                    
                    # Count comment lines
                    for line in lines:
                        stripped = line.strip()
                        if stripped.startswith('#') or stripped.startswith('//') or stripped.startswith('*'):
                            comment_lines += 1
                            
                except:
                    continue
            
            if total_lines > 0:
                comment_ratio = comment_lines / total_lines
                if comment_ratio > 0.3: score += 20
                elif comment_ratio > 0.2: score += 15
                elif comment_ratio > 0.1: score += 10
        
        return min(100.0, score)
    
    def _calculate_complexity_score(self, pattern_path: Path) -> float:
        """Calculate complexity score (lower is better)"""
        total_complexity = 0.0
        file_count = 0
        
        code_files = list(pattern_path.glob("**/*.py")) + list(pattern_path.glob("**/*.js"))
        
        for code_file in code_files:
            try:
                content = code_file.read_text(encoding='utf-8')
                
                # Simple complexity metrics
                lines = content.split('\n')
                code_lines = [line for line in lines if line.strip() and not line.strip().startswith('#')]
                
                # Count control structures
                control_structures = 0
                for line in code_lines:
                    if re.search(r'\b(if|for|while|try|except|with|def|class)\b', line):
                        control_structures += 1
                
                # Calculate cyclomatic complexity approximation
                file_complexity = control_structures + 1
                
                # Normalize by file size
                if len(code_lines) > 0:
                    normalized_complexity = (file_complexity / len(code_lines)) * 100
                    total_complexity += normalized_complexity
                    file_count += 1
                    
            except:
                continue
        
        if file_count == 0:
            return 20.0  # Default low complexity for non-code patterns
        
        avg_complexity = total_complexity / file_count
        return min(100.0, avg_complexity)
    
    def _calculate_security_score(self, pattern_path: Path) -> float:
        """Calculate security score"""
        score = 100.0  # Start with perfect score
        
        security_issues = []
        
        code_files = list(pattern_path.glob("**/*.py")) + list(pattern_path.glob("**/*.js")) + list(pattern_path.glob("**/*.sh"))
        
        for code_file in code_files:
            try:
                content = code_file.read_text(encoding='utf-8')
                
                # Check for security anti-patterns
                security_patterns = [
                    (r'eval\s*\(', 'eval() usage detected'),
                    (r'exec\s*\(', 'exec() usage detected'),
                    (r'shell=True', 'shell=True in subprocess'),
                    (r'subprocess\.call\([^)]*shell\s*=\s*True', 'Dangerous subprocess call'),
                    (r'os\.system\s*\(', 'os.system() usage'),
                    (r'input\s*\([^)]*\)', 'Unsafe input() usage'),
                    (r'pickle\.loads?\s*\(', 'Unsafe pickle usage'),
                    (r'yaml\.load\s*\(', 'Unsafe YAML loading'),
                    (r'["\'].*password.*["\']', 'Hardcoded password'),
                    (r'["\'].*api[_-]?key.*["\']', 'Hardcoded API key'),
                    (r'["\'].*secret.*["\']', 'Hardcoded secret'),
                ]
                
                for pattern, issue in security_patterns:
                    if re.search(pattern, content, re.IGNORECASE):
                        security_issues.append(f"{code_file.name}: {issue}")
                        score -= 15  # Deduct points for each issue
                        
            except:
                continue
        
        # Check for security best practices
        if (pattern_path / ".gitignore").exists():
            score += 5
            
        if any(f.name == "requirements.txt" for f in pattern_path.glob("**/*")):
            # Check for pinned dependencies
            try:
                req_content = (pattern_path / "requirements.txt").read_text()
                if "==" in req_content:
                    score += 5
            except:
                pass
        
        return max(0.0, min(100.0, score))
    
    def _calculate_maintainability_score(self, pattern_path: Path) -> float:
        """Calculate maintainability score"""
        score = 0.0
        
        # File organization
        has_structure = any([
            (pattern_path / "src").exists(),
            (pattern_path / "lib").exists(),
            (pattern_path / "scripts").exists(),
        ])
        if has_structure: score += 20
        
        # Version control indicators
        if (pattern_path / ".gitignore").exists(): score += 10
        if (pattern_path / "CHANGELOG.md").exists(): score += 15
        
        # Configuration files
        config_files = [
            "package.json", "requirements.txt", "setup.py", 
            "pyproject.toml", "Makefile", ".editorconfig"
        ]
        for config_file in config_files:
            if (pattern_path / config_file).exists():
                score += 5
        
        # Code quality indicators
        code_files = list(pattern_path.glob("**/*.py")) + list(pattern_path.glob("**/*.js"))
        if code_files:
            total_files = len(code_files)
            
            # Check for consistent naming
            consistent_naming = True
            for code_file in code_files:
                if not re.match(r'^[a-z][a-z0-9_]*\.(py|js)$', code_file.name):
                    consistent_naming = False
                    break
            
            if consistent_naming: score += 10
            
            # File size distribution (prefer smaller files)
            large_files = 0
            for code_file in code_files:
                try:
                    lines = len(code_file.read_text(encoding='utf-8').split('\n'))
                    if lines > 300:
                        large_files += 1
                except:
                    continue
            
            if large_files / total_files < 0.2: score += 15
            elif large_files / total_files < 0.5: score += 10
        
        return min(100.0, score)
    
    def _get_usage_frequency(self, pattern_path: Path) -> int:
        """Get usage frequency from metrics if available"""
        # This would integrate with actual usage metrics
        # For now, return a default value
        return 0
    
    def _get_last_updated(self, pattern_path: Path) -> str:
        """Get last update timestamp"""
        try:
            # Try git first
            result = subprocess.run(
                ["git", "log", "-1", "--format=%ci", str(pattern_path)],
                capture_output=True, text=True, cwd=self.project_root
            )
            if result.returncode == 0:
                return result.stdout.strip()
        except:
            pass
        
        # Fallback to file modification time
        try:
            mtime = pattern_path.stat().st_mtime
            return datetime.fromtimestamp(mtime).isoformat()
        except:
            return datetime.now().isoformat()
    
    def score_all_patterns(self) -> Dict[str, QualityMetrics]:
        """Score all patterns in the templates directory"""
        scores = {}
        
        if not self.patterns_dir.exists():
            print("[WARNING] Templates directory not found")
            return scores
        
        pattern_dirs = [d for d in self.patterns_dir.iterdir() if d.is_dir()]
        
        for pattern_dir in pattern_dirs:
            print(f"[INFO] Analyzing pattern: {pattern_dir.name}")
            metrics = self.analyze_pattern(pattern_dir)
            scores[pattern_dir.name] = metrics
        
        return scores
    
    def save_scores(self, scores: Dict[str, QualityMetrics]):
        """Save scores to JSON file"""
        serializable_scores = {}
        for pattern_name, metrics in scores.items():
            serializable_scores[pattern_name] = asdict(metrics)
        
        with open(self.scores_file, 'w') as f:
            json.dump(serializable_scores, f, indent=2)
        
        print(f"[SUCCESS] Scores saved to {self.scores_file}")
    
    def load_scores(self) -> Dict[str, QualityMetrics]:
        """Load scores from JSON file"""
        if not self.scores_file.exists():
            return {}
        
        try:
            with open(self.scores_file, 'r') as f:
                data = json.load(f)
            
            scores = {}
            for pattern_name, metrics_data in data.items():
                scores[pattern_name] = QualityMetrics(**metrics_data)
            
            return scores
        except Exception as e:
            print(f"[ERROR] Failed to load scores: {e}")
            return {}
    
    def display_scores(self, scores: Dict[str, QualityMetrics], format_type: str = "table"):
        """Display scores in various formats"""
        if not scores:
            print("[INFO] No pattern scores available")
            return
        
        if format_type == "table":
            self._display_table(scores)
        elif format_type == "json":
            self._display_json(scores)
        elif format_type == "summary":
            self._display_summary(scores)
        else:
            print(f"[ERROR] Unknown format: {format_type}")
    
    def _display_table(self, scores: Dict[str, QualityMetrics]):
        """Display scores in table format"""
        print("
" + "="*80)
        print("PATTERN QUALITY SCORES")
        print("="*80)
        
        # Header
        print(f"{'Pattern':<20} {'Grade':<6} {'Score':<6} {'Tests':<6} {'Docs':<6} {'Security':<8} {'Last Updated':<12}")
        print("-" * 80)
        
        # Sort by overall score (descending)
        sorted_scores = sorted(scores.items(), key=lambda x: x[1].overall_score, reverse=True)
        
        for pattern_name, metrics in sorted_scores:
            last_updated = metrics.last_updated[:10] if metrics.last_updated else "Unknown"
            
            # Use safe ASCII characters for Windows compatibility
            emoji_safe = {
                "🏆": "[A+]",
                "⭐": "[A ]", 
                "✅": "[B+]",
                "⚠️": "[C ]",
                "❌": "[F ]"
            }.get(metrics.emoji, "[?]")
            
            print(f"{pattern_name:<20} "
                  f"{emoji_safe} {metrics.grade:<4} "
                  f"{metrics.overall_score:>5.1f} "
                  f"{metrics.test_coverage:>5.1f} "
                  f"{metrics.documentation_score:>5.1f} "
                  f"{metrics.security_score:>7.1f} "
                  f"{last_updated:<12}")
        
        print("-" * 80)
        
        # Summary statistics
        if scores:
            avg_score = sum(m.overall_score for m in scores.values()) / len(scores)
            high_quality = sum(1 for m in scores.values() if m.overall_score >= 80)
            print(f"\nSummary: {len(scores)} patterns analyzed")
            print(f"Average quality score: {avg_score:.1f}")
            print(f"High quality patterns (≥80): {high_quality}/{len(scores)}")
    
    def _display_json(self, scores: Dict[str, QualityMetrics]):
        """Display scores in JSON format"""
        serializable_scores = {}
        for pattern_name, metrics in scores.items():
            serializable_scores[pattern_name] = asdict(metrics)
        
        print(json.dumps(serializable_scores, indent=2))
    
    def _display_summary(self, scores: Dict[str, QualityMetrics]):
        """Display summary statistics"""
        if not scores:
            return
        
        total_patterns = len(scores)
        avg_score = sum(m.overall_score for m in scores.values()) / total_patterns
        
        grade_counts = {}
        for metrics in scores.values():
            grade = metrics.grade
            grade_counts[grade] = grade_counts.get(grade, 0) + 1
        
        print(f"
[SUMMARY] PATTERN QUALITY SUMMARY")
        print(f"Total patterns: {total_patterns}")
        print(f"Average score: {avg_score:.1f}")
        print("\nGrade distribution:")
        for grade in ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "F"]:
            if grade in grade_counts:
                print(f"  {grade}: {grade_counts[grade]} patterns")

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="Pattern Quality Scorer")
    parser.add_argument("--project-root", default=".", help="Project root directory")
    parser.add_argument("--format", choices=["table", "json", "summary"], default="table", help="Output format")
    parser.add_argument("--score", action="store_true", help="Score patterns and save results")
    parser.add_argument("--show", action="store_true", help="Show existing scores")
    parser.add_argument("--pattern", help="Score specific pattern only")
    
    args = parser.parse_args()
    
    scorer = PatternQualityScorer(args.project_root)
    
    if args.score:
        if args.pattern:
            pattern_path = scorer.patterns_dir / args.pattern
            if pattern_path.exists():
                metrics = scorer.analyze_pattern(pattern_path)
                scores = {args.pattern: metrics}
                scorer.display_scores(scores, args.format)
            else:
                print(f"[ERROR] Pattern not found: {args.pattern}")
                sys.exit(1)
        else:
            scores = scorer.score_all_patterns()
            scorer.save_scores(scores)
            scorer.display_scores(scores, args.format)
    
    elif args.show:
        scores = scorer.load_scores()
        scorer.display_scores(scores, args.format)
    
    else:
        # Default: load existing scores or score if none exist
        scores = scorer.load_scores()
        if not scores:
            print("[INFO] No existing scores found. Scoring patterns...")
            scores = scorer.score_all_patterns()
            scorer.save_scores(scores)
        
        scorer.display_scores(scores, args.format)

if __name__ == "__main__":
    main()