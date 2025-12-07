# QRx - A generative hypertext protocol

> A portable, AI-native operating system living entirely in the URL, small enough to fit inside a single QR code (< 3KB).

QRx is a lightweight, single-file virtual machine that turns your browser into a persistent operating system. It uses **IndexedDB** as a filesystem and the **URL Hash** as a linear command-line interface ("Machine Tape").

It is designed for hyper-portability, generative coding, and offline-first interaction.

## How it works

1.  **The Kernel**: `index.html` contains the entire OS logic.
2.  **The File System**: Files are stored in the browser's IndexedDB. The URL path determines the database name (e.g., `yoursite.com/os` vs `yoursite.com/private`), allowing for "multiverse" support.
3.  **The Tape**: The URL hash (`#filename?cmd=val`) is read from left to right. Instructions are executed sequentially.

## Core Flags

The protocol uses single-letter parameters to manipulate state and files.

| Flag | Name | Function |
| :--- | :--- | :--- |
| `f` | **File** | Switches the active file pointer (target for writes/reads). |
| `w` | **Write** | Writes the value to the current file. Overwrites by default. |
| `a` | **Append** | Switches to "Append Mode". All subsequent `w`, `r`, `u`, or `p` actions append to the file instead of overwriting. Pass `?a=0` to disable. |
| `r` | **Read** | Reads the content of *another* file and writes/appends it to the current file. |
| `u` | **URL** | Fetches external text (via `fetch`) and writes/appends it to the current file. |
| `x` | **Execute** | Evaluates the value as raw JavaScript within the context of the OS. |

## Prompting (AI)

QRx supports generative AI via Google Gemini or OpenAI-compatible endpoints (Ollama, OpenRouter, etc.). Config keys are stored in `localStorage`.

| Flag | Name | Function |
| :--- | :--- | :--- |
| `p` | **Prompt** | Sends the current file context + the value of `p` to the LLM. The result is written/appended to the file. |
| `k` | **Key** | Sets the API Key (persisted in LocalStorage). |
| `m` | **Model** | Sets the Model ID (e.g., `gemini-1.5-flash`, `gpt-4o`). |
| `h` | **Host** | Sets the Endpoint. Use `google` for Gemini or a URL for OpenAI/Ollama. |
| `s` | **System** | Sets the System Prompt (persisted). |

## Examples

**Hello World**
Creates a file named `home` with HTML content.
```
#home?w=<h1>Hello World</h1>
```

**The "Quine" (Self-replication)**
Reads the kernel's own HTML and saves it to a file named `backup`.
```
#backup?u=index.html
```

**Configure AI**
Sets up Google Gemini (only needed once per device).
```
#config?h=google&m=gemini-3-pro-preview&k=YOUR_API_KEY
```

**Generative Coding**
Create a file named `game`, write a prompt, and ask AI to generate the code.
```
#game?w=Make a pong game in HTML/JS&p=Write the code
```

## Bootloader & Safe Mode

*   **Bootloader**: Any file in the DB starting with `boot` (e.g., `boot.js`, `bootconf`) is automatically executed when the page loads.
*   **Safe Mode**: Append `?safe` to the URL to disable the bootloader and prevent HTML/JS rehydration (view source mode).
```
#home?safe
```

## License

ISC