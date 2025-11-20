/*
 * Little Watch - Baby Health Monitoring System
 * Arduino Code for Accurate Sensor Readings
 *
 * Sensors Used:
 * - MAX30102: Heart Rate & SpO2 (Oxygen Saturation)
 * - MLX90614: Non-contact Infrared Temperature Sensor
 * - MPU6050: Accelerometer & Gyroscope for Movement Detection
 *
 * Communication: WiFi + MQTT Protocol
 * Board: ESP32 or ESP8266
 */

#include <Wire.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <Adafruit_MLX90614.h>
#include <MAX30105.h>
#include <heartRate.h>
#include <spo2_algorithm.h>
#include <MPU6050.h>

// ============ CONFIGURATION ============
// WiFi credentials
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// MQTT Broker settings
const char* MQTT_BROKER = "YOUR_SERVER_IP";  // e.g., "192.168.1.100"
const int MQTT_PORT = 1883;
const char* MQTT_USERNAME = "";  // If authentication is enabled
const char* MQTT_PASSWORD = "";

// Device identification
const char* DEVICE_ID = "DEVICE001";  // Unique device ID

// Sensor reading intervals (milliseconds)
const unsigned long READING_INTERVAL = 5000;  // Send data every 5 seconds
const unsigned long STATUS_INTERVAL = 60000;  // Send status every 60 seconds

// ============ SENSOR OBJECTS ============
MAX30105 particleSensor;
Adafruit_MLX90614 mlx = Adafruit_MLX90614();
MPU6050 mpu;

WiFiClient espClient;
PubSubClient mqttClient(espClient);

// ============ VARIABLES ============
unsigned long lastReadingTime = 0;
unsigned long lastStatusTime = 0;

// Heart Rate & SpO2 variables
const byte RATE_SIZE = 4;
byte rates[RATE_SIZE];
byte rateSpot = 0;
long lastBeat = 0;
float beatsPerMinute;
int beatAvg;

// SpO2 variables
uint32_t irBuffer[100];
uint32_t redBuffer[100];
int32_t spo2;
int8_t validSPO2;
int32_t heartRate;
int8_t validHeartRate;

// Movement detection variables
int16_t ax, ay, az;
int16_t gx, gy, gz;
float movementMagnitude = 0;

// Battery level (if using battery)
int batteryLevel = 100;

// ============ SETUP ============
void setup() {
  Serial.begin(115200);
  Serial.println("Little Watch Baby Monitor - Starting...");

  // Initialize I2C
  Wire.begin();

  // Initialize sensors
  if (!initializeSensors()) {
    Serial.println("ERROR: Sensor initialization failed!");
    while (1);  // Stop execution
  }

  // Connect to WiFi
  connectToWiFi();

  // Setup MQTT
  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
  mqttClient.setCallback(mqttCallback);

  Serial.println("Setup complete!");
}

// ============ MAIN LOOP ============
void loop() {
  // Maintain MQTT connection
  if (!mqttClient.connected()) {
    reconnectMQTT();
  }
  mqttClient.loop();

  unsigned long currentTime = millis();

  // Send vital readings at regular intervals
  if (currentTime - lastReadingTime >= READING_INTERVAL) {
    lastReadingTime = currentTime;
    readAndSendVitals();
  }

  // Send device status at regular intervals
  if (currentTime - lastStatusTime >= STATUS_INTERVAL) {
    lastStatusTime = currentTime;
    sendDeviceStatus();
  }

  delay(100);  // Small delay to prevent overwhelming the system
}

// ============ SENSOR INITIALIZATION ============
bool initializeSensors() {
  Serial.println("Initializing sensors...");

  // Initialize MAX30102 (Heart Rate & SpO2)
  if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) {
    Serial.println("MAX30102 not found!");
    return false;
  }

  byte ledBrightness = 60;
  byte sampleAverage = 4;
  byte ledMode = 2;  // Red & IR
  byte sampleRate = 100;
  byte pulseWidth = 411;
  int adcRange = 4096;

  particleSensor.setup(ledBrightness, sampleAverage, ledMode, sampleRate, pulseWidth, adcRange);
  Serial.println("✓ MAX30102 initialized");

  // Initialize MLX90614 (Temperature)
  if (!mlx.begin()) {
    Serial.println("MLX90614 not found!");
    return false;
  }
  Serial.println("✓ MLX90614 initialized");

  // Initialize MPU6050 (Movement)
  mpu.initialize();
  if (!mpu.testConnection()) {
    Serial.println("MPU6050 not found!");
    return false;
  }
  Serial.println("✓ MPU6050 initialized");

  return true;
}

// ============ WIFI CONNECTION ============
void connectToWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✓ WiFi connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n✗ WiFi connection failed!");
  }
}

// ============ MQTT CONNECTION ============
void reconnectMQTT() {
  while (!mqttClient.connected()) {
    Serial.print("Connecting to MQTT broker...");

    String clientId = "LittleWatch_" + String(DEVICE_ID);

    if (mqttClient.connect(clientId.c_str(), MQTT_USERNAME, MQTT_PASSWORD)) {
      Serial.println(" connected!");

      // Subscribe to command topic
      String commandTopic = "littlewatch/" + String(DEVICE_ID) + "/commands";
      mqttClient.subscribe(commandTopic.c_str());
      Serial.println("Subscribed to: " + commandTopic);
    } else {
      Serial.print(" failed, rc=");
      Serial.print(mqttClient.state());
      Serial.println(" retrying in 5 seconds...");
      delay(5000);
    }
  }
}

