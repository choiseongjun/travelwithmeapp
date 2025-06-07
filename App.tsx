/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useRef, useEffect, useState } from 'react';
import {SafeAreaView, StatusBar, StyleSheet, Text, View} from 'react-native';
import {WebView} from 'react-native-webview';
import messaging from '@react-native-firebase/messaging';

export default function App(): React.JSX.Element {
  const webViewRef = useRef<WebView>(null);
  const [fcmToken, setFcmToken] = useState<string>('');
  const [debugInfo, setDebugInfo] = useState<string>('Initializing...');

  useEffect(() => {
    // FCM 초기화 체크
    const checkFCM = async () => {
      try {
        setDebugInfo('Checking FCM initialization...');
        const isInitialized = messaging().app;
        setDebugInfo(prev => prev + '\nFCM initialized: ' + (isInitialized ? 'Yes' : 'No'));
        
        // 권한 상태 확인
        const authStatus = await messaging().hasPermission();
        setDebugInfo(prev => prev + '\nCurrent permission status: ' + authStatus);
        
        // 토큰 확인
        const token = await messaging().getToken();
        setDebugInfo(prev => prev + '\nInitial token check: ' + (token ? 'Token exists' : 'No token'));
        if (token) {
          setFcmToken(token);
          setDebugInfo(prev => prev + '\nToken stored in state');
          
          // WebView에 즉시 토큰 주입
          const script = `
            (function() {
              const loginForm = document.querySelector('form');
              if (loginForm) {
                const fcmInput = document.createElement('input');
                fcmInput.type = 'hidden';
                fcmInput.name = 'fcmToken';
                fcmInput.value = '${token}';
                loginForm.appendChild(fcmInput);
                console.log('FCM token injected into form on initial load');
              } else {
                console.log('Login form not found on initial load');
              }
            })();
          `;
          webViewRef.current?.injectJavaScript(script);
          setDebugInfo(prev => prev + '\nInitial token injection attempted');
        }
      } catch (error: any) {
        setDebugInfo(prev => prev + '\nError in FCM check: ' + error.message);
      }
    };

    checkFCM();
  }, []);

  const injectFCMToken = async () => {
    try {
      setDebugInfo(prev => prev + '\nRequesting FCM permission...');
      // FCM 권한 요청
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      setDebugInfo(prev => prev + '\nPermission status: ' + authStatus);

      if (!enabled) {
        setDebugInfo(prev => prev + '\nFCM permission denied');
        return;
      }

      // FCM 토큰 가져오기
      setDebugInfo(prev => prev + '\nGetting FCM token...');
      const token = await messaging().getToken();
      if (!token) {
        setDebugInfo(prev => prev + '\nFailed to get FCM token');
        return;
      }
      
      setFcmToken(token);
      setDebugInfo(prev => prev + '\nToken received successfully');
      console.log('RN Debug - FCM Token:', token);

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
            fcmInput.value = '${token}';
            loginForm.appendChild(fcmInput);
            console.log('FCM token injected into form');
          } else {
            console.log('Login form not found');
          }
        })();
      `; 

      webViewRef.current?.injectJavaScript(script);
      setDebugInfo(prev => prev + '\nScript injected into WebView');
    } catch (error: any) {
      setDebugInfo(prev => prev + '\nError: ' + error.message);
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
        onLoadStart={(event) => {
          const url = event.nativeEvent.url;
          if (url.includes('travelwithme.co.kr/login') && fcmToken) {
            // 페이지 로드 시작 시 토큰 주입
            const script = `
              (function() {
                // DOM이 준비되면 실행
                function injectToken() {
                  console.log('Attempting to inject FCM token...');
                  const loginForm = document.querySelector('form');
                  console.log('Login form found:', !!loginForm);
                  
                  if (loginForm) {
                    // 기존 토큰 제거
                    const existingToken = document.querySelector('input[name="fcmToken"]');
                    if (existingToken) {
                      existingToken.remove();
                    }
                    
                    // 새 토큰 추가
                    const fcmInput = document.createElement('input');
                    fcmInput.type = 'hidden';
                    fcmInput.name = 'fcmToken';
                    fcmInput.value = '${fcmToken}';
                    loginForm.appendChild(fcmInput);
                    console.log('FCM token injected:', fcmInput.value);
                  } else {
                    // 폼이 아직 없으면 100ms 후 다시 시도
                    setTimeout(injectToken, 100);
                  }
                }
                
                // 페이지 로드 완료를 기다림
                if (document.readyState === 'complete') {
                  injectToken();
                } else {
                  window.addEventListener('load', injectToken);
                }
              })();
            `;
            webViewRef.current?.injectJavaScript(script);
          }
        }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      /> 
      {/* <View style={styles.debugContainer}>
        <Text style={styles.debugTitle}>Debug Info:</Text>
        <Text style={styles.debugText}>{debugInfo}</Text>
        <Text style={styles.debugTitle}>FCM Token:</Text>
        <Text style={styles.debugText}>{fcmToken || 'No token yet'}</Text>
      </View> */}
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
  debugContainer: {
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    maxHeight: 200,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  debugText: {
    fontSize: 12,
    color: '#666',
  },
});
