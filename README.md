# The Nexus System: AI-Assisted Software Development Paradigm

## Overview

The Nexus System is a software development paradigm designed to enhance collaboration between human engineers and AI coding assistants, particularly in the context of large language models (LLMs) with limited context windows. It addresses the challenges of context management, knowledge retention, and the evolving role of engineers in an AI-driven development landscape. The system achieves this by creating and maintaining a structured directory of Markdown documents that capture crucial project information, plans, decisions, and ongoing work in a way that is both human-readable and machine-processable. One of the goals is to reduce token usage by the AI assistant, allowing it to read only the information it needs for a given task.

This is not a strict system and can be adapted to fit the needs of the project and the team. It is designed to be flexible and extensible, allowing for the addition of new document types and structures as needed. It is also designed to be used in conjunction with other tools and systems, such as version control, issue tracking, and project management tools. Think about this kind of like the agile manifesto, but for AI-assisted software development. It is a set of principles and practices that can be adapted to fit the needs of the project and the team. It's about the work, not the process.

### Examples:

- [MissionSquad/mcp-api/.nexus](https://github.com/MissionSquad/mcp-api/tree/main/.nexus)

#### Contributing!

If you have any ideas for how to improve this system, find a mistake or typo, or you want to add your project to the list of examples, please open an issue or a pull request.

## Requirements

This assumes that you are using an AI code assistant that can read and write files and you're able to supply it with a prompt to get it to do the work. Ideally the assistant should be able to make the decisions on it's own about which files to read and write, and when to do that, but you can also guide it with specific instructions.

## How to use this system

### 1. **Project Onboarding**

When onboarding a project to the nexus system, run your AI code assistant with the `nexus-onboarding-prompt.md` file. This will facilitate the creation of the initial Nexus documents based on the project's codebase and structure. Just run it with the prompt and say something like, "let's onboard to the nexus system" and optionally you can tell it the entrypoint for your application like: "let's onboard this project to the nexus system. the entrypoint is `src/index.js`". The assistant should be able to figure out the rest and will ask questions if clarification is needed.

### 2. **Task Execution**

For executing tasks, use the `nexus-task-prompt.md` file. This prompt guides the AI in creating a session document, which captures the task's context, plan, and progress. The AI will update this document as it works on the task, ensuring that all relevant information is preserved.

#### Using with Cline

To use this system with Cline, you can add either of the prompts to your `.clinerules` file and then just prompt the assistant like your normally do. If you're onboarding, use the onboarding prompt first, create the initial set of documents as described above, then replace the onboarding prompt with the task prompt in your `.clinerules` file and you're good to go.

## Key Goals

- **Overcome Context Limitations:** Break down complex tasks into smaller, manageable units of work, each with its associated context stored in Nexus documents.
- **Enhance Knowledge Retention:** Provide a persistent, searchable, and version-controlled record of project knowledge, accessible to both humans and AI.
- **Facilitate Seamless Collaboration:** Enable smooth handoffs between different AI sessions and between humans and AI.
- **Maintain Code Quality:** Ensure that AI-generated code is consistent with the project's architecture and design decisions.
- **Document the "Why":** Capture the rationale behind code, architectural choices, and development processes.

## The `.nexus` Directory

The core of the Nexus System is the `.nexus` directory, located at the root of the project repository. This directory contains all Nexus documents and is organized as follows:

```
/.nexus
    /features
        /feature_name_1
            - nexus_document_1.md
            - ...
        /feature_name_2
            - ...
    /bugs
        /bug_id_or_short_description
            - nexus_document_1.md
            - ...
    /architecture
        - component_name_1.md
        - ...
    /decisions
        - decision_log.md
        /technology_choices
            - technology_name.md
    /inprogress
        /feature_name_1
            - session_2024-01-26_14-30-00.md (Timestamped session file)
            - ...
        /bug_id_or_short_description
            - session_2024-01-27_09-15-22.md
            - ...
    /completed
        /feature_name_1
            - session_2023-12-15_10-00-00.md
            - ...
        /bug_id_or_short_description
            - session_2023-12-20_14-20-10.md
            - ...
```

- **`/features`:** Documents related to the planning and implementation of new features. Each feature gets its own subdirectory.
- **`/bugs`:** Documents related to bug fixes. Each bug gets its own subdirectory (named with the bug ID or a short description).
- **`/architecture`:** Documents describing the overall system architecture (database schemas, API contracts, component interactions, deployment diagrams, etc.).
- **`/decisions`:** A chronological `decision_log.md` recording major decisions, rationales, and alternatives considered. Also includes a subdirectory, `/technology_choices/` for documents pertaining to major technology selections.
- **`/inprogress`:** Records of ongoing or interrupted tasks, organized by feature/bug. Each session has a timestamped file (`session_YYYY-MM-DD_HH-MM-SS.md`).
- **`/completed`:** Records of finished tasks, organized by feature/bug. Each session has a timestamped file (`session_YYYY-MM-DD_HH-MM-SS.md`). This directory mirrors the structure of `/inprogress`.

## Nexus Document Types and Structures

There are two main types of Nexus documents:

**1. General Nexus Documents (Features, Bugs, Architecture, Decisions):**

These documents follow a consistent Markdown structure:

Markdown

```
# [Document Title] (e.g., Feature: User Authentication - Initial Planning)

## Context
- [Briefly describe the relevant existing system state. Link to architecture documents if necessary.]

## Goal
- [What are we trying to achieve with this specific task/feature/bug fix?]

## Plan
- [Step-by-step plan, generated by the AI or refined by a human.]

## Code Snippets (Optional)
- [Relevant existing code snippets, if necessary for context.]

## API Details (If applicable)
- [Relevant API endpoints, request/response formats.]

## Database Changes (If applicable)
- [Any required database schema modifications.]

## Considerations/Open Questions
- [Any remaining uncertainties or points that need further discussion.]

## AI Assistance Notes
- Model Used: (e.g., GPT-4, Claude 2)
- Prompt: (Paste the *exact* prompt used to generate this document)
- Date Generated:

## Related Nexus Documents
- [Links to other relevant Nexus documents]
```

**2. Session Documents (`/inprogress` and `/completed`):**

These documents track the progress of individual work sessions:

Markdown

```
# Session: [Feature/Bug Name] - [Timestamp]

## Status
- [One of: In Progress, Interrupted, Pending Review, Completed]

## Summary of Work Done
- [Brief description of what was accomplished in this session.]

## Next Steps
- [Clear instructions on what needs to be done next. This is crucial for the next session.  Leave blank if status is Completed.]

## Context Links
- [Links to relevant Nexus documents (feature plan, architecture docs, etc.)]

## Code Changes (Summary)
- [Brief description of code changes made in this session.  Don't paste the entire code here.]

## Open Questions/Problems Encountered
- [Any unresolved issues or problems that arose during the session.]

## AI Assistance Notes
- Model Used:
- Prompt: (The *initial* prompt that started this session, if applicable. Or a summary.)
- Date:
```

## Workflow

1. **New Task:** For a new feature or bug, create a subdirectory within `/features` or `/bugs`.
2. **Initial Planning:** Create an initial Nexus document outlining the goal and a high-level plan.
3. **Architecture Review/Update:** Ensure relevant architecture documents are up-to-date.
4. **Session Start:** Create a new session document in `/.nexus/inprogress/[feature_or_bug_name]/`. The session document's name should include a timestamp.
5. **Iterative Work:** Break down the task into smaller steps, working with the AI, creating/updating Nexus documents as needed.
6. **Session End:** Update the session document's status, summary, and next steps.
   - **Context and Cost Awareness (When Available):**
     - **Context Window Monitoring:** Your system _may_ provide information about your current context window usage (percentage used) and the cumulative cost of the interaction. Pay attention to these values.
     - **60% Threshold:** When your context window usage approaches 60%, begin winding down the current task.
       - **Complete Current File (If Possible):** If you are in the middle of writing a code file, try to finish that file to a logically consistent state, if it can be done relatively quickly.
       - **Prioritize Nexus Updates:** Ensure all relevant Nexus documents (including session documents) are up-to-date and accurately reflect the current state of the work.
       - **Detailed `Next Steps`:** Provide exceptionally clear and detailed instructions in the `Next Steps` section of the session document to facilitate seamless continuation.
       - **Interrupt Status:** Set the session `Status` to `Interrupted`.
       - **Inform the user:** Let the user know that the session is being interrupted due to context limitations.
     - **Cost Considerations:** If cost information is provided, be mindful of the overall expense. While quality is paramount, strive for efficiency in your operations. Avoid unnecessary file reads or overly verbose outputs if a more concise approach achieves the same result.
7. **Decision Logging:** Record significant decisions in `decision_log.md`.
8. **Completion and Move:**
   - Mark the session document's `Status` as "Completed" after review and approval.
   - Move the session document (the Markdown file) from the `/.nexus/inprogress/[feature_or_bug_name]/` directory to the `/.nexus/completed/[feature_or_bug_name]/` directory. This is the key change. Maintain the same filename.

## Key Principles

- **Nexus as Single Source of Truth:** Information in Nexus documents takes precedence.
- **Link, Don't Duplicate:** Avoid redundancy by linking between documents.
- **Structured Format:** Adhere to the defined Markdown structures.
- **Complete Records:** Maintain a comprehensive history of work and decisions.
- **Iterative Process:** The system is meant to be adapted and used iteratively.
