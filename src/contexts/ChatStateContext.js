import React, { createContext, useContext, useReducer } from "react";

// Action types
const CHAT_ACTIONS = {
  // Theme and UI
  SET_THEME: "SET_THEME",
  SET_SOUND: "SET_SOUND",
  SET_SEARCH: "SET_SEARCH",

  // Reply functionality
  SET_REPLYING_TO: "SET_REPLYING_TO",

  // Image handling (consolidated)
  SET_IMAGE_STATE: "SET_IMAGE_STATE",
  CLEAR_IMAGE: "CLEAR_IMAGE",
  SET_UPLOADING: "SET_UPLOADING",

  // Bulk image handling
  ADD_IMAGES: "ADD_IMAGES",
  REMOVE_IMAGE: "REMOVE_IMAGE",
  CLEAR_ALL_IMAGES: "CLEAR_ALL_IMAGES",
  SET_IMAGES_UPLOADING: "SET_IMAGES_UPLOADING",

  // Profile modal
  SET_PROFILE_MODAL: "SET_PROFILE_MODAL",

  // Scroll metadata
  SET_SCROLL_META: "SET_SCROLL_META",

  // Settings
  SET_AWAY_SECONDS: "SET_AWAY_SECONDS",
};

// Initial state - consolidates all ChatPage states
const initialState = {
  // Theme and UI
  isDarkTheme: true,
  soundEnabled: true,
  searchTerm: "",
  showSearch: false,

  // Reply functionality
  replyingTo: null,

  // Image state (single source of truth) - supports both single and bulk uploads
  image: {
    selectedFile: null,
    preview: null,
    uploading: false,
  },

  // Bulk images state
  images: {
    files: [], // Array of {id, file, preview} objects
    uploading: false,
  },

  // Modal states
  profileModalUser: null,

  // Scroll state
  scrollMeta: {
    visible: false,
    hasNew: false,
    newCount: 0,
    scrollToBottom: null,
  },

  // Settings
  awayAfterSeconds: 300,
};

// Reducer function
function chatStateReducer(state, action) {
  switch (action.type) {
    case CHAT_ACTIONS.SET_THEME:
      return {
        ...state,
        isDarkTheme: action.payload,
      };

    case CHAT_ACTIONS.SET_SOUND:
      return {
        ...state,
        soundEnabled: action.payload,
      };

    case CHAT_ACTIONS.SET_SEARCH:
      return {
        ...state,
        searchTerm: action.payload.searchTerm ?? state.searchTerm,
        showSearch: action.payload.showSearch ?? state.showSearch,
      };

    case CHAT_ACTIONS.SET_REPLYING_TO:
      return {
        ...state,
        replyingTo: action.payload,
      };

    case CHAT_ACTIONS.SET_IMAGE_STATE:
      return {
        ...state,
        image: {
          ...state.image,
          ...action.payload,
        },
      };

    case CHAT_ACTIONS.CLEAR_IMAGE:
      return {
        ...state,
        image: {
          selectedFile: null,
          preview: null,
          uploading: false,
        },
      };

    case CHAT_ACTIONS.SET_UPLOADING:
      return {
        ...state,
        image: {
          ...state.image,
          uploading: action.payload,
        },
      };

    // Bulk image actions
    case CHAT_ACTIONS.ADD_IMAGES:
      return {
        ...state,
        images: {
          ...state.images,
          files: [...state.images.files, ...action.payload],
        },
      };

    case CHAT_ACTIONS.REMOVE_IMAGE:
      return {
        ...state,
        images: {
          ...state.images,
          files: state.images.files.filter((img) => img.id !== action.payload),
        },
      };

    case CHAT_ACTIONS.CLEAR_ALL_IMAGES:
      return {
        ...state,
        images: {
          files: [],
          uploading: false,
        },
      };

    case CHAT_ACTIONS.SET_IMAGES_UPLOADING:
      return {
        ...state,
        images: {
          ...state.images,
          uploading: action.payload,
        },
      };

    case CHAT_ACTIONS.SET_PROFILE_MODAL:
      return {
        ...state,
        profileModalUser: action.payload,
      };

    case CHAT_ACTIONS.SET_SCROLL_META:
      return {
        ...state,
        scrollMeta: action.payload,
      };

    case CHAT_ACTIONS.SET_AWAY_SECONDS:
      return {
        ...state,
        awayAfterSeconds: action.payload,
      };

    default:
      return state;
  }
}

// Context
const ChatStateContext = createContext(null);

