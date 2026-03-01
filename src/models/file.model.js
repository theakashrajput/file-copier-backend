import mongoose, { Schema } from 'mongoose';

const fileSchema = new Schema(
  {
    fileName: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    fileType: {
      type: String,
      required: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sharedToken: {
      type: String,
      sparse: true,
      unique: true,
    },
    sharedTokenExpiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

fileSchema.index({ owner: 1 });

const fileModel = mongoose.model('File', fileSchema);

export default fileModel;
