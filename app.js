// ================== Firebase config ==================
const firebaseConfig = {
  apiKey: "AIzaSyBHuYK7w1Q0is13lG79NhVV-l-MX0ZQfiQ",
  authDomain: "quan-ly-ot-e6fc6.firebaseapp.com",
  projectId: "quan-ly-ot-e6fc6",
  storageBucket: "quan-ly-ot-e6fc6.firebasestorage.app",
  messagingSenderId: "552930745604",
  appId: "1:552930745604:web:85bdf405543d90f5008451",
  measurementId: "G-89YVZMFF8F"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let currentUser = null;
let overtimeListener = null;

// ================== Đăng nhập ==================
async function login(){
  const u = document.getElementById("username").value;
  const p = document.getElementById("password").value;

  const adminSnap = await db
  .collection("admins")
  .where("username","==",u)
  .where("password","==",p)
  .limit(1)
  .get();

if(!adminSnap.empty){

    const admin = adminSnap.docs[0].data();

    currentUser = {
      role: "admin",
      name: admin.name
    };

    document.getElementById("loginPage").style.display = "none";
    document.getElementById("app").style.display = "block";

    document.getElementById("welcome").innerText =
      "Xin chào " + admin.name;

    document.getElementById("empMenu").style.display = "none";

    showPage("home");

    loadEmployees();
    loadOT();

    return;
}
  else{
    const snap = await db.collection("employees").where("code","==",u).where("password","==",p).get();
    if(!snap.empty){
      const emp = snap.docs[0].data();
     currentUser = {role: "emp",id: snap.docs[0].id,code: emp.code,name: emp.name};
      document.getElementById("loginPage").style.display="none";
      document.getElementById("app").style.display="block";
      document.getElementById("welcome").innerText="Xin chào "+emp.name;
      document.getElementById("adminMenu").style.display="none";
      showPage("myovertime");
      renderMyOT();
      initNotifications();
    }else{
      alert("Sai tài khoản hoặc mật khẩu");
    }
  }
}
 // ĐỔI MẬT KHẨU NHÂN VIÊN
// ============================================================

async function changePassword() {

    if (!currentUser || currentUser.role !== "emp") {
        alert("Bạn chưa đăng nhập tài khoản nhân viên.");
        return;
    }

    const oldPassword =
        document.getElementById("oldPassword").value.trim();

    const newPassword =
        document.getElementById("newPassword").value.trim();

    const confirmPassword =
        document.getElementById("confirmPassword").value.trim();


    // Kiểm tra nhập đủ
    if (!oldPassword || !newPassword || !confirmPassword) {
        alert("Vui lòng nhập đầy đủ thông tin.");
        return;
    }


    // Kiểm tra mật khẩu mới
    if (newPassword.length < 4) {
        alert("Mật khẩu mới phải có ít nhất 4 ký tự.");
        return;
    }


    if (newPassword !== confirmPassword) {
        alert("Mật khẩu mới và nhập lại mật khẩu không giống nhau.");
        return;
    }


    if (newPassword === oldPassword) {
        alert("Mật khẩu mới phải khác mật khẩu hiện tại.");
        return;
    }


    try {

        // Lấy đúng document của nhân viên đang đăng nhập
        const docRef = db
            .collection("employees")
            .doc(currentUser.id);

        const docSnap = await docRef.get();


        if (!docSnap.exists) {
            alert("Không tìm thấy tài khoản nhân viên.");
            return;
        }


        const emp = docSnap.data();


        // Kiểm tra mật khẩu hiện tại
        if (String(emp.password).trim() !== oldPassword) {

            alert("❌ Mật khẩu hiện tại không đúng.");
            return;
        }


        // Cập nhật mật khẩu mới
        await docRef.update({
            password: newPassword
        });


        alert(
            "✅ Đổi mật khẩu thành công!\n\n" +
            "Bạn sẽ được đăng xuất và cần đăng nhập lại."
        );


        // Xóa form
        document.getElementById("oldPassword").value = "";
        document.getElementById("newPassword").value = "";
        document.getElementById("confirmPassword").value = "";


        // Đăng xuất
        logout();

    } catch (error) {

        console.error("Lỗi đổi mật khẩu:", error);

        alert(
            "❌ Không thể đổi mật khẩu.\n\n" +
            error.message
        );
    }
}

// ================== Đăng xuất ==================
function logout(){
  location.reload();
}



// ================== QUẢN LÝ NHÂN VIÊN ==================
let editingEmployeeId = null;

async function saveEmployee(){
  if(!currentUser || currentUser.role !== "admin"){
    alert("Bạn không có quyền thực hiện thao tác này.");
    return;
  }

  const emp = {
    code: document.getElementById("eCode").value.trim().toUpperCase(),
    name: document.getElementById("eName").value.trim(),
    dept: document.getElementById("eDept").value.trim(),
    role: document.getElementById("eRole").value || "Công nhân",
    password: document.getElementById("ePass").value.trim()
  };

  if(!emp.code || !emp.name || !emp.dept || !emp.password){
    alert("Vui lòng nhập đầy đủ Mã NV, Họ tên, Bộ phận và Mật khẩu.");
    return;
  }

  try {
    const existing = await db.collection("employees").get();
    const conflict = existing.docs.some(doc =>
      doc.id !== editingEmployeeId &&
      String(doc.data().code || "").trim().toUpperCase() === emp.code
    );
    if(conflict){
      alert("❌ Mã NV " + emp.code + " đã tồn tại. Mỗi nhân viên chỉ được có 1 mã NV.");
      return;
    }

    if(editingEmployeeId){
      await db.collection("employees").doc(editingEmployeeId).update(emp);
      alert("✅ Đã cập nhật nhân viên.");
    }else{
      await db.collection("employees").add(emp);
      alert("✅ Đã lưu nhân viên.");
    }
    clearEmployeeForm();
  } catch(err){
    console.error("Lỗi lưu nhân viên:", err);
    alert("❌ Không thể lưu nhân viên.\n\n" + err.message);
  }
}

function clearEmployeeForm(){
  document.getElementById("eCode").value="";
  document.getElementById("eName").value="";
  document.getElementById("eDept").value="";
  document.getElementById("eRole").value="Công nhân";
  document.getElementById("ePass").value="";
  editingEmployeeId = null;
}

function editEmployee(id){
  db.collection("employees").doc(id).get().then(doc=>{
    if(doc.exists){
      const e = doc.data();
      document.getElementById("eCode").value = e.code || "";
      document.getElementById("eName").value = e.name || "";
      document.getElementById("eDept").value = e.dept || "";
      document.getElementById("eRole").value = e.role || "Công nhân";
      document.getElementById("ePass").value = e.password || "";
      editingEmployeeId = id;
      showPage("employees");
    }
  }).catch(err=>{
    console.error(err);
    alert("❌ Không thể lấy thông tin nhân viên.\n\n" + err.message);
  });
}

async function deleteEmployee(id){
  if(!currentUser || currentUser.role !== "admin"){
    alert("Bạn không có quyền thực hiện thao tác này.");
    return;
  }
  try {
    const docSnap = await db.collection("employees").doc(id).get();
    if(!docSnap.exists){ alert("Không tìm thấy nhân viên."); return; }
    const e = docSnap.data();
    const code = String(e.code || "").trim();
    const name = String(e.name || "").trim();
    const otSnap = await db.collection("overtime").where("emp", "==", code).get();
    const otCount = otSnap.size;

    const choice = prompt(
      "XÓA NHÂN VIÊN\n\n" + code + " - " + name + "\n\n" +
      "Số bản ghi tăng ca: " + otCount + "\n\n" +
      "Nhập 1 = Chỉ xóa nhân viên, giữ lại OT\n" +
      "Nhập 2 = Xóa nhân viên + toàn bộ OT\n" +
      "Bấm Hủy = Không xóa"
    );
    if(choice === null) return;
    if(choice !== "1" && choice !== "2"){ alert("Lựa chọn không hợp lệ."); return; }

    if(choice === "2"){
      const confirmText = prompt(
        "⚠️ CẢNH BÁO\n\n" +
        "Bạn sắp xóa nhân viên " + code + " và " + otCount + " bản ghi tăng ca.\n" +
        "Dữ liệu đã xóa không thể khôi phục từ giao diện.\n\n" +
        "Nhập chính xác: XOA " + code
      );
      if(confirmText !== "XOA " + code){ alert("Đã hủy xóa."); return; }
    }else{
      if(!confirm("Bạn chắc chắn muốn xóa nhân viên " + code + " - " + name + "?\n\nDữ liệu tăng ca sẽ được giữ lại.")) return;
    }

    await db.collection("employees").doc(id).delete();
    if(choice === "2" && otCount > 0) await deleteDocsInBatches(otSnap.docs);
    clearEmployeeForm();
    alert(choice === "2" ? "✅ Đã xóa nhân viên và " + otCount + " bản ghi tăng ca." : "✅ Đã xóa nhân viên. Dữ liệu tăng ca được giữ lại.");
  } catch(err){
    console.error("Lỗi xóa nhân viên:", err);
    alert("❌ Không thể xóa nhân viên.\n\n" + err.message);
  }
}

async function deleteDocsInBatches(docs){
  for(let i=0; i<docs.length; i+=450){
    const batch = db.batch();
    docs.slice(i, i+450).forEach(doc => batch.delete(doc.ref));
    await batch.commit();
  }
}

function csvEscape(value){
  const s = String(value ?? "");
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g,'""') + '"' : s;
}

async function downloadEmployeeList(){
  try{
    const snap = await db.collection("employees").get();
    if(snap.empty){ alert("Danh sách nhân viên đang trống."); return; }
    const rows = [["code","name","dept","password"]];
    snap.forEach(doc=>{
      const e=doc.data();
      rows.push([e.code||"",e.name||"",e.dept||"",e.password||""]);
    });
    const csv = rows.map(row => row.map(csvEscape).join(",")).join("\n");
    downloadCSV("Danh_Sach_Nhan_Vien.csv", csv);
    alert("✅ Đã tải " + snap.size + " nhân viên.\n\n⚠️ File có chứa mật khẩu, chỉ lưu và chia sẻ cho Admin.");
  }catch(err){
    console.error(err);
    alert("❌ Không thể tải danh sách nhân viên.\n\n" + err.message);
  }
}

async function checkDuplicateEmployees(){
  try{
    const snap = await db.collection("employees").get();
    const map = new Map();
    snap.forEach(doc=>{
      const e=doc.data();
      const code=String(e.code||"").trim().toUpperCase();
      if(!code) return;
      if(!map.has(code)) map.set(code,[]);
      map.get(code).push({id:doc.id,name:e.name||""});
    });
    const duplicates=[...map.entries()].filter(([,list])=>list.length>1);
    if(!duplicates.length){ alert("✅ Không phát hiện mã NV trùng.\n\nTổng: " + snap.size + " nhân viên."); return; }
    let msg="⚠️ PHÁT HIỆN " + duplicates.length + " MÃ NV BỊ TRÙNG\n\n";
    duplicates.forEach(([code,list])=>{
      msg += code + "\n";
      list.forEach((x,i)=>msg += "  " + (i+1) + ". " + x.name + "\n");
      msg += "\n";
    });
    alert(msg);
  }catch(err){
    console.error(err);
    alert("❌ Không thể kiểm tra trùng.\n\n" + err.message);
  }
}

