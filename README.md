# QRx - A generative hypertext protocol

> A portable, AI-native operating system living entirely in the URL, small enough to fit inside a single QR code (< 3KB).

![](./dist/index.qrcode.png)

QRx is a lightweight, single-file virtual machine that turns your browser into a persistent operating system. It uses **IndexedDB** as a filesystem and the **URL Hash** as a linear command-line interface ("Machine Tape").

It is designed for hyper-portability, generative coding, and offline-first interaction.

## How it works

1.  **The Kernel**: `index.html` contains the entire OS logic.
2.  **The File System**: Files are stored in the browser's IndexedDB.
3.  **The Pipeline**: The URL Hash acts as a stream processor.
    *   **Accumulator (`v`)**: Starts with the content of the current view (`#filename`).
    *   **Transformation**: Commands like `?r`, `?u`, and `?x` modify `v` in memory.
    *   **Auto-Commit**: The final value of `v` is automatically written to the current file pointer (`f`) when processing finishes.

## Core Flags

The protocol uses single-letter parameters to manipulate the Accumulator (`v`) and File Pointer (`f`).

| Flag | Name | Function |
| :--- | :--- | :--- |
| `f` | **File** | Switches the active **write target** (pointer). Defaults to the current view name. |
| `e` | **Echo** | Sets the accumulator value directly (e.g., `?e=Hello`). Replaces `v` unless `?a` is set. |
| `r` | **Read** | Reads a file from the DB into the accumulator. |
| `u` | **URL** | Fetches external text (via `fetch`) into the accumulator. |
| `w` | **Write** | *Manually* writes the current accumulator (`v`) to the target file (`f`). Useful for intermediate saves. |
| `a` | **Append** | Switches to "Append Mode". Subsequent `e`, `r`, `u`, `p` add to `v` instead of replacing it. |
| `x` | **Execute** | Evaluates JS. Can transform `v` by returning a value (e.g., `return v.trim()`). |

## Programmable Flags (cmd/*)

QRx is extensible. If a file exists in the `cmd/` directory (e.g., `cmd/foo`), it becomes a callable flag.
These commands are resolved via the **Global Overlay** (see below).

**Example:**
1. Create a file `cmd/foo`: `return v.toUpperCase()`
2. Use it in the URL: `#home?foo`

The command file receives: `(os, v, arg)`.

## Prompting (AI)

QRx supports generative AI via Google Gemini or OpenAI-compatible endpoints.

| Flag | Name | Function |
| :--- | :--- | :--- |
| `p` | **Prompt** | Sends `System + v + Prompt` to the LLM. The result updates `v`. |
| `k` | **Key** | Sets the API Key (persisted in LocalStorage). |
| `m` | **Model** | Sets the Model ID (e.g., `gemini-1.5-flash`). |
| `h` | **Host** | Sets the Endpoint. Use `google` or a custom URL. |
| `s` | **System** | Sets the System Prompt (persisted). |

## Advanced Features

*   **Global Overlay**: The system connects to a dedicated `os` database alongside the local one. If a file (like `cmd/*`) is not found locally, it is read from the `os` partition. This allows for shared tools across projects.
*   **Multiverse**: The Database name is derived from the URL path (e.g., `/project1` vs `/project2`). Each path has its own "User" storage but shares the "System" (`os`) storage.
*   **Bootloader**: Files starting with `boot` (e.g., `boot/init`) are automatically executed on load. The kernel merges boot scripts from both the Local and Global databases.
*   **Audit Log**: Every command executed is archived in the hidden `H/` directory with a timestamp, allowing for history replay.
*   **Safe Mode**: Append `?safe` to disable the bootloader and script execution (view source mode).

## Examples

**Hello World**
Echo text into memory. It automatically saves to `home`.
`#home?e=<h1>Hello World</h1>`

**The "Quine" (Self-replication)**
Reads the kernel's source and saves it to `backup`.
`#backup?r=index.html`

**Contextual Prompting**
Build a context buffer from multiple files, prompt the AI, and save to a new file.
`#scratch?e=CTX:&a&r=lib&r=app&p=Refactor code above&f=app_v2`
*(1. Clear accumulator 2. Append files 3. Prompt AI 4. Switch target to 'app_v2' -> Auto-save)*

## License

ISC
