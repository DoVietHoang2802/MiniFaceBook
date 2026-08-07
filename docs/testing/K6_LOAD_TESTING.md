# K6 Load Testing (Kiểm thử tải Chỉ-Đọc)

## Mục đích

Kịch bản `tests/performance/k6-read-only.js` chỉ thực thi kiểm thử trên các endpoint đọc (read-only). Kịch bản này tuyệt đối không tạo bài viết, bình luận, tin nhắn, cảm xúc, không tải lên tệp tin hoặc tạo người dùng mới.

## Cài đặt K6

Trên Windows PowerShell:

```powershell
winget install --id Grafana.k6 --exact --source winget
k6 version
```

## Safety Production Smoke Test (Kiểm thử an toàn trên Production)

Lệnh dưới đây kiểm tra endpoint health công khai với 5 Virtual Users (VU) trong vòng 1 phút:

```powershell
k6 run -e BASE_URL=https://api.miniface.site/api tests/performance/k6-read-only.js
```

Chạy lệnh này trước khi thực hiện kiểm thử tải cao hơn. Lưu ý: Endpoint `/actuator/health` không truy vấn MongoDB hoặc xác thực người dùng nên đây không phải là bài test kiểm tra luồng nghiệp vụ ứng dụng đầy đủ.

## Authenticated Read Test (Kiểm thử đọc có xác thực)

Sử dụng một tài khoản kiểm thử đã được xác minh (dedicated test account). **Không** lưu email hoặc mật khẩu vào Git, lịch sử terminal, ảnh chụp màn hình hay các đoạn chat.

```powershell
$env:BASE_URL = "https://api.miniface.site/api"
$env:TEST_EMAIL = "verified-test-account@example.com"
$env:TEST_PASSWORD = "set-the-password-locally"
$env:LOAD_VUS = "10"
k6 run tests/performance/k6-read-only.js
Remove-Item Env:TEST_EMAIL, Env:TEST_PASSWORD
```

Khi có thông tin đăng nhập, script k6 sẽ đăng nhập 1 lần và kiểm thử các API `GET /posts/newsfeed` và `GET /posts/search` thông qua HttpOnly cookie nhận được.

## Giới hạn Production (Production Limits)

- Bắt đầu với 5 VUs. Máy chủ EC2 MVP hiện tại có cấu hình 2 vCPU / 1 GB RAM.
- Chỉ tăng lên 10, sau đó là 20 VUs khi tỷ lệ lỗi duy trì dưới 1% (`error rate < 1%`) và latency p95 dưới 2 giây (`p95 < 2s`). Kiểm thử health ban đầu đã bao gồm độ trễ mạng Internet từ máy chạy test đến AWS.
- **Không** chạy 100 VUs trực tiếp vào máy chủ Production này khi chưa có môi trường Staging tương đương và khung thời gian bảo trì (traffic window).
- Lưu kết quả tóm tắt từ terminal kèm theo SHA commit của release và số lượng lỗi trên Sentry trước khi đánh dấu release là hoàn tất xác minh.

## Baseline Production Đã Ghi Nhận (Recorded Production Baseline)

Chạy từ Windows đối với phiên bản backend release `1627b10` vào ngày 07/08/2026. Các lượt chạy này sử dụng đường dẫn kiểm tra health-only, không tạo dữ liệu mới và không đăng nhập tài khoản.

| Cấu hình (Profile) | Số Checks thành công | Lỗi request | Trung bình (Average) | p95 | Tối đa (Maximum) |
| --- | ---: | ---: | ---: | ---: | ---: |
| 5 VUs, 60 giây | 171/171 | 0% | 360.70 ms | 365.85 ms | 425.68 ms |
| 10 VUs, 60 giây | 339/339 | 0% | 356.39 ms | 360.77 ms | 377.84 ms |

Kết quả baseline đáp ứng đầy đủ tiêu chuẩn `p95 < 2 giây` và tỷ lệ lỗi `< 1%`. Kết quả này chứng minh khả năng sẵn sàng của đường dẫn health qua hạ tầng mạng Production, Nginx và Spring Boot. Kết quả này chưa kiểm chứng throughput đọc MongoDB newsfeed/search có xác thực; hãy dùng profile tài khoản test chuyên dụng trước khi tăng lưu lượng truy cập thực tế.

## Redis A/B Benchmark

K6 health baseline không đo được hiệu quả của Redis. Chạy benchmark local có kiểm soát riêng biệt:

```powershell
mvn -DrunRedisBenchmark=true -Dtest=RedisFriendCacheBenchmarkTest test
```

Benchmark seed 1 user có 50 bạn trong MongoDB test, sau đó đo 100 lượt đọc danh sách bạn bè theo cache miss trước khi đo 100 Redis warm hit. Kết quả in ra mean, p50, p95 và phần trăm cải thiện. Số liệu cache miss vẫn gồm thao tác kiểm tra Redis key, nên là so sánh bảo thủ với đường dẫn MongoDB chứ không được mô tả sai là Redis-disabled production.

### Kết quả A/B Đã Ghi Nhận

Chạy local ngày 07/08/2026 với 1 user có 50 friends, 100 lượt mỗi phía. Đây là service-level timing với MongoDB và Redis test thật, không gồm độ trễ HTTP/Internet.

| Đường dẫn | Mean | p50 | p95 | So với MongoDB cache miss |
| --- | ---: | ---: | ---: | ---: |
| MongoDB cache miss | 19.526-21.838 ms | 17.350-20.893 ms | 29.766-34.484 ms | Baseline |
| Redis warm hit | 2.700-2.836 ms | 2.026-2.672 ms | 4.980-5.575 ms | Mean nhanh hơn 86.2-87.0%; p95 nhanh hơn 83.3-83.8% |

Redis warm hit giảm mean latency khoảng `7.2-7.7x` và p95 khoảng `6.0-6.2x` cho list 50 bạn trong benchmark này. Lợi ích sẽ tăng khi MongoDB ở xa application server hoặc danh sách bạn bè lớn hơn; không dùng các số local này để hứa hẹn đúng latency Internet production.