async function replaceAllEmployees(){
  if(!currentUser || currentUser.role !== "admin"){ alert("Bạn không có quyền thực hiện thao tác này."); return; }
  const fileInput=document.getElementById("fileEmployees");
  const file=fileInput.files[0];
  if(!file){ alert("Vui lòng chọn file CSV danh sách nhân viên trước."); return; }
  try{
    const text=await file.text();
    const lines=text.replace(/^\uFEFF/,"").split(/\r?\n/).filter(line=>line.trim()!=="");
    if(lines.length<2){ alert("❌ File không có dữ liệu."); return; }
    const header=parseCSVLine(lines[0]).map(x=>x.toLowerCase());
    const requiredHeader=["code","name","dept","password"];
    if(!requiredHeader.every((item,index)=>header[index]===item)){ alert("❌ Sai định dạng file. Header phải là:\ncode,name,dept,password"); return; }
    const newEmployees=[],seen=new Set(),errors=[];
    for(let i=1;i<lines.length;i++){
      const row=parseCSVLine(lines[i]);
      if(row.length<4){ errors.push("Dòng " + (i+1) + ": thiếu dữ liệu"); continue; }
      const code=row[0].trim().toUpperCase(),name=row[1].trim(),dept=row[2].trim(),password=row[3].trim();
      const key=code.toUpperCase();
      if(!code||!name||!dept||!password){ errors.push("Dòng " + (i+1) + ": thiếu thông tin"); continue; }
      if(seen.has(key)){ errors.push("Dòng " + (i+1) + ": mã NV " + code + " bị trùng trong file"); continue; }
      seen.add(key); newEmployees.push({code,name,dept,password,role:"Công nhân"});
    }
    if(errors.length){ alert("❌ Không thể thay thế danh sách.\n\n" + errors.join("\n")); return; }
    const currentSnap=await db.collection("employees").get();
    const confirmText=prompt("⚠️ THAY THẾ TOÀN BỘ DANH SÁCH\n\nHiện tại: " + currentSnap.size + " nhân viên\nFile mới: " + newEmployees.length + " nhân viên\n\nDữ liệu tăng ca KHÔNG bị xóa.\nNhập chính xác: THAY THE NHAN VIEN");
    if(confirmText!=="THAY THE NHAN VIEN"){ alert("Đã hủy."); return; }
    if(currentSnap.size) await deleteDocsInBatches(currentSnap.docs);
    for(let i=0;i<newEmployees.length;i+=450){
      const batch=db.batch();
      newEmployees.slice(i,i+450).forEach(emp=>{ const ref=db.collection("employees").doc(); batch.set(ref,emp); });
      await batch.commit();
    }
    fileInput.value="";
    alert("✅ Đã thay thế toàn bộ danh sách.\n\nĐã import: " + newEmployees.length + " nhân viên.\nDữ liệu tăng ca được giữ nguyên.");
  }catch(err){
    console.error("Lỗi thay thế danh sách:",err);
    alert("❌ Không thể thay thế danh sách.\n\n" + err.message);
  }
}

function setOTCleanupMonths(months){
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth()+1).padStart(2,'0');
  const dd = String(d.getDate()).padStart(2,'0');
  document.getElementById("otCleanupDate").value = `${yyyy}-${mm}-${dd}`;
  previewDeleteOTBeforeDate();
}

async function deleteOTBeforeDate(){
  const date=document.getElementById("otCleanupDate").value;
  if(!date){ alert("Vui lòng chọn ngày."); return; }
  try{
    const snap=await db.collection("overtime").where("date","<",date).get();
    if(snap.empty){ alert("Không có dữ liệu tăng ca trước " + date + "."); return; }
    const confirmText=prompt("⚠️ XÓA TĂNG CA CŨ\n\nSẽ xóa " + snap.size + " bản ghi có ngày trước " + date + ".\n\nNhập chính xác: XOA TANG CA");
    if(confirmText!=="XOA TANG CA"){ alert("Đã hủy."); return; }
    await deleteDocsInBatches(snap.docs);
    alert("✅ Đã xóa " + snap.size + " bản ghi tăng ca trước " + date + ".");
  }catch(err){
    console.error("Lỗi xóa OT cũ:",err);
    alert("❌ Không thể xóa tăng ca cũ.\n\n" + err.message);
  }
}

async function previewDeleteOTBeforeDate(){
  const date=document.getElementById("otCleanupDate").value;
  if(!date){ alert("Vui lòng chọn ngày."); return; }
  try{
    const snap=await db.collection("overtime").where("date","<",date).get();
    const box = document.getElementById("deleteOTPreview");
    if(box){
      box.innerHTML = snap.size > 0
        ? "⚠️ Có <b>" + snap.size + "</b> bản ghi sẽ bị xóa nếu chọn mốc <b>" + date + "</b>."
        : "✅ Không có bản ghi tăng ca nào trước ngày <b>" + date + "</b>.";
    }
  }catch(err){
    alert("❌ Không thể kiểm tra.\n\n" + err.message);
  }
}



