import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { startLocationTracking, stopLocationTracking } from './src/locationService';

export default function App() {
  const [name, setName] = useState('');
  const [started, setStarted] = useState(false);
  const [status, setStatus] = useState('');

  const handleStart = async () => {
    if (!name.trim()) {
      Alert.alert('提示', '请输入您的称呼');
      return;
    }
    setStatus('正在启动定位...');
    const ok = await startLocationTracking(name.trim());
    if (ok) {
      setStarted(true);
      setStatus('✅ 后台定位已启动');
    } else {
      setStatus('❌ 定位权限被拒绝，请在设置中开启');
    }
  };

  const handleStop = async () => {
    await stopLocationTracking();
    setStarted(false);
    setStatus('⏹ 定位已停止');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>📍</Text>
      <Text style={styles.title}>家人位置</Text>
      <Text style={styles.subtitle}>安装后自动上报位置，家人即可在地图上看到您</Text>

      {!started ? (
        <>
          <TextInput
            style={styles.input}
            placeholder="请输入您的称呼（如：妈妈）"
            value={name}
            onChangeText={setName}
          />
          <TouchableOpacity style={styles.button} onPress={handleStart}>
            <Text style={styles.buttonText}>开始上报位置</Text>
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.running}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.runningText}>正在后台上报位置...</Text>
          <Text style={styles.runningSub}>每分钟更新一次，关掉APP也不会停止</Text>
          <TouchableOpacity style={styles.stopButton} onPress={handleStop}>
            <Text style={styles.stopButtonText}>停止上报</Text>
          </TouchableOpacity>
        </View>
      )}

      {status ? <Text style={styles.status}>{status}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  icon: { fontSize: 64, marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '700', color: '#1e293b', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 32, lineHeight: 20 },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  button: {
    width: '100%',
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  running: { alignItems: 'center', marginBottom: 24 },
  runningText: { fontSize: 18, fontWeight: '600', color: '#1e293b', marginTop: 16, marginBottom: 4 },
  runningSub: { fontSize: 13, color: '#94a3b8', marginBottom: 24 },
  stopButton: { padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ef4444' },
  stopButtonText: { color: '#ef4444', fontSize: 14, fontWeight: '500' },
  status: { fontSize: 13, color: '#64748b', marginTop: 16, textAlign: 'center' },
});
