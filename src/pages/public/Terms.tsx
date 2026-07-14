import React from 'react';
import { ArrowLeft } from 'lucide-react';

/**
 * Điều khoản và Điều kiện sử dụng — opened from the "Điều khoản" link in the
 * footer. Rendered inside the normal public/driver layout, so the navbar keeps
 * working while reading.
 */

const HOUSE_RULES = [
  'Cấm hút thuốc lá, sử dụng ma túy, chơi cờ bạc, đánh bài hoặc uống rượu bia, chất có cồn,...',
  'Cấm hoạt động hàng rong, xe ôm không có tổ chức và chèo kéo khách.',
  'Cấm xả rác, phóng uế, gây ồn ào mất an ninh trật tự ở các khu vực giữ xe.',
  'Cấm sửa chữa xe (trừ trường hợp đặc biệt), cấm rửa xe, giặt khăn lau chùi xe.',
  'Cấm mang vào Nhà để xe chất nổ, chất dễ cháy, chất độc hại, chất ăn mòn.',
  'Tuân theo hướng dẫn lưu thông, dừng đỗ của nhân viên và các bảng chỉ dẫn. Tốc độ hạn chế là 5km/h.',
  'Không được đỗ xe ở khu vực hạn chế, khu vực cấm đỗ hoặc lối vào.',
  'Đỗ xe đúng vị trí, ngay ngắn, đầu xe quay ra ngoài. Khóa cửa xe trước khi rời đi.',
  'Nhà để xe không chịu trách nhiệm đối với thiệt hại, mất mát phụ tùng và đồ vật để bên trong xe.',
  'Sau khi gửi xe, yêu cầu tắt máy và ra khỏi khu vực đỗ xe trong vòng 10 phút.',
  'Xe gửi phải có thẻ do Phòng Vận hành cấp. Báo ngay khi mất thẻ.',
  'Xe tải, xe chở hàng hoá không được phép đỗ trong khu vực Nhà để xe.',
  'Phòng Vận Hành có quyền cưỡng chế phương tiện đỗ sai quy định ra khỏi khu vực.',
  'Nhà để xe có quyền từ chối nhận giữ xe những trường hợp không tuân thủ hướng dẫn hoặc có nguy cơ cháy nổ.',
  'Các hoạt động quay phim, ghi hình, quảng cáo phải được sự chấp thuận.',
];

// Điều 2 — thủ tục pháp lý bắt buộc với hãng xe taxi / xe hợp đồng
const DIEU_2_ITEMS = [
  'Có hợp đồng thuê vị trí đậu với Nhà xe.',
  'Có giấy chứng nhận đăng ký kinh doanh, Giấy phép kinh doanh vận tải bằng xe ô tô trong đó có ngành nghề kinh doanh vận tải do Sở Giao Thông Vận Tải cấp.',
  'Có phù hiệu do Sở Giao Thông Vận Tải địa phương cấp.',
  'Có hợp đồng lao động với lái xe và nhân viên điều hành, trang bị đồng phục đầy đủ cho lái xe và nhân viên điều hành.',
  'Có bản cam kết nêu rõ “Chấp hành tuyệt đối các quy định của Cảng”.',
  'Có ký cam kết tuân thủ nội quy bãi xe của TCP.',
  'Có giấy phép đăng ký sử dụng tần số vô tuyến (bộ đàm).',
  'Có đăng ký màu sơn của xe, logo của hãng, có niêm yết giá công khai.',
  'Có đăng ký số lượng, loại xe, biển kiểm soát với Nhà xe.',
  'Có danh sách cán bộ điều hành và danh sách lái xe hoạt động tại bến bãi Nhà xe.',
  'Phải tuân thủ theo mọi quy định của bãi xe thuộc TCP quản lý.',
];

