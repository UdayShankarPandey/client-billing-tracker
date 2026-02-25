import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { saveUserPrefs } from "../utils/userPrefs";
import { authAPI } from "../services/api";
import StateWrapper from "../components/ui/StateWrapper";
import SkeletonLoader from "../components/ui/SkeletonLoader";
import OnboardingTour from "../components/ui/OnboardingTour";
import useUnsavedChangesWarning from "../hooks/useUnsavedChangesWarning";
import { mapZodErrors, profileSchema } from "../utils/validation";
import { useToast } from "../components/ui/Toast";

const readStoredUser = () => {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
};

const ProfilePage = ({ onLogout }) => {
  const navigate = useNavigate();
  const { theme, setMode } = useTheme();
  const storedUser = useMemo(() => readStoredUser(), []);
  const avatarInputRef = useRef(null);
  const [showTour, setShowTour] = useState(false);

  const [name, setName] = useState(storedUser?.name || "User");
  const [email, setEmail] = useState(storedUser?.email || "user@example.com");
  const [avatar, setAvatar] = useState(storedUser?.avatar || "");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [saved, setSaved] = useState(false);
  const [passwordNotice, setPasswordNotice] = useState("");
  const [avatarNotice, setAvatarNotice] = useState("");
  const isDirty = name.trim() !== (storedUser?.name || "User").trim();
  const [dirtyToastShown, setDirtyToastShown] = useState(false);
  const toast = useToast();
  useUnsavedChangesWarning(isDirty);

  const initial = (name || "U").trim().charAt(0).toUpperCase();
  const avatarSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><rect width='100%' height='100%' rx='60' fill='%23d9e2ec'/><text x='50%' y='55%' font-size='52' fill='%231f2937' font-family='system-ui, -apple-system, Segoe UI, sans-serif' text-anchor='middle' dominant-baseline='middle'>${initial}</text></svg>`;
  const avatarSrc = avatar || `data:image/svg+xml;utf8,${encodeURIComponent(avatarSvg)}`;

  const persistUser = (updates = {}) => {
    const latest = readStoredUser() || {};
    const nextUser = { ...latest, ...updates };
    localStorage.setItem("user", JSON.stringify(nextUser));
    saveUserPrefs(nextUser, {
      name: nextUser.name,
      email: nextUser.email,
      avatar: nextUser.avatar,
    });
    window.dispatchEvent(new Event("user-updated"));
    return nextUser;
  };

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await authAPI.getProfile();
        const profile = response.data || {};
        setName(profile.name || storedUser?.name || "User");
        setEmail(profile.email || storedUser?.email || "user@example.com");
        setAvatar(profile.profileImage || storedUser?.avatar || "");
        persistUser({ name: profile.name, email: profile.email, avatar: profile.profileImage, role: profile.role });
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load profile");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  useEffect(() => {
    if (isDirty && !dirtyToastShown) {
      toast.show({ type: "info", message: "You have unsaved profile changes", duration: 2500 });
      setDirtyToastShown(true);
    }
    if (!isDirty && dirtyToastShown) {
      setDirtyToastShown(false);
    }
  }, [isDirty, dirtyToastShown, toast]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setFieldErrors({});

    const validation = profileSchema.safeParse({ name });
    if (!validation.success) {
      setFieldErrors(mapZodErrors(validation.error));
      return;
    }

    setSaving(true);
    try {
      const response = await authAPI.updateProfile(name, avatar);
      const updatedUser = response.data?.user || { name };
      persistUser({ ...updatedUser, avatar: updatedUser.profileImage || avatar });
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarClick = () => {
    if (avatarInputRef.current) avatarInputRef.current.click();
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setAvatarNotice("Please select an image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const nextAvatar = String(reader.result || "");
      setAvatar(nextAvatar);
      persistUser({ name, email, avatar: nextAvatar });
      setAvatarNotice("Profile picture updated. Click 'Save Changes' to persist to your account.");
    };
    reader.onerror = () => {
      setAvatarNotice("Could not read selected image. Please try again.");
    };
    reader.readAsDataURL(file);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setPasswordNotice("Password change API is not configured yet. UI is ready.");
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/");
  };

  return (
    <StateWrapper
      loading={loading}
      error={error}
      onRetry={() => window.location.reload()}
      loadingContent={
        <div className="card">
          <SkeletonLoader lines={7} />
        </div>
      }
    >
      {showTour && <OnboardingTour onComplete={() => setShowTour(false)} />}
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleGoBack}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          Go Back
        </button>
        <button
          type="button"
          onClick={() => setShowTour(true)}
          className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          title="Take guided tour of the application"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4m0-4h.01" />
          </svg>
          Help & Tour
        </button>
      </div>
      <section className="card">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={handleAvatarClick}
            className="group relative h-20 w-20 overflow-hidden rounded-full ring-2 ring-slate-300/80 transition hover:ring-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 dark:ring-slate-600 dark:hover:ring-slate-500"
            aria-label="Edit profile picture"
          >
            <img src={avatarSrc} alt="Profile" className="h-full w-full object-cover" />
            <span className="absolute inset-0 flex items-end justify-center bg-slate-900/0 pb-2 text-[11px] font-medium text-white opacity-0 transition group-hover:bg-slate-900/45 group-hover:opacity-100">
              Edit
            </span>
          </button>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
          <div>
            <h1 className="text-3xl font-bold tracking-wider dark:text-slate-100" style={{ color: '#a259ff' }}>{name}</h1>
            <p className="mt-1 text-sm dark:text-slate-300" style={{ color: '#ff3b6a' }}>{email}</p>
            <button
              type="button"
              onClick={handleAvatarClick}
              className="mt-2 text-xs font-medium text-slate-700 underline-offset-2 hover:underline dark:text-slate-300"
            >
              Change photo
            </button>
          </div>
        </div>
        {avatarNotice && <p className="mt-3 text-sm text-amber-600 dark:text-amber-400">{avatarNotice}</p>}
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <article className="card">
          <h2 className="mb-4 text-lg font-semibold" style={{ color: theme.mode === 'dark' ? '#0b84ff' : '#000000' }}>👤 Personal Information</h2>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-800 dark:text-slate-300">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, name: "" }));
                }}
                className={`w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 ${fieldErrors.name ? "error" : ""}`}
                required
              />
              {fieldErrors.name ? <div className="form-error">{fieldErrors.name}</div> : null}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-800 dark:text-slate-300">Email</label>
              <input
                type="email"
                value={email}
                readOnly
                className="w-full cursor-not-allowed rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-slate-800 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300"
              />
              <p className="mt-1 text-xs text-slate-700 dark:text-slate-400">Email is read-only for account safety.</p>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
            {saved && <p className="text-sm text-emerald-600 dark:text-emerald-400">Profile updated.</p>}
          </form>
        </article>

        <article className="card">
          <h2 className="mb-4 text-lg font-semibold" style={{ color: theme.mode === 'dark' ? '#0b84ff' : '#000000' }}>⚙️ Account Settings</h2>
          <div className="space-y-5">
            <div>
              <p className="mb-2 text-sm font-medium text-slate-800 dark:text-slate-300">Theme Preference</p>
              <div className="inline-flex rounded-lg border border-slate-300/90 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => setMode("light")}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                    theme.mode === "light"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
                  }`}
                >
                  Light
                </button>
                <button
                  type="button"
                  onClick={() => setMode("dark")}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                    theme.mode === "dark"
                      ? "bg-slate-700 text-slate-100 shadow-sm dark:bg-slate-700"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
                  }`}
                >
                  Dark
                </button>
              </div>
            </div>
            <div className="border-t border-slate-200 pt-4 dark:border-slate-700">
              <button
                type="button"
                onClick={onLogout}
                className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20"
              >
                Logout
              </button>
            </div>
          </div>
        </article>
      </section>

      <section className="card">
        <h2 className="mb-4 text-lg font-semibold" style={{ color: theme.mode === 'dark' ? '#0b84ff' : '#000000' }}>🔐 Security</h2>
        <form onSubmit={handlePasswordSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-800 dark:text-slate-300">Current Password</label>
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              placeholder="Current password"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-800 dark:text-slate-300">New Password</label>
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              placeholder="New password"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-800 dark:text-slate-300">Confirm Password</label>
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              placeholder="Confirm password"
            />
          </div>
          <div className="md:col-span-3">
            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
            >
              Change Password
            </button>
            {passwordNotice && <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">{passwordNotice}</p>}
          </div>
        </form>
      </section>

      <div className="mt-8 text-sm text-blue-600 dark:text-blue-400">
        Developed by{" "}
        <span className="font-semibold text-blue-700 dark:text-blue-300">
          <a
            href="https://github.com/UdayShankarPandey"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            Uday Shankar Pandey
          </a>
        </span>
        <span className="mx-1">•</span>
        <a
          href="https://www.linkedin.com/in/uday-shankar-pandey/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-blue-700 dark:text-blue-300 hover:underline"
        >
          LinkedIn
        </a>
      </div>
      </div>
    </StateWrapper>
  );
};

export default ProfilePage;
