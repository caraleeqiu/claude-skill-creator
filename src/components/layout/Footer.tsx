export function Footer() {
  return (
    <footer className="border-t border-orange-100 dark:border-gray-800 py-8 mt-16 bg-white/50 dark:bg-gray-950/50">
      <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
        <p className="font-medium">Claude Skill Creator</p>
        <p className="mt-1">
          数据来源:{" "}
          <a
            href="https://github.com/topics/claude-skills"
            className="text-orange-500 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          {" | "}
          <a
            href="https://github.com/anthropics/skills"
            className="text-orange-500 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Anthropic Official
          </a>
        </p>
      </div>
    </footer>
  );
}
