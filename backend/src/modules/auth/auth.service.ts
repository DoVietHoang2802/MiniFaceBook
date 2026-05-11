import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Xử lý đăng ký người dùng mới
   */
  async register(createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    
    // Tạm thời trả về thông báo thành công và ID người dùng
    return {
      message: 'Đăng ký tài khoản thành công',
      userId: user._id,
    };
  }
}
