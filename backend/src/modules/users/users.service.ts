import { Injectable, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  /**
   * Tạo người dùng mới với mật khẩu đã được mã hóa
   */
  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    const { email, password, fullName } = createUserDto;

    // 1. Kiểm tra email đã tồn tại chưa để tránh trùng lặp
    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      throw new ConflictException('Email đã tồn tại trên hệ thống');
    }

    // 2. Mã hóa mật khẩu bằng bcrypt (Salt round = 10)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Lưu vào Database
    const newUser = new this.userModel({
      email,
      password: hashedPassword,
      fullName,
    });

    return newUser.save();
  }

  /**
   * Tìm kiếm người dùng theo Email
   */
  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  /**
   * Tìm kiếm người dùng theo ID
   */
  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }
}
