# Auth Testing Playbook (Job Recipe)
See integration_playbook_expert_v2 output. Test users/sessions via:

mongosh --eval "
use('test_database');
var userId = 'test-user-' + Date.now();
var sessionToken = 'test_session_' + Date.now();
db.users.insertOne({user_id: userId, email: 'test.user.' + Date.now() + '@example.com', name: 'Test User', picture: '', auth_provider: 'google', created_at: new Date()});
db.user_sessions.insertOne({user_id: userId, session_token: sessionToken, expires_at: new Date(Date.now()+7*24*60*60*1000), created_at: new Date()});
print(sessionToken);
"

Endpoints:
- GET /api/auth/me (Bearer token or cookie)
- POST /api/auth/register (email/password JWT)
- POST /api/auth/login
- POST /api/auth/session (exchange emergent session_id)
- POST /api/auth/logout
