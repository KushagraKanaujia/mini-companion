"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";

type Voice = {
  voice_id: string;
  name: string;
  preview_url?: string;
};

type Avatar = {
  id: string;
  url: string;
  name: string;
  tags: string[];
};

const personalityTypes = [
  { id: "warm", name: "Warm & Nurturing", desc: "Caring, empathetic, always there for you", emoji: "🤗" },
  { id: "playful", name: "Playful & Fun", desc: "Witty, humorous, keeps things light", emoji: "😄" },
  { id: "wise", name: "Wise & Thoughtful", desc: "Deep thinker, philosophical, insightful", emoji: "🧠" },
  { id: "adventurous", name: "Adventurous & Bold", desc: "Energetic, daring, loves new experiences", emoji: "🚀" },
  { id: "calm", name: "Calm & Balanced", desc: "Peaceful, grounded, helps you relax", emoji: "🧘" },
  { id: "creative", name: "Creative & Artistic", desc: "Imaginative, expressive, loves beauty", emoji: "🎨" }
];

const speakingStyles = [
  { id: "casual", name: "Casual & Friendly", example: "Hey! How's it going?" },
  { id: "warm", name: "Warm & Gentle", example: "Hello dear, how are you feeling today?" },
  { id: "witty", name: "Witty & Clever", example: "Well, well, look who decided to grace me with their presence!" },
  { id: "direct", name: "Direct & Honest", example: "What's on your mind? Let's talk about it." },
  { id: "poetic", name: "Poetic & Expressive", example: "The day greets us with new possibilities, doesn't it?" }
];

const interests = [
  "Art & Creativity", "Music", "Philosophy", "Science", "Nature",
  "Psychology", "Travel", "Books & Literature", "Gaming", "Fitness",
  "Cooking", "Technology", "Spirituality", "History", "Movies & TV"
];

