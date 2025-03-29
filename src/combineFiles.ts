import fs from "fs/promises";
import path from "path";
import { encode as defaultEncode } from "gpt-tokenizer";
import { AutoTokenizer } from "@huggingface/transformers";
import { fromPreTrained as geminiTokenizer } from "@lenml/tokenizer-gemini";

// --- Configuration ---
const FILE_BOUNDARY = "--- NEXUS FILE BOUNDARY ---";
const FILE_PATH_HEADER = "FILEPATH:";

// Heuristic set of common binary file extensions to exclude.
const BINARY_EXTENSIONS = new Set([
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

/**
 * Process a single file and return its formatted content
 * @param filePath Path to the file to process
 * @param baseDir Optional base directory for relative path calculation
 * @returns Formatted file content or null if file should be skipped
 */
async function processFile(
  filePath: string,
  baseDir?: string
): Promise<string | null> {
  try {
    // Resolve absolute path
    const absoluteFilePath = path.resolve(filePath);

    // Get relative path if baseDir is provided, otherwise use the filename
    const displayPath = baseDir
      ? path
          .relative(path.resolve(baseDir), absoluteFilePath)
          .replace(/\\/g, "/")
      : path.basename(absoluteFilePath);

    // Check if file exists
    const fileStat = await fs.stat(absoluteFilePath);
    if (!fileStat.isFile()) {
      console.error(`Skipping non-file: ${filePath}`);
      return null;
    }

    // Check file extension
    const fileExtension = path.extname(absoluteFilePath).toLowerCase();
    if (BINARY_EXTENSIONS.has(fileExtension)) {
      console.error(`Skipping binary (by extension): ${filePath}`);
      return null;
    }

    // Read file content
    let content: string;
    try {
      content = await fs.readFile(absoluteFilePath, "utf-8");

      // Check for null bytes (binary file indicator)
      if (content.includes("\u0000")) {
        console.error(`Skipping binary (contains null bytes): ${filePath}`);
        return null;
      }
    } catch (error: any) {
      console.error(`Error reading file ${filePath}: ${error.message}`);
      return null;
    }

    // Format with boundary and header
    const outputParts: string[] = [];
    outputParts.push(FILE_BOUNDARY);
    outputParts.push(`${FILE_PATH_HEADER} ${displayPath}`);
    outputParts.push(content);

    console.error(`Including file: ${filePath}`);
    return outputParts.join("\n");
  } catch (error: any) {
    console.error(`Error processing file ${filePath}: ${error.message}`);
    return null;
  }
}

/**
 * Combine multiple files into a single blob
 * @param filePaths Array of file paths to combine
 * @param baseDir Optional base directory for relative path calculation
 * @returns Combined content of all files
 */
async function combineFiles(
  filePaths: string[],
  baseDir?: string
): Promise<string> {
  console.error(`Processing ${filePaths.length} files...`);

  const processedContents: string[] = [];

  for (const filePath of filePaths) {
    const content = await processFile(filePath, baseDir);
    if (content) {
      processedContents.push(content);
    }
  }

  console.error(
    `Successfully included ${processedContents.length} files in the final blob.`
  );

  return processedContents.join("\n");
}

// Default tokenizer model for gpt-tokenizer
const DEFAULT_GPT_TOKENIZER = "gpt-3.5-turbo";
// Default tokenizer model for Xenova
const DEFAULT_XENOVA_TOKENIZER = "Xenova/claude-tokenizer";

/**
 * Parse command line arguments
 */
function parseArgs(args: string[]): {
  filePaths: string[];
  baseDir?: string;
  targetDir?: string;
  tokenizer?: string;
  tokenizerType?: "gpt" | "xenova" | "gemini";
} {
  const result = {
    filePaths: [] as string[],
    baseDir: undefined as string | undefined,
    targetDir: undefined as string | undefined,
    tokenizer: undefined as string | undefined,
    tokenizerType: undefined as "gpt" | "xenova" | "gemini" | undefined,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--base-dir" || arg === "-b") {
      // Next argument should be the base directory
      if (i + 1 < args.length) {
        result.baseDir = args[++i];
      } else {
        throw new Error("Missing value for --base-dir option");
      }
    } else if (arg === "--target-dir" || arg === "-t") {
      // Next argument should be the target directory
      if (i + 1 < args.length) {
        result.targetDir = args[++i];
      } else {
        throw new Error("Missing value for --target-dir option");
      }
    } else if (arg === "--tokenizer" || arg === "-m") {
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
      // Treat as a file path
      result.filePaths.push(arg);
    }
  }

  if (result.filePaths.length === 0) {
    throw new Error("No file paths provided");
  }

  return result;
}

/**
 * Main function
 */
async function main() {
  try {
    const userArgs = process.argv.slice(2);

    if (userArgs.length === 0) {
      console.error("Usage: yarn combine-files [options] <file1> <file2> ...");
      console.error(
        "   or: npm run combine-files -- [options] <file1> <file2> ..."
      );
      console.error(
        "   or: node dist/combineFiles.js [options] <file1> <file2> ..."
      );
      console.error("");
      console.error("Options:");
      console.error(
        "  --base-dir, -b       Base directory for calculating relative paths in output"
      );
      console.error(
        "  --target-dir, -t     Target directory to resolve relative file paths from"
      );
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
      console.error(
        "    - Xenova/mistral-tokenizer-v1: Mistral model tokenizer"
      );
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

    const { filePaths, baseDir, targetDir, tokenizer, tokenizerType } =
      parseArgs(userArgs);

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

    // Process file paths if target directory is provided
    let processedFilePaths = filePaths;
    if (targetDir) {
      console.error(`Using target directory: ${targetDir}`);
      // Resolve file paths relative to the target directory
      processedFilePaths = filePaths.map((filePath) => {
        // If the path is already absolute, use it as is
        if (path.isAbsolute(filePath)) {
          return filePath;
        }
        // Otherwise, resolve it relative to the target directory
        return path.join(targetDir, filePath);
      });
    }

    // Use target directory as base directory if base directory is not provided
    const effectiveBaseDir = baseDir || targetDir;
    if (baseDir && !targetDir) {
      console.error(`Using base directory: ${baseDir}`);
    } else if (effectiveBaseDir && effectiveBaseDir !== baseDir) {
      console.error(`Using base directory for output: ${effectiveBaseDir}`);
    }

    const blob = await combineFiles(processedFilePaths, effectiveBaseDir);

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

    process.stdout.write(blob);
  } catch (error: any) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

// Execute main function
main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
