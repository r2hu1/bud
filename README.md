# bud

An AI-powered CLI planner that converts natural language tasks into executable shell commands. Describe what you want to do in plain English, and bud will inspect your system, search the web for docs, generate the appropriate commands, and ask for confirmation before executing them.

![Demo](./assets/demo.gif)

## Features

- **Natural Language Interface** — Describe tasks in plain English, no need to remember complex shell syntax
- **Multi-Provider AI Support** — Works with OpenAI, Anthropic, Google Gemini, Groq, Mistral, and OpenRouter
- **System Inspection** — AI inspects your files, directories, and git status before generating commands
- **Web Search & Docs Lookup** — AI searches the web and reads real documentation when it needs to verify a command or flag
- **Safe Execution** — Commands are displayed and require explicit confirmation before running
- **Built-in Safety Rules** — Blocks dangerous commands like `rm -rf /`, `shutdown`, and `reboot`
- **Interactive Setup** — Guided configuration process for API keys and provider selection

## Installation

### Quick Install (macOS / Linux)

```bash
curl -fsSL https://raw.githubusercontent.com/r2hu1/bud/main/scripts/install.sh | bash
```

Or download and run manually:

```bash
curl -fsSL https://raw.githubusercontent.com/r2hu1/bud/main/scripts/install.sh -o install.sh
chmod +x install.sh
./install.sh
```

This script detects your OS and architecture, downloads the latest release binary, and installs it to `/usr/local/bin` or `~/.local/bin`.

### Quick Install (Windows)

Download and run in PowerShell:

```powershell
Invoke-WebRequest -Uri https://raw.githubusercontent.com/r2hu1/bud/main/scripts/install.ps1 -OutFile install.ps1
.\install.ps1
```

The binary is installed to `%USERPROFILE%\.local\bin` and added to your user PATH automatically.

### From Source

Clone the repository and install dependencies:

```bash
git clone <repo-url>
cd bud
bun install
```

## Configuration

Run the interactive setup to configure your AI provider and API key:

```bash
bud setup
```

This will:

1. Prompt you to select an AI provider
2. Ask for your API key (input is masked)
3. Save the configuration to `~/.bud/config.json`

To reset your configuration:

```bash
bud reset
```

## Usage

Pass a natural language description of what you want to do:

```bash
bud commit all my changes
bud delete all .tmp files in the project
bud create a new git branch called feature-xyz
bud what is the command to initialise a vite project
bud how do I recursively find all TODO comments
```

The workflow:

1. bud sends your request to the AI along with system context
2. The AI decides whether to inspect your system, search the web, or answer directly
3. A list of shell commands is generated and displayed in a box
4. You confirm whether to execute the commands
5. Commands run sequentially (stops on first failure)

## How It Works

### System Prompt & Workflow

bud uses a strict system prompt that forces the AI to follow one of three modes:

| Mode            | When used                                                       |
| --------------- | --------------------------------------------------------------- |
| **Tool Mode**   | Task depends on real file contents, paths, or git state         |
| **Web Mode**    | Task requires live docs, package info, or an unfamiliar command |
| **Direct Mode** | Task is a well-known generic command — no inspection needed     |

The AI is instructed to:

- Never assume file names or paths exist
- Never hallucinate CLI flags — search for them instead
- Always generate commit messages from the actual git diff, never generically
- Return commands as a JSON array only (no explanations or markdown)

### Available AI Tools

#### System Tools

| Tool            | Description                             |
| --------------- | --------------------------------------- |
| `cwd`           | Get current working directory           |
| `os`            | Get OS platform and architecture        |
| `env`           | List environment variable names         |
| `listFiles`     | List files in a directory with metadata |
| `readFile`      | Read file content (first 3000 chars)    |
| `readFileLines` | Read specific lines from a file         |
| `fileExists`    | Check if a file or directory exists     |
| `gitStatus`     | Get git status (short format)           |
| `gitDiff`       | Get full git diff                       |
| `searchFiles`   | Search for text across files using grep |

#### Web Tools

| Tool           | Description                                                                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `webSearch`    | Search the web and return titles, URLs, snippets, and parsed page text. Used when the AI needs to verify a command, look up docs, or answer "how do I X" questions |
| `fetchWebPage` | Fetch and parse a specific URL into clean readable text, stripping scripts, nav, and footer noise                                                                  |

Web page content is extracted using **[cheerio](https://cheerio.js.org/)**, which parses real HTML and targets main content containers (`<main>`, `<article>`, `[role="main"]`) rather than naively stripping tags.

### Safety

- Commands containing `rm -rf /`, `shutdown`, or `reboot` are blocked
- You must confirm before any command execution
- The AI is instructed to return an empty array `[]` if a request seems unsafe
- The AI must search before returning any command it is not 100% certain about

## Project Structure

```
bud/
├── index.ts              # CLI entry point (Commander)
├── core/
│   ├── ai/
│   │   ├── system-prompt.ts   # AI system prompt & rules
│   │   ├── stream.ts          # AI stream generation
│   │   ├── run.ts             # LLM execution with Vercel AI SDK
│   │   ├── tools.ts           # AI tools (file, git, shell, web)
│   │   ├── models.ts          # LLM models
│   │   └── providers.ts       # AI provider configurations
│   ├── cli/
│   │   ├── setup.ts           # Interactive setup & reset
│   │   ├── commands.ts        # Commander instance
│   │   ├── run.ts             # Runs cmd
│   │   └── config.ts          # Config loader (~/.bud/config.json)
│   └── input.ts               # Input parsing & command normalization
├── package.json
└── tsconfig.json
```

## Development

The project uses:

- **Runtime**: [Bun](https://bun.sh) — fast all-in-one JavaScript runtime
- **Language**: TypeScript with strict mode
- **AI SDK**: [Vercel AI SDK](https://sdk.vercel.ai) with multiple provider adapters
- **CLI**: [Commander](https://github.com/tj/commander.js/) for argument parsing
- **UI**: [Boxen](https://github.com/sindresorhus/boxen) for formatted output, [Inquirer](https://github.com/SBoudrias/Inquirer.js/) for prompts
- **HTML Parsing**: [cheerio](https://cheerio.js.org/) for clean web content extraction

## Contributing

Contributions are welcome! Here's how to get started:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Make your changes
4. Test with `bun run index.ts "your test task"`
5. Commit your changes (`git commit -m 'Add some feature'`)
6. Push to the branch (`git push origin feature/your-feature`)
7. Open a Pull Request

### Ideas for Contributions

- Add more AI providers
- Add command history / logging
- Add a `--dry-run` flag to skip confirmation
- Add configuration options (default provider, model selection)
- Improve error handling and retry logic
- Add tests
- Support authenticated web search via a search API key

## License

MIT
