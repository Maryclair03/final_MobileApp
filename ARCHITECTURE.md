# Little Watch System Architecture

## Overview

Little Watch is a comprehensive baby health monitoring system built with modern technologies and industry best practices. This document explains the system architecture, data flow, and technical decisions.

## Technology Stack

### Mobile Application
- **Framework**: React Native 0.81.4
- **Platform**: Expo 54
- **Navigation**: React Navigation 7
- **State Management**: React Hooks (useState, useEffect)
- **Storage**: AsyncStorage (for JWT tokens)
- **UI Components**: Custom components with Ionicons
- **Charts**: react-native-chart-kit
- **HTTP Client**: Fetch API

### Backend Server
- **Runtime**: Node.js
- **Framework**: Express.js 4.18
- **Database**: MySQL 8.0+
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **Communication Protocol**: MQTT (mqtt.js)
- **WebSocket**: ws (for real-time updates)
- **API Style**: RESTful

### Arduino Device
- **Microcontroller**: ESP32 / ESP8266
- **Sensors**:
  - MAX30102: Heart Rate & SpO2
  - MLX90614: Non-contact Temperature
  - MPU6050: Accelerometer & Gyroscope
- **Communication**: WiFi + MQTT
- **Protocol**: JSON over MQTT

### Infrastructure
- **Message Broker**: Mosquitto MQTT
- **Database**: MySQL with connection pooling
- **Version Control**: Git

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      MOBILE APP LAYER                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Screens    │  │  Services    │  │  AsyncStorage│      │
│  │ (Components) │◄─┤  (api.js)    │◄─┤   (Tokens)   │      │
│  └──────────────┘  └──────┬───────┘  └──────────────┘      │
└─────────────────────────────┼──────────────────────────────┘
                              │ REST API (HTTP/JSON)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      BACKEND LAYER                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Routes     │─▶│ Controllers  │─▶│  Middleware  │      │
│  │ (Express)    │  │  (Business)  │  │    (Auth)    │      │
│  └──────────────┘  └──────┬───────┘  └──────────────┘      │
│         ▲                  │                                 │
│         │                  ▼                                 │
│  ┌──────┴───────┐  ┌──────────────┐                        │
│  │ MQTT Service │  │   Database   │                        │
│  │  (Subscribe) │  │   (MySQL)    │                        │
│  └──────▲───────┘  └──────────────┘                        │
└─────────┼──────────────────────────────────────────────────┘
          │ MQTT Protocol
          ▼
┌─────────────────────────────────────────────────────────────┐
│                     ARDUINO DEVICE LAYER                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   MAX30102   │  │   MLX90614   │  │   MPU6050    │      │
│  │ (HR & SpO2)  │  │ (Temperature)│  │  (Movement)  │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         └──────────────────┴────────────────┬┘              │
│                             ▼                                │
│                  ┌──────────────────┐                       │
│                  │  ESP32 Firmware  │                       │
│                  │  (WiFi + MQTT)   │                       │
│                  └──────────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. User Authentication Flow

```
Mobile App                Backend                  Database
    │                        │                         │
    ├──POST /auth/register──▶│                         │
    │   (name, email, pwd)   │                         │
    │                        ├──hash password──────────┤
    │                        │                         │
    │                        ├──INSERT user───────────▶│
    │                        │                         │
    │                        │◀──user_id──────────────┤
    │                        │                         │
    │                        ├──generate JWT token     │
    │                        │                         │
    │◀──{token, user}────────┤                         │
    │                        │                         │
    ├──Store token in        │                         │
    │   AsyncStorage         │                         │
    │                        │                         │
    ├──All future requests   │                         │
    │   include:             │                         │
    │   Authorization:       │                         │
    │   Bearer <token>       │                         │
    └────────────────────────┴─────────────────────────┘
```

### 2. Real-Time Vital Signs Flow

