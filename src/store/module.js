import { create } from "zustand";

const initialState = {
  design: "",
  target: "",
  tohelp: "",
  time: 15,
  selectedModel: "gpt-4o-mini",
  evaluation: null,
  screenshot: null,
  conversationHistory: [],
};

const useStore = create((set) => ({
  ...initialState,
  setDesign: (design) => set((state) => ({ design })),
  setTarget: (target) => set((state) => ({ target })),
  setTohelp: (tohelp) => set((state) => ({ tohelp })),
  setTime: (time) => set((state) => ({ time: Math.min(60, Math.max(5, time)) })), // Cap at 60 min, min 5 min
  setSelectedModel: (selectedModel) => set((state) => ({ selectedModel })),
  setEvaluation: (evaluation) => set((state) => ({ evaluation })),
  setScreenshot: (screenshot) => set((state) => ({ screenshot })),
  setConversationHistory: (conversationHistory) => set((state) => ({ conversationHistory })),
}));

export default useStore;
