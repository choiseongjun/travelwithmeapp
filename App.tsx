/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useRef, useEffect } from 'react';
import {SafeAreaView, StatusBar, StyleSheet} from 'react-native';
import {WebView} from 'react-native-webview';
import messaging from '@react-native-firebase/messaging';

export default function App(): React.JSX.Element {
  const webViewRef = useRef<WebView>(null);

  const injectFCMToken = async () => {
    try {
      // FCM 권한 요청
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        console.log('FCM permission denied');
        return;
      }

      // FCM 토큰 가져오기
      const fcmToken = await messaging().getToken();
      if (!fcmToken) {
        console.log('Failed to get FCM token');
        return;
      }

      // WebView에 FCM 토큰 주입
      const script = `
        (function() {
          // 로그인 폼이 있는지 확인
          const loginForm = document.querySelector('form');
          if (loginForm) {
            // FCM 토큰을 hidden input으로 추가
            const fcmInput = document.createElement('input');
            fcmInput.type = 'hidden';
            fcmInput.name = 'fcmToken';
            fcmInput.value = '${fcmToken}';
            loginForm.appendChild(fcmInput);
          }
        })();
      `;

      webViewRef.current?.injectJavaScript(script);
    } catch (error) {
      console.error('Error injecting FCM token:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <WebView  
        ref={webViewRef}
        source={{uri: 'https://www.travelwithme.co.kr/'}}
        style={styles.webview}
        onLoadEnd={injectFCMToken}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      /> 
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
});
