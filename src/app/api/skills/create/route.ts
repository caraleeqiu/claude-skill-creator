import { NextResponse } from "next/server";
import { generateSkillTemplate } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const { name, description, author, repoName } = await request.json();

    if (!name || !description) {
      return NextResponse.json(
        { error: "Missing name or description" },
        { status: 400 }
      );
    }

    const skillMd = generateSkillTemplate(name, description);

    // Generate files structure for GitHub upload
    const files = {
      "SKILL.md": skillMd,
      "README.md": `# ${name}

${description}

## Installation

\`\`\`bash
mkdir -p ~/.claude/skills/${name}
git clone https://github.com/${author}/${repoName || name}.git ~/.claude/skills/${name}
\`\`\`

## Usage

Use \`/${name}\` in Claude Code to activate this skill.

## License

MIT
`,
    };

    return NextResponse.json({
      files,
      skillMd,
      installCommand: `mkdir -p ~/.claude/skills/${name} && git clone https://github.com/${author}/${repoName || name}.git ~/.claude/skills/${name}`,
    });
  } catch (error) {
    console.error("Error creating skill:", error);
    return NextResponse.json(
      { error: "Failed to create skill" },
      { status: 500 }
    );
  }
}