const DIEU_3_ITEMS = [
  'Chỉ các hãng xe có hợp đồng thuê vị trí đậu với Nhà xe mới được hoạt động khai thác vận tải hành khách tại khu vực bến bãi ô tô của Nhà xe.',
  'Không được phép tự ý nhượng quyền cho hãng xe khác đậu xe vào vị trí của mình mà không được sự đồng ý của Quản lý bến bãi của Nhà xe bằng văn bản.',
  'Đảm bảo xe có màu sơn, logo như đã đăng ký, có niên hạn sử dụng không quá sáu (06) năm tính từ năm sản xuất, xe phải còn nguyên vẹn, không bị móp méo, trầy xước nhiều, trên xe có trang bị dụng cụ thoát hiểm và/hoặc bình chữa cháy còn sử dụng được và còn hạn theo như quy định.',
  'Bên trong xe phải niêm yết khẩu hiệu ở vị trí lái xe dễ nhận biết “Tính mạng con người là trên hết” theo quy định.',
  'Cước phí vận chuyển được thông báo / niêm yết công khai.',
  'Không tuyển dụng nhân viên điều hành, lái xe có sử dụng chất ma túy, dính líu đến các tệ nạn xã hội.',
  'Quán triệt nội quy, quy định bến bãi của Nhà xe đến từng nhân viên điều hành và lái xe khi hoạt động trong khu vực bến bãi của Nhà xe.',
  'Bố trí cán bộ điều hành có đủ năng lực, nắm vững các nội quy, quy định của Nhà xe và của hãng xe của mình để phối hợp với lực lượng chức năng của Nhà xe trong việc ổn định ANTT, nề nếp, văn minh lịch sự tại khu vực bến bãi Nhà xe.',
  'Đảm bảo luôn có nhân viên điều hành và/hoặc đội trưởng trong bãi xe để điều tiết xe ra vào, quản lý nhân viên của hãng và liên hệ với Nhà để xe trong trường hợp cần thiết. Thường xuyên cập nhật thông tin liên hệ của hãng và điều hành/đội trưởng cho Quản lý bến bãi xe.',
  'Xử lý nghiêm các vi phạm của nhân viên điều hành và lái xe và có phản hồi kết quả xử lý trong vòng 30 ngày kể từ ngày nhận biên bản vi phạm do Nhà xe gửi tới.',
];

const DIEU_4_ITEMS = [
  'Phải mặc đồng phục của hãng và đeo thẻ tên theo đúng quy định của hãng, tác phong nghiêm túc, thái độ ứng xử hòa nhã, văn minh, lịch sự với hành khách.',
  'Xuất trình giấy tờ cần thiết khi có yêu cầu thanh tra, kiểm tra theo quy định của pháp luật.',
  'Được tập huấn nghiệp vụ, kiến thức ANTT xã hội, PCCC, vệ sinh môi trường và ứng xử, giao tiếp.',
  'Có trách nhiệm giữ gìn sạch sẽ cảnh quan môi trường trong khu vực bến bãi của Nhà xe.',
  'Cấm đánh nhau, hành hung, đe dọa hành khách, đồng nghiệp, nhân viên làm nhiệm vụ tại bến bãi Nhà xe.',
  'Cấm chào mời khách gây mất trật tự tại khu vực bến bãi Nhà xe.',
  'Nghiêm cấm hút thuốc lá thuộc phạm vi nhà xe TCP.',
  'Không đậu xe ở khu vực hạn chế, khu vực cấm.',
  'Nghiêm cấm việc sửa chữa xe tại bãi xe trừ trường hợp đặc biệt được sự đồng ý của văn phòng quản lý điều hành TCP.',
  'Không đánh bạc hoặc uống rượu bia chất có cồn tại bãi xe.',
  'Chủ xe/tài xế phải chịu trách nhiệm về các hư hỏng, rò rỉ nhiên liệu hoặc tai nạn do xe của mình gây ra cho người hoặc cho xe đậu tại bãi xe hoặc các khu vực có đường xe chạy.',
];

