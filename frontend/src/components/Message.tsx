// import React, { useEffect, useRef } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   Animated,
//   TouchableOpacity,
//   Platform,
// } from 'react-native';
// import { X, Check, AlertCircle } from 'lucide-react-native';

// type MessageType = 'success' | 'error' | 'info';

// interface MessageProps {
//   type: MessageType;
//   title: string;
//   message: string;
//   onDismiss: () => void;
//   duration?: number;
// }

// export default function Message({
//   type,
//   title,
//   message,
//   onDismiss,
//   duration = 4000,
// }: MessageProps) {
//   // slide from top: start a bit negative so it's off-screen
//   const slideAnim = useRef(new Animated.Value(-120)).current;

//   useEffect(() => {
//     // slide in
//     Animated.timing(slideAnim, {
//       toValue: 0,
//       duration: 300,
//       useNativeDriver: true,
//     }).start();

//     const timer = setTimeout(() => {
//       Animated.timing(slideAnim, {
//         toValue: -120,
//         duration: 300,
//         useNativeDriver: true,
//       }).start(() => onDismiss());
//     }, duration);

//     return () => clearTimeout(timer);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   const getIcon = () => {
//     switch (type) {
//       case 'success':
//         return <Check size={20} color="#fff" strokeWidth={2.5} />;
//       case 'error':
//         return <AlertCircle size={20} color="#fff" strokeWidth={2.5} />;
//       default:
//         return <AlertCircle size={20} color="#fff" strokeWidth={2.5} />;
//     }
//   };

//   const getBackgroundColor = () => {
//     switch (type) {
//       case 'success':
//         return '#10b981';
//       case 'error':
//         return '#ef4444';
//       default:
//         return '#3b82f6';
//     }
//   };

//   return (
//     <Animated.View
//       pointerEvents="box-none"
//       style={[
//         styles.container,
//         {
//           backgroundColor: getBackgroundColor(),
//           transform: [{ translateY: slideAnim }],
//         },
//       ]}
//     >
//       <View style={styles.content}>
//         <View style={styles.iconBox}>{getIcon()}</View>
//         <View style={styles.textContainer}>
//           <Text style={styles.title}>{title}</Text>
//           <Text style={styles.message} numberOfLines={3}>
//             {message}
//           </Text>
//         </View>
//         <TouchableOpacity onPress={onDismiss} style={styles.closeButton}>
//           <X size={16} color="#fff" strokeWidth={2.5} />
//         </TouchableOpacity>
//       </View>
//     </Animated.View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     marginHorizontal: 16,
//     borderRadius: 12,
//     overflow: 'hidden',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.2,
//     shadowRadius: 4,
//     elevation: 6,
//     // keep container compact — parent will absolutely position it
//   },
//   content: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 12,
//     gap: 12,
//   },
//   iconBox: {
//     width: 40,
//     height: 40,
//     borderRadius: 8,
//     backgroundColor: 'rgba(255,255,255,0.18)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   textContainer: {
//     flex: 1,
//   },
//   title: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#fff',
//     marginBottom: 2,
//   },
//   message: {
//     fontSize: 12,
//     color: 'rgba(255,255,255,0.95)',
//     lineHeight: 16,
//   },
//   closeButton: {
//     padding: 6,
//   },
// });
