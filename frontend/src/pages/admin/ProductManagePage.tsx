import { useState, useEffect, useRef } from 'react';
import { adminApi } from '../../api/admin';

const C = {
  cardBg: '#FFFFFF', cardBorder: 'rgba(0,0,0,0.06)',
  textPrimary: '#15181B', textSecondary: '#5F6B7A', textMuted: '#8B95A5',
  accent: '#3D6A94', danger: '#e06070', success: '#5bc0a0',
};

export default function ProductManagePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState<'product' | 'images' | 'sku'>('product');
  const [form, setForm] = useState({ name: '', slug: '', category_id: 0, brand: 'oPhone', description: '', is_featured: true });
  const [editProductId, setEditProductId] = useState<number | null>(null);

  // Images
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // SKU
  const [skuForm, setSkuForm] = useState({ sku_name: '', sku_code: '', price: '', stock: '', specs: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    Promise.all([
      adminApi.getProducts({ page_size: 100 }),
      adminApi.getCategories(),
    ]).then(([pRes, cRes]) => {
      setProducts(pRes.items || []);
      setCategories(cRes.items || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setForm({ name: '', slug: '', category_id: 0, brand: 'oPhone', description: '', is_featured: true });
    setSkuForm({ sku_name: '', sku_code: '', price: '', stock: '', specs: '' });
    setImageFiles([]); setImagePreviews([]);
    setStep('product'); setEditProductId(null);
  };

  const handleOpenCreate = () => { resetForm(); setShowModal(true); };

  const handleNameChange = (name: string) => {
    setForm({ ...form, name });
    if (!form.slug || form.slug === slugify(form.name.slice(0, -1))) {
      setForm(prev => ({ ...prev, slug: slugify(name) }));
    }
  };

  // --- Step 1: Create product ---
  const handleCreateProduct = async () => {
    if (!form.name || !form.slug || !form.category_id) { alert('请填写商品名称、别名和分类'); return; }
    setSubmitting(true);
    try {
      const params = new URLSearchParams();
      params.set('name', form.name); params.set('slug', form.slug);
      params.set('category_id', String(form.category_id)); params.set('brand', form.brand);
      if (form.description) params.set('description', form.description);
      params.set('is_featured', String(form.is_featured));
      const p = await adminApi.createProduct(params);
      setEditProductId(p.id);
      setStep('images');
    } catch (err: any) { alert(err?.response?.data?.detail || '创建失败'); }
    finally { setSubmitting(false); }
  };

  // --- Step 2: Handle image files ---
  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setImageFiles(prev => [...prev, ...files]);
    files.forEach(f => {
      const url = URL.createObjectURL(f);
      setImagePreviews(prev => [...prev, url]);
    });
    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemovePreview = (idx: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== idx));
    URL.revokeObjectURL(imagePreviews[idx]);
    setImagePreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handleUploadImages = async () => {
    if (imageFiles.length === 0) { setStep('sku'); return; }
    setUploading(true);
    const urls: string[] = [];
    for (let i = 0; i < imageFiles.length; i++) {
      try {
        const res = await adminApi.uploadImage(imageFiles[i]);
        urls.push(res.url);
        // Link to product
        if (editProductId) {
          await adminApi.addProductImage(editProductId, res.url, i);
        }
      } catch { alert(`第 ${i + 1} 张图片上传失败`); }
    }
    // Upload complete — images linked to product above
    setUploading(false);
    if (imageFiles.length > 0) alert(`成功上传 ${urls.length} 张图片！`);
    setStep('sku');
  };

  // --- Step 3: Add SKU ---
  const handleAddSku = async () => {
    if (!editProductId || !skuForm.sku_name || !skuForm.sku_code || !skuForm.price) { alert('请填写SKU信息'); return; }
    setSubmitting(true);
    try {
      const params = new URLSearchParams();
      params.set('sku_name', skuForm.sku_name); params.set('sku_code', skuForm.sku_code);
      params.set('price', skuForm.price); params.set('stock', skuForm.stock || '0');
      if (skuForm.specs) params.set('specs', skuForm.specs);
      await adminApi.createSku(editProductId, params);
      setSkuForm({ sku_name: '', sku_code: '', price: '', stock: '', specs: '' });
      alert('SKU 添加成功！');
    } catch (err: any) { alert(err?.response?.data?.detail || '添加SKU失败'); }
    finally { setSubmitting(false); }
  };

  const handleFinish = () => { setShowModal(false); resetForm(); load(); };

  // --- Upload existing images for an existing product ---
  const handleAddImageToProduct = async (productId: number) => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/jpeg,image/png,image/gif,image/webp'; input.multiple = true;
    input.onchange = async () => {
      const files = Array.from(input.files || []);
      if (files.length === 0) return;
      for (let i = 0; i < files.length; i++) {
        try {
          const res = await adminApi.uploadImage(files[i]);
          await adminApi.addProductImage(productId, res.url, i);
        } catch { alert(`第 ${i + 1} 张上传失败`); }
      }
      alert(`上传完成！`);
    };
    input.click();
  };

  // ==================== RENDER ====================

  if (loading) return <div className="flex justify-center py-20"><div className="w-7 h-7 border-2 border-[#3D6A94] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold tracking-wide" style={{ color: C.textPrimary }}>商品管理</h2>
        <button onClick={handleOpenCreate}
          className="text-xs px-4 py-2.5 rounded-lg font-medium transition-opacity hover:opacity-90"
          style={{ background: C.accent, color: '#FFFFFF' }}>
          + 添加商品
        </button>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.02)' }}>
                <th className="text-left py-3 px-5 text-xs font-medium" style={{ color: C.textMuted }}>ID</th>
                <th className="text-left py-3 px-5 text-xs font-medium" style={{ color: C.textMuted }}>商品名称</th>
                <th className="text-left py-3 px-5 text-xs font-medium" style={{ color: C.textMuted }}>品牌</th>
                <th className="text-right py-3 px-5 text-xs font-medium" style={{ color: C.textMuted }}>最低价</th>
                <th className="text-right py-3 px-5 text-xs font-medium" style={{ color: C.textMuted }}>库存</th>
                <th className="text-center py-3 px-5 text-xs font-medium" style={{ color: C.textMuted }}>图片</th>
                <th className="text-center py-3 px-5 text-xs font-medium" style={{ color: C.textMuted }}>状态</th>
                <th className="text-center py-3 px-5 text-xs font-medium" style={{ color: C.textMuted }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-14 text-xs" style={{ color: C.textMuted }}>
                  <p className="mb-2">暂无商品</p>
                  <button onClick={handleOpenCreate} className="underline hover:opacity-80" style={{ color: C.accent }}>点击添加第一个商品</button>
                </td></tr>
              ) : products.map((p, i) => (
                <tr key={p.id} className="transition-colors" style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#EEF1F5'}
                  onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)'}>
                  <td className="py-2.5 px-5 text-xs font-mono" style={{ color: C.textMuted }}>{p.id}</td>
                  <td className="py-2.5 px-5 text-xs font-medium" style={{ color: C.textPrimary }}>{p.name}</td>
                  <td className="py-2.5 px-5 text-xs" style={{ color: C.textSecondary }}>{p.brand}</td>
                  <td className="py-2.5 px-5 text-xs text-right" style={{ color: C.accent }}>¥{p.min_price || '—'}</td>
                  <td className="py-2.5 px-5 text-xs text-right" style={{ color: C.textSecondary }}>{p.total_stock ?? '—'}</td>
                  <td className="py-2.5 px-5 text-center">
                    <button onClick={() => handleAddImageToProduct(p.id)}
                      className="text-xs px-2 py-0.5 rounded transition-colors"
                      style={{ background: 'rgba(108,142,239,0.1)', color: '#6c8eef' }}>
                      +图片
                    </button>
                  </td>
                  <td className="py-2.5 px-5 text-center">
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{
                      background: p.is_active ? 'rgba(91,192,160,0.1)' : 'rgba(0,0,0,0.04)',
                      color: p.is_active ? C.success : C.textMuted,
                    }}>{p.is_active ? '上架' : '下架'}</span>
                  </td>
                  <td className="py-2.5 px-5">
                    <div className="flex justify-center gap-1.5">
                      <button onClick={async () => { await adminApi.toggleProduct(p.id); load(); }}
                        className="text-xs px-2.5 py-1 rounded-md transition-colors hover:opacity-80"
                        style={{ background: 'rgba(0,0,0,0.04)', color: C.textSecondary }}>
                        {p.is_active ? '下架' : '上架'}
                      </button>
                      <button onClick={async () => { if (confirm('确认删除？')) { await adminApi.deleteProduct(p.id); load(); } }}
                        className="text-xs px-2.5 py-1 rounded-md transition-colors"
                        style={{ background: 'rgba(224,96,112,0.08)', color: C.danger }}>
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==================== CREATE MODAL ==================== */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-lg max-h-[90vh] overflow-auto rounded-2xl p-6" style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: '0 20px 60px rgba(0,0,0,0.08)' }}>

            {/* Stepper */}
            <div className="flex items-center gap-3 mb-6">
              {[
                { key: 'product', label: '基本信息' },
                { key: 'images', label: '上传图片' },
                { key: 'sku', label: '规格/SKU' },
              ].map((s, idx) => (
                <div key={s.key} className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    step === s.key ? 'text-black' : idx < ['product','images','sku'].indexOf(step) ? 'text-black' : 'text-gray-500'
                  }`}
                  style={{
                    background: step === s.key ? C.accent : idx < ['product','images','sku'].indexOf(step) ? C.accent : 'rgba(255,255,255,0.06)',
                    color: step === s.key || idx < ['product','images','sku'].indexOf(step) ? '#FFFFFF' : C.textMuted,
                  }}>
                    {idx < ['product','images','sku'].indexOf(step) ? '✓' : idx + 1}
                  </div>
                  <span className="text-xs" style={{ color: step === s.key ? C.accent : C.textMuted }}>{s.label}</span>
                  {idx < 2 && <div className="w-5 h-px" style={{ background: C.cardBorder }} />}
                </div>
              ))}
            </div>

            {/* ====== Step 1: Basic Info ====== */}
            {step === 'product' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: C.textMuted }}>商品名称 *</label>
                  <input type="text" value={form.name} onChange={e => handleNameChange(e.target.value)} placeholder="例如：oPhone X30 Pro"
                    className="w-full px-4 py-2.5 text-sm rounded-xl outline-none"
                    style={{ background: '#EEF1F5', border: `1px solid ${C.cardBorder}`, color: C.textPrimary }} />
                </div>
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: C.textMuted }}>URL别名 * (自动生成)</label>
                  <input type="text" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="ophone-x30-pro"
                    className="w-full px-4 py-2.5 text-sm rounded-xl outline-none"
                    style={{ background: '#EEF1F5', border: `1px solid ${C.cardBorder}`, color: C.textPrimary }} />
                </div>
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: C.textMuted }}>所属分类 *</label>
                  <select value={form.category_id} onChange={e => setForm({ ...form, category_id: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 text-sm rounded-xl outline-none"
                    style={{ background: '#EEF1F5', border: `1px solid ${C.cardBorder}`, color: C.textPrimary }}>
                    <option value={0} style={{ background: '#FFFFFF' }}>请选择分类</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id} style={{ background: '#FFFFFF', color: C.textPrimary }}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: C.textMuted }}>品牌</label>
                  <input type="text" value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm rounded-xl outline-none"
                    style={{ background: '#EEF1F5', border: `1px solid ${C.cardBorder}`, color: C.textPrimary }} />
                </div>
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.is_featured} onChange={e => setForm({ ...form, is_featured: e.target.checked })}
                      className="w-4 h-4 accent-[#3D6A94]" />
                    <span className="text-xs" style={{ color: C.textSecondary }}>设为精选商品（将在首页展示）</span>
                  </label>
                </div>
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: C.textMuted }}>商品描述</label>
                  <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} placeholder="商品详情描述…"
                    className="w-full px-4 py-2.5 text-sm rounded-xl outline-none resize-none"
                    style={{ background: '#EEF1F5', border: `1px solid ${C.cardBorder}`, color: C.textPrimary }} />
                </div>
                <div className="flex gap-3">
                  <button onClick={handleCreateProduct} disabled={submitting}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-40"
                    style={{ background: C.accent, color: '#FFFFFF' }}>
                    {submitting ? '创建中...' : '创建商品 →'}
                  </button>
                  <button onClick={() => setShowModal(false)}
                    className="px-6 py-2.5 rounded-xl text-sm transition-colors"
                    style={{ background: 'rgba(0,0,0,0.04)', color: C.textSecondary }}>取消</button>
                </div>
              </div>
            )}

            {/* ====== Step 2: Upload Images ====== */}
            {step === 'images' && (
              <div className="space-y-4">
                <div className="text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(108,142,239,0.1)', color: '#6c8eef' }}>
                  商品创建成功（ID: {editProductId}）！现在可以上传商品图片（支持多张）
                </div>

                {/* Preview Area */}
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-3 gap-3">
                    {imagePreviews.map((url, idx) => (
                      <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group"
                        style={{ border: `1px solid ${C.cardBorder}` }}>
                        <img src={url} alt={`预览 ${idx + 1}`} className="w-full h-full object-cover" />
                        <button onClick={() => handleRemovePreview(idx)}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ background: 'rgba(224,96,112,0.9)' }}>×</button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Drop zone */}
                <div
                  className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all hover:opacity-80"
                  style={{ borderColor: C.cardBorder, background: '#F4F6F9' }}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = C.accent; }}
                  onDragLeave={e => { e.currentTarget.style.borderColor = C.cardBorder; }}
                  onDrop={e => {
                    e.preventDefault();
                    e.currentTarget.style.borderColor = C.cardBorder;
                    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
                    if (files.length > 0) {
                      setImageFiles(prev => [...prev, ...files]);
                      files.forEach(f => setImagePreviews(prev => [...prev, URL.createObjectURL(f)]));
                    }
                  }}>
                  <p className="text-3xl mb-2">🖼️</p>
                  <p className="text-sm" style={{ color: C.textSecondary }}>拖拽图片到此处，或 <span style={{ color: C.accent }}>点击选择文件</span></p>
                  <p className="text-xs mt-1" style={{ color: C.textMuted }}>支持 JPG / PNG / GIF / WebP，单张不超过 5MB</p>
                </div>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" multiple
                  onChange={handleFilesSelected} hidden />

                <div className="flex gap-3">
                  <button onClick={handleUploadImages} disabled={uploading}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-40"
                    style={{ background: imageFiles.length > 0 ? '#6c8eef' : C.accent, color: '#fff' }}>
                    {uploading ? '上传中...' : imageFiles.length > 0 ? `上传 ${imageFiles.length} 张图片 →` : '跳过 → 下一步'}
                  </button>
                  <button onClick={() => setStep('sku')}
                    className="px-6 py-2.5 rounded-xl text-sm transition-colors"
                    style={{ background: 'rgba(0,0,0,0.04)', color: C.textSecondary }}>跳过</button>
                </div>
              </div>
            )}

            {/* ====== Step 3: SKU ====== */}
            {step === 'sku' && (
              <div className="space-y-4">
                <div className="text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(61,106,148,0.06)', color: C.accent }}>
                  为商品添加 SKU 规格（如颜色+存储组合），至少需要一个 SKU 用户才能下单。
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs mb-1.5" style={{ color: C.textMuted }}>规格名称 *</label>
                    <input type="text" value={skuForm.sku_name} onChange={e => setSkuForm({ ...skuForm, sku_name: e.target.value })}
                      placeholder="如：深空灰 256GB" className="w-full px-3 py-2.5 text-sm rounded-xl outline-none"
                      style={{ background: '#EEF1F5', border: `1px solid ${C.cardBorder}`, color: C.textPrimary }} />
                  </div>
                  <div>
                    <label className="block text-xs mb-1.5" style={{ color: C.textMuted }}>SKU编码 *</label>
                    <input type="text" value={skuForm.sku_code} onChange={e => setSkuForm({ ...skuForm, sku_code: e.target.value })}
                      placeholder="X30P-GRAY-256" className="w-full px-3 py-2.5 text-sm rounded-xl outline-none"
                      style={{ background: '#EEF1F5', border: `1px solid ${C.cardBorder}`, color: C.textPrimary }} />
                  </div>
                  <div>
                    <label className="block text-xs mb-1.5" style={{ color: C.textMuted }}>价格 (¥) *</label>
                    <input type="number" step="0.01" value={skuForm.price} onChange={e => setSkuForm({ ...skuForm, price: e.target.value })}
                      placeholder="5999" className="w-full px-3 py-2.5 text-sm rounded-xl outline-none"
                      style={{ background: '#EEF1F5', border: `1px solid ${C.cardBorder}`, color: C.textPrimary }} />
                  </div>
                  <div>
                    <label className="block text-xs mb-1.5" style={{ color: C.textMuted }}>库存数量</label>
                    <input type="number" value={skuForm.stock} onChange={e => setSkuForm({ ...skuForm, stock: e.target.value })}
                      placeholder="999" className="w-full px-3 py-2.5 text-sm rounded-xl outline-none"
                      style={{ background: '#EEF1F5', border: `1px solid ${C.cardBorder}`, color: C.textPrimary }} />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs mb-1.5" style={{ color: C.textMuted }}>规格参数 (JSON，选填)</label>
                    <input type="text" value={skuForm.specs} onChange={e => setSkuForm({ ...skuForm, specs: e.target.value })}
                      placeholder={'{"颜色":"深空灰","存储":"256GB"}'} className="w-full px-3 py-2.5 text-sm rounded-xl outline-none"
                      style={{ background: '#EEF1F5', border: `1px solid ${C.cardBorder}`, color: C.textPrimary }} />
                  </div>
                </div>

                {/* Added SKUs list */}
                <div className="text-xs" style={{ color: C.textMuted }}>
                  提示：添加完所有 SKU 后点击 <span style={{ color: C.accent }}>"完成"</span> 关闭窗口
                </div>

                <div className="flex gap-3">
                  <button onClick={handleAddSku} disabled={submitting}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-40"
                    style={{ background: C.accent, color: '#FFFFFF' }}>
                    {submitting ? '添加中...' : '+ 添加此 SKU'}
                  </button>
                  <button onClick={handleFinish}
                    className="px-6 py-2.5 rounded-xl text-sm transition-colors"
                    style={{ background: 'rgba(0,0,0,0.04)', color: C.textSecondary }}>完成</button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');
}
