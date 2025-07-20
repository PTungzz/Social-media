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

        // Xóa tất cả users cũ (optional)
        await User.deleteMany({});
        console.log('🗑️ Cleared existing users');

        // Tạo admin user
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('123456', salt);

        const adminUser = new User({
            username: 'admin',
            email: 'admin@sociopedia.com',
            password: hashedPassword,
            avatar: ''
        });

        await adminUser.save();
        console.log('👤 Created admin user: admin@sociopedia.com / 123456');

        // Tạo một số user mẫu
        const sampleUsers = [
            {
                username: 'john_doe',
                email: 'john@example.com',
                password: hashedPassword,
                avatar: ''
            },
            {
                username: 'jane_smith',
                email: 'jane@example.com',
                password: hashedPassword,
                avatar: ''
            },
            {
                username: 'mike_wilson',
                email: 'mike@example.com',
                password: hashedPassword,
                avatar: ''
            }
        ];

        for (const userData of sampleUsers) {
            const user = new User(userData);
            await user.save();
            console.log(`👤 Created user: ${userData.email} / 123456`);
        }

        console.log('✅ Database setup completed!');
        console.log('\n📋 Sample accounts:');
        console.log('- admin@sociopedia.com / 123456');
        console.log('- john@example.com / 123456');
        console.log('- jane@example.com / 123456');
        console.log('- mike@example.com / 123456');

    } catch (error) {
        console.error('❌ Database setup failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
};

setupDatabase(); 