import React, { useState } from 'react';
import { FileWarning, MessageSquareWarning } from 'lucide-react';
import { Feedback, validateRequired } from '../../data/mockData';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import SectionTitle from '../../components/SectionTitle';

type FeedbackPriority = 'Low' | 'Medium' | 'High';

export default function FeedbackPage({
  feedbacks,
  onSubmitFeedback,
}: {
  feedbacks: Feedback[];
  onSubmitFeedback: (fb: any) => void;
}) {
  const [type, setType] = useState('Mất thẻ xe');
  const [ticketCode, setTicketCode] = useState('TK-480921');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<FeedbackPriority>('Medium');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tempErrors: Record<string, string> = {};

    const typeErr = validateRequired(type, 'Loại phản hồi');
    if (typeErr) tempErrors.type = typeErr;

    if (!description.trim()) {
      tempErrors.description = 'Mô tả sự cố là bắt buộc.';
    } else if (description.trim().length < 10) {
      tempErrors.description = 'Mô tả phải có ít nhất 10 ký tự.';
    }

    const priorityErr = validateRequired(priority, 'Mức độ ưu tiên');
    if (priorityErr) tempErrors.priority = priorityErr;

    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      return;
    }

    setErrors({});
    onSubmitFeedback({
      type,
      ticketCode: ticketCode.trim(),
      description: description.trim(),
      priority,
    });
    setDescription('');
    alert('Đã gửi phản hồi thành công.');
  };

  return (
    <div className="space-y-6">
      <SectionTitle title="Phản hồi và hỗ trợ" subtitle="Báo lỗi mất thẻ, sai phí, khó tìm xe hoặc các vấn đề trong bãi" />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Gửi yêu cầu hỗ trợ</h3>
          <form className="space-y-3.5 text-xs" onSubmit={handleSubmit}>
            <Field label="Loại phản hồi">
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:ring-1 focus:ring-blue-600"
              >
                <option value="Mất thẻ xe">Mất thẻ xe</option>
                <option value="Sai phí">Sai phí</option>
                <option value="Không tìm thấy xe">Không tìm thấy xe</option>
                <option value="Ô bị chiếm">Ô bị chiếm (chỗ đặt trước đã bị lấy)</option>
                <option value="Sai biển số">Sai thông tin biển số từ camera</option>
                <option value="Vấn đề khác">Vấn đề khác trong bãi</option>
              </select>
              {errors.type && <span className="text-[10px] font-semibold text-rose-500">{errors.type}</span>}
            </Field>

            <Field label="Mã vé liên quan (không bắt buộc)">
              <input
                type="text"
                value={ticketCode}
                onChange={(e) => setTicketCode(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 outline-none"
                placeholder="Ví dụ: TK-480921"
              />
            </Field>

            <Field label="Mô tả sự cố">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full resize-none rounded-xl border border-slate-200 p-2.5 outline-none focus:ring-1 focus:ring-blue-600"
                placeholder="Mô tả ngắn gọn vấn đề hoặc sự cố đang gặp phải..."
              />
              {errors.description && <span className="text-[10px] font-semibold text-rose-500">{errors.description}</span>}
            </Field>

            <Field label="Mức độ ưu tiên">
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as FeedbackPriority)}
                className="w-full rounded-xl border border-slate-200 p-2.5 outline-none"
              >
                <option value="Low">Thấp, góp ý chung</option>
                <option value="Medium">Trung bình, ảnh hưởng lượt gửi hiện tại</option>
                <option value="High">Cao, cần hỗ trợ gấp</option>
              </select>
              {errors.priority && <span className="text-[10px] font-semibold text-rose-500">{errors.priority}</span>}
            </Field>

            <Field label="Tệp đính kèm (không bắt buộc)">
              <div className="cursor-not-allowed rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center">
                <FileWarning className="mx-auto h-5 w-5 text-slate-400" />
                <span className="mt-1 block text-[10px] font-bold text-slate-400">Khu vực tải ảnh</span>
                <span className="block text-[9px] text-slate-350">Luồng mô phỏng, chưa hỗ trợ tải tệp</span>
              </div>
            </Field>

            <button
              type="submit"
              className="w-full rounded-xl bg-blue-600 py-3 text-xs font-bold text-white transition hover:bg-blue-500"
            >
              Gửi yêu cầu hỗ trợ
            </button>
          </form>
        </div>

        <div className="space-y-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Lịch sử phản hồi</h3>
          {feedbacks.length > 0 ? (
            <div className="space-y-3">
              {feedbacks.map((feedback) => (
                <div key={feedback.id} className="space-y-2 rounded-xl border border-slate-100 p-4 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="block text-[9px] font-bold uppercase text-slate-400">Mã hỗ trợ</span>
                      <h4 className="text-sm font-bold text-slate-800">{feedback.feedbackCode}</h4>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <StatusBadge status={feedback.priority} />
                      <StatusBadge status={feedback.status} />
                    </div>
                  </div>

                  <div className="space-y-1.5 border-t border-slate-50 pt-2 text-slate-500">
                    <Row label="Loại" value={feedback.type} />
                    {feedback.ticketCode && <Row label="Mã vé" value={feedback.ticketCode} />}
                    <div className="mt-1 rounded-lg border border-slate-100 bg-slate-50 p-2.5 italic text-slate-650">
                      "{feedback.description}"
                    </div>
                    <span className="block pt-1 text-right text-[9px] text-slate-400">Tạo lúc: {feedback.createdAt}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={MessageSquareWarning} title="Chưa có phản hồi nào" description="Các yêu cầu bạn gửi và phản hồi từ nhân viên sẽ hiển thị tại đây." />
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">{label}</label>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span>{label}:</span>
      <span className="font-bold text-slate-700">{value}</span>
    </div>
  );
}
