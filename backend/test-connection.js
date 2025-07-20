import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const testConnection = async () => {
    try {
        console.log('🔍 Testing MongoDB connection...');
        console.log('MONGO_URI:', process.env.MONGO_URI);
        
        await mongoose.connect(process.env.MONGO_URI);
        
        console.log('✅ MongoDB connection successful!');
        
        // Test database operations
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('📚 Available collections:', collections.map(c => c.name));
        
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            name: error.name
        });
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
};

testConnection(); 