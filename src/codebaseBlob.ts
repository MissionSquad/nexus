import fs from "fs/promises";
import path from "path";
import fastGlob from "fast-glob";
import { minimatch } from "minimatch";
import { encode as defaultEncode } from "gpt-tokenizer";
import { AutoTokenizer } from "@huggingface/transformers";
import { fromPreTrained as geminiTokenizer } from "@lenml/tokenizer-gemini";

// --- Configuration ---
const FILE_BOUNDARY = "--- NEXUS FILE BOUNDARY ---";
const FILE_PATH_HEADER = "FILEPATH:";

// Heuristic set of common binary file extensions to exclude.
const BINARY_EXTENSIONS = new Set([
  // ... (keep the existing list from the previous version) ...
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".bmp",
  ".tiff",
  ".webp",
  ".ico",
  ".svg",
  ".zip",
  ".tar",
  ".gz",
  ".bz2",
  ".rar",
  ".7z",
  ".jar",
  ".war",
  ".mp4",
  ".mov",
  ".avi",
  ".wmv",
  ".mkv",
  ".flv",
  ".mp3",
  ".wav",
  ".ogg",
  ".aac",
  ".flac",
  ".ttf",
  ".otf",
  ".woff",
  ".woff2",
  ".eot",
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".odt",
  ".ods",
  ".odp",
  ".exe",
  ".dll",
  ".so",
  ".dylib",
  ".app",
  ".class",
  ".sqlite",
  ".db",
  ".mdb",
  ".pyc",
  ".pyd",
  ".lock",
  ".bin",
  ".dat",
  ".iso",
]);

// --- ADD THIS SECTION ---
// Static list of glob patterns to always ignore, in addition to .gitignore
// Uses minimatch syntax: https://github.com/isaacs/minimatch
// Examples: Specific files, directories, file types
const STATIC_IGNORE_PATTERNS: string[] = [
  "**/__pycache__/**", // Ignore Python bytecode cache directories anywhere
  "*.log", // Ignore all .log files
  "*.tmp", // Ignore all .tmp files
  "config/secrets.yml", // Ignore a specific sensitive file
  "temp/**", // Ignore anything inside a 'temp' directory at the root
  "tmp/**", // Ignore anything inside a 'tmp' directory at the root
  ".env", // Ignore .env files at the root (often handled by .gitignore too)
  "coverage/**", // Ignore coverage reports
  // Add any other patterns you need here
  ".nexus/**",
  ".npmrc",
];
// --- END ADDED SECTION ---

// Default tokenizer model for gpt-tokenizer
const DEFAULT_GPT_TOKENIZER = "gpt-3.5-turbo";
// Default tokenizer model for Xenova
const DEFAULT_XENOVA_TOKENIZER = "Xenova/claude-tokenizer";

// --- End Configuration ---

/**
 * Parse command line arguments
 */
function parseArgs(args: string[]): {
  projectDir: string;
  tokenizer?: string;
  tokenizerType?: "gpt" | "xenova" | "gemini";
} {
  const result = {
    projectDir: "",
    tokenizer: undefined as string | undefined,
    tokenizerType: undefined as "gpt" | "xenova" | "gemini" | undefined,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--tokenizer" || arg === "-m") {
      // Next argument should be the tokenizer model
      if (i + 1 < args.length) {
        result.tokenizer = args[++i];
      } else {
        throw new Error("Missing value for --tokenizer option");
      }
    } else if (arg === "--tokenizer-type" || arg === "-tt") {
      // Next argument should be the tokenizer type
      if (i + 1 < args.length) {
        const type = args[++i].toLowerCase();
        if (type === "gpt" || type === "xenova" || type === "gemini") {
          result.tokenizerType = type;
        } else {
          throw new Error(
            "Invalid tokenizer type. Must be 'gpt', 'xenova', or 'gemini'"
          );
        }
      } else {
        throw new Error("Missing value for --tokenizer-type option");
      }
    } else {
      // Treat as the project directory (last one wins)
      result.projectDir = arg;
    }
  }

  if (!result.projectDir) {
    throw new Error("No project directory provided");
  }

  return result;
}

