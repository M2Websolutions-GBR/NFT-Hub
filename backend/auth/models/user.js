import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email'],
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ['buyer', 'creator', 'admin'],
      default: 'buyer',
    },
    isSubscribed: {
      type: Boolean,
      default: false,
    },
    subscriptionExpires: {
      type: Date,
      default: null,
    },
    profileInfo: {
      type: String,
      default: ""
    },
    avatarUrl: { 
      type: String, 
      default: "" 
    }, 
},
  { timestamps: true }
);

export default mongoose.model('User', UserSchema);
