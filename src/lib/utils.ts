import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateInstallScript(skillName: string, repoUrl: string): string {
  return `#!/bin/bash
# Install ${skillName} skill for Claude Code
COMMANDS_DIR="$HOME/.claude/commands"
mkdir -p "$COMMANDS_DIR"

# Download SKILL.md directly
curl -sL "${repoUrl.replace('github.com', 'raw.githubusercontent.com').replace(/\/$/, '')}/main/SKILL.md" \
  -o "$COMMANDS_DIR/${skillName}.md"

echo "Skill '${skillName}' installed to $COMMANDS_DIR/${skillName}.md"
echo "Use /${skillName} in Claude Code to trigger this skill"
`
}

export function generateSkillTemplate(name: string, description: string): string {
  return `# ${name}

${description}

## Usage

Use \`/${name}\` in Claude Code to trigger this skill.

## Steps

1. [Step 1]
2. [Step 2]
3. [Step 3]

## Examples

**Input**: [Example user request]

**Output**: [What Claude does]
`
}
