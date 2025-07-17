import Header from "@/components/ui/Header";
import Footer from "@/components/ui/footer";

export default function ChinhSachBaoMat() {
  return (
    <>
      <Header />
      <main className="max-w-screen-md mx-auto p-4 min-h-[60vh]">
        <h1 className="text-3xl font-bold text-primary mb-6 text-center">
          Chính Sách Bảo Mật
        </h1>
        <div className="space-y-4 text-gray-800">
          <p>
            Chúng tôi cam kết bảo vệ thông tin cá nhân và dữ liệu của khách hàng
            khi sử dụng dịch vụ lưu trữ của chúng tôi.
          </p>
          <h2 className="text-xl font-semibold mt-4">1. Thu thập thông tin</h2>
          <p>
            Chúng tôi chỉ thu thập các thông tin cần thiết để cung cấp và nâng
            cao chất lượng dịch vụ, bao gồm: email, số điện thoại, thông tin
            đăng nhập, và dữ liệu lưu trữ.
          </p>
          <h2 className="text-xl font-semibold mt-4">2. Sử dụng thông tin</h2>
          <p>
            Thông tin của bạn chỉ được sử dụng cho mục đích quản lý tài khoản,
            hỗ trợ khách hàng, và cải thiện dịch vụ. Chúng tôi không chia sẻ
            thông tin cá nhân cho bên thứ ba khi chưa có sự đồng ý của bạn.
          </p>
          <h2 className="text-xl font-semibold mt-4">3. Bảo mật dữ liệu</h2>
          <p>
            Dữ liệu của bạn được mã hóa và bảo vệ bằng các biện pháp an ninh
            hiện đại. Chúng tôi thường xuyên kiểm tra, cập nhật hệ thống để đảm
            bảo an toàn tối đa.
          </p>
          <h2 className="text-xl font-semibold mt-4">
            4. Quyền của khách hàng
          </h2>
          <p>
            Bạn có quyền yêu cầu xem, chỉnh sửa hoặc xóa thông tin cá nhân bất
            cứ lúc nào bằng cách liên hệ với chúng tôi qua email hoặc hotline hỗ
            trợ.
          </p>
          <h2 className="text-xl font-semibold mt-4">5. Thay đổi chính sách</h2>
          <p>
            Chính sách bảo mật có thể được cập nhật. Mọi thay đổi sẽ được thông
            báo trên website.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
