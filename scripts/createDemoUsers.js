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

async function createDemoUsers() {
  try {
    console.log('Creating demo users...\n');

    // Create Admin User
    try {
      const adminUser = await auth.createUser({
        email: 'admin@pos.com',
        password: 'admin123',
        displayName: 'Admin POS'
      });

      await db.ref(`users/${adminUser.uid}`).set({
        email: 'admin@pos.com',
        name: 'Admin POS',
        role: 'admin',
        createdAt: Date.now(),
        updatedAt: Date.now()
      });

      console.log('✅ Admin user created successfully');
      console.log('   Email: admin@pos.com');
      console.log('   Password: admin123');
      console.log('   Role: admin\n');
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.log('⚠️  Admin user already exists\n');
      } else {
        throw error;
      }
    }

    // Create Kasir User
    try {
      const kasirUser = await auth.createUser({
        email: 'kasir@pos.com',
        password: 'kasir123',
        displayName: 'Kasir POS'
      });

      await db.ref(`users/${kasirUser.uid}`).set({
        email: 'kasir@pos.com',
        name: 'Kasir POS',
        role: 'kasir',
        createdAt: Date.now(),
        updatedAt: Date.now()
      });

      console.log('✅ Kasir user created successfully');
      console.log('   Email: kasir@pos.com');
      console.log('   Password: kasir123');
      console.log('   Role: kasir\n');
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.log('⚠️  Kasir user already exists\n');
      } else {
        throw error;
      }
    }

    console.log('✅ Demo users setup completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating demo users:', error);
    process.exit(1);
  }
}

createDemoUsers();
