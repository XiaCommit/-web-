const mongoose = require('mongoose');
const AvatarSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  avatar: {
    type: String,
    required: true,
  },
});
const AvatarMoudles = mongoose.model('avatar', AvatarSchema, 'avatars');
module.exports = AvatarMoudles; 