```
Arduino                 MQTT Broker              Backend                Database              Mobile App
   │                        │                       │                      │                      │
   ├─Read Sensors──────────▶│                       │                      │                      │
   │  (HR, Temp, SpO2)      │                       │                      │                      │
   │                        │                       │                      │                      │
   ├─Publish to MQTT────────▶│                       │                      │                      │
   │  littlewatch/          │                       │                      │                      │
   │  DEVICE001/vitals      │                       │                      │                      │
   │                        │                       │                      │                      │
   │                        ├─Message Received──────▶│                      │                      │
   │                        │  (JSON payload)       │                      │                      │
   │                        │                       │                      │                      │
   │                        │                       ├─Parse & Validate     │                      │
   │                        │                       │                      │                      │
   │                        │                       ├─Find Child by────────▶│                      │
   │                        │                       │  device_id           │                      │
   │                        │                       │                      │                      │
   │                        │                       │◀─child_id────────────┤                      │
   │                        │                       │                      │                      │
   │                        │                       ├─INSERT vital_reading─▶│                      │
   │                        │                       │                      │                      │
   │                        │                       ├─Check Thresholds     │                      │
   │                        │                       │                      │                      │
   │                        │                       ├─INSERT alert (if needed)─▶                   │
   │                        │                       │                      │                      │
   │                        │                       │                      │                      │
   │                        │                       │                      │     ┌──Auto refresh  │
   │                        │                       │                      │     │   every 10s    │
   │                        │                       │                      │     │                │
   │                        │                       │                      │  ◀──┴────────────────┤
   │                        │                       │                      │  GET /vitals/:id/    │
   │                        │                       │                      │      latest          │
   │                        │                       │                      │                      │
   │                        │                       │◀─────────────────────┼──────────────────────┤
   │                        │                       │                      │                      │
   │                        │                       ├─SELECT latest vitals─▶│                      │
   │                        │                       │                      │                      │
   │                        │                       │◀─vital data──────────┤                      │
   │                        │                       │                      │                      │
   │                        │                       ├──{vitals}────────────┼─────────────────────▶│
   │                        │                       │                      │                      │
   │                        │                       │                      │      Update UI       │
   │                        │                       │                      │      Display values  │
   └────────────────────────┴───────────────────────┴──────────────────────┴──────────────────────┘
```

### 3. Alert Generation Flow

```
Backend                        Database                      Mobile App
   │                              │                              │
   ├─Receive Vital Reading────────┤                              │
   │                              │                              │
   ├─Query Threshold Settings─────▶│                              │
   │                              │                              │
   │◀─{min, max values}───────────┤                              │
   │                              │                              │
   ├─Compare Values:              │                              │
   │  if HR < min OR HR > max     │                              │
   │                              │                              │
   ├─Calculate Severity:           │                              │
   │  • Critical: ±10 from limit  │                              │
   │  • High: outside range       │                              │
   │  • Medium: borderline        │                              │
   │                              │                              │
   ├─INSERT INTO alerts───────────▶│                              │
   │  (type, severity, message)   │                              │
   │                              │                              │
   │                              │  ┌──User opens notifications │
   │                              │  │                           │
   │                              │◀─┴─GET /alerts?unreadOnly=true
   │                              │                              │
   │◀─Query unread alerts─────────┤                              │
   │                              │                              │
   ├──{alerts: [...]}─────────────┼─────────────────────────────▶│
   │                              │                              │
   │                              │      Display Alert List      │
   │                              │      with badge count        │
   └──────────────────────────────┴──────────────────────────────┘
```

## Database Schema

### Entity Relationship Diagram

