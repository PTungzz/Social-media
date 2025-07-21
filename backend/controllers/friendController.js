import Friend from '../models/Friend.js';
import User from '../models/User.js';

// Thêm bạn bè
export const addFriend = async (req, res) => {
    try {
        const { friendId } = req.body;
        const userId = req.user.id;

        console.log(`👥 Adding friend: ${userId} -> ${friendId}`);

        // Kiểm tra không thể add chính mình
        if (userId === friendId) {
            return res.status(400).json({
                success: false,
                message: 'Không thể thêm chính mình làm bạn bè'
            });
        }

        // Kiểm tra friend có tồn tại không
        const friendUser = await User.findById(friendId);
        if (!friendUser) {
            return res.status(404).json({
                success: false,
                message: 'Người dùng không tồn tại'
            });
        }

        // Kiểm tra đã là bạn bè chưa
        const existingFriend = await Friend.findOne({
            user: userId,
            friend: friendId
        });

        if (existingFriend) {
            return res.status(400).json({
                success: false,
                message: 'Đã là bạn bè rồi'
            });
        }

        // Tạo mối quan hệ bạn bè (2 chiều)
        await Friend.create([
            { user: userId, friend: friendId },
            { user: friendId, friend: userId }
        ]);

        console.log(`✅ Friend relationship created: ${userId} <-> ${friendId}`);

        res.json({
            success: true,
            message: 'Đã thêm bạn bè thành công',
            friend: friendUser
        });

    } catch (error) {
        console.error('❌ Lỗi thêm bạn bè:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

// Lấy danh sách bạn bè
export const getFriends = async (req, res) => {
    try {
        const userId = req.user.id;

        console.log(`📋 Getting friends for user: ${userId}`);

        const friends = await Friend.find({ user: userId })
            .populate('friend', 'firstName lastName username email avatar location occupation')
            .sort({ createdAt: -1 });

        const friendsList = friends.map(f => f.friend);

        console.log(`📊 Found ${friendsList.length} friends`);

        res.json({
            success: true,
            friends: friendsList
        });

    } catch (error) {
        console.error('❌ Lỗi lấy danh sách bạn bè:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

// Xóa bạn bè
export const removeFriend = async (req, res) => {
    try {
        const { friendId } = req.params;
        const userId = req.user.id;

        console.log(`💔 Removing friend: ${userId} -> ${friendId}`);

        // Xóa mối quan hệ bạn bè (2 chiều)
        await Friend.deleteMany({
            $or: [
                { user: userId, friend: friendId },
                { user: friendId, friend: userId }
            ]
        });

        console.log(`✅ Friend relationship removed: ${userId} <-> ${friendId}`);

        res.json({
            success: true,
            message: 'Đã xóa bạn bè thành công'
        });

    } catch (error) {
        console.error('❌ Lỗi xóa bạn bè:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

// Kiểm tra có phải bạn bè không
export const checkFriendship = async (req, res) => {
    try {
        const { friendId } = req.params;
        const userId = req.user.id;

        const friendship = await Friend.findOne({
            user: userId,
            friend: friendId
        });

        res.json({
            success: true,
            isFriend: !!friendship
        });

    } catch (error) {
        console.error('❌ Lỗi kiểm tra bạn bè:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};
