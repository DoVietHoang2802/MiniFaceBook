import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

/**
 * DTO (Data Transfer Object) dùng để validate dữ liệu từ Client gửi lên
 * khi thực hiện đăng ký tài khoản.
 */
export class CreateUserDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'Tên đầy đủ không được để trống' })
  fullName: string;
}
