// firebase_config.js - Cấu hình & Quản lý Kết nối Đám Mây Google Firebase Firestore cho SmartEdu THCS

/**
 * CẤU HÌNH GOOGLE FIREBASE CLOUD DATABASE:
 * - Để kết nối tới dự án Firebase của bạn:
 *   1. Truy cập https://console.firebase.google.com (đăng nhập bằng Google).
 *   2. Tạo dự án mới (ví dụ: SmartEdu-THCS).
 *   3. Bấm vào icon Web </>, đặt tên ứng dụng và sao chép đối tượng firebaseConfig dán vào bên dưới.
 *   4. Trong menu bên trái, vào "Build" -> "Firestore Database" -> "Create Database" (chọn test mode để bắt đầu ngay).
 */
window.FIREBASE_CONFIG = window.FIREBASE_CONFIG || {
  apiKey: "AIzaSyB-WjusIzantRlncU2cKoCPrKOfBdWmvMk",
  authDomain: "phanmemhoctap-24dd1.firebaseapp.com",
  projectId: "phanmemhoctap-24dd1",
  storageBucket: "phanmemhoctap-24dd1.firebasestorage.app",
  messagingSenderId: "1050032415597",
  appId: "1:1050032415597:web:a4fc18db2929e10e443064",
  measurementId: "G-46J7CJJHKC"
};

