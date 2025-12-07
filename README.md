# QRx - A generative hypertext protocol

> A portable, AI-native operating system living entirely in the URL, small enough to fit inside a single QR code (< 3KB).

QRx is a lightweight, single-file virtual machine that turns your browser into a persistent operating system. It uses **IndexedDB** as a filesystem and the **URL Hash** as a linear command-line interface ("Machine Tape").

It is designed for hyper-portability, generative coding, and offline-first interaction.

## How it works

1.  **The Kernel**: `index.html` contains the entire OS logic.
2.  **The File System**: Files are stored in the browser's IndexedDB.
3.  **The Pipeline**: The URL Hash acts as a stream processor.
    *   **Accumulator (`v`)**: Starts with the content of the current view.
    *   **Transformation**: Commands like `?r`, `?u`, and `?x` modify `v` in memory.
    *   **Flush**: Changes are only saved to disk when explicitly committed with `?w`.

## Core Flags

The protocol uses single-letter parameters to manipulate the Accumulator (`v`) and File Pointer (`f`).

| Flag | Name | Function |
| :--- | :--- | :--- |
| `f` | **File** | Switches the active **write target** (pointer). Does *not* change the accumulator. |
| `e` | **Echo** | Sets the accumulator value directly (e.g., `?e=Hello`). Replaces `v` unless `?a` is set. |
| `r` | **Read** | Reads a file into the accumulator. |
| `u` | **URL** | Fetches external text (via `fetch`) into the accumulator. |
| `w` | **Write** | Flushes the current accumulator (`v`) to the target file (`f`). |
| `a` | **Append** | Switches to "Append Mode". Subsequent `e`, `r`, `u`, `p` add to `v` instead of replacing it. |
| `x` | **Execute** | Evaluates JS. Can transform `v` by returning a value (e.g., `return v.trim()`). |

## Prompting (AI)

QRx supports generative AI via Google Gemini or OpenAI-compatible endpoints. The prompt (`p`) is concatenated directly to the System Prompt + Accumulator.

| Flag | Name | Function |
| :--- | :--- | :--- |
| `p` | **Prompt** | Sends `System + v + Prompt` to the LLM. The result updates `v`. |
| `k` | **Key** | Sets the API Key (persisted in LocalStorage). |
| `m` | **Model** | Sets the Model ID (e.g., `gemini-1.5-flash`). |
| `h` | **Host** | Sets the Endpoint. Use `google` or a URL. |
| `s` | **System** | Sets the System Prompt (persisted). |

## Examples

**Hello World**
Echo text into memory and flush to file `home`.
```
#home?e=<h1>Hello World</h1>&w
```

**The "Quine" (Self-replication)**
Reads the kernel's source and saves it to `backup`.
```
#backup?r=index.html&w
```

**Pipeline Processing**
Fetch data, transform it with JS, and save.
```
#data?u=https://api.co/json&x=return JSON.parse(v).count&w
```

**Contextual Prompting**
Build a context buffer from multiple files, then prompt the AI.
```
#scratch?e=CTX:&a&r=lib&r=app&p=Refactor code above&f=app&w
```
*(1. Clear accumulator 2. Append files 3. Prompt AI 4. Switch target to 'app' 5. Save)*

## Bootloader & Safe Mode

*   **Bootloader**: Files starting with `boot` (e.g., `boot/init`) are automatically executed on load.
*   **Safe Mode**: Append `?safe` to disable the bootloader (view source mode).

## License

ISC