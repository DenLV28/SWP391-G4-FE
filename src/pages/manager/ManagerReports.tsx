import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Download,
  Filter,
  ChevronDown,
  DollarSign,
  Users,
  Car,
} from 'lucide-react';

interface ManagerReportsProps {
  setView: (view: string) => void;
}

export default function ManagerReports({ setView }: ManagerReportsProps) {
  const [timeRange, setTimeRange] = useState('month');
  const [selectedMetric, setSelectedMetric] = useState('revenue');

  // Mock report data
  const reportData = {
    revenue: {
      title: 'Doanh thu',
      unit: 'đ',
      total: 150000000,
      growth: 12.5,
      data: [
        { month: 'T1', value: 45000000 },
        { month: 'T2', value: 52000000 },
        { month: 'T3', value: 48000000 },
        { month: 'T4', value: 55000000 },
      ],
    },
    vehicles: {
      title: 'Lượt xe',
      unit: 'xe',
      total: 5432,
      growth: 8.3,
      data: [
        { month: 'T1', value: 1250 },
        { month: 'T2', value: 1380 },
        { month: 'T3', value: 1302 },
        { month: 'T4', value: 1500 },
      ],
    },
    occupancy: {
      title: 'Tỷ lệ lắp đầy trung bình',
      unit: '%',
      total: 82,
      growth: 5.2,
      data: [
        { month: 'T1', value: 78 },
        { month: 'T2', value: 80 },
        { month: 'T3', value: 82 },
        { month: 'T4', value: 85 },
      ],
    },
  };

  const current = reportData[selectedMetric as keyof typeof reportData];
  const maxValue = Math.max(...current.data.map((d) => d.value));

  // Detailed reports
  const detailedReports = [
    {
      title: 'Báo cáo doanh thu theo ngày',
      description: 'Chi tiết doanh thu từng ngày',
      rows: 10,
      icon: DollarSign,
    },
    {
      title: 'Báo cáo lưu lượng xe',
      description: 'Số lượng xe vào/ra theo giờ',
      rows: 24,
      icon: Car,
    },
    {
      title: 'Báo cáo người dùng',
      description: 'Thống kê người dùng và hoạt động',
      rows: 15,
      icon: Users,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Báo cáo & Thống kê</h1>
          <p className="text-gray-600 mt-1">Phân tích dữ liệu hệ thống bãi đỗ xe</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
          <Download className="h-4 w-4" />
          Tải báo cáo
        </button>
      </div>

      {/* Main Chart Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-8">
        {/* Controls */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex gap-3">
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="revenue">Doanh thu</option>
              <option value="vehicles">Lượt xe</option>
              <option value="occupancy">Tỷ lệ lắp đầy</option>
            </select>

            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="week">Tuần này</option>
              <option value="month">Tháng này</option>
              <option value="quarter">Quý này</option>
              <option value="year">Năm này</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className={`h-4 w-4 ${current.growth > 0 ? 'text-green-600' : 'text-red-600'}`} />
            <span className={current.growth > 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
              {current.growth > 0 ? '+' : ''}{current.growth}%
            </span>
            <span className="text-gray-600">so với tháng trước</span>
          </div>
        </div>

        {/* Chart Title & Total */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">{current.title}</h2>
          <p className="text-3xl font-bold text-blue-600 mt-2">
            {current.total.toLocaleString('vi-VN')} {current.unit}
          </p>
        </div>

        {/* Chart */}
        <div className="flex items-end justify-between gap-2 h-64 bg-gray-50 p-4 rounded-lg">
          {current.data.map((item, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div className="w-full bg-gray-200 rounded-t-lg relative flex items-end justify-center">
                <div
                  className="bg-blue-600 w-full rounded-t-lg transition-all"
                  style={{ height: `${(item.value / maxValue) * 200}px` }}
                ></div>
                <span className="absolute -top-6 text-xs font-medium text-gray-700">
                  {(item.value / 1000000).toFixed(0)}tr
                </span>
              </div>
              <span className="text-xs font-medium text-gray-600 mt-2">{item.month}</span>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center justify-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-600 rounded"></div>
            <span className="text-sm text-gray-600">{current.title}</span>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Tổng doanh thu tháng</p>
              <p className="text-2xl font-bold text-gray-900">150 triệu đ</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Car className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Tổng lượt xe</p>
              <p className="text-2xl font-bold text-gray-900">5,432</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Tỷ lệ lắp đầy TB</p>
              <p className="text-2xl font-bold text-gray-900">82%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Reports */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {detailedReports.map((report, index) => {
          const Icon = report.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-gray-100 rounded-lg">
                  <Icon className="h-6 w-6 text-gray-600" />
                </div>
                <ChevronDown className="h-5 w-5 text-gray-400" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{report.title}</h3>
              <p className="text-sm text-gray-600 mb-4">{report.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{report.rows} dòng dữ liệu</span>
                <button className="text-sm text-blue-600 hover:underline font-medium">Xem</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Export Section */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Xuất dữ liệu</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition font-medium">
            <Download className="h-4 w-4" />
            Excel
          </button>
          <button className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition font-medium">
            <Download className="h-4 w-4" />
            PDF
          </button>
          <button className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition font-medium">
            <Download className="h-4 w-4" />
            CSV
          </button>
        </div>
      </div>
    </div>
  );
}
