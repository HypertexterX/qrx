#include <Arduino.h>
#include <NimBLEDevice.h>
#include <Adafruit_NeoPixel.h>

// --- CONFIGURATION ---
#define SERVICE_UUID "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHAR_UUID    "beb5483e-36e1-4688-b7f5-ea07361b26a8"

// LED PIN: On ESP32-S3 DevKitC-1, the RGB LED is usually GPIO 48.
// If this doesn't work, change this to 38.
#define LED_PIN 48 
#define LED_COUNT 1

Adafruit_NeoPixel strip(LED_COUNT, LED_PIN, NEO_GRB + NEO_KHZ800);

// --- GLOBAL STATE ---
NimBLECharacteristic* pCharacteristic = NULL;
uint32_t deviceCount = 0;

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
    };

    void onDisconnect(NimBLEServer* pServer) {
        deviceCount--;
        Serial.printf("Client disconnected. Total: %d\n", deviceCount);
        if(deviceCount == 0) setRGB(255, 0, 0); // RED
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
            
            pCharacteristic->setValue(rxValue);
            pCharacteristic->notify();

            // Small delay to make the flash visible, then revert
            delay(15); 
            if(deviceCount > 0) setRGB(0, 255, 0);
            else setRGB(255, 0, 0);
        }
    }
};

void setup() {
  Serial.begin(115200);
  
  // 1. Init LED
  strip.begin();
  strip.setBrightness(20); // Low brightness (S3 LEDs are blinded bright)
  setRGB(255, 0, 0); // RED = Power On, No Connections

  // 2. Init BLE
  NimBLEDevice::init("QRx-Mesh-Node");
  NimBLEServer *pServer = NimBLEDevice::createServer();
  pServer->setCallbacks(new ServerCallbacks());

  NimBLEService *pService = pServer->createService(SERVICE_UUID);

  // 3. Create Characteristic (The Fix is here: NIMBLE_PROPERTY::)
  pCharacteristic = pService->createCharacteristic(
                      CHAR_UUID,
                      NIMBLE_PROPERTY::READ |
                      NIMBLE_PROPERTY::WRITE |
                      NIMBLE_PROPERTY::NOTIFY
                    );

  pCharacteristic->setCallbacks(new DataCallbacks());

  // 4. Start Advertising
  pService->start();
  NimBLEAdvertising *pAdvertising = NimBLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  pAdvertising->start();
  
  Serial.println("System Ready. Waiting for browser...");
}

void loop() {
  delay(2000); 
}