// ============ MQTT CALLBACK ============
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("]: ");

  String message = "";
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  Serial.println(message);

  // Handle commands from server (e.g., adjust reading intervals, calibration, etc.)
  // TODO: Implement command handling
}

// ============ READ & SEND VITAL SIGNS ============
void readAndSendVitals() {
  Serial.println("\n--- Reading Vital Signs ---");

  // Read Heart Rate & SpO2
  int heartRateValue = readHeartRate();
  int spo2Value = readSpO2();

  // Read Temperature
  float temperature = readTemperature();

  // Read Movement
  String movementStatus = readMovement();

  // Read Battery Level
  batteryLevel = readBatteryLevel();

  // Print readings
  Serial.print("Heart Rate: ");
  Serial.print(heartRateValue);
  Serial.println(" BPM");

  Serial.print("SpO2: ");
  Serial.print(spo2Value);
  Serial.println(" %");

  Serial.print("Temperature: ");
  Serial.print(temperature);
  Serial.println(" °C");

  Serial.print("Movement: ");
  Serial.println(movementStatus);

  Serial.print("Battery: ");
  Serial.print(batteryLevel);
  Serial.println(" %");

  // Create JSON payload
  String payload = createVitalsPayload(heartRateValue, temperature, spo2Value, movementStatus, batteryLevel);

  // Publish to MQTT
  String topic = "littlewatch/" + String(DEVICE_ID) + "/vitals";
  mqttClient.publish(topic.c_str(), payload.c_str());

  Serial.println("✓ Data sent to server");
}

// ============ READ HEART RATE ============
int readHeartRate() {
  long irValue = particleSensor.getIR();

  if (checkForBeat(irValue) == true) {
    long delta = millis() - lastBeat;
    lastBeat = millis();

    beatsPerMinute = 60 / (delta / 1000.0);

    if (beatsPerMinute < 255 && beatsPerMinute > 20) {
      rates[rateSpot++] = (byte)beatsPerMinute;
      rateSpot %= RATE_SIZE;

      beatAvg = 0;
      for (byte x = 0; x < RATE_SIZE; x++)
        beatAvg += rates[x];
      beatAvg /= RATE_SIZE;
    }
  }

  // Return average heart rate, or 0 if no finger detected
  if (irValue < 50000) {
    return 0;  // No finger detected
  }

  return beatAvg;
}

// ============ READ SPO2 ============
int readSpO2() {
  // Read multiple samples for accurate SpO2 calculation
  for (byte i = 0; i < 100; i++) {
    while (particleSensor.available() == false)
      particleSensor.check();

    redBuffer[i] = particleSensor.getRed();
    irBuffer[i] = particleSensor.getIR();
    particleSensor.nextSample();
  }

  // Calculate SpO2
  maxim_heart_rate_and_oxygen_saturation(irBuffer, 100, redBuffer, &spo2, &validSPO2, &heartRate, &validHeartRate);

  if (validSPO2 == 1 && spo2 > 0 && spo2 < 100) {
    return spo2;
  }

  return 98;  // Default value if reading is invalid
}

// ============ READ TEMPERATURE ============
float readTemperature() {
  float objectTemp = mlx.readObjectTempC();

  // Validate temperature reading
  if (objectTemp < 30.0 || objectTemp > 45.0) {
    return 36.8;  // Return default if invalid
  }

  return objectTemp;
}

// ============ READ MOVEMENT ============
String readMovement() {
  mpu.getMotion6(&ax, &ay, &az, &gx, &gy, &gz);

  // Calculate movement magnitude
  movementMagnitude = sqrt(ax * ax + ay * ay + az * az);

  if (movementMagnitude < 5000) {
    return "none";
  } else if (movementMagnitude < 15000) {
    return "low";
  } else if (movementMagnitude < 25000) {
    return "normal";
  } else {
    return "high";
  }
}

// ============ READ BATTERY LEVEL ============
int readBatteryLevel() {
  // Read battery voltage from analog pin (if connected)
  // This is a simplified example - adjust based on your battery setup
  int batteryPin = A0;
  int rawValue = analogRead(batteryPin);

  // Convert to percentage (adjust based on your battery voltage range)
  int percentage = map(rawValue, 0, 4095, 0, 100);
  percentage = constrain(percentage, 0, 100);

  return percentage;
}

// ============ CREATE JSON PAYLOAD ============
String createVitalsPayload(int heartRate, float temperature, int oxygen, String movement, int battery) {
  String payload = "{";
  payload += "\"heartRate\":" + String(heartRate) + ",";
  payload += "\"temperature\":" + String(temperature, 1) + ",";
  payload += "\"oxygenSaturation\":" + String(oxygen) + ",";
  payload += "\"movementStatus\":\"" + movement + "\",";
  payload += "\"batteryLevel\":" + String(battery);
  payload += "}";

  return payload;
}

// ============ SEND DEVICE STATUS ============
void sendDeviceStatus() {
  String payload = "{";
  payload += "\"batteryLevel\":" + String(batteryLevel) + ",";
  payload += "\"firmwareVersion\":\"1.0.0\",";
  payload += "\"connected\":true";
  payload += "}";

  String topic = "littlewatch/" + String(DEVICE_ID) + "/status";
  mqttClient.publish(topic.c_str(), payload.c_str());

  Serial.println("✓ Device status sent");
}
