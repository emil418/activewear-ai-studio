import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface InfluencerModeCtx {
  influencerMode: boolean;
  setInfluencerMode: (v: boolean) => void;
}

const Ctx = createContext<InfluencerModeCtx>({ influencerMode: false, setInfluencerMode: () => {} });

export const InfluencerModeProvider = ({ children }: { children: ReactNode }) => {
  const [influencerMode, setInfluencerMode] = useState(() => {
    try { return localStorage.getItem("af_influencer_mode") === "true"; } catch { return false; }
  });

  useEffect(() => {
    localStorage.setItem("af_influencer_mode", String(influencerMode));
  }, [influencerMode]);

  return <Ctx.Provider value={{ influencerMode, setInfluencerMode }}>{children}</Ctx.Provider>;
};

export const useInfluencerMode = () => useContext(Ctx);
