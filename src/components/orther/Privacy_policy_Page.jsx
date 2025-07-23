"use client";
import { useRef } from "react";

const sections = [
  { id: "introduction", label: "1. Giới thiệu" },
  { id: "collect", label: "2. Thông tin chúng tôi thu thập" },
  { id: "personal", label: "2.1. Thông tin cá nhân" },
  { id: "nonpersonal", label: "2.2. Thông tin phi cá nhân" },
  { id: "cookies", label: "2.3. Cookies & Công nghệ tương tự" },
  { id: "googleapi", label: "2.4. Dữ liệu từ Google API" },
  { id: "use", label: "3. Cách chúng tôi sử dụng thông tin" },
  { id: "share", label: "4. Chia sẻ & tiết lộ thông tin" },
  { id: "rights", label: "5. Quyền và lựa chọn của khách hàng" },
  { id: "security", label: "6. Bảo mật dữ liệu" },
  { id: "storage", label: "7. Lưu trữ & xóa dữ liệu" },
  { id: "changes", label: "8. Thay đổi chính sách" },
  { id: "contact", label: "9. Liên hệ" },
];

export default function PrivacyPolicy() {
  const refs = useRef({});

  const scrollToSection = (id) => {
    refs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="w-full min-h-screen bg-white pb-16">
      <div className="max-w-5xl mx-auto px-4 pt-10 flex flex-col md:flex-row gap-10">
        {/* Nội dung chính */}
        <main className="flex-1 min-w-0">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-gray-900">
            Chính sách bảo mật
          </h1>
          <div className="text-gray-500 text-sm mb-6">
            Cập nhật lần cuối: 22/07/2025
          </div>
          <div className="space-y-10 text-gray-800 text-base leading-relaxed">
            <section
              ref={(el) => (refs.current["introduction"] = el)}
              id="introduction"
            >
              <h2 className="text-xl font-semibold mb-2">1. Giới thiệu</h2>
              <p>
                D2MBox cam kết bảo vệ quyền riêng tư và dữ liệu cá nhân của bạn
                khi sử dụng dịch vụ lưu trữ đám mây. Chính sách này giải thích
                chi tiết về cách chúng tôi thu thập, sử dụng, lưu trữ, chia sẻ
                và bảo vệ thông tin của bạn. Việc sử dụng dịch vụ đồng nghĩa với
                việc bạn đồng ý với các điều khoản trong chính sách này. Chúng
                tôi khuyến khích bạn đọc kỹ và thường xuyên cập nhật các thay
                đổi.
              </p>
              <p>
                Chính sách này áp dụng cho tất cả người dùng truy cập, đăng ký
                hoặc sử dụng bất kỳ dịch vụ, sản phẩm, website, ứng dụng nào của
                D2MBox, bao gồm cả khách hàng cá nhân và doanh nghiệp.
              </p>
            </section>
            <section ref={(el) => (refs.current["collect"] = el)} id="collect">
              <h2 className="text-xl font-semibold mb-2">
                2. Thông tin chúng tôi thu thập
              </h2>
              <p>
                Chúng tôi thu thập các loại thông tin sau để phục vụ cho việc
                cung cấp, vận hành, bảo vệ và cải thiện dịch vụ:
              </p>
              <ul className="list-disc pl-6">
                <li>
                  <a
                    href="#personal"
                    className="text-[#189ff2] hover:underline"
                  >
                    Thông tin cá nhân
                  </a>{" "}
                  (Personal Data)
                </li>
                <li>
                  <a
                    href="#nonpersonal"
                    className="text-[#189ff2] hover:underline"
                  >
                    Thông tin phi cá nhân
                  </a>{" "}
                  (Non-Personal Data)
                </li>
                <li>
                  <a href="#cookies" className="text-[#189ff2] hover:underline">
                    Cookies & Công nghệ tương tự
                  </a>
                </li>
              </ul>
            </section>
            <section
              ref={(el) => (refs.current["personal"] = el)}
              id="personal"
            >
              <h3 className="text-lg font-semibold mb-1">
                2.1. Thông tin cá nhân
              </h3>
              <p>
                Chúng tôi thu thập các thông tin nhận diện cá nhân mà bạn cung
                cấp trực tiếp khi đăng ký tài khoản, sử dụng dịch vụ, liên hệ hỗ
                trợ hoặc tham gia các chương trình khuyến mãi. Ví dụ:
              </p>
              <ul className="list-disc pl-6 mt-2">
                <li>Họ tên, email, số điện thoại, địa chỉ liên hệ.</li>
                <li>Thông tin đăng nhập (username, mật khẩu đã mã hóa).</li>
                <li>
                  Dữ liệu lưu trữ trên hệ thống (file, folder, metadata liên
                  quan).
                </li>
                <li>
                  Lịch sử giao dịch, hóa đơn, thông tin thanh toán (nếu sử dụng
                  dịch vụ trả phí).
                </li>
                <li>
                  Nội dung trao đổi với bộ phận hỗ trợ, phản hồi, đánh giá.
                </li>
                <li>
                  Thông tin xác thực bổ sung (CMND/CCCD, giấy phép kinh doanh)
                  nếu cần thiết cho doanh nghiệp.
                </li>
              </ul>
              <p className="mt-2">
                <b>Ví dụ thực tế:</b> Khi bạn đăng ký tài khoản, chúng tôi yêu
                cầu email và số điện thoại để xác thực và hỗ trợ bảo mật tài
                khoản. Khi bạn liên hệ hỗ trợ, chúng tôi lưu lại nội dung trao
                đổi để cải thiện dịch vụ.
              </p>
            </section>
            <section
              ref={(el) => (refs.current["nonpersonal"] = el)}
              id="nonpersonal"
            >
              <h3 className="text-lg font-semibold mb-1">
                2.2. Thông tin phi cá nhân
              </h3>
              <p>
                Chúng tôi tự động thu thập một số thông tin không nhận diện cá
                nhân khi bạn truy cập website hoặc sử dụng ứng dụng, bao gồm:
              </p>
              <ul className="list-disc pl-6 mt-2">
                <li>
                  Địa chỉ IP, loại thiết bị, hệ điều hành, trình duyệt, độ phân
                  giải màn hình.
                </li>
                <li>
                  Thời gian truy cập, trang đã xem, liên kết đã click, nguồn
                  giới thiệu.
                </li>
                <li>
                  Dữ liệu thống kê ẩn danh về hành vi sử dụng, hiệu suất hệ
                  thống.
                </li>
                <li>Thông tin vị trí địa lý (nếu bạn cho phép).</li>
              </ul>
              <p className="mt-2">
                <b>Lưu ý:</b> Thông tin này giúp chúng tôi phân tích, tối ưu hóa
                hiệu suất, phát hiện lỗi, bảo vệ hệ thống khỏi truy cập trái
                phép và nâng cao trải nghiệm người dùng.
              </p>
            </section>
            <section ref={(el) => (refs.current["cookies"] = el)} id="cookies">
              <h3 className="text-lg font-semibold mb-1">
                2.3. Cookies & Công nghệ tương tự
              </h3>
              <p>
                Chúng tôi sử dụng cookies, web beacons và các công nghệ tương tự
                để:
              </p>
              <ul className="list-disc pl-6 mt-2">
                <li>
                  Ghi nhớ thông tin đăng nhập, tùy chọn cá nhân hóa giao diện.
                </li>
                <li>
                  Phân tích lưu lượng truy cập, đo lường hiệu quả chiến dịch
                  marketing.
                </li>
                <li>Hỗ trợ bảo mật, phát hiện hành vi bất thường.</li>
              </ul>
              <p className="mt-2">
                Bạn có thể tùy chỉnh trình duyệt để từ chối hoặc xóa cookies,
                tuy nhiên một số tính năng có thể không hoạt động tối ưu nếu
                cookies bị tắt.
              </p>
            </section>
            <section
              ref={(el) => (refs.current["googleapi"] = el)}
              id="googleapi"
            >
              <h3 className="text-lg font-semibold mb-1">
                2.4. Dữ liệu từ Google API
              </h3>
              <p>
                Chúng tôi sử dụng các dịch vụ của Google, bao gồm Google Drive
                API, để cung cấp các tính năng như lưu trữ, truy xuất và quản lý
                tệp tin của bạn trên Google Drive. Khi bạn đăng nhập hoặc kết
                nối tài khoản Google với D2MBox, chúng tôi có thể thu thập và xử
                lý các thông tin sau (tùy theo quyền bạn cấp):
              </p>
              <ul className="list-disc pl-6 mt-2">
                <li>
                  Thông tin hồ sơ Google cơ bản (tên, email, ảnh đại diện).
                </li>
                <li>Danh sách tệp và thư mục trên Google Drive của bạn.</li>
                <li>
                  Nội dung tệp (chỉ khi bạn thực hiện thao tác tải lên, tải
                  xuống hoặc xem trước).
                </li>
                <li>Thông tin về quyền truy cập, chia sẻ tệp.</li>
              </ul>
              <p className="mt-2">
                <b>Chúng tôi cam kết:</b>
                <ul className="list-disc pl-6 mt-2">
                  <li>
                    Chỉ truy cập, sử dụng dữ liệu Google Drive khi có sự cho
                    phép rõ ràng từ bạn.
                  </li>
                  <li>
                    Không chia sẻ, bán hoặc sử dụng dữ liệu Google Drive của bạn
                    cho mục đích ngoài phạm vi dịch vụ.
                  </li>
                  <li>
                    Dữ liệu truy xuất từ Google API được mã hóa khi truyền tải
                    và lưu trữ.
                  </li>
                  <li>
                    Bạn có thể ngắt kết nối tài khoản Google bất cứ lúc nào, và
                    chúng tôi sẽ xóa các token truy cập liên quan khỏi hệ thống.
                  </li>
                  <li>
                    Chúng tôi tuân thủ Chính sách Dữ liệu Người dùng của Google
                    API (Google API Services User Data Policy), bao gồm các yêu
                    cầu về giới hạn sử dụng và bảo mật dữ liệu.
                  </li>
                </ul>
              </p>
              <p className="mt-2">
                <a
                  href="https://developers.google.com/terms/api-services-user-data-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#189ff2] underline"
                >
                  Google API Services User Data Policy
                </a>
              </p>
            </section>
            <section ref={(el) => (refs.current["use"] = el)} id="use">
              <h2 className="text-xl font-semibold mb-2">
                3. Cách chúng tôi sử dụng thông tin
              </h2>
              <ul className="list-disc pl-6">
                <li>
                  Cung cấp, duy trì, phát triển và cá nhân hóa dịch vụ cho từng
                  người dùng.
                </li>
                <li>
                  Quản lý tài khoản, xác thực, hỗ trợ khách hàng, xử lý yêu cầu
                  và phản hồi.
                </li>
                <li>
                  Gửi thông báo, cập nhật, khuyến mãi, bản tin (nếu bạn đăng ký
                  nhận).
                </li>
                <li>
                  Phân tích, thống kê, nghiên cứu thị trường, cải thiện sản
                  phẩm.
                </li>
                <li>
                  Phát hiện, phòng chống gian lận, bảo vệ an ninh hệ thống và
                  người dùng.
                </li>
                <li>
                  Tuân thủ quy định pháp luật, giải quyết tranh chấp, khiếu nại.
                </li>
              </ul>
              <p className="mt-2">
                <b>Ví dụ:</b> Chúng tôi sử dụng email của bạn để gửi thông báo
                về thay đổi dịch vụ, xác thực đăng nhập, hoặc hỗ trợ khi bạn
                quên mật khẩu.
              </p>
            </section>
            <section ref={(el) => (refs.current["share"] = el)} id="share">
              <h2 className="text-xl font-semibold mb-2">
                4. Chia sẻ & tiết lộ thông tin
              </h2>
              <ul className="list-disc pl-6">
                <li>
                  Chúng tôi <b>không</b> bán, trao đổi hoặc chia sẻ thông tin cá
                  nhân cho bên thứ ba vì mục đích thương mại khi chưa có sự đồng
                  ý của bạn.
                </li>
                <li>
                  Có thể chia sẻ với đối tác kỹ thuật, nhà cung cấp dịch vụ
                  thanh toán, lưu trữ, bảo mật, nhưng chỉ trong phạm vi cần
                  thiết và có cam kết bảo mật.
                </li>
                <li>
                  Chia sẻ thông tin khi có yêu cầu hợp pháp từ cơ quan chức năng
                  hoặc để bảo vệ quyền lợi hợp pháp của D2MBox và người dùng.
                </li>
                <li>
                  Chuyển giao dữ liệu trong trường hợp sáp nhập, mua bán doanh
                  nghiệp (sẽ thông báo trước).
                </li>
              </ul>
              <p className="mt-2">
                <b>Ví dụ:</b> Nếu bạn thanh toán qua cổng ngân hàng, chúng tôi
                sẽ chia sẻ thông tin cần thiết với đối tác thanh toán để xử lý
                giao dịch.
              </p>
            </section>
            <section ref={(el) => (refs.current["rights"] = el)} id="rights">
              <h2 className="text-xl font-semibold mb-2">
                5. Quyền và lựa chọn của khách hàng
              </h2>
              <ul className="list-disc pl-6">
                <li>
                  Yêu cầu truy cập, chỉnh sửa, cập nhật hoặc xóa thông tin cá
                  nhân bất cứ lúc nào.
                </li>
                <li>
                  Rút lại sự đồng ý cho phép xử lý dữ liệu cá nhân (có thể ảnh
                  hưởng đến việc sử dụng dịch vụ).
                </li>
                <li>Phản đối việc sử dụng dữ liệu cho mục đích marketing.</li>
                <li>Nhận bản sao dữ liệu cá nhân (theo quy định pháp luật).</li>
                <li>Liên hệ bộ phận hỗ trợ để thực hiện các quyền này.</li>
              </ul>
              <p className="mt-2">
                <b>Lưu ý:</b> Một số yêu cầu có thể cần xác minh danh tính để
                đảm bảo an toàn cho bạn.
              </p>
            </section>
            <section
              ref={(el) => (refs.current["security"] = el)}
              id="security"
            >
              <h2 className="text-xl font-semibold mb-2">6. Bảo mật dữ liệu</h2>
              <ul className="list-disc pl-6">
                <li>
                  Dữ liệu được mã hóa khi truyền tải và lưu trữ trên hệ thống
                  máy chủ đặt tại trung tâm dữ liệu đạt chuẩn quốc tế.
                </li>
                <li>
                  Áp dụng các biện pháp bảo mật vật lý (kiểm soát truy cập,
                  camera, bảo vệ), kỹ thuật (firewall, anti-virus, IDS/IPS), và
                  quản trị (quy trình nội bộ, đào tạo nhân viên).
                </li>
                <li>
                  Kiểm tra, đánh giá, cập nhật hệ thống thường xuyên để phòng
                  chống rủi ro, lỗ hổng bảo mật.
                </li>
                <li>
                  Giới hạn quyền truy cập dữ liệu cá nhân chỉ cho nhân sự cần
                  thiết.
                </li>
                <li>
                  Hợp tác với chuyên gia, đơn vị bảo mật độc lập để kiểm thử
                  định kỳ.
                </li>
              </ul>
              <p className="mt-2">
                <b>Trường hợp rò rỉ dữ liệu:</b> Nếu xảy ra sự cố, chúng tôi sẽ
                thông báo kịp thời cho người dùng và cơ quan chức năng theo quy
                định.
              </p>
            </section>
            <section ref={(el) => (refs.current["storage"] = el)} id="storage">
              <h2 className="text-xl font-semibold mb-2">
                7. Lưu trữ & xóa dữ liệu
              </h2>
              <ul className="list-disc pl-6">
                <li>
                  Dữ liệu cá nhân được lưu trữ trong thời gian bạn sử dụng dịch
                  vụ và/hoặc theo quy định pháp luật.
                </li>
                <li>
                  Bạn có thể yêu cầu xóa tài khoản và dữ liệu cá nhân bất cứ lúc
                  nào (trừ trường hợp pháp luật yêu cầu lưu giữ).
                </li>
                <li>
                  Sau khi xóa, dữ liệu sẽ được loại bỏ khỏi hệ thống chính và
                  các bản sao lưu trong thời gian hợp lý.
                </li>
                <li>
                  Một số dữ liệu phi cá nhân, thống kê ẩn danh có thể được lưu
                  giữ lâu hơn cho mục đích phân tích, cải thiện dịch vụ.
                </li>
              </ul>
              <p className="mt-2">
                <b>Ví dụ:</b> Khi bạn xóa tài khoản, toàn bộ file, thông tin cá
                nhân sẽ bị xóa khỏi hệ thống chính trong vòng 30 ngày.
              </p>
            </section>
            <section ref={(el) => (refs.current["changes"] = el)} id="changes">
              <h2 className="text-xl font-semibold mb-2">
                8. Thay đổi chính sách
              </h2>
              <p>
                Chính sách bảo mật có thể được cập nhật để phù hợp với quy định
                pháp luật, công nghệ mới hoặc nhu cầu vận hành. Mọi thay đổi sẽ
                được thông báo trên website và/hoặc qua email nếu cần thiết.
                Việc tiếp tục sử dụng dịch vụ sau khi chính sách thay đổi đồng
                nghĩa với việc bạn chấp nhận các điều khoản mới.
              </p>
            </section>
            <section ref={(el) => (refs.current["contact"] = el)} id="contact">
              <h2 className="text-xl font-semibold mb-2">9. Liên hệ</h2>
              <p>
                Nếu có câu hỏi, yêu cầu hoặc khiếu nại liên quan đến chính sách
                bảo mật, vui lòng liên hệ:
              </p>
              <ul className="list-disc pl-6 mt-2">
                <li>
                  Email:{" "}
                  <a
                    href="mailto:contact-d2m@dammeviet.vn"
                    className="text-[#189ff2] underline"
                  >
                    contact-d2m@dammeviet.vn
                  </a>
                </li>
                <li>
                  Hotline:{" "}
                  <a
                    href="tel:+84911930807"
                    className="text-[#189ff2] underline"
                  >
                    +84 911 930 807
                  </a>
                </li>
                <li>Địa chỉ: 205 Bình Đức 5, Phường Bình Đức, An Giang</li>
              </ul>
              <p className="mt-2">
                Chúng tôi sẽ phản hồi trong vòng 3 ngày làm việc.
              </p>
            </section>
          </div>
        </main>
        {/* Mục lục bên phải */}
        <aside className="hidden md:block w-64 flex-shrink-0 pt-2">
          <div className="sticky top-24 bg-white rounded-xl border border-gray-100 shadow p-4">
            <div className="font-bold text-gray-700 mb-2 text-base">
              Mục lục
            </div>
            <ul className="space-y-2 text-sm">
              {sections.map((s) => (
                <li key={s.id}>
                  <button
                    className="text-left text-[#189ff2] hover:underline focus:outline-none"
                    onClick={() => scrollToSection(s.id)}
                  >
                    {s.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
