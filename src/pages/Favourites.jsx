import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import showToast from '@/lib/toast';
import { extractDataFromResponse } from '@/lib/apiHelper';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, ShoppingCart, Eye, Trash2 } from 'lucide-react';

export default function Favourites() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [favourites, setFavourites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFavourites();
  }, []);

  const fetchFavourites = async () => {
    try {
      const response = await api.get('/favourites');
      const data = extractDataFromResponse(response);
      setFavourites(Array.isArray(data) ? data : (data?.data || []));
    } catch (error) {
      console.error('Error fetching favourites:', error);
      setFavourites([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavourite = async (productId, e) => {
    e.stopPropagation();
    try {
      await api.delete(`/favourites/${productId}`);
      setFavourites(prev => prev.filter(fav => fav.product_id !== productId));
    } catch (error) {
      console.error('Error removing favourite:', error);
      showToast.error(language === 'ar' ? 'فشل إزالة المنتج من المفضلة' : 'Failed to remove from favourites');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Heart className="w-8 h-8 text-red-500 fill-red-500" />
          {language === 'ar' ? 'المفضلة' : 'Favourites'}
        </h1>
        <p className="text-muted-foreground mt-2">
          {language === 'ar' ? 'المنتجات التي أضفتها إلى المفضلة' : 'Products you have added to favourites'}
        </p>
      </div>

      {favourites.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <Heart className="w-24 h-24 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-lg text-muted-foreground">
            {language === 'ar' ? 'لا توجد منتجات في المفضلة بعد' : 'No favourite products yet'}
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => navigate('/products')}
          >
            {language === 'ar' ? 'تصفح المنتجات' : 'Browse Products'}
          </Button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence>
            {favourites.map((favourite, index) => {
              const product = favourite.product || favourite;
              return (
                <motion.div
                  key={favourite.id || product.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -5 }}
                >
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => navigate(`/products/${product.id}`)}
                  >
                    <div className="relative">
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-48 object-cover"
                        />
                      ) : (
                        <div className="w-full h-48 bg-muted flex items-center justify-center">
                          <span className="text-4xl">📦</span>
                        </div>
                      )}
                      <motion.button
                        onClick={(e) => handleRemoveFavourite(product.id, e)}
                        className="absolute top-2 right-2 p-2 bg-background/80 backdrop-blur-sm rounded-full hover:bg-destructive hover:text-destructive-foreground transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Heart className="w-5 h-5 fill-red-500 text-red-500" />
                      </motion.button>
                      {product.discount_percentage && (
                        <span className="absolute top-2 left-2 px-2 py-1 bg-green-500 text-white text-xs rounded">
                          -{product.discount_percentage}%
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                        {product.name || product.name_en || product.name_ar}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {product.description || product.short_description || ''}
                      </p>
                      <div className="flex items-center justify-between">
                        <div>
                          {product.discount_percentage ? (
                            <>
                              <p className="text-lg font-bold text-green-600">
                                ${((parseFloat(product.price || 0) * (1 - parseFloat(product.discount_percentage || 0) / 100))).toFixed(2)}
                              </p>
                              <p className="text-xs text-muted-foreground line-through">
                                ${parseFloat(product.price || 0).toFixed(2)}
                              </p>
                            </>
                          ) : (
                            <p className="text-lg font-bold">
                              ${parseFloat(product.price || 0).toFixed(2)}
                            </p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Add to cart logic here
                          }}
                        >
                          <ShoppingCart className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}




