import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import envData from '../../config/envData.config.js';

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    refreshToken: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.createRefreshToken = function () {
  return jwt.sign({ id: this._id }, envData.REFRESH_TOKEN_SECRET, {
    expiresIn: envData.REFRESH_TOKEN_EXPIRY,
  });
};

userSchema.methods.createAccessToken = function () {
  return jwt.sign({ id: this._id }, envData.ACCESS_TOKEN_SECRET, {
    expiresIn: envData.ACCESS_TOKEN_EXPIRY,
  });
};

userSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

userSchema.methods.toSafeObject = function () {
  const user = this.toObject();
  delete user.password;
  delete user.refreshToken;
  delete user.__v;

  return user;
};

const userModel = mongoose.model('User', userSchema);

export default userModel;
