import { create } from "zustand";

const initialState = {
  design: "",
  target: "",
  tohelp: "",
};

const useStore = create((set) => ({
  ...initialState,
  setDesign: (design) => set((state) => ({ design })),
  setTarget: (target) => set((state) => ({ target })),
  setTohelp: (tohelp) => set((state) => ({ tohelp })),
}));

export default useStore;
