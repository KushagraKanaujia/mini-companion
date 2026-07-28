"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Persona = {
  id: string;
  name: string;
  personality: string;
  face_url?: string;
  created_at: string;
};

type Template = {
  id: string;
  name: string;
  tagline: string;
  personality: string;
  avatar: string;
  interests: string[];
  type: string;
};

export default function Home() {
  const router = useRouter();
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingTemplate, setCreatingTemplate] = useState<string | null>(null);

  useEffect(() => {
    loadPersonas();
    loadTemplates();
  }, []);

  async function loadPersonas() {
    try {
      const res = await fetch("/api/personas?user_id=test-user");
      const data = await res.json();
      setPersonas(data.personas || []);
    } catch (err) {
      console.error("Failed to load personas:", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadTemplates() {
    try {
      const res = await fetch("/api/templates");
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch (err) {
      console.error("Failed to load templates:", err);
    }
  }

  async function createFromTemplate(template: Template) {
    setCreatingTemplate(template.id);
    try {
      const res = await fetch("/api/personas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: "test-user",
          name: template.name,
          personality: template.personality,
          face_url: template.avatar,
          voice_id: null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      router.push(`/chat/${data.id}`);
    } catch (err: any) {
      console.error("Failed to create from template:", err);
      alert(err.message || "Failed to create companion");
    } finally {
      setCreatingTemplate(null);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="mb-4">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-3">
              <span className="gradient-text">Mini Companion</span>
            </h1>
            <div className="flex items-center justify-center gap-2 text-lg text-blue-600">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span>Your personal AI companions, designed with care</span>
            </div>
          </div>
          <p className="text-xl text-indigo-700 max-w-2xl mx-auto leading-relaxed">
            Build meaningful connections with AI companions that remember, learn, and grow with you
          </p>
        </div>

        {/* Create New Button */}
        <button
          onClick={() => router.push("/create")}
          className="w-full mb-8 py-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-3xl font-semibold text-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl btn-hover flex items-center justify-center gap-3 animate-fade-in"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Create Your Custom Companion</span>
        </button>

        {/* Personas List */}
        {loading ? (
          <div className="text-center text-[#F6F0E6] py-12">Loading...</div>
        ) : (
          <>
            {personas.length === 0 && templates.length > 0 && (
              <div className="mb-12 animate-fade-in">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-indigo-900 mb-2">Meet Your Companions</h2>
                  <p className="text-indigo-600 text-lg">Choose a pre-made companion to get started instantly</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {templates.map((template, index) => (
                    <button
                      key={template.id}
                      onClick={() => createFromTemplate(template)}
                      disabled={creatingTemplate === template.id}
                      className="glass rounded-3xl p-6 hover:shadow-2xl transition-all text-left disabled:opacity-50 card-shadow group"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="flex flex-col items-center text-center mb-4">
                        <div className="relative mb-4 animate-float">
                          <img
                            src={template.avatar}
                            alt={template.name}
                            className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-lg group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                            </svg>
                          </div>
                        </div>
                        <h3 className="text-2xl font-bold text-indigo-900 mb-1">{template.name}</h3>
                        <p className="text-sm text-blue-600 font-medium mb-3">{template.tagline}</p>
                      </div>

                      <p className="text-sm text-indigo-700 mb-4 leading-relaxed line-clamp-3">
                        {template.personality}
                      </p>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {template.interests.slice(0, 3).map((interest) => (
                          <span
                            key={interest}
                            className="px-3 py-1 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 rounded-full text-xs font-medium"
                          >
                            {interest}
                          </span>
                        ))}
                      </div>

                      {creatingTemplate === template.id ? (
                        <div className="flex items-center justify-center gap-2 py-3 text-blue-600">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <span className="text-sm font-medium">Creating...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2 py-3 text-blue-600 font-medium group-hover:gap-3 transition-all">
                          <span>Start Chatting</span>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {personas.length > 0 && (
              <div className="animate-fade-in">
                <h2 className="text-3xl font-bold text-indigo-900 mb-6">Your Companions</h2>
                <div className="grid gap-4">
                  {personas.map((persona, index) => (
                    <button
                      key={persona.id}
                      onClick={() => router.push(`/chat/${persona.id}`)}
                      className="glass rounded-3xl p-6 hover:shadow-2xl transition-all text-left card-shadow group"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="flex items-center gap-5">
                        {persona.face_url ? (
                          <img
                            src={persona.face_url}
                            alt={persona.name}
                            className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 shadow-lg group-hover:scale-105 transition-transform flex items-center justify-center text-white text-2xl font-bold">
                            {persona.name.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold text-indigo-900 mb-1">{persona.name}</h3>
                          <p className="text-sm text-indigo-600 line-clamp-2 leading-relaxed">{persona.personality}</p>
                        </div>
                        <div className="text-blue-500 group-hover:translate-x-2 transition-transform">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <div className="mt-12 text-center">
          <div className="glass rounded-2xl p-6 inline-block">
            <div className="flex items-center justify-center gap-3 text-indigo-700">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <p className="text-sm">
                Currently using: <span className="font-semibold">test-user</span>
                <span className="mx-2">•</span>
                <span className="text-blue-600">User accounts coming soon</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
