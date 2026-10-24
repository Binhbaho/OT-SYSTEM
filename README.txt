OT-SYSTEM - Bản bổ sung Dự tính tiền lương tháng này

Các file:
- index.html: giao diện
- style.css: định dạng giao diện
- app.js: chức năng hiện có và tính lương dự tính

Cập nhật GitHub Pages:
1. Sao lưu 3 file hiện tại trong repository.
2. Giải nén ZIP.
3. Tải đè index.html, style.css, app.js ở đúng thư mục gốc repository.
4. Commit và chờ GitHub Pages cập nhật.
5. Kiểm tra đăng nhập admin, cài đặt ngày công, thêm/sửa tăng ca; sau đó đăng nhập tài khoản nhân viên để nhập hồ sơ lương và dự tính lương.

Firestore collections mới:
- salaryProfiles (doc ID = mã nhân viên)
- salaryEstimates (doc ID = mã nhân viên_YYYY-MM)
- payrollSettings (doc ID = YYYY-MM)

Lưu ý:
- Công thức ca đêm 30% hiện là dự tính tạm thời theo thông tin người dùng cung cấp; cần xác minh quy chế lương công ty trước khi dùng làm số liệu chính thức.
- Hệ số ngày thường 1,5; ngày nghỉ 2; ngày lễ 3 được dùng theo yêu cầu đã trao đổi.
- Thuế TNCN chưa được tính.
- Dữ liệu OT cũ chưa có otType được mặc định là ngày thường. Dữ liệu CSV import mới cũng đang mặc định ngày thường; có thể đổi loại trong form Sửa của admin.
- Cần bảo đảm Firestore rules cho phép tài khoản ứng dụng đọc/ghi các collection mới theo đúng quyền truy cập của dự án.
- Bản dự tính không sửa dữ liệu tăng ca chính thức khi nhân viên điều chỉnh giờ; chỉ lưu phần điều chỉnh trong bản dự tính tháng.
