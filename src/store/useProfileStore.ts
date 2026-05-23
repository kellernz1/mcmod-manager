import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Profile } from "../types/Profile";
import { deleteProfile, loadProfiles, saveProfile } from "../services/profileService";

type ProfileState = {
  profiles: Profile[];
  activeProfileId: string | null;
  hydrateProfiles: () => Promise<void>;
  setActiveProfile: (profileId: string) => void;
  upsertProfile: (profile: Profile) => Promise<void>;
  removeProfile: (profileId: string) => Promise<void>;
};

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      profiles: [],
      activeProfileId: null,
      hydrateProfiles: async () => {
        const profiles = await loadProfiles();
        set({
          profiles,
          activeProfileId: get().activeProfileId ?? profiles[0]?.id ?? null,
        });
      },
      setActiveProfile: (profileId) => set({ activeProfileId: profileId }),
      upsertProfile: async (profile) => {
        const profiles = await saveProfile(profile);
        set({ profiles, activeProfileId: profile.id });
      },
      removeProfile: async (profileId) => {
        const profiles = await deleteProfile(profileId);
        set({
          profiles,
          activeProfileId: get().activeProfileId === profileId ? profiles[0]?.id ?? null : get().activeProfileId,
        });
      },
    }),
    {
      name: "modforge-profiles",
      partialize: (state) => ({ activeProfileId: state.activeProfileId }),
    },
  ),
);
