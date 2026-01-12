'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingBag, AlertCircle, Lightbulb } from 'lucide-react';

const PaperBagCalculator: React.FC = () => {
  // Khổ giấy chuẩn
  const standardPaperSizes = [
    { name: 'A4 (21x29.7cm)', width: 21, height: 29.7 },
    { name: 'A3 (29.7x42cm)', width: 29.7, height: 42 },
    { name: 'A2 (42x59.4cm)', width: 42, height: 59.4 },
    { name: 'A1 (59.4x84.1cm)', width: 59.4, height: 84.1 },
    { name: '65x86cm', width: 65, height: 86 },
    { name: '70x100cm', width: 70, height: 100 },
    { name: '79x109cm', width: 79, height: 109 },
    { name: '90x120cm', width: 90, height: 120 },
    { name: '100x140cm', width: 100, height: 140 }
  ];

  // Inputs - Kích thước túi
  const [bagSize, setBagSize] = useState({ width: 20, height: 30, depth: 10 }); // cm
  const [quantity, setQuantity] = useState(1000);
  const [selectedPaperSize, setSelectedPaperSize] = useState<string>('auto'); // 'auto' hoặc tên khổ giấy
  const [recommendedPaperSize, setRecommendedPaperSize] = useState<{ width: number; height: number; name?: string; isCustom?: boolean }>({ width: 0, height: 0 });
  const [recommendedPaperWeight, setRecommendedPaperWeight] = useState<{ weight: number; reason: string }>({ weight: 150, reason: '' });
  const [upsPerSheet, setUpsPerSheet] = useState(0); // Units per sheet
  const [layoutInfo, setLayoutInfo] = useState<{ cols: number; rows: number; rotated: boolean }>({ cols: 0, rows: 0, rotated: false });

  // Cài đặt nâng cao
  const [bleed, setBleed] = useState(0.3); // cm - Viền dự phòng
  const [gap, setGap] = useState(0.2); // cm - Khoảng cách giữa các túi
  const [margin, setMargin] = useState(0.5); // cm - Lề giấy

  // Vật liệu
  const [paperWeight, setPaperWeight] = useState(150); // gsm
  const [handleType, setHandleType] = useState<'none' | 'paper' | 'rope'>('paper'); // Loại quai
  const [isLaminated, setIsLaminated] = useState(false); // Có cán không
  const [hasBottomReinforcement, setHasBottomReinforcement] = useState(false); // Có đáy cứng

  // Đơn giá
  const [paperPricePerM2, setPaperPricePerM2] = useState(12000); // VND/m2
  const [printCostPerM2, setPrintCostPerM2] = useState(6000); // VND/m2
  const [laminateCostPerM2, setLaminateCostPerM2] = useState(5000); // VND/m2
  const [handleCostPerBag, setHandleCostPerBag] = useState(500); // Chi phí quai/túi
  const [gluingCostPerBag, setGluingCostPerBag] = useState(300); // Chi phí dán/túi
  const [bottomReinforcementCost, setBottomReinforcementCost] = useState(1000); // Chi phí đáy cứng/túi

  // Outputs
  const [result, setResult] = useState({
    flatArea: 0, // Diện tích bế túi (m2)
    totalMaterialArea: 0, // Tổng diện tích vật liệu
    totalCost: 0,
    costPerUnit: 0
  });

  useEffect(() => {
    calculate();
  }, [bagSize, quantity, paperWeight, handleType, isLaminated, hasBottomReinforcement,
      paperPricePerM2, printCostPerM2, laminateCostPerM2, handleCostPerBag, gluingCostPerBag, bottomReinforcementCost, selectedPaperSize, bleed, gap, margin]);

  const calculate = () => {
    const { width, height, depth } = bagSize;

    // Tính diện tích bế (flat pattern) cho túi giấy
    // Công thức: 2 mặt chính + 2 mặt hông + phần gấp đáy + phần viền miệng
    const mainSurface = width * height * 2; // 2 mặt chính
    const sideSurface = depth * height * 2; // 2 mặt hông
    const bottomFold = width * depth * 1.5; // Phần gấp đáy (hệ số 1.5 để tính phần dư gấp)
    const topFold = width * 3; // Phần viền miệng túi

    // Tổng diện tích bế + 15% margin cho các lưỡi dán và dư
    const flatAreaCm2 = mainSurface + sideSurface + bottomFold + topFold;
    const flatAreaWithMargin = flatAreaCm2 * 1.15; // Thêm 15% margin
    const flatAreaM2 = flatAreaWithMargin / 10000; // Convert cm2 to m2

    // Tính khổ giấy đề xuất (kích thước bế cần)
    const flatWidth = (width * 2) + (depth * 2) + 5 + (bleed * 2) + gap; // +5cm dư
    const flatHeight = height + depth + 5 + (bleed * 2) + gap; // +5cm dư

    // Tìm khổ giấy phù hợp (bao gồm A-series và khổ chuẩn)
    const standardPaperSizes = [
      { w: 21, h: 29.7, name: 'A4' },
      { w: 29.7, h: 42, name: 'A3' },
      { w: 42, h: 59.4, name: 'A2' },
      { w: 59.4, h: 84.1, name: 'A1' },
      { w: 65, h: 86, name: '65x86 cm' },
      { w: 70, h: 100, name: '70x100 cm' },
      { w: 79, h: 109, name: '79x109 cm' },
      { w: 90, h: 120, name: '90x120 cm' },
      { w: 100, h: 140, name: '100x140 cm' }
    ];

    let recommendedSize = { width: flatWidth, height: flatHeight, name: 'Đặc biệt', isCustom: true };

    // Nếu người dùng chọn khổ giấy thủ công, sử dụng khổ đã chọn
    if (selectedPaperSize !== 'auto') {
      const selectedSize = standardPaperSizes.find(s => s.name === selectedPaperSize);
      if (selectedSize) {
        recommendedSize = { width: selectedSize.w, height: selectedSize.h, name: selectedSize.name, isCustom: false };
      }
    } else {
      // Auto-suggest: Tìm khổ giấy phù hợp nhỏ nhất
      for (const size of standardPaperSizes) {
        if ((flatWidth <= size.w && flatHeight <= size.h) || (flatWidth <= size.h && flatHeight <= size.w)) {
          recommendedSize = { width: size.w, height: size.h, name: size.name, isCustom: false };
          break;
        }
      }
    }
    setRecommendedPaperSize(recommendedSize);

    // Gợi ý định lượng giấy dựa trên kích thước túi
    const bagVolume = width * height * depth; // cm3
    const maxDimension = Math.max(width, height);

    let suggestedWeight = 150;
    let reason = '';

    if (bagVolume > 30000 || maxDimension > 40) {
      suggestedWeight = 250;
      reason = 'Túi lớn, cần giấy dày 250gsm để chịu lực tốt';
    } else if (bagVolume > 15000 || maxDimension > 30) {
      suggestedWeight = 200;
      reason = 'Túi trung bình, giấy 200gsm là lựa chọn tối ưu';
    } else if (bagVolume > 5000 || maxDimension > 20) {
      suggestedWeight = 150;
      reason = 'Túi vừa, giấy 150gsm vừa đủ và tiết kiệm';
    } else {
      suggestedWeight = 120;
      reason = 'Túi nhỏ, giấy 120gsm nhẹ và kinh tế';
    }

    setRecommendedPaperWeight({ weight: suggestedWeight, reason });

    // Tính số túi bế được trên 1 tờ giấy
    if (recommendedSize.width > 0 && recommendedSize.height > 0) {
      // Usable paper area (subtract margins)
      const usableWidth = recommendedSize.width - (margin * 2);
      const usableHeight = recommendedSize.height - (margin * 2);

      // Kích thước bế mỗi túi (có margin)
      const bagFlatWidth = flatWidth;
      const bagFlatHeight = flatHeight;

      // Thử 2 hướńg bố́ trí
      const option1_cols = Math.floor(usableWidth / bagFlatWidth);
      const option1_rows = Math.floor(usableHeight / bagFlatHeight);
      const option1_ups = option1_cols * option1_rows;

      const option2_cols = Math.floor(usableWidth / bagFlatHeight);
      const option2_rows = Math.floor(usableHeight / bagFlatWidth);
      const option2_ups = option2_cols * option2_rows;

      const bestUps = Math.max(option1_ups, option2_ups);
      const isRotated = option2_ups > option1_ups;

      setUpsPerSheet(bestUps);
      setLayoutInfo({
        cols: isRotated ? option2_cols : option1_cols,
        rows: isRotated ? option2_rows : option1_rows,
        rotated: isRotated
      });
    } else {
      setUpsPerSheet(0);
      setLayoutInfo({ cols: 0, rows: 0, rotated: false });
    }

    // Tổng diện tích vật liệu cần (có bù hao 5%)
    const wastePercentage = 1.05;
    const totalMaterialArea = flatAreaM2 * quantity * wastePercentage;

    // Tính chi phí vật liệu
    const paperCost = totalMaterialArea * paperPricePerM2;
    const printingCost = totalMaterialArea * printCostPerM2;
    const laminatingCost = isLaminated ? totalMaterialArea * laminateCostPerM2 : 0;

    // Tính chi phí gia công
    const handleCost = handleType !== 'none' ? quantity * handleCostPerBag : 0;
    const gluingCost = quantity * gluingCostPerBag;
    const reinforcementCost = hasBottomReinforcement ? quantity * bottomReinforcementCost : 0;

    const total = paperCost + printingCost + laminatingCost + handleCost + gluingCost + reinforcementCost;

    setResult({
      flatArea: flatAreaM2,
      totalMaterialArea: totalMaterialArea,
      totalCost: total,
      costPerUnit: total / quantity
    });
  };

  const formatVND = (num: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);

  const handleTypeInfo = {
    'none': 'Không quai',
    'paper': 'Quai giấy xoắn',
    'rope': 'Quai dây PP'
  };

  return (
    <div className="p-6 max-w-full mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <div className="p-3 bg-green-500/10 rounded-lg text-green-600">
            <ShoppingBag size={32} />
        </div>
        <div>
            <h2 className="text-2xl font-bold text-slate-800">Tính Giá Túi Giấy</h2>
            <p className="text-slate-500 text-sm">Tính toán diện tích bế và chi phí sản xuất túi giấy kraft</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Input Panel - Left */}
        <div className="xl:col-span-5 space-y-4">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-base mb-3 text-slate-700 border-b pb-2">1. Kích thước túi (cm)</h3>
                <div className="grid grid-cols-3 gap-3 mb-3">
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Rộng (W)</label>
                        <input
                          type="number"
                          value={bagSize.width}
                          onChange={e => setBagSize({...bagSize, width: Number(e.target.value)})}
                          className="w-full p-2 border rounded"
                          placeholder="Rộng"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Cao (H)</label>
                        <input
                          type="number"
                          value={bagSize.height}
                          onChange={e => setBagSize({...bagSize, height: Number(e.target.value)})}
                          className="w-full p-2 border rounded"
                          placeholder="Cao"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Hông (D)</label>
                        <input
                          type="number"
                          value={bagSize.depth}
                          onChange={e => setBagSize({...bagSize, depth: Number(e.target.value)})}
                          className="w-full p-2 border rounded"
                          placeholder="Hông"
                        />
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-3">
                    <div>
                         <label className="block text-xs font-medium text-slate-500 mb-1">Số lượng túi</label>
                         <input
                           type="number"
                           value={quantity}
                           onChange={e => setQuantity(Number(e.target.value))}
                           className="w-full p-2 border rounded"
                         />
                    </div>
                    <div>
                         <label className="block text-xs font-medium text-slate-500 mb-1">Chọn khổ giấy</label>
                         <select
                           value={selectedPaperSize}
                           onChange={e => setSelectedPaperSize(e.target.value)}
                           className="w-full p-2 border rounded bg-white"
                         >
                           <option value="auto">🤖 Tự động gợi ý</option>
                           <option value="A4">A4 (21x29.7cm)</option>
                           <option value="A3">A3 (29.7x42cm)</option>
                           <option value="A2">A2 (42x59.4cm)</option>
                           <option value="A1">A1 (59.4x84.1cm)</option>
                           <option value="65x86 cm">65x86 cm</option>
                           <option value="70x100 cm">70x100 cm</option>
                           <option value="79x109 cm">79x109 cm</option>
                           <option value="90x120 cm">90x120 cm</option>
                           <option value="100x140 cm">100x140 cm</option>
                         </select>
                    </div>
                </div>

                {/* Gợi ý khổ giấy */}
                {recommendedPaperSize.width > 0 && (
                  <div className={`mt-3 rounded-lg p-3 ${
                    recommendedPaperSize.isCustom
                      ? 'bg-red-50 border border-red-200'
                      : 'bg-emerald-50 border border-emerald-200'
                  }`}>
                    <div className="flex items-start gap-2">
                      <Lightbulb className={`shrink-0 mt-0.5 ${
                        recommendedPaperSize.isCustom ? 'text-red-600' : 'text-emerald-600'
                      }`} size={18} />
                      <div className="flex-1">
                        <p className={`text-sm font-semibold mb-1 ${
                          recommendedPaperSize.isCustom ? 'text-red-800' : 'text-emerald-800'
                        }`}>
                          {recommendedPaperSize.isCustom ? '⚠️ Khổ giấy đặc biệt:' : '💡 Khổ giấy đề xuất:'}
                        </p>
                        <p className={`text-lg font-bold ${
                          recommendedPaperSize.isCustom ? 'text-red-900' : 'text-emerald-900'
                        }`}>
                          {recommendedPaperSize.name || `${Math.ceil(recommendedPaperSize.width)} x ${Math.ceil(recommendedPaperSize.height)} cm`}
                        </p>
                        <p className={`text-xs mt-1 ${
                          recommendedPaperSize.isCustom ? 'text-red-700' : 'text-emerald-700'
                        }`}>
                          {recommendedPaperSize.isCustom
                            ? 'Cần đặt khổ giấy đặc biệt - không có khổ chuẩn phù hợp'
                            : 'Khổ giấy chuẩn phù hợp nhất để bế túi này'}
                        </p>
                        {upsPerSheet > 0 && (
                          <div className={`mt-2 pt-2 border-t ${
                            recommendedPaperSize.isCustom ? 'border-red-200' : 'border-emerald-200'
                          }`}>
                            <p className={`text-sm font-bold ${
                              recommendedPaperSize.isCustom ? 'text-red-800' : 'text-emerald-800'
                            }`}>
                              🛍️ Bình file: <span className="text-xl">{upsPerSheet}</span> túi/tờ
                            </p>
                            <p className={`text-xs mt-1 ${
                              recommendedPaperSize.isCustom ? 'text-red-600' : 'text-emerald-600'
                            }`}>
                              Cần {Math.ceil(quantity / upsPerSheet)} tờ giấy để bế {quantity} túi
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Gợi ý định lượng giấy */}
                {recommendedPaperWeight.reason && (
                  <div className="mt-3 bg-teal-50 border border-teal-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <ShoppingBag className="text-teal-600 shrink-0 mt-0.5" size={18} />
                      <div>
                        <p className="text-sm font-semibold text-teal-800 mb-1">📄 Định lượng giấy đề xuất:</p>
                        <p className="text-lg font-bold text-teal-900">
                          {recommendedPaperWeight.weight} gsm
                          <span className="text-sm font-normal ml-2">
                            (Giấy kraft)
                          </span>
                        </p>
                        <p className="text-xs text-teal-700 mt-1">
                          {recommendedPaperWeight.reason}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-base mb-3 text-slate-700 border-b pb-2">2. Vật liệu & Gia công</h3>
                <div className="grid grid-cols-2 gap-3 mb-3">
                     <div>
                         <label className="block text-xs font-medium text-slate-500 mb-1">Định lượng giấy (gsm)</label>
                         <input
                           type="number"
                           value={paperWeight}
                           onChange={e => setPaperWeight(Number(e.target.value))}
                           className="w-full p-2 border rounded"
                           placeholder="150, 200, 250..."
                         />
                    </div>
                    <div>
                         <label className="block text-xs font-medium text-slate-500 mb-1">Loại quai</label>
                         <select
                           value={handleType}
                           onChange={e => setHandleType(e.target.value as 'none' | 'paper' | 'rope')}
                           className="w-full p-2 border rounded"
                         >
                           <option value="none">Không quai</option>
                           <option value="paper">Quai giấy xoắn</option>
                           <option value="rope">Quai dây PP</option>
                         </select>
                         <p className="text-xs text-slate-400 mt-1">{handleTypeInfo[handleType]}</p>
                    </div>
                </div>
                <div className="space-y-2">
                     <div className="flex items-center gap-2">
                         <input
                           type="checkbox"
                           id="laminated"
                           checked={isLaminated}
                           onChange={e => setIsLaminated(e.target.checked)}
                           className="w-4 h-4"
                         />
                         <label htmlFor="laminated" className="text-sm text-slate-700">Có cán màng bóng/mờ</label>
                     </div>
                     <div className="flex items-center gap-2">
                         <input
                           type="checkbox"
                           id="bottomReinforcement"
                           checked={hasBottomReinforcement}
                           onChange={e => setHasBottomReinforcement(e.target.checked)}
                           className="w-4 h-4"
                         />
                         <label htmlFor="bottomReinforcement" className="text-sm text-slate-700">Có đáy cứng tăng cường</label>
                     </div>
                </div>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-base mb-3 text-slate-700 border-b pb-2">📐 Cài Đặt Nâng Cao</h3>
                <div className="space-y-3">
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">
                          Tràn lề - Bleed (cm) - <span className="text-slate-400">Viền dự phòng</span>
                        </label>
                        <input
                          type="number"
                          value={bleed}
                          onChange={e => setBleed(Number(e.target.value))}
                          className="w-full p-2 border rounded"
                          step="0.1"
                          min="0"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">
                          Khe hở (cm) - <span className="text-slate-400">Khoảng cách giữa các con</span>
                        </label>
                        <input
                          type="number"
                          value={gap}
                          onChange={e => setGap(Number(e.target.value))}
                          className="w-full p-2 border rounded"
                          step="0.1"
                          min="0"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">
                          Lề giấy (cm) - <span className="text-slate-400">Lề an toàn</span>
                        </label>
                        <input
                          type="number"
                          value={margin}
                          onChange={e => setMargin(Number(e.target.value))}
                          className="w-full p-2 border rounded"
                          step="0.1"
                          min="0"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-base mb-3 text-slate-700 border-b pb-2">3. Đơn giá sản xuất</h3>
                <div className="grid grid-cols-2 gap-3">
                     <div>
                         <label className="block text-xs font-medium text-slate-500 mb-1">Giá giấy / m² (VNĐ)</label>
                         <input
                           type="number"
                           value={paperPricePerM2}
                           onChange={e => setPaperPricePerM2(Number(e.target.value))}
                           className="w-full p-2 border rounded"
                         />
                    </div>
                    <div>
                         <label className="block text-xs font-medium text-slate-500 mb-1">Công in / m² (VNĐ)</label>
                         <input
                           type="number"
                           value={printCostPerM2}
                           onChange={e => setPrintCostPerM2(Number(e.target.value))}
                           className="w-full p-2 border rounded"
                         />
                    </div>
                    <div>
                         <label className="block text-xs font-medium text-slate-500 mb-1">Cán màng / m² (VNĐ)</label>
                         <input
                           type="number"
                           value={laminateCostPerM2}
                           onChange={e => setLaminateCostPerM2(Number(e.target.value))}
                           className="w-full p-2 border rounded"
                         />
                    </div>
                    <div>
                         <label className="block text-xs font-medium text-slate-500 mb-1">Công quai / túi (VNĐ)</label>
                         <input
                           type="number"
                           value={handleCostPerBag}
                           onChange={e => setHandleCostPerBag(Number(e.target.value))}
                           className="w-full p-2 border rounded"
                         />
                    </div>
                    <div>
                         <label className="block text-xs font-medium text-slate-500 mb-1">Công dán / túi (VNĐ)</label>
                         <input
                           type="number"
                           value={gluingCostPerBag}
                           onChange={e => setGluingCostPerBag(Number(e.target.value))}
                           className="w-full p-2 border rounded"
                         />
                    </div>
                    <div>
                         <label className="block text-xs font-medium text-slate-500 mb-1">Đáy cứng / túi (VNĐ)</label>
                         <input
                           type="number"
                           value={bottomReinforcementCost}
                           onChange={e => setBottomReinforcementCost(Number(e.target.value))}
                           className="w-full p-2 border rounded"
                         />
                    </div>
                </div>
            </div>
        </div>

        {/* Middle Column - Visualization & 3D */}
        <div className="xl:col-span-4 space-y-4">
            {/* Visualization bố trí trên tờ giấy */}
            {upsPerSheet > 0 && layoutInfo.cols > 0 && (
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-base mb-3 text-slate-700 border-b pb-2">📐 Bố trí {recommendedPaperSize.name}</h3>
                <div className="bg-slate-50 rounded-lg p-3">
                  <svg width="100%" height="280" viewBox="0 0 400 400" className="mx-auto" style={{maxWidth: '100%'}}>
                    {/* Tờ giấy nền */}
                    <rect x="20" y="20" width="360" height="360" fill="#fff" stroke="#16a34a" strokeWidth="3" rx="2"/>
                    <text x="200" y="15" textAnchor="middle" fill="#15803d" fontSize="11" fontWeight="bold">
                      {recommendedPaperSize.name} - {layoutInfo.cols}×{layoutInfo.rows} = {upsPerSheet} túi/tờ
                    </text>

                    {/* Vẽ grid các túi */}
                    {Array.from({ length: layoutInfo.rows }).map((_, rowIdx) =>
                      Array.from({ length: layoutInfo.cols }).map((_, colIdx) => {
                        const bagW = 360 / layoutInfo.cols - 4;
                        const bagH = 360 / layoutInfo.rows - 4;
                        const x = 20 + (colIdx * (360 / layoutInfo.cols)) + 2;
                        const y = 20 + (rowIdx * (360 / layoutInfo.rows)) + 2;

                        return (
                          <g key={`${rowIdx}-${colIdx}`}>
                            <rect
                              x={x}
                              y={y}
                              width={bagW}
                              height={bagH}
                              fill="#dcfce7"
                              stroke="#16a34a"
                              strokeWidth="1.5"
                              opacity="0.9"
                            />
                            <text
                              x={x + bagW/2}
                              y={y + bagH/2}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fill="#166534"
                              fontSize="10"
                              fontWeight="bold"
                            >
                              {rowIdx * layoutInfo.cols + colIdx + 1}
                            </text>
                          </g>
                        );
                      })
                    )}

                    {/* Label kích thước */}
                    <text x="200" y="395" textAnchor="middle" fill="#15803d" fontSize="10">
                      {layoutInfo.rotated ? '🔄 Xoay tối ưu' : '✓ Chuẩn'}
                    </text>
                  </svg>
                  <div className="mt-2 text-center text-xs text-slate-600">
                    <p className="font-semibold">Mỗi ô = 1 túi ({bagSize.width}×{bagSize.height}×{bagSize.depth}cm)</p>
                  </div>
                </div>
              </div>
            )}

            {/* Hình vẽ demo túi */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-base mb-3 text-slate-700 border-b pb-2">Mô hình túi 3D</h3>
                <div className="bg-slate-50 rounded-lg p-4 flex items-center justify-center">
                  <svg width="100%" height="180" viewBox="0 0 300 280" className="mx-auto">
                    {/* Túi giấy 3D view */}
                    <defs>
                      <linearGradient id="bagGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style={{stopColor: '#66bb6a', stopOpacity: 0.8}} />
                        <stop offset="100%" style={{stopColor: '#43a047', stopOpacity: 0.9}} />
                      </linearGradient>
                      <linearGradient id="bagGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style={{stopColor: '#81c784', stopOpacity: 0.7}} />
                        <stop offset="100%" style={{stopColor: '#66bb6a', stopOpacity: 0.8}} />
                      </linearGradient>
                      <linearGradient id="bagGrad3" x1="100%" y1="0%" x2="0%" y2="0%">
                        <stop offset="0%" style={{stopColor: '#2e7d32', stopOpacity: 0.9}} />
                        <stop offset="100%" style={{stopColor: '#43a047', stopOpacity: 0.8}} />
                      </linearGradient>
                    </defs>

                    {/* Mặt chính túi */}
                    <rect x="90" y="60" width="120" height="150" fill="url(#bagGrad1)" stroke="#1b5e20" strokeWidth="2" rx="2"/>

                    {/* Mặt bên trái */}
                    <path d="M 90 60 L 70 75 L 70 210 L 90 210 Z" fill="url(#bagGrad2)" stroke="#1b5e20" strokeWidth="2"/>

                    {/* Mặt bên phải */}
                    <path d="M 210 60 L 230 75 L 230 210 L 210 210 Z" fill="url(#bagGrad3)" stroke="#1b5e20" strokeWidth="2"/>

                    {/* Đáy túi */}
                    <path d="M 90 210 L 70 225 L 150 240 L 230 225 L 210 210 Z" fill="#1b5e20" fillOpacity="0.6" stroke="#1b5e20" strokeWidth="2"/>

                    {/* Quai túi */}
                    <path d="M 110 60 Q 110 30 150 30 Q 190 30 190 60" fill="none" stroke="#1b5e20" strokeWidth="3" strokeLinecap="round"/>
                    <circle cx="110" cy="60" r="4" fill="#1b5e20"/>
                    <circle cx="190" cy="60" r="4" fill="#1b5e20"/>

                    {/* Labels */}
                    <text x="150" y="135" fill="#fff" fontSize="12" fontWeight="bold" textAnchor="middle">H: {bagSize.height}</text>
                    <text x="235" y="145" fill="#2e7d32" fontSize="11" fontWeight="bold">D: {bagSize.depth}</text>
                    <text x="150" y="255" fill="#2e7d32" fontSize="11" fontWeight="bold" textAnchor="middle">W: {bagSize.width} cm</text>
                  </svg>
                </div>

                {/* Flat pattern preview */}
                <div className="mt-4 bg-slate-50 rounded-lg p-6">
                  <p className="text-sm font-semibold text-slate-700 mb-3 text-center">Mẫu bế phẳng (Flat Pattern)</p>
                  <svg width="300" height="200" viewBox="0 0 300 200" className="mx-auto">
                    {/* Main panels */}
                    <rect x="30" y="50" width="35" height="100" fill="#c8e6c9" stroke="#43a047" strokeWidth="2"/>
                    <rect x="65" y="50" width="70" height="100" fill="#a5d6a7" stroke="#43a047" strokeWidth="2"/>
                    <rect x="135" y="50" width="35" height="100" fill="#c8e6c9" stroke="#43a047" strokeWidth="2"/>
                    <rect x="170" y="50" width="70" height="100" fill="#a5d6a7" stroke="#43a047" strokeWidth="2"/>
                    <rect x="240" y="50" width="35" height="100" fill="#c8e6c9" stroke="#43a047" strokeWidth="2"/>

                    {/* Bottom fold */}
                    <rect x="65" y="150" width="70" height="30" fill="#81c784" stroke="#43a047" strokeWidth="2"/>
                    <rect x="170" y="150" width="70" height="30" fill="#81c784" stroke="#43a047" strokeWidth="2"/>

                    {/* Top fold */}
                    <rect x="65" y="20" width="70" height="30" fill="#e8f5e9" stroke="#43a047" strokeWidth="1.5" strokeDasharray="3"/>
                    <rect x="170" y="20" width="70" height="30" fill="#e8f5e9" stroke="#43a047" strokeWidth="1.5" strokeDasharray="3"/>

                    {/* Glue tabs */}
                    <path d="M 30 50 L 20 55 L 20 145 L 30 150" fill="#dcedc8" stroke="#43a047" strokeWidth="1" strokeDasharray="2"/>
                    <path d="M 275 50 L 285 55 L 285 145 L 275 150" fill="#dcedc8" stroke="#43a047" strokeWidth="1" strokeDasharray="2"/>

                    {/* Labels */}
                    <text x="100" y="105" fill="#2e7d32" fontSize="10" fontWeight="bold" textAnchor="middle">Mặt 1</text>
                    <text x="205" y="105" fill="#2e7d32" fontSize="10" fontWeight="bold" textAnchor="middle">Mặt 2</text>
                    <text x="47" y="105" fill="#2e7d32" fontSize="9" textAnchor="middle">Hông</text>
                    <text x="152" y="105" fill="#2e7d32" fontSize="9" textAnchor="middle">Hông</text>
                    <text x="100" y="168" fill="#1b5e20" fontSize="9" fontWeight="bold" textAnchor="middle">Đáy</text>
                  </svg>
                </div>
            </div>
        </div>

        {/* Result Panel - Right */}
        <div className="xl:col-span-3">
            <div className="bg-gradient-to-br from-green-900 to-green-700 text-white p-5 rounded-xl shadow-lg sticky top-6">
                <h3 className="text-lg font-bold mb-4 border-b border-green-600 pb-3">Kết quả tính giá</h3>

                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-green-200 text-xs">Diện tích bế / túi</span>
                        <span className="text-xl font-bold text-white">{result.flatArea.toFixed(3)} <span className="text-xs text-green-300 font-normal">m²</span></span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-green-200 text-xs">Tổng diện tích vật liệu</span>
                        <span className="text-lg font-bold">{result.totalMaterialArea.toFixed(2)} <span className="text-xs text-green-300 font-normal">m²</span></span>
                    </div>

                    <div className="border-t border-green-600 pt-4 mt-4">
                        <div className="mb-2 text-green-200 text-xs">Tổng chi phí ước tính</div>
                        <div className="text-2xl font-bold text-yellow-300">{formatVND(result.totalCost)}</div>
                    </div>

                    <div className="bg-green-800/50 p-3 rounded-lg mt-3">
                        <div className="text-green-200 text-xs mb-1">Giá thành mỗi túi</div>
                        <div className="text-lg font-bold text-white">{formatVND(result.costPerUnit)}</div>
                    </div>
                </div>

                <div className="mt-6 flex items-start gap-2 bg-green-800/30 p-3 rounded text-xs text-green-100">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    <span>Giá ước tính. Chưa bao gồm VAT, vận chuyển.</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default PaperBagCalculator;
