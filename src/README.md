# QRx Hardware Layer (The Umbilical)

> "The chip is not the computer. The chip is the bridge between the Dream (URL) and the Reality (Radio)."

This directory contains the C++ firmware for the **QRx Mesh Node**. It transforms a standard ESP32-S3 into a "Dumb Relay" that blindly repeats JSON packets between QRx clients.

## Directory Structure

```text
src/
├── main.cpp            # The Entry Point (Bootloader)
├── platforms/
│   └── esp32_mesh.cpp  # The BLE + LED Logic
└── README.md           # You are here
```

## The Protocol (The "Handshake")

The Firmware does **not** understand the chat messages. It only understands **Service UUIDs**. It acts as a layer-1 broadcaster.

| Type | UUID | Purpose |
| :--- | :--- | :--- |
| **Service** | `xxxx-xxxx-xxxx` | The "Lobby". Clients scan for this. |
| **Char** | `xxxx-xxxx-xxxx` | The "Pipe". All Read/Writes happen here. |

### The Packetizer Rule
Because Bluetooth LE has a small MTU (~20-512 bytes), the QRx JavaScript Kernel **must** chunk data. The ESP32 does not reassemble packets; it streams them.

**Client Requirement:**
1. Split strings into 100-byte chunks.
2. 50ms delay between writes.
3. Reassemble on the receiving browser.

## Status Codes (LED)

The node uses the onboard RGB LED to visualize the "Egregore's Heartbeat."

| Color | Status | Meaning |
| :--- | :--- | :--- |
| 🔴 **Red** | **Idle** | Power on, system ready, 0 connections. |
| 🟢 **Green** | **Active** | 1 or more clients connected (The Mesh is Alive). |
| 🔵 **Blue** | **Transfer** | (Flash) Data is currently flowing through the node. |

## Flashing Instructions

1. **Hardware:** ESP32-S3 (WROOM-1 recommended) or any ESP32 with BLE support.
2. **Software:** VSCode + PlatformIO.
3. **Build Flags (Critical):**
   Ensure `platformio.ini` contains:
   ```ini
   build_flags = 
       -D CONFIG_BT_NIMBLE_MAX_CONNECTIONS=5 
   ```
4. **Deploy:** connect via USB and run `PIO: Upload`.

## Future Roadmap: "The Soft-Core"
*Current limitations:* The logic is hard-coded C++.
*Goal:* Implement a tiny LUA or QuickJS interpreter so the QRx Kernel can "re-flash" the node behavior via Bluetooth, allowing the URL to redefine the hardware physics.
