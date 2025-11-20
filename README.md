# Little Watch - Baby Health Monitoring System

A comprehensive baby health monitoring system with real-time vital signs tracking, featuring a React Native mobile app, Node.js backend, MySQL database, and Arduino-based wearable sensor device.

## 🌟 Features

### Mobile App (React Native + Expo)
- ✅ User Authentication (Sign up / Login)
- 📊 Real-time Vital Signs Dashboard
  - Heart Rate (BPM)
  - Body Temperature (°C)
  - Oxygen Saturation (%)
  - Movement Detection
- 🔔 Alert System with customizable thresholds
- 😴 Sleep Pattern Tracking
- 📈 Historical Data & Analytics
- 👶 Multiple Children Management
- ⚙️ Settings & Preferences

### Backend API (Node.js + Express)
- 🔐 JWT Authentication
- 📡 RESTful API Endpoints
- 💾 MySQL Database Integration
- 📨 MQTT Protocol for Arduino Communication
- ⚠️ Automatic Alert Generation
- 🔄 Real-time Data Processing

### Arduino Sensor Device (ESP32/ESP8266)
- ❤️ Heart Rate Monitoring (MAX30102)
- 🌡️ Temperature Sensing (MLX90614)
- 💧 SpO2 (Oxygen) Measurement (MAX30102)
- 🏃 Movement Detection (MPU6050)
- 📶 WiFi + MQTT Communication
- 🔋 Battery Level Monitoring

## 📁 Project Structure

```
final_MobileApp/
├── arduino/                    # Arduino firmware
│   ├── littlewatch_sensor.ino # Main Arduino code
│   └── README.md               # Arduino setup guide
├── backend/                    # Node.js backend
│   ├── config/
│   │   ├── database.js        # MySQL connection
│   │   └── schema.sql         # Database schema
│   ├── controllers/           # API controllers
│   ├── middleware/            # Authentication middleware
│   ├── routes/                # API routes
│   ├── services/              # MQTT service
│   ├── .env                   # Environment variables
│   ├── package.json
│   └── server.js              # Main server file
├── screens/                   # React Native screens
├── services/                  # Mobile app services
│   └── api.js                 # API service layer
├── App.js                     # Main mobile app component
├── package.json
└── README.md                  # This file
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** 16+ and npm
- **MySQL** 8.0+
- **Expo CLI**: `npm install -g expo-cli`
- **MQTT Broker** (Mosquitto recommended)
- **Arduino IDE** or PlatformIO (for Arduino development)
- **ESP32** or **ESP8266** board
- Sensors: MAX30102, MLX90614, MPU6050

## 📦 Installation

### 1. Database Setup

```bash
# Install MySQL (Ubuntu/Debian)
sudo apt update
sudo apt install mysql-server

# Start MySQL
sudo systemctl start mysql
sudo mysql_secure_installation

# Create database and import schema
mysql -u root -p
```

```sql
CREATE DATABASE littlewatch_db;
USE littlewatch_db;
source backend/config/schema.sql;
```

### 2. MQTT Broker Setup

```bash
# Install Mosquitto MQTT Broker (Ubuntu/Debian)
sudo apt install mosquitto mosquitto-clients

# Start Mosquitto
sudo systemctl start mosquitto
sudo systemctl enable mosquitto

# Test MQTT broker
mosquitto_sub -t "test" -v
# In another terminal:
mosquitto_pub -t "test" -m "Hello MQTT"
```

### 3. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
nano .env
```

Edit `.env` file:
```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=littlewatch_db
DB_PORT=3306

JWT_SECRET=your_super_secret_key_here

MQTT_BROKER=mqtt://localhost:1883
```

```bash
# Start backend server
npm start

# Or for development with auto-reload:
npm install -g nodemon
npm run dev
```

Server should start at: `http://localhost:3000`

### 4. Mobile App Setup

```bash
# Navigate to project root
cd ..

# Install dependencies
npm install

# Start Expo development server
npm start
```

**Configure API endpoint:**

Edit `services/api.js`:
```javascript
const API_BASE_URL = 'http://YOUR_COMPUTER_IP:3000/api';
// Example: 'http://192.168.1.100:3000/api'
```

**Note:** Use your computer's local IP address (not localhost) so the mobile device can access the backend.

### 5. Arduino Setup

See detailed instructions in [`arduino/README.md`](arduino/README.md)

**Quick steps:**
1. Install Arduino IDE
2. Install required libraries (MAX30102, MLX90614, MPU6050, PubSubClient)
3. Connect sensors to ESP32/ESP8266
4. Configure WiFi and MQTT settings in `littlewatch_sensor.ino`
5. Upload code to board
6. Open Serial Monitor to verify connection

## 🔧 Configuration

### Mobile App Configuration

Edit `services/api.js`:
```javascript
const API_BASE_URL = 'http://192.168.1.100:3000/api';
```

### Backend Configuration

Edit `backend/.env`:
- Set database credentials
- Configure JWT secret
- Set MQTT broker URL

### Arduino Configuration

Edit `arduino/littlewatch_sensor.ino`:
```cpp
const char* WIFI_SSID = "YourWiFiName";
const char* WIFI_PASSWORD = "YourWiFiPassword";
const char* MQTT_BROKER = "192.168.1.100";
const char* DEVICE_ID = "DEVICE001";
```

## 🧪 Testing

### Test Backend API

