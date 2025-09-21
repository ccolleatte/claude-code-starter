#!/usr/bin/env python3
"""
Simple Pattern Quality Scorer
Windows-compatible version with basic scoring
"""

import os
import json
import sys
from pathlib import Path
from dataclasses import dataclass, asdict

@dataclass
class QualityMetrics:
    test_coverage: float = 0.0
    documentation_score: float = 0.0
    security_score: float = 0.0
    overall_score: float = 0.0
    grade: str = "F"

def calculate_pattern_score(pattern_path):
    """Calculate basic quality score for a pattern"""
    score = QualityMetrics()
    
    # Check for README
    readme_files = list(pattern_path.glob("README*.md"))
    if readme_files and readme_files[0].exists():
        readme_content = readme_files[0].read_text(encoding='utf-8')
        if len(readme_content) > 500:
            score.documentation_score = 80.0
        elif len(readme_content) > 200:
            score.documentation_score = 60.0
        else:
            score.documentation_score = 30.0
    
    # Check for tests
    test_files = list(pattern_path.glob("**/test_*.py")) + list(pattern_path.glob("tests/*.py"))
    if test_files:
        score.test_coverage = 75.0
    
    # Check for security files
    if (pattern_path / ".gitignore").exists():
        score.security_score = 70.0
    else:
        score.security_score = 50.0
    
    # Calculate overall score
    score.overall_score = (score.test_coverage * 0.4 + 
                          score.documentation_score * 0.4 + 
                          score.security_score * 0.2)
    
    # Assign grade
    if score.overall_score >= 80:
        score.grade = "A"
    elif score.overall_score >= 70:
        score.grade = "B"
    elif score.overall_score >= 60:
        score.grade = "C"
    else:
        score.grade = "F"
    
    return score

def main():
    """Main function"""
    project_root = Path(".")
    templates_dir = project_root / "templates"
    
    if not templates_dir.exists():
        print("[ERROR] Templates directory not found")
        return 1
    
    print("PATTERN QUALITY SCORES")
    print("=" * 60)
    print(f"{'Pattern':<20} {'Grade':<6} {'Score':<8} {'Tests':<8} {'Docs':<8}")
    print("-" * 60)
    
    pattern_dirs = [d for d in templates_dir.iterdir() if d.is_dir()]
    all_scores = {}
    
    for pattern_dir in pattern_dirs:
        metrics = calculate_pattern_score(pattern_dir)
        all_scores[pattern_dir.name] = metrics
        
        print(f"{pattern_dir.name:<20} "
              f"{metrics.grade:<6} "
              f"{metrics.overall_score:>6.1f} "
              f"{metrics.test_coverage:>6.1f} "
              f"{metrics.documentation_score:>6.1f}")
    
    print("-" * 60)
    
    # Save scores
    scores_file = project_root / ".pattern-scores.json"
    with open(scores_file, 'w') as f:
        serializable_scores = {}
        for name, metrics in all_scores.items():
            serializable_scores[name] = asdict(metrics)
        json.dump(serializable_scores, f, indent=2)
    
    print(f"\nScores saved to {scores_file}")
    print(f"Analyzed {len(pattern_dirs)} patterns")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())