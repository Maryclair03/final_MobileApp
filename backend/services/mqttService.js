const mqtt = require('mqtt');
const db = require('../config/database');

let mqttClient = null;

const initialize = () => {
  const brokerUrl = process.env.MQTT_BROKER || 'mqtt://localhost:1883';

  const options = {
    username: process.env.MQTT_USERNAME || '',
    password: process.env.MQTT_PASSWORD || '',
    reconnectPeriod: 5000,
    clientId: 'littlewatch_backend_' + Math.random().toString(16).substr(2, 8)
  };

  console.log('📡 Connecting to MQTT broker:', brokerUrl);

  mqttClient = mqtt.connect(brokerUrl, options);

  mqttClient.on('connect', () => {
    console.log('✅ MQTT Connected successfully');

    // Subscribe to vital signs data from all devices
    mqttClient.subscribe('littlewatch/+/vitals', (err) => {
      if (err) {
        console.error('❌ MQTT subscription error:', err);
      } else {
        console.log('📬 Subscribed to: littlewatch/+/vitals');
      }
    });

    // Subscribe to device status
    mqttClient.subscribe('littlewatch/+/status', (err) => {
      if (err) {
        console.error('❌ MQTT subscription error:', err);
      } else {
        console.log('📬 Subscribed to: littlewatch/+/status');
      }
    });
  });

  mqttClient.on('message', async (topic, message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log('📨 MQTT Message received:', topic, data);

      // Extract device ID from topic (e.g., littlewatch/DEVICE001/vitals)
      const topicParts = topic.split('/');
      const deviceId = topicParts[1];
      const messageType = topicParts[2];

      if (messageType === 'vitals') {
        await handleVitalsData(deviceId, data);
      } else if (messageType === 'status') {
        await handleDeviceStatus(deviceId, data);
      }
    } catch (error) {
      console.error('❌ Error processing MQTT message:', error);
    }
  });

  mqttClient.on('error', (err) => {
    console.error('❌ MQTT Error:', err);
  });

  mqttClient.on('reconnect', () => {
    console.log('🔄 MQTT Reconnecting...');
  });

  mqttClient.on('offline', () => {
    console.log('📴 MQTT Offline');
  });
};

const handleVitalsData = async (deviceId, data) => {
  try {
    const { heartRate, temperature, oxygenSaturation, movementStatus, batteryLevel } = data;

    // Find child associated with this device
    const [children] = await db.query(
      'SELECT id FROM children WHERE device_id = ?',
      [deviceId]
    );

    if (children.length === 0) {
      console.warn(`⚠️  No child found for device ${deviceId}`);
      return;
    }

    const childId = children[0].id;

    // Insert vital reading
    await db.query(
      `INSERT INTO vital_readings
       (child_id, heart_rate, temperature, oxygen_saturation, movement_status, battery_level, device_connected)
       VALUES (?, ?, ?, ?, ?, ?, TRUE)`,
      [childId, heartRate, temperature, oxygenSaturation, movementStatus, batteryLevel]
    );

    console.log(`✅ Vital data saved for child ${childId}`);

    // Check thresholds and create alerts if needed
    await checkThresholds(childId, heartRate, temperature, oxygenSaturation);
  } catch (error) {
    console.error('❌ Error handling vitals data:', error);
  }
};

const handleDeviceStatus = async (deviceId, data) => {
  try {
    const { batteryLevel, firmwareVersion, connected } = data;

    // Update device information
    await db.query(
      `INSERT INTO devices (device_id, battery_level, firmware_version, last_sync, is_active)
       VALUES (?, ?, ?, NOW(), ?)
       ON DUPLICATE KEY UPDATE
       battery_level = VALUES(battery_level),
       firmware_version = VALUES(firmware_version),
       last_sync = NOW(),
       is_active = VALUES(is_active)`,
      [deviceId, batteryLevel, firmwareVersion, connected]
    );

    console.log(`✅ Device status updated for ${deviceId}`);

    // Check for low battery and create alert
    if (batteryLevel < 20) {
      const [children] = await db.query(
        'SELECT id FROM children WHERE device_id = ?',
        [deviceId]
      );

      if (children.length > 0) {
        await db.query(
          `INSERT INTO alerts (child_id, alert_type, severity, message, value)
           VALUES (?, 'battery', 'medium', 'Low battery level', ?)`,
          [children[0].id, batteryLevel.toString()]
        );
      }
    }
  } catch (error) {
    console.error('❌ Error handling device status:', error);
  }
};

const checkThresholds = async (childId, heartRate, temperature, oxygenSaturation) => {
  try {
    const [settings] = await db.query(
      'SELECT * FROM threshold_settings WHERE child_id = ? AND alert_enabled = TRUE',
      [childId]
    );

    if (settings.length === 0) return;

    const threshold = settings[0];
    const alerts = [];

    if (heartRate && (heartRate < threshold.heart_rate_min || heartRate > threshold.heart_rate_max)) {
      const severity = heartRate < threshold.heart_rate_min - 10 || heartRate > threshold.heart_rate_max + 10
        ? 'critical' : 'high';
      alerts.push({
        type: 'heart_rate',
        severity,
        message: `Heart rate ${heartRate} BPM is ${heartRate < threshold.heart_rate_min ? 'below' : 'above'} normal range`,
        value: heartRate.toString()
      });
    }

    if (temperature && (temperature < threshold.temperature_min || temperature > threshold.temperature_max)) {
      const severity = temperature > threshold.temperature_max + 1 ? 'critical' : 'high';
      alerts.push({
        type: 'temperature',
        severity,
        message: `Temperature ${temperature}°C is ${temperature < threshold.temperature_min ? 'below' : 'above'} normal range`,
        value: temperature.toString()
      });
    }

    if (oxygenSaturation && oxygenSaturation < threshold.oxygen_min) {
      const severity = oxygenSaturation < threshold.oxygen_min - 5 ? 'critical' : 'high';
      alerts.push({
        type: 'oxygen',
        severity,
        message: `Oxygen saturation ${oxygenSaturation}% is below normal range`,
        value: oxygenSaturation.toString()
      });
    }

    for (const alert of alerts) {
      await db.query(
        'INSERT INTO alerts (child_id, alert_type, severity, message, value) VALUES (?, ?, ?, ?, ?)',
        [childId, alert.type, alert.severity, alert.message, alert.value]
      );
    }
  } catch (error) {
    console.error('❌ Error checking thresholds:', error);
  }
};

const publishCommand = (deviceId, command) => {
  if (!mqttClient || !mqttClient.connected) {
    console.error('❌ MQTT client not connected');
    return false;
  }

  const topic = `littlewatch/${deviceId}/commands`;
  mqttClient.publish(topic, JSON.stringify(command), { qos: 1 });
  console.log(`📤 Command sent to ${deviceId}:`, command);
  return true;
};

const disconnect = () => {
  if (mqttClient) {
    mqttClient.end();
    console.log('🔌 MQTT disconnected');
  }
};

module.exports = {
  initialize,
  publishCommand,
  disconnect
};
