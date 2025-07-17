import Header from "@/components/ui/Header";
import Footer from "@/components/ui/footer";

export default function DieuKhoanDichVu() {
  return (
    <>
      <Header />
      <main className="max-w-screen-md mx-auto p-4 min-h-[60vh]">
        <h1 className="text-3xl font-bold text-primary mb-6 text-center">
          Điều Khoản Dịch Vụ
        </h1>
        <div className="space-y-4 text-gray-800">
          <p>
            Khi sử dụng dịch vụ của chúng tôi, bạn đồng ý tuân thủ các điều
            khoản dưới đây để đảm bảo quyền lợi và nghĩa vụ của cả hai bên.
          </p>
          <h2 className="text-xl font-semibold mt-4">
            1. Đăng ký & sử dụng dịch vụ
          </h2>
          <p>
            Bạn cần cung cấp thông tin chính xác khi đăng ký tài khoản. Không sử
            dụng dịch vụ cho các mục đích vi phạm pháp luật hoặc gây hại cho
            người khác.
          </p>
          <h2 className="text-xl font-semibold mt-4">
            2. Trách nhiệm về dữ liệu
          </h2>
          <p>
            Bạn tự chịu trách nhiệm về nội dung dữ liệu tải lên. Chúng tôi không
            chịu trách nhiệm đối với các dữ liệu vi phạm bản quyền, pháp luật
            hoặc gây ảnh hưởng xấu đến cộng đồng.
          </p>
          <h2 className="text-xl font-semibold mt-4">
            3. Thanh toán & hoàn tiền
          </h2>
          <p>
            Phí dịch vụ được công khai trên website. Mọi thanh toán đều không
            hoàn lại trừ khi có thỏa thuận khác bằng văn bản.
          </p>
          <h2 className="text-xl font-semibold mt-4">
            4. Tạm ngưng hoặc chấm dứt dịch vụ
          </h2>
          <p>
            Chúng tôi có quyền tạm ngưng hoặc chấm dứt tài khoản nếu phát hiện
            hành vi vi phạm điều khoản hoặc pháp luật.
          </p>
          <h2 className="text-xl font-semibold mt-4">5. Thay đổi điều khoản</h2>
          <p>
            Điều khoản dịch vụ có thể được cập nhật. Mọi thay đổi sẽ được thông
            báo trên website.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
