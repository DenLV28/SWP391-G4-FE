import React, { useState } from 'react';
import {
  Edit2,
  Trash2,
  Plus,
  Save,
  X,
  DollarSign,
  Clock,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

interface VehiclePrice {
  id: string;
  name: string;
  icon: string;
  description: string;
  prices: {
    hourly: number;
    overnight: number;
    monthly: number;
  };
  status: 'active' | 'inactive';
}

interface ManagerPricingVehiclesProps {
  setView: (view: string) => void;
}

export default function ManagerPricingVehicles({ setView }: ManagerPricingVehiclesProps) {
  const [vehicles, setVehicles] = useState<VehiclePrice[]>([
    {
      id: '1',
      name: 'Xe đạp',
      icon: '🚲',
      description: 'Xe đạp, xe scooter điện',
      prices: { hourly: 2000, overnight: 5000, monthly: 50000 },
      status: 'active',
    },
    {
      id: '2',
      name: 'Xe máy',
      icon: '🏍️',
      description: 'Xe máy 50-200cc',
      prices: { hourly: 5000, overnight: 15000, monthly: 150000 },
      status: 'active',
    },
    {
      id: '3',
      name: 'Ô tô 4-7 chỗ',
      icon: '🚗',
      description: 'Xe cá nhân, xe gia đình',
      prices: { hourly: 25000, overnight: 80000, monthly: 1200000 },
      status: 'active',
    },
    {
      id: '4',
      name: 'Xe tải',
      icon: '🚛',
      description: 'Xe tải nhẹ, xe tải trung bình',
      prices: { hourly: 40000, overnight: 120000, monthly: 2500000 },
      status: 'active',
    },
    {
      id: '5',
      name: 'Xe khách',
      icon: '🚌',
      description: 'Xe bus, xe chở khách',
      prices: { hourly: 50000, overnight: 150000, monthly: 3000000 },
      status: 'active',
    },
    {
      id: '6',
      name: 'Xe ô tô 9-29 chỗ',
      icon: '🚐',
      description: 'Xe dịch vụ, xe mini bus',
      prices: { hourly: 40000, overnight: 150000, monthly: 1800000 },
      status: 'active',
    },
  ]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState<VehiclePrice | null>(null);

  const handleEdit = (vehicle: VehiclePrice) => {
    setEditingId(vehicle.id);
    setFormData({ ...vehicle });
  };

  const handleSave = () => {
    if (formData) {
      setVehicles(vehicles.map((v) => (v.id === editingId ? formData : v)));
      setEditingId(null);
      setFormData(null);
    }
  };

  const handleDelete = (id: string) => {
    setVehicles(vehicles.filter((v) => v.id !== id));
  };

  const handleAddNew = () => {
    const newVehicle: VehiclePrice = {
      id: Date.now().toString(),
      name: 'Loại xe mới',
      icon: '🚗',
      description: 'Mô tả loại xe',
      prices: { hourly: 0, overnight: 0, monthly: 0 },
      status: 'active',
    };
    setFormData(newVehicle);
    setEditingId(null);
    setShowAddModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý giá & loại xe</h1>
          <p className="text-gray-600 mt-1">Cập nhật bảng giá và quản lý các loại xe</p>
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="h-4 w-4" />
          Thêm loại xe
        </button>
      </div>

      {/* Pricing Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Loại xe</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Mô tả</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Theo giờ</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Qua đêm</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Tháng</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Trạng thái</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {vehicles.map((vehicle) => (
                <tr key={vehicle.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{vehicle.icon}</span>
                      <span className="font-medium text-gray-900">{vehicle.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{vehicle.description}</td>
                  <td className="px-6 py-4 text-right">
                    {editingId === vehicle.id ? (
                      <input
                        type="number"
                        value={formData?.prices.hourly || 0}
                        onChange={(e) =>
                          setFormData({
                            ...formData!,
                            prices: { ...formData!.prices, hourly: parseInt(e.target.value) },
                          })
                        }
                        className="w-24 px-2 py-1 border border-gray-300 rounded text-right"
                      />
                    ) : (
                      <span className="font-medium text-gray-900">{(vehicle.prices.hourly / 1000).toFixed(0)}k</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {editingId === vehicle.id ? (
                      <input
                        type="number"
                        value={formData?.prices.overnight || 0}
                        onChange={(e) =>
                          setFormData({
                            ...formData!,
                            prices: { ...formData!.prices, overnight: parseInt(e.target.value) },
                          })
                        }
                        className="w-24 px-2 py-1 border border-gray-300 rounded text-right"
                      />
                    ) : (
                      <span className="font-medium text-gray-900">{(vehicle.prices.overnight / 1000).toFixed(0)}k</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {editingId === vehicle.id ? (
                      <input
                        type="number"
                        value={formData?.prices.monthly || 0}
                        onChange={(e) =>
                          setFormData({
                            ...formData!,
                            prices: { ...formData!.prices, monthly: parseInt(e.target.value) },
                          })
                        }
                        className="w-24 px-2 py-1 border border-gray-300 rounded text-right"
                      />
                    ) : (
                      <span className="font-medium text-gray-900">{(vehicle.prices.monthly / 1000000).toFixed(1)}tr</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {vehicle.status === 'active' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        <CheckCircle className="h-3 w-3" />
                        Hoạt động
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                        <AlertCircle className="h-3 w-3" />
                        Tạm dừng
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {editingId === vehicle.id ? (
                        <>
                          <button
                            onClick={handleSave}
                            className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition"
                            title="Lưu"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingId(null);
                              setFormData(null);
                            }}
                            className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition"
                            title="Hủy"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEdit(vehicle)}
                            className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition"
                            title="Chỉnh sửa"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(vehicle.id)}
                            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                            title="Xóa"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
        <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-blue-900">Lưu ý quan trọng</p>
          <p className="text-sm text-blue-700 mt-1">
            Các thay đổi giá sẽ được cập nhật ngay lập tức trên ứng dụng người dùng. Hãy kiểm tra kỹ trước khi lưu.
          </p>
        </div>
      </div>

      {/* Quick Info */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Loại xe hoạt động</p>
              <p className="text-2xl font-bold text-gray-900">{vehicles.filter((v) => v.status === 'active').length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Cập nhật lần cuối</p>
              <p className="text-2xl font-bold text-gray-900">Hôm nay</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Tổng loại xe</p>
              <p className="text-2xl font-bold text-gray-900">{vehicles.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && formData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingId === formData.id && !vehicles.find((v) => v.id === formData.id)
                  ? 'Thêm loại xe mới'
                  : 'Sửa loại xe'}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingId(null);
                  setFormData(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên loại xe</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="VD: Xe tải nhẹ"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Icon/Biểu tượng</label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="VD: 🚛"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="VD: Xe tải nhẹ, xe tải trung bình"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giá theo giờ (VND)</label>
                <input
                  type="number"
                  value={formData.prices.hourly}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      prices: { ...formData.prices, hourly: parseInt(e.target.value) || 0 },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giá qua đêm (VND)</label>
                <input
                  type="number"
                  value={formData.prices.overnight}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      prices: { ...formData.prices, overnight: parseInt(e.target.value) || 0 },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giá theo tháng (VND)</label>
                <input
                  type="number"
                  value={formData.prices.monthly}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      prices: { ...formData.prices, monthly: parseInt(e.target.value) || 0 },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Tạm dừng</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingId(null);
                  setFormData(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  if (formData.name && formData.prices.hourly > 0) {
                    if (!vehicles.find((v) => v.id === formData.id)) {
                      setVehicles([...vehicles, formData]);
                    } else {
                      setVehicles(vehicles.map((v) => (v.id === formData.id ? formData : v)));
                    }
                    setShowAddModal(false);
                    setEditingId(null);
                    setFormData(null);
                  } else {
                    alert('Vui lòng nhập tên loại xe và giá theo giờ');
                  }
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