// ================= SMARTEDU CLOUD SYNC MODULE =================
(function() {
  const CloudDB = {
    isFirebaseReady: false,
    db: null,
    listeners: [],

    // Khởi tạo Firebase
    init() {
      // 1. Kiểm tra cấu hình lưu trong localStorage trước (nếu người dùng đã cấu hình trong UI)
      try {
        const savedConfig = localStorage.getItem('smartedu_firebase_custom_config');
        if (savedConfig) {
          const parsed = JSON.parse(savedConfig);
          if (parsed && parsed.projectId) {
            window.FIREBASE_CONFIG = parsed;
          }
        }
      } catch (e) {}

      // 2. Đảm bảo tài khoản Super Admin mặc định luôn sẵn sàng
      this._ensureSuperAdminAccount();

      // 3. Thử khởi tạo Firebase nếu có projectId
      if (window.firebase && window.FIREBASE_CONFIG && window.FIREBASE_CONFIG.projectId && window.FIREBASE_CONFIG.projectId.trim() !== '') {
        try {
          if (!firebase.apps.length) {
            firebase.initializeApp(window.FIREBASE_CONFIG);
          }
          this.db = firebase.firestore();
          this.isFirebaseReady = true;
          console.log('✅ Google Firebase Firestore đã kết nối thành công:', window.FIREBASE_CONFIG.projectId);
          
          // Đồng bộ tài khoản Super Admin lên Firestore nếu chưa có
          this._syncSuperAdminToCloud();
        } catch (err) {
          console.warn('⚠️ Lỗi khởi tạo Firebase, chuyển sang chế độ Đồng bộ Cục bộ:', err);
          this.isFirebaseReady = false;
        }
      } else {
        console.log('ℹ️ Firebase chưa có cấu hình; sử dụng Cloud Local Storage Cache.');
        this.isFirebaseReady = false;
      }
    },

    // Đảm bảo có tài khoản Super Admin trong bộ nhớ
    _ensureSuperAdminAccount() {
      const localUsers = this._getLocalUsers();
      if (!localUsers['admin'] || !localUsers['admin'].profile || localUsers['admin'].password !== '123') {
        localUsers['admin'] = {
          username: 'admin',
          password: '123',
          profile: {
            name: 'Thầy/Cô Quản Trị Viên (Super Admin)',
            grade: 'Quản Lý',
            className: 'Ban Giám Hiệu / Quản Trị',
            school: 'Hệ Thống Giáo Dục THCS',
            avatar: '👑',
            role: 'superadmin',
            createdAt: '22/11/2026',
            lastLogin: new Date().toLocaleString('vi-VN')
          },
          scores: [],
          mindmaps: [],
          summaries: [],
          flashcards: []
        };
        this._setLocalUsers(localUsers);
      }
    },

    // Đẩy Super Admin lên Firestore nếu chưa có
    async _syncSuperAdminToCloud() {
      if (this.isFirebaseReady && this.db) {
        try {
          const docRef = this.db.collection('users').doc('admin');
          const doc = await docRef.get();
          if (!doc.exists) {
            const localUsers = this._getLocalUsers();
            if (localUsers['admin']) {
              await docRef.set(localUsers['admin']);
              console.log('👑 Đã khởi tạo Super Admin trên Google Firebase Cloud!');
            }
          }
        } catch (e) {}
      }
    },

    // Kiểm tra trạng thái kết nối
    getStatus() {
      return {
        online: navigator.onLine,
        isFirebase: this.isFirebaseReady,
        projectId: window.FIREBASE_CONFIG?.projectId || 'Chế độ Cục bộ (Local Cloud)'
      };
    },

    // Lấy dữ liệu mới nhất của một tài khoản từ Firebase Firestore (hoặc cache cục bộ)
    async getUserData(username) {
      if (!username) return null;
      const cleanUsername = username.trim().toLowerCase();

      if (this.isFirebaseReady && this.db) {
        try {
          const docRef = this.db.collection('users').doc(cleanUsername);
          const doc = await docRef.get();
          if (doc.exists) {
            const data = doc.data();
            this._saveLocalUser(data);
            return data;
          }
        } catch (e) {
          console.warn('⚠️ Lỗi nạp dữ liệu Firebase cho ' + cleanUsername + ', dùng cache:', e);
        }
      }

      // Tìm trong cache cục bộ
      try {
        const scopedRaw = localStorage.getItem(`smartedu_user_${cleanUsername}_data`);
        if (scopedRaw) {
          const parsed = JSON.parse(scopedRaw);
          if (parsed && parsed.username) return parsed;
        }
      } catch (e) {}

      const localUsers = this._getLocalUsers();
      return localUsers[cleanUsername] || null;
    },

    // Đăng ký tài khoản mới lên Web
    async registerUser(username, password, profileData) {
      const cleanUsername = (username || '').trim().toLowerCase();
      
      // Không cho phép trùng tên admin
      if (cleanUsername === 'admin') {
        return { success: false, message: 'Tên tài khoản "admin" đã được bảo lưu cho Super Admin của trường!' };
      }

      // Chuẩn bị payload tài khoản
      const userPayload = {
        username: cleanUsername,
        password: password, // Mã PIN hoặc mật khẩu
        profile: {
          name: profileData.name || 'Học sinh',
          grade: profileData.grade || '9',
          className: profileData.className || '9A1',
          school: profileData.school || 'THCS',
          avatar: profileData.avatar || '👨‍🎓',
          createdAt: new Date().toLocaleDateString('vi-VN'),
          lastLogin: new Date().toLocaleString('vi-VN')
        },
        scores: [],
        mindmaps: [],
        summaries: [],
        flashcards: []
      };

      if (this.isFirebaseReady && this.db) {
        try {
          const docRef = this.db.collection('users').doc(cleanUsername);
          const doc = await docRef.get();
          if (doc.exists) {
            return { success: false, message: 'Tên đăng nhập này đã có người sử dụng. Vui lòng chọn tên khác!' };
          }
          await docRef.set(userPayload);
          // Lưu sao chép cục bộ
          this._saveLocalUser(userPayload);
          return { success: true, user: userPayload };
        } catch (e) {
          console.error('Lỗi đăng ký Firebase:', e);
          return { success: false, message: 'Lỗi kết nối Firebase: ' + (e.message || e) };
        }
      } else {
        // Lưu trên kho Local Cloud
        const localUsers = this._getLocalUsers();
        if (localUsers[cleanUsername]) {
          return { success: false, message: 'Tên đăng nhập này đã tồn tại trên thiết bị này!' };
        }
        localUsers[cleanUsername] = userPayload;
        this._setLocalUsers(localUsers);
        return { success: true, user: userPayload };
      }
    },

    // Đăng nhập tài khoản từ Web
    async loginUser(username, password) {
      const cleanUsername = (username || '').trim().toLowerCase();
      const cleanPassword = (password || '').trim();

      // ================= ĐẶC QUYỀN SUPER ADMIN =================
      if (cleanUsername === 'admin') {
        this._ensureSuperAdminAccount();
        const localUsers = this._getLocalUsers();
        let adminUser = localUsers['admin'];

        // Kiểm tra mật khẩu (mặc định là '123' hoặc mật khẩu đã đổi)
        if (cleanPassword !== '123' && cleanPassword !== adminUser.password) {
          return { success: false, message: 'Mật khẩu Super Admin không chính xác! (Mặc định là 123)' };
        }

        // Đảm bảo thông tin Super Admin đầy đủ
        adminUser.profile = adminUser.profile || {};
        adminUser.profile.name = adminUser.profile.name || 'Thầy/Cô Quản Trị Viên (Super Admin)';
        adminUser.profile.role = 'superadmin';
        adminUser.profile.lastLogin = new Date().toLocaleString('vi-VN');
        this._saveLocalUser(adminUser);

        // Đồng bộ ngầm lên Firestore nếu có (không await để đăng nhập lập tức)
        if (this.isFirebaseReady && this.db) {
          this.db.collection('users').doc('admin').set(adminUser, { merge: true }).catch(() => {});
        }

        return { success: true, user: adminUser };
      }

      // ================= TÀI KHOẢN HỌC SINH THƯỜNG =================
      if (this.isFirebaseReady && this.db) {
        try {
          const docRef = this.db.collection('users').doc(cleanUsername);
          const doc = await docRef.get();
          if (!doc.exists) {
            // Kiểm tra local cache dự phòng
            const localUsers = this._getLocalUsers();
            const localUser = localUsers[cleanUsername];
            if (localUser && localUser.password === cleanPassword) {
              return { success: true, user: localUser };
            }
            return { success: false, message: 'Tên tài khoản không tồn tại trên hệ thống Web!' };
          }
          const userData = doc.data();
          if (userData.password && userData.password !== cleanPassword) {
            return { success: false, message: 'Mật khẩu hoặc mã PIN không chính xác!' };
          }
          // Cập nhật lastLogin
          userData.profile = userData.profile || {};
          userData.profile.lastLogin = new Date().toLocaleString('vi-VN');
          await docRef.update({ 'profile.lastLogin': userData.profile.lastLogin });

          // Lưu cache vào local
          this._saveLocalUser(userData);
          return { success: true, user: userData };
        } catch (e) {
          console.error('Lỗi đăng nhập Firebase:', e);
          // Thử tìm trong local cache nếu rớt mạng
          const localUsers = this._getLocalUsers();
          const localUser = localUsers[cleanUsername];
          if (localUser && localUser.password === cleanPassword) {
            return { success: true, user: localUser, isOffline: true };
          }
          return { success: false, message: 'Không thể kết nối đến máy chủ: ' + (e.message || e) };
        }
      } else {
        // Tìm trong kho Local Cloud
        const localUsers = this._getLocalUsers();
        const user = localUsers[cleanUsername];
        if (!user) {
          return { success: false, message: 'Tên tài khoản không tồn tại trên thiết bị này!' };
        }
        if (user.password && user.password !== cleanPassword) {
          return { success: false, message: 'Mật khẩu hoặc mã PIN không chính xác!' };
        }
        user.profile = user.profile || {};
        user.profile.lastLogin = new Date().toLocaleString('vi-VN');
        this._setLocalUsers(localUsers);
        return { success: true, user: user };
      }
    },

    // Lưu toàn bộ dữ liệu tài khoản lên Web
    async syncUserData(userData) {
      if (!userData || !userData.username) return;
      const cleanUsername = userData.username.trim().toLowerCase();

      // Lưu cache cục bộ trước
      this._saveLocalUser(userData);

      // Đẩy lên Firebase nếu kết nối khả dụng
      if (this.isFirebaseReady && this.db) {
        try {
          const docRef = this.db.collection('users').doc(cleanUsername);
          await docRef.set(userData, { merge: true });
          console.log('☁️ Đã đồng bộ dữ liệu lên Firebase Cloud thành công cho:', cleanUsername);
          return true;
        } catch (e) {
          console.warn('⚠️ Lỗi đồng bộ Firebase Cloud (đã lưu cache cục bộ):', e);
          return false;
        }
      }
      return true;
    },

    // ================= PHƯƠNG THỨC DÀNH CHO SUPER ADMIN =================

    // Lấy toàn bộ danh sách tài khoản & bài học của tất cả học sinh trên hệ thống (Dạng mảng Array)
    async getAllUsers() {
      this._ensureSuperAdminAccount();
      const allUsers = { ...this._getLocalUsers() };

      if (this.isFirebaseReady && this.db) {
        try {
          const snapshot = await this.db.collection('users').get();
          snapshot.forEach(doc => {
            allUsers[doc.id] = doc.data();
          });
          // Đồng bộ lại local cache
          this._setLocalUsers(allUsers);
        } catch (e) {
          console.warn('⚠️ Lỗi nạp danh sách người dùng từ Firebase (dùng cache):', e);
        }
      }
      return Object.values(allUsers);
    },

    // Super Admin xóa một tài khoản học sinh
    async adminDeleteUser(username) {
      const cleanUsername = (username || '').trim().toLowerCase();
      if (cleanUsername === 'admin') {
        return { success: false, message: 'Không thể xóa tài khoản Super Admin gốc của hệ thống!' };
      }

      const localUsers = this._getLocalUsers();
      delete localUsers[cleanUsername];
      this._setLocalUsers(localUsers);

      if (this.isFirebaseReady && this.db) {
        try {
          await this.db.collection('users').doc(cleanUsername).delete();
          console.log('🗑️ Super Admin đã xóa tài khoản trên Firebase:', cleanUsername);
        } catch (e) {
          console.error('Lỗi xóa trên Firebase:', e);
        }
      }
      return { success: true, message: 'Đã xóa tài khoản học sinh thành công!' };
    },

    // Super Admin đặt lại mật khẩu cho học sinh
    async adminResetPassword(username, newPassword) {
      const cleanUsername = (username || '').trim().toLowerCase();
      const localUsers = this._getLocalUsers();
      if (localUsers[cleanUsername]) {
        localUsers[cleanUsername].password = newPassword;
        this._setLocalUsers(localUsers);
      }

      if (this.isFirebaseReady && this.db) {
        try {
          await this.db.collection('users').doc(cleanUsername).update({ password: newPassword });
        } catch (e) {
          console.error('Lỗi cập nhật mật khẩu trên Firebase:', e);
        }
      }
      return { success: true, message: `Đã đổi mật khẩu cho @${cleanUsername} thành công!` };
    },

    // Super Admin xóa một bài (sơ đồ, tóm tắt, điểm thi, hoặc thẻ lật) của một học sinh
    async adminDeleteUserPost(username, postType, postId) {
      const cleanUsername = (username || '').trim().toLowerCase();
      const localUsers = this._getLocalUsers();
      const user = localUsers[cleanUsername];
      if (!user) return { success: false, message: 'Không tìm thấy tài khoản!' };

      if (postType === 'mindmap' && user.mindmaps) {
        user.mindmaps = user.mindmaps.filter(m => m.id !== postId);
      } else if (postType === 'summary' && user.summaries) {
        user.summaries = user.summaries.filter(s => s.id !== postId);
      } else if (postType === 'score' && user.scores) {
        user.scores = user.scores.filter(sc => sc.id != postId);
      } else if (postType === 'flashcard' && user.flashcards) {
        user.flashcards = user.flashcards.filter(f => f.id !== postId);
      }

      await this.syncUserData(user);
      return { success: true, message: 'Đã xóa bài viết thành công!' };
    },

    // Các hàm phụ trợ lưu trữ cache an toàn (hỗ trợ cả Array legacy và Object)
    _getLocalUsers() {
      try {
        const raw = localStorage.getItem('smartedu_cloud_local_users');
        let cleanObj = {};
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            parsed.forEach(u => {
              if (u && u.username) cleanObj[u.username.toLowerCase()] = u;
            });
          } else if (parsed && typeof parsed === 'object') {
            cleanObj = { ...parsed };
          }
        }
        // Kiểm tra bổ sung các tài khoản lưu độc lập
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('smartedu_user_') && key.endsWith('_data')) {
            try {
              const uData = JSON.parse(localStorage.getItem(key));
              if (uData && uData.username) {
                cleanObj[uData.username.toLowerCase()] = uData;
              }
            } catch (e) {}
          }
        }
        return cleanObj;
      } catch (e) {
        return {};
      }
    },

    _setLocalUsers(usersObj) {
      try {
        const cleanObj = (usersObj && typeof usersObj === 'object' && !Array.isArray(usersObj)) ? usersObj : {};
        if (Array.isArray(usersObj)) {
          usersObj.forEach(u => {
            if (u && u.username) cleanObj[u.username.toLowerCase()] = u;
          });
        }
        localStorage.setItem('smartedu_cloud_local_users', JSON.stringify(cleanObj));
      } catch (e) {}
    },

    _saveLocalUser(userData) {
      if (!userData || !userData.username) return;
      const cleanUsername = userData.username.trim().toLowerCase();
      // 1. Lưu cô lập tuyệt đối theo tài khoản riêng biệt
      try {
        localStorage.setItem(`smartedu_user_${cleanUsername}_data`, JSON.stringify(userData));
      } catch (e) {}

      // 2. Lưu vào danh mục tài khoản thiết bị
      const users = this._getLocalUsers();
      users[cleanUsername] = userData;
      this._setLocalUsers(users);
    }
  };

  // Khởi chạy module
  window.SmartEduCloud = CloudDB;
  CloudDB.init();
})();
