# Emergent Auth Testing Playbook (AS SHIDIQ)

## Step 1: Create Test User & Session
```bash
mongosh --eval "
use('test_database');
var userId = 'test-user-' + Date.now();
var sessionToken = 'test_session_' + Date.now();
db.users.insertOne({
  user_id: userId,
  email: 'akayfikanita@gmail.com',
  name: 'Owner Test',
  picture: 'https://via.placeholder.com/150',
  role: 'super_admin',
  status: 'active',
  created_at: new Date()
});
db.user_sessions.insertOne({
  user_id: userId,
  session_token: sessionToken,
  expires_at: new Date(Date.now() + 7*24*60*60*1000),
  created_at: new Date()
});
print('Session token: ' + sessionToken);
print('User ID: ' + userId);
"
```

## Step 2: Test Backend
```bash
API=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d '=' -f2)
curl -s "$API/api/auth/me" -H "Authorization: Bearer $SESSION_TOKEN"
curl -s "$API/api/dashboard/stats" -H "Authorization: Bearer $SESSION_TOKEN"
```

## Step 3: Browser Testing
```python
await page.context.add_cookies([{
    "name": "session_token",
    "value": SESSION_TOKEN,
    "domain": "shidiq-admin-panel.preview.emergentagent.com",
    "path": "/",
    "httpOnly": True,
    "secure": True,
    "sameSite": "None"
}])
await page.goto("https://shidiq-admin-panel.preview.emergentagent.com/")
```

## Success Indicators
- ✅ /api/auth/me returns user with role
- ✅ Dashboard loads without redirect
- ✅ CRUD Santri/Payment works

## Failure Indicators
- ❌ 401 on /api/auth/me
- ❌ Redirect loop
