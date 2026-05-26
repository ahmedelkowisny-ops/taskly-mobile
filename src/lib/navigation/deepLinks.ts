import type { Href } from 'expo-router';

import type { AuthStatus } from '@/src/lib/auth/AuthProvider';
import {
  canAccessCustomerWorkspace,
  canAccessProviderWorkspace,
} from '@/src/lib/auth/workspaceAccess';
import type { UserSession } from '@/src/lib/api/types';

export type DeepLinkWorkspace = 'customer' | 'provider';
export type DeepLinkEntityType =
  | 'core_task'
  | 'message_thread'
  | 'notification_settings'
  | 'pro_request';

export type NotificationRouteData = {
  category?: unknown;
  createdAt?: unknown;
  entityId?: unknown;
  entityType?: unknown;
  routeHint?: unknown;
  type?: unknown;
  workspace?: unknown;
};

export type DeepLinkTarget = {
  entityId?: string;
  entityType?: DeepLinkEntityType;
  href: Href;
  source: 'notification' | 'url';
  workspace?: DeepLinkWorkspace;
};

const LOGIN_ROUTE = '/login' as Href;
const CUSTOMER_HOME_ROUTE = '/customer/home' as Href;
const PROVIDER_HOME_ROUTE = '/provider/dashboard' as Href;
const TASKLY_SCHEME = 'tasklyapp:';

let pendingDeepLinkTarget: DeepLinkTarget | null = null;

