# Profile Privacy Policy

## Mục đích

Tài liệu này là nguồn tham chiếu cho quyền riêng tư của hồ sơ người dùng. Quy tắc phải được thực thi ở backend; frontend chỉ hiển thị dữ liệu mà API đã cho phép người xem nhận.

## Phân loại dữ liệu

| Nhóm | Trường | Quy tắc hiển thị |
| --- | --- | --- |
| Tài khoản nội bộ | `email`, `roles`, `createdAt`, `updatedAt` | Chỉ chủ tài khoản và Admin qua API quản trị được xem. Không trả cho visitor. |
| Hồ sơ công khai | `name`, `avatar`, `coverPhoto`, `bio` | Hiển thị cho mọi người dùng đã xác thực. |
| Hồ sơ có quyền theo trường | `city`, `hometown`, `work`, `relationship` | Chủ tài khoản chọn `PUBLIC`, `FRIENDS` hoặc `ONLY_ME` cho từng trường. |

## Giá trị quyền xem

| Giá trị | Ai xem được |
| --- | --- |
| `PUBLIC` | Mọi người dùng đã xác thực. |
| `FRIENDS` | Chủ tài khoản và người có quan hệ friendship `ACCEPTED`. |
| `ONLY_ME` | Chỉ chủ tài khoản. |

Mặc định của tài khoản mới là `FRIENDS` cho `city`, `hometown`, `work` và `relationship`. Với tài khoản MongoDB cũ chưa có các trường này (`null`), backend phải diễn giải là `FRIENDS` để không mở công khai dữ liệu đã tồn tại.

## API Contract

### Đọc hồ sơ visitor

`GET /user/{id}` xác định người xem từ JWT hiện tại.

- Nếu người xem là chủ hồ sơ, trả đầy đủ dữ liệu hồ sơ và các setting visibility để chỉnh sửa.
- Nếu người xem khác chủ hồ sơ, luôn đặt `email`, `roles`, `createdAt`, `updatedAt` là `null`.
- Với `city`, `hometown`, `work`, `relationship`, chỉ trả giá trị nếu policy tương ứng cho phép người xem hiện tại.
- Không trả các setting visibility cho visitor.
- Không cache response theo `userId` đơn thuần, vì cùng một hồ sơ có response khác nhau theo người xem và trạng thái friendship.

### Cập nhật hồ sơ

`PUT /user/profile` nhận thêm các trường sau cùng request cập nhật hồ sơ hiện có:

```json
{
  "cityVisibility": "FRIENDS",
  "hometownVisibility": "FRIENDS",
  "workVisibility": "PUBLIC",
  "relationshipVisibility": "ONLY_ME"
}
```

Frontend Profile chỉ hiển thị các selector này với chủ hồ sơ. Visitor không được suy luận hoặc chỉnh sửa visibility.

### Discovery và friendship

Các response công khai của Friends, User Search và Friend Suggestions không được map email từ `User` sang DTO. Giao diện dùng `name`, `avatar`, `bio` hoặc trạng thái trung lập thay cho email.

## Triển khai hiện tại

- Enum: `backend/src/main/java/com/minifacebook/module/auth/domain/model/ProfileFieldVisibility.java`.
- Persistence: `User` và `UserDocument` lưu bốn visibility field.
- Enforcement: `AuthService.getUserById(id, viewerEmail)` kiểm tra `FriendshipStatus.ACCEPTED` và lọc response.
- UI: `frontend/src/modules/profile/components/ProfilePage.tsx` có selector theo trường; visitor chỉ thấy data được API trả về.

## Kiểm thử bắt buộc khi thay đổi policy

1. Owner xem chính hồ sơ của mình vẫn nhận email, role và các visibility setting.
2. Non-friend không nhận email, role, timestamps hoặc field đặt `FRIENDS`/`ONLY_ME`.
3. Friend đã `ACCEPTED` nhận field đặt `FRIENDS`, nhưng không nhận field `ONLY_ME`.
4. Mọi người nhận field `PUBLIC`.
5. Friends/Search/Suggestions không chứa email trong response.
6. Chạy `npm run build` trong `frontend` và `mvn clean "-Dtest=AuthServiceTest,FriendshipServiceTest" test` trong `backend`.
