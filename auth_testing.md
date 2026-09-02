# Auth Testing Playbook (AS SHIDIQ) — Username/Password Session Auth

## Step 1: MongoDB Verification
```bash
mongosh --quiet --eval "
use('test_database');
db.users.find({}, {username:1, email:1, role:1}).forEach(u => print(u.username, u.email, u.role));
var sa = db.users.findOne({username: 'superadmin'}, {password_hash: 1});
print('hash starts \$2b\$:', sa.password_hash.startsWith('\$2b\$'));
"
```

## Step 2: API Login Flow (cookie jar)
```bash
API=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d '=' -f2)
curl -c /tmp/cookies.txt -X POST "$API/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"identifier":"superadmin","password":"Admin@123","remember_me":true}'
cat /tmp/cookies.txt   # expect session_token cookie
curl -b /tmp/cookies.txt "$API/api/auth/me"
```

## Step 3: Bearer flow (cross-origin / GitHub Pages style)
```bash
TOKEN=$(curl -s -X POST "$API/api/auth/login" -H "Content-Type: application/json" \
  -d '{"identifier":"superadmin","password":"Admin@123"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['session_token'])")
curl -s "$API/api/auth/me" -H "Authorization: Bearer $TOKEN"
```

## Step 4: Negative cases
- wrong password → 401, and login_attempts count increments (5x → 429 lockout 15 min)
- unknown user → 401
- no credentials on protected route → 401
- admin role on /api/admins → 403

## Step 5: Reset password (super_admin)
```bash
curl -X POST "$API/api/admins/<user_id>/reset-password" -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -d '{"password":"NewPass@123"}'
# then login with new password works; old sessions of that user are deleted
```

## Step 6: Browser
Login form at /login: data-testid login-username-input, login-password-input, login-remember-checkbox, login-submit-button. On success redirects to dashboard.

## Success Indicators
- ✅ bcrypt hash starts with $2b$
- ✅ login returns user + session_token, cookie set
- ✅ /api/auth/me works via cookie AND Bearer
- ✅ lockout after 5 failed attempts
