# vue-router-simple-auth
A simple Vue Plugin to set authorization rules before Vue Router routes.

## Basic Usage

1. Install it via package manager
```
$ npm i -S vue-router-simple-auth
```

2. Add plugin in your `main.js` file
```javascript
import VueRouterAuth from 'vue-router-simple-auth';

Vue.use(VueRouterAuth);
```

3. Set authorization options for your routes
```javascript
{
  name: 'a-route-example',
  meta: {
    auth: true,
  }
}
```

4. Set storage `accessToken` property to a string when user logins.

## Advanced usage

You can customize the plugin by passing an object with any of the following properties below as the second argument in plugin initialization:

```javascript
Vue.use(VueRouterAuth, {
  route401,
  route403,
  initTimeout,
  authRouteKey,
  storage,
});
```

### Customizing 401 e 403 routes

By default, the plugin will always will call `next(Error)` in `beforeRouteEnter()` guard. If you want to customize the routes called in `next()`, set any of properties below:

```javascript
Vue.use(VueRouterAuth, {
  route401: '/error-unauthorized',
  route403: '/error-forbidden,
});
```

Both options above accept a route path (string) or a route object, i.e. `{ name: 'error-route' }`

The option `route403` is not required if you are not using [scopes validation](#todo).

### Customizing storage

By default, the plugin will look for an `accessToken` property in `localStorage`. If you want to customize the default storage, set the property below:


```javascript
Vue.use(VueRouterAuth, {
  storage: window.sessionStorage, // using sessionStorage as an example
});
```

You can also pass a function instead an object to `storage` option. So, the plugin will call it and will expect an object result, i.e.:

```javascript
Vue.use(VueRouterAuth, {
  storage: () => {
    return window.sessionStorage;
  }
});
```

### Customizing timeout

By default, if the storage is undefined, the plugin will await some time (3 seconds) and try again to get the storage. Then, if the storage still is null, it will trigger `next(Error)`. If you want to customize this timeout, set the property below:

```javascript
Vue.use(VueRouterAuth, {
  initTimeout: 8000, // in milliseconds
});
```

### Customizing route's meta property key

By default, the plugin will look for a property named `auth` inside route's meta. If you want to customize this property key name, set the property below:

```javascript
Vue.use(VueRouterAuth, {
  authRouteKey: 'requiresAuth'
});
```

### Full example

```javascript
Vue.use(VueRouterAuth, {
  route401: '/unauthorized',
  route403: { path: '/unauthorized' },
  initTimeout: 5000,
  authRouteKey: 'authorization',
  storage: () => window.sessionStorage,
});
```

