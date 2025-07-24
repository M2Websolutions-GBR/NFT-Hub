import mongoose from 'mongoose';

const NFTSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    imageUrl: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isSoldOut: {
      type: Boolean,
      default: false,
    },
    editionLimit: {
      type: Number,
      default: 1,
    },
    editionCount: {
      type: Number,
      default: 0,
    }
  },
  { timestamps: true }
);

export default mongoose.model('NFT', NFTSchema);
