import React, { useState } from 'react';
import {
  MapPin,
  Users,
  BarChart3,
  Settings,
  Plus,
  Search,
  Filter,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { Floor, Area, Slot } from '../../data/mockData';

interface ManagerParkingLotsProps {
  floors: Floor[];
  areas: Area[];
  slots: Slot[];
  setView: (view: string) => void;
}

export default function ManagerParkingLots({
  floors = [],
  areas = [],
  slots = [],
  setView,
}: ManagerParkingLotsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLot, setSelectedLot] = useState<any>(null);

  // Mock parking lots data
  const parkingLots = [
    {
      id: 'lot-1',
      name: 'Toà nhà ParkFlow Central',
      address: '79 Đường Lê Lợi, Quận 1, TP. HCM',
      status: 'Hoạt động',
      totalSlots: 500,
      occupied: 412,
      available: 88,
      occupancyRate: 82,
      floorsCount: 7,
      cameras: 24,
      lastUpdated: '2 phút trước',
    },
    {
      id: 'lot-2',
      name: 'Bãi đỗ xe Saigon Square',
      address: '65 Nguyễn Huệ, Quận 1, TP. HCM',
      status: 'Hoạt động',
      totalSlots: 300,
      occupied: 210,
      available: 90,
      occupancyRate: 70,
      floorsCount: 5,
      cameras: 16,
      lastUpdated: '5 phút trước',
    },
    {
      id: 'lot-3',
      name: 'Bãi xe Landmark 81',
      address: '92 Nguyễn Hữu Cảnh, Bình Thạnh',
      status: 'Bảo trì',
      totalSlots: 450,
      occupied: 180,
      available: 270,
      occupancyRate: 40,
      floorsCount: 8,
      cameras: 20,
      lastUpdated: '1 giờ trước',
    },
  ];

  const filteredLots = parkingLots.filter((lot) =>
    lot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lot.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Hoạt động':
        return 'bg-green-100 text-green-700';
      case 'Bảo trì':
        return 'bg-yellow-100 text-yellow-700';
      case 'Đóng cửa':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Quản lý bãi đỗ xe</h1>
        <p className="text-gray-600 mt-1">Quản lý và giám sát các bãi đỗ xe</p>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-lg p-4 mb-6 shadow-sm border border-gray-100">
        <div className="flex gap-3 flex-col sm:flex-row">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm bãi đỗ xe..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition">
            <Filter className="h-4 w-4" />
            Lọc
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            <Plus className="h-4 w-4" />
            Thêm bãi mới
          </button>
        </div>
      </div>

      {/* Parking Lots Grid */}
      <div className="grid grid-cols-1 gap-6">
        {filteredLots.map((lot) => (
          <div
            key={lot.id}
            className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition cursor-pointer"
            onClick={() => setSelectedLot(lot)}
          >
            {/* Lot Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{lot.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{lot.address}</p>
                    </div>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(lot.status)}`}>
                  {lot.status}
                </span>
              </div>
            </div>

            {/* Lot Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 p-6 bg-gray-50 border-b border-gray-100">
              {/* Occupancy */}
              <div className="text-center">
                <p className="text-xs text-gray-600 font-medium mb-1">Tỷ lệ lắp đầy</p>
                <p className="text-2xl font-bold text-gray-900">{lot.occupancyRate}%</p>
                <div className="w-full bg-gray-300 rounded-full h-1 mt-2">
                  <div
                    className="bg-blue-600 h-1 rounded-full"
                    style={{ width: `${lot.occupancyRate}%` }}
                  ></div>
                </div>
              </div>

              {/* Occupied */}
              <div className="text-center">
                <p className="text-xs text-gray-600 font-medium mb-1">Đã lắp đầy</p>
                <p className="text-2xl font-bold text-blue-600">{lot.occupied}</p>
                <p className="text-xs text-gray-500 mt-1">chỗ</p>
              </div>

              {/* Available */}
              <div className="text-center">
                <p className="text-xs text-gray-600 font-medium mb-1">Còn trống</p>
                <p className="text-2xl font-bold text-green-600">{lot.available}</p>
                <p className="text-xs text-gray-500 mt-1">chỗ</p>
              </div>

              {/* Floors */}
              <div className="text-center">
                <p className="text-xs text-gray-600 font-medium mb-1">Số tầng</p>
                <p className="text-2xl font-bold text-gray-900">{lot.floorsCount}</p>
                <p className="text-xs text-gray-500 mt-1">tầng</p>
              </div>

              {/* Cameras */}
              <div className="text-center">
                <p className="text-xs text-gray-600 font-medium mb-1">Camera</p>
                <p className="text-2xl font-bold text-purple-600">{lot.cameras}</p>
                <p className="text-xs text-gray-500 mt-1">thiết bị</p>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 flex items-center justify-between">
              <p className="text-xs text-gray-500">Cập nhật: {lot.lastUpdated}</p>
              <div className="flex gap-2">
                <button className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition text-sm font-medium">
                  <BarChart3 className="h-4 w-4" />
                  Thống kê
                </button>
                <button className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium">
                  <Settings className="h-4 w-4" />
                  Cấu hình
                </button>
                <button className="p-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition">
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Details Panel */}
      {selectedLot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
          <div className="bg-white w-full max-w-md max-h-96 overflow-y-auto rounded-t-lg">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold">{selectedLot.name}</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Địa chỉ</p>
                <p className="font-medium">{selectedLot.address}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Trạng thái</p>
                  <p className={`inline-block px-2 py-1 rounded text-sm font-medium ${getStatusColor(selectedLot.status)}`}>
                    {selectedLot.status}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Tổng chỗ</p>
                  <p className="font-medium">{selectedLot.totalSlots}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLot(null)}
                className="w-full mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