const DIEU_5_ITEMS = [
  'Có trình độ chuyên môn về vận tải từ trung cấp trở lên hoặc có trình độ từ cao đẳng trở lên đối với các chuyên ngành kinh tế, kỹ thuật khác và có thời gian công tác liên tục tại đơn vị vận tải 03 năm trở lên.',
  'Có trách nhiệm nhắc nhở lái xe có thái độ ứng xử đúng mực, văn minh, lịch sự với hành khách.',
  'Hướng dẫn hành khách đến đúng điểm đón đã được quy định và trợ giúp hành khách đặc biệt (người già, người tàn tật, trẻ em, phụ nữ có thai).',
  'Thông báo với hành khách về số tài, số điện thoại nóng cần thiết để liên lạc.',
  'Phối hợp với các lực lượng ANTT của Nhà xe trong việc hướng dẫn hành khách, điều tra khi có khiếu nại của khách hàng và có trách nhiệm ký vào biên bản vi phạm hoặc biên bản ghi nhận sự việc.',
];

const DIEU_6_ITEMS = [
  'Có giấy phép lái xe phù hợp do cơ quan có thẩm quyền cấp, có đủ sức khỏe theo quy định của Bộ Y tế.',
  'Có trách nhiệm phục vụ và giúp đỡ hành khách đi xe của mình tại điểm đón quy định.',
  'Nghiêm chỉnh chấp hành pháp luật về giao thông đường bộ và các quy định khác do Nhà xe quy định.',
  'Cấm dừng, đậu xe, đón trả khách không đúng chỗ quy định.',
  'Cấm phóng nhanh, vượt ẩu, giành giật vị trí đậu, giành giật khách với các hãng xe khác.',
  'Yêu cầu đậu xe đúng vị trí đậu được quy hoạch cho mỗi hãng với số vị trí như quy định trong hợp đồng thuê vị trí đậu xe.',
  'Cấm trộm cắp, chiếm đoạt đồ vật, tư trang của hành khách. Đối với hành lý bỏ quên trên xe, lái xe cần thông báo ngay cho hãng xe để liên lạc với hành khách trả lại hành lý bỏ quên.',
  'Cấm bỏ hành khách xuống giữa đường khi chưa đến điểm yêu cầu của khách hàng hoặc sang xe khi chưa có sự đồng ý của khách hàng.',
];

const DIEU_7_ITEMS = [
  'Cấm hành động từ chối khách hàng đi những chặng ngắn.',
  'Trên mui xe taxi phải gắn cố định hộp đèn có chữ “TAXI” hoặc “METER TAXI” bằng chữ in, nhìn rõ được cả hai phía trước và sau hộp đèn. Phía mặt ngoài hai bên thành xe phải ghi tên, số điện thoại doanh nghiệp, logo doanh nghiệp, số thứ tự xe taxi (theo số thứ tự của doanh nghiệp quản lý).',
  'Trong xe phải trang bị bộ đàm liên lạc và đồng hồ tính tiền theo đơn giá trên số km lăn bánh (theo VNĐ) được cơ quan có thẩm quyền kiểm định và kẹp chì ở vị trí hành khách và lái xe dễ quan sát, có kết nối với thiết bị in hóa đơn.',
  'Phải bật đồng hồ tính tiền trước khi xe taxi lăn bánh khi vận chuyển khách.',
  'Cấm làm giá không chạy theo đồng hồ khi chưa được sự đồng ý của hành khách.',
];

