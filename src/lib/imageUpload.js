import api from './api';
import showToast from './toast';

export const uploadImage = async (file, type = 'image', language = 'en') => {
  if (!file) {
    return null;
  }

  // Validate file type
  if (!file.type.startsWith('image/')) {
    showToast.error(language === 'ar' ? 'الملف يجب أن يكون صورة' : 'File must be an image');
    return null;
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    showToast.error(language === 'ar' ? 'حجم الصورة يجب أن يكون أقل من 5MB' : 'Image size must be less than 5MB');
    return null;
  }

  try {
    const formData = new FormData();
    formData.append('file', file); // Primary field
    formData.append('image', file); // Fallback field
    formData.append('type', type);

    const response = await api.post('/admin/file-uploads', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const imageUrl = response.data?.data?.url || 
                    response.data?.data?.file_url || 
                    response.data?.url ||
                    response.data?.file?.url;

    if (imageUrl) {
      showToast.success(language === 'ar' ? 'تم رفع الصورة بنجاح' : 'Image uploaded successfully');
      return imageUrl;
    } else {
      showToast.error(language === 'ar' ? 'فشل الحصول على رابط الصورة' : 'Failed to get image URL');
      return null;
    }
  } catch (error) {
    console.error('Error uploading image:', error);
    showToast.error(
      error.response?.data?.message || 
      (language === 'ar' ? 'فشل رفع الصورة' : 'Failed to upload image')
    );
    return null;
  }
};

export default uploadImage;

