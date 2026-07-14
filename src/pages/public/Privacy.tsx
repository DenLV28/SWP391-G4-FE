import React from 'react';
import { ArrowLeft, Cookie, ShieldCheck, Share2, UserSearch } from 'lucide-react';

/**
 * Chính sách bảo mật — opened from the "Bảo mật" link in the footer.
 * Rendered inside the normal public/driver layout, so the navbar keeps working.
 */

function SectionHeading({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
        <Icon className="h-5 w-5" />
      </div>
      <h2 className="text-[22px] font-bold uppercase tracking-[0.08em] text-blue-600 sm:text-[26px]">
        {children}
      </h2>
    </div>
  );
}

export default function Privacy({ setView }: { setView: (view: string) => void }) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="bg-[#1a56db] px-4 py-16 text-center text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[760px]">
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">Chính sách bảo mật</h1>
          <p className="mx-auto mt-5 max-w-2xl text-[16px] leading-8 text-blue-100">
            Tại ParkFlow, sự riêng tư của bạn là ưu tiên hàng đầu của chúng tôi. Chúng tôi cam kết
            bảo vệ dữ liệu cá nhân của bạn với các tiêu chuẩn an ninh cao nhất.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-[900px] space-y-12 px-4 py-14 sm:px-6 lg:px-8">
        {/* Intro */}
        <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
          <p className="text-[15px] leading-8 text-slate-600">
            Chính sách bảo mật cho bạn biết chúng tôi sử dụng thông tin cá nhân của bạn thu thập
            được tại trang web này như thế nào. Xin vui lòng đọc chính sách bảo mật trước khi sử
            dụng trang web hoặc gửi bất kỳ thông tin cá nhân nào.
          </p>
          <p className="mt-5 text-[15px] leading-8 text-slate-600">
            Khi sử dụng trang web, bạn đang chấp nhận những điều được mô tả trong chính sách bảo
            mật. Những điều này có thể thay đổi, nhưng bất kỳ thay đổi nào cũng đều sẽ được đăng
            lên và thay đổi sẽ chỉ áp dụng cho các hoạt động và thông tin trên cơ sở tịnh tiến,
            chứ không phải hồi tố. Bạn nên xem lại chính sách bảo mật bất cứ khi nào bạn truy cập
            trang web để đảm bảo rằng mình hiểu các thông tin cá nhân mà bạn cung cấp sẽ được sử
            dụng như thế nào. Chính sách của chúng tôi là giữ kín thông tin cá nhân nhận được từ
            trang web hoàn toàn bí mật và chỉ dùng cho mục đích nội bộ. Chúng tôi sẽ không chia sẻ
            thông tin cá nhân của bạn với bất kỳ bên nào khác. Hãy yên tâm rằng chúng tôi tôn
            trọng sự riêng tư của bạn và xử lý dữ liệu cá nhân của bạn với sự cẩn trọng tối đa.
          </p>
        </div>

        {/* Thu thập thông tin */}
        <section className="space-y-6">
          <SectionHeading icon={UserSearch}>Thu thập thông tin cá nhân của bạn</SectionHeading>
          <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
            <p className="text-[15px] leading-8 text-slate-600">
              Chúng tôi thu thập các thông tin định danh cá nhân như tên, địa chỉ email, số điện
              thoại, v.v... khi khách truy cập tự nguyện gửi cho chúng tôi. Thông tin này chỉ được
              sử dụng để đáp ứng yêu cầu cụ thể của bạn, trừ khi bạn cho phép sử dụng nó theo cách
              khác, ví dụ thêm bạn vào danh sách gửi email của chúng tôi. Thông tin chúng tôi thu
              thập có thể bao gồm tên, tên công ty hay tổ chức, e-mail, điện thoại.
            </p>
            <p className="mt-5 text-[15px] leading-8 text-slate-600">
              Chúng tôi có thể thu thập một số thông tin nhất định về chuyến thăm của bạn, chẳng
              hạn như loại trình duyệt bạn sử dụng; ngày và thời gian bạn truy cập vào trang web;
              các trang bạn truy cập khi mở trang web và địa chỉ trang web mà từ đó bạn kết nối
              trực tiếp đến trang web của chúng tôi. Thông tin này được sử dụng để giúp cải thiện
              và quản lý trang web.
            </p>
          </div>
        </section>

        {/* Cookie */}
        <section className="space-y-6">
          <SectionHeading icon={Cookie}>Cookie / Công nghệ theo dõi</SectionHeading>
          <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-7 shadow-sm sm:p-9">
            <p className="text-[15px] leading-8 text-slate-600">
              Trang web có thể sử dụng cookie và công nghệ theo dõi tùy thuộc vào các tính năng
              được cung cấp. Cookie và công nghệ theo dõi rất hữu ích cho việc thu thập thông tin
              như loại trình duyệt và hệ điều hành, theo dõi số lượng khách truy cập vào trang
              web, và hiểu biết khách truy cập sử dụng trang web như thế nào. Cookie cũng có thể
              giúp tùy chỉnh trang web cho khách.
            </p>
            <p className="mt-5 text-[15px] leading-8 text-slate-600">
              Không thể thu thập được thông tin cá nhân thông qua cookie và công nghệ theo dõi
              khác, tuy nhiên, nếu trước đó bạn đã cung cấp thông tin cá nhân định danh, cookie có
              thể gắn với các thông tin đó. Cookie và thông tin theo dõi thu thập được có thể được
              chia sẻ với bên thứ ba. Chúng tôi cũng sử dụng mã tái tiếp thị đăng nhập khi khách
              truy cập xem các trang cụ thể, cho phép chúng tôi đưa ra các quảng cáo mục tiêu
              trong tương lai.
            </p>
          </div>
        </section>

        {/* Phân phối thông tin */}
        <section className="space-y-6">
          <SectionHeading icon={Share2}>Phân phối thông tin</SectionHeading>
          <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
            <p className="text-[15px] leading-8 text-slate-600">
              Chúng tôi xử lý tất cả dữ liệu khách hàng phù hợp với Pháp lệnh dữ liệu cá nhân
              (Riêng tư) ở Việt Nam. Chúng tôi sẽ không bao giờ bán, chia sẻ hoặc sử dụng bất kỳ
              thông tin cá nhân nào bạn cung cấp cho chúng tôi vì bất kỳ mục đích nào khác hơn là
              trao đổi với bạn về các sản phẩm, việc đặt chỗ hoặc thư mời đến các sự kiện của
              chúng tôi. Chúng tôi có thể chia sẻ thông tin với các cơ quan chính phủ hoặc các
              công ty khác hỗ trợ chúng tôi trong việc phòng chống gian lận hoặc điều tra.
            </p>
            <p className="mt-5 text-[15px] font-bold text-slate-800">Chúng tôi có thể làm như vậy khi:</p>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-[15px] leading-8 text-slate-600">
              <li>(1) được pháp luật cho phép hoặc theo yêu cầu của pháp luật;</li>
              <li>(2) cố gắng để bảo vệ hoặc ngăn chặn gian lận thực tế hoặc tiềm năng hoặc giao dịch trái phép;</li>
              <li>(3) điều tra gian lận đó đã xảy ra.</li>
            </ul>
          </div>
        </section>

        {/* Bảo mật & Câu hỏi */}
        <section className="space-y-6">
          <SectionHeading icon={ShieldCheck}>Bảo mật &amp; Câu hỏi</SectionHeading>
          <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
            <p className="text-[15px] leading-8 text-slate-600">
              Thông tin cá nhân của bạn được lưu giữ an toàn. Chỉ các nhân viên, các đại lý và nhà
              thầu được ủy quyền (người đã đồng ý giữ thông tin an toàn và bảo mật) có quyền tiếp
              cận các thông tin này. Tất cả email và bản tin từ trang web này cho phép bạn chọn
              không tiếp tục nhận thư.
            </p>
          </div>
          <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-7 shadow-sm sm:p-9">
            <h3 className="text-[18px] font-bold uppercase tracking-wide text-blue-600">Câu hỏi</h3>
            <p className="mt-3 text-[15px] leading-8 text-slate-600">
              Nếu bạn có bất kỳ câu hỏi, mối quan tâm, hoặc ý kiến gì về chính sách bảo mật của
              chúng tôi, xin vui lòng liên hệ với chúng tôi qua form{' '}
              <button
                onClick={() => setView('contact')}
                className="font-bold text-blue-600 hover:underline"
              >
                Liên hệ
              </button>{' '}
              với chúng tôi.
            </p>
          </div>
        </section>

        <div className="flex justify-center pt-2">
          <button
            onClick={() => setView('home')}
            className="flex items-center gap-2 rounded-full bg-[#1f67db] px-8 py-3 text-[14px] font-semibold text-white shadow-md transition hover:bg-[#1759c2]"
          >
            <ArrowLeft className="h-4 w-4" />
            Về trang chủ
          </button>
        </div>
      </div>
    </div>
  );
}
