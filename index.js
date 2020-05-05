function _execBeforeRouteEnter(storage, routeAuth, next, { route401, route403 } = {}) {
  if (!storage.accessToken) {
    // TODO: validar outros aspectos do access token, como expiração, etc.
    if (!route401) return next(new Error('401 ACCESS TOKEN NOT FOUND'));
    return next(route401);
  }
  if (typeof routeAuth === 'object' && routeAuth.scopes && routeAuth.scopes.length) {
    // TODO: validar scopes do access token
    const hasScopes = false;
    if (!hasScopes) {
      const error = new Error('403 SCOPES NOT MATCH');
      error.requested = routeAuth.scopes;
      // error.found = user.scopes;
      if (!route403) return next(error);
      return next(route403);
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
  } = options;
  const _storage = typeof storage === 'function' ? storage() : storage;

  if (storage) return _execBeforeRouteEnter(_storage, routeAuth, next, { route401, route403 });
  if (!awaitTimeout) return next(new Error('COULD NOT GET STORAGE'));

  const timer = setTimeout(() => {
    clearTimeout(timer);
    _execGuardOrAwait({ ...options, awaitTimeout: false });
  }, timeout);
}

export default function (Vue, {
  route401,
  route403,
  initTimeout = 3,
  authRouteKey = 'auth',
  storage = window.localStorage,
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
        });
      }
    },
  });
}
