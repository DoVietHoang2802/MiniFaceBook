import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

/**
 * LoginDto dùng để kiểm soát dữ liệu đầu vào khi người dùng đăng nhập.
 * Đảm bảo email đúng định dạng và mật khẩu đủ độ dài trước khi vào Service.
 */
export class LoginDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  password: string;
}
