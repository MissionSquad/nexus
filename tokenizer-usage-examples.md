# Tokenizer Usage Examples

This document provides examples of how to use the tokenizer functionality in both the `combineFiles.ts` and `codebaseBlob.ts` scripts, including specific examples for O1 and Claude tokenizers, as well as a comprehensive list of command line argument combinations.

## Basic Usage

The `combineFiles.ts` script combines multiple files into a single blob and counts the tokens in the combined text. By default, it uses the GPT-3.5-turbo tokenizer, but you can specify different tokenizers using command line arguments.

```bash
# Basic usage with default tokenizer (GPT-3.5-turbo)
yarn combine-files file1.ts file2.ts
```

## Examples for O1 Tokenizer

The O1 tokenizer uses the `o200k_base` encoding, which is also used by GPT-4o.

```bash
# Using O1 tokenizer by specifying the encoding directly
yarn combine-files --tokenizer o200k_base file1.ts file2.ts

# Alternative way to specify the O1 tokenizer
yarn combine-files --tokenizer-type gpt --tokenizer o200k_base file1.ts file2.ts
```

## Examples for Claude Tokenizer

The Claude tokenizer is available through the Hugging Face transformers library.

```bash
# Using Claude tokenizer
yarn combine-files --tokenizer-type xenova --tokenizer Xenova/claude-tokenizer file1.ts file2.ts

# Since Xenova/claude-tokenizer is the default for xenova type, this is equivalent
yarn combine-files --tokenizer-type xenova file1.ts file2.ts
```

## Examples for Gemini Tokenizer

The Gemini tokenizer uses SentencePiece with a vocabulary size of approximately 256,000 tokens.

```bash
# Using Gemini tokenizer
yarn combine-files --tokenizer-type gemini file1.ts file2.ts
```

## All Command Line Argument Combinations

### Basic File Operations

```bash
# Combine files with default settings (GPT-3.5-turbo tokenizer)
yarn combine-files file1.ts file2.ts

# Specify a base directory for calculating relative paths in output
yarn combine-files --base-dir ./src file1.ts file2.ts
yarn combine-files -b ./src file1.ts file2.ts

# Specify a target directory to resolve relative file paths from
yarn combine-files --target-dir ./src file1.ts file2.ts
yarn combine-files -t ./src file1.ts file2.ts

# Combine both base and target directory options
yarn combine-files --base-dir ./src --target-dir ./dist file1.ts file2.ts
yarn combine-files -b ./src -t ./dist file1.ts file2.ts
```

### GPT Tokenizer Options

```bash
# Specify a GPT tokenizer model
yarn combine-files --tokenizer gpt-3.5-turbo file1.ts file2.ts
yarn combine-files -m gpt-3.5-turbo file1.ts file2.ts

# Explicitly specify the tokenizer type as GPT (this is the default)
yarn combine-files --tokenizer-type gpt file1.ts file2.ts
yarn combine-files -tt gpt file1.ts file2.ts

# Combine tokenizer type and model
yarn combine-files --tokenizer-type gpt --tokenizer gpt-3.5-turbo file1.ts file2.ts
yarn combine-files -tt gpt -m gpt-3.5-turbo file1.ts file2.ts

# Use specific GPT tokenizer encodings
yarn combine-files --tokenizer r50k_base file1.ts file2.ts  # Used by text-davinci-001
yarn combine-files --tokenizer p50k_base file1.ts file2.ts  # Used by text-davinci-002/003
yarn combine-files --tokenizer p50k_edit file1.ts file2.ts  # Used for edit models
yarn combine-files --tokenizer cl100k_base file1.ts file2.ts  # Used by gpt-4-* and gpt-3.5-turbo
yarn combine-files --tokenizer o200k_base file1.ts file2.ts  # Used by gpt-4o and o1
```

### Xenova (Hugging Face) Tokenizer Options

