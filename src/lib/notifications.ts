import { db } from './db';

export interface NotificationPayload {
  userId: string;
  title: string;
  message: string;
  type: 'DELIVERY' | 'SYSTEM' | 'PAYMENT' | 'DISPUTE';
  phoneSMS?: string;
  sendSMS?: boolean;
}

export async function sendPlatformNotification(payload: NotificationPayload) {
  // 1. Create in-app notification in DB
  const notification = await db.notification.create({
    data: {
      userId: payload.userId,
      title: payload.title,
      message: payload.message,
      type: payload.type,
    },
  });

  // 2. Simulated SMS / WhatsApp integration for Burkina Faso (+226)
  if (payload.sendSMS && payload.phoneSMS) {
    console.log(`📱 [SMS/WhatsApp envoyé au ${payload.phoneSMS}] : ${payload.title} - ${payload.message}`);
  }

  return notification;
}
