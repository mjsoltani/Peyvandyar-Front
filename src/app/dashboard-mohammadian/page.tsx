"use client";

import { useEffect, useState } from "react";
import { Store, ArrowRight, CheckCircle, Loader2, User, Calendar, Plus, ShoppingBag, MoreVertical, Package } from "lucide-react";

interface UserData {
  success: boolean;
  user: {
    basalam_user_id: number;
    basalam_vendor_id: number;
    vendor_title: string;
    last_used_at: string;
  };
}

interface ChildStore {
  relation_id: number;
  vendor_id: number;
  vendor_title: string;
  vendor_identifier?: string;
  status: string;
  created_at: string;
  relationship_age_days: number;
  sync_statistics: {
    total_syncs: number;
    successful_syncs: number;
    failed_syncs: number;
    success_rate: string;
    last_sync_at: string | null;
    synced_products_count: number;
  };
  sync_health: {
    status: string;
    last_activity: string;
  };
  sync_rules: {
    fields: string[];
    match_by: string;
    conflict_resolution: string;
  };
  child_token_hash?: string;
}

export default function MohammadianDashboard() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [childStores, setChildStores] = useState<ChildStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddChild, setShowAddChild] = useState(false);
  const [childToken, setChildToken] = useState("");
  const [addingChild, setAddingChild] = useState(false);
  const [addChildError, setAddChildError] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | string | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedChild, setSelectedChild] = useState<ChildStore | null>(null);

  const parentToken = "453bd585c59e1044bcbc88e0ce065cb7:c1e30dee9138e6245a59b31346f46c08d988449fe867c772ef8e7a8ee9bd5814857c4384ff6c160e1f632132df33993d3b6aa7b68d772ea0e9cf78f37346e5702c6ac3fad378710a5e7691e50f98b5866ed51460db3809bd6505d8e94a90af564a63e5b30de8b3a1751f9f7477acd0eabf62b2357499bb80957bee9d86095d9c11f3f9faf19abca1d7b4ccfa2bb2a5e2ab0d51d33e9b8b71d9d1b0a3f3218dffe8cd1cb1d196c65a820a98a93689530c66f008fcaff80d77a78afecdcbd8b0225f5b999f5b9c0b58cb2a15a7db445bb430410f7588a6865087ce31d2aaaba47a18988a06d099d50a5dd0ebc77c31b146a68ef75eb395a1cba8c838306f0ec29f9f9967c09b35f4658b2478e96951d85e9dd445cce0b968a35e459a30b2e1997887491ba2ce57c0d250b22c850ea9c7f6dc32123358a6573e319dbfd34557e25dc44384a4a20fe2094d91552adbdea616e53f1b3fb93211abe7a84ec97eab77edf46525e56407a566628d4d84c0c1b7dc95ca6979139a88ce5ae348a1c2d5c80687b49cd1c32ab85c20629d87c14d331a5f1918dd3399d34a666fc0abe77c37acd4db424b67765ee6e3fe78ba3dcd5c7903f58354de7d00e17e5bc71b263ec4d146e5c9aed10ffb90cdb9f351d7543c4f6369933b5918b13dfd706f4655548047ed15ec111862918d03a5187e9ad666d0bf4e9861dd8ea8ad55916abb3a74bfb11b9096063a569954096cd37750c43b40ec08e59d1c46cb5034a71d298c5140aa272f389ca514e7613919ed43ac60380608d6bd995dff17fee5051113b359aa7e2977acf4163b30e5b72dfdfaa9882b44bf33719e3bc9acf8dc68703e72ccd90e5301da631d9b6dd11e72011e5b3ba06ad1a474c1d4ae5aa60613507a4703a4b6d3e716cfbe47ac4680cf1dbc60bef4eaee3367b0972ca350e524abd8010e5883c404d5e8245c6aeda9c457ef129fd4064adc36f670770655ad55ba20b426b2861fae753b6af014d28e17852d37a1e0db09857a50cf7671cf826cd98bbff6e736c23416c8e95b71f79d6eea3912dd5cb73e66e4be3459cce4edb75e0cece68580500b2944c179c06f8a9d65ff6fb59ffc193983fcea03f6abcce8fa136cc23842a05fd84af0da28eca92db1d69bcf6e1258d7119901023bb52950dbe8223af7d95a87acaf8c877c06bde8be8a5b55a12b28c19d798a174984d4096a002b0251f092c121f70d10b3979f86ff305518de9ccbcf23eb7a15345a56aff830946b82b980df4a4b0a480ad36ee1efaba485bbb9526ca1c1e3650f63b9e61a4781b336e665014266edf985598c6e4fbd94b5daf00d3f9799f142741942c643b564261590485e31fff0fc7618b1ae436f76e692f67c69b180c15acefa980ffb6c3975105665f4a4a1084427508a4f2d2b670e6fd9f9f5189ff19f0f0394856e1f11c4c3478d97f7829f2420e86ca053ae5871e0c5fbc24e345f6479c4c8ae179494f400b442779ffa00ca5c123bb0b7404df383d6eecd79a2695e9176dbc7e2ed271bbbd48e1878a7f0b0860fabbc4ffe80db48f0d8c8c863b508ca09db309f76ad536ba9";

  useEffect(() => {
    document.cookie = `auth_token=${parentToken}; path=/; max-age=86400; SameSite=Lax`;
    localStorage.setItem('auth_token', parentToken);
    
    const fetchUserData = async () => {
      try {
        // Fetch parent data
        const response = await fetch('https://peyvandyar.amintvk.ir/api/me', {
          headers: {
            'Authorization': `Bearer ${parentToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`خطا در دریافت اطلاعات: ${response.status}`);
        }

        const data = await response.json();
        setUserData(data);

        // Fetch children list
        if (data.success && data.user && data.user.basalam_vendor_id) {
          const childrenResponse = await fetch(
            `https://peyvandyar.amintvk.ir/api/parent-child/children/${data.user.basalam_vendor_id}`,
            {
              headers: {
                'Authorization': `Bearer ${parentToken}`,
                'Content-Type': 'application/json',
              },
            }
          );

          if (childrenResponse.ok) {
            const childrenData = await childrenResponse.json();
            console.log('Children data received:', childrenData);
            
            // Process children data based on new API response structure
            if (childrenData.success && Array.isArray(childrenData.children)) {
              const formattedChildren: ChildStore[] = childrenData.children.map((child: any) => ({
                relation_id: child.relation_id,
                vendor_id: parseInt(child.child_vendor_id),
                vendor_title: child.child_vendor_info?.vendor_title || `غرفه ${child.child_vendor_id}`,
                vendor_identifier: child.child_vendor_info?.vendor_identifier,
                status: child.status,
                created_at: child.created_at,
                relationship_age_days: child.relationship_age_days,
                sync_statistics: child.sync_statistics,
                sync_health: child.sync_health,
                sync_rules: child.sync_rules,
                child_token_hash: child.child_token_hash
              }));
              setChildStores(formattedChildren);
            }
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'خطای نامشخص');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleAddChild = async () => {
    if (!childToken.trim()) {
      setAddChildError('لطفا توکن را وارد کنید');
      return;
    }

    setAddingChild(true);
    setAddChildError(null);

    try {
      // First, fetch child info with their token to get childVendorId
      const childInfoResponse = await fetch('https://peyvandyar.amintvk.ir/api/auth/me-raw', {
        headers: {
          'Authorization': `Bearer ${childToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!childInfoResponse.ok) {
        throw new Error('خطا در دریافت اطلاعات غرفه بچه');
      }

      const childData = await childInfoResponse.json();
      
      if (!childData.success || !childData.data) {
        throw new Error('اطلاعات غرفه بچه نامعتبر است');
      }

      const childVendorId = childData.data.vendor?.id || childData.vendor?.id;
      
      if (!childVendorId) {
        throw new Error('شناسه فروشنده یافت نشد');
      }

      // Now add the child with complete payload
      const addResponse = await fetch('https://peyvandyar.amintvk.ir/api/parent-child/add-child', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${parentToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parentToken: parentToken,
          childVendorId: childVendorId.toString(),
          childToken: childToken,
          syncRules: {
            fields: [
              "primary_price",
              "stock",
              "description",
              "status"
            ],
            match_by: "name",
            conflict_resolution: "parent_wins"
          }
        }),
      });

      if (!addResponse.ok) {
        const errorData = await addResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'خطا در افزودن غرفه بچه');
      }

      // Success - refresh the children list to get updated info
      const childrenResponse = await fetch(
        `https://peyvandyar.amintvk.ir/api/parent-child/children/${userData?.user.basalam_vendor_id}`,
        {
          headers: {
            'Authorization': `Bearer ${parentToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (childrenResponse.ok) {
        const childrenData = await childrenResponse.json();
        if (childrenData.success && Array.isArray(childrenData.children)) {
          const formattedChildren: ChildStore[] = childrenData.children.map((child: any) => ({
            relation_id: child.relation_id,
            vendor_id: parseInt(child.child_vendor_id),
            vendor_title: child.child_vendor_info?.vendor_title || `غرفه ${child.child_vendor_id}`,
            vendor_identifier: child.child_vendor_info?.vendor_identifier,
            status: child.status,
            created_at: child.created_at,
            relationship_age_days: child.relationship_age_days,
            sync_statistics: child.sync_statistics,
            sync_health: child.sync_health,
            sync_rules: child.sync_rules,
            child_token_hash: child.child_token_hash
          }));
          setChildStores(formattedChildren);
        }
      }
      
      setShowAddChild(false);
      setChildToken('');
    } catch (err) {
      setAddChildError(err instanceof Error ? err.message : 'خطای نامشخص');
    } finally {
      setAddingChild(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const goToDashboard = (hashToken?: string) => {
    if (hashToken) {
      // Set hash token in cookie
      document.cookie = `auth_token=${hashToken}; path=/; max-age=86400; SameSite=Lax`;
      localStorage.setItem('auth_token', hashToken);
    }
    // Redirect to main dashboard
    window.location.href = '/dashboard';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-white to-amber-50/30" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-orange-200 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                <Store className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">داشبورد محمدیان</h1>
                <p className="text-sm text-slate-600">سیستم غرفه مادر پیوندیار</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                متصل به API
              </div>
              
              <button
                onClick={() => window.location.href = "/mohammadian"}
                className="flex items-center gap-2 px-4 py-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
              >
                <ArrowRight className="w-4 h-4" />
                بازگشت
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {loading && (
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-2xl border border-orange-200 p-8 shadow-lg">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
                <p className="text-slate-600">در حال بارگذاری اطلاعات...</p>
              </div>
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="max-w-md mx-auto">
            <div className="bg-red-50 rounded-2xl border border-red-200 p-8 shadow-lg">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Store className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-red-800 mb-2">خطا در بارگذاری</h3>
                <p className="text-red-600">{error}</p>
              </div>
            </div>
          </div>
        )}

        {userData && userData.success && !loading && (
          <div className="max-w-6xl mx-auto">
            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Parent Store Card */}
              <div className="bg-white rounded-2xl border-2 border-orange-300 shadow-xl overflow-hidden hover:shadow-2xl transition-shadow duration-300">
                <div className="relative h-40 bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 p-4">
                  <div className="absolute top-3 right-3">
                    <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                      <span className="text-white text-xs font-medium">غرفه مادر</span>
                    </div>
                  </div>
                  
                  {/* Three Dots Menu for Parent */}
                  <div className="absolute top-3 left-3">
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === 'parent' ? null : 'parent')}
                        className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4 text-white" />
                      </button>
                      
                      {/* Dropdown Menu */}
                      {openMenuId === 'parent' && (
                        <div className="absolute left-0 top-10 bg-white rounded-lg shadow-xl border border-slate-200 py-1 min-w-[180px] z-10">
                          <button
                            onClick={() => {
                              goToDashboard(parentToken);
                              setOpenMenuId(null);
                            }}
                            className="w-full px-4 py-2 text-right text-sm text-slate-700 hover:bg-orange-50 flex items-center gap-2 transition-colors"
                          >
                            <User className="w-4 h-4 text-orange-600" />
                            مشاهده جزئیات
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="absolute bottom-4 right-4">
                    <div className="w-16 h-16 bg-white rounded-xl shadow-lg flex items-center justify-center">
                      <Store className="w-8 h-8 text-orange-600" />
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-4">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                </div>

                <div className="p-5">
                  <div className="mb-4">
                    <h2 className="text-lg font-bold text-slate-800 mb-1">
                      {userData.user.vendor_title}
                    </h2>
                    <p className="text-slate-500 text-xs">فروشنده باسلام</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <span className="text-slate-600 text-xs">شناسه فروشنده</span>
                      <span className="text-slate-800 font-bold text-xs font-mono">
                        {userData.user.basalam_vendor_id}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <span className="text-slate-600 text-xs">شناسه کاربری</span>
                      <span className="text-slate-800 font-bold text-xs font-mono">
                        {userData.user.basalam_user_id}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-green-700 text-xs font-medium">متصل به پیوندیار</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Child Store Cards */}
              {childStores.map((child, index) => {
                // Determine health status color
                const healthColors = {
                  healthy: { bg: 'from-green-500 via-green-600 to-emerald-600', badge: 'bg-green-100 text-green-700 border-green-200' },
                  warning: { bg: 'from-yellow-500 via-yellow-600 to-amber-600', badge: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
                  critical: { bg: 'from-red-500 via-red-600 to-rose-600', badge: 'bg-red-100 text-red-700 border-red-200' },
                  active: { bg: 'from-blue-500 via-blue-600 to-indigo-600', badge: 'bg-blue-100 text-blue-700 border-blue-200' }
                };
                
                const healthColor = healthColors[child.sync_health.status as keyof typeof healthColors] || healthColors.active;
                
                return (
                  <div key={index} className="bg-white rounded-2xl border border-orange-200 shadow-xl overflow-hidden hover:shadow-2xl transition-shadow duration-300">
                    <div className={`relative h-40 bg-gradient-to-br ${healthColor.bg} p-4`}>
                      <div className="absolute top-3 right-3">
                        <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                          <span className="text-white text-xs font-medium">غرفه بچه {index + 1}</span>
                        </div>
                      </div>
                      
                      {/* Three Dots Menu */}
                      <div className="absolute top-3 left-3">
                        <div className="relative">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === child.vendor_id ? null : child.vendor_id)}
                            className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                          >
                            <MoreVertical className="w-4 h-4 text-white" />
                          </button>
                          
                          {/* Dropdown Menu */}
                          {openMenuId === child.vendor_id && (
                            <div className="absolute left-0 top-10 bg-white rounded-lg shadow-xl border border-slate-200 py-1 min-w-[180px] z-10">
                              <button
                                onClick={() => {
                                  setSelectedChild(child);
                                  setShowTransferModal(true);
                                  setOpenMenuId(null);
                                }}
                                className="w-full px-4 py-2 text-right text-sm text-slate-700 hover:bg-orange-50 flex items-center gap-2 transition-colors"
                              >
                                <Package className="w-4 h-4 text-orange-600" />
                                انتقال محصولات
                              </button>
                              <button
                                onClick={() => {
                                  goToDashboard(child.child_token_hash);
                                  setOpenMenuId(null);
                                }}
                                className="w-full px-4 py-2 text-right text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                              >
                                <User className="w-4 h-4 text-slate-600" />
                                مشاهده جزئیات
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="absolute bottom-4 right-4">
                        <div className="w-16 h-16 bg-white rounded-xl shadow-lg flex items-center justify-center">
                          <ShoppingBag className="w-8 h-8 text-blue-600" />
                        </div>
                      </div>
                    </div>

                    <div className="p-5">
                      <div className="mb-4">
                        <h2 className="text-lg font-bold text-slate-800 mb-1">
                          {child.vendor_title}
                        </h2>
                        <p className="text-slate-500 text-xs">@{child.vendor_identifier || 'نامشخص'}</p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <span className="text-slate-600 text-xs">شناسه فروشنده</span>
                          <span className="text-slate-800 font-bold text-xs font-mono">
                            {child.vendor_id}
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <span className="text-slate-600 text-xs">محصولات همگام</span>
                          <span className="text-slate-800 font-bold text-xs">
                            {child.sync_statistics.synced_products_count}
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <span className="text-slate-600 text-xs">نرخ موفقیت</span>
                          <span className="text-slate-800 font-bold text-xs">
                            {child.sync_statistics.success_rate}
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <span className="text-slate-600 text-xs">مدت ارتباط</span>
                          <span className="text-slate-800 font-bold text-xs">
                            {child.relationship_age_days} روز
                          </span>
                        </div>
                      </div>

                      <div className={`mt-4 p-3 border rounded-lg ${healthColor.badge}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${child.sync_health.status === 'critical' ? 'bg-red-500' : child.sync_health.status === 'warning' ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                            <span className="text-xs font-medium">
                              {child.sync_health.status === 'critical' ? 'نیاز به توجه' : child.sync_health.status === 'warning' ? 'هشدار' : 'سالم'}
                            </span>
                          </div>
                          <span className="text-xs">
                            {child.sync_health.last_activity}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Add Child Card */}
              {!showAddChild && (
                <div 
                  onClick={() => setShowAddChild(true)}
                  className="bg-white rounded-2xl border-2 border-dashed border-orange-300 shadow-lg overflow-hidden hover:shadow-xl hover:border-orange-400 transition-all duration-300 cursor-pointer group"
                >
                  <div className="relative h-40 bg-gradient-to-br from-orange-100 via-orange-50 to-amber-50 p-4 flex items-center justify-center">
                    <div className="w-20 h-20 bg-white rounded-full shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Plus className="w-10 h-10 text-orange-500" />
                    </div>
                  </div>

                  <div className="p-5 text-center">
                    <h3 className="text-lg font-bold text-slate-800 mb-2">افزودن غرفه بچه</h3>
                    <p className="text-slate-600 text-sm">برای افزودن غرفه بچه کلیک کنید</p>
                  </div>
                </div>
              )}

              {/* Add Child Form Card */}
              {showAddChild && (
                <div className="bg-white rounded-2xl border-2 border-orange-300 shadow-xl overflow-hidden">
                  <div className="relative h-40 bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 p-4">
                    <div className="absolute bottom-4 right-4">
                      <div className="w-16 h-16 bg-white rounded-xl shadow-lg flex items-center justify-center">
                        <Plus className="w-8 h-8 text-orange-600" />
                      </div>
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">افزودن غرفه بچه</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          توکن غرفه بچه
                        </label>
                        <input
                          type="text"
                          value={childToken}
                          onChange={(e) => setChildToken(e.target.value)}
                          placeholder="توکن را وارد کنید"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                          dir="ltr"
                        />
                      </div>

                      {addChildError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-red-600 text-xs">{addChildError}</p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button
                          onClick={handleAddChild}
                          disabled={addingChild}
                          className="flex-1 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                        >
                          {addingChild ? (
                            <span className="flex items-center justify-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              در حال افزودن...
                            </span>
                          ) : (
                            'افزودن'
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setShowAddChild(false);
                            setChildToken('');
                            setAddChildError(null);
                          }}
                          className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
                        >
                          انصراف
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Guide Section - Only show when no children */}
            {childStores.length === 0 && !showAddChild && (
              <div className="mt-8 bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl border border-orange-200 p-8 shadow-lg">
                <div className="max-w-2xl mx-auto">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ShoppingBag className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">غرفه بچه را در اینجا وارد کنید</h3>
                    <p className="text-slate-600">برای شروع، غرفه بچه خود را به سیستم اضافه کنید</p>
                  </div>

                  <div className="bg-white rounded-xl p-6 shadow-md">
                    <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <span className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm">📋</span>
                      راهنمای مرحله به مرحله
                    </h4>
                    
                    <ol className="space-y-4">
                      <li className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">۱</span>
                        <p className="text-slate-700 pt-0.5">
                          به <a href="https://developers.basalam.com" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:text-orange-700 font-medium underline">developers.basalam.com</a> مراجعه کنید
                        </p>
                      </li>
                      <li className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">۲</span>
                        <p className="text-slate-700 pt-0.5">
                          ورود به پنل را بزنید و به قسمت <span className="font-semibold">توکن‌های دسترسی شخصی</span> بروید
                        </p>
                      </li>
                      <li className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">۳</span>
                        <p className="text-slate-700 pt-0.5">
                          روی <span className="font-semibold">ایجاد توکن شخصی</span> کلیک کنید و تمامی تیک‌ها را بزنید و یک اسم انگلیسی برای توکن خود انتخاب کنید
                        </p>
                      </li>
                      <li className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">۴</span>
                        <p className="text-slate-700 pt-0.5">
                          توکن را در کادر بالا وارد کنید
                        </p>
                      </li>
                    </ol>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Transfer Products Modal */}
      {showTransferModal && selectedChild && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowTransferModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-br from-orange-500 to-amber-600 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">انتقال محصولات</h3>
                    <p className="text-white/80 text-sm">به {selectedChild.vendor_title}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowTransferModal(false)}
                  className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  <span className="text-white text-xl">×</span>
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Store className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-600 mb-1">غرفه مقصد:</p>
                      <p className="font-bold text-slate-800">{selectedChild.vendor_title}</p>
                      <p className="text-xs text-slate-500 mt-1">شناسه: {selectedChild.vendor_id}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                  <p className="text-sm text-orange-800">
                    <span className="font-bold">توجه:</span> محصولات از غرفه مادر به این غرفه منتقل خواهند شد.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    // TODO: Implement transfer logic
                    alert('قابلیت انتقال محصولات به زودی اضافه می‌شود');
                    setShowTransferModal(false);
                  }}
                  className="flex-1 bg-orange-500 text-white px-4 py-3 rounded-xl hover:bg-orange-600 transition-colors font-medium"
                >
                  شروع انتقال
                </button>
                <button
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-3 border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium"
                >
                  انصراف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