```bash
# Specify tokenizer type as Xenova
yarn combine-files --tokenizer-type xenova file1.ts file2.ts
yarn combine-files -tt xenova file1.ts file2.ts

# Specify a Xenova tokenizer model
yarn combine-files --tokenizer-type xenova --tokenizer Xenova/claude-tokenizer file1.ts file2.ts
yarn combine-files -tt xenova -m Xenova/claude-tokenizer file1.ts file2.ts

# Other Xenova tokenizer models
yarn combine-files --tokenizer-type xenova --tokenizer Xenova/bert-base-uncased file1.ts file2.ts
yarn combine-files --tokenizer-type xenova --tokenizer Xenova/mistral-tokenizer-v1 file1.ts file2.ts
yarn combine-files --tokenizer-type xenova --tokenizer Xenova/llama-tokenizer file1.ts file2.ts
```

### Combined Options

```bash
# Combine all types of options
yarn combine-files --base-dir ./src --target-dir ./dist --tokenizer-type gpt --tokenizer cl100k_base file1.ts file2.ts
yarn combine-files -b ./src -t ./dist -tt gpt -m cl100k_base file1.ts file2.ts

yarn combine-files --base-dir ./src --target-dir ./dist --tokenizer-type xenova --tokenizer Xenova/claude-tokenizer file1.ts file2.ts
yarn combine-files -b ./src -t ./dist -tt xenova -m Xenova/claude-tokenizer file1.ts file2.ts

# Using Gemini tokenizer with other options
yarn combine-files --base-dir ./src --target-dir ./dist --tokenizer-type gemini file1.ts file2.ts
yarn combine-files -b ./src -t ./dist -tt gemini file1.ts file2.ts
```

## Using with npm

If you're using npm instead of yarn, you need to add `--` before the options:

```bash
npm run combine-files -- --tokenizer-type xenova --tokenizer Xenova/claude-tokenizer file1.ts file2.ts
npm run combine-files -- --tokenizer-type gemini file1.ts file2.ts
```

## Using the Compiled JavaScript

If you've compiled the TypeScript to JavaScript, you can run it directly:

```bash
node dist/combineFiles.js --tokenizer-type xenova --tokenizer Xenova/claude-tokenizer file1.ts file2.ts
node dist/combineFiles.js --tokenizer-type gemini file1.ts file2.ts
```

## Using the codebaseBlob.ts Script

The `codebaseBlob.ts` script scans a directory recursively and combines all text files into a single blob, respecting .gitignore files and excluding binary files. It now also supports the same tokenizer functionality as the combineFiles.ts script.

### Basic Usage

```bash
# Basic usage with default tokenizer (GPT-3.5-turbo)
yarn start-ts /path/to/project
```

### Examples for O1 Tokenizer

```bash
# Using O1 tokenizer by specifying the encoding directly
yarn start-ts --tokenizer o200k_base /path/to/project

# Alternative way to specify the O1 tokenizer
yarn start-ts --tokenizer-type gpt --tokenizer o200k_base /path/to/project
```

### Examples for Claude Tokenizer

```bash
# Using Claude tokenizer
yarn start-ts --tokenizer-type xenova --tokenizer Xenova/claude-tokenizer /path/to/project

# Since Xenova/claude-tokenizer is the default for xenova type, this is equivalent
yarn start-ts --tokenizer-type xenova /path/to/project
```

### Examples for Gemini Tokenizer

```bash
# Using Gemini tokenizer
yarn start-ts --tokenizer-type gemini /path/to/project
```

### Using with npm

```bash
npm run start-ts -- --tokenizer-type xenova --tokenizer Xenova/claude-tokenizer /path/to/project
npm run start-ts -- --tokenizer-type gemini /path/to/project
```

### Using the Compiled JavaScript

```bash
node dist/codebaseBlob.js --tokenizer-type xenova --tokenizer Xenova/claude-tokenizer /path/to/project
node dist/codebaseBlob.js --tokenizer-type gemini /path/to/project
```
