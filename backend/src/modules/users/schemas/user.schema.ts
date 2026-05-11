import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * UserDocument là kiểu kết hợp giữa class User và Document của Mongoose
 * Giúp chúng ta có Type Safety khi làm việc với Model
 */
export type UserDocument = User & Document;

@Schema({ 
  timestamps: true, // Tự động thêm field createdAt và updatedAt
  collection: 'users' // Tên collection trong MongoDB
})
export class User {
  @Prop({ 
    required: true, 
    unique: true, 
    index: true, // Đánh Index để tìm kiếm theo email cực nhanh
    lowercase: true, 
    trim: true 
  })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: '' })
  fullName: string;

  @Prop({ 
    default: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg' 
  })
  avatar: string;

  @Prop({ default: '' })
  bio: string;

  @Prop({ 
    type: String, 
    enum: ['USER', 'ADMIN'], 
    default: 'USER' 
  })
  role: string;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop({ default: null })
  refreshToken: string; // Dùng cho cơ chế xoay vòng token (Refresh Token Rotation)
}

export const UserSchema = SchemaFactory.createForClass(User);