const DIEU_8_ITEMS = [
  'Hợp đồng vận tải hành khách được ký kết giữa đơn vị kinh doanh vận tải với tổ chức, cá nhân có nhu cầu thuê cả chuyến xe. Đối với mỗi chuyến xe, đơn vị kinh doanh vận tải chỉ được ký kết 01 hợp đồng vận tải hành khách.',
  'Hợp đồng vận tải hành khách phải bao gồm các nội dung cơ bản sau: thời gian thực hiện hợp đồng, địa chỉ nơi đi, nơi đến; hành trình chạy xe chiều đi và hành trình chạy xe chiều về (trong đó ghi rõ điểm khởi hành, lộ trình, các điểm đón, trả khách trên cả hai chiều, điểm kết thúc hành trình); số lượng hành khách; giá trị hợp đồng; các quyền lợi của hành khách và các dịch vụ phục vụ hành khách trên hành trình.',
  'Khi sử dụng xe ô tô có tải trọng thiết kế từ 10 hành khách trở lên, đơn vị kinh doanh vận tải phải thông báo tới Sở GTVT nơi cấp Giấy phép kinh doanh vận tải các thông tin về: hành trình (điểm khởi hành, lộ trình, điểm đón trả khách, điểm kết thúc hành trình), thời gian thực hiện hợp đồng, số lượng khách bằng văn bản hoặc email. Cự li của hành trình được xác định từ điểm khởi hành đến điểm kết thúc chuyến đi.',
  'Các hãng xe hợp đồng thông báo với Quản lý bến bãi xe về: hành trình (địa điểm khởi hành, lộ trình, điểm đón/trả khách, điểm kết thúc hành trình), thời gian thực hiện hợp đồng vận tải, cước phí vận tải.',
  'Các hãng xe hợp đồng chỉ được sử dụng các xe đã đăng ký biển số với Nhà xe.',
  'Bên ngoài thân xe phải có tên, số điện thoại của đơn vị kinh doanh vận tải hành khách ở phần đầu mặt ngoài hai bên thân xe hoặc hai bên cánh cửa xe; phải có phù hiệu “XE HỢP ĐỒNG” theo quy định.',
  'Số lượng, chất lượng, cách bố trí ghế ngồi trong xe phải đảm bảo đúng theo thiết kế của xe.',
  'Thu tiền cước vận tải theo giá trị hợp đồng đã ký kết, không được bán vé, thu tiền, xác nhận đặt chỗ cho từng hành khách đi xe dưới mọi hình thức.',
  'Khi vận tải hành khách theo hợp đồng, lái xe phải mang theo hợp đồng vận tải và danh sách hành khách.',
  'Mỗi hãng xe hợp đồng chỉ được điều tối đa 2 nhân viên đón khách ở vị trí do Nhà để xe quy định.',
  'Nghiêm cấm nhân viên hãng xe hợp đồng đón, bắt khách trong Nhà ga quốc nội, chỉ được đón, trả khách ở địa điểm quy định của Nhà xe.',
  'Cấm chèo kéo, giành giật khách của các hãng xe khác.',
  'Cấm lợi dụng việc trả khách để kết hợp đón khách.',
  'Nhân viên điều hành phải hướng dẫn khách vị trí tập kết chờ xe theo quy định và hướng dẫn khách ra xe.',
];

const DIEU_9_FORCES = [
  'Lực lượng bảo vệ',
  'Lực lượng hậu kiểm Phòng Vận Hành Nhà để xe',
  'Lực lượng cảnh sát cơ động',
  'Các lực lượng đảm bảo an ninh trật tự khác tại Nhà để xe Ga quốc nội (nếu có)',
];

function ArticleHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-12 text-[24px] font-bold tracking-tight text-slate-900 sm:text-[28px]">
      {children}
    </h2>
  );
}

function ArticleList({ items }: { items: string[] }) {
  return (
    <ol className="mt-4 list-decimal space-y-2.5 pl-6 text-[15px] leading-8 text-slate-600">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ol>
  );
}

