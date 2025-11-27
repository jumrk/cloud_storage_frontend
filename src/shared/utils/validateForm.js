function validateForm(fields) {
  const errors = {};

  // Kiểm tra đầu vào email
  if ("email" in fields) {
    if (!fields.email) {
      errors.email = "Email không được để trống";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
      errors.email = "Email không hợp lệ";
    }
  }

  // Kiểm tra số điện thoại
  if ("phone" in fields) {
    if (!fields.phone) {
      errors.phone = "Số điện thoại không được để trống";
    } else if (fields.phone <= 11) {
      errors.phone = "Số điện thoại không hợp lệ";
    } else if (!/^\d+$/.test(fields.phone)) {
      errors.phone = "Số điện thoại không hợp lệ";
    }
  }

  // Kiểm tra mật khẩu
  if ("password" in fields) {
    if (fields.password === "") {
      errors.password = "Mật khẩu không được để trống";
    } else if (fields.password.length < 6) {
      errors.password = "Mật khẩu có ít nhất 6 ký tự";
    }
  }

  // Kiểm tra xác nhận mật khẩu
  if ("confirmPassword" in fields) {
    if (fields.confirmPassword === "") {
      errors.confirmPassword = "Xác nhận mật khẩu không được để trống";
    } else if (fields.confirmPassword.length < 6) {
      errors.confirmPassword = "Xác nhận mật khẩu có ít nhất 6 kí tự";
    } else if (fields.confirmPassword !== fields.password) {
      errors.confirmPassword = "Mật khẩu không giống nhau";
    }
  }

  return errors;
}

export default validateForm;
