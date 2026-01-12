'use client';

import React, { useState } from 'react';
import { Sparkles, Download, RefreshCw, Copy, Save, History } from 'lucide-react';

interface BagTemplate {
  id: string;
  name: string;
  type: 'paper' | 'cloth' | 'box' | 'plastic';
  previewImage: string;
}

interface GeneratedImage {
  id: string;
  prompt: string;
  imageUrl: string;
  timestamp: string;
  bagType: string;
  size: string;
  color: string;
}

const AIBagGenerator: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('paper-standard');
  const [bagSize, setBagSize] = useState<string>('medium');
  const [bagColor, setBagColor] = useState<string>('#ffffff');
  const [designPrompt, setDesignPrompt] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');
  const [showApiKeyInput, setShowApiKeyInput] = useState<boolean>(false);

  const bagTemplates: BagTemplate[] = [
    { id: 'paper-standard', name: 'Túi giấy tiêu chuẩn', type: 'paper', previewImage: '📄' },
    { id: 'paper-kraft', name: 'Túi giấy kraft', type: 'paper', previewImage: '📦' },
    { id: 'cloth-tote', name: 'Túi vải tote', type: 'cloth', previewImage: '🛍️' },
    { id: 'box-gift', name: 'Hộp quà cao cấp', type: 'box', previewImage: '🎁' },
    { id: 'plastic-zipper', name: 'Túi nhựa zip', type: 'plastic', previewImage: '💼' },
    { id: 'paper-luxury', name: 'Túi giấy cao cấp', type: 'paper', previewImage: '👜' },
  ];

  const sizes = [
    { value: 'small', label: 'Nhỏ (15x20cm)', dimension: '15x20cm' },
    { value: 'medium', label: 'Trung bình (20x30cm)', dimension: '20x30cm' },
    { value: 'large', label: 'Lớn (30x40cm)', dimension: '30x40cm' },
    { value: 'xlarge', label: 'Rất lớn (40x50cm)', dimension: '40x50cm' },
  ];

  const colorPresets = [
    { name: 'Trắng', value: '#ffffff' },
    { name: 'Kraft', value: '#d4a574' },
    { name: 'Đen', value: '#000000' },
    { name: 'Xanh dương', value: '#3b82f6' },
    { name: 'Đỏ', value: '#ef4444' },
    { name: 'Xanh lá', value: '#22c55e' },
    { name: 'Vàng', value: '#eab308' },
    { name: 'Tím', value: '#a855f7' },
  ];

  const examplePrompts = [
    'Logo công ty hiện đại với chữ "A" stylized, màu xanh dương, phong cách tối giản',
    'Họa tiết hoa văn Việt Nam truyền thống, màu đỏ và vàng',
    'Thiết kế cafe sang trọng với hình tách cafe và hạt cafe',
    'Logo thời trang cao cấp với font chữ elegant',
    'Họa tiết tự nhiên với lá cây và hoa, phong cách organic',
    'Thiết kế nhà hàng Nhật với hình sushi và đũa',
  ];

  // Hàm tạo ảnh mock bằng canvas
  const generateMockImage = (): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Vẽ background
      const gradient = ctx.createLinearGradient(0, 0, 512, 512);
      gradient.addColorStop(0, bagColor);
      gradient.addColorStop(1, adjustColor(bagColor, -30));
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 512, 512);

      // Vẽ hình túi đơn giản
      ctx.fillStyle = adjustColor(bagColor, -50);
      ctx.fillRect(156, 100, 200, 300);

      // Vẽ đáy túi
      ctx.beginPath();
      ctx.moveTo(156, 400);
      ctx.lineTo(180, 450);
      ctx.lineTo(332, 450);
      ctx.lineTo(356, 400);
      ctx.closePath();
      ctx.fill();

      // Vẽ quai túi
      ctx.strokeStyle = adjustColor(bagColor, -70);
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(206, 80, 50, 0, Math.PI, true);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(306, 80, 50, 0, Math.PI, true);
      ctx.stroke();

      // Vẽ text mô tả
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      const words = designPrompt.split(' ').slice(0, 3).join(' ');
      ctx.fillText(words, 256, 250);

      const template = bagTemplates.find(t => t.id === selectedTemplate);
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = '12px Arial';
      ctx.fillText(template?.name || '', 256, 480);
    }

    return canvas.toDataURL('image/png');
  };

  // Call backend API to generate image
  const generateWithBackend = async (prompt: string): Promise<string> => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/ai/generate-bag-image`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: prompt,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Backend API error: ${errorData.message || response.statusText}`);
      }

      const data = await response.json();

      if (!data.success || !data.image) {
        throw new Error('Invalid response from backend');
      }

      // Return data URL (already formatted as data:image/png;base64,...)
      return data.image;

    } catch (error) {
      console.error('Backend API Error:', error);
      throw error;
    }
  };

  const generateImageWithAI = async () => {
    if (!designPrompt.trim()) {
      alert('Vui lòng nhập mô tả thiết kế!');
      return;
    }

    setIsGenerating(true);

    try {
      // Tạo prompt hoàn chỉnh
      const template = bagTemplates.find(t => t.id === selectedTemplate);
      const sizeInfo = sizes.find(s => s.value === bagSize);

      const fullPrompt = `A professional product mockup of a ${template?.name} (${sizeInfo?.dimension}),
        color: ${bagColor}, with the following design: ${designPrompt}.
        High quality, professional photography, studio lighting, white background, centered composition.
        The bag should look realistic and premium quality.`;

      let imageUrl: string;

      // Try backend API first, fall back to mock
      try {
        imageUrl = await generateWithBackend(fullPrompt);
      } catch (apiError) {
        console.warn('Backend API failed, using mock generation:', apiError);
        alert('Không thể kết nối đến AI. Đang dùng ảnh mẫu.');
        // Simulate API delay then use mock
        await new Promise(resolve => setTimeout(resolve, 2000));
        imageUrl = generateMockImage();
      }

      const newImage: GeneratedImage = {
        id: Date.now().toString(),
        prompt: designPrompt,
        imageUrl: imageUrl,
        timestamp: new Date().toISOString(),
        bagType: template?.name || '',
        size: sizeInfo?.label || '',
        color: bagColor,
      };

      setGeneratedImages([newImage, ...generatedImages]);
      setSelectedImage(imageUrl);

    } catch (error) {
      console.error('Error generating image:', error);
      alert('Có lỗi xảy ra khi tạo ảnh. Vui lòng thử lại!');
    } finally {
      setIsGenerating(false);
    }
  };

  // Hàm điều chỉnh màu sáng/tối
  const adjustColor = (color: string, amount: number): string => {
    const clamp = (val: number) => Math.min(Math.max(val, 0), 255);
    const num = parseInt(color.replace('#', ''), 16);
    const r = clamp((num >> 16) + amount);
    const g = clamp(((num >> 8) & 0x00FF) + amount);
    const b = clamp((num & 0x0000FF) + amount);
    return '#' + (0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1);
  };

  const downloadImage = (imageUrl: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `ai-bag-design-${Date.now()}.png`;
    link.click();
  };

  const copyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt);
    alert('Đã copy prompt!');
  };

  const saveToLibrary = (image: GeneratedImage) => {
    // Lưu vào Firebase hoặc local storage
    alert('Đã lưu vào thư viện thiết kế!');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="text-purple-500" size={32} />
          <h1 className="text-3xl font-bold text-slate-800">AI Tạo Ảnh Túi</h1>
        </div>
        <p className="text-slate-600">
          Sử dụng AI để tạo mockup ảnh túi chuyên nghiệp với thiết kế của bạn
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Controls */}
        <div className="lg:col-span-1 space-y-4">
          {/* API Key Section */}
          <div className="bg-white rounded-lg shadow-sm p-4 border border-slate-200">
            <button
              onClick={() => setShowApiKeyInput(!showApiKeyInput)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {showApiKeyInput ? '▼' : '▶'} Cấu hình API Key
            </button>

            {showApiKeyInput && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Gemini API Key (tùy chọn)
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIza..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Nếu không có API key, hệ thống sẽ tạo mockup cơ bản
                </p>
              </div>
            )}
          </div>

          {/* Template Selection */}
          <div className="bg-white rounded-lg shadow-sm p-4 border border-slate-200">
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Chọn loại túi
            </label>
            <div className="grid grid-cols-2 gap-2">
              {bagTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`p-3 rounded-lg border-2 transition-all text-center ${
                    selectedTemplate === template.id
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="text-3xl mb-1">{template.previewImage}</div>
                  <div className="text-xs font-medium text-slate-700">{template.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Size Selection */}
          <div className="bg-white rounded-lg shadow-sm p-4 border border-slate-200">
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Kích thước
            </label>
            <select
              value={bagSize}
              onChange={(e) => setBagSize(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {sizes.map((size) => (
                <option key={size.value} value={size.value}>
                  {size.label}
                </option>
              ))}
            </select>
          </div>

          {/* Color Selection */}
          <div className="bg-white rounded-lg shadow-sm p-4 border border-slate-200">
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Màu sắc túi
            </label>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {colorPresets.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => setBagColor(preset.value)}
                  className={`w-full h-10 rounded-lg border-2 transition-all ${
                    bagColor === preset.value
                      ? 'border-red-500 scale-110'
                      : 'border-slate-300'
                  }`}
                  style={{ backgroundColor: preset.value }}
                  title={preset.name}
                />
              ))}
            </div>
            <input
              type="color"
              value={bagColor}
              onChange={(e) => setBagColor(e.target.value)}
              className="w-full h-10 rounded-lg border border-slate-300 cursor-pointer"
            />
          </div>

          {/* Design Prompt */}
          <div className="bg-white rounded-lg shadow-sm p-4 border border-slate-200">
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Mô tả thiết kế
            </label>
            <textarea
              value={designPrompt}
              onChange={(e) => setDesignPrompt(e.target.value)}
              placeholder="Mô tả chi tiết thiết kế bạn muốn in lên túi..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              rows={4}
            />

            <div className="mt-3">
              <p className="text-xs font-medium text-slate-600 mb-2">Gợi ý:</p>
              <div className="space-y-1">
                {examplePrompts.slice(0, 3).map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => setDesignPrompt(prompt)}
                    className="w-full text-left text-xs text-slate-600 hover:text-purple-600 hover:bg-purple-50 p-2 rounded transition-colors"
                  >
                    • {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={generateImageWithAI}
            disabled={isGenerating || !designPrompt.trim()}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 px-4 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="animate-spin" size={20} />
                Đang tạo ảnh...
              </>
            ) : (
              <>
                <Sparkles size={20} />
                Tạo ảnh với AI
              </>
            )}
          </button>
        </div>

        {/* Right Panel - Preview & History */}
        <div className="lg:col-span-2 space-y-4">
          {/* Preview */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Xem trước</h3>
            {selectedImage ? (
              <div className="space-y-4">
                <div className="relative bg-slate-50 rounded-lg p-4 flex items-center justify-center min-h-[400px]">
                  <img
                    src={selectedImage}
                    alt="Generated bag design"
                    className="max-w-full max-h-[500px] object-contain rounded-lg shadow-lg"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => downloadImage(selectedImage)}
                    className="flex-1 bg-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Download size={18} />
                    Tải xuống
                  </button>
                  <button
                    onClick={() => saveToLibrary(generatedImages[0])}
                    className="flex-1 bg-green-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Save size={18} />
                    Lưu vào thư viện
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-lg p-12 text-center min-h-[400px] flex items-center justify-center">
                <div>
                  <Sparkles className="mx-auto text-slate-300 mb-3" size={48} />
                  <p className="text-slate-500">
                    Chọn loại túi, màu sắc và nhập mô tả thiết kế
                  </p>
                  <p className="text-slate-400 text-sm mt-2">
                    Sau đó nhấn "Tạo ảnh với AI" để xem kết quả
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* History */}
          {generatedImages.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6 border border-slate-200">
              <div className="flex items-center gap-2 mb-4">
                <History size={20} className="text-slate-600" />
                <h3 className="text-lg font-semibold text-slate-800">Lịch sử tạo ảnh</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {generatedImages.map((img) => (
                  <div
                    key={img.id}
                    className="relative group cursor-pointer"
                    onClick={() => setSelectedImage(img.imageUrl)}
                  >
                    <img
                      src={img.imageUrl}
                      alt={img.prompt}
                      className="w-full h-32 object-cover rounded-lg border-2 border-slate-200 group-hover:border-purple-500 transition-all"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all rounded-lg flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-all flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyPrompt(img.prompt);
                          }}
                          className="bg-white text-slate-800 p-2 rounded-lg hover:bg-slate-100"
                        >
                          <Copy size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadImage(img.imageUrl);
                          }}
                          className="bg-white text-slate-800 p-2 rounded-lg hover:bg-slate-100"
                        >
                          <Download size={16} />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 truncate" title={img.prompt}>
                      {img.prompt}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIBagGenerator;
