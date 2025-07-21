import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Friend from './models/Friend.js';

// Load environment variables
dotenv.config();

// Test database connection and data
const testDatabase = async () => {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Test Users collection
        const users = await User.find({}).select('firstName lastName username _id');
        console.log('👥 Users in database:', users.length);
        users.forEach(user => {
            console.log(`  - ${user.firstName} ${user.lastName} (${user.username}) - ID: ${user._id}`);
        });

        // Test Friends collection with more details
        const friends = await Friend.find({}).populate('user', 'firstName lastName').populate('friend', 'firstName lastName');
        console.log('\n👫 Friends relationships:', friends.length);
        friends.forEach(friend => {
            console.log(`  - User ID: ${friend.user._id} (${friend.user.firstName} ${friend.user.lastName}) → Friend ID: ${friend.friend._id} (${friend.friend.firstName} ${friend.friend.lastName})`);
        });

        // Test with the CORRECT user ID that actually has friends
        const correctUserId = '687ce49d6c0aa835c3253a33'; // User có friends thực sự
        console.log(`\n🔍 Searching for friends of CORRECT User ID: ${correctUserId}`);
        
        const userFriends = await Friend.find({ user: correctUserId }).populate('friend', 'firstName lastName username _id');
        console.log(`✅ Found ${userFriends.length} friends for correct user`);
        userFriends.forEach(f => {
            console.log(`  - Friend: ${f.friend.firstName} ${f.friend.lastName} (${f.friend.username}) - ID: ${f.friend._id}`);
        });

    } catch (error) {
        console.error('❌ Database test error:', error);
    } finally {
        mongoose.connection.close();
    }
};

testDatabase();
