# Little Watch Arduino Code

## Hardware Requirements

### Microcontroller
- **ESP32** or **ESP8266** (WiFi enabled)

### Sensors
1. **MAX30102** - Pulse Oximeter & Heart Rate Sensor
   - Measures: Heart Rate (BPM) and SpO2 (Oxygen Saturation %)
   - Connection: I2C (SDA, SCL)

2. **MLX90614** - Non-contact Infrared Temperature Sensor
   - Measures: Body temperature (°C)
   - Connection: I2C (SDA, SCL)

3. **MPU6050** - 6-Axis Accelerometer & Gyroscope
   - Measures: Movement and motion patterns
   - Connection: I2C (SDA, SCL)

### Wiring Diagram

```
ESP32/ESP8266 Connections:
- VCC (3.3V) → All sensor VCC pins
- GND → All sensor GND pins
- GPIO21 (SDA) → All sensor SDA pins
- GPIO22 (SCL) → All sensor SCL pins
- GPIO34 (A0) → Battery voltage divider (optional)
```

## Required Arduino Libraries

Install these libraries via Arduino IDE Library Manager or PlatformIO:

```
1. WiFi (Built-in for ESP32/ESP8266)
2. PubSubClient (by Nick O'Leary) - for MQTT
3. Adafruit_MLX90614 - for temperature sensor
4. MAX30105 (SparkFun) - for heart rate and SpO2
5. MPU6050 (by Electronic Cats) - for movement detection
6. Wire (Built-in) - for I2C communication
```

### Installation via Arduino IDE:
1. Open Arduino IDE
2. Go to **Sketch → Include Library → Manage Libraries**
3. Search and install each library listed above

### Installation via PlatformIO:
Add to `platformio.ini`:
```ini
[env:esp32]
platform = espressif32
board = esp32dev
framework = arduino
lib_deps =
    knolleary/PubSubClient@^2.8
    adafruit/Adafruit MLX90614 Library@^2.1.3
    sparkfun/SparkFun MAX3010x Pulse and Proximity Sensor Library@^1.1.2
    electroniccats/MPU6050@^1.0.0
```

## Configuration

Before uploading, update these settings in `littlewatch_sensor.ino`:

```cpp
// WiFi credentials
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// MQTT Broker (your backend server IP)
const char* MQTT_BROKER = "192.168.1.100";  // Change to your server IP
const int MQTT_PORT = 1883;

// Device ID (unique for each device)
const char* DEVICE_ID = "DEVICE001";  // Change for each device
```

## Upload Instructions

1. Connect ESP32/ESP8266 to your computer via USB
2. Select correct board:
   - **Tools → Board → ESP32 Dev Module** (or your specific board)
3. Select correct port:
   - **Tools → Port → COM# or /dev/ttyUSB#**
4. Click **Upload** button
5. Open **Serial Monitor** (115200 baud) to see output

## How It Works

### Data Flow
```
Arduino Sensors → ESP32 → WiFi → MQTT Broker → Node.js Backend → MySQL Database → Mobile App
```

### MQTT Topics
- **Publish Vitals**: `littlewatch/{DEVICE_ID}/vitals`
  - Heart rate, temperature, SpO2, movement, battery

- **Publish Status**: `littlewatch/{DEVICE_ID}/status`
  - Battery level, firmware version, connection status

- **Subscribe Commands**: `littlewatch/{DEVICE_ID}/commands`
  - Receive commands from backend (future feature)

### Reading Intervals
- **Vital Signs**: Every 5 seconds
- **Device Status**: Every 60 seconds

## Sensor Accuracy Tips

### MAX30102 (Heart Rate & SpO2)
- Ensure sensor is in direct contact with skin
- Avoid excessive movement during reading
- Works best on fingertip or earlobe
- Clean sensor surface regularly

### MLX90614 (Temperature)
- Position 5-15cm from forehead/skin
- Avoid direct sunlight or heat sources
- Allow 2-3 seconds for stable reading
- Calibrate if readings seem off (±0.5°C tolerance)

### MPU6050 (Movement)
- Mount securely to wearable band
- Calibrate on flat surface before use
- Adjust thresholds based on baby's age

## Troubleshooting

### WiFi Not Connecting
- Check SSID and password
- Ensure 2.4GHz WiFi (ESP8266/ESP32 don't support 5GHz)
- Move closer to router

### MQTT Not Connecting
- Verify backend server is running
- Check MQTT broker IP address
- Ensure port 1883 is not blocked by firewall
- Test with MQTT client (MQTT Explorer)

### Sensor Not Found
- Check wiring connections
- Verify I2C address with I2C scanner
- Ensure adequate power supply (sensors need stable 3.3V)

### Invalid Readings
- Check sensor placement
- Allow warm-up time (30 seconds)
- Clean sensor surfaces
- Replace faulty sensors if persistent

## Power Consumption

Estimated battery life with 1000mAh LiPo battery:
- Continuous monitoring: ~8-12 hours
- Sleep mode enabled: ~24-48 hours (future feature)

## Safety & Medical Disclaimer

⚠️ **IMPORTANT**: This device is for **educational and monitoring purposes only**. It is NOT a medical device and should NOT be used as a substitute for professional medical advice, diagnosis, or treatment.

- Always consult healthcare professionals for medical concerns
- Do not rely solely on this device for critical health decisions
- Sensor readings may have ±5% variance
- Not FDA approved or medically certified

## Future Enhancements

- [ ] Deep sleep mode for power saving
- [ ] OTA (Over-The-Air) firmware updates
- [ ] Local data storage on SD card
- [ ] Bluetooth Low Energy (BLE) support
- [ ] Alert buzzer for abnormal readings
- [ ] LED status indicators

## Support

For issues or questions:
1. Check sensor connections and configuration
2. Review serial monitor output for errors
3. Test individual sensors separately
4. Verify backend server is receiving data

## License

MIT License - Free to use and modify for educational purposes
