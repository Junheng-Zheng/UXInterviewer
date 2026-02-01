import { create } from "zustand";

const initialState = {
  design: "",
  target: "",
  tohelp: "",
  time: 15,
  selectedModel: "gpt-4o-mini",
  evaluation: null,
  screenshot: null,
};

const useStore = create((set) => ({
  ...initialState,
  setDesign: (design) => set((state) => ({ design })),
  setTarget: (target) => set((state) => ({ target })),
  setTohelp: (tohelp) => set((state) => ({ tohelp })),
  setTime: (time) => set((state) => ({ time })),
  setSelectedModel: (selectedModel) => set((state) => ({ selectedModel })),
  setEvaluation: (evaluation) => set((state) => ({ evaluation })),
  setScreenshot: (screenshot) => set((state) => ({ screenshot })),
}));

export default useStore;