// Provider component
export function ChatStateProvider({ children, initialAwaySeconds = 300 }) {
  const [state, dispatch] = useReducer(chatStateReducer, {
    ...initialState,
    awayAfterSeconds: initialAwaySeconds,
  });

  // Action creators for common operations
  const actions = {
    toggleTheme: () =>
      dispatch({
        type: CHAT_ACTIONS.SET_THEME,
        payload: !state.isDarkTheme,
      }),

    toggleSound: () =>
      dispatch({
        type: CHAT_ACTIONS.SET_SOUND,
        payload: !state.soundEnabled,
      }),

    setSearch: (searchTerm, showSearch) =>
      dispatch({
        type: CHAT_ACTIONS.SET_SEARCH,
        payload: { searchTerm, showSearch },
      }),

    setReplyingTo: (replyTarget) =>
      dispatch({
        type: CHAT_ACTIONS.SET_REPLYING_TO,
        payload: replyTarget,
      }),

    setImageState: (imageData) =>
      dispatch({
        type: CHAT_ACTIONS.SET_IMAGE_STATE,
        payload: imageData,
      }),

    clearImage: () =>
      dispatch({
        type: CHAT_ACTIONS.CLEAR_IMAGE,
      }),

    setUploading: (uploading) =>
      dispatch({
        type: CHAT_ACTIONS.SET_UPLOADING,
        payload: uploading,
      }),

    setProfileModal: (user) =>
      dispatch({
        type: CHAT_ACTIONS.SET_PROFILE_MODAL,
        payload: user,
      }),

    setScrollMeta: (scrollMeta) =>
      dispatch({
        type: CHAT_ACTIONS.SET_SCROLL_META,
        payload: scrollMeta,
      }),

    setAwaySeconds: (seconds) =>
      dispatch({
        type: CHAT_ACTIONS.SET_AWAY_SECONDS,
        payload: seconds,
      }),

    // Utility action for image drag & drop
    handleImageDrop: (file) => {
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        dispatch({
          type: CHAT_ACTIONS.SET_IMAGE_STATE,
          payload: {
            selectedFile: file,
            preview: e.target.result,
          },
        });
      };
      reader.readAsDataURL(file);
    },

    // Bulk image actions
    addImages: (files) => {
      if (!files || files.length === 0) return;

      const imagePromises = Array.from(files).map((file, index) => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            resolve({
              id: `${Date.now()}-${index}`,
              file,
              preview: e.target.result,
            });
          };
          reader.readAsDataURL(file);
        });
      });

      Promise.all(imagePromises).then((imageObjects) => {
        dispatch({
          type: CHAT_ACTIONS.ADD_IMAGES,
          payload: imageObjects,
        });
      });
    },

    removeImage: (imageId) =>
      dispatch({
        type: CHAT_ACTIONS.REMOVE_IMAGE,
        payload: imageId,
      }),

    clearAllImages: () =>
      dispatch({
        type: CHAT_ACTIONS.CLEAR_ALL_IMAGES,
      }),

    setImagesUploading: (uploading) =>
      dispatch({
        type: CHAT_ACTIONS.SET_IMAGES_UPLOADING,
        payload: uploading,
      }),

    // Utility for handling multiple files from drag & drop
    handleMultipleImageDrop: (files) => {
      if (!files || files.length === 0) return;

      // Filter for image files only
      const imageFiles = Array.from(files).filter(
        (file) => file.type && file.type.startsWith("image/")
      );

      if (imageFiles.length === 0) return;

      // If only one image, use single image flow
      if (imageFiles.length === 1) {
        const file = imageFiles[0];
        const reader = new FileReader();
        reader.onload = (e) => {
          dispatch({
            type: CHAT_ACTIONS.SET_IMAGE_STATE,
            payload: {
              selectedFile: file,
              preview: e.target.result,
            },
          });
        };
        reader.readAsDataURL(file);
      } else {
        // Multiple images, use bulk flow
        const imagePromises = imageFiles.map((file, index) => {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              resolve({
                id: `${Date.now()}-${index}`,
                file,
                preview: e.target.result,
              });
            };
            reader.readAsDataURL(file);
          });
        });

        Promise.all(imagePromises).then((imageObjects) => {
          dispatch({
            type: CHAT_ACTIONS.ADD_IMAGES,
            payload: imageObjects,
          });
        });
      }
    },
  };

  const value = {
    state,
    actions,
    dispatch, // For advanced use cases
  };

  return (
    <ChatStateContext.Provider value={value}>
      {children}
    </ChatStateContext.Provider>
  );
}

// Custom hook to use chat state
export function useChatState() {
  const context = useContext(ChatStateContext);
  if (!context) {
    throw new Error("useChatState must be used within ChatStateProvider");
  }
  return context;
}

// Convenience hooks for specific state slices
export function useChatTheme() {
  const { state, actions } = useChatState();
  return {
    isDarkTheme: state.isDarkTheme,
    toggleTheme: actions.toggleTheme,
  };
}

export function useChatSound() {
  const { state, actions } = useChatState();
  return {
    soundEnabled: state.soundEnabled,
    toggleSound: actions.toggleSound,
  };
}

export function useChatSearch() {
  const { state, actions } = useChatState();
  return {
    searchTerm: state.searchTerm,
    showSearch: state.showSearch,
    setSearch: actions.setSearch,
  };
}

export function useChatReply() {
  const { state, actions } = useChatState();
  return {
    replyingTo: state.replyingTo,
    setReplyingTo: actions.setReplyingTo,
  };
}

export function useChatImage() {
  const { state, actions } = useChatState();
  return {
    selectedFile: state.image.selectedFile,
    preview: state.image.preview,
    uploading: state.image.uploading,
    setImageState: actions.setImageState,
    clearImage: actions.clearImage,
    setUploading: actions.setUploading,
    handleImageDrop: actions.handleImageDrop,
    handleMultipleImageDrop: actions.handleMultipleImageDrop,
  };
}

export function useBulkImages() {
  const { state, actions } = useChatState();
  return {
    images: state.images.files,
    uploading: state.images.uploading,
    addImages: actions.addImages,
    removeImage: actions.removeImage,
    clearAllImages: actions.clearAllImages,
    setImagesUploading: actions.setImagesUploading,
    handleMultipleImageDrop: actions.handleMultipleImageDrop,
  };
}

export function useChatScroll() {
  const { state, actions } = useChatState();
  return {
    scrollMeta: state.scrollMeta,
    setScrollMeta: actions.setScrollMeta,
  };
}

export { CHAT_ACTIONS };
