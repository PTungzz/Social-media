import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const setupDatabase = async () => {
    try {
        // Kết nối MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Tạo admin user
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('123456', salt);

        // Kiểm tra xem admin user đã tồn tại chưa
        const existingAdmin = await User.findOne({ email: 'admin@sociopedia.com' });
        if (!existingAdmin) {
            const adminUser = new User({
                username: 'admin',
                email: 'admin@sociopedia.com',
                password: hashedPassword,
                avatar: ''
            });

            await adminUser.save();
            console.log('👤 Created admin user: admin@sociopedia.com / 123456');
        } else {
            console.log('👤 Admin user already exists: admin@sociopedia.com');
        }

        console.log('✅ Database setup completed!');
        console.log('\n📋 Available account:');
        console.log('- admin@sociopedia.com / 123456');

    } catch (error) {
        console.error('❌ Database setup failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
};

setupDatabase(); 