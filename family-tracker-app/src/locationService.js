/**
 * 后台位置上报服务
 * 每分钟获取一次 GPS 位置，上报到服务器
 */
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

const LOCATION_TASK = 'background-location-report';
// 服务器地址 - 修改为你的服务器地址
const SERVER_URL = 'https://family-tracker-d7ga6zox1a73aaedb-1441713292.ap-shanghai.app.tcloudbase.com/api/location';

// 设备唯一标识（用随机 ID，首次启动时生成）
let deviceId = null;
let deviceName = '家人';

// 获取或生成设备 ID
async function getDeviceId() {
  if (deviceId) return deviceId;
  try {
    const { getItemAsync } = require('expo-secure-store');
    deviceId = await getItemAsync('device_id');
    if (!deviceId) {
      deviceId = 'device_' + Math.random().toString(36).substring(2, 10);
      const { setItemAsync } = require('expo-secure-store');
      await setItemAsync('device_id', deviceId);
    }
  } catch {
    // fallback
    deviceId = 'device_' + Math.random().toString(36).substring(2, 10);
  }
  return deviceId;
}

// 向服务器上报位置
async function reportLocation(lat, lng) {
  try {
    const id = await getDeviceId();
    const res = await fetch(SERVER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_id: id, lat, lng, name: deviceName }),
    });
    return res.ok;
  } catch (e) {
    console.log('上报失败:', e.message);
    return false;
  }
}

// 注册后台任务
TaskManager.defineTask(LOCATION_TASK, async ({ data, error }) => {
  if (error) return;
  if (data) {
    const { locations } = data;
    const loc = locations[0];
    if (loc) {
      await reportLocation(loc.coords.latitude, loc.coords.longitude);
    }
  }
});

// 启动后台定位
export async function startLocationTracking(name) {
  if (name) deviceName = name;
  
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') return false;
  
  const bgStatus = await Location.requestBackgroundPermissionsAsync();
  if (bgStatus.status !== 'granted') return false;
  
  // 每分钟上报一次
  await Location.startLocationUpdatesAsync(LOCATION_TASK, {
    accuracy: Location.Accuracy.High,
    timeInterval: 60000,       // 60秒
    distanceInterval: 0,       // 不限距离
    foregroundService: {
      notificationTitle: '家人位置',
      notificationBody: '正在后台上报位置',
    },
    pausesUpdatesAutomatically: false,
  });
  
  return true;
}

// 停止定位
export async function stopLocationTracking() {
  if (await TaskManager.isTaskRegisteredAsync(LOCATION_TASK)) {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK);
  }
}
