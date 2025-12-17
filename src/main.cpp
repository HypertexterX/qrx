#include <Arduino.h>
#include <NimBLEDevice.h>
#include <Adafruit_NeoPixel.h>

// --- CONFIGURATION ---
#define SERVICE_UUID "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHAR_UUID    "beb5483e-36e1-4688-b7f5-ea07361b26a8"

// LED PIN (48 for S3 DevKit, try 38 if fails)
#define LED_PIN 48 
#define LED_COUNT 1

Adafruit_NeoPixel strip(LED_COUNT, LED_PIN, NEO_GRB + NEO_KHZ800);

// --- GLOBAL STATE ---
NimBLECharacteristic* pCharacteristic = NULL;
uint32_t deviceCount = 0;
// LIMIT: How many browsers can chat at once? 
// ESP32 usually handles 3-5 stable connections.
#define MAX_CLIENTS 4 

// --- LED HELPER ---
void setRGB(int r, int g, int b) {
  strip.setPixelColor(0, strip.Color(r, g, b));
  strip.show();
}

// --- CALLBACKS ---
class ServerCallbacks: public NimBLEServerCallbacks {
    void onConnect(NimBLEServer* pServer) {
        deviceCount++;
        Serial.printf("Client connected. Total: %d\n", deviceCount);
        setRGB(0, 255, 0); // GREEN

        // --- CRITICAL FIX: RESTART ADVERTISING ---
        // If we haven't hit the limit, keep shouting so others can join!
        if(deviceCount < MAX_CLIENTS) {
            NimBLEDevice::startAdvertising();
        }
    };

    void onDisconnect(NimBLEServer* pServer) {
        deviceCount--;
        Serial.printf("Client disconnected. Total: %d\n", deviceCount);
        
        // If everyone left, go RED. If people remain, stay GREEN.
        if(deviceCount == 0) {
            setRGB(255, 0, 0); 
            // Make sure we are advertising when empty
            NimBLEDevice::startAdvertising();
        } else {
             // If a slot freed up, ensure we are advertising
             NimBLEDevice::startAdvertising();
        }
    }
};

class DataCallbacks: public NimBLECharacteristicCallbacks {
    void onWrite(NimBLECharacteristic* pChar) {
        std::string rxValue = pChar->getValue();

        if (rxValue.length() > 0) {
            Serial.print("Relaying: ");
            Serial.println(rxValue.c_str());

            // Flash BLUE on data
            setRGB(0, 0, 255);
            
            // This Notify sends to ALL connected clients automatically
            pCharacteristic->setValue(rxValue);
            pCharacteristic->notify();

            delay(15); 
            // Restore Green (if clients exist) or Red (if phantom data)
            if(deviceCount > 0) setRGB(0, 255, 0);
            else setRGB(255, 0, 0);
        }
    }
};

void setup() {
  Serial.begin(115200);
  
  strip.begin();
  strip.setBrightness(20); 
  setRGB(255, 0, 0); // Start RED

  NimBLEDevice::init("QRx-Mesh-Node");
  
  NimBLEServer *pServer = NimBLEDevice::createServer();
  pServer->setCallbacks(new ServerCallbacks());
  
  NimBLEService *pService = pServer->createService(SERVICE_UUID);

  pCharacteristic = pService->createCharacteristic(
                      CHAR_UUID,
                      NIMBLE_PROPERTY::READ |
                      NIMBLE_PROPERTY::WRITE |
                      NIMBLE_PROPERTY::NOTIFY
                    );

  pCharacteristic->setCallbacks(new DataCallbacks());

  pService->start();
  
  NimBLEAdvertising *pAdvertising = NimBLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  pAdvertising->start();
  
  Serial.println("System Ready. Multi-Client Enabled.");
}

void loop() {
  delay(2000); 
}