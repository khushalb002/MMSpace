// Create application user
db = db.getSiblingDB('mmspace');

db.createUser({
  user: 'mmspace_user',
  pwd: 'mmspace_password',
  roles: [
    {
      role: 'readWrite',
      db: 'mmspace'
    }
  ]
});

// Create initial collections
db.createCollection('users');
db.createCollection('mentors');
db.createCollection('mentees');
db.createCollection('groups');
db.createCollection('messages');
db.createCollection('leaves');
db.createCollection('announcements');
db.createCollection('grievances');
db.createCollection('notifications');
db.createCollection('attendances');

print('Database initialized successfully');