function asString(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asWorkspace(value: unknown): DeepLinkWorkspace | null {
  return value === 'customer' || value === 'provider' ? value : null;
}

function asEntityType(value: unknown): DeepLinkEntityType | null {
  if (
    value === 'core_task' ||
    value === 'message_thread' ||
    value === 'notification_settings' ||
    value === 'pro_request'
  ) {
    return value;
  }

  return null;
}

function cleanEntityId(value: unknown) {
  const raw = asString(value);
  if (!raw || raw.length > 128) return null;
  if (/[/?#\\]/.test(raw)) return null;
  return raw;
}

function encodePathId(id: string) {
  return encodeURIComponent(id);
}

function decodePathId(id: string) {
  try {
    return decodeURIComponent(id);
  } catch {
    return null;
  }
}

function targetFromParts({
  entityId,
  entityType,
  source,
  workspace,
}: {
  entityId?: string | null;
  entityType: DeepLinkEntityType;
  source: DeepLinkTarget['source'];
  workspace: DeepLinkWorkspace | null;
}): DeepLinkTarget | null {
  if (entityType === 'notification_settings') {
    if (workspace === 'provider') {
      return { entityType, href: '/provider/account' as Href, source, workspace };
    }

    return { entityType, href: '/customer/account' as Href, source, workspace: 'customer' };
  }

  if (!workspace || !entityId) return null;
  const encodedId = encodePathId(entityId);

  if (entityType === 'core_task' && workspace === 'customer') {
    return {
      entityId,
      entityType,
      href: `/customer/tasks/${encodedId}` as Href,
      source,
      workspace,
    };
  }

  if (entityType === 'core_task' && workspace === 'provider') {
    return {
      entityId,
      entityType,
      href: `/provider/core-tasks/${encodedId}` as Href,
      source,
      workspace,
    };
  }

  if (entityType === 'pro_request' && workspace === 'customer') {
    return {
      entityId,
      entityType,
      href: `/customer/pro-requests/${encodedId}` as Href,
      source,
      workspace,
    };
  }

  if (entityType === 'pro_request' && workspace === 'provider') {
    return {
      entityId,
      entityType,
      href: `/provider/pro-requests/${encodedId}` as Href,
      source,
      workspace,
    };
  }

  if (entityType === 'message_thread') {
    return {
      entityId,
      entityType,
      href: `/${workspace}/messages/${encodedId}` as Href,
      source,
      workspace,
    };
  }

  return null;
}

function pathWithoutQuery(path: string) {
  return path.split('?')[0]?.split('#')[0] || '';
}

function normalizePath(input: string) {
  const raw = input.trim();
  if (!raw) return null;

  if (raw.startsWith('/')) {
    return pathWithoutQuery(raw);
  }

  try {
    const parsed = new URL(raw);
    if (parsed.protocol === TASKLY_SCHEME) {
      const hostPath = parsed.hostname ? `/${parsed.hostname}${parsed.pathname}` : parsed.pathname;
      return pathWithoutQuery(hostPath);
    }

    const marker = '/--/';
    const markerIndex = parsed.pathname.indexOf(marker);
    if (markerIndex >= 0) {
      return pathWithoutQuery(parsed.pathname.slice(markerIndex + marker.length - 1));
    }

    return pathWithoutQuery(parsed.pathname);
  } catch {
    return pathWithoutQuery(raw.startsWith('/') ? raw : `/${raw}`);
  }
}

export function resolveDeepLinkTargetFromPath(pathInput: string, source: DeepLinkTarget['source']) {
  const path = normalizePath(pathInput);
  if (!path) return null;

  const customerTask = path.match(/^\/customer\/tasks\/([^/]+)$/);
  if (customerTask?.[1]) {
    const entityId = decodePathId(customerTask[1]);
    if (!entityId) return null;
    return targetFromParts({
      entityId,
      entityType: 'core_task',
      source,
      workspace: 'customer',
    });
  }

  const providerTask = path.match(/^\/provider\/core-tasks\/([^/]+)$/);
  if (providerTask?.[1]) {
    const entityId = decodePathId(providerTask[1]);
    if (!entityId) return null;
    return targetFromParts({
      entityId,
      entityType: 'core_task',
      source,
      workspace: 'provider',
    });
  }

  const customerPro = path.match(/^\/customer\/pro-requests\/([^/]+)$/);
  if (customerPro?.[1]) {
    const entityId = decodePathId(customerPro[1]);
    if (!entityId) return null;
    return targetFromParts({
      entityId,
      entityType: 'pro_request',
      source,
      workspace: 'customer',
    });
  }

  const providerPro = path.match(/^\/provider\/pro-requests\/([^/]+)$/);
  if (providerPro?.[1]) {
    const entityId = decodePathId(providerPro[1]);
    if (!entityId) return null;
    return targetFromParts({
      entityId,
      entityType: 'pro_request',
      source,
      workspace: 'provider',
    });
  }

  const customerMessage = path.match(/^\/customer\/messages\/([^/]+)$/);
  if (customerMessage?.[1]) {
    const entityId = decodePathId(customerMessage[1]);
    if (!entityId) return null;
    return targetFromParts({
      entityId,
      entityType: 'message_thread',
      source,
      workspace: 'customer',
    });
  }

  const providerMessage = path.match(/^\/provider\/messages\/([^/]+)$/);
  if (providerMessage?.[1]) {
    const entityId = decodePathId(providerMessage[1]);
    if (!entityId) return null;
    return targetFromParts({
      entityId,
      entityType: 'message_thread',
      source,
      workspace: 'provider',
    });
  }

  if (path === '/customer/account' || path === '/account/notifications') {
    return targetFromParts({
      entityType: 'notification_settings',
      source,
      workspace: 'customer',
    });
  }

  if (path === '/provider/account') {
    return targetFromParts({
      entityType: 'notification_settings',
      source,
      workspace: 'provider',
    });
  }

  return null;
}

export function resolveDeepLinkTargetFromNotificationData(data: NotificationRouteData | null | undefined) {
  if (!data || typeof data !== 'object') return null;

  const workspace = asWorkspace(data.workspace);
  const entityType = asEntityType(data.entityType);
  const entityId = cleanEntityId(data.entityId);

  if (entityType) {
    const target = targetFromParts({ entityId, entityType, source: 'notification', workspace });
    if (target) return target;
  }

  const routeHint = asString(data.routeHint);
  return routeHint ? resolveDeepLinkTargetFromPath(routeHint, 'notification') : null;
}

export function resolveDeepLinkTargetFromUrl(url: string) {
  return resolveDeepLinkTargetFromPath(url, 'url');
}

export function getDeepLinkFallbackRoute(workspace?: DeepLinkWorkspace | null) {
  return workspace === 'provider' ? PROVIDER_HOME_ROUTE : CUSTOMER_HOME_ROUTE;
}

export function getDeepLinkLoginRoute() {
  return LOGIN_ROUTE;
}

export function canOpenDeepLinkTarget({
  session,
  status,
  target,
}: {
  session: UserSession | null;
  status: AuthStatus;
  target: DeepLinkTarget;
}) {
  if (status === 'demo') return true;
  if (status !== 'authenticated' || !session) return false;
  if (target.workspace === 'provider') return canAccessProviderWorkspace(session);
  if (target.workspace === 'customer') return canAccessCustomerWorkspace(session);
  return true;
}

export function requiresLoginForDeepLink(status: AuthStatus) {
  return status === 'unauthenticated' || status === 'error';
}

export function setPendingDeepLinkTarget(target: DeepLinkTarget) {
  pendingDeepLinkTarget = target;
}

export function peekPendingDeepLinkTarget() {
  return pendingDeepLinkTarget;
}

export function consumePendingDeepLinkTarget() {
  const target = pendingDeepLinkTarget;
  pendingDeepLinkTarget = null;
  return target;
}

export function clearPendingDeepLinkTarget() {
  pendingDeepLinkTarget = null;
}
