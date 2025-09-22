import { createSlice } from "@reduxjs/toolkit";

type ThemeState = {
  theme: boolean;
  Share: boolean
}

const initialState: ThemeState = {
    theme : false ,
    Share : false
};

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    toggleTheme: (state , action) => {
        state.theme = action.payload;
        console.log("action.payload",action.payload)
        if (typeof window !== "undefined") {
          localStorage.setItem("theme", action.payload);
        } 
    }, 
    toggleSharing: (state , action) => {
      state.Share = action.payload;
    }
  },
});

export const { toggleTheme , toggleSharing } = themeSlice.actions;
export default themeSlice.reducer;