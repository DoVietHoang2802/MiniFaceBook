# Lệnh khởi tạo trực tiếp vào thư mục hiện tại
nest new .
BƯỚC 2: Cài đặt "Vũ khí" (Dependencies)
# 1. Database & Validation
npm install @nestjs/mongoose mongoose class-validator class-transformer

# 2. Security & Auth
npm install @nestjs/jwt passport-jwt @nestjs/passport passport bcrypt @nestjs/config
npm install -D @types/passport-jwt @types/bcrypt

# 3. Media & Logging
npm install cloudinary nest-winston winston

BƯỚC 3: Tạo cấu trúc Modular bằng CLI
1. Tạo Module Auth (Trái tim của bảo mật)