function isToday(dateStr) {
  const d = new Date(dateStr); // parse từ chuỗi yyyy-mm-dd
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

// ================== QUẢN LÝ TĂNG CA ==================
// ================== LOAD DỮ LIỆU TĂNG CA ==================
function loadOT() {

  if (overtimeListener) {
    overtimeListener();
  }

  overtimeListener = db.collection("overtime")
    .orderBy("date", "desc")
    .onSnapshot(snapshot => {

    // ==========================================
    // RESET DỮ LIỆU MỖI KHI FIREBASE CẬP NHẬT
    // ==========================================

    let totalHour = 0;

    // Nhân viên tăng ca hôm nay
    const empTodaySet = new Set();

    // Nhân viên theo từng ca
    const shiftEmpSet = {
      1: new Set(),
      2: new Set(),
      3: new Set(),
      4: new Set()
    };

    // Tổng giờ theo từng ca
    const shiftHour = {
      1: 0,
      2: 0,
      3: 0,
      4: 0
    };


    // ==========================================
    // HIỂN THỊ BẢNG QUẢN LÝ TĂNG CA
    // ==========================================

    const tbody = document.getElementById("otTable");

    if (tbody) {
      tbody.innerHTML = "";
    }

    let stt = 1;


    // ==========================================
    // ĐỌC TỪNG DÒNG TĂNG CA
    // ==========================================

    snapshot.forEach(doc => {

      const o = doc.data();

      // ----------------------------------------
      // TÍNH SỐ GIỜ TĂNG CA
      // ----------------------------------------

      let hours = 0;

      if (o.start && o.end) {

        const s = new Date(
          "1970-01-01T" + o.start + ":00"
        );

        let e = new Date(
          "1970-01-01T" + o.end + ":00"
        );

        // Nếu qua ngày hôm sau
        if (e < s) {
          e.setHours(e.getHours() + 24);
        }

        hours = (e - s) / 1000 / 3600;

        // Tổng giờ toàn hệ thống
        totalHour += hours;
      }


      // ========================================
      // CHỈ XỬ LÝ DỮ LIỆU TĂNG CA HÔM NAY
      // ========================================

      if (o.date && isToday(o.date.trim())) {

        // Mã nhân viên
        const empCode = String(o.emp || "").trim();

        // --------------------------------------
        // TỔNG NHÂN VIÊN TĂNG CA HÔM NAY
        // --------------------------------------

        if (empCode) {
          empTodaySet.add(empCode);
        }


        // --------------------------------------
        // XỬ LÝ CA
        // Cho phép:
        // "1"
        // 1
        // "Ca 1"
        // "ca 1"
        // --------------------------------------

        let shift = String(o.shift || "")
          .trim()
          .toLowerCase();

        // Lấy số ca từ chuỗi
        const match = shift.match(/[1-4]/);

        if (match) {

          const shiftNumber = Number(match[0]);

          // Nhân viên duy nhất của ca
          if (empCode) {
            shiftEmpSet[shiftNumber].add(empCode);
          }

          // Tổng giờ của ca
          shiftHour[shiftNumber] += hours;
        }
      }


      // ========================================
      // HIỂN THỊ BẢNG DỮ LIỆU
// ========================================

      if (tbody) {

        const row = document.createElement("tr");

        row.innerHTML = `
          <td>${stt++}</td>
          <td>${o.emp || ""}</td>
          <td>${o.empName || ""}</td>
          <td>${o.shift || ""}</td>
          <td>${o.date || ""}</td>
          <td>${o.start || ""}</td>
          <td>${o.end || ""}</td>
          <td>${o.work || ""}</td>
          <td>${({weekday:"Ngày thường",restday:"Ngày nghỉ",holiday:"Ngày lễ"})[o.otType || "weekday"] || "Ngày thường"}</td>

          <td>
            <button
              class="btn-edit"
              onclick="editOT('${doc.id}')">
              Sửa
            </button>

            <button
              class="btn-delete"
              onclick="deleteOT('${doc.id}')">
              Xóa
            </button>
          </td>
        `;

        tbody.appendChild(row);
      }

    });

    // ==========================================
    // CẬP NHẬT DASHBOARD
    // ==========================================

    // Tổng nhân viên tăng ca hôm nay
    const totalEmpToday = empTodaySet.size;

    const sOtToday = document.getElementById("sOtToday");

    if (sOtToday) {
      sOtToday.innerText = totalEmpToday;
    }


    // ==========================================
    // CA 1
    // ==========================================

    const sOtShift1 = document.getElementById("sOtShift1");
    const sHourShift1 = document.getElementById("sHourShift1");

    if (sOtShift1) {
      sOtShift1.innerText = shiftEmpSet[1].size;
    }

    if (sHourShift1) {
      sHourShift1.innerText =
        Number(shiftHour[1].toFixed(2));
    }


    // ==========================================
    // CA 2
    // ==========================================

    const sOtShift2 = document.getElementById("sOtShift2");
    const sHourShift2 = document.getElementById("sHourShift2");

    if (sOtShift2) {
      sOtShift2.innerText = shiftEmpSet[2].size;
    }

    if (sHourShift2) {
      sHourShift2.innerText =
        Number(shiftHour[2].toFixed(2));
    }


    // ==========================================
    // CA 3
    // ==========================================

    const sOtShift3 = document.getElementById("sOtShift3");
    const sHourShift3 = document.getElementById("sHourShift3");

    if (sOtShift3) {
      sOtShift3.innerText = shiftEmpSet[3].size;
    }

    if (sHourShift3) {
      sHourShift3.innerText =
        Number(shiftHour[3].toFixed(2));
    }


    // ==========================================
    // CA 4
    // ==========================================

    const sOtShift4 = document.getElementById("sOtShift4");
    const sHourShift4 = document.getElementById("sHourShift4");

    if (sOtShift4) {
      sOtShift4.innerText = shiftEmpSet[4].size;
    }

    if (sHourShift4) {
      sHourShift4.innerText =
        Number(shiftHour[4].toFixed(2));
    }


    // ==========================================
    // TỔNG GIỜ TĂNG CA
    // Chỉ cập nhật nếu phần tử tồn tại
// ==========================================

    const rHour = document.getElementById("rHour");

    if (rHour) {
      rHour.innerText =
        Number(totalHour.toFixed(2));
    }

  });
}



// Hàm sửa: lấy dữ liệu từ Firestore và đưa lên form
function editOT(id) {
  db.collection("overtime").doc(id).get().then(doc => {
    if (doc.exists) {
      const o = doc.data();
      document.getElementById("otEmp").value = o.emp;
      document.getElementById("otDate").value = o.date;
      document.getElementById("otStart").value = o.start;
      document.getElementById("otEnd").value = o.end;
      document.getElementById("otShift").value = o.shift;
      document.getElementById("otType").value = o.otType || "weekday";
      document.getElementById("otWork").value = o.work;
      // Bạn có thể lưu id để khi bấm Lưu thì update thay vì thêm mới
      window.currentEditId = id;
    }
  });
}

// Hàm xóa: xóa document khỏi Firestore
async function deleteOT(id) {
  if (!confirm("Bạn có chắc muốn xóa tăng ca này?")) return;
  try {
    const ref = db.collection("overtime").doc(id);
    const snap = await ref.get();
    if (!snap.exists) return;
    const o = snap.data();
    await ref.delete();
    await createOTNotification({
      emp: o.emp,
      empName: o.empName || "",
      type: "delete_ot",
      title: "Lịch tăng ca đã bị xóa",
      message: "Một lịch tăng ca của bạn đã bị xóa",
      ot: o
    });
  } catch (err) {
    console.error("Lỗi xóa OT:", err);
    alert("❌ Không thể xóa tăng ca.\n\n" + err.message);
  }
}
  // hàm tìm kiếm tăng ca
function searchOT() {
  const emp = document.getElementById("searchEmp").value.toLowerCase();
  const shift = document.getElementById("searchShift").value.toLowerCase();
  const date = document.getElementById("searchDate").value;
  const work = document.getElementById("searchWork").value.toLowerCase();

  const table = document.getElementById("otTable");
  const rows = table.rows;
  let stt = 1;

  for (let i = 0; i < rows.length; i++) {
    const maNV = rows[i].cells[1].innerText.toLowerCase();
    const ca = rows[i].cells[3].innerText.toLowerCase();
    const ngay = rows[i].cells[4].innerText.trim();
    const congViec = rows[i].cells[7].innerText.toLowerCase();

    let match = true;
    if (emp && !maNV.includes(emp)) match = false;
    if (shift && !ca.includes(shift)) match = false;
    if (date && ngay !== date) match = false;
    if (work && !congViec.includes(work)) match = false;

    if (match) {
      rows[i].style.display = "";
      rows[i].cells[0].innerText = stt++;
    } else {
      rows[i].style.display = "none";
    }
  }
}
function resetSearch() {

  document.getElementById("searchEmp").value = "";
  document.getElementById("searchShift").value = "";
  document.getElementById("searchDate").value = "";
  document.getElementById("searchWork").value = "";

  const rows = document.querySelectorAll("#otTable tr");

  rows.forEach((row,index)=>{

    row.style.display = "";

    if(row.cells[0]){
      row.cells[0].innerText = index + 1;
    }

  });

}

// ================== THÔNG BÁO TĂNG CA ==================
let notificationUnsubscribe = null;
let notificationData = [];

function initNotifications() {
  const area = document.getElementById("notificationArea");
  if (!area || !currentUser || currentUser.role !== "emp") return;
  area.style.display = "block";

  if (notificationUnsubscribe) notificationUnsubscribe();

  notificationUnsubscribe = db.collection("notifications")
    .where("emp", "==", currentUser.code)
    .onSnapshot(snapshot => {
      notificationData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      notificationData.sort((a,b) => {
        const ta = a.createdAt && a.createdAt.toMillis ? a.createdAt.toMillis() : 0;
        const tb = b.createdAt && b.createdAt.toMillis ? b.createdAt.toMillis() : 0;
        return tb - ta;
      });
      renderNotifications();
    }, err => {
      console.error("Lỗi tải thông báo:", err);
    });
}

function formatNotificationTime(ts) {
  if (!ts) return "Đang cập nhật...";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  if (isNaN(d.getTime())) return "Đang cập nhật...";
  const pad = n => String(n).padStart(2,"0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())} ${d.getFullYear()}/${pad(d.getMonth()+1)}/${pad(d.getDate())}`;
}

function renderNotifications() {
  const badge = document.getElementById("notificationBadge");
  const list = document.getElementById("notificationList");
  if (!badge || !list) return;

  const unread = notificationData.filter(n => !n.read).length;
  badge.style.display = unread ? "block" : "none";
  badge.textContent = unread > 99 ? "99+" : unread;

  if (!notificationData.length) {
    list.innerHTML = '<div style="padding:25px;text-align:center;color:#64748b;">Không có thông báo.</div>';
    return;
  }

  list.innerHTML = notificationData.map(n => {
    const o = n.ot || {};
    const bg = n.read ? "white" : "#eff6ff";
    const icon = n.type === "new_ot" ? "🟢" : n.type === "update_ot" ? "🟡" : "🔴";
    const detail = o.date ? `Ngày tăng ca: <b>${o.date}</b><br>Ca: <b>${o.shift || ""}</b> · ${o.start || ""} → ${o.end || ""}${o.work ? `<br>Công việc: ${escapeNotificationHtml(o.work)}` : ""}` : "";
    return `<div onclick="openNotification('${n.id}')" style="padding:13px 15px;border-bottom:1px solid #e2e8f0;background:${bg};cursor:pointer;line-height:1.5;">
      <div style="font-weight:${n.read ? 600 : 750};">${icon} ${escapeNotificationHtml(n.title || "Thông báo")}</div>
      <div style="font-size:13px;margin-top:3px;">${escapeNotificationHtml(n.message || "")}</div>
      ${detail ? `<div style="font-size:12px;color:#475569;margin-top:5px;">${detail}</div>` : ""}
      <div style="font-size:11px;color:#64748b;margin-top:7px;">🕐 ${formatNotificationTime(n.createdAt)}</div>
    </div>`;
  }).join("");
}

function escapeNotificationHtml(value) {

  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    "\"":"&quot;",
    "'":"&#39;"
  })[c]);

}

function toggleNotifications() {
  const panel = document.getElementById("notificationPanel");
  if (!panel) return;
  panel.style.display = panel.style.display === "block" ? "none" : "block";
}

async function openNotification(id) {
  try {
    const n = notificationData.find(x => x.id === id);
    if (n && !n.read) await db.collection("notifications").doc(id).update({ read: true, readAt: firebase.firestore.FieldValue.serverTimestamp() });
  } catch (err) {
    console.error("Lỗi đánh dấu thông báo:", err);
  }
}

async function markAllNotificationsRead() {
  const unread = notificationData.filter(n => !n.read);
  if (!unread.length) return;
  try {
    const batch = db.batch();
    unread.forEach(n => batch.update(db.collection("notifications").doc(n.id), { read: true, readAt: firebase.firestore.FieldValue.serverTimestamp() }));
    await batch.commit();
  } catch (err) {
    console.error("Lỗi đánh dấu tất cả thông báo:", err);
  }
}