```
┌─────────────┐         ┌──────────────┐         ┌─────────────────┐
│    users    │         │   children   │         │  vital_readings │
├─────────────┤         ├──────────────┤         ├─────────────────┤
│ id (PK)     │◄────┐   │ id (PK)      │◄────┐   │ id (PK)         │
│ name        │     └───┤ user_id (FK) │     └───┤ child_id (FK)   │
│ email       │         │ name         │         │ heart_rate      │
│ password    │         │ date_of_birth│         │ temperature     │
│ phone       │         │ gender       │         │ oxygen_sat      │
│ created_at  │         │ device_id    │         │ movement_status │
└─────────────┘         │ medical_notes│         │ battery_level   │
                        └──────────────┘         │ timestamp       │
                                │                └─────────────────┘
                                │
                                │
                    ┌───────────┼───────────┐
                    │           │           │
                    ▼           ▼           ▼
            ┌───────────┐ ┌────────────┐ ┌──────────────────┐
            │   alerts  │ │sleep_patterns│threshold_settings│
            ├───────────┤ ├────────────┤ ├──────────────────┤
            │ id (PK)   │ │ id (PK)    │ │ id (PK)          │
            │child_id(FK)│child_id(FK)│ │ child_id (FK)    │
            │ alert_type│ │ sleep_start│ │ heart_rate_min   │
            │ severity  │ │ sleep_end  │ │ heart_rate_max   │
            │ message   │ │ duration   │ │ temperature_min  │
            │ is_read   │ │ quality    │ │ temperature_max  │
            └───────────┘ └────────────┘ │ oxygen_min       │
                                         │ alert_enabled    │
                                         └──────────────────┘
```

## API Endpoints

### Authentication Endpoints
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Authenticate user
- `GET /api/auth/profile` - Get user info (Protected)
- `PUT /api/auth/profile` - Update user info (Protected)
- `POST /api/auth/change-password` - Change password (Protected)

### Children Management
- `POST /api/children` - Add child (Protected)
- `GET /api/children` - List all children (Protected)
- `GET /api/children/:id` - Get child details (Protected)
- `PUT /api/children/:id` - Update child (Protected)
- `DELETE /api/children/:id` - Remove child (Protected)

### Vitals Data
- `POST /api/vitals` - Add manual reading (Protected)
- `GET /api/vitals/:childId/latest` - Get current vitals (Protected)
- `GET /api/vitals/:childId/history` - Get historical data (Protected)
- `GET /api/vitals/:childId/stats` - Get statistics (Protected)

### Alerts & Notifications
- `GET /api/alerts` - Get all alerts (Protected)
- `GET /api/alerts/child/:childId` - Get child alerts (Protected)
- `PUT /api/alerts/:id/read` - Mark as read (Protected)
- `PUT /api/alerts/:id/resolve` - Mark as resolved (Protected)
- `GET /api/alerts/thresholds/:childId` - Get thresholds (Protected)
- `PUT /api/alerts/thresholds/:childId` - Update thresholds (Protected)

### Sleep Tracking
- `POST /api/sleep/start` - Start sleep session (Protected)
- `PUT /api/sleep/end/:sessionId` - End session (Protected)
- `GET /api/sleep/:childId/history` - Get sleep history (Protected)
- `GET /api/sleep/:childId/stats` - Get sleep stats (Protected)
- `GET /api/sleep/:childId/active` - Get active session (Protected)

## MQTT Topics

### Device to Backend (Publish)
- `littlewatch/{DEVICE_ID}/vitals` - Sensor readings
  ```json
  {
    "heartRate": 120,
    "temperature": 36.8,
    "oxygenSaturation": 98,
    "movementStatus": "normal",
    "batteryLevel": 85
  }
  ```

- `littlewatch/{DEVICE_ID}/status` - Device status
  ```json
  {
    "batteryLevel": 85,
    "firmwareVersion": "1.0.0",
    "connected": true
  }
  ```

### Backend to Device (Subscribe)
- `littlewatch/{DEVICE_ID}/commands` - Control commands
  ```json
  {
    "command": "updateInterval",
    "value": 10000
  }
  ```

## Security Measures

### Authentication
- JWT tokens with 30-day expiration
- Secure token storage in AsyncStorage
- Bearer token authentication for all protected routes

### Password Security
- bcrypt hashing with salt rounds (10)
- Minimum password length: 6 characters
- Password validation on both client and server