```bash
# Health check
curl http://localhost:3000/health

# Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Test MQTT Communication

```bash
# Subscribe to vitals topic
mosquitto_sub -t "littlewatch/+/vitals" -v

# Publish test data
mosquitto_pub -t "littlewatch/DEVICE001/vitals" \
  -m '{"heartRate":120,"temperature":36.8,"oxygenSaturation":98,"movementStatus":"normal","batteryLevel":85}'
```

### Test Mobile App

1. Start Expo: `npm start`
2. Scan QR code with Expo Go app (iOS/Android)
3. Sign up with new account
4. Add child profile
5. View dashboard (should show vitals if Arduino is sending data)

## 📱 Running the Mobile App

### On Physical Device (Recommended)

1. Install **Expo Go** from App Store (iOS) or Google Play (Android)
2. Run `npm start` in project directory
3. Scan QR code with Expo Go app
4. Ensure device is on same WiFi network as backend server

### On Emulator

**iOS Simulator:**
```bash
npm run ios
```

**Android Emulator:**
```bash
npm run android
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/change-password` - Change password

### Children
- `POST /api/children` - Add child
- `GET /api/children` - Get all children
- `GET /api/children/:id` - Get single child
- `PUT /api/children/:id` - Update child
- `DELETE /api/children/:id` - Delete child

### Vitals
- `POST /api/vitals` - Add vital reading
- `GET /api/vitals/:childId/latest` - Get latest vitals
- `GET /api/vitals/:childId/history` - Get vitals history
- `GET /api/vitals/:childId/stats` - Get vital statistics

### Alerts
- `GET /api/alerts` - Get all alerts
- `GET /api/alerts/child/:childId` - Get child alerts
- `PUT /api/alerts/:id/read` - Mark alert as read
- `PUT /api/alerts/:id/resolve` - Mark alert as resolved
- `GET /api/alerts/thresholds/:childId` - Get thresholds
- `PUT /api/alerts/thresholds/:childId` - Update thresholds

### Sleep
- `POST /api/sleep/start` - Start sleep session
- `PUT /api/sleep/end/:sessionId` - End sleep session
- `GET /api/sleep/:childId/history` - Get sleep history
- `GET /api/sleep/:childId/stats` - Get sleep statistics

## 🔒 Security

- JWT token-based authentication
- Password hashing with bcrypt
- Protected API endpoints
- Input validation
- SQL injection prevention

## ⚠️ Important Notes

### Medical Disclaimer

**This system is for educational and monitoring purposes only.** It is NOT a medical device and should NOT be used as a substitute for professional medical advice, diagnosis, or treatment.

- Always consult healthcare professionals for medical concerns
- Do not rely solely on this device for critical health decisions
- Sensor readings may have variance and should be verified
- Not FDA approved or medically certified

### Safety Considerations

- Ensure proper sensor placement to avoid discomfort
- Use child-safe, non-toxic materials for wearable band
- Monitor for skin irritation or allergic reactions
- Do not use damaged sensors or devices
- Keep device away from water unless waterproofed
- Supervise children while wearing the device

## 🐛 Troubleshooting

### Backend Issues

**Database connection failed:**
- Verify MySQL is running: `sudo systemctl status mysql`
- Check database credentials in `.env`
- Ensure database exists: `mysql -u root -p -e "SHOW DATABASES;"`

**MQTT connection failed:**
- Verify Mosquitto is running: `sudo systemctl status mosquitto`
- Test with: `mosquitto_pub -t "test" -m "hello"`

### Mobile App Issues

**Cannot connect to backend:**
- Use computer's IP address, not `localhost`
- Ensure phone and computer are on same WiFi network
- Check firewall settings
- Verify backend is running: `curl http://localhost:3000/health`

**"Network request failed":**
- Update `API_BASE_URL` in `services/api.js`
- Check if backend server is accessible
- Disable any VPN or proxy

### Arduino Issues

**WiFi not connecting:**
- Check SSID and password
- Ensure 2.4GHz WiFi (ESP doesn't support 5GHz)
- Move closer to router

**Sensor not found:**
- Check wiring connections
- Verify I2C address with scanner
- Ensure adequate power supply (3.3V)

**MQTT not connecting:**
- Verify broker IP address
- Check port 1883 is not blocked
- Test with MQTT Explorer tool

## 📚 Additional Resources

- [React Native Documentation](https://reactnative.dev/)
- [Expo Documentation](https://docs.expo.dev/)
- [Express.js Guide](https://expressjs.com/)
- [MySQL Documentation](https://dev.mysql.com/doc/)
- [MQTT Protocol](https://mqtt.org/)
- [Arduino ESP32 Guide](https://docs.espressif.com/projects/arduino-esp32/)

## 🤝 Contributing

This is an educational project. Feel free to fork and modify for your needs.

## 📄 License

MIT License - Free to use and modify for educational purposes.

## 👥 Support

For issues:
1. Check troubleshooting section
2. Review serial monitor output (Arduino)
3. Check backend server logs
4. Verify API connectivity

## 🔮 Future Enhancements

- [ ] Push notifications for critical alerts
- [ ] Multi-language support
- [ ] Cloud deployment (AWS/Heroku)
- [ ] Advanced analytics & ML predictions
- [ ] Medication reminders
- [ ] Doctor/caregiver access sharing
- [ ] Export data to PDF reports
- [ ] Voice alerts
- [ ] Smartwatch companion app

---

**Built with ❤️ for baby safety and parental peace of mind**
