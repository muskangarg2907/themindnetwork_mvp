// Direct MongoDB query to check for payment data
// Run with: node check-payments.js

import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'themindnetwork';

async function checkPayments() {
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI environment variable not set');
    console.log('Set it with: $env:MONGODB_URI="your-connection-string"');
    process.exit(1);
  }

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const profiles = db.collection('profiles');
    
    // Get all profiles
    const allProfiles = await profiles.find({}).toArray();
    console.log(`\n📊 Total profiles: ${allProfiles.length}`);
    
    // Check for profiles with payments
    const profilesWithPayments = allProfiles.filter(p => p.payments && p.payments.length > 0);
    console.log(`💰 Profiles with payments: ${profilesWithPayments.length}\n`);
    
    if (profilesWithPayments.length > 0) {
      console.log('=== PROFILES WITH PAYMENTS ===\n');
      profilesWithPayments.forEach((p, index) => {
        console.log(`${index + 1}. ${p.basicInfo?.fullName || 'Unknown'}`);
        console.log(`   ID: ${p._id}`);
        console.log(`   Phone: ${p.basicInfo?.phone}`);
        console.log(`   Role: ${p.role}`);
        console.log(`   Payment count: ${p.payments.length}`);
        p.payments.forEach((payment, pIdx) => {
          console.log(`   Payment ${pIdx + 1}:`);
          console.log(`     - Plan: ${payment.planName}`);
          console.log(`     - Amount: ₹${payment.amount}`);
          console.log(`     - Status: ${payment.status}`);
          console.log(`     - Date: ${payment.paidAt || 'N/A'}`);
        });
        console.log('');
      });
    } else {
      console.log('⚠️  NO PROFILES WITH PAYMENTS FOUND\n');
    }
    
    // Check specific phone number
    const testPhone = '1111111111';
    console.log(`\n🔍 Searching for phone: ${testPhone}`);
    const testProfile = await profiles.findOne({ 'basicInfo.phone': testPhone });
    
    if (testProfile) {
      console.log('✅ Profile found!');
      console.log(`   ID: ${testProfile._id}`);
      console.log(`   Name: ${testProfile.basicInfo?.fullName}`);
      console.log(`   Role: ${testProfile.role}`);
      console.log(`   Status: ${testProfile.status}`);
      console.log(`   Has payments field? ${!!testProfile.payments}`);
      console.log(`   Payment count: ${testProfile.payments?.length || 0}`);
      
      if (testProfile.payments && testProfile.payments.length > 0) {
        console.log('\n   PAYMENTS:');
        console.log(JSON.stringify(testProfile.payments, null, 2));
      } else {
        console.log('   ❌ NO PAYMENTS in this profile');
      }
    } else {
      console.log(`❌ No profile found with phone ${testPhone}`);
    }
    
    // List all profiles with their phone numbers
    console.log('\n\n=== ALL PROFILES ===');
    allProfiles.forEach((p, idx) => {
      const hasPayments = p.payments && p.payments.length > 0;
      const paymentIcon = hasPayments ? '💰' : '  ';
      console.log(`${paymentIcon} ${idx + 1}. ${p.basicInfo?.fullName} | ${p.basicInfo?.phone} | ${p.role} | Payments: ${p.payments?.length || 0}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await client.close();
    console.log('\n✅ Database connection closed');
  }
}

checkPayments();
