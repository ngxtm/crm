'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Upload, RotateCcw, Download, AlertCircle } from 'lucide-react';

const BagImageCustomizer: React.FC = () => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [scale, setScale] = useState(1);
  const [positionX, setPositionX] = useState(0);
  const [positionY, setPositionY] = useState(0);
  const [rotation, setRotation] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string);
        setImageFile(file);
        setScale(1);
        setPositionX(0);
        setPositionY(0);
        setRotation(0);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (!uploadedImage || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Vẽ nền (túi giấy)
    const bagGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    bagGradient.addColorStop(0, '#f5f5f5');
    bagGradient.addColorStop(1, '#e8e8e8');
    ctx.fillStyle = bagGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Vẽ viền túi giấy
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(20, 30);
    ctx.lineTo(20, 320);
    ctx.quadraticCurveTo(20, 340, 40, 340);
    ctx.lineTo(360, 340);
    ctx.quadraticCurveTo(380, 340, 380, 320);
    ctx.lineTo(380, 30);
    ctx.stroke();

    // Vẽ đường gập túi
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(60, 30);
    ctx.lineTo(60, 320);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(340, 30);
    ctx.lineTo(340, 320);
    ctx.stroke();
    ctx.setLineDash([]);

    // Tải ảnh và vẽ với transform
    const img = new Image();
    img.onload = () => {
      ctx.save();

      // Áp dụng các transform
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      ctx.translate(centerX + positionX, centerY + positionY);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(scale, scale);

      // Vẽ ảnh ở giữa sau khi transform
      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      ctx.restore();
    };
    img.src = uploadedImage;
  }, [uploadedImage, scale, positionX, positionY, rotation]);

  const downloadDesign = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `bag-design-${new Date().getTime()}.png`;
    link.click();
  };

  const resetDesign = () => {
    setScale(1);
    setPositionX(0);
    setPositionY(0);
    setRotation(0);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <div className="p-3 bg-purple-500/10 rounded-lg text-purple-500">
          <Upload size={32} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">AI Dán Ảnh Lên Túi</h2>
          <p className="text-slate-500 text-sm">Upload ảnh thiết kế, tự động dán lên mẫu túi giấy</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Panel */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-base mb-3 text-slate-700 border-b pb-2">
              📤 Upload Ảnh
            </h3>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-purple-300 rounded-lg p-6 text-center cursor-pointer hover:bg-purple-50 transition"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <Upload size={32} className="mx-auto text-purple-500 mb-2" />
              <p className="text-sm font-medium text-slate-700">Chọn ảnh thiết kế</p>
              <p className="text-xs text-slate-500 mt-1">PNG, JPG, GIF (tối đa 5MB)</p>
            </div>

            {uploadedImage && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-slate-600 mb-2">Ảnh đã tải:</p>
                <img
                  src={uploadedImage}
                  alt="Uploaded"
                  className="w-full h-32 object-cover rounded-lg border border-slate-200"
                />
              </div>
            )}
          </div>

          {uploadedImage && (
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-4">
              <h3 className="font-bold text-base text-slate-700 border-b pb-2">🎨 Chỉnh Sửa</h3>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-2">
                  📏 Kích thước ({scale.toFixed(2)}x)
                </label>
                <input
                  type="range"
                  min="0.3"
                  max="2"
                  step="0.1"
                  value={scale}
                  onChange={(e) => setScale(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-2">
                  ↔️ Trái/Phải ({positionX}px)
                </label>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  step="5"
                  value={positionX}
                  onChange={(e) => setPositionX(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-2">
                  ↕️ Trên/Dưới ({positionY}px)
                </label>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  step="5"
                  value={positionY}
                  onChange={(e) => setPositionY(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-2">
                  🔄 Xoay ({rotation}°)
                </label>
                <input
                  type="range"
                  min="0"
                  max="360"
                  step="5"
                  value={rotation}
                  onChange={(e) => setRotation(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={resetDesign}
                  className="flex-1 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg transition text-sm font-medium"
                >
                  <RotateCcw size={16} />
                  Đặt lại
                </button>
                <button
                  onClick={downloadDesign}
                  className="flex-1 flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-lg transition text-sm font-medium"
                >
                  <Download size={16} />
                  Tải xuống
                </button>
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex gap-2">
              <AlertCircle size={16} className="text-blue-600 shrink-0 mt-0.5" />
              <div className="text-xs text-blue-700">
                <p className="font-semibold mb-1">💡 Mẹo:</p>
                <p>• Dùng thanh trượt để chỉnh vị trí ảnh</p>
                <p>• Kích thước lớn hơn để ảnh nổi bật</p>
                <p>• Xoay ảnh để vừa với thiết kế túi</p>
              </div>
            </div>
          </div>
        </div>

        {/* Canvas Preview */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full">
            <h3 className="font-bold text-base mb-4 text-slate-700 border-b pb-2">
              👜 Xem Trước Túi
            </h3>

            {uploadedImage ? (
              <div className="flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-4">
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={380}
                  className="max-w-full border border-slate-300 rounded-lg shadow-md"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-96 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
                <div className="text-center">
                  <Upload size={48} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-slate-500 font-medium">Upload ảnh để xem trước</p>
                </div>
              </div>
            )}

            {uploadedImage && (
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <div className="bg-purple-50 p-3 rounded border border-purple-200">
                  <p className="text-purple-700 font-semibold">📐 Kích thước hiện tại</p>
                  <p className="text-purple-600 text-lg font-bold mt-1">{(scale * 100).toFixed(0)}%</p>
                </div>
                <div className="bg-blue-50 p-3 rounded border border-blue-200">
                  <p className="text-blue-700 font-semibold">🔄 Góc xoay</p>
                  <p className="text-blue-600 text-lg font-bold mt-1">{rotation}°</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
          <h4 className="font-bold text-purple-900 mb-2">✨ Canvas Preview</h4>
          <p className="text-sm text-purple-800">Xem trước thiết kế của bạn trên mẫu túi giấy</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
          <h4 className="font-bold text-blue-900 mb-2">🎯 Dễ Chỉnh</h4>
          <p className="text-sm text-blue-800">Có thể chỉnh kích thước, vị trí, xoay ảnh theo ý thích</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
          <h4 className="font-bold text-green-900 mb-2">💾 Tải Về</h4>
          <p className="text-sm text-green-800">Tải thiết kế đã hoàn chỉnh dưới dạng ảnh PNG</p>
        </div>
      </div>
    </div>
  );
};

export default BagImageCustomizer;
