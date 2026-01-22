"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

interface Profile {
  id: string;
  email: string;
  name: string;
  djName: string | null;
  photoUrl: string | null;
  phone: string | null;
  website: string | null;
  musicStyles: string | null;
  experience: string | null;
  equipment: string | null;
  socialMedia: string | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form fields
  const [name, setName] = useState("");
  const [djName, setDjName] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [musicStyles, setMusicStyles] = useState("");
  const [experience, setExperience] = useState("");
  const [equipment, setEquipment] = useState("");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [soundcloud, setSoundcloud] = useState("");

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      const res = await fetch("/api/profile");
      if (!res.ok) throw new Error("Fehler beim Laden");
      const data = await res.json();
      setProfile(data);

      // Felder befüllen
      setName(data.name || "");
      setDjName(data.djName || "");
      setPhone(data.phone || "");
      setWebsite(data.website || "");
      setMusicStyles(data.musicStyles || "");
      setExperience(data.experience || "");
      setEquipment(data.equipment || "");

      // Social Media parsen
      if (data.socialMedia) {
        try {
          const social = JSON.parse(data.socialMedia);
          setInstagram(social.instagram || "");
          setFacebook(social.facebook || "");
          setSoundcloud(social.soundcloud || "");
        } catch {
          // Ignorieren
        }
      }
    } catch {
      setError("Profil konnte nicht geladen werden");
    } finally {
      setLoading(false);
    }
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("djName", djName);
      formData.append("phone", phone);
      formData.append("website", website);
      formData.append("musicStyles", musicStyles);
      formData.append("experience", experience);
      formData.append("equipment", equipment);

      // Social Media als JSON
      const socialMedia = JSON.stringify({
        instagram,
        facebook,
        soundcloud,
      });
      formData.append("socialMedia", socialMedia);

      if (photoFile) {
        formData.append("photo", photoFile);
      }

      const res = await fetch("/api/profile", {
        method: "PUT",
        body: formData,
      });

      if (!res.ok) throw new Error("Fehler beim Speichern");

      const data = await res.json();
      setProfile(data);
      setSuccess("Profil erfolgreich gespeichert!");
      setPhotoFile(null);

      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Profil konnte nicht gespeichert werden");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">DJ Profil</h1>
          <p className="text-gray-400">
            Bearbeite dein DJ-Profil und Informationen
          </p>
        </div>
        <Link
          href="/dashboard"
          className="text-gray-400 hover:text-white transition-colors">
          ← Zurück
        </Link>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-green-400">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profilbild */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Profilbild</h2>
          <div className="flex items-center gap-6">
            <div className="relative">
              {photoPreview || profile?.photoUrl ? (
                <Image
                  src={photoPreview || profile?.photoUrl || ""}
                  alt="Profilbild"
                  width={120}
                  height={120}
                  className="w-30 h-30 rounded-full object-cover border-4 border-purple-500"
                />
              ) : (
                <div className="w-30 h-30 rounded-full bg-gray-700 flex items-center justify-center border-4 border-purple-500">
                  <span className="text-4xl">👤</span>
                </div>
              )}
            </div>
            <div>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors">
                Foto ändern
              </button>
              <p className="text-gray-500 text-sm mt-2">JPG, PNG, max. 5MB</p>
            </div>
          </div>
        </div>

        {/* Persönliche Daten */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Persönliche Daten
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 text-sm mb-1">Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">
                DJ-Name / Künstlername
              </label>
              <input
                type="text"
                value={djName}
                onChange={(e) => setDjName(e.target.value)}
                placeholder="z.B. DJ Yanick"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">
                Telefon
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">
                Website
              </label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
        </div>

        {/* DJ Informationen */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            DJ Informationen
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-gray-400 text-sm mb-1">
                Musikstile
              </label>
              <input
                type="text"
                value={musicStyles}
                onChange={(e) => setMusicStyles(e.target.value)}
                placeholder="z.B. House, Techno, Hip-Hop, 80er, Charts"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
              />
              <p className="text-gray-500 text-xs mt-1">Kommagetrennt</p>
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">
                Erfahrung / Bio
              </label>
              <textarea
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                rows={4}
                placeholder="Erzähle etwas über dich und deine DJ-Karriere..."
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">
                Equipment
              </label>
              <textarea
                value={equipment}
                onChange={(e) => setEquipment(e.target.value)}
                rows={3}
                placeholder="z.B. Pioneer CDJ-3000, DJM-900NXS2, JBL PRX Serie..."
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Social Media */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Social Media
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-400 text-sm mb-1">
                📸 Instagram
              </label>
              <input
                type="text"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="@username"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">
                👍 Facebook
              </label>
              <input
                type="text"
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
                placeholder="facebook.com/..."
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">
                🔊 SoundCloud
              </label>
              <input
                type="text"
                value={soundcloud}
                onChange={(e) => setSoundcloud(e.target.value)}
                placeholder="soundcloud.com/..."
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/50 text-white rounded-lg font-semibold transition-colors flex items-center gap-2">
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Speichern...
              </>
            ) : (
              <>💾 Profil speichern</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