async function generateNexusBlob(rootDir: string): Promise<string> {
  console.error(`Starting scan in directory: ${rootDir}`); // Log to stderr

  const absoluteRootDir = path.resolve(rootDir);
  console.error(`Absolute path: ${absoluteRootDir}`);

  // fast-glob finds files, respecting .gitignore
  const files = await fastGlob("**/*", {
    cwd: absoluteRootDir,
    dot: true,
    ignore: ["**/node_modules/**", "**/.git/**"],
    absolute: true,
    stats: false,
    onlyFiles: true,
  });

  console.error(`Found ${files.length} potential files (pre-filtering)...`);

  const outputParts: string[] = [];

  for (const absoluteFilePath of files) {
    // Get relative path and normalize slashes for consistent matching
    const relativeFilePath = path
      .relative(absoluteRootDir, absoluteFilePath)
      .replace(/\\/g, "/");
    const fileExtension = path.extname(absoluteFilePath).toLowerCase();

    // --- ADD THIS CHECK ---
    // 1. Check against the static ignore list using minimatch
    let isStaticallyIgnored = false;
    for (const pattern of STATIC_IGNORE_PATTERNS) {
      // Use dot:true so patterns like '*.log' match '.secret.log'
      if (minimatch(relativeFilePath, pattern, { dot: true })) {
        console.error(
          `Skipping (static ignore list pattern: "${pattern}"): ${relativeFilePath}`
        );
        isStaticallyIgnored = true;
        break; // No need to check other static patterns
      }
    }
    if (isStaticallyIgnored) {
      continue; // Move to the next file
    }
    // --- END ADDED CHECK ---

    // 2. Filter by binary extension (Existing check)
    if (BINARY_EXTENSIONS.has(fileExtension)) {
      console.error(`Skipping binary (by extension): ${relativeFilePath}`);
      continue;
    }

    // 3. Read file content (Existing check)
    let content: string;
    try {
      content = await fs.readFile(absoluteFilePath, "utf-8");
      if (content.includes("\u0000")) {
        console.error(
          `Skipping binary (contains null bytes): ${relativeFilePath}`
        );
        continue;
      }
    } catch (error: any) {
      if (error.code === "ENOENT") {
        console.error(
          `Error: File not found (unexpected): ${relativeFilePath}`
        );
      } else {
        console.error(
          `Skipping file (read error or likely binary): ${relativeFilePath} - Error: ${error.message}`
        );
      }
      continue;
    }

    // 4. Format and add to output (Existing logic)
    console.error(`Including text file: ${relativeFilePath}`);
    outputParts.push(FILE_BOUNDARY);
    outputParts.push(`${FILE_PATH_HEADER} ${relativeFilePath}`); // Already normalized
    outputParts.push(content);
  }

  console.error(`Included ${outputParts.length / 3} files in the final blob.`);

  return outputParts.join("\n");
}

