import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import { useRootNavigationState, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuth } from '@/src/lib/auth/useAuth';
import {
  canOpenDeepLinkTarget,
  clearPendingDeepLinkTarget,
  consumePendingDeepLinkTarget,
  getDeepLinkFallbackRoute,
  getDeepLinkLoginRoute,
  peekPendingDeepLinkTarget,
  resolveDeepLinkTargetFromNotificationData,
  resolveDeepLinkTargetFromUrl,
  requiresLoginForDeepLink,
  setPendingDeepLinkTarget,
  type DeepLinkTarget,
  type NotificationRouteData,
} from '@/src/lib/navigation/deepLinks';

function getNotificationIdentifier(response: Notifications.NotificationResponse) {
  return response.notification.request.identifier;
}

export function NotificationDeepLinkHandler() {
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();
  const { session, status } = useAuth();
  const [pendingTarget, setPendingTarget] = useState<DeepLinkTarget | null>(null);
  const handledNotificationIds = useRef(new Set<string>());
  const navigationReady = Boolean(rootNavigationState?.key);

  const queueTarget = useCallback((target: DeepLinkTarget) => {
    setPendingDeepLinkTarget(target);
    setPendingTarget(target);
  }, []);

  const openTarget = useCallback(
    (target: DeepLinkTarget) => {
      if (!navigationReady || status === 'loading') {
        queueTarget(target);
        return;
      }

      if (requiresLoginForDeepLink(status)) {
        queueTarget(target);
        router.push(getDeepLinkLoginRoute());
        return;
      }

      if (!canOpenDeepLinkTarget({ session, status, target })) {
        clearPendingDeepLinkTarget();
        setPendingTarget(null);
        router.push(getDeepLinkFallbackRoute(target.workspace));
        return;
      }

      clearPendingDeepLinkTarget();
      setPendingTarget(null);
      router.push(target.href);
    },
    [navigationReady, queueTarget, router, session, status],
  );

  const handleNotificationResponse = useCallback(
    (response: Notifications.NotificationResponse) => {
      const identifier = getNotificationIdentifier(response);
      if (handledNotificationIds.current.has(identifier)) return;
      handledNotificationIds.current.add(identifier);

      const target = resolveDeepLinkTargetFromNotificationData(
        response.notification.request.content.data as NotificationRouteData,
      );

      if (target) {
        openTarget(target);
        return;
      }

      openTarget({
        href: getDeepLinkFallbackRoute(),
        source: 'notification',
        workspace: 'customer',
      });
    },
    [openTarget],
  );

  const handleUrl = useCallback(
    (url: string) => {
      const target = resolveDeepLinkTargetFromUrl(url);
      if (target) {
        openTarget(target);
      }
    },
    [openTarget],
  );

  useEffect(() => {
    const response = Notifications.getLastNotificationResponse();
    if (response) {
      const target = resolveDeepLinkTargetFromNotificationData(
        response.notification.request.content.data as NotificationRouteData,
      );

      if (target) {
        handleNotificationResponse(response);
      }

      void Notifications.clearLastNotificationResponseAsync();
    }

    const notificationSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      handleNotificationResponse(response);
    });
    const urlSubscription = Linking.addEventListener('url', ({ url }) => {
      handleUrl(url);
    });

    return () => {
      notificationSubscription.remove();
      urlSubscription.remove();
    };
  }, [handleNotificationResponse, handleUrl]);

  useEffect(() => {
    if (!navigationReady || status === 'loading') return;

    const target = pendingTarget ?? peekPendingDeepLinkTarget();
    if (!target) return;

    if (requiresLoginForDeepLink(status)) {
      router.push(getDeepLinkLoginRoute());
      return;
    }

    const consumedTarget = consumePendingDeepLinkTarget() ?? target;
    setPendingTarget(null);

    if (!canOpenDeepLinkTarget({ session, status, target: consumedTarget })) {
      router.push(getDeepLinkFallbackRoute(consumedTarget.workspace));
      return;
    }

    router.push(consumedTarget.href);
  }, [navigationReady, pendingTarget, router, session, status]);

  return null;
}
