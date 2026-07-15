import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Search,
  Filter,
  ChevronRight,
  AlertCircle,
  TrendingDown,
  MessageSquare,
} from 'lucide-react';

interface Exception {
  id: string;
  type: 'payment_failed' | 'vehicle_issue' | 'system_error' | 'access_denied' | 'maintenance';
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'in_progress' | 'resolved';
  createdAt: string;
  updatedAt: string;
  location?: string;
  vehicleInfo?: string;
}

interface ManagerExceptionsProps {
  setView: (view: string) => void;
}

export default function ManagerExceptions({ setView }: ManagerExceptionsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');
  const [selectedException, setSelectedException] = useState<Exception | null>(null);

  const [exceptions, setExceptions] = useState<Exception[]>([
    {
      id: '1',
      type: 'payment_failed',
      title: 'Thanh toán thất bại',
      description: 'Lỗi xử lý thanh toán từ ví điện tử MoMo',
      severity: 'high',
      status: 'open',
      createdAt: '2 phút trước',
      updatedAt: '2 phút trước',
      vehicleInfo: 'Biển số: 51F-123.45',
    },
    {
      id: '2',
      type: 'vehicle_issue',
      title: 'Cảnh báo nhiệt độ xe',
      description: 'Xe đạp điện có nhiệt độ pin cao ở tầng 3',
      severity: 'critical',
      status: 'in_progress',
      createdAt: '15 phút trước',
      updatedAt: '5 phút trước',
      location: 'Tầng 3, Khu B',
    },
    {
      id: '3',
      type: 'system_error',
      title: 'Lỗi hệ thống camera',
      description: 'Camera tầng 5 không kết nối được',
      severity: 'high',
      status: 'in_progress',
      createdAt: '1 giờ trước',
      updatedAt: '30 phút trước',
      location: 'Tầng 5',
    },
    {
      id: '4',
      type: 'access_denied',
      title: 'Truy cập bị từ chối',
      description: 'Thẻ không hợp lệ tại cổng vào',
      severity: 'medium',
      status: 'open',
      createdAt: '3 giờ trước',
      updatedAt: '3 giờ trước',
      location: 'Cổng chính',
    },
    {
      id: '5',
      type: 'maintenance',
      title: 'Bảo trì định kỳ',
      description: 'Lên kế hoạch bảo trì hệ thống tầng 2',
      severity: 'low',
      status: 'open',
      createdAt: 'Hôm qua',
      updatedAt: 'Hôm qua',
      location: 'Tầng 2',
    },
    {
      id: '6',
      type: 'payment_failed',
      title: 'Thanh toán chậm xử lý',
      description: 'Giao dịch chờ xác nhận quá 5 phút',
      severity: 'medium',
      status: 'resolved',
      createdAt: '2 ngày trước',
      updatedAt: '1 ngày trước',
      vehicleInfo: 'Biển số: 51F-654.32',
    },
  ]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return { bg: 'bg-red-100', text: 'text-red-700', badge: 'badge-red', icon: 'icon-red' };
      case 'high':
        return { bg: 'bg-orange-100', text: 'text-orange-700', badge: 'badge-orange', icon: 'icon-orange' };
      case 'medium':
        return { bg: 'bg-yellow-100', text: 'text-yellow-700', badge: 'badge-yellow', icon: 'icon-yellow' };
      case 'low':
        return { bg: 'bg-blue-100', text: 'text-blue-700', badge: 'badge-blue', icon: 'icon-blue' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700', badge: 'badge-gray', icon: 'icon-gray' };
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' };
      case 'in_progress':
        return { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500' };
      case 'resolved':
        return { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' };
      default:
        return { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-500' };
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open':
        return 'Chưa xử lý';
      case 'in_progress':
        return 'Đang xử lý';
      case 'resolved':
        return 'Đã giải quyết';
      default:
        return status;
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'Tới hạn';
      case 'high':
        return 'Cao';
      case 'medium':
        return 'Trung bình';
      case 'low':
        return 'Thấp';
      default:
        return severity;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'payment_failed':
        return 'Thanh toán';
      case 'vehicle_issue':
        return 'Xe';
      case 'system_error':
        return 'Hệ thống';
      case 'access_denied':
        return 'Truy cập';
      case 'maintenance':
        return 'Bảo trì';
      default:
        return type;
    }
  };

  let filteredExceptions = exceptions.filter((e) => {
    const matchesSearch =
      e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || e.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: exceptions.length,
    open: exceptions.filter((e) => e.status === 'open').length,
    in_progress: exceptions.filter((e) => e.status === 'in_progress').length,
    resolved: exceptions.filter((e) => e.status === 'resolved').length,
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Quản lý ngoại lệ</h1>
        <p className="text-gray-600 mt-1">Theo dõi và xử lý các vấn đề hệ thống</p>
      </div>

      {/* Status Pills */}
      <div className="flex gap-3 mb-8 flex-wrap">
        {['all', 'open', 'in_progress', 'resolved'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status as any)}
            className={`px-4 py-2 rounded-full font-medium transition ${
              filterStatus === status
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:border-gray-400'
            }`}
          >
            {status === 'all' && `Tất cả (${statusCounts.all})`}
            {status === 'open' && `Chưa xử lý (${statusCounts.open})`}
            {status === 'in_progress' && `Đang xử lý (${statusCounts.in_progress})`}
            {status === 'resolved' && `Đã giải quyết (${statusCounts.resolved})`}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg p-4 mb-6 shadow-sm border border-gray-100">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm ngoại lệ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition">
            <Filter className="h-4 w-4" />
            Lọc
          </button>
        </div>
      </div>

      {/* Exceptions List */}
      <div className="space-y-4">
        {filteredExceptions.map((exception) => {
          const severityColor = getSeverityColor(exception.severity);
          const statusColor = getStatusColor(exception.status);

          return (
            <div
              key={exception.id}
              onClick={() => setSelectedException(exception)}
              className={`bg-white rounded-lg shadow-sm border transition cursor-pointer hover:shadow-md ${
                selectedException?.id === exception.id ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-100'
              }`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  {/* Left Section */}
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      {exception.severity === 'critical' && (
                        <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-1" />
                      )}
                      {exception.severity === 'high' && (
                        <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-1" />
                      )}
                      {exception.severity === 'medium' && (
                        <Clock className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-1" />
                      )}
                      {exception.severity === 'low' && (
                        <TrendingDown className="h-5 w-5 text-blue-600 flex-shrink-0 mt-1" />
                      )}
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{exception.title}</h3>
                        <p className="text-gray-600 mt-1">{exception.description}</p>

                        {/* Details */}
                        <div className="flex gap-4 mt-3 flex-wrap">
                          {exception.location && (
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              📍 {exception.location}
                            </span>
                          )}
                          {exception.vehicleInfo && (
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              🚗 {exception.vehicleInfo}
                            </span>
                          )}
                          <span className="text-xs text-gray-500">{exception.createdAt}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Section */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {/* Status Badge */}
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${statusColor.bg}`}>
                      <div className={`w-2 h-2 rounded-full ${statusColor.dot}`}></div>
                      <span className={`text-xs font-medium ${statusColor.text}`}>
                        {getStatusLabel(exception.status)}
                      </span>
                    </div>

                    {/* Severity Badge */}
                    <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${severityColor.bg} ${severityColor.text}`}>
                      {getSeverityLabel(exception.severity)}
                    </span>

                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Details Panel */}
      {selectedException && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-96 overflow-y-auto shadow-xl">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <h2 className="text-xl font-bold text-gray-900">{selectedException.title}</h2>
                <button
                  onClick={() => setSelectedException(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">Mô tả</p>
                <p className="text-gray-900">{selectedException.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 font-medium mb-1">Mức độ</p>
                  <p className="font-medium">{getSeverityLabel(selectedException.severity)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium mb-1">Trạng thái</p>
                  <p className="font-medium">{getStatusLabel(selectedException.status)}</p>
                </div>
              </div>

              {selectedException.location && (
                <div>
                  <p className="text-sm text-gray-600 font-medium mb-1">Vị trí</p>
                  <p className="font-medium">{selectedException.location}</p>
                </div>
              )}

              {selectedException.vehicleInfo && (
                <div>
                  <p className="text-sm text-gray-600 font-medium mb-1">Thông tin xe</p>
                  <p className="font-medium">{selectedException.vehicleInfo}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">Thời gian tạo</p>
                <p className="font-medium">{selectedException.createdAt}</p>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-gray-200 space-y-2">
                <button className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition font-medium text-sm">
                  Đang xử lý
                </button>
                <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium text-sm">
                  Đã giải quyết
                </button>
                <button className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium text-sm">
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
