#!/usr/bin/env python3
"""Simple smoke test used by CI and for local verification.

Performs: register -> login -> GET profile -> refresh -> logout -> confirm revoked token.

Exits with non-zero code on failure.
"""
import sys
import time
import uuid
import json
from urllib import request, error

BASE = 'http://127.0.0.1:8000'

def http_post(path, data, token=None):
    url = BASE + path
    body = json.dumps(data).encode('utf-8')
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = 'Bearer ' + token
    req = request.Request(url, data=body, headers=headers)
    try:
        with request.urlopen(req, timeout=15) as r:
            return r.getcode(), json.load(r)
    except error.HTTPError as e:
        try:
            return e.code, json.load(e)
        except Exception:
            return e.code, {'error': str(e)}
    except Exception as e:
        return None, {'error': str(e)}

def http_get(path, token=None):
    url = BASE + path
    headers = {}
    if token:
        headers['Authorization'] = 'Bearer ' + token
    req = request.Request(url, headers=headers)
    try:
        with request.urlopen(req, timeout=15) as r:
            try:
                return r.getcode(), json.load(r)
            except Exception:
                return r.getcode(), r.read().decode()
    except error.HTTPError as e:
        try:
            return e.code, json.load(e)
        except Exception:
            return e.code, {'error': str(e)}
    except Exception as e:
        return None, {'error': str(e)}

def wait_for_backend(timeout=60):
    start = time.time()
    while time.time() - start < timeout:
        code, resp = http_get('/')
        if code and code < 500:
            return True
        time.sleep(1)
    return False

def fail(msg, code=1):
    print('FAIL:', msg)
    sys.exit(code)

def main():
    print('Waiting for backend...')
    if not wait_for_backend(60):
        fail('backend did not respond in time')

    uname = 'ci_' + str(uuid.uuid4())[:8]
    email = uname + '@example.test'
    pw = 'TestPass123!'

    print('Registering', uname)
    code, resp = http_post('/api/auth/register/', {'username': uname, 'email': email, 'password': pw, 'password_confirm': pw, 'role': 'STUDENT'})
    print(' register ->', code, resp)
    if code != 201:
        fail(f'register failed: {code} {resp}')

    print('Logging in')
    code, resp = http_post('/api/auth/login/', {'username': uname, 'password': pw})
    print(' login ->', code, resp)
    if code != 200:
        fail('login failed')
    access = resp.get('access_token')
    refresh = resp.get('refresh_token')
    if not access or not refresh:
        fail('tokens not returned')

    print('GET profile')
    code, resp = http_get('/api/users/profile/', token=access)
    print(' profile ->', code, resp)
    if code != 200:
        fail('profile access failed')

    print('Refresh')
    code, resp = http_post('/api/auth/refresh/', {'refresh_token': refresh})
    print(' refresh ->', code, resp)
    if code != 200:
        fail('refresh failed')

    print('Logout')
    code, resp = http_post('/api/auth/logout/', {}, token=access)
    print(' logout ->', code, resp)
    if code != 200:
        fail('logout failed')

    print('Profile after logout (expected unauthorized)')
    code, resp = http_get('/api/users/profile/', token=access)
    print(' profile_after_logout ->', code, resp)
    # expecting 401 or similar
    if code == 200:
        fail('token was not revoked')

    print('SMOKE TEST OK')
    sys.exit(0)

if __name__ == '__main__':
    main()
