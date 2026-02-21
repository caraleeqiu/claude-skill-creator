import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateInstallScript(skillName: string, repoUrl: string): string {
  return `#!/bin/bash
# Install ${skillName} skill for Claude Code
SKILL_DIR="$HOME/.claude/skills/${skillName}"
mkdir -p "$SKILL_DIR"
git clone --depth 1 ${repoUrl} /tmp/${skillName}-temp
cp -r /tmp/${skillName}-temp/* "$SKILL_DIR/"
rm -rf /tmp/${skillName}-temp
echo "Skill '${skillName}' installed to $SKILL_DIR"
`
}

export function generateSkillTemplate(name: string, description: string): string {
  return `---
name: ${name}
description: ${description}
---

# ${name}

## Usage

[Describe how to use this skill]

## Steps

1. [Step 1]
2. [Step 2]
3. [Step 3]

## Examples

\`\`\`
User: [Example input]
Action: [What the skill does]
Result: [Expected output]
\`\`\`
`
}
