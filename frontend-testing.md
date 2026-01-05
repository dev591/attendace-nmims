
# 🛡️ Security & Testing Checklist

## 🔐 Authentication Fixes
We have replaced the mock login with a strict real backend integration.

## 🧪 How to Verify
1.  **Start Backend**: `cd backend && npm start`
2.  **Start Frontend**: `cd .. && npm run dev`

### Test Cases
- [ ] **Invalid Login**: Enter `99999999` / `abc`. Should show error message "Student not found" or similar. **Should NOT redirect.**
- [ ] **Valid Login A**: Enter `50012023` / `password123`. -> Dashboard. **Verify Name is "Seed Student" in top right.**
- [ ] **Valid Login B**: Enter `70012023`. -> Dashboard. **Verify Name matches database (e.g. "Dev Chalana")**.
- [ ] **Logout**: Click logout icon. Should match behavior of "Logout (Force)" in debug banner.
- [ ] **Direct Access**: Try going to `http://localhost:5173/student/dashboard` without logging in. Should redirect back to Login (`/`).
- [ ] **Debug Banner**: Check bottom-right corner. It should show the *Active User Name*.

## 📁 Files Modified
- `src/pages/Landing.jsx`: Real `fetch` login logic.
- `src/App.jsx`: Wrapped routes with `ProtectedRoute`.
- `src/components/ProtectedRoute.jsx`: New file.
- `src/components/DebugBanner.jsx`: New file.
