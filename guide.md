# 📌 Hướng Dẫn Sử Dụng Hệ Thống FPT Lab Booking

## 🚀 Bước 1: Triển khai (Deploy) hợp đồng thông minh
- **Triển khai (deploy) hợp đồng FPT CURRENCY** trước.
- **Sao chép địa chỉ contract FPT CURRENCY** và **dán vào hợp đồng LabBooking**.
- **Deploy hợp đồng LabBooking** với địa chỉ của FPT CURRENCY.

---

## 💰 Bước 2: Mint Token FPT cho User
- **Chuyển sang tài khoản Owner**.
- **Gọi hàm `mint` để cấp FPT Token** cho tài khoản User.
- 📌 **Lưu ý**: FPT Token có **18 decimal**, khi mint cần nhân với `10^18`.

Ví dụ:
- Nếu muốn cấp **100 FPT**, bạn cần mint `100 * 10^18 = 100000000000000000000` FPT.

---
## 💵 Bước 5: Kiểm tra số dư (Balance)
- **Gọi hàm `balanceOf` trên FPT CURRENCY**.
- **Nhập địa chỉ User** để kiểm tra số FPT hiện có.

📌 Nếu số dư hợp lệ, tiếp tục bước tiếp theo.

---

## 🔓 Bước 3: User Approve Contract LabBooking
- **Chuyển sang tài khoản User**.
- **Gọi hàm `approve`** trên FPT CURRENCY.
- **Nhập địa chỉ contract LabBooking** và số lượng token muốn approve.

📌 **Lưu ý:**
- **Approve số tiền lớn hơn hoặc bằng số mint để tránh lỗi giao dịch**.
- Nếu approve ít hơn số cần dùng, sẽ bị giới hạn khi booking.

---

## 🔍 Bước 4: Kiểm tra Allowance
- **Gọi hàm `allowance` trên FPT CURRENCY**.
- **Nhập địa chỉ User (người call contract)** và **địa chỉ contract LabBooking (spender)**.

📌 **Kết quả mong đợi:**
- Nếu hiển thị số tiền **= số mint**, **thiết lập thành công**.
- Nếu hiển thị **0**, nghĩa là chưa approve hoặc approve sai.

---


## 👥 Bước 6: Đăng ký User vào hệ thống
- **Chuyển sang tài khoản Owner hoặc Staff**.
- **Gọi hàm `registerUser` trên LabBooking**.
- **Nhập địa chỉ User để đăng ký vào hệ thống**.

📌 Sau bước này, User mới có thể booking phòng.

---

## 🏦 Bước 7: Nạp tiền vào hệ thống
- **Chuyển sang tài khoản User**.
- **Gọi hàm `deposit` trên LabBooking**.
- **Nhập số tiền muốn gửi (≤ số dư hiện có)**.

📌 Nếu thành công, số dư trong hệ thống sẽ tăng.

---

## 📅 Bước 8: Booking phòng
- **Chuyển sang tài khoản User**.
- **Gọi hàm `bookRoom` trên LabBooking**.
- **Nhập `roomId`, số slot và thời gian booking**.

📌 Nếu thành công, hệ thống sẽ ghi nhận booking.

---

## 🔍 Bước 9: Kiểm tra thông tin Booking
- **Lấy `bookingId` bằng hàm `generateBookingId`**.
- **Sử dụng `bookingId` để kiểm tra Booking bằng hàm `Bookings` hoặc `roomSlotBooked`**.

📌 Kết quả sẽ hiển thị chi tiết thông tin phòng đã đặt.

---

## 🏁 Bước 10: Check-in phòng
- **Lấy `bookingId` giống bước 9**.
- **Gọi hàm `checkIn` trên LabBooking**.
- **Nhập `bookingId` để xác nhận check-in**.

📌 Nếu thành công, User có thể sử dụng phòng.

---

## 👤 Bước 11: Kiểm tra thông tin User
- **Gọi hàm `getUserInfo` trên LabBooking**.
- **Nhập địa chỉ User cần kiểm tra**.
- **Hệ thống sẽ trả về dữ liệu của User**.

📌 Nếu thông tin đúng, tài khoản đã hoạt động bình thường.

---

### 🎯 Tổng Kết
✅ **Hệ thống cần deploy theo đúng thứ tự** (FPT CURRENCY → LabBooking).
✅ **User phải mint token, approve, deposit trước khi booking**.
✅ **Có thể kiểm tra trạng thái booking và thông tin user mọi lúc**.
✅ **Check-in yêu cầu `bookingId` hợp lệ**.

🚀 **Chúc bạn sử dụng hệ thống thuận lợi!** 🚀
