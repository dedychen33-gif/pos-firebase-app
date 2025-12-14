const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
require('dotenv').config({ path: '.env.local' });

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL
  });
}

const auth = admin.auth();
const db = admin.database();

async function addUserRoles() {
  try {
    console.log('Adding user roles to database...\n');

    // Get all users
    const listUsersResult = await auth.listUsers();
    
    for (const user of listUsersResult.users) {
      const email = user.email;
      
      if (email === 'admin@pos.com') {
        await db.ref(`users/${user.uid}`).set({
          email: email,
          name: 'Admin POS',
          role: 'admin',
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
        console.log('✅ Admin role added for:', email);
      } else if (email === 'kasir@pos.com') {
        await db.ref(`users/${user.uid}`).set({
          email: email,
          name: 'Kasir POS',
          role: 'kasir',
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
        console.log('✅ Kasir role added for:', email);
      }
    }

    console.log('\n✅ User roles setup completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding user roles:', error);
    process.exit(1);
  }
}

addUserRoles();
