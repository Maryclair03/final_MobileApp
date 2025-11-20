# Quick Setup Guide - Little Watch

Follow these steps to get your Little Watch system up and running in 30 minutes!

## 🎯 Quick Start Checklist

- [ ] MySQL database installed and running
- [ ] MQTT broker (Mosquitto) installed
- [ ] Backend server configured and running
- [ ] Mobile app configured with correct API URL
- [ ] Arduino sensors connected and code uploaded

## 📋 Step-by-Step Setup

### Step 1: Install Prerequisites (10 minutes)

#### On Ubuntu/Debian:
```bash
# Update system
sudo apt update

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MySQL
sudo apt install mysql-server

# Install MQTT Broker
sudo apt install mosquitto mosquitto-clients

# Install Expo CLI
sudo npm install -g expo-cli
```

#### On macOS:
```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node

# Install MySQL
brew install mysql
brew services start mysql

# Install Mosquitto
brew install mosquitto
brew services start mosquitto

# Install Expo CLI
npm install -g expo-cli
```

#### On Windows:
1. Download and install [Node.js](https://nodejs.org/)
2. Download and install [MySQL](https://dev.mysql.com/downloads/installer/)
3. Download and install [Mosquitto](https://mosquitto.org/download/)
4. Install Expo CLI: `npm install -g expo-cli`

### Step 2: Database Setup (5 minutes)

```bash
# Open MySQL
mysql -u root -p

# Create database and user
CREATE DATABASE littlewatch_db;
CREATE USER 'littlewatch'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON littlewatch_db.* TO 'littlewatch'@'localhost';
FLUSH PRIVILEGES;

# Import schema
USE littlewatch_db;
SOURCE backend/config/schema.sql;

# Verify tables
SHOW TABLES;
# Should show: users, children, vital_readings, alerts, etc.

EXIT;
```

### Step 3: Backend Setup (5 minutes)

```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your settings
nano .env
```

Update these values in `.env`:
```env
DB_HOST=localhost
DB_USER=littlewatch
DB_PASSWORD=your_password
DB_NAME=littlewatch_db
JWT_SECRET=change_this_to_random_string_12345
MQTT_BROKER=mqtt://localhost:1883
```

Start the server:
```bash
npm start
```

You should see:
```
✅ Database connected successfully
📡 MQTT Connected successfully
╔════════════════════════════════════════╗
║  Little Watch API Server Running      ║
║  Port: 3000                            ║
╚════════════════════════════════════════╝
```

### Step 4: Find Your Computer's IP Address

You'll need this for the mobile app and Arduino:

**On Linux/Mac:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**On Windows:**
```cmd
ipconfig | findstr IPv4
```

Example output: `192.168.1.100` (use this IP)

### Step 5: Mobile App Setup (5 minutes)

```bash
# Navigate to project root
cd ..

# Install dependencies
npm install

# Configure API endpoint
nano services/api.js
```

Change this line:
```javascript
const API_BASE_URL = 'http://YOUR_COMPUTER_IP:3000/api';
// Example: 'http://192.168.1.100:3000/api'
```

Start the app:
```bash
npm start
```

Scan QR code with Expo Go app on your phone!

### Step 6: Test the System (5 minutes)

#### Test Backend API:
```bash
# In a new terminal, test registration
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```

Expected response:
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGc..."
}
```

#### Test Mobile App:
1. Open Expo Go on your phone
2. Scan QR code
3. Sign up with new account
4. You should reach the home screen

#### Simulate Arduino Data (without hardware):
```bash
# Publish test vitals data
mosquitto_pub -t "littlewatch/DEVICE001/vitals" \
  -m '{"heartRate":120,"temperature":36.8,"oxygenSaturation":98,"movementStatus":"normal","batteryLevel":85}'
```

Check backend logs - you should see:
```
📨 MQTT Message received: littlewatch/DEVICE001/vitals {...}
✅ Vital data saved for child 1
```

### Step 7: Arduino Setup (Optional - if you have hardware)

See detailed instructions in `arduino/README.md`

**Quick steps:**
1. Install Arduino IDE
2. Install libraries: MAX30102, MLX90614, MPU6050, PubSubClient
3. Open `arduino/littlewatch_sensor.ino`
4. Update WiFi credentials:
   ```cpp
   const char* WIFI_SSID = "YourWiFiName";
   const char* WIFI_PASSWORD = "YourPassword";
   const char* MQTT_BROKER = "192.168.1.100"; // Your computer IP
   ```
5. Connect sensors to ESP32
6. Upload code
7. Open Serial Monitor (115200 baud)

You should see:
```
✓ MAX30102 initialized
✓ MLX90614 initialized
✓ MPU6050 initialized
✓ WiFi connected!
✓ MQTT Connected successfully
```

## 🎉 Success!

Your system is now running! Here's what you can do:

### Mobile App:
1. **Sign up** - Create your account
2. **Add child** - Go to Settings → Add Child
3. **View dashboard** - See real-time vitals (if Arduino is connected)
4. **Set thresholds** - Configure alert limits
5. **View history** - Check past readings

### Test Without Hardware:

If you don't have Arduino sensors yet, simulate data:

```bash
# Start a loop to send data every 5 seconds
while true; do
  mosquitto_pub -t "littlewatch/DEVICE001/vitals" \
    -m "{\"heartRate\":$((RANDOM % 30 + 100)),\"temperature\":$((RANDOM % 15 + 360))/10,\"oxygenSaturation\":$((RANDOM % 5 + 95)),\"movementStatus\":\"normal\",\"batteryLevel\":$((RANDOM % 20 + 70))}"
  sleep 5
done
```

Pull down to refresh the home screen in the mobile app!

## 🔧 Common Issues & Solutions

### "Cannot connect to server"
**Solution:**
- Ensure backend is running (`npm start` in backend folder)
- Use computer's IP, not `localhost`
- Phone and computer must be on same WiFi network

### "Database connection failed"
**Solution:**
- Start MySQL: `sudo systemctl start mysql`
- Check credentials in `backend/.env`
- Verify database exists: `mysql -u root -p -e "SHOW DATABASES;"`

### "MQTT not connecting"
**Solution:**
- Start Mosquitto: `sudo systemctl start mosquitto`
- Test: `mosquitto_sub -t "test"`

### Mobile app won't load
**Solution:**
- Clear Expo cache: `expo start -c`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Update Expo Go app on phone

## 📚 Next Steps

1. **Add a child profile** in the app
2. **Configure alert thresholds** for your baby's age
3. **Connect Arduino sensors** for real hardware monitoring
4. **Set up device ID** in Arduino code to match child profile
5. **Test alerts** by simulating out-of-range values

## 🆘 Getting Help

If you're stuck:
1. Check backend logs for errors
2. Check Arduino Serial Monitor output
3. Test API with curl commands
4. Verify all services are running
5. Review the main README.md for detailed troubleshooting

## 🎯 System Architecture Overview

```
┌─────────────┐       WiFi        ┌──────────────┐
│   Arduino   │ ─────MQTT────────▶│   Backend    │
│   Sensors   │                    │   Node.js    │
└─────────────┘                    │   + MySQL    │
                                   └──────┬───────┘
                                          │ REST API
                                          ▼
                                   ┌──────────────┐
                                   │  Mobile App  │
                                   │ React Native │
                                   └──────────────┘
```

**Data Flow:**
1. Arduino reads sensors every 5 seconds
2. Publishes to MQTT broker
3. Backend receives MQTT message
4. Saves to MySQL database
5. Checks thresholds, creates alerts if needed
6. Mobile app fetches data via REST API
7. Displays real-time vitals to parent

## 🔐 Security Tips

- Change default JWT_SECRET in `.env`
- Use strong MySQL password
- Don't commit `.env` file to git (it's in `.gitignore`)
- In production, use HTTPS/WSS instead of HTTP/WS
- Consider MQTT authentication for production

## 📊 Testing Complete System

Create a test child and link to device:

```sql
mysql -u root -p littlewatch_db

-- Add a test child (replace user_id with your user ID)
INSERT INTO children (user_id, name, date_of_birth, gender, device_id)
VALUES (1, 'Test Baby', '2024-01-01', 'male', 'DEVICE001');

-- Check it was created
SELECT * FROM children;
```

Now Arduino with DEVICE_ID="DEVICE001" will send data to this child!

## ✅ Final Checklist

- [ ] Backend server running on port 3000
- [ ] MySQL database created and schema imported
- [ ] MQTT broker running on port 1883
- [ ] Mobile app configured with correct IP
- [ ] Can register and login from mobile app
- [ ] Can add child profile
- [ ] Dashboard shows vitals (real or simulated)
- [ ] Alerts system working
- [ ] Arduino connected (optional)

**Congratulations! 🎉 Your Little Watch system is fully operational!**

---

**Need help?** Check the main README.md or open an issue on GitHub.
