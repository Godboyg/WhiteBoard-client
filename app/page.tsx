"use client" 
import { Stage, Layer, Line, Rect, Circle , Arrow , Text} from "react-konva"
import { useEffect, useMemo, useRef, useState } from "react"
import 'remixicon/fonts/remixicon.css'
import { useDispatch , useSelector } from "react-redux"
import { RootState } from "@/store"
import Dots from "@/Components/Dots"
import { toggleSharing, toggleTheme } from "@/store/themeSlice"
import ContainerBox from "@/Components/ContainerBox"
import Share from "@/Components/Share"
import { io } from "socket.io-client"
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast"
import FistPage from "@/Components/FistPage"
import KonvaLib from "konva"
import { v4 as uuidv4 } from 'uuid';

const socket = io("https://whiteboard-1-gaab.onrender.com");

function Konva() {
  // const socket = useMemo(() => io("http://localhost:4000") ,[]);

  const [elements, setElements] = useState<any[]>([])
  const [redoStack, setRedoStack] = useState<any[]>([]);
  const [open , setOpen] = useState(false);
  const stageRef = useRef<KonvaLib.Stage>(null)
  const [isTheme , setTheme] = useState(false)
  const [first , setFirst] = useState(true);
  const [stroke , setStroke] = useState(4)
  const [cursor , setCursor] = useState(false);
  const [sharing , setSharing] = useState(false);
  const [roomId , setRoomId] = useState<string | undefined>("")
  const [roomSize , setRoomSize] = useState<number>();
  const [drawing , setIsDrawing] = useState(false);
  const [sOpen , setSOpen] = useState(false);
  const [opacity , setOpacity] = useState<number>(1)
  const [lineColor , setLineColor] = useState("");
  const [screenSize , setScreenSize] = useState<boolean>(false);
  const [isOpen , setIsOpen] = useState(false);
  const [tool, setTool] = useState<"mouse" | "line" | "rect" | "circle" | "square" | "arrow" | "star" | "text">("mouse")
  const [size, setSize] = useState({ width: 0, height: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const isDrawing = useRef(false)
  const coRef = useRef<HTMLDivElement | null>(null)
  const conRef = useRef<HTMLDivElement | null>(null);
  const [showMoveButton, setShowMoveButton] = useState(false);
  const [texts, setTexts] = useState<{ x: number; y: number; text: string , id: number }[]>([
    { x: 200, y: 150, text: "Hello", id: 1 },
  ]);
  const [editingId, setEditingId] = useState(null);
  const [inputValue, setInputValue] = useState("");

  const handleTextClick = (textItem: any) => {
    setEditingId(textItem.id);
    setInputValue(textItem.text);
  };

  const handleInputChange = (e: any) => setInputValue(e.target.value);

  const handleInputBlur = () => {
    setTexts(texts.map(t => 
      t.id === editingId ? { ...t, text: inputValue } : t
    ));
    setEditingId(null);
  };
  
  const editingText = texts.find(t => t.id === editingId);

  const canvasSize = { width: 2000, height: 2000 }; 
  const [stageScale, setStageScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });

  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPos, setLastPanPos] = useState({ x: 0, y: 0 });
  const pendingPoints = useRef<number[]>([]);

  useEffect(() => {
    const handleClick = (e: Event) => {
      const target = e.target as HTMLDivElement;
      if(conRef.current && coRef.current && !conRef.current.contains(target) && !coRef.current?.contains(target)){
        setOpen(false);
      }
    }

    document.addEventListener("mousedown",handleClick);
  },[])

  useEffect(() => {
    const handleReSize = () => {
      setScreenSize(window.innerWidth < 640);

      // let resizeTimer: any;
      // const debouncedResize = () => {
      //  clearTimeout(resizeTimer);
      //  resizeTimer = setTimeout(handleReSize, 150); 
      // };
    }

    if(window.innerWidth < 640){
      setScreenSize(true);
    } else {
      setScreenSize(false);
    }

    window.addEventListener("resize", handleReSize);
  },[])

  console.log("screen size",screenSize);
  const dispatch = useDispatch();
  const theme = useSelector((state: RootState) => state.theme.theme);
  console.log("themee",theme);

  useEffect(() => {
    if(theme){
      const theme: boolean | any  = localStorage.getItem("theme");
      setTheme(theme);
    }
  },[open , theme])

  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      setSize({ width, height })
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const allLines: any = localStorage.getItem("lines");
    if(allLines){
      setFirst(false);
      setElements(JSON.parse(allLines));
    }
    setTheme(theme);
  },[])

  useEffect(() => {
    if(!socket) return;
    console.log("socket",socket.id);
    const roomId: string | undefined = window.location.hash.split("/").pop();
    let newData: any = { roomId: roomId , socket: socket.id }
    if(roomId && socket){
      socket.emit("join-session", newData);
      return;
    }
  },[])

  useEffect(() => {
    const roomId: string | undefined = window.location.hash.split("/").pop();
    console.log(roomId); 
    setRoomId(roomId);
    if(roomId){
      setSOpen(true);
      dispatch(toggleSharing(true));
    } else if(roomId === "/"){
      setSOpen(false);
      dispatch(toggleSharing(false));
    }
  },[sharing])

  useEffect(() => {

    socket.on("user-joined", ({ size }) => {
      setRoomSize(size);
    })

    socket.on("user-left", ({ size }) => {
      setRoomSize(size);
    })

    socket.on("drawing",({ line }) => {
      console.log("the drawn line",line);
      setElements((prev) => [...prev , line]); 
      console.log("lines",elements);
      console.log("drawing");
    })

  },[])

  const handleMouseDown = (e: any) => {
    if (e.evt.button !== 0) return;
    if (!isDrawing) return;
    const touches = e.evt instanceof TouchEvent ? e.evt.touches : null;
    isDrawing.current = true
    const stage: any = stageRef.current;
    const pointer = e.target.getStage().getPointerPosition()
    const x = (pointer.x - stage.x()) / stage.scaleX();
    const y = (pointer.y - stage.y()) / stage.scaleY();

    let newElement: any
    if(tool === "mouse"){
      // newElement = { type : "mouse"}
      return
    } else if (tool === "line") {
      newElement = { type: "line", points: [x, y] , strokeWidth : stroke , Opacity : opacity , lineColor: lineColor}
    } else if (tool === "rect" || tool === "square") {
      newElement = { type: "rect", x: x, y: y, width: 0, height: 0  , strokeWidth : stroke , Opacity : opacity , lineColor: lineColor}
    } else if (tool === "circle") {
      newElement = { type: "circle", x: x, y: y, radius: 0 , strokeWidth : stroke , Opacity : opacity , lineColor: lineColor}
    } else if(tool === "arrow"){
      newElement = {
        type: "arrow",
        x: x,
        y: y,
        points: [0, 0],
        strokeWidth: stroke/2,
        Opacity : opacity,
        lineColor : lineColor,
      };
    } else if(tool === "star"){
      newElement = { type: "star", x: x, y: y, innerRadius: 0, outerRadius: 0, strokeWidth: stroke, Opacity: opacity, lineColor };
    } else if(tool === "text") {
      // newElement = { type: "text", x: x, y: y, value: "" }
      newElement = {
          id: uuidv4(),
          x,
          type: "text",
          text: 'Double-click to edit',   // initial text
          y,
          fill: lineColor || "black", // text color
          opacity: opacity || 1,
          fontSize: 24,             // default font size
          draggable: true,          // optional if you want text to be draggable
       };
    }
    setElements([...elements, newElement]);
    }

  const handleMouseMove = (e: any) => {
    if (!isDrawing.current) return;
    const touches = e.evt instanceof TouchEvent ? e.evt.touches : null;
    const stage = e.target.getStage()
    const pointer = stage.getPointerPosition()
    const updated = [...elements]
    const current = updated[updated.length - 1]
    const x = (pointer.x - stage.x()) / stage.scaleX();
    const y = (pointer.y - stage.y()) / stage.scaleY();

    if (isDrawing && (!touches || touches.length === 1)) {
      console.log("moving done!",touches);
      if (tool === "line") {
      current.points = current.points.concat([x + 2, y + 2])
    } else if (tool === "rect" || tool === "square") {
      const w = x - current.x
      const h = y - current.y
      current.width = tool === "square" ? Math.min(w, h) : w
      current.height = tool === "square" ? Math.min(w, h) : h
    } else if (tool === "circle") {
      const dx = x - current.x
      const dy = y - current.y
      current.radius = Math.sqrt(dx * dx + dy * dy)
    } else if(tool === "arrow"){
      current.points = [0, 0, x - current.x, y - current.y];
    } else if (tool === "star") {
      const dx = x - (current.x || 0);
      const dy = y - (current.y || 0);
      const outerRadius = Math.sqrt(dx * dx + dy * dy);
      current.outerRadius = outerRadius;
      current.innerRadius = outerRadius / 2;
    } else if(tool === "text"){
      current.x = x;
      current.y = y;
    }

    setElements(updated)
    }

    if (isPanning && touches && touches.length === 2) {
      e.evt.preventDefault();
      console.log("touches",touches);
      const dx = touches[0].clientX - lastPanPos.x;
      const dy = touches[0].clientY - lastPanPos.y;
      setStagePos({ x: stagePos.x + dx, y: stagePos.y + dy });
      setLastPanPos({ x: touches[0].clientX, y: touches[0].clientY });
    }
  }

  const handleMouseUp = () => {
    isDrawing.current = false
    setIsPanning(false);
    const last = elements[elements.length - 1]
    console.log("last",last);
    localStorage.setItem("lines", JSON.stringify(elements));
    console.log("roomid is set",roomId);
    socket.emit("line-drawing", { roomId, line: last });
    if(tool && tool !== "mouse"){
      setTool("line")
    }
  }

  useEffect(() => {
    let anim: number;

    const draw = () => {
      if (pendingPoints.current.length > 0) {
        setElements((prev) => {
          const last = prev[prev.length - 1] as any;
          if (!last || last.type !== "line") return prev;
          const updatedLine = { ...last, points: last.points.concat(pendingPoints.current) };
          pendingPoints.current = [];
          return [...prev.slice(0, -1), updatedLine];
        });
      }
      anim = requestAnimationFrame(draw);
    };

    anim = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(anim);
  }, []);

  const handleWheel = (e: KonvaLib.KonvaEventObject<WheelEvent>) => {
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const scaleBy = 1.05;
    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newX = pointer.x - mousePointTo.x * newScale;
    const newY = pointer.y - mousePointTo.y * newScale;

    setStageScale(newScale);
    setStagePos({ x: newX, y: newY });
  };

  useEffect(() => {
    const stage = stageRef.current?.getStage();
    if (!stage) return;
    const container = stage.container();
    container.style.touchAction = "none"; 
  }, []);

  const handleStroke = (value: number) => {
    setStroke(value);
  }

  const handleOpacity = (value: number) => {
    if(value === 0){
      setOpacity(0)
      console.log("opacity in front",value)
    } else if(value === 100){
      setOpacity(1);
    } else {
      const temp = value / 100;
      console.log(temp);
      setOpacity(temp);
      console.log("opacity in front",value)
    }
  }

  const handleLineColor = (value: string) => {
    console.log("line color",value);
    setLineColor(value);
  }

  const handleSharing = (value: boolean) => {
    setSharing(value);
  }

  const handleOpen = (value: boolean) => {
    setSOpen(value);
  }

  const handleUndo = () => {
    if (elements.length === 0) return;
    const newLines = [...elements];
    const lastLine = newLines.pop();
    setElements(newLines);
    setRedoStack([...redoStack, lastLine]);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const newRedo = [...redoStack];
    const lineToRestore = newRedo.pop();
    setRedoStack(newRedo);
    setElements([...elements, lineToRestore]);
  };

  const handleDownload = () => {
    const stage = stageRef.current;
    if (!stage) return;

    const shapes = stage.find(".drawing");

    if(shapes.length === 0) return

    let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

    shapes.forEach(shape => {
      const box = shape.getClientRect({ relativeTo: stage });
      minX = Math.min(minX, box.x);
      minY = Math.min(minY, box.y);
      maxX = Math.max(maxX, box.x + box.width);
      maxY = Math.max(maxY, box.y + box.height);
    });

    const width = maxX - minX;
    const height = maxY - minY;
    
    const dataURL = stage.toDataURL({
      x: minX,
      y: minY,
      width,
      height,
      pixelRatio: 2, 
     });

    const link = document.createElement("a");
    link.download = "whiteboard.png";
    link.href = dataURL;
    link.click();
    toast.success("Downloaded successfully");
  }

  const getShapesBoundingBox = () => {
    const stage = stageRef.current;
    if(!stage) return;
    const shapes = stage.find(".drawing");
    if (shapes.length === 0) return null;

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    shapes.forEach((shape) => {
      const box = shape.getClientRect({ relativeTo: stage });
      minX = Math.min(minX, box.x);
      minY = Math.min(minY, box.y);
      maxX = Math.max(maxX, box.x + box.width);
      maxY = Math.max(maxY, box.y + box.height);
    });

    return { minX, minY, maxX, maxY };
  };

  const checkIfAway = () => {
    const stage = stageRef.current;
    if(!stage) return
    const box = getShapesBoundingBox();
    if (!box) return;

    const viewX = -stage.x() / stage.scaleX();
    const viewY = -stage.y() / stage.scaleY();
    const viewWidth = stage.width() / stage.scaleX();
    const viewHeight = stage.height() / stage.scaleY();

    const viewBox = {
      minX: viewX,
      minY: viewY,
      maxX: viewX + viewWidth,
      maxY: viewY + viewHeight,
    };

    const isInside =
      box.minX >= viewBox.minX &&
      box.maxX <= viewBox.maxX &&
      box.minY >= viewBox.minY &&
      box.maxY <= viewBox.maxY;

    setShowMoveButton(!isInside);
  };

  const handleMoveToShapes = () => {
  const stage = stageRef.current;
  if(!stage) return;
  const box = getShapesBoundingBox();
  if (!box) return;

  const width = box.maxX - box.minX;
  const height = box.maxY - box.minY;
  

  const containerWidth = stage.width();
  const containerHeight = stage.height();

  const scale = Math.min(
    containerWidth / width,
    containerHeight / height
  ) * 0.6; 

  const centerX = box.minX + width / 2;
  const centerY = box.minY + height / 2;

  const newX = containerWidth / 3 - centerX * scale;
  const newY = containerHeight / 3 - centerY * scale;

  stage.to({
    scaleX: scale,
    scaleY: scale,
    x: newX,
    y: newY,
    duration: 0.1,
    // easing: Konva.Easings.EaseInOut,
    onFinish: checkIfAway,
  });
};
  
  useEffect(() => {
    const stage = stageRef.current;
    if(!stage) return;
    stage.on("dragend", () => {
      checkIfAway();
    });

    stage.on("wheel", (e) => {
      e.evt.preventDefault();

      const oldScale = stage.scaleX();
      const pointer = stage.getPointerPosition();
      if(!pointer) return
      const scaleBy = 1.05;
      const direction = e.evt.deltaY > 0 ? 1 : -1;
      const newScale = direction > 0 ? oldScale / scaleBy : oldScale * scaleBy;

      const mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale,
      };

      stage.scale({ x: newScale, y: newScale });
      stage.position({
        x: pointer.x - mousePointTo.x,
        y: pointer.y - mousePointTo.y,
      });
      stage.batchDraw();
      checkIfAway();
    });

  // initial check
  checkIfAway();

  return () => {
    stage.off("dragend");
    stage.off("wheel");
  };
  }, [checkIfAway]);

  const handleErase = () => {
    setElements([]);
    localStorage.setItem("lines", JSON.stringify([]));
  }

  return (
    <div ref={containerRef} className={`h-screen w-full relative ${cursor ? "cursor-crosshair" : "cursor-mouse"} ${isTheme ? "bg-black text-white" : "bg-white text-black"} overflow-x-auto scrollbar-hide-x over`}>

      <Toaster />

      {showMoveButton && (
        <button onClick={handleMoveToShapes} className={`absolute bottom-30 sm:bottom-10 w-full text-center text-black z-9999 hover:cursor-pointer`}>Move to Shapes</button>
      )}

      {
        first && (
          <FistPage />
        )
      }

      <button className={`fixed bottom-35 font-bold right-10 z-999 ${isTheme ? "text-white" : "text-black"} text-md hover:cursor-pointer`}>
         {drawing ? <span onClick={() => {
          setIsDrawing((p) => !p)
          setTool("mouse");
          }}>Scroll</span> : <span onClick={() => {
            setIsDrawing((p) => !p)
            setTool("line")
            }}>Draw</span> }
      </button>

       <div className={`h-10 sm:h-14 px-4 xl:px-3 ${sharing ? "z-0" : "z-999"} your-div flex items-center justify-center sm:justify-between fixed top-4 w-full hover:cursor-pointer`}>
        <div ref={coRef} className="hidden sm:block" onClick={() => setOpen(!open)}>
          <Dots isTheme={isTheme}/>
        </div>
        <div className={`p-2 flex gap-2 shadow ${isTheme ? "bg-[#242329]" : "bg-white"} rounded-lg`}>
        <button onClick={() => {
          setTool("mouse")
          setIsOpen(false)
          setCursor(false)
          setFirst(false)
        }} className={`px-2 transition duration-150 ease-in py-1 rounded-xl hover:cursor-pointer ${sharing ? "z-0" : "z-999"} ${tool === "mouse" ? `${isTheme ? "bg-[#3c3b6e]" : "bg-[#E9E7FF] text-blue-700"}` : `${isTheme ? "hover:bg-[#4a497d]" : "hover:bg-[#f2f1fd] "}`}`}>{tool === "mouse" ? <i className="ri-cursor-fill"></i> : <i className="ri-cursor-line"></i>}</button>
        <button onClick={() => {
          setTool("line")
          setCursor(true)
          setFirst(false)
          if(!screenSize){
            setIsOpen(true)
          }
        }} className={`px-2 py-1 transition duration-150 ease-in rounded-xl hover:cursor-pointer ${sharing ? "z-0" : "z-999"} ${tool === "line" ? `${isTheme ? "bg-[#3c3b6e]" : "bg-[#E9E7FF] text-blue-700"}` :  `${isTheme ? "hover:bg-[#4a497d]" : "hover:bg-[#f2f1fd] "}` }`}><i className="ri-pencil-line"></i></button>
        <button onClick={() => {
          setTool("rect")
          setCursor(true)
          setFirst(false)
          if(!screenSize){
            setIsOpen(true)
          }
        }} className={`px-2 py-1 transition duration-150 ease-in rounded-xl hover:cursor-pointer ${sharing ? "z-0" : "z-999"} ${tool === "rect" ? `${isTheme ? "bg-[#3c3b6e]" : "bg-[#E9E7FF] text-blue-700"}` :  `${isTheme ? "hover:bg-[#4a497d]" : "hover:bg-[#f2f1fd] "}`}`}>{tool === "rect" ? <i className="ri-rectangle-fill"></i> : <i className="ri-rectangle-line"></i> }</button>
        <button onClick={() => {
          setTool("square")
          setCursor(true)
          setFirst(false)
          if(!screenSize){
            setIsOpen(true)
          }
        }} className={`px-2 py-1 transition duration-150 ease-in rounded-xl hover:cursor-pointer ${tool === "square" ? `${isTheme ? "bg-[#3c3b6e]" : "bg-[#E9E7FF] text-blue-700"}` : `${isTheme ? "hover:bg-[#4a497d]" : "hover:bg-[#f2f1fd] "}` }`}>{tool === "square" ? <i className="ri-square-fill"></i> : <i className="ri-square-line"></i>}</button>
        <button onClick={() => {
          setTool("circle")
          setCursor(true)
          setFirst(false)
          if(!screenSize){
            setIsOpen(true)
          }
        }} className={`px-2 py-1 transition duration-150 ease-in rounded-xl hover:cursor-pointer ${tool === "circle" ? `${isTheme ? "bg-[#3c3b6e]" : "bg-[#E9E7FF] text-blue-700"}` : `${isTheme ? "hover:bg-[#4a497d]" : "hover:bg-[#f2f1fd] "}`}`}>{tool === "circle" ? <i className="ri-circle-fill"></i> : <i className="ri-circle-line"></i>}</button>
        <button onClick={() => {
          setTool("arrow")
          setFirst(false)
          setCursor(true)
          if(!screenSize){
            setIsOpen(true)
          }
        }} className={`px-2 py-1 transition duration-150 ease-in rounded-xl hover:cursor-pointer ${tool === "arrow" ? `${isTheme ? "bg-[#3c3b6e]" : "bg-[#E9E7FF] text-blue-700"}` : `${isTheme ? "hover:bg-[#4a497d]" : "hover:bg-[#f2f1fd] "}`}`}><i className="ri-arrow-right-line"></i></button>
        <button onClick={() => {
          setTool("text")
          setFirst(false)
          // setCursor(true)
          if(!screenSize){
            setIsOpen(true)
          }
        }} className={`px-2 py-1 transition duration-150 ease-in rounded-xl hover:cursor-pointer ${tool === "text" ? `${isTheme ? "bg-[#3c3b6e]" : "bg-[#E9E7FF] text-blue-700"}` : `${isTheme ? "hover:bg-[#4a497d]" : "hover:bg-[#f2f1fd] "}`}`}>T</button>
        {/* <button onClick={() => {
          setTool("star")
          setCursor(true)
          if(!screenSize){
            setIsOpen(true)
          }
        }} className={`px-3 py-2 transition duration-150 ease-in rounded-xl hover:cursor-pointer ${tool === "star" ? `${isTheme ? "bg-[#3c3b6e]" : "bg-[#E9E7FF] text-blue-700"}` : `${isTheme ? "hover:bg-[#4a497d]" : "hover:bg-[#f2f1fd] "}`}`}>{tool === "star" ? <i className="ri-star-fill"></i> : <i className="ri-star-line"></i>}</button> */}
        </div>
      
        <div className="flex items-center gap-3">
          <button
          disabled={elements.length === 0}
          className={`${theme ? "text-black bg-white" : "text-white bg-black"} bg-black hidden sm:block px-2 py-1 rounded-full disabled:bg-gray-500 cursor-pointer`}
          onClick={handleDownload}
          >
            <i className="ri-file-download-fill"></i>
          </button>
          <button
          disabled={elements.length === 0}
          className={`${theme ? "text-black bg-white" : "text-white bg-black"} bg-black sm:block hidden px-2 py-1 rounded-xl disabled:bg-gray-500 cursor-pointer`}
          onClick={handleErase}
          >
            <i className="ri-eraser-fill"></i>
          </button>
          <div className={` ${sOpen ? "bg-[#00B894]" : "bg-[#6865db]"} hidden relative sm:block py-3 rounded-xl px-3 xl:py-2.5 xl:px-2.5 text-sm hover:cursor-pointer ${theme ? "text-black" : "text-white"}`}
        onClick={() => setSharing(true)}>
          Share
          {
            sOpen && <span className="absolute -bottom-2 -right-1 px-1.5 py-0.5 text-sm rounded-full bg-green-400 text-black">{roomSize}</span>
          }
          </div>
        </div>
       </div>

       <div className={`fixed ${sOpen ? "bg-[#00B894]" : "bg-[#6865db]"} your-div sm:hidden ${theme ? "text-black" : "text-white"}  top-20 right-2 px-2.5 py-1.5 rounded-xl ${sharing ? "z-0" : "z-99"} flex items-center justify-center`}
       onClick={() => setSharing(true)}>
        <i className={`ri-share-line ${isTheme ? "text-black" : "text-white"}`}></i>
          {
            sOpen && <span className="absolute -bottom-2 flex items-center justify-center -right-1 w-5 h-5 rounded-full bg-green-400 text-black">{roomSize}</span>
          }
       </div>
       <button
          disabled={elements.length === 0}
          className={`${theme ? "text-black bg-white" : "text-white bg-black"} z-999 sm:hidden fixed top-31 right-2 block px-2.5 py-1.5 rounded-xl disabled:bg-gray-500 cursor-pointer`}
          onClick={handleDownload}
          >
            <i className="ri-file-download-fill"></i>
       </button>
       <button
          disabled={elements.length === 0}
          className={`${theme ? "text-black bg-white" : "text-white bg-black"} z-999 bg-black sm:hidden fixed top-42 right-2 block px-2.5 py-1.5 rounded-xl disabled:bg-gray-500 cursor-pointer`}
          onClick={handleErase}
          >
            <i className="ri-eraser-fill"></i>
       </button>

       <div className={`block fixed bottom-5 ${sharing ? "z-0" : "z-999"} your-div rounded-md sm:hidden w-full px-4`}>
        <div className={`p-2 flex items-center justify-between rounded-md shadow z-99 ${isTheme ? "bg-[#242329]" : "bg-white"} w-full`}>
          <div className="" ref={coRef} onClick={() => setOpen(!open)}>
            <Dots isTheme={isTheme} />
          </div>
          <div className={`${isTheme ? "text-white" : "text-black"} ${sharing ? "z-0" : "z-99"}`} onClick={() => setIsOpen(!isOpen)}>
            <i className="ri-palette-fill text-lg"></i>
          </div>
          <div className="flex items-center justify-center gap-2">
            <button 
            disabled={elements.length === 0}
            onClick={handleUndo}
            className={`p-2 hover:cursor-pointer ${elements.length === 0 
      ? " text-gray-400 cursor-not-allowed" 
      : ""}`}
            ><i className="ri-corner-up-left-line text-md disabled:text-gray-300"></i></button>
            <button 
            disabled={redoStack.length === 0}
            onClick={handleRedo}
            className={`p-2 hover:cursor-pointer ${redoStack.length === 0 
      ? " text-gray-400 cursor-not-allowed" 
      : ""}`}
            ><i className="ri-corner-up-right-line text-md disabled:text-gray-300"></i></button>
          </div>
        </div>
       </div>

       <div className={`hidden sm:flex rounded-xl your-div items-center justify-center gap-2 fixed bottom-5 left-5 z-999 ${isTheme ? "bg-[#242329]" : "bg-[#ececf4]"}`}>
         <button 
          disabled={elements.length === 0}
          onClick={handleUndo}
          className={`p-1 hover:cursor-pointer ${elements.length === 0 
      ? " text-gray-400 cursor-not-allowed" 
      : ""}`}
          ><i className="ri-corner-up-left-line text-lg xl:text-sm disabled:text-gray-300"></i></button>
         <button 
          disabled={redoStack.length === 0}
          onClick={handleRedo}
          className={`p-1 hover:cursor-pointer ${redoStack.length === 0 
      ? " text-gray-400 cursor-not-allowed" 
      : ""}`}
         ><i className="ri-corner-up-right-line text-lg xl:text-sm disabled:text-gray-300"></i></button>
       </div>

       {
        sharing && (
          <Share isTheme={isTheme} share={handleSharing} socket={socket} isOpen={handleOpen}/>
        )
       }

       {
        isOpen && (
          <div className={`flex ${screenSize ? "w-full z-9999" : "z-99"} items-center justify-center sm:justify-start fixed sm:top-25 sm:left-5 max-sm:bottom-18 rounded-xl`}>
            <ContainerBox isTheme={isTheme} strokeWidth={handleStroke} opacity={handleOpacity} LineColor={handleLineColor}/>
          </div>
        )
       }

       {
        open && (
          <div ref={conRef} className={`${open ? "z-99" : "z-0"} your-div ${screenSize ? "w-full" : ""} fixed max-sm:bottom-18 sm:top-18 rounded-xl z-99 sm:left-5 flex items-center justify-center sm:justify-start`}>
            <div className={`${isTheme ? "bg-[#242329]" : "bg-white"} p-3 rounded-md shadow w-[91%] sm:w-[27vw] md:[22vw] lg:w-[19vw] xl:w-[15vw] h-[30vh] sm:h-[40vh]`}>
               <div className="flex items-center justify-between w-full">
              <h2 className="text-md">Theme</h2>
              <div className="flex gap-1">
                <span className={`${theme ? "" : "bg-[#6865db] text-white"} rounded-xl px-2 py-1 hover:cursor-pointer flex items-center justify-center`} onClick={() => {
                  dispatch(toggleTheme(false))
                  setTheme(false)
                  }}><i className="ri-sun-line"></i></span>
                <span className={`${theme ? "bg-[#6865db]" : ""} rounded-xl px-2 py-1 hover:cursor-pointer flex items-center justify-center`} onClick={() => {
                  dispatch(toggleTheme(true))
                  setTheme(true)
                }}><i className="ri-moon-line"></i></span>
              </div>
               </div>
            </div>
          </div>
        )
       }

       {size.width > 0  && (
        <Stage
          ref={stageRef}
          scaleX={stageScale}
          scaleY={stageScale}
          x={stagePos.x}
          y={stagePos.y}
          draggable={!drawing}
          onWheel={handleWheel}
          width={canvasSize.width}
          height={canvasSize.height}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onPointerDown={handleMouseDown}
          onPointerMove={handleMouseMove}
          onPointerUp={handleMouseUp}
          // pixelRatio={1}  
          style={{ touchAction : "none" }}
        >
            <Layer>
              {elements.map((el, i) => {
                if (el?.type === "line") {
                  return (
                    <Line
                      name="drawing"
                      key={i}
                      points={el.points}
                      stroke={el.lineColor ? el.lineColor : isTheme ? "white" : "black"}
                      // stroke={isTheme ? "white" : "black"}
                      strokeWidth={el.strokeWidth}
                      tension={0.5}
                      lineCap="round"
                      opacity={el.Opacity}
                      draggable
                    />
                  )
                } else if (el?.type === "rect") {
                  return (
                    <Rect
                      name="drawing"
                      key={i}
                      x={el.x}
                      y={el.y}
                      width={el.width}
                      height={el.height}
                      stroke={el.lineColor ? el.lineColor : isTheme ? "white" : "black"}
                      strokeWidth={el.strokeWidth / 2}
                      cornerRadius={30}
                      opacity={el.Opacity}
                      draggable
                    />
                  )
                } else if (el?.type === "square") {
                  return (
                    <Rect
                      name="drawing"
                      key={i}
                      x={el.x}
                      y={el.y}
                      width={el.width}
                      height={el.height}
                      stroke={el.lineColor ? el.lineColor : isTheme ? "white" : "black"}
                      strokeWidth={el.strokeWidth / 2}
                      cornerRadius={30}
                      opacity={el.Opacity}
                      draggable
                    />
                  )
                } else if (el?.type === "circle") {
                  return (
                    <Circle
                      name="drawing"
                      key={i}
                      x={el.x}
                      y={el.y}
                      radius={el.radius}
                      stroke={el.lineColor ? el.lineColor : isTheme ? "white" : "black"}
                      strokeWidth={el.strokeWidth / 2}
                      opacity={el.Opacity}
                      draggable
                    />
                  )
                } else if(el?.type === "arrow") {
                  return (
                    <Arrow
                     name="drawing"
                     key={i}
                     x={el.x}
                     y={el.y}
                     points={el.points}
                     pointerLength={10}
                     pointerWidth={10}
                     fill={el.lineColor ? el.lineColor : theme ? "white" : "black"}
                     stroke={el.lineColor ? el.lineColor : theme ? "white" : "black"}
                     strokeWidth={el.strokeWidth / 2}
                     opacity={el.Opacity}
                     lineCap="round"
                     draggable
                     />
                  )
                } 
                // else if(el?.type === "text"){
                //   return (
                //     <Text 
                //     key={i}
                //     x={el.x}
                //     y={el.y}
                //     text={el.text}
                //     fontSize={24}
                //     draggable
                //     fill={el.lineColor ? el.lineColor : theme ? "white" : "black"}
                //     />
                //   )
                // }
                // else if(el?.type === "star"){
                //   <Star
                //   name="drawing"
                //   key={i}
                //   x={el.x}
                //   y={el.y}
                //   numPoints={el.numPoints}
                //   innerRadius={el.innerRadius}
                //   outerRadius={el.outerRadius}
                //   stroke={el.lineColor ? el.lineColor : theme ? "white" : "black"}
                //   strokeWidth={el.strokeWidth}
                //   opacity={el.Opacity}
                //   fill={undefined}
                // />
                // }
              })}
            </Layer>
        </Stage>
         )}
         
    </div>
  )
}

export default Konva