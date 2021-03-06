import { parseJwt } from 'jwtiny';

function _validatePermissions(decodedToken, permissions) {  
  let notFoundPermissions = [];
  if (permissions && Array.isArray(permissions)) {
    if (
      !decodedToken.permissions
      || !decodedToken.permissions.length 
      || !Array.isArray(decodedToken.permissions)
    ) {
      // token doesn't have permissions
      notFoundPermissions = permissions;
    } else {
      notFoundPermissions = permissions
        .filter(permission => !decodedToken.permissions.includes(permission));
    }
  }
  return notFoundPermissions;
}

function _execBeforeRouteEnter(storage, routeAuth, next, { route401, route403, to, timezone } = {}) {
  const decodedToken = parseJwt(storage.accessToken);

  if (!decodedToken) {
    const error = new Error('401 ACCESS TOKEN NOT FOUND');
    if (!route401) return next(error);
    return next({ ...route401, params: { error, from: to }});
  }

  const nowUtc = Date.now() + ((timezone * -1) * 60 * 60 * 1000);
  if (decodedToken.exp && ((decodedToken.exp * 1000) <= nowUtc)) {
    const error = new Error('401 ACCESS TOKEN EXPIRED');
    if (!route401) return next(error);
    return next({ ...route401, params: { error, from: to }});
  }
  
  if (typeof routeAuth === 'object' && routeAuth.permissions) {
    const notFoundPermissions = _validatePermissions(decodedToken, routeAuth.permissions);

    if (notFoundPermissions.length) {
      const error = new Error('403 REQUIRED PERMISSIONS');
      error.tokenPermissions = decodedToken.permissions;
      error.requiredPermissions = notFoundPermissions;

      if (!route403) return next(error);
      return next({ ...route403, params: { error, from: to }});
    }
  }
  return next();
}

function _execGuardOrAwait(options) {
  const {
    storage,
    routeAuth,
    next,
    route401,
    route403,
    awaitTimeout,
    timeout,
    to,
    timezone,
  } = options;
  const _storage = typeof storage === 'function' ? storage() : storage;

  // TODO: async storage
  if (!_storage) {
    return next(new Error('COULD NOT GET STORAGE'));
  }

  const decodedToken = parseJwt(storage.accessToken);
  if (decodedToken || (!decodedToken && !awaitTimeout)) {
    return _execBeforeRouteEnter(_storage, routeAuth, next, { route401, route403, to, timezone });
  }

  const timer = setTimeout(() => {
    clearTimeout(timer);
    return _execGuardOrAwait({ ...options, awaitTimeout: false });
  }, timeout * 1000);
}

export default function (Vue, {
  route401,
  route403,
  initTimeout = 3,
  authRouteKey = 'auth',
  storage = window.localStorage,
  timezone = 0,
} = {}) {
  Vue.mixin({
    beforeRouteEnter(to, from, next) {
      if (to && to.meta && to.meta[authRouteKey]) {
        const routeAuth = to.meta[authRouteKey];
        _execGuardOrAwait({
          storage,
          routeAuth,
          next,
          route401,
          route403,
          awaitTimeout: true,
          timeout: initTimeout,
          to,
          timezone,
        });
      } else {
        next();
      }
    },
  });
}
