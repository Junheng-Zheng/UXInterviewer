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
  const [excalidrawAPI, setExcalidrawAPI] = useState(null);
  const [activeTool, setActiveTool] = useState('selection');

  useEffect(() => {
    import('@excalidraw/excalidraw').then((module) => {
      setComp(() => module.Excalidraw);
    });
  }, []);

  const changeTool = (toolType) => {
    if (excalidrawAPI) {
      excalidrawAPI.updateScene({
        appState: {
          activeTool: {
            type: toolType,
          },
        },
      });
      setActiveTool(toolType);
    }
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

  if (!Comp) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-white">
        <p className="text-black font-light text-lg">Loading whiteboard...</p>
      </div>
    );
  }

  return (
    <div className = "flex rounded-xl overflow-hidden w-full h-full relative">


      {/* Custom Toolbar with Lucide Icons */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 z-100  bg-white/40 backdrop-blur-sm border border-[#e4e4e4] border-l-0 rounded-r-xl p-2 flex flex-col gap-1">
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
        .excalidraw .App-toolbar,
        .excalidraw .layer-ui__wrapper__top-left,
        .excalidraw .layer-ui__wrapper__footer-left,
        .excalidraw .layer-ui__wrapper__footer-center,
        .excalidraw .layer-ui__wrapper__footer-right {
          display: none !important;
        }
      `}</style>

      <Comp
        theme="light"
        zenModeEnabled={true}
        excalidrawAPI={(api) => {
          setExcalidrawAPI(api);
          if (onReady) {
            onReady(api);
          }
        }}
        initialData={initialData || {
          appState: {
            viewBackgroundColor: "#ffffff",
            zenModeEnabled: true,
          },
        }}
        onChange={(elements, appState, files) => {
          if (onChange) {
            onChange(elements, appState, files);
          }
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