async function createOTNotification({emp, empName, type, title, message, ot}) {
  if (!emp) return;
  await db.collection("notifications").add({
    emp: String(emp).trim(),
    empName: empName || "",
    type,
    title,
    message,
    ot: {
      date: ot?.date || "",
      shift: ot?.shift || "",
      start: ot?.start || "",
      end: ot?.end || "",
      work: ot?.work || ""
    },
    read: false,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
}


// ================== Lịch tăng ca của nhân viên ==================
function renderMyOT() {
  const start = document.getElementById("myStart").value;
  const end = document.getElementById("myEnd").value;
  const keyword = document.getElementById("search").value.toLowerCase();

  const tbody = document.getElementById("myTable");
  tbody.innerHTML = "";

  db.collection("overtime")
    .where("emp", "==", currentUser.code)
    .get()
    .then(snapshot => {
      // Lấy dữ liệu và sắp xếp ngày mới nhất lên trên
      const records = [];

      snapshot.forEach(doc => {
        records.push(doc.data());
      });

      records.sort((a, b) =>
        String(b.date || "").localeCompare(String(a.date || ""))
      );

      records.forEach(o => {
        // Lọc theo ngày
        if (start && end) {
          if (o.date < start || o.date > end) return;
        } else if (start) {
          if (o.date !== start) return;
        }

        // Lọc theo từ khóa
        if (keyword) {
          const check =
            String(o.date || "").toLowerCase().includes(keyword) ||
            String(o.work || "").toLowerCase().includes(keyword);

          if (!check) return;
        }

        // Hiển thị dòng dữ liệu
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${o.date}</td>
          <td>${o.shift}</td>
          <td>${o.start}</td>
          <td>${o.end}</td>
          <td>${o.work}</td>
        `;

        tbody.appendChild(row);
      });

      // Nếu không có dữ liệu thì hiển thị thông báo
      if (!tbody.hasChildNodes()) {
        const row = document.createElement("tr");
        row.innerHTML = `<td colspan="5">Không có dữ liệu trong khoảng ngày này</td>`;
        tbody.appendChild(row);
      }
    })
    .catch(error => {
      console.error("Lỗi tải lịch tăng ca:", error);
      tbody.innerHTML =
        `<tr><td colspan="5">Không thể tải dữ liệu tăng ca</td></tr>`;
    });
}

function resetMyOT() {

  document.getElementById("myStart").value = "";
  document.getElementById("myEnd").value = "";
  document.getElementById("search").value = "";

  renderMyOT();

}


// ================== Tính tổng giờ tăng ca theo khoảng ngày cho nhân viên ==================
// Sinh cột 1..31 + Total
  window.addEventListener("DOMContentLoaded", () => {
    const headerRow = document.querySelector("#reportDetail thead tr");
    if (!headerRow) return;
    headerRow.innerHTML = "<th>Mã NV</th><th>Tên NV</th>";
    for (let d=1; d<=31; d++) {
      headerRow.innerHTML += `<th>${d}</th>`;
    }
    headerRow.innerHTML += "<th>Total</th>";
  });

  function normalizeDate(str) {
    if (str.includes("/")) {
      const [d,m,y] = str.split("/");
      return `${y}-${m.padStart(2,"0")}-${d.padStart(2,"0")}`;
    }
    return str;
  }

 function calcTotal() {

  let start = document.getElementById("totalStart").value;
  let end = document.getElementById("totalEnd").value;

  /* Nếu chưa chọn ngày thì lấy tháng hiện tại */
  if (!start && !end) {

      const now = new Date();

      const y = now.getFullYear();
      const m = now.getMonth();

      start = new Date(y, m, 1)
          .toISOString()
          .split("T")[0];

      end = new Date(y, m + 1, 0)
          .toISOString()
          .split("T")[0];
  }

  let totalHour = 0;

  const theadRow =
      document.querySelector("#reportDetailEmp thead tr");

  const tbody =
      document.querySelector("#reportDetailEmp tbody");
  // Sinh cột
  theadRow.innerHTML = "<th>Mã NV</th><th>Tên NV</th>";

const now = new Date();
const currentDay = now.getDate();
const currentMonth = now.getMonth();
const currentYear = now.getFullYear();

for (let d = 1; d <= 31; d++) {

    let className = "";

    const checkDate =
      new Date(currentYear, currentMonth, d);

    // Chủ nhật
    if (checkDate.getDay() === 0) {
        className = "sunday-column";
    }

    // Ngày hiện tại ưu tiên hơn
    if (d === currentDay) {
        className = "today-column";
    }

    theadRow.innerHTML +=
      `<th class="${className}">${d}</th>`;
}

theadRow.innerHTML += "<th>Total</th>";

  tbody.innerHTML = "";

  db.collection("overtime").get().then(snapshot => {
    const dataMap = {};
    snapshot.forEach(doc => {
      const o = doc.data();
      const date = o.date;

      if (!currentUser) return;
      if (o.emp.trim().toLowerCase() !== currentUser.code.trim().toLowerCase()) return;

      if (start && end) {
        if (date < start || date > end) return;
      } else if (start) {
        if (date !== start) return;
      }

      let hours = 0;
      if (o.start && o.end) {
        const s = new Date("1970-01-01T"+o.start+":00");
        let e = new Date("1970-01-01T"+o.end+":00");
        if (e < s) e.setHours(e.getHours()+24);
        hours = (e-s)/1000/3600;
        totalHour += hours;
      }

      const day = parseInt(date.split("-")[2]);
      if (!dataMap[o.emp]) {
        dataMap[o.emp] = { name:o.empName||"", days:{} };
      }
      dataMap[o.emp].days[day] = (dataMap[o.emp].days[day]||0)+hours;
    });

    for (const emp in dataMap) {
      const row = document.createElement("tr");
      let total=0;
      let cells="";
      for (let d=1; d<=31; d++) {
        const h = dataMap[emp].days[d]||"";
        if (h) total+=h;
        cells += `<td>${h}</td>`;
      }
      row.innerHTML = `<td>${emp}</td><td>${dataMap[emp].name}</td>${cells}<td>${total}</td>`;
      tbody.appendChild(row);
    }

    document.getElementById("myHour").innerText = totalHour;
  });
}

  function resetTotal() {

    const now = new Date();

    const firstDay =
      new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      ).toISOString().split("T")[0];

    const lastDay =
      new Date(
        now.getFullYear(),
        now.getMonth()+1,
        0
      ).toISOString().split("T")[0];

    document.getElementById("totalStart").value =
      firstDay;

    document.getElementById("totalEnd").value =
      lastDay;
    document.getElementById("myHour").innerText="0";
    document.querySelector("#reportDetailEmp tbody").innerHTML="";
	    calcTotal();
}
  
// ================== Import tăng ca từ file CSV ==================

// ============================================================
// IMPORT / EXPORT FILE CSV
// ============================================================


// ============================================================
// TẠO FILE CSV VÀ DOWNLOAD
// ============================================================

function downloadCSV(filename, content) {

  // BOM UTF-8 để Excel đọc đúng tiếng Việt
  const BOM = "\uFEFF";

  const blob = new Blob(
    [BOM + content],
    {
      type: "text/csv;charset=utf-8;"
    }
  );

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");

  a.href = url;
  a.download = filename;

  document.body.appendChild(a);

  a.click();

  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}


// ============================================================
// TẢI MẪU DANH SÁCH NHÂN VIÊN
// ============================================================

function downloadEmployeeTemplate() {

  const csv =
`code,name,dept,password
P44148,Nguyễn Thị Minh Hà,Gia công,1234
U51083,Đỗ Thị Thanh Sang,Shiage,1234
NV001,Nguyễn Văn A,Sản xuất,1234`;

  downloadCSV(
    "Mau_Danh_Sach_Nhan_Vien.csv",
    csv
  );
}


// ============================================================
// TẢI MẪU ĐĂNG KÝ TĂNG CA
// ============================================================

function downloadOTTemplate() {

  const csv =
`emp,empName,shift,date,start,end,work
P44148,Nguyễn Thị Minh Hà,1,2026-08-16,18:00,22:00,Chạy máy
U51083,Đỗ Thị Thanh Sang,2,2026-08-16,18:00,22:00,Kiểm tra sản phẩm
NV001,Nguyễn Văn A,3,2026-08-16,18:00,22:00,Công việc sản xuất`;

  downloadCSV(
    "Mau_Dang_Ky_Tang_Ca.csv",
    csv
  );
}


// ============================================================
// ĐỌC CSV
// Hỗ trợ dấu phẩy trong nội dung nếu được đặt trong ""
// ============================================================

function parseCSVLine(line) {

  const result = [];

  let current = "";

  let insideQuotes = false;


  for (let i = 0; i < line.length; i++) {

    const char = line[i];

    // Gặp dấu "
    if (char === '"') {

      // Nếu đang trong chuỗi và gặp ""
      if (
        insideQuotes &&
        line[i + 1] === '"'
      ) {

        current += '"';

        i++;

      } else {

        insideQuotes = !insideQuotes;

      }

    }

    // Gặp dấu phẩy bên ngoài ""
    else if (
      char === "," &&
      !insideQuotes
    ) {

      result.push(
        current.trim()
      );

      current = "";

    }

    else {

      current += char;

    }

  }

  result.push(
    current.trim()
  );

  return result;
}


// ============================================================
// IMPORT DANH SÁCH NHÂN VIÊN
// ============================================================

document
  .getElementById("fileEmployees")
  .addEventListener("change", async function(event) {
    const file=event.target.files[0];
    if(!file) return;
    try{
      const lines=(await file.text()).replace(/^\uFEFF/,"").split(/\r?\n/).filter(line=>line.trim()!=="");
      if(lines.length<2){ alert("❌ File không có dữ liệu."); return; }
      const header=parseCSVLine(lines[0]).map(x=>x.toLowerCase());
      const requiredHeader=["code","name","dept","password"];
      if(!requiredHeader.every((item,index)=>header[index]===item)){ alert("❌ Sai định dạng file nhân viên.\n\nHeader phải là:\ncode,name,dept,password"); return; }
      let success=0,duplicate=0,error=0; const errorList=[]; const seenInFile=new Set();
      for(let i=1;i<lines.length;i++){
        const row=parseCSVLine(lines[i]);
        if(row.length<4){ error++; errorList.push("Dòng " + (i+1) + ": thiếu dữ liệu"); continue; }
        const code=row[0].trim().toUpperCase(),name=row[1].trim(),dept=row[2].trim(),password=row[3].trim();
        const key=code.toUpperCase();
        if(!code||!name||!dept||!password){ error++; errorList.push("Dòng " + (i+1) + ": thiếu thông tin"); continue; }
        if(seenInFile.has(key)){ duplicate++; errorList.push("Dòng " + (i+1) + ": mã NV " + code + " bị trùng trong file"); continue; }
        seenInFile.add(key);
        const allEmployees=await db.collection("employees").get();
        const existing=allEmployees.docs.some(doc => String(doc.data().code || "").trim().toUpperCase() === code);
        if(existing){ duplicate++; errorList.push("Dòng " + (i+1) + ": mã NV " + code + " đã tồn tại trên hệ thống"); continue; }
        await db.collection("employees").add({code,name,dept,password,role:"Công nhân"}); success++;
      }
      let message="📥 KẾT QUẢ IMPORT NHÂN VIÊN\n\n✅ Thành công: " + success + "\n⚠️ Trùng mã NV: " + duplicate + "\n❌ Lỗi: " + error;
      if(errorList.length) message += "\n\nChi tiết:\n" + errorList.join("\n");
      alert(message);
    }catch(err){ console.error("Lỗi import nhân viên:",err); alert("❌ Không thể import file nhân viên.\n\n" + err.message); }
    event.target.value="";
  });

// ============================================================
// IMPORT ĐĂNG KÝ TĂNG CA
// ============================================================

document
  .getElementById("fileOT")
  .addEventListener("change", async function(event) {

    const file = event.target.files[0];

    if (!file) return;


    try {

      const text = await file.text();

      const cleanText =
        text.replace(/^\uFEFF/, "");


      const lines =
        cleanText
          .split(/\r?\n/)
          .filter(line => line.trim() !== "");


      if (lines.length < 2) {

        alert(
          "❌ File không có dữ liệu."
        );

        return;
      }


      // ==========================================
      // KIỂM TRA HEADER
      // ==========================================

      const header =
        parseCSVLine(lines[0])
          .map(x => x.toLowerCase());


      const requiredHeader = [
        "emp",
        "empname",
        "shift",
        "date",
        "start",
        "end",
        "work"
      ];


      const headerOK =
        requiredHeader.every(
          (item, index) =>
            header[index] === item
        );


      if (!headerOK) {

        alert(
          "❌ Sai định dạng file tăng ca.\n\n" +
          "Header phải là:\n" +
          "emp,empName,shift,date,start,end,work\n\n" +
          "Hãy bấm 'Tải mẫu tăng ca' để lấy file đúng định dạng."
        );

        return;
      }


      // ==========================================
      // THỐNG KÊ
      // ==========================================

      let success = 0;

      let duplicate = 0;

      let error = 0;

      const errorList = [];


      // ==========================================
      // ĐỌC TỪNG DÒNG
      // ==========================================

      for (
        let i = 1;
        i < lines.length;
        i++
      ) {

        const row =
          parseCSVLine(lines[i]);


        if (row.length < 7) {

          error++;

          errorList.push(
            `Dòng ${i + 1}: thiếu dữ liệu`
          );

          continue;
        }


        const emp =
          row[0].trim();

        const empName =
          row[1].trim();

        const shift =
          row[2].trim();

        const date =
          row[3].trim();

        const start =
          row[4].trim();

        const end =
          row[5].trim();

        const work =
          row.slice(6)
            .join(",")
            .trim();


        // ========================================
        // KIỂM TRA DỮ LIỆU
        // ========================================

        if (
          !emp ||
          !date ||
          !start ||
          !end
        ) {

          error++;

          errorList.push(
            `Dòng ${i + 1}: thiếu mã NV/ngày/giờ`
          );

          continue;
        }


        // ========================================
        // KIỂM TRA NHÂN VIÊN CÓ TỒN TẠI
        // ========================================

        const empSnap =
          await db
            .collection("employees")
            .where("code", "==", emp)
            .limit(1)
            .get();


        if (empSnap.empty) {

          error++;

          errorList.push(
            `Dòng ${i + 1}: không tìm thấy mã NV ${emp}`
          );

          continue;
        }


        // ========================================
        // LẤY TÊN NV TỪ DATABASE
        // Không phụ thuộc tên trong file
        // ========================================

        const employeeData =
          empSnap.docs[0].data();

        const realEmpName =
          employeeData.name || empName;


        // ========================================
        // KIỂM TRA CA
        // ========================================

        const shiftMatch =
          String(shift).match(/[1-4]/);


        if (!shiftMatch) {

          error++;

          errorList.push(
            `Dòng ${i + 1}: ca phải là 1, 2, 3 hoặc 4`
          );

          continue;
        }


        const realShift =
          shiftMatch[0];


        // ========================================
        // KIỂM TRA NGÀY
        // YYYY-MM-DD
        // ========================================

        if (
          !/^\d{4}-\d{2}-\d{2}$/.test(date)
        ) {

          error++;

          errorList.push(
            `Dòng ${i + 1}: ngày phải có dạng YYYY-MM-DD`
          );

          continue;
        }


        // ========================================
        // KIỂM TRA GIỜ
        // HH:MM
        // ========================================

        if (
          !/^\d{2}:\d{2}$/.test(start) ||
          !/^\d{2}:\d{2}$/.test(end)
        ) {

          error++;

          errorList.push(
            `Dòng ${i + 1}: giờ phải có dạng HH:MM`
          );

          continue;
        }


        // ========================================
        // KIỂM TRA TRÙNG
        //
        // Cùng:
        // Mã NV
        // Ngày
        // Ca
        // Bắt đầu
        // Kết thúc
        // ========================================

        const duplicateSnap =
          await db
            .collection("overtime")
            .where("emp", "==", emp)
            .where("date", "==", date)
            .where("shift", "==", realShift)
            .where("start", "==", start)
            .where("end", "==", end)
            .limit(1)
            .get();


        if (!duplicateSnap.empty) {

          duplicate++;

          continue;
        }


        // ========================================
        // LƯU FIREBASE
        // ========================================

        const importedOT = {
          emp: emp,
          empName: realEmpName,
          shift: realShift,
          date: date,
          start: start,
          end: end,
          otType: "weekday",
          work: work
        };

        await db.collection("overtime").add(importedOT);

        await createOTNotification({
          emp: emp,
          empName: realEmpName,
          type: "new_ot",
          title: "Tăng ca mới",
          message: "Admin vừa cập nhật lịch tăng ca cho bạn",
          ot: importedOT
        });

        success++;

      }


      // ==========================================
      // THÔNG BÁO KẾT QUẢ
      // ==========================================

      let message =
        "📥 KẾT QUẢ IMPORT TĂNG CA\n\n" +

        "✅ Thành công: " +
        success +
        "\n" +

        "⚠️ Trùng: " +
        duplicate +
        "\n" +

        "❌ Lỗi: " +
        error;


      if (errorList.length > 0) {

        message +=
          "\n\nChi tiết lỗi:\n" +
          errorList.join("\n");

      }


      alert(message);


    } catch (err) {

      console.error(
        "Lỗi import tăng ca:",
        err
      );

      alert(
        "❌ Không thể import file tăng ca.\n\n" +
        err.message
      );

    }


    // Cho phép chọn lại cùng một file
    event.target.value = "";

  });


// ============================================================
// CHỐNG BẤM LƯU 2 LẦN
// ============================================================

let isSavingOT = false;


// ============================================================
// LƯU TĂNG CA THỦ CÔNG
// ============================================================

async function saveOT() {

  // Chặn double click
  if (isSavingOT) {
    return;
  }


  const empCode =
    document.getElementById("otEmp").value;


  if (!empCode) {

    alert(
      "Vui lòng chọn nhân viên"
    );

    return;
  }


  const date =
    document.getElementById("otDate").value;

  const start =
    document.getElementById("otStart").value;

  const end =
    document.getElementById("otEnd").value;

  const shift =
    document.getElementById("otShift").value;

  const otType =
    document.getElementById("otType").value || "weekday";

  const work =
    document.getElementById("otWork").value.trim();


  if (!date) {

    alert(
      "Vui lòng chọn ngày tăng ca"
    );

    return;
  }


  if (!start || !end) {

    alert(
      "Vui lòng nhập thời gian tăng ca"
    );

    return;
  }


  const empName =
    document
      .getElementById("otEmp")
      .selectedOptions[0]
      ?.dataset.name || "";


  const btn =
    document.querySelector(
      '#overtime button[onclick="saveOT()"]'
    );


  // Khóa nút ngay lập tức
  isSavingOT = true;


  if (btn) {

    btn.disabled = true;

    btn.innerText =
      "Đang lưu...";

  }


  try {

    // ========================================
    // KIỂM TRA TRÙNG
    // ========================================

    const duplicateSnap =
      await db
        .collection("overtime")
        .where("emp", "==", empCode)
        .where("date", "==", date)
        .where("shift", "==", shift)
        .where("start", "==", start)
        .where("end", "==", end)
        .limit(10)
        .get();

    const realDuplicate = duplicateSnap.docs.some(doc => doc.id !== window.currentEditId);

    if (realDuplicate) {

      alert(
        "⚠️ Đăng ký tăng ca này đã tồn tại!"
      );

      return;
    }


    // ========================================
    // LƯU / CẬP NHẬT
    // ========================================

    const otData = {
      emp: empCode,
      empName: empName,
      date: date,
      start: start,
      end: end,
      shift: shift,
      otType: otType,
      work: work
    };

    if(window.currentEditId){
      const editId = window.currentEditId;
      await db.collection("overtime").doc(editId).update(otData);
      await createOTNotification({
        emp: empCode,
        empName: empName,
        type: "update_ot",
        title: "Lịch tăng ca đã thay đổi",
        message: "Admin vừa cập nhật lại lịch tăng ca cho bạn",
        ot: otData
      });
      window.currentEditId = null;
      alert("✅ Đã cập nhật lịch tăng ca");
    }else{
      await db.collection("overtime").add(otData);
      await createOTNotification({
        emp: empCode,
        empName: empName,
        type: "new_ot",
        title: "Tăng ca mới",
        message: "Admin vừa cập nhật lịch tăng ca cho bạn",
        ot: otData
      });
      alert("✅ Đã lưu lịch tăng ca");
    }


    // ========================================
    // RESET FORM
    // ========================================

    document.getElementById("otEmp").value = "";

    document.getElementById("otDate").value = "";

    document.getElementById("otStart").value = "";

    document.getElementById("otEnd").value = "";

    document.getElementById("otShift").value = "1";
    document.getElementById("otType").value = "weekday";

    document.getElementById("otWork").value = "";
    window.currentEditId = null;

  } catch (err) {

    console.error(
      "Lỗi khi lưu:",
      err
    );

    alert(
      "❌ Không thể lưu.\n\n" +
      err.message
    );

  } finally {

    // Mở khóa
    isSavingOT = false;


    if (btn) {

      btn.disabled = false;

      btn.innerText = "Lưu";

    }

  }

}

  function loadEmployees(){
  db.collection("employees")
    .orderBy("code", "asc")
    .onSnapshot(snapshot=>{
      const tbody = document.getElementById("employeeTable");

      if(tbody){
        tbody.innerHTML="";
        let stt=1;

        snapshot.forEach(doc=>{
          const e=doc.data();

          tbody.innerHTML += `
<tr>
  <td>${stt++}</td>
  <td>${e.code}</td>
  <td>${e.name}</td>
  <td>${e.dept || ""}</td>
  <td>${e.role || "Công nhân"}</td>
  <td>
    <button
      class="btn-edit"
      onclick="editEmployee('${doc.id}')">
      Sửa
    </button>

    <button
      class="btn-delete"
      onclick="deleteEmployee('${doc.id}')">
      Xóa
    </button>
  </td>
</tr>`;
      });
    }
    // cập nhật số lượng nhân viên
    document.getElementById("sEmp").innerText = snapshot.size;
document.getElementById("rEmp").innerText = snapshot.size;

const totalEmployees =
  document.getElementById("totalEmployees");

if(totalEmployees){
  totalEmployees.innerText = snapshot.size;
}
    // cập nhật dropdown chọn nhân viên trong form OT
    const sel = document.getElementById("otEmp");
    if(sel){
      sel.innerHTML='<option value="" disabled selected>--Chọn nhân viên--</option>';
      snapshot.forEach(doc=>{
        const e=doc.data();
        sel.innerHTML+=`<option value="${e.code}" data-name="${e.name}">${e.code} - ${e.name}</option>`;
      });
    }
  });
}
function filterReport() {
  const start = document.getElementById("filterStart").value;
  const end = document.getElementById("filterEnd").value;
  const emp = document.getElementById("filterEmp").value.trim();

  let totalHour = 0;
  let empSet = new Set();
  let dataMap = {};

  db.collection("overtime").get().then(snapshot => {
    snapshot.forEach(doc => {
      const o = doc.data();
      if (start && o.date < start) return;
      if (end && o.date > end) return;
      if (emp && o.emp !== emp) return;

      let hours = 0;
      if (o.start && o.end) {
        const s = new Date("1970-01-01T" + o.start + ":00");

let e = new Date("1970-01-01T" + o.end + ":00");

if (e < s) {
  e.setHours(e.getHours() + 24);
}

hours = (e - s) / 1000 / 3600;

        totalHour += hours;
      }

      empSet.add(o.emp);

      const day = parseInt(o.date.split("-")[2]);
      if (!dataMap[o.emp]) {
        dataMap[o.emp] = { name: o.empName || "", days: {} };
      }
      dataMap[o.emp].days[day] = (dataMap[o.emp].days[day] || 0) + hours;
    });

    // cập nhật tổng giờ và tổng nhân viên tăng ca
    document.getElementById("rHour").innerText = totalHour;
    document.getElementById("rOtEmp").innerText = emp ? (empSet.size > 0 ? 1 : 0) : empSet.size;

    // render bảng chi tiết
    const theadRow = document.querySelector("#reportDetail thead tr");
    const tbody = document.querySelector("#reportDetail tbody");

    theadRow.innerHTML =
  "<th>Mã NV</th><th>Tên NV</th>";

const today = new Date();

for (let d = 1; d <= 31; d++) {

    let className = "";

    // xác định tháng đang xem
    const monthDate = start
        ? new Date(start)
        : new Date();

    const checkDate =
        new Date(
            monthDate.getFullYear(),
            monthDate.getMonth(),
            d
        );

    // Chủ nhật
    if (checkDate.getDay() === 0) {
        className = "sunday-column";
    }

    // Hôm nay
    if (
        d === today.getDate() &&
        checkDate.getMonth() === today.getMonth() &&
        checkDate.getFullYear() === today.getFullYear()
    ) {
        className = "today-column";
    }

    theadRow.innerHTML +=
        `<th class="${className}">${d}</th>`;
}

theadRow.innerHTML += "<th>Total</th>";
    tbody.innerHTML = "";
    Object.keys(dataMap).forEach(empCode => {
      const row = document.createElement("tr");
      let html = `<td>${empCode}</td><td>${dataMap[empCode].name}</td>`;
      let totalEmpHour = 0;
      for (let d = 1; d <= 31; d++) {
        const val = dataMap[empCode].days[d] || "";
        if (val) totalEmpHour += val;
        let className = "";

const monthDate = start
    ? new Date(start)
    : new Date();

const checkDate =
    new Date(
        monthDate.getFullYear(),
        monthDate.getMonth(),
        d
    );

if (checkDate.getDay() === 0) {
    className = "sunday-column";
}

const today = new Date();

if (
    d === today.getDate() &&
    checkDate.getMonth() === today.getMonth() &&
    checkDate.getFullYear() === today.getFullYear()
) {
    className = "today-column";
}

html += `<td class="${className}">${val}</td>`;
      }
      html += `<td><b>${totalEmpHour}</b></td>`;
      row.innerHTML = html;
      tbody.appendChild(row);
    });
  });

  // tổng nhân viên toàn hệ thống
  db.collection("employees").get().then(empSnap => {
    document.getElementById("rEmp").innerText = empSnap.size;
  });
}

function resetReport() {
  document.getElementById("filterStart").value = "";
  document.getElementById("filterEnd").value = "";
  document.getElementById("filterEmp").value = "";

  document.getElementById("rOtEmp").innerText = 0;
  document.getElementById("rHour").innerText = 0;

  db.collection("employees").get().then(empSnap => {
    document.getElementById("rEmp").innerText = empSnap.size;
  });

  const tbody = document.querySelector("#reportDetail tbody");
  tbody.innerHTML = "";
}
function renderTotalOT(){
  // Sinh lại cột nếu chưa có
  const headerRow = document.querySelector("#reportDetail thead tr");
  if (headerRow && headerRow.children.length === 0) {
    headerRow.innerHTML = "<th>Mã NV</th><th>Tên NV</th>";
    for (let d=1; d<=31; d++) {
      headerRow.innerHTML += `<th>${d}</th>`;
    }
    headerRow.innerHTML += "<th>Total</th>";
  }
  // Gọi tính toán
  calcTotal();
}
function formatDate(date){
    const y = date.getFullYear();
    const m = String(date.getMonth()+1).padStart(2,"0");
    const d = String(date.getDate()).padStart(2,"0");

    return `${y}-${m}-${d}`;
}
// ================== GIỚI HẠN OT THEO THÁNG ==================
const OT_ROLE_DEFAULTS = {
  "Công nhân": {limit:40, warning:10},
  "Tổ trưởng": {limit:50, warning:10},
  "Trưởng ca": {limit:60, warning:20},
  "Quản lý": {limit:60, warning:20},
  "Khác": {limit:40, warning:10}
};
function monthKeyNow(){ const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; }
function monthDateRange(month){ const [y,m]=month.split("-").map(Number); return {start:`${month}-01`,end:`${month}-${String(new Date(y,m,0).getDate()).padStart(2,"0")}`}; }
function getOTLimitForm(){
  return {roles:{
    "Công nhân":{limit:Number(document.getElementById("limWorker").value)||0,warning:Number(document.getElementById("warnWorker").value)||0},
    "Tổ trưởng":{limit:Number(document.getElementById("limLeader").value)||0,warning:Number(document.getElementById("warnLeader").value)||0},
    "Trưởng ca":{limit:Number(document.getElementById("limShiftLead").value)||0,warning:Number(document.getElementById("warnShiftLead").value)||0},
    "Quản lý":{limit:Number(document.getElementById("limManager").value)||0,warning:Number(document.getElementById("warnManager").value)||0},
    "Khác":{limit:Number(document.getElementById("limOther").value)||0,warning:Number(document.getElementById("warnOther").value)||0}
  }};
}
function fillOTLimitForm(settings={}){
 const r={...OT_ROLE_DEFAULTS,...(settings.roles||{})};
 const map={"Công nhân":["limWorker","warnWorker"],"Tổ trưởng":["limLeader","warnLeader"],"Trưởng ca":["limShiftLead","warnShiftLead"],"Quản lý":["limManager","warnManager"],"Khác":["limOther","warnOther"]};
 Object.entries(map).forEach(([role,ids])=>{document.getElementById(ids[0]).value=r[role].limit;document.getElementById(ids[1]).value=r[role].warning;});
}
async function initOTLimitPage(){
 const m=document.getElementById("otLimitMonth"); if(!m.value)m.value=monthKeyNow();
 try{const snap=await db.collection("otLimitSettings").doc(m.value).get();fillOTLimitForm(snap.exists?snap.data():{});await loadOTLimitReport();}catch(e){console.error(e);document.getElementById("otLimitMessage").textContent="Không tải được cài đặt: "+e.message;}
}
async function saveOTLimitSettings(){
 if(!currentUser||currentUser.role!=="admin")return alert("Chỉ Admin được thay đổi giới hạn.");
 const month=document.getElementById("otLimitMonth").value;if(!month)return alert("Vui lòng chọn tháng.");
 try{await db.collection("otLimitSettings").doc(month).set({...getOTLimitForm(),month,updatedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});document.getElementById("otLimitMessage").textContent="Đã lưu cài đặt cho tháng "+month;await loadOTLimitReport();}
 catch(e){alert("Không lưu được cài đặt: "+e.message);}
}
async function loadOTLimitReport(){
 if(!currentUser||currentUser.role!=="admin")return;
 const month=document.getElementById("otLimitMonth").value||monthKeyNow(),range=monthDateRange(month),tbody=document.getElementById("otLimitReport");tbody.innerHTML="<tr><td colspan='7'>Đang tải...</td></tr>";
 try{
  const [empSnap,otSnap,settingSnap]=await Promise.all([db.collection("employees").get(),db.collection("overtime").get(),db.collection("otLimitSettings").doc(month).get()]);
  const settings=settingSnap.exists?settingSnap.data():{};const roles={...OT_ROLE_DEFAULTS,...(settings.roles||{})};const totals={};
  otSnap.forEach(doc=>{const o=doc.data();if(String(o.date||"").slice(0,7)!==month)return;const code=String(o.emp||"").trim().toUpperCase();let hours=0;if(o.start&&o.end){let s=new Date("1970-01-01T"+o.start+":00"),e=new Date("1970-01-01T"+o.end+":00");if(e<s)e.setHours(e.getHours()+24);hours=(e-s)/3600000;}else hours=Number(o.hours)||0;totals[code]=(totals[code]||0)+hours;});
  const employees=empSnap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>String(a.code||"").localeCompare(String(b.code||"")));
  tbody.innerHTML=employees.map(e=>{const role=e.role||"Công nhân",cfg=roles[role]||roles["Khác"],hours=totals[String(e.code||"").trim().toUpperCase()]||0,remaining=cfg.limit-hours;let status="Bình thường";if(hours>=cfg.limit)status="⚠️ Đã chạm/vượt giới hạn";else if(remaining<=cfg.warning)status="🟠 Sắp chạm giới hạn";return `<tr><td>${escapeHTML(e.code)}</td><td>${escapeHTML(e.name)}</td><td>${escapeHTML(role)}</td><td>${hours.toFixed(2)}</td><td>${cfg.limit}</td><td>${remaining.toFixed(2)}</td><td>${status}</td></tr>`;}).join("")||"<tr><td colspan='7'>Chưa có nhân viên</td></tr>";
 }catch(e){console.error(e);tbody.innerHTML=`<tr><td colspan='7'>Lỗi tải dữ liệu: ${escapeHTML(e.message)}</td></tr>`;}
}
function escapeHTML(v){return String(v??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));}

// ================== ĐIỂM DANH HẰNG NGÀY ==================
function normalizeAttendanceInput(raw){const v=String(raw||"").trim().toUpperCase();if(["A","V","B"].includes(v))return {code:v,hours:0};if(v!==""&&Number.isFinite(Number(v))&&Number(v)>=0&&Number(v)<=24)return {code:"WORK",hours:Number(v)};return null;}
function attendanceDateToday(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
async function submitMyAttendance(){
 if(!currentUser||currentUser.role!=="emp")return alert("Chỉ nhân viên mới sử dụng mục này.");
 const date=document.getElementById("myAttendanceDate").value,value=normalizeAttendanceInput(document.getElementById("myAttendanceValue").value),note=document.getElementById("myAttendanceNote").value.trim();
 if(!date||!value)return alert("Vui lòng chọn ngày và nhập số giờ hoặc A, V, B.");
 const ref=db.collection("attendance").doc(`${currentUser.code}_${date}`);
 try{const old=await ref.get();if(old.exists&&old.data().status==="approved")return alert("Điểm danh ngày này đã được duyệt. Vui lòng liên hệ Admin nếu cần sửa.");
 await ref.set({emp:currentUser.code,empName:currentUser.name,date,attendanceCode:value.code,hours:value.hours,note,status:"pending",submittedAt:firebase.firestore.FieldValue.serverTimestamp(),updatedBy:currentUser.code},{merge:true});
 document.getElementById("myAttendanceMessage").textContent="Đã gửi điểm danh, đang chờ Admin duyệt.";await loadMyAttendanceHistory();
 }catch(e){alert("Không gửi được điểm danh: "+e.message);}
}
async function loadMyAttendanceHistory(){
 if(!currentUser||currentUser.role!=="emp")return;const tbody=document.getElementById("myAttendanceHistory");
 try{const snap=await db.collection("attendance").where("emp","==",currentUser.code).get();const rows=snap.docs.map(d=>d.data()).sort((a,b)=>String(b.date).localeCompare(String(a.date)));tbody.innerHTML=rows.map(a=>`<tr><td>${escapeHTML(a.date)}</td><td>${a.attendanceCode==="WORK"?"Có đi làm":escapeHTML(a.attendanceCode)}</td><td>${Number(a.hours)||0}</td><td>${a.status==="approved"?"Đã duyệt":"Chờ duyệt"}</td><td>${escapeHTML(a.note||"")}</td></tr>`).join("")||"<tr><td colspan='5'>Chưa có dữ liệu</td></tr>";}
 catch(e){tbody.innerHTML=`<tr><td colspan='5'>Không tải được dữ liệu: ${escapeHTML(e.message)}</td></tr>`;}
}
async function loadAdminAttendance(){
 if(!currentUser||currentUser.role!=="admin")return;const date=document.getElementById("adminAttendanceDate").value||attendanceDateToday(),tbody=document.getElementById("adminAttendanceTable");tbody.innerHTML="<tr><td colspan='8'>Đang tải...</td></tr>";
 try{const [empSnap,attSnap]=await Promise.all([db.collection("employees").orderBy("code","asc").get(),db.collection("attendance").where("date","==",date).get()]);const at={};attSnap.forEach(d=>at[String(d.data().emp||"").toUpperCase()]= {id:d.id,...d.data()});
 tbody.innerHTML=empSnap.docs.map(d=>{const e=d.data(),a=at[String(e.code||"").toUpperCase()]||{};const val=a.attendanceCode==="WORK"?(a.hours??""):(a.attendanceCode||"");return `<tr data-code="${escapeHTML(e.code)}" data-docid="${escapeHTML(a.id||`${e.code}_${date}`)}"><td>${escapeHTML(e.code)}</td><td>${escapeHTML(e.name)}</td><td>${escapeHTML(e.dept||"")}</td><td>${escapeHTML(e.role||"Công nhân")}</td><td><input class="att-value" value="${escapeHTML(val)}" placeholder="Giờ / A / V / B" style="min-width:100px"></td><td><input class="att-note" value="${escapeHTML(a.note||"")}" placeholder="Ghi chú"></td><td>${a.status==="approved"?"Đã duyệt":a.status==="pending"?"Chờ duyệt":"Chưa nhập"}</td><td><button type="button" onclick="approveAttendanceRow(this)">Duyệt</button></td></tr>`;}).join("")||"<tr><td colspan='8'>Không có nhân viên</td></tr>";
 }catch(e){tbody.innerHTML=`<tr><td colspan='8'>Lỗi tải dữ liệu: ${escapeHTML(e.message)}</td></tr>`;}
}
async function saveAdminAttendanceAll(){
 if(!currentUser||currentUser.role!=="admin")return alert("Chỉ Admin được chỉnh sửa.");const date=document.getElementById("adminAttendanceDate").value||attendanceDateToday();const rows=[...document.querySelectorAll("#adminAttendanceTable tr[data-code]")];
 try{let batch=db.batch(),count=0;for(const row of rows){const code=row.dataset.code,parsed=normalizeAttendanceInput(row.querySelector(".att-value").value);if(!parsed)continue;const ref=db.collection("attendance").doc(row.dataset.docid||`${code}_${date}`);batch.set(ref,{emp:code,date,attendanceCode:parsed.code,hours:parsed.hours,note:row.querySelector(".att-note").value.trim(),status:"pending",updatedBy:currentUser.name||"Admin",updatedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});count++;if(count%400===0){await batch.commit();batch=db.batch();}}
 if(count%400!==0)await batch.commit();alert("Đã lưu điểm danh của "+count+" nhân viên. Các dòng cần được duyệt để xác nhận.");await loadAdminAttendance();
 }catch(e){alert("Không lưu được điểm danh: "+e.message);}
}
async function approveAttendanceRow(button){
 if(!currentUser||currentUser.role!=="admin")return;const row=button.closest("tr"),code=row.dataset.code,date=document.getElementById("adminAttendanceDate").value||attendanceDateToday(),parsed=normalizeAttendanceInput(row.querySelector(".att-value").value);if(!parsed)return alert("Nhập số giờ hợp lệ hoặc A, V, B.");
 try{await db.collection("attendance").doc(row.dataset.docid||`${code}_${date}`).set({emp:code,date,attendanceCode:parsed.code,hours:parsed.hours,note:row.querySelector(".att-note").value.trim(),status:"approved",approvedBy:currentUser.name||"Admin",approvedAt:firebase.firestore.FieldValue.serverTimestamp(),updatedBy:currentUser.name||"Admin"},{merge:true});await loadAdminAttendance();}catch(e){alert("Không duyệt được: "+e.message);}
}

// Chỉnh showPage để gọi renderTotalOT khi mở trang nhân viên
function showPage(id){
    document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
    const page = document.getElementById(id);
    if (page) page.classList.remove("hidden");

    if (id === "totalOvertime" && currentUser && currentUser.role === "emp") {
        if (!document.getElementById("totalStart").value && !document.getElementById("totalEnd").value) {
            const now = new Date();
            document.getElementById("totalStart").value = formatDate(new Date(now.getFullYear(), now.getMonth(), 1));
            document.getElementById("totalEnd").value = formatDate(new Date(now.getFullYear(), now.getMonth()+1, 0));
        }
        calcTotal();
    }

    if (id === "salaryEstimate" && currentUser && currentUser.role === "emp") {
        loadSalaryEstimatePage();
    }

    if (id === "payrollSettings" && currentUser && currentUser.role === "admin") {
        initPayrollSettingsPage();
    }

    if (id === "otLimits" && currentUser && currentUser.role === "admin") initOTLimitPage();
    if (id === "adminAttendance" && currentUser && currentUser.role === "admin") { if(!document.getElementById("adminAttendanceDate").value)document.getElementById("adminAttendanceDate").value=attendanceDateToday(); loadAdminAttendance(); }
    if (id === "myAttendance" && currentUser && currentUser.role === "emp") { if(!document.getElementById("myAttendanceDate").value)document.getElementById("myAttendanceDate").value=attendanceDateToday(); loadMyAttendanceHistory(); }
}

// ============================================================
// DỰ TÍNH LƯƠNG NHÂN VIÊN
// Collections:
// salaryProfiles/{employeeCode} - hồ sơ lương/phụ cấp dùng lại
// salaryEstimates/{employeeCode_YYYY-MM} - dữ liệu dự tính theo tháng
// payrollSettings/{YYYY-MM} - số ngày công do admin thiết lập
// ============================================================
const salaryAllowanceFields = [
  ["spAttendance", "attendanceAllowance", "Trợ cấp chuyên cần"],
  ["spHousing", "housingAllowance", "Trợ cấp nhà ở"],
  ["spWorker", "workerAllowance", "Trợ cấp công nhân"],
  ["spJapanese", "japaneseAllowance", "Trợ cấp tiếng Nhật"],
  ["spTransport", "transportAllowance", "Trợ cấp đi lại"],
  ["spRotating", "rotatingAllowance", "Trợ cấp nhóm luân phiên"],
  ["spCompanyTransport", "companyTransportAllowance", "Trợ cấp đi trực công ty"],
  ["spKltManagement", "kltManagementAllowance", "Quản lý KLT / trợ cấp khác cố định"]
];
let salaryProfileLoaded = false;
let registeredSalaryOT = { weekday: 0, restday: 0, holiday: 0, night: 0 };
let currentPayrollSetting = null;

function currentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
}
function salaryEstimateDocId() {
  return `${currentUser.code}_${document.getElementById("salaryMonth").value || currentMonthKey()}`;
}
function salaryNumber(id) {
  const el = document.getElementById(id);
  const value = el ? Number(el.value) : 0;
  return Number.isFinite(value) ? value : 0;
}
function moneyVND(value) {
  return Math.round(Number(value) || 0).toLocaleString("vi-VN") + " đ";
}
function setInputValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value === undefined || value === null ? "" : value;
}
function getMonthBounds(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  return { start: `${monthKey}-01`, end: formatDate(new Date(year, month, 0)), year, month };
}
function getDurationHours(start, end) {
  if (!start || !end) return 0;
  const toMin = t => {
    const parts = t.split(":").map(Number);
    return parts[0] * 60 + parts[1];
  };
  const s = toMin(start);
  let e = toMin(end);
  if (e <= s) e += 1440;
  return Math.max(0, (e - s) / 60);
}
function getNightHours(start, end) {
  if (!start || !end) return 0;
  const toMin = t => {
    const parts = t.split(":").map(Number);
    return parts[0] * 60 + parts[1];
  };
  const s = toMin(start);
  let e = toMin(end);
  if (e <= s) e += 1440;
  const windows = [[0,360],[1080,1440],[1440,1800]];
  let overlap = 0;
  windows.forEach(([a,b]) => overlap += Math.max(0, Math.min(e,b) - Math.max(s,a)));
  return overlap / 60;
}
function getSalaryProfileFromForm() {
  const profile = {
    emp: currentUser.code,
    empName: currentUser.name || "",
    salaryBase: salaryNumber("spSalaryBase"),
    hourlyRate: salaryNumber("spHourlyRate"),
    kltFee: salaryNumber("spKltFee"),
    insurance: salaryNumber("spInsurance"),
    unionFee: salaryNumber("spUnionFee"),
    carryoverLeave: Math.min(5, Math.max(0, salaryNumber("spCarryoverLeave"))),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };
  salaryAllowanceFields.forEach(([id,key]) => profile[key] = salaryNumber(id));
  return profile;
}
function fillSalaryProfile(profile = {}) {
  setInputValue("spSalaryBase", profile.salaryBase || 0);
  setInputValue("spHourlyRate", profile.hourlyRate || 0);
  setInputValue("spKltFee", profile.kltFee || 0);
  setInputValue("spInsurance", profile.insurance || 0);
  setInputValue("spUnionFee", profile.unionFee || 0);
  setInputValue("spCarryoverLeave", Math.min(5, Number(profile.carryoverLeave || 0)));
  salaryAllowanceFields.forEach(([id,key]) => setInputValue(id, profile[key] || 0));
}
async function saveSalaryProfile() {
  if (!currentUser || currentUser.role !== "emp") return alert("Chỉ tài khoản nhân viên mới sử dụng được chức năng này.");
  const profile = getSalaryProfileFromForm();
  if (profile.salaryBase < 0 || profile.hourlyRate < 0) return alert("Lương và giá trị/giờ không được âm.");
  try {
    await db.collection("salaryProfiles").doc(currentUser.code).set(profile, { merge: true });
    document.getElementById("salaryProfileMessage").innerText = "Đã lưu hồ sơ lương.";
    salaryProfileLoaded = true;
    await calculateSalaryEstimate();
  } catch (err) {
    console.error(err);
    alert("Không thể lưu hồ sơ lương: " + err.message);
  }
}
function getMonthlyInputsFromForm() {
  return {
    emp: currentUser.code,
    empName: currentUser.name || "",
    monthKey: document.getElementById("salaryMonth").value || currentMonthKey(),
    absenceHours: Math.max(0, salaryNumber("seAbsenceHours")),
    annualLeaveDaysUsed: Math.max(0, salaryNumber("seLeaveDays")),
    weekdayAdjust: salaryNumber("seWeekdayAdjust"),
    restdayAdjust: salaryNumber("seRestdayAdjust"),
    holidayAdjust: salaryNumber("seHolidayAdjust"),
    nightAdjust: salaryNumber("seNightAdjust"),
    otherIncome: Math.max(0, salaryNumber("seOtherIncome")),
    otherIncomeReason: document.getElementById("seOtherIncomeReason").value.trim(),
    otherDeduction: Math.max(0, salaryNumber("seOtherDeduction")),
    otherDeductionReason: document.getElementById("seOtherDeductionReason").value.trim(),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };
}
async function saveMonthlySalaryInputs(silent = false) {
  if (!currentUser || currentUser.role !== "emp") return;
  const inputs = getMonthlyInputsFromForm();
  if (!inputs.monthKey) return alert("Vui lòng chọn tháng dự tính.");
  try {
    await db.collection("salaryEstimates").doc(`${currentUser.code}_${inputs.monthKey}`).set(inputs, { merge: true });
    if (!silent) document.getElementById("salaryEstimateMessage").innerText = "Đã lưu dữ liệu dự tính tháng.";
    return true;
  } catch (err) {
    console.error(err);
    if (!silent) alert("Không thể lưu dữ liệu dự tính: " + err.message);
    return false;
  }
}
async function loadSalaryEstimatePage() {
  if (!currentUser || currentUser.role !== "emp") return;
  const monthInput = document.getElementById("salaryMonth");
  if (!monthInput.value) monthInput.value = currentMonthKey();
  const monthKey = monthInput.value;
  if (!/^\d{4}-\d{2}$/.test(monthKey)) return;
  document.getElementById("salaryProfileMessage").innerText = "";
  document.getElementById("salaryEstimateMessage").innerText = "";
  try {
    const [profileSnap, estimateSnap, settingSnap, otSnap, allEstimateSnap] = await Promise.all([
      db.collection("salaryProfiles").doc(currentUser.code).get(),
      db.collection("salaryEstimates").doc(`${currentUser.code}_${monthKey}`).get(),
      db.collection("payrollSettings").doc(monthKey).get(),
      db.collection("overtime").where("emp", "==", currentUser.code).get(),
      db.collection("salaryEstimates").where("emp", "==", currentUser.code).get()
    ]);
    const profile = profileSnap.exists ? profileSnap.data() : {};
    fillSalaryProfile(profile);
    salaryProfileLoaded = profileSnap.exists;
    const estimate = estimateSnap.exists ? estimateSnap.data() : {};
    setInputValue("seAbsenceHours", estimate.absenceHours || 0);
    setInputValue("seLeaveDays", estimate.annualLeaveDaysUsed || 0);
    setInputValue("seWeekdayAdjust", estimate.weekdayAdjust || 0);
    setInputValue("seRestdayAdjust", estimate.restdayAdjust || 0);
    setInputValue("seHolidayAdjust", estimate.holidayAdjust || 0);
    setInputValue("seNightAdjust", estimate.nightAdjust || 0);
    setInputValue("seOtherIncome", estimate.otherIncome || 0);
    setInputValue("seOtherIncomeReason", estimate.otherIncomeReason || "");
    setInputValue("seOtherDeduction", estimate.otherDeduction || 0);
    setInputValue("seOtherDeductionReason", estimate.otherDeductionReason || "");
    currentPayrollSetting = settingSnap.exists ? settingSnap.data() : null;
    document.getElementById("salaryWorkDaysInfo").innerText = currentPayrollSetting && currentPayrollSetting.workDays !== undefined
      ? `Ngày công theo lịch công ty trong ${monthKey}: ${currentPayrollSetting.workDays} ngày.`
      : `Admin chưa thiết lập tổng ngày công cho tháng ${monthKey}.`;

    registeredSalaryOT = { weekday: 0, restday: 0, holiday: 0, night: 0 };
    const bounds = getMonthBounds(monthKey);
    otSnap.forEach(doc => {
      const o = doc.data();
      if (!o.date || o.date < bounds.start || o.date > bounds.end) return;
      const hours = getDurationHours(o.start, o.end);
      const type = ["weekday","restday","holiday"].includes(o.otType) ? o.otType : "weekday";
      registeredSalaryOT[type] += hours;
      registeredSalaryOT.night += getNightHours(o.start, o.end);
    });
    setInputValue("seWeekdayRegistered", registeredSalaryOT.weekday.toFixed(2));
    setInputValue("seRestdayRegistered", registeredSalaryOT.restday.toFixed(2));
    setInputValue("seHolidayRegistered", registeredSalaryOT.holiday.toFixed(2));
    setInputValue("seNightRegistered", registeredSalaryOT.night.toFixed(2));

    const [year, month] = monthKey.split("-").map(Number);
    let usedLeave = 0;
    allEstimateSnap.forEach(doc => {
      const d = doc.data();
      if (d.monthKey && d.monthKey.startsWith(`${year}-`) && d.monthKey <= monthKey) usedLeave += Number(d.annualLeaveDaysUsed || 0);
    });
    const monthsAccrued = month;
    const carry = Math.min(5, Math.max(0, Number(profile.carryoverLeave || 0)));
    const leaveBalance = Math.max(0, carry + monthsAccrued - usedLeave);
    document.getElementById("salaryLeaveInfo").innerText = `Phép năm dự tính: chuyển từ năm trước ${carry} ngày + phát sinh năm nay ${monthsAccrued} ngày − đã đăng ký đến tháng này ${usedLeave} ngày = còn ${leaveBalance} ngày. Kiểm tra với số phép đã được công ty xác nhận.`;
    await calculateSalaryEstimate(false);
  } catch (err) {
    console.error(err);
    alert("Không tải được dữ liệu dự tính lương: " + err.message);
  }
}
async function calculateSalaryEstimate(saveInputs = false) {
  if (!currentUser || currentUser.role !== "emp") return;
  if (saveInputs) {
    const saved = await saveMonthlySalaryInputs(true);
    if (!saved) return;
  }
  const profile = getSalaryProfileFromForm();
  const absenceHours = Math.max(0, salaryNumber("seAbsenceHours"));
  const absenceDeduction = absenceHours * profile.hourlyRate;
  const attendanceAllowance = absenceHours > 0 ? 0 : profile.attendanceAllowance;
  const fixedAllowances = profile.housingAllowance + profile.workerAllowance + profile.japaneseAllowance + profile.transportAllowance + profile.rotatingAllowance + profile.companyTransportAllowance + profile.kltManagementAllowance;
  const otherIncome = Math.max(0, salaryNumber("seOtherIncome"));
  const otherDeduction = Math.max(0, salaryNumber("seOtherDeduction"));
  const weekdayHours = Math.max(0, registeredSalaryOT.weekday + salaryNumber("seWeekdayAdjust"));
  const restdayHours = Math.max(0, registeredSalaryOT.restday + salaryNumber("seRestdayAdjust"));
  const holidayHours = Math.max(0, registeredSalaryOT.holiday + salaryNumber("seHolidayAdjust"));
  const nightHours = Math.max(0, registeredSalaryOT.night + salaryNumber("seNightAdjust"));
  const weekdayPay = weekdayHours * profile.hourlyRate * 1.5;
  const restdayPay = restdayHours * profile.hourlyRate * 2;
  const holidayPay = holidayHours * profile.hourlyRate * 3;
  // Tạm dùng phụ trội ca đêm 30% theo thông tin người dùng; cần đối chiếu quy chế công ty.
  const nightPay = nightHours * profile.hourlyRate * 0.30;
  const allowanceTotal = attendanceAllowance + fixedAllowances;
  const baseAfterAbsence = profile.salaryBase - absenceDeduction;
  const gross = baseAfterAbsence + allowanceTotal + weekdayPay + restdayPay + holidayPay + nightPay + otherIncome;
  const deductions = profile.insurance + profile.unionFee + profile.kltFee + otherDeduction;
  const net = gross - deductions;
  document.getElementById("seGrossResult").innerText = moneyVND(gross);
  document.getElementById("seDeductionResult").innerText = moneyVND(deductions);
  document.getElementById("seNetResult").innerText = moneyVND(net);
  const rows = [
    ["Lương cơ bản + phụ cấp lương", "—", "—", profile.salaryBase],
    ["Trừ vắng mặt không hưởng lương", `${absenceHours} giờ`, `${moneyVND(profile.hourlyRate)}/giờ`, -absenceDeduction],
    ["Trợ cấp chuyên cần", absenceHours > 0 ? "Không đạt" : "Đủ điều kiện", "—", attendanceAllowance],
    ["Trợ cấp nhà ở", "—", "—", profile.housingAllowance],
    ["Trợ cấp công nhân", "—", "—", profile.workerAllowance],
    ["Trợ cấp tiếng Nhật", "—", "—", profile.japaneseAllowance],
    ["Trợ cấp đi lại", "—", "—", profile.transportAllowance],
    ["Trợ cấp nhóm luân phiên", "—", "—", profile.rotatingAllowance],
    ["Trợ cấp đi trực công ty", "—", "—", profile.companyTransportAllowance],
    ["Quản lý KLT / trợ cấp cố định khác", "—", "—", profile.kltManagementAllowance],
    ["Tăng ca ngày thường", `${weekdayHours} giờ`, "x1,5", weekdayPay],
    ["Tăng ca ngày nghỉ", `${restdayHours} giờ`, "x2", restdayPay],
    ["Tăng ca ngày lễ", `${holidayHours} giờ`, "x3", holidayPay],
    ["Phụ trội ca đêm (tạm tính 30%)", `${nightHours} giờ`, "x0,30", nightPay],
    ["Khoản thu khác: " + (document.getElementById("seOtherIncomeReason").value.trim() || "chưa ghi lý do"), "—", "—", otherIncome],
    ["BHXH, BHYT, BHTN", "—", "—", -profile.insurance],
    ["Phí công đoàn", "—", "—", -profile.unionFee],
    ["Phí ở KLT / khoản chi cố định", "—", "—", -profile.kltFee],
    ["Khoản chi khác: " + (document.getElementById("seOtherDeductionReason").value.trim() || "chưa ghi lý do"), "—", "—", -otherDeduction],
    ["TỔNG THU DỰ TÍNH", "", "", gross],
    ["TỔNG CHI DỰ TÍNH", "", "", deductions],
    ["THỰC NHẬN DỰ TÍNH (chưa tính thuế TNCN)", "", "", net]
  ];
  const tbody = document.getElementById("salaryBreakdown");
  tbody.innerHTML = "";
  rows.forEach((r, index) => {
    const tr = document.createElement("tr");
    if (index >= rows.length - 3) tr.style.fontWeight = "700";
    tr.innerHTML = `<td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${moneyVND(r[3])}</td>`;
    tbody.appendChild(tr);
  });
}

// Admin: cấu hình tổng ngày công theo lịch công ty cho từng tháng
function initPayrollSettingsPage() {
  const monthInput = document.getElementById("payrollSettingMonth");
  if (!monthInput.value) monthInput.value = currentMonthKey();
  loadPayrollSettingForMonth();
}
async function loadPayrollSettingForMonth() {
  const monthKey = document.getElementById("payrollSettingMonth").value;
  if (!monthKey) return;
  try {
    const snap = await db.collection("payrollSettings").doc(monthKey).get();
    setInputValue("payrollSettingWorkDays", snap.exists ? snap.data().workDays : "");
    document.getElementById("payrollSettingMessage").innerText = snap.exists ? `Đã có thiết lập cho tháng ${monthKey}.` : `Chưa thiết lập ngày công cho tháng ${monthKey}.`;
  } catch (err) {
    console.error(err);
    document.getElementById("payrollSettingMessage").innerText = "Không tải được thiết lập: " + err.message;
  }
}
async function savePayrollSetting() {
  if (!currentUser || currentUser.role !== "admin") return alert("Chỉ admin mới được thiết lập ngày công.");
  const monthKey = document.getElementById("payrollSettingMonth").value;
  const workDays = Number(document.getElementById("payrollSettingWorkDays").value);
  if (!monthKey) return alert("Vui lòng chọn tháng.");
  if (!Number.isFinite(workDays) || workDays < 0 || workDays > 31) return alert("Số ngày công phải từ 0 đến 31.");
  try {
    await db.collection("payrollSettings").doc(monthKey).set({ monthKey, workDays, updatedAt: firebase.firestore.FieldValue.serverTimestamp(), updatedBy: currentUser.name || "admin" }, { merge: true });
    document.getElementById("payrollSettingMessage").innerText = `Đã lưu ${workDays} ngày công cho tháng ${monthKey}.`;
  } catch (err) {
    console.error(err);
    alert("Không lưu được ngày công: " + err.message);
  }
}

// Tự nạp lại thiết lập khi admin đổi tháng
 document.addEventListener("change", event => {
  if (event.target && event.target.id === "payrollSettingMonth") loadPayrollSettingForMonth();
  if (event.target && event.target.id === "salaryMonth" && currentUser && currentUser.role === "emp") loadSalaryEstimatePage();
});
