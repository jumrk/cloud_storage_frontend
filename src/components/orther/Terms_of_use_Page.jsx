"use client";
import { useRef } from "react";

const sections = [
  { id: "intro", label: "1. Giới thiệu" },
  { id: "register", label: "2. Đăng ký & sử dụng dịch vụ" },
  { id: "data", label: "3. Trách nhiệm về dữ liệu" },
  { id: "user_rights", label: "4. Quyền & nghĩa vụ của người dùng" },
  { id: "provider_rights", label: "5. Quyền & trách nhiệm của D2MBox" },
  { id: "payment", label: "6. Thanh toán & hoàn tiền" },
  { id: "suspend", label: "7. Tạm ngưng/chấm dứt dịch vụ" },
  { id: "liability", label: "8. Giới hạn trách nhiệm" },
  { id: "changes", label: "9. Thay đổi điều khoản" },
  { id: "contact", label: "10. Liên hệ" },
];

export default function TermsOfUse() {
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
            Điều Khoản Dịch Vụ
          </h1>
          <div className="text-gray-500 text-sm mb-6">
            Cập nhật lần cuối: 22/07/2025
          </div>
          <div className="space-y-10 text-gray-800 text-base leading-relaxed">
            <section ref={(el) => (refs.current["intro"] = el)} id="intro">
              <h2 className="text-xl font-semibold mb-2">1. Giới thiệu</h2>
              <p>
                Khi sử dụng dịch vụ của D2MBox, bạn đồng ý tuân thủ các điều
                khoản dưới đây. Điều khoản này nhằm đảm bảo quyền lợi, nghĩa vụ
                và trách nhiệm của cả người dùng và nhà cung cấp dịch vụ. Vui
                lòng đọc kỹ trước khi sử dụng.
              </p>
              <p>
                Điều khoản áp dụng cho tất cả người dùng truy cập, đăng ký hoặc
                sử dụng bất kỳ sản phẩm, dịch vụ, website, ứng dụng nào của
                D2MBox.
              </p>
            </section>
            <section
              ref={(el) => (refs.current["register"] = el)}
              id="register"
            >
              <h2 className="text-xl font-semibold mb-2">
                2. Đăng ký & sử dụng dịch vụ
              </h2>
              <ul className="list-disc pl-6">
                <li>
                  Bạn cần cung cấp thông tin chính xác, đầy đủ khi đăng ký tài
                  khoản.
                </li>
                <li>
                  Không sử dụng dịch vụ cho mục đích vi phạm pháp luật, phát tán
                  nội dung độc hại, spam, lừa đảo, tấn công mạng.
                </li>
                <li>
                  Chịu trách nhiệm bảo mật thông tin đăng nhập, không chia sẻ
                  tài khoản cho người khác.
                </li>
                <li>
                  Thông báo ngay cho D2MBox khi phát hiện truy cập trái phép
                  hoặc nghi ngờ lộ thông tin tài khoản.
                </li>
              </ul>
              <p className="mt-2">
                <b>Ví dụ:</b> Không sử dụng dịch vụ để lưu trữ/phát tán phần mềm
                độc hại, nội dung vi phạm bản quyền, tài liệu cấm.
              </p>
            </section>
            <section ref={(el) => (refs.current["data"] = el)} id="data">
              <h2 className="text-xl font-semibold mb-2">
                3. Trách nhiệm về dữ liệu
              </h2>
              <ul className="list-disc pl-6">
                <li>
                  Bạn tự chịu trách nhiệm về nội dung dữ liệu tải lên, chia sẻ
                  hoặc lưu trữ trên hệ thống.
                </li>
                <li>
                  Không lưu trữ, chia sẻ dữ liệu vi phạm pháp luật, bản quyền,
                  đạo đức xã hội hoặc gây ảnh hưởng xấu đến cộng đồng.
                </li>
                <li>
                  D2MBox không chịu trách nhiệm đối với dữ liệu vi phạm do người
                  dùng tự ý tải lên.
                </li>
                <li>
                  Chúng tôi có quyền kiểm tra, tạm ngưng hoặc xóa dữ liệu vi
                  phạm mà không cần báo trước.
                </li>
              </ul>
              <p className="mt-2">
                <b>Ví dụ:</b> Nếu bạn lưu trữ phim lậu, tài liệu giả mạo, chúng
                tôi có quyền xóa và khóa tài khoản.
              </p>
            </section>
            <section
              ref={(el) => (refs.current["user_rights"] = el)}
              id="user_rights"
            >
              <h2 className="text-xl font-semibold mb-2">
                4. Quyền & nghĩa vụ của người dùng
              </h2>
              <ul className="list-disc pl-6">
                <li>
                  Được sử dụng dịch vụ đúng mục đích, theo đúng hướng dẫn và
                  điều khoản.
                </li>
                <li>
                  Được bảo vệ thông tin cá nhân, dữ liệu theo chính sách bảo
                  mật.
                </li>
                <li>Chủ động cập nhật, bảo mật thông tin tài khoản.</li>
                <li>
                  Chịu trách nhiệm về mọi hoạt động phát sinh từ tài khoản của
                  mình.
                </li>
                <li>
                  Thông báo cho D2MBox khi phát hiện sự cố, vi phạm, tranh chấp
                  liên quan đến tài khoản.
                </li>
              </ul>
            </section>
            <section
              ref={(el) => (refs.current["provider_rights"] = el)}
              id="provider_rights"
            >
              <h2 className="text-xl font-semibold mb-2">
                5. Quyền & trách nhiệm của D2MBox
              </h2>
              <ul className="list-disc pl-6">
                <li>
                  Cung cấp dịch vụ ổn định, bảo mật, hỗ trợ khách hàng tận tâm.
                </li>
                <li>
                  Bảo vệ dữ liệu, thông tin cá nhân người dùng theo chính sách
                  bảo mật.
                </li>
                <li>
                  Có quyền tạm ngưng, chấm dứt dịch vụ hoặc khóa tài khoản nếu
                  phát hiện vi phạm điều khoản hoặc pháp luật.
                </li>
                <li>
                  Thông báo cho người dùng về các thay đổi, cập nhật dịch vụ,
                  điều khoản.
                </li>
                <li>
                  Không chịu trách nhiệm với thiệt hại phát sinh do lỗi của
                  người dùng hoặc bên thứ ba ngoài kiểm soát hợp lý của D2MBox.
                </li>
              </ul>
            </section>
            <section ref={(el) => (refs.current["payment"] = el)} id="payment">
              <h2 className="text-xl font-semibold mb-2">
                6. Thanh toán & hoàn tiền
              </h2>
              <ul className="list-disc pl-6">
                <li>
                  Phí dịch vụ, bảng giá được công khai trên website và có thể
                  thay đổi theo từng thời điểm.
                </li>
                <li>
                  Mọi thanh toán đều không hoàn lại trừ khi có thỏa thuận khác
                  bằng văn bản.
                </li>
                <li>
                  Trong trường hợp dịch vụ bị lỗi nghiêm trọng do D2MBox, bạn có
                  thể yêu cầu hoàn tiền theo chính sách hoàn tiền công khai.
                </li>
                <li>
                  Hóa đơn, chứng từ sẽ được cung cấp theo yêu cầu và quy định
                  pháp luật.
                </li>
              </ul>
            </section>
            <section ref={(el) => (refs.current["suspend"] = el)} id="suspend">
              <h2 className="text-xl font-semibold mb-2">
                7. Tạm ngưng/chấm dứt dịch vụ
              </h2>
              <ul className="list-disc pl-6">
                <li>
                  D2MBox có quyền tạm ngưng hoặc chấm dứt tài khoản nếu phát
                  hiện hành vi vi phạm điều khoản, pháp luật hoặc gây ảnh hưởng
                  xấu đến hệ thống, cộng đồng.
                </li>
                <li>
                  Người dùng có thể chủ động yêu cầu chấm dứt dịch vụ, xóa tài
                  khoản bất cứ lúc nào.
                </li>
                <li>
                  Dữ liệu sẽ bị xóa khỏi hệ thống chính sau khi tài khoản bị
                  chấm dứt, trừ trường hợp pháp luật yêu cầu lưu giữ.
                </li>
                <li>
                  Chúng tôi sẽ thông báo trước khi thực hiện các biện pháp này
                  (trừ trường hợp khẩn cấp).
                </li>
              </ul>
            </section>
            <section
              ref={(el) => (refs.current["liability"] = el)}
              id="liability"
            >
              <h2 className="text-xl font-semibold mb-2">
                8. Giới hạn trách nhiệm
              </h2>
              <ul className="list-disc pl-6">
                <li>
                  D2MBox không chịu trách nhiệm với thiệt hại gián tiếp, mất mát
                  dữ liệu, lợi nhuận, uy tín do sự cố ngoài kiểm soát hợp lý
                  (thiên tai, tấn công mạng, lỗi bên thứ ba...)
                </li>
                <li>
                  Chúng tôi không chịu trách nhiệm với nội dung, dữ liệu do
                  người dùng tự tải lên, chia sẻ hoặc lưu trữ.
                </li>
                <li>Người dùng cần chủ động sao lưu dữ liệu quan trọng.</li>
              </ul>
            </section>
            <section ref={(el) => (refs.current["changes"] = el)} id="changes">
              <h2 className="text-xl font-semibold mb-2">
                9. Thay đổi điều khoản
              </h2>
              <p>
                Điều khoản dịch vụ có thể được cập nhật để phù hợp với quy định
                pháp luật, công nghệ mới hoặc nhu cầu vận hành. Mọi thay đổi sẽ
                được thông báo trên website và/hoặc qua email nếu cần thiết.
                Việc tiếp tục sử dụng dịch vụ sau khi điều khoản thay đổi đồng
                nghĩa với việc bạn chấp nhận các điều khoản mới.
              </p>
            </section>
            <section ref={(el) => (refs.current["contact"] = el)} id="contact">
              <h2 className="text-xl font-semibold mb-2">10. Liên hệ</h2>
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