### Database Security
- Prepared statements (prevents SQL injection)
- Foreign key constraints
- Connection pooling with timeout
- User permission isolation

### API Security
- CORS enabled for specific origins
- Request body size limits
- Input validation and sanitization
- Error messages don't leak sensitive info

### MQTT Security
- Optional username/password authentication
- TLS/SSL support (configurable)
- Topic-based access control
- Message QoS levels

## Performance Optimizations

### Backend
- MySQL connection pooling (10 connections)
- Efficient database queries with indexes
- Asynchronous operations (async/await)
- MQTT message batching

### Mobile App
- Lazy loading of components
- Image optimization
- Efficient re-renders with React hooks
- Data caching in memory
- Pull-to-refresh instead of constant polling
- Auto-refresh every 10 seconds (configurable)

### Arduino
- Optimized sensor reading loops
- Power-saving modes (future)
- Efficient JSON serialization
- MQTT QoS 1 (guaranteed delivery)

## Scalability Considerations

### Current Architecture
- Single backend server
- Single MySQL instance
- Single MQTT broker
- Direct device-to-server communication

### Future Scaling Options

1. **Horizontal Scaling**
   - Load balancer (Nginx/HAProxy)
   - Multiple backend instances
   - Shared session storage (Redis)
   - Database replication

2. **Vertical Scaling**
   - Larger server instances
   - More CPU/RAM allocation
   - SSD storage

3. **Database Optimization**
   - Read replicas for analytics
   - Partitioning by date
   - Archiving old data
   - Caching layer (Redis)

4. **MQTT Scaling**
   - MQTT broker cluster
   - Message queue integration (RabbitMQ)
   - Edge computing for preprocessing

5. **Cloud Deployment**
   - AWS: EC2, RDS, IoT Core
   - Azure: App Service, SQL Database, IoT Hub
   - Google Cloud: Compute Engine, Cloud SQL, Cloud IoT

## Error Handling

### Mobile App
- Try-catch blocks for API calls
- User-friendly error messages
- Loading states during operations
- Graceful degradation if backend unavailable

### Backend
- Global error handler middleware
- Structured error responses
- Database connection retry logic
- MQTT reconnection handling
- Logging with timestamps

### Arduino
- WiFi reconnection attempts
- MQTT reconnection logic
- Sensor initialization checks
- Invalid reading filtering

## Monitoring & Logging

### Backend Logs
- Request/response logging
- Database query logging
- MQTT message logging
- Error stack traces

### Mobile App
- Console logs for development
- Error boundaries for crash prevention
- Analytics tracking (future)

### Arduino
- Serial monitor output
- Connection status
- Sensor readings validation
- Error messages

## Testing Strategy

### Unit Tests (Future)
- Backend controllers
- API endpoints
- Authentication logic
- Threshold calculations

### Integration Tests (Future)
- API end-to-end flows
- Database operations
- MQTT communication

### Manual Testing
- Mobile app user flows
- Backend API with curl/Postman
- Arduino serial monitor verification
- MQTT with mosquitto_pub/sub

## Deployment Guide

### Development Environment
- Local MySQL database
- Local MQTT broker
- Backend on localhost:3000
- Mobile app via Expo Go

### Production Environment (Future)
- Cloud MySQL (AWS RDS, Azure SQL)
- Cloud MQTT (AWS IoT, Azure IoT Hub)
- Backend on cloud server (EC2, Azure App Service)
- Mobile app published to stores
- Domain with SSL certificate
- Environment-based configuration

## Maintenance

### Regular Tasks
- Database backups (daily recommended)
- Log rotation
- Security updates
- Dependency updates
- Performance monitoring

### Monitoring Metrics
- API response times
- Database query performance
- MQTT message delivery rate
- Mobile app crash rates
- Device connection uptime

---

**Architecture Version**: 1.0.0
**Last Updated**: 2024
**Contact**: See README.md for support information