export default function Terms({ setView }: { setView: (view: string) => void }) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="bg-gradient-to-b from-blue-50 to-slate-50 px-4 pb-16 pt-14 text-center sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[820px]">
          <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
            Điều khoản và Điều kiện sử dụng
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-[16px] leading-8 text-slate-600">
            Chào mừng bạn đến với hệ thống quản lý đỗ xe thông minh ParkFlow. Vui lòng đọc kỹ các
            quy định dưới đây để đảm bảo an toàn và trải nghiệm tốt nhất cho mọi khách hàng.
          </p>
        </div>
      </div>

      {/* Content card */}
      <div className="mx-auto max-w-[980px] px-4 pb-16 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-12">
          {/* Nội quy nhà để xe */}
          <h2 className="text-[26px] font-bold tracking-tight text-slate-900 sm:text-[30px]">
            Nội quy nhà để xe TCP
          </h2>
          <p className="mt-4 text-[15px] leading-8 text-slate-600">
            Quý khách được yêu cầu tuân thủ các nội quy sau khi ở trong khu vực Nhà để xe ga Quốc
            Nội - Cảng Hàng không Tân Sơn Nhất:
          </p>
          <ol className="mt-4 list-decimal space-y-2.5 pl-6 text-[15px] leading-8 text-slate-600">
            {HOUSE_RULES.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ol>

          {/* Điều 1 */}
          <ArticleHeading>Điều 1: Phạm vi, trách nhiệm và đối tượng áp dụng</ArticleHeading>
          <p className="mt-4 text-[15px] leading-8 text-slate-600">
            <strong className="text-slate-800">1. Phạm vi, trách nhiệm quản lý điều hành bãi xe:</strong>{' '}
            Văn bản này quy định về việc tổ chức, quản lý hoạt động kinh doanh vận hành bãi xe, xử
            lý các trường hợp vi phạm quy định về an toàn, an ninh PCCC và mỹ quan bãi xe, ban
            hành các thông báo quy định bãi xe.
          </p>
          <p className="mt-4 text-[15px] leading-8 text-slate-600">
            <strong className="text-slate-800">2. Đối tượng áp dụng:</strong> Tất cả các hoạt động
            vận tải hành khách bằng xe taxi và vận tải hành khách theo hợp đồng (sau đây gọi là xe
            hợp đồng) của các hãng xe có ký hợp đồng thuê vị trí đậu xe tại khu vực bến bãi của
            Nhà để xe Ga quốc nội (sau đây gọi tắt là Nhà xe) tại Cảng Hàng không quốc tế Tân Sơn
            Nhất (sau đây gọi tắt là Cảng).
          </p>

          {/* Điều 2 */}
          <ArticleHeading>Điều 2: Quy định sử dụng bãi xe</ArticleHeading>
          <div className="mt-5 rounded-2xl bg-blue-50/70 p-6 sm:p-7">
            <p className="text-[15px] leading-8 text-slate-600">
              Tất cả các hãng xe taxi, xe hợp đồng muốn sử dụng bãi xe của TCP phải tiến hành đầy
              đủ các thủ tục pháp lý như sau:
            </p>
            <ul className="mt-4 list-disc space-y-2.5 pl-5 text-[15px] leading-8 text-slate-600">
              {DIEU_2_ITEMS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          {/* Điều 3 */}
          <ArticleHeading>Điều 3: Quy định chung đối với các hãng xe</ArticleHeading>
          <ArticleList items={DIEU_3_ITEMS} />

          {/* Điều 4 */}
          <ArticleHeading>Điều 4: Quy định chung đối với nhân viên điều hành và lái xe</ArticleHeading>
          <ArticleList items={DIEU_4_ITEMS} />

          {/* Điều 5 */}
          <ArticleHeading>Điều 5: Quy định đối với Nhân viên điều hành</ArticleHeading>
          <ArticleList items={DIEU_5_ITEMS} />

          {/* Điều 6 */}
          <ArticleHeading>Điều 6: Quy định đối với Nhân viên lái xe</ArticleHeading>
          <ArticleList items={DIEU_6_ITEMS} />

          {/* Điều 7 */}
          <ArticleHeading>Điều 7: Quy định riêng đối với các hãng xe taxi</ArticleHeading>
          <ArticleList items={DIEU_7_ITEMS} />

          {/* Điều 8 */}
          <ArticleHeading>Điều 8: Quy định riêng đối với các hãng xe hợp đồng</ArticleHeading>
          <ArticleList items={DIEU_8_ITEMS} />

          {/* Điều 9 */}
          <ArticleHeading>Điều 9: Quy định về xử lý vi phạm</ArticleHeading>
          <div className="mt-5 rounded-2xl border border-rose-100 bg-rose-50/60 p-6 sm:p-7">
            <p className="text-[15px] leading-8 text-slate-600">
              Nhân viên điều hành, lái xe cần tuân thủ các quy định của Cảng và Nhà để xe và chịu
              sự kiểm tra, giám sát của các lực lượng An Ninh Trật Tự tại khu vực bến bãi Nhà xe
              bao gồm:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-[15px] leading-8 text-slate-600">
              {DIEU_9_FORCES.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="mt-4 text-[15px] leading-8 text-slate-600">
              Trường hợp vi phạm, các lực lượng trên có trách nhiệm nhắc nhở, lập biên bản vi phạm
              hoặc chuyển các cơ quan chức năng xử lý theo quy định của pháp luật.
            </p>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
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
