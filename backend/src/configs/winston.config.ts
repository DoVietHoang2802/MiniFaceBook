import { format, transports } from 'winston';

export const winstonConfig = {
  transports: [
    // 1. Ghi log ra màn hình console (dành cho lúc code)
    new transports.Console({
      format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.colorize(), // Thêm màu sắc cho dễ nhìn
        format.printf(
          (info) => `${info.timestamp} [${info.level}] : ${info.message}`,
        ),
      ),
    }),
    
    // 2. Ghi các lỗi (error) vào file để sau này tra cứu
    new transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.json(),
      ),
    }),
    
    // 3. Ghi toàn bộ log vào một file chung
    new transports.File({
      filename: 'logs/combine.log',
      format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.json(),
      ),
    }),
  ],
};
