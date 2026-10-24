OT-SYSTEM - Bản bổ sung dự tính lương, giới hạn OT và điểm danh

Các file: index.html, style.css, app.js.

Cài đặt: Sao lưu 3 file hiện tại trong repository, sau đó tải 3 file trong thư mục này lên đúng thư mục gốc repository và commit.

Chức năng bổ sung:
- Quản lý nhân viên: có thêm trường Chức vụ; nhân viên cũ chưa có chức vụ được mặc định là Công nhân khi hiển thị.
- Giới hạn tăng ca: cài đặt theo tháng và chức vụ; hiển thị tổng giờ OT trong tháng, số giờ còn lại, cảnh báo sắp chạm hoặc đã chạm/vượt giới hạn. Mặc định minh họa: Công nhân 40h/cảnh báo 10h; Tổ trưởng 50h/10h; Trưởng ca 60h/20h; Quản lý 60h/20h; Khác 40h/10h. Admin có thể thay đổi. Hãy chỉnh các mức theo quy định công ty trước khi dùng.
- Điểm danh: nhân viên nhập số giờ hoặc A/V/B, dữ liệu chờ duyệt; Admin có thể xem, sửa nhanh theo ngày và duyệt từng dòng. A = nghỉ phép năm, V = nghỉ không phép (trừ lương và chuyên cần theo quy tắc đã thống nhất), B = vắng đặc biệt (không trừ lương).
- Chức năng dự tính lương hiện có vẫn được giữ lại. Điểm danh chưa tự động thay thế các trường giờ vắng mặt/phép năm trong phần dự tính lương; cần đối chiếu trước khi dùng làm số liệu lương chính thức.

Firestore collections bổ sung:
- otLimitSettings/{YYYY-MM}: cài đặt giới hạn giờ OT theo chức vụ cho tháng.
- attendance/{employeeCode_YYYY-MM-DD}: dữ liệu điểm danh và trạng thái pending/approved.
- Các collection salaryProfiles, salaryEstimates, payrollSettings của bản trước vẫn dùng như cũ.

Lưu ý triển khai:
- Kiểm tra Firestore Security Rules để các collection mới được đọc/ghi đúng quyền. Không mở quyền công khai nếu chưa đánh giá rủi ro.
- Chức năng giới hạn OT là cảnh báo nội bộ, không thay thế việc kiểm tra quy định pháp luật/lao động và chính sách công ty.
- Dữ liệu điểm danh được lưu riêng, không chỉnh sửa dữ liệu tăng ca chính thức.
