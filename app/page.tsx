"use client"
import { Stage, Layer, Line, Rect, Circle , Arrow , Star } from "react-konva"
import { useEffect, useRef, useState } from "react"
import 'remixicon/fonts/remixicon.css'
import { useDispatch , useSelector } from "react-redux"
import { RootState } from "@/store"
import Dots from "@/Components/Dots"
import { toggleTheme , toggleSharing } from "@/store/themeSlice"
import ContainerBox from "@/Components/ContainerBox"
import Share from "@/Components/Share"
import { io } from "socket.io-client"
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast"
import FistPage from "@/Components/FistPage"

const socket = io("http://localhost:4000")

function Konva() {

  const [elements, setElements] = useState<any[]>([])
  const [redoStack, setRedoStack] = useState<any[]>([]);
  const [open , setOpen] = useState(false);
  const stageRef = useRef<any>(null)
  const [isTheme , setTheme] = useState(false)
  const [first , setFirst] = useState(true);
  const [stroke , setStroke] = useState(4)
  const [cursor , setCursor] = useState(false);
  const [sharing , setSharing] = useState(false);
  const [roomId , setRoomId] = useState<string | undefined>("")
  const [roomSize , setRoomSize] = useState<number>();
  const [sOpen , setSOpen] = useState(false);
  const [opacity , setOpacity] = useState<number>(1)
  const [lineColor , setLineColor] = useState("");
  const [screenSize , setScreenSize] = useState<boolean>(false);
  const [isOpen , setIsOpen] = useState(false);
  const [tool, setTool] = useState<"mouse" | "line" | "rect" | "circle" | "square" | "arrow" | "star">("mouse")
  const [size, setSize] = useState({ width: 0, height: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const isDrawing = useRef(false)
  const coRef = useRef<HTMLDivElement | null>(null)
  const conRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

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
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });

      let resizeTimer: any;
      const debouncedResize = () => {
       clearTimeout(resizeTimer);
       resizeTimer = setTimeout(handleReSize, 150); 
      };
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
    if(socket.id){
      toast.success("conected" , { duration : 1000});
    } else {
      toast.error("try again!" , {duration: 1000});
    }
    const roomId: string | undefined = window.location.hash.split("/").pop();
    let newData: any = { roomId: roomId , socket: socket.id }
    if(roomId && socket){
      socket.emit("join-session", newData);
    }
  },[])

  useEffect(() => {
    const roomId: string | undefined = window.location.hash.split("/").pop();
    console.log(roomId); 
    setRoomId(roomId);
    if(roomId){
      setSOpen(true);
    } else if(roomId === "/"){
      setSOpen(false);
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
    isDrawing.current = true
    const pos = e.target.getStage().getPointerPosition()

    let newElement: any
    if(tool === "mouse"){
      // newElement = { type : "mouse"}
      return
    } else if (tool === "line") {
      newElement = { type: "line", points: [pos.x, pos.y] , strokeWidth : stroke , Opacity : opacity , lineColor: lineColor}
    } else if (tool === "rect" || tool === "square") {
      newElement = { type: "rect", x: pos.x, y: pos.y, width: 0, height: 0  , strokeWidth : stroke , Opacity : opacity , lineColor: lineColor}
    } else if (tool === "circle") {
      newElement = { type: "circle", x: pos.x, y: pos.y, radius: 0 , strokeWidth : stroke , Opacity : opacity , lineColor: lineColor}
    } else if(tool === "arrow"){
      newElement = {
        type: "arrow",
        x: pos.x,
        y: pos.y,
        points: [0, 0],
        strokeWidth: stroke/2,
        Opacity : opacity,
        lineColor : lineColor,
      };
    } else if(tool === "star"){
      newElement = { type: "star", x: pos.x, y: pos.y, innerRadius: 0, outerRadius: 0, strokeWidth: stroke, Opacity: opacity, lineColor };
    }

    setElements([...elements, newElement]);
  }

  const handleMouseMove = (e: any) => {
    if (!isDrawing.current) return
    const stage = e.target.getStage()
    const point = stage.getPointerPosition()
    const updated = [...elements]
    const current = updated[updated.length - 1]

    if (tool === "line") {
      current.points = current.points.concat([point.x + 2, point.y + 2])
    } else if (tool === "rect" || tool === "square") {
      const w = point.x - current.x
      const h = point.y - current.y
      current.width = tool === "square" ? Math.min(w, h) : w
      current.height = tool === "square" ? Math.min(w, h) : h
    } else if (tool === "circle") {
      const dx = point.x - current.x
      const dy = point.y - current.y
      current.radius = Math.sqrt(dx * dx + dy * dy)
    } else if(tool === "arrow"){
      current.points = [0, 0, point.x - current.x, point.y - current.y];
    } else if (tool === "star") {
      const dx = point.x - (current.x || 0);
      const dy = point.y - (current.y || 0);
      const outerRadius = Math.sqrt(dx * dx + dy * dy);
      current.outerRadius = outerRadius;
      current.innerRadius = outerRadius / 2;
    }

    setElements(updated)
  }

  const handleMouseUp = () => {
    isDrawing.current = false
    const last = elements[elements.length - 1]
    console.log("elements",JSON.stringify(elements));
    localStorage.setItem("lines", JSON.stringify(elements));
    console.log("roomid is set",roomId);
    socket.emit("line-drawing", { roomId, line: last });
    if(tool && tool !== "mouse"){
      setTool("line")
    }
  }

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

  return (
    <div ref={containerRef} className={`h-full w-full ${cursor ? "cursor-crosshair" : "cursor-mouse"} ${isTheme ? "bg-black text-white" : "bg-white text-black"} overflow-x-auto scrollbar-hide-x over`}>

      <Toaster />

      {
        first && (
          <FistPage />
        )
      }

       <div className={`h-10 sm:h-14 px-4 ${sharing ? "z-0" : "z-999"} flex items-center justify-center sm:justify-between fixed top-4 w-full`}>
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
        {/* <button onClick={() => {
          setTool("star")
          setCursor(true)
          if(!screenSize){
            setIsOpen(true)
          }
        }} className={`px-3 py-2 transition duration-150 ease-in rounded-xl hover:cursor-pointer ${tool === "star" ? `${isTheme ? "bg-[#3c3b6e]" : "bg-[#E9E7FF] text-blue-700"}` : `${isTheme ? "hover:bg-[#4a497d]" : "hover:bg-[#f2f1fd] "}`}`}>{tool === "star" ? <i className="ri-star-fill"></i> : <i className="ri-star-line"></i>}</button> */}
        </div>
        <div className={` ${sOpen ? "bg-[#00B894]" : "bg-[#6865db]"} hidden relative sm:block py-2 rounded-xl px-2 text-md hover:cursor-pointer ${theme ? "text-black" : "text-white"}`}
        onClick={() => setSharing(true)}>
          Share
          {
            roomSize && <span className="absolute -bottom-2 -right-1 px-1 py-0.5 text-sm rounded-full bg-green-400 text-black">{roomSize}</span>
          }
        </div>
       </div>

       <div className={`fixed ${sOpen ? "bg-[#00B894]" : "bg-[#6865db]"} sm:hidden ${theme ? "text-black" : "text-white"}  top-20 right-2 px-2 py-1 rounded-xl ${sharing ? "z-0" : "z-99"} flex items-center justify-center`}
       onClick={() => setSharing(true)}>
        <i className={`ri-share-line ${isTheme ? "text-black" : "text-white"}`}></i>
       </div>

       <div className={`block fixed bottom-5 ${sharing ? "z-0" : "z-999"} rounded-md sm:hidden w-full px-4`}>
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

       <div className={`hidden sm:flex rounded-xl items-center justify-center gap-2 fixed bottom-5 left-5 z-999 ${isTheme ? "bg-[#242329]" : "bg-[#ececf4]"}`}>
         <button 
          disabled={elements.length === 0}
          onClick={handleUndo}
          className={`p-2 hover:cursor-pointer ${elements.length === 0 
      ? " text-gray-400 cursor-not-allowed" 
      : ""}`}
          ><i className="ri-corner-up-left-line text-lg disabled:text-gray-300"></i></button>
         <button 
          disabled={redoStack.length === 0}
          onClick={handleRedo}
          className={`p-2 hover:cursor-pointer ${redoStack.length === 0 
      ? " text-gray-400 cursor-not-allowed" 
      : ""}`}
         ><i className="ri-corner-up-right-line text-lg disabled:text-gray-300"></i></button>
       </div>

       {
        sharing && (
          <Share isTheme={isTheme} share={handleSharing} socket={socket} isOpen={handleOpen}/>
        )
       }

       {
        isOpen && (
          <div className={`flex ${screenSize ? "w-full" : ""} z-99 items-center justify-center sm:justify-start fixed sm:top-25 sm:left-5 max-sm:bottom-18 rounded-xl`}>
            <ContainerBox isTheme={isTheme} strokeWidth={handleStroke} opacity={handleOpacity} LineColor={handleLineColor}/>
          </div>
        )
       }

       {
        open && (
          <div ref={conRef} className={`${open ? "z-99" : "z-0"} ${screenSize ? "w-full" : ""} fixed max-sm:bottom-18 sm:top-18 rounded-xl z-99 sm:left-5 flex items-center justify-center sm:justify-start`}>
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

      <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
         <div style={{ flex: 1, overflow: "hidden" }}>
           {size.width > 0  && (
        <Stage
          ref={stageRef}
          width={window.innerWidth}
          height={window.innerHeight - 60}
          onMouseDown={handleMouseDown}
          onMousemove={handleMouseMove}
          onMouseup={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
          className="over"
        >
            <Layer>
              {elements.map((el, i) => {
                if (el?.type === "line") {
                  return (
                    <Line
                      key={i}
                      points={el.points}
                      stroke={el.lineColor ? el.lineColor : isTheme ? "white" : "black"}
                      // stroke={isTheme ? "white" : "black"}
                      strokeWidth={el.strokeWidth}
                      tension={0.5}
                      lineCap="round"
                      opacity={el.Opacity}
                    />
                  )
                } else if (el?.type === "rect") {
                  return (
                    <Rect
                      key={i}
                      x={el.x}
                      y={el.y}
                      width={el.width}
                      height={el.height}
                      stroke={el.lineColor ? el.lineColor : isTheme ? "white" : "black"}
                      strokeWidth={el.strokeWidth}
                      cornerRadius={20}
                      opacity={el.Opacity}
                    />
                  )
                } else if (el?.type === "square") {
                  return (
                    <Rect
                      key={i}
                      x={el.x}
                      y={el.y}
                      width={el.width}
                      height={el.height}
                      stroke={el.lineColor ? el.lineColor : isTheme ? "white" : "black"}
                      strokeWidth={el.strokeWidth}
                      cornerRadius={20}
                      opacity={el.Opacity}
                    />
                  )
                } else if (el?.type === "circle") {
                  return (
                    <Circle
                      key={i}
                      x={el.x}
                      y={el.y}
                      radius={el.radius}
                      stroke={el.lineColor ? el.lineColor : isTheme ? "white" : "black"}
                      strokeWidth={el.strokeWidth}
                      opacity={el.Opacity}
                    />
                  )
                } else if(el?.type === "arrow") {
                  return (
                    <Arrow
                     key={i}
                     x={el.x}
                     y={el.y}
                     points={el.points}
                     pointerLength={10}
                     pointerWidth={10}
                     fill={el.lineColor ? el.lineColor : theme ? "white" : "black"}
                     stroke={el.lineColor ? el.lineColor : theme ? "white" : "black"}
                     strokeWidth={el.strokeWidth}
                     opacity={el.Opacity}
                     lineCap="round"
                     />
                  )
                } 
                // else if(el?.type === "star"){
                //   <Star
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
      </div>
    </div>
  )
}

export default Konva