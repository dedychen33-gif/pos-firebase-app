// Local Storage Cache Utility
// Menyimpan data Firebase di localStorage untuk loading lebih cepat

const CACHE_PREFIX = 'pos_cache_';
const CACHE_TIMESTAMP_PREFIX = 'pos_cache_ts_';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 menit

export const localCache = {
  // Simpan data ke localStorage
  set: (key: string, data: any) => {
    try {
      const cacheKey = CACHE_PREFIX + key;
      const timestampKey = CACHE_TIMESTAMP_PREFIX + key;
      
      localStorage.setItem(cacheKey, JSON.stringify(data));
      localStorage.setItem(timestampKey, Date.now().toString());
      
      console.log(`✅ Cache saved: ${key}`);
    } catch (error) {
      console.error('Error saving to cache:', error);
    }
  },

  // Ambil data dari localStorage
  get: (key: string) => {
    try {
      const cacheKey = CACHE_PREFIX + key;
      const timestampKey = CACHE_TIMESTAMP_PREFIX + key;
      
      const cached = localStorage.getItem(cacheKey);
      const timestamp = localStorage.getItem(timestampKey);
      
      if (!cached || !timestamp) {
        return null;
      }

      // Check if cache expired
      const age = Date.now() - parseInt(timestamp);
      if (age > CACHE_EXPIRY) {
        console.log(`⏰ Cache expired: ${key}`);
        localCache.remove(key);
        return null;
      }

      console.log(`✅ Cache hit: ${key} (age: ${Math.round(age / 1000)}s)`);
      return JSON.parse(cached);
    } catch (error) {
      console.error('Error reading from cache:', error);
      return null;
    }
  },

  // Hapus data dari localStorage
  remove: (key: string) => {
    try {
      const cacheKey = CACHE_PREFIX + key;
      const timestampKey = CACHE_TIMESTAMP_PREFIX + key;
      
      localStorage.removeItem(cacheKey);
      localStorage.removeItem(timestampKey);
    } catch (error) {
      console.error('Error removing from cache:', error);
    }
  },

  // Hapus semua cache
  clear: () => {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(CACHE_PREFIX) || key.startsWith(CACHE_TIMESTAMP_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
      console.log('✅ All cache cleared');
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  },

  // Check apakah cache masih valid
  isValid: (key: string) => {
    try {
      const timestampKey = CACHE_TIMESTAMP_PREFIX + key;
      const timestamp = localStorage.getItem(timestampKey);
      
      if (!timestamp) return false;

      const age = Date.now() - parseInt(timestamp);
      return age <= CACHE_EXPIRY;
    } catch (error) {
      return false;
    }
  }
};