export default function CreatePersonaPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Character data
  const [name, setName] = useState("");
  const [personalityType, setPersonalityType] = useState("");
  const [speakingStyle, setSpeakingStyle] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [backstory, setBackstory] = useState("");
  const [relationshipType, setRelationshipType] = useState("friend");
  const [faceUrl, setFaceUrl] = useState("");
  const [voiceId, setVoiceId] = useState("");
  const [generatedPersonality, setGeneratedPersonality] = useState("");

  // UI state
  const [voices, setVoices] = useState<Voice[]>([]);
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatingPersonality, setGeneratingPersonality] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showVoices, setShowVoices] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [error, setError] = useState("");

  async function generatePersonality() {
    setGeneratingPersonality(true);
    setError("");

    try {
      const res = await fetch("/api/generate-personality", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          traits: {
            personalityType: personalityTypes.find(p => p.id === personalityType)?.name,
            speakingStyle: speakingStyles.find(s => s.id === speakingStyle)?.name,
            interests: selectedInterests,
            backstory,
            relationshipType
          }
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setGeneratedPersonality(data.personality);
    } catch (err: any) {
      console.error("Failed to generate personality:", err);
      setError(err.message || "Failed to generate personality");
    } finally {
      setGeneratingPersonality(false);
    }
  }

  async function loadVoices() {
    try {
      const res = await fetch("/api/voices");
      const data = await res.json();
      setVoices(data.voices || []);
      setShowVoices(true);
    } catch (err) {
      console.error("Failed to load voices:", err);
    }
  }

  async function loadAvatarGallery() {
    try {
      const res = await fetch("/api/avatars");
      const data = await res.json();
      setAvatars(data.avatars || []);
      setShowGallery(true);
    } catch (err) {
      console.error("Failed to load avatar gallery:", err);
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setError("");

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `persona-faces/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("Personas")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("Personas")
        .getPublicUrl(filePath);

      setFaceUrl(data.publicUrl);
    } catch (err: any) {
      console.error("Failed to upload image:", err);
      setError("Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  }

  function toggleInterest(interest: string) {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  }

  async function createPersona() {
    if (!name.trim() || !generatedPersonality.trim()) {
      setError("Please complete all steps");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/personas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: "test-user",
          name: name.trim(),
          personality: generatedPersonality.trim(),
          face_url: faceUrl || null,
          voice_id: voiceId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      router.push(`/chat/${data.id}`);
    } catch (err: any) {
      console.error("Failed to create persona:", err);
      setError(err.message || "Failed to create persona");
    } finally {
      setLoading(false);
    }
  }

  function canProceed() {
    switch (step) {
      case 1: return name.trim().length > 0;
      case 2: return personalityType !== "";
      case 3: return speakingStyle !== "";
      case 4: return selectedInterests.length > 0;
      case 5: return true; // Optional step
      case 6: return generatedPersonality !== "";
      default: return false;
    }
  }

  async function handleNext() {
    if (step === 5) {
      // Generate personality before moving to review
      await generatePersonality();
    }
    setStep(step + 1);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-2xl glass rounded-[32px] shadow-2xl p-8 card-shadow animate-fade-in">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {[1, 2, 3, 4, 5, 6].map((s) => (
              <div
                key={s}
                className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-all ${
                  s === step
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg scale-110"
                    : s < step
                    ? "bg-blue-400 text-white"
                    : "bg-blue-100 text-blue-400"
                }`}
              >
                {s}
              </div>
            ))}
          </div>
          <div className="text-center text-sm text-indigo-600 font-medium mt-2">
            {step === 1 && "Basic Info"}
            {step === 2 && "Personality Type"}
            {step === 3 && "Speaking Style"}
            {step === 4 && "Interests & Hobbies"}
            {step === 5 && "Appearance & Voice"}
            {step === 6 && "Review & Create"}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-2xl text-sm text-red-700 flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: Name */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <h1 className="text-3xl font-bold text-indigo-900">Let's create your companion!</h1>
            <p className="text-indigo-600">What should we call them?</p>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter a name..."
              className="w-full px-6 py-4 bg-white rounded-2xl text-indigo-900 text-lg outline-none focus:ring-2 focus:ring-blue-500 border-2 border-blue-100 transition-all"
              autoFocus
            />
          </div>
        )}

        {/* Step 2: Personality Type */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <h1 className="text-2xl font-bold text-indigo-900">What's {name}'s vibe?</h1>
            <p className="text-indigo-600">Choose a personality type</p>
            <div className="grid grid-cols-2 gap-4">
              {personalityTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setPersonalityType(type.id)}
                  className={`p-5 rounded-2xl text-left transition-all ${
                    personalityType === type.id
                      ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white ring-4 ring-blue-200 shadow-lg scale-105"
                      : "bg-white text-indigo-900 hover:shadow-md border-2 border-blue-100"
                  }`}
                >
                  <div className="text-3xl mb-2">{type.emoji}</div>
                  <div className="font-bold">{type.name}</div>
                  <div className={`text-sm mt-1 ${personalityType === type.id ? "text-white/90" : "text-indigo-600"}`}>
                    {type.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Speaking Style */}
        {step === 3 && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-[#2A2420]">How does {name} speak?</h1>
            <p className="text-[#6B6357]">Choose their communication style</p>
            <div className="space-y-3">
              {speakingStyles.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSpeakingStyle(style.id)}
                  className={`w-full p-4 rounded-xl text-left transition-all ${
                    speakingStyle === style.id
                      ? "bg-[#5C7A61] text-white ring-2 ring-[#5C7A61]"
                      : "bg-[#EFE7D8] text-[#2A2420] hover:bg-[#E5DCC8]"
                  }`}
                >
                  <div className="font-semibold mb-1">{style.name}</div>
                  <div className={`text-sm italic ${speakingStyle === style.id ? "text-white/80" : "text-[#6B6357]"}`}>
                    "{style.example}"
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Interests */}
        {step === 4 && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-[#2A2420]">What does {name} enjoy?</h1>
            <p className="text-[#6B6357]">Select 3-5 interests or hobbies</p>
            <div className="grid grid-cols-3 gap-3">
              {interests.map((interest) => (
                <button
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={`p-3 rounded-xl text-sm transition-all ${
                    selectedInterests.includes(interest)
                      ? "bg-[#5C7A61] text-white"
                      : "bg-[#EFE7D8] text-[#2A2420] hover:bg-[#E5DCC8]"
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-[#2A2420] mb-2">
                Backstory (Optional)
              </label>
              <textarea
                value={backstory}
                onChange={(e) => setBackstory(e.target.value)}
                placeholder="Tell us a bit about their background..."
                rows={3}
                className="w-full px-4 py-3 bg-[#EFE7D8] rounded-xl text-[#2A2420] outline-none focus:ring-2 focus:ring-[#5C7A61] resize-none"
              />
            </div>
          </div>
        )}

        {/* Step 5: Appearance & Voice */}
        {step === 5 && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-[#2A2420]">Customize {name}'s appearance</h1>
            <p className="text-[#6B6357]">These are optional - you can skip this step</p>

            {/* Profile Image */}
            <div>
              <label className="block text-sm font-medium text-[#2A2420] mb-3">Profile Picture</label>
              <div className="flex flex-col items-center gap-3">
                {faceUrl && (
                  <img
                    src={faceUrl}
                    alt="Avatar"
                    className="w-32 h-32 rounded-full object-cover border-4 border-[#5C7A61]"
                  />
                )}
                <div className="flex gap-2">
                  <button
                    onClick={loadAvatarGallery}
                    className="px-4 py-2 bg-[#5C7A61] text-white rounded-full text-sm"
                  >
                    Choose from Gallery
                  </button>
                  <label className="px-4 py-2 bg-[#C98A85] text-white rounded-full text-sm cursor-pointer">
                    {uploadingImage ? "Uploading..." : "Upload Custom"}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {showGallery && (
                <div className="mt-4 p-4 bg-[#EFE7D8] rounded-xl max-h-64 overflow-y-auto">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-medium text-[#2A2420]">Select an Avatar</h3>
                    <button
                      onClick={() => setShowGallery(false)}
                      className="text-xs text-[#6B6357] underline"
                    >
                      Close
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {avatars.map((avatar) => (
                      <button
                        key={avatar.id}
                        onClick={() => {
                          setFaceUrl(avatar.url);
                          setShowGallery(false);
                        }}
                        className="relative group"
                      >
                        <img
                          src={avatar.url}
                          alt={avatar.name}
                          className="w-full aspect-square rounded-lg object-cover border-2 border-transparent group-hover:border-[#5C7A61]"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Voice Selection */}
            <div>
              <label className="block text-sm font-medium text-[#2A2420] mb-2">Voice</label>
              {!showVoices ? (
                <button
                  onClick={loadVoices}
                  className="px-4 py-2 bg-[#EFE7D8] text-[#2A2420] rounded-xl text-sm w-full"
                >
                  Choose Voice
                </button>
              ) : (
                <select
                  value={voiceId}
                  onChange={(e) => setVoiceId(e.target.value)}
                  className="w-full px-4 py-3 bg-[#EFE7D8] rounded-xl text-[#2A2420] outline-none focus:ring-2 focus:ring-[#5C7A61]"
                >
                  <option value="">No voice selected</option>
                  {voices.map((voice) => (
                    <option key={voice.voice_id} value={voice.voice_id}>
                      {voice.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        )}

        {/* Step 6: Review */}
        {step === 6 && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-[#2A2420]">Almost done!</h1>
            <p className="text-[#6B6357]">Review {name}'s profile</p>

            <div className="bg-[#EFE7D8] rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-4">
                {faceUrl && (
                  <img src={faceUrl} alt={name} className="w-20 h-20 rounded-full object-cover" />
                )}
                <div>
                  <h2 className="text-2xl font-bold text-[#2A2420]">{name}</h2>
                  <p className="text-sm text-[#6B6357]">
                    {personalityTypes.find(p => p.id === personalityType)?.name}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-[#2A2420] mb-2">Personality</h3>
                {generatingPersonality ? (
                  <div className="flex items-center gap-2 text-[#5C7A61]">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#5C7A61]"></div>
                    <span>Generating personality...</span>
                  </div>
                ) : (
                  <p className="text-[#6B6357]">{generatedPersonality}</p>
                )}
              </div>

              <div>
                <h3 className="font-semibold text-[#2A2420] mb-2">Interests</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedInterests.map((interest) => (
                    <span
                      key={interest}
                      className="px-3 py-1 bg-[#5C7A61] text-white rounded-full text-sm"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>

              {backstory && (
                <div>
                  <h3 className="font-semibold text-[#2A2420] mb-2">Backstory</h3>
                  <p className="text-[#6B6357]">{backstory}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-8">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="px-6 py-3 bg-white text-indigo-700 rounded-full font-semibold hover:bg-blue-50 border-2 border-blue-100 transition-all"
            >
              ← Back
            </button>
          )}

          {step < 6 ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex-1 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full font-semibold disabled:opacity-50 hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl btn-hover"
            >
              {step === 5 ? "Generate & Review →" : "Continue →"}
            </button>
          ) : (
            <button
              onClick={createPersona}
              disabled={loading || !generatedPersonality}
              className="flex-1 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full font-semibold disabled:opacity-50 hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl btn-hover flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Create Companion</span>
                </>
              )}
            </button>
          )}
        </div>

        <button
          onClick={() => router.push("/")}
          className="w-full mt-4 py-3 text-indigo-600 text-sm font-medium hover:text-indigo-800 transition-colors"
        >
          ← Back to Home
        </button>
      </div>
    </div>
  );
}
