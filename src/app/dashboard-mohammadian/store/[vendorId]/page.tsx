"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Store, ArrowRight, Package, Plus, Loader2, AlertCircle, Edit } from "lucide-react";

interface Product {
  id: number;
  title: string;
  price: number;
  primary_price: number | null;
  inventory: number;
  status: {
    name: string;
    value: number;
  };
  photo: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
  };
  description?: string;
}

export default function StoreDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const vendorId = params.vendorId as string;
  
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [storeInfo, setStoreInfo] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, [vendorId, currentPage]);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get token from localStorage or cookie
      const token = localStorage.getItem('auth_token') || getCookie('auth_token');
      
      if (!token) {
        throw new Error('توکن احراز هویت یافت نشد');
      }

      const response = await fetch(
        `https://peyvandyar.amintvk.ir/api/products?page=${currentPage}&per_page=10`,
        {
          headers: {
            'accept': '*/*',
            'X-Encrypted-Token': token
          }
        }
      );

      if (!response.ok) {
        throw new Error(`خطا در دریافت محصولات: ${response.status}`);
      }

      const data = await response.json();
      console.log('Products data:', data);
      
      if (data.success && data.data) {
        setProducts(data.data.data || []);
        setTotalPages(data.pagination?.total_page || 1);
        setStoreInfo({
          vendor_id: vendorId,
          vendor_title: `غرفه ${vendorId}`,
          vendor_identifier: vendorId
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطای نامشخص');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCookie = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-white to-amber-50/30" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-orange-200 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/dashboard-mohammadian')}
                className="w-10 h-10 bg-orange-100 hover:bg-orange-200 rounded-lg flex items-center justify-center transition-colors"
              >
                <ArrowRight className="w-5 h-5 text-orange-600" />
              </button>
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                <Store className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">
                  {storeInfo?.vendor_title || `غرفه ${vendorId}`}
                </h1>
                <p className="text-sm text-slate-600">مدیریت محصولات</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                ایجاد محصول
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-orange-200 shadow-lg overflow-hidden">
            {/* Products Table Header */}
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Package className="w-6 h-6 text-orange-600" />
                  <h2 className="text-lg font-bold text-slate-800">لیست محصولات</h2>
                  <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                    {products.length} محصول
                  </span>
                </div>
              </div>
            </div>

            {/* Products List */}
            {products.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">هنوز محصولی وجود ندارد</h3>
                <p className="text-slate-600 mb-6">برای شروع، اولین محصول خود را ایجاد کنید</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors font-medium"
                >
                  <Plus className="w-5 h-5" />
                  ایجاد اولین محصول
                </button>
              </div>
            ) : (
              <>
                <div className="divide-y divide-slate-200">
                  {products.map((product) => (
                    <div key={product.id} className="p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-4">
                        {product.photo && (
                          <img 
                            src={product.photo.sm} 
                            alt={product.title}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="font-bold text-slate-800">{product.title}</h4>
                          <div className="flex items-center gap-4 mt-1 text-sm text-slate-600">
                            <span>قیمت: {product.price?.toLocaleString('fa-IR')} تومان</span>
                            <span>موجودی: {product.inventory}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs ${
                              product.status.value === 2976 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {product.status.name}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedProduct(product);
                            setShowEditModal(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="ویرایش محصول"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="p-4 border-t border-slate-200 flex items-center justify-center gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      قبلی
                    </button>
                    <span className="px-4 py-2 text-sm text-slate-600">
                      صفحه {currentPage} از {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      بعدی
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Create Product Modal */}
      {showCreateModal && (
        <CreateProductModal
          vendorId={vendorId}
          onClose={() => setShowCreateModal(false)}
          onSuccess={(newProduct) => {
            setProducts([newProduct, ...products]);
            setShowCreateModal(false);
          }}
        />
      )}

      {/* Edit Product Modal */}
      {showEditModal && selectedProduct && (
        <EditProductModal
          product={selectedProduct}
          onClose={() => {
            setShowEditModal(false);
            setSelectedProduct(null);
          }}
          onSuccess={(updatedProduct) => {
            setProducts(products.map(p => p.id === updatedProduct.id ? updatedProduct : p));
            setShowEditModal(false);
            setSelectedProduct(null);
          }}
        />
      )}
    </div>
  );
}

// Create Product Modal Component
function CreateProductModal({ vendorId, onClose, onSuccess }: any) {
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    primary_price: '',
    stock: '',
    brief: '',
    description: '',
    preparation_days: '',
    weight: '',
    package_weight: '',
    sku: '',
    is_wholesale: false,
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [additionalImages, setAdditionalImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdditionalImagesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAdditionalImages(prev => [...prev, ...files]);
  };

  const removeAdditionalImage = (index: number) => {
    setAdditionalImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // بررسی فیلدهای الزامی
      if (!selectedImage) {
        throw new Error('لطفا تصویر اصلی محصول را انتخاب کنید');
      }

      if (!formData.category_id) {
        throw new Error('لطفا دسته‌بندی محصول را انتخاب کنید');
      }

      setUploadingImage(true);

      // آپلود تصویر اصلی
      const { productsApi } = await import('@/lib/api');
      const imageUploadResponse = await productsApi.uploadProductImage(selectedImage);
      
      if (!imageUploadResponse.success || !imageUploadResponse.image_id) {
        throw new Error('خطا در آپلود تصویر اصلی');
      }

      const mainImageId = imageUploadResponse.image_id;

      // آپلود تصاویر اضافی
      const additionalImageIds: number[] = [];
      for (const file of additionalImages) {
        try {
          const response = await productsApi.uploadProductImage(file);
          if (response.success && response.image_id) {
            additionalImageIds.push(response.image_id);
          }
        } catch (err) {
          console.error('خطا در آپلود تصویر اضافی:', err);
        }
      }

      setUploadingImage(false);

      // ایجاد محصول
      const productData: any = {
        name: formData.name,
        category_id: parseInt(formData.category_id),
        photo: mainImageId,
        primary_price: parseInt(formData.primary_price),
        stock: parseInt(formData.stock),
      };

      // اضافه کردن تصاویر اضافی
      if (additionalImageIds.length > 0) {
        productData.photos = [mainImageId, ...additionalImageIds];
      }

      // اضافه کردن فیلدهای اختیاری
      if (formData.brief) productData.brief = formData.brief;
      if (formData.description) productData.description = formData.description;
      if (formData.preparation_days) productData.preparation_days = parseInt(formData.preparation_days);
      if (formData.weight) productData.weight = parseInt(formData.weight);
      if (formData.package_weight) productData.package_weight = parseInt(formData.package_weight);
      if (formData.sku) productData.sku = formData.sku;
      productData.is_wholesale = formData.is_wholesale;

      const createResponse = await productsApi.createProduct(productData);
      
      if (!createResponse.success) {
        throw new Error(createResponse.message || 'خطا در ایجاد محصول');
      }

      // بستن مودال و رفرش لیست
      onSuccess(createResponse.data);
      onClose();
      
      // رفرش صفحه برای نمایش محصول جدید
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در ایجاد محصول');
      console.error('Error creating product:', err);
    } finally {
      setLoading(false);
      setUploadingImage(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-br from-orange-500 to-amber-600 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">ایجاد محصول جدید</h3>
                <p className="text-white/80 text-sm">اطلاعات محصول را وارد کنید</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <span className="text-white text-xl">×</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* تصویر اصلی */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">تصویر اصلی محصول *</label>
              <div className="flex items-center gap-4">
                {imagePreview && (
                  <img src={imagePreview} alt="Preview" className="w-24 h-24 rounded-lg object-cover border-2 border-orange-200" />
                )}
                <label className="flex-1 cursor-pointer">
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 hover:border-orange-500 transition-colors text-center">
                    <p className="text-sm text-slate-600">
                      {selectedImage ? selectedImage.name : 'کلیک کنید یا تصویر را بکشید'}
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                    required
                  />
                </label>
              </div>
            </div>

            {/* تصاویر اضافی */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">تصاویر اضافی (اختیاری)</label>
              <div className="space-y-2">
                {additionalImages.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {additionalImages.map((file, index) => (
                      <div key={index} className="relative">
                        <img 
                          src={URL.createObjectURL(file)} 
                          alt={`Additional ${index + 1}`} 
                          className="w-20 h-20 rounded-lg object-cover border-2 border-slate-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeAdditionalImage(index)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <label className="cursor-pointer block">
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-3 hover:border-orange-500 transition-colors text-center">
                    <p className="text-sm text-slate-600">افزودن تصاویر بیشتر</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleAdditionalImagesSelect}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">نام محصول *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="نام محصول را وارد کنید"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">دسته‌بندی *</label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">انتخاب دسته‌بندی</option>
                <option value="1">پوشاک</option>
                <option value="2">لوازم خانگی</option>
                <option value="3">الکترونیک</option>
                <option value="4">کتاب و لوازم تحریر</option>
                <option value="5">زیبایی و سلامت</option>
                <option value="6">ورزش و سرگرمی</option>
                <option value="7">خوراکی و نوشیدنی</option>
                <option value="8">سایر</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">قیمت (تومان) *</label>
                <input
                  type="number"
                  value={formData.primary_price}
                  onChange={(e) => setFormData({ ...formData, primary_price: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">موجودی *</label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">توضیحات کوتاه</label>
              <input
                type="text"
                value={formData.brief}
                onChange={(e) => setFormData({ ...formData, brief: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="توضیحات کوتاه محصول..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">توضیحات کامل</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="توضیحات کامل محصول..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">مدت آماده‌سازی (روز)</label>
                <input
                  type="number"
                  value={formData.preparation_days}
                  onChange={(e) => setFormData({ ...formData, preparation_days: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">SKU</label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="کد محصول"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">وزن (گرم)</label>
                <input
                  type="number"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">وزن بسته‌بندی (گرم)</label>
                <input
                  type="number"
                  value={formData.package_weight}
                  onChange={(e) => setFormData({ ...formData, package_weight: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_wholesale"
                checked={formData.is_wholesale}
                onChange={(e) => setFormData({ ...formData, is_wholesale: e.target.checked })}
                className="w-4 h-4 text-orange-500 border-slate-300 rounded focus:ring-orange-500"
              />
              <label htmlFor="is_wholesale" className="text-sm font-medium text-slate-700">
                فروش عمده
              </label>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {uploadingImage && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2">
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                <p className="text-blue-600 text-sm">در حال آپلود تصاویر...</p>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-orange-500 text-white px-6 py-3 rounded-xl hover:bg-orange-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  در حال ایجاد...
                </span>
              ) : (
                'ایجاد محصول'
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium disabled:opacity-50"
            >
              انصراف
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit Product Modal Component
function EditProductModal({ product, onClose, onSuccess }: { product: Product; onClose: () => void; onSuccess: (product: Product) => void }) {
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    inventory: '',
    description: '',
    status: 'active'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProductDetails();
  }, []);

  const fetchProductDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('auth_token') || getCookie('auth_token');
      
      if (!token) {
        throw new Error('توکن احراز هویت یافت نشد');
      }

      const response = await fetch(
        `https://peyvandyar.amintvk.ir/api/products/${product.id}`,
        {
          headers: {
            'accept': '*/*',
            'X-Encrypted-Token': token
          }
        }
      );

      if (!response.ok) {
        throw new Error(`خطا در دریافت جزئیات محصول: ${response.status}`);
      }

      const data = await response.json();
      console.log('Product details:', data);
      
      if (data.success && data.data) {
        const productData = data.data;
        setFormData({
          title: productData.title || '',
          price: productData.price?.toString() || '',
          inventory: productData.inventory?.toString() || '',
          description: productData.description || '',
          status: productData.status?.value === 2976 ? 'active' : 'inactive'
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در دریافت اطلاعات');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const token = localStorage.getItem('auth_token') || getCookie('auth_token');
      
      if (!token) {
        throw new Error('توکن احراز هویت یافت نشد');
      }

      // Prepare update payload - only send fields that were changed
      const updatePayload: any = {};
      
      if (formData.title && formData.title !== product.title) {
        updatePayload.title = formData.title;
      }
      if (formData.price && parseInt(formData.price) !== product.price) {
        updatePayload.price = parseInt(formData.price);
      }
      if (formData.inventory && parseInt(formData.inventory) !== product.inventory) {
        updatePayload.inventory = parseInt(formData.inventory);
      }
      if (formData.description !== product.description) {
        updatePayload.description = formData.description;
      }
      
      const newStatusValue = formData.status === 'active' ? 2976 : 0;
      if (newStatusValue !== product.status.value) {
        updatePayload.status = newStatusValue;
      }

      const response = await fetch(
        `https://peyvandyar.amintvk.ir/api/products/${product.id}`,
        {
          method: 'PUT',
          headers: {
            'accept': '*/*',
            'X-Encrypted-Token': token,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updatePayload)
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `خطا در ویرایش محصول: ${response.status}`);
      }

      const data = await response.json();
      console.log('Update response:', data);
      
      if (data.success && data.data) {
        onSuccess(data.data);
      } else {
        // If API doesn't return updated product, create it from form data
        const updatedProduct: Product = {
          ...product,
          title: formData.title,
          price: parseInt(formData.price),
          primary_price: parseInt(formData.price),
          inventory: parseInt(formData.inventory),
          status: {
            name: formData.status === 'active' ? 'در دسترس' : 'غیرفعال',
            value: formData.status === 'active' ? 2976 : 0
          },
          description: formData.description
        };
        onSuccess(updatedProduct);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در ویرایش محصول');
    } finally {
      setSaving(false);
    }
  };

  const getCookie = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return null;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Edit className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">ویرایش محصول</h3>
                <p className="text-white/80 text-sm">اطلاعات محصول را ویرایش کنید</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <span className="text-white text-xl">×</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
            <p className="text-slate-600">در حال بارگذاری اطلاعات...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">نام محصول *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="نام محصول را وارد کنید"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">قیمت (تومان) *</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">موجودی *</label>
                  <input
                    type="number"
                    value={formData.inventory}
                    onChange={(e) => setFormData({ ...formData, inventory: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">توضیحات</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="توضیحات محصول..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">وضعیت</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">فعال</option>
                  <option value="inactive">غیرفعال</option>
                </select>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-blue-500 text-white px-6 py-3 rounded-xl hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    در حال ذخیره...
                  </span>
                ) : (
                  'ذخیره تغییرات'
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium"
              >
                انصراف
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