// --- Main Execution ---
(async () => {
  const userArgs = process.argv.slice(2);
  if (userArgs.length === 0) {
    console.error("Usage: yarn start-ts [options] <path_to_project_directory>");
    console.error(
      "   or: npm run start-ts -- [options] <path_to_project_directory>"
    );
    console.error(
      "   or: node dist/codebaseBlob.js [options] <path_to_project_directory>"
    );
    console.error("");
    console.error("Options:");
    console.error(
      "  --tokenizer, -m      Tokenizer model to use (default: gpt-3.5-turbo for GPT, Xenova/claude-tokenizer for Xenova)"
    );
    console.error(
      "  --tokenizer-type, -tt  Type of tokenizer to use: 'gpt', 'xenova', or 'gemini' (default: gpt)"
    );
    console.error("");
    console.error("  GPT Tokenizer Encodings:");
    console.error("    - r50k_base: Used by text-davinci-001");
    console.error("    - p50k_base: Used by text-davinci-002/003");
    console.error("    - p50k_edit: Used for edit models");
    console.error("    - cl100k_base: Used by gpt-4-* and gpt-3.5-turbo");
    console.error("    - o200k_base: Used by gpt-4o and o1");
    console.error("");
    console.error("  Xenova Tokenizers (from Hugging Face):");
    console.error("    - Xenova/claude-tokenizer: Claude model tokenizer");
    console.error("    - Xenova/bert-base-uncased: BERT model tokenizer");
    console.error("    - Xenova/mistral-tokenizer-v1: Mistral model tokenizer");
    console.error("    - Xenova/llama-tokenizer: Llama model tokenizer");
    console.error("");
    console.error("  Gemini Tokenizer:");
    console.error(
      "    - Uses SentencePiece tokenizer with a vocabulary size of ~256k tokens"
    );
    console.error(
      "    - No model options needed, just specify --tokenizer-type gemini"
    );
    process.exit(1);
  }

  try {
    // Parse command line arguments
    const { projectDir, tokenizer, tokenizerType } = parseArgs(userArgs);

    // Set default tokenizer type if not specified
    const effectiveTokenizerType = tokenizerType || "gpt";

    // Set default tokenizer model based on type if not specified
    const effectiveTokenizer =
      tokenizer ||
      (effectiveTokenizerType === "gpt"
        ? DEFAULT_GPT_TOKENIZER
        : DEFAULT_XENOVA_TOKENIZER);

    if (effectiveTokenizerType === "gpt") {
      console.error(`Using GPT tokenizer: ${effectiveTokenizer}`);
    } else if (effectiveTokenizerType === "xenova") {
      console.error(`Using Xenova tokenizer: ${effectiveTokenizer}`);
    } else if (effectiveTokenizerType === "gemini") {
      console.error(`Using Gemini tokenizer`);
    }

    // Check if directory exists
    const directoryStat = await fs.stat(projectDir);
    if (!directoryStat.isDirectory()) {
      console.error(`Error: Provided path is not a directory: ${projectDir}`);
      process.exit(1);
    }

    // Generate the blob
    const blob = await generateNexusBlob(projectDir);

    // Count tokens in the combined blob
    if (effectiveTokenizerType === "gpt") {
      // Use gpt-tokenizer
      let encode = defaultEncode;

      // Check if a specific GPT tokenizer encoding was specified
      if (effectiveTokenizer !== DEFAULT_GPT_TOKENIZER) {
        try {
          // Try to load the specified encoding
          // First check if it's a model name
          try {
            const modelModule = await import(
              `gpt-tokenizer/model/${effectiveTokenizer}`
            );
            encode = modelModule.encode;
            console.error(`Loaded GPT tokenizer model: ${effectiveTokenizer}`);
          } catch (modelError) {
            // If not a model, try as an encoding
            try {
              const encodingModule = await import(
                `gpt-tokenizer/encoding/${effectiveTokenizer}`
              );
              encode = encodingModule.encode;
              console.error(
                `Loaded GPT tokenizer encoding: ${effectiveTokenizer}`
              );
            } catch (encodingError) {
              console.error(
                `Error loading GPT tokenizer: ${effectiveTokenizer}`
              );
              console.error("Falling back to default GPT tokenizer");
            }
          }
        } catch (error: any) {
          console.error(`Error loading GPT tokenizer: ${error.message}`);
          console.error("Falling back to default GPT tokenizer");
        }
      }

      const tokens = encode(blob);
      console.error(`Total tokens in combined blob: ${tokens.length}`);
    } else if (effectiveTokenizerType === "xenova") {
      // Use Xenova tokenizer
      try {
        const tokenizer = await AutoTokenizer.from_pretrained(
          effectiveTokenizer
        );
        const tokens = tokenizer.encode(blob);
        console.error(`Total tokens in combined blob: ${tokens.length}`);
      } catch (error: any) {
        console.error(
          `Error tokenizing with Xenova tokenizer: ${error.message}`
        );
        console.error("Falling back to GPT tokenizer");
        const tokens = defaultEncode(blob);
        console.error(
          `Total tokens in combined blob (GPT fallback): ${tokens.length}`
        );
      }
    } else if (effectiveTokenizerType === "gemini") {
      // Use Gemini tokenizer
      try {
        const tokenizer = geminiTokenizer();
        const tokens = tokenizer.encode(blob, {
          add_special_tokens: true,
        });
        console.error(`Total tokens in combined blob: ${tokens.length}`);
      } catch (error: any) {
        console.error(
          `Error tokenizing with Gemini tokenizer: ${error.message}`
        );
        console.error("Falling back to GPT tokenizer");
        const tokens = defaultEncode(blob);
        console.error(
          `Total tokens in combined blob (GPT fallback): ${tokens.length}`
        );
      }
    }

    // Output the blob to stdout
    process.stdout.write(blob);
  } catch (error: any) {
    if (error.code === "ENOENT") {
      console.error(`Error: Directory not found: ${error.path}`);
    } else {
      console.error("An unexpected error occurred:", error.message);
    }
    process.exit(1);
  }
})();
