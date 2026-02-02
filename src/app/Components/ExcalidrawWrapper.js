'use client';

import { useEffect, useState, useRef } from 'react';

import { 
  MousePointer2, 
  Hand, 
  Square, 
  Circle, 
  ArrowRight, 
  Minus, 
  Edit3, 
  Type,
  Eraser,
  House,
  Redo2,
  MessageCircleQuestionMark,
} from 'lucide-react';

export default function ExcalidrawWrapper({ initialData, onReady, onChange }) {
  const [Comp, setComp] = useState(null);
  const [activeTool, setActiveTool] = useState('selection');
  
  // Use ref to store API to avoid re-renders when it's set
  const excalidrawAPIRef = useRef(null);

  useEffect(() => {
    import('@excalidraw/excalidraw').then((module) => {
      setComp(() => module.Excalidraw);
    });
  }, []);

  // Auto-focus the canvas when component mounts
  useEffect(() => {
    // Delay to ensure Excalidraw is fully mounted
    const timer = setTimeout(() => {
      const canvasElement = document.querySelector('.excalidraw canvas');
      if (canvasElement) {
        canvasElement.tabIndex = 0;
        canvasElement.focus();
      }
      
      const excalidrawContainer = document.querySelector('.excalidraw');
      if (excalidrawContainer && !canvasElement) {
        excalidrawContainer.tabIndex = 0;
        excalidrawContainer.focus();
      }
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);

  // Disable Excalidraw's built-in search (Cmd+F / Ctrl+F)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check if Cmd+F (Mac) or Ctrl+F (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        // Check if the event is coming from within Excalidraw
        const excalidrawContainer = document.querySelector('.excalidraw');
        if (excalidrawContainer && excalidrawContainer.contains(e.target)) {
          e.preventDefault();
          e.stopPropagation();
          console.log('Excalidraw search disabled');
        }
      }
    };

    // Use capture phase to intercept before Excalidraw gets the event
    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, []);

const changeTool = (toolType) => {
  if (!excalidrawAPIRef.current) return;

  const appState = excalidrawAPIRef.current.getAppState();

  excalidrawAPIRef.current.updateScene({
    appState: {
      ...appState,
      activeTool: { type: toolType },
    },
  });

  setActiveTool(toolType);
};


  const tools = [
    { id: 'selection', icon: MousePointer2, label: 'Select' },
    // { id: 'hand', icon: Hand, label: 'Hand' },
    { id: 'rectangle', icon: Square, label: 'Rectangle' },
    { id: 'ellipse', icon: Circle, label: 'Circle' },
    { id: 'arrow', icon: ArrowRight, label: 'Arrow' },
    { id: 'line', icon: Minus, label: 'Line' },
    { id: 'freedraw', icon: Edit3, label: 'Draw' },
    { id: 'text', icon: Type, label: 'Text' },
    { id: 'eraser', icon: Eraser, label: 'Eraser' },
  ];

  // Use useRef to store initialData only once (on mount)
  const initialDataRef = useRef(null);
  
  // Initialize ref only once on first render with guaranteed valid data
  if (initialDataRef.current === null) {
    // More complete appState defaults to prevent undefined values in Excalidraw's internal inputs
    const defaultAppState = {
      viewBackgroundColor: "#ffffff",
      zenModeEnabled: true,
      currentItemFontFamily: 2,
      currentItemFontSize: 20,
      currentItemStrokeColor: "#1e1e1e",
      currentItemBackgroundColor: "transparent",
      currentItemFillStyle: "solid",
      currentItemStrokeWidth: 2,
      currentItemStrokeStyle: "solid",
      currentItemRoughness: 1,
      currentItemOpacity: 100,
      currentItemTextAlign: "left",
      scrollToContent: false,
      gridSize: null,
      theme: "light",
    };
    
    const defaultData = {
      elements: [],
      appState: defaultAppState,
      files: {},
      scrollToContent: false,
    };
    
    // Only use passed initialData if it has valid structure
    if (initialData && Array.isArray(initialData.elements)) {
      initialDataRef.current = {
        elements: initialData.elements,
        appState: { ...defaultAppState, ...(initialData.appState || {}) },
        files: initialData.files || {},
        scrollToContent: false,
      };
    } else {
      initialDataRef.current = defaultData;
    }
  }

  if (!Comp) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-white">
        <p className="text-black font-light text-lg">Loading whiteboard...</p>
      </div>
    );
  }

  return (
    <div className = "flex rounded-xl overflow-hidden w-full h-full relative">
      <div
        className="absolute top-0 left-0 z-50 w-full h-full bg-[radial-gradient(circle,rgba(156,163,175,0.3)_1px,transparent_1px)] pointer-events-none"
        style={{ backgroundSize: '16px 16px' }}>
      </div>

      {/* Custom Toolbar with Lucide Icons */}
            <div className="absolute left-1/2 -translate-x-1/2 top-8 z-100 pointer-events-auto bg-white/40 backdrop-blur-sm border border-[#e4e4e4] rounded-xl p-2 flex gap-1">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.id}
              onClick={() => changeTool(tool.id)}
              className={`p-2.5 rounded-lg transition-all cursor-pointer active:scale-80 duration-100 hover:bg-[#f5f5f5] ${
                activeTool === tool.id
                  ? 'bg-[#e3ebfe] text-[#3168f5]'
                  : 'text-[#1b1b1f]'
              }`}
              title={tool.label}
            >
              <Icon className="w-5 h-5" strokeWidth={1.3} />
            </button>
          );
        })}
      </div>

      {/* Hide default Excalidraw UI elements */}
      <style jsx global>{`
        /* Hide Excalidraw UI elements */
        .excalidraw .App-toolbar,
        .excalidraw .layer-ui__wrapper__top-left,
        .excalidraw .layer-ui__wrapper__footer-left,
        .excalidraw .layer-ui__wrapper__footer-center,
        .excalidraw .layer-ui__wrapper__footer-right {
          display: none !important;
        }
        
        /* Hide search dialog */
        .excalidraw .layer-ui__wrapper__dialogs,
        .excalidraw [data-testid="search-dialog"],
        .excalidraw .Dialog__content {
          display: none !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }
        
        /* Remove focus outline */
        .excalidraw canvas:focus,
        .excalidraw canvas:focus-visible,
        .excalidraw:focus,
        .excalidraw:focus-visible {
          outline: none !important;
          border: none !important;
        }
      `}</style>

     <Comp
        theme="light"
        excalidrawAPI={(api) => {
          // Store in ref to avoid causing re-renders
          excalidrawAPIRef.current = api;
          if (onReady) {
            onReady(api);
          }
        }}
       initialData={initialDataRef.current}
        onChange={(elements, appState, files) => {
          // Defer all callbacks to avoid re-rendering during Excalidraw's internal update cycle
          // This prevents the "controlled to uncontrolled" error
          setTimeout(() => {
            // Sync toolbar with Excalidraw's active tool (for keyboard shortcuts)
            const newToolType = appState?.activeTool?.type;
            if (newToolType) {
              setActiveTool((prev) => prev !== newToolType ? newToolType : prev);
            }
            
            if (onChange) {
              onChange(elements, appState, files);
            }
          }, 0);
        }}
        UIOptions={{
          canvasActions: {
            loadScene: false,
            saveToActiveFile: false,
            export: false,
            toggleTheme: false,
          },
          tools: {
            image: false,
          },
        }}
        renderTopRightUI={() => null}
      />
    </div>
  );
}

