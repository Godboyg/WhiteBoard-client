import React, { useEffect, useState } from 'react'

type props = {
    isTheme: boolean;
    strokeWidth: (value : number) => void;
    opacity: (value: number) => void;
    LineColor: (value: string) => void;
}

function ContainerBox({ isTheme , strokeWidth , opacity , LineColor} :  props) {

    const [stroke , setStroke] = useState<4 | 8 | 16>(4)
    const [value , setValue] = useState(100)
    const [input , setInput] = useState("");
    const [color , setColor] = useState("")
    const [error , setError] = useState("")

    console.log("value",value)

    useEffect(() => {
      if(input.length === 0){
        setColor("");
        setError("");
        // LineColor("");
      }
      if(LineColor.length === 0){
        setColor("");
      }
    },[input])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      console.log(e.target.value);
      setInput(e.target.value);
      console.log("size",e.target.value.length);
      if(e.target.value.length === 0){
        setColor("");
        setError("");
        LineColor("");
      } else {
        setTimeout(async() => {
        if(e.target.value.length > 0){
          const res = await fetch("/api/ai-color", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: input }),
          });

          const data: {hex : string} = await res.json();
          console.log("data",data.hex);
          if(data.hex){
            setColor(data.hex);
            LineColor(data.hex);
          } else {
            setError("Not Found")
          }
        }
      },200)
      }
    }

  return (
    <div className={`${isTheme ? "bg-[#242329]" : "bg-white"} z-9999 p-3 rounded-md flex flex-col justify-start gap-4 shadow w-[91%] sm:w-[25vw] md:[20vw] lg:w-[16vw] xl:w-[13vw] h-[45vh]`}>
      <div className="flex flex-col gap-2">
        <h2 className='text-sm font-sans'>Stroke Width</h2>
        <div className="flex gap-2">
            <div className={`flex p-3 h-10 hover:cursor-pointer w-10 rounded-lg items-center justify-center ${isTheme ? `${stroke === 4 ? "bg-[#3c3b6e] text-blue-700" : "bg-[#1c1c2b]"}`  : `${stroke === 4 ? "bg-[#E9E7FF] text-blue-700" : "bg-[#f8f8fb]"}` }`} onClick={() => {
                setStroke(4)
                strokeWidth(4)
            }}>
                <span className={`w-5 h-[2px] rounded-md ${isTheme ? "bg-white" : "bg-blue-700"}`}></span>
            </div>
            <div className={`flex p-3 h-10 hover:cursor-pointer w-10 rounded-lg items-center justify-center ${isTheme ? `${stroke === 8 ? "bg-[#3c3b6e] text-blue-700" : "bg-[#1c1c2b]"}` : `${stroke === 8 ? "bg-[#E9E7FF] text-blue-700" : "bg-[#f8f8fb]"}` }`} onClick={() => {
                setStroke(8)
                strokeWidth(8)
            }}>
                <span className={`w-5 h-[2.5px] rounded-md ${isTheme ? "bg-white" : "bg-blue-700"}`}></span>
            </div>
            <div className={`flex p-3 h-10 hover:cursor-pointer w-10 rounded-lg items-center justify-center ${isTheme ? `${stroke === 16 ? "bg-[#3c3b6e] text-blue-700" : "bg-[#1c1c2b]"}` : `${stroke === 16 ? "bg-[#E9E7FF] text-blue-700" : "bg-[#f8f8fb]"}` }`} onClick={() => {
                setStroke(16)
                strokeWidth(16)
            }}>
                <span className={`w-5 h-[4px] rounded-full ${isTheme ? "bg-white" : "bg-blue-700"}`}></span>
            </div>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <h2 className='text-sm font-sans'>Opacity</h2>
        <div className="">
            <div className="">
                <input
             type="range"
             min="0"
             max="100"
             step={10}
             value={value}
             onChange={(e) => {
                setValue(Number(e.target.value))
                opacity(Number(e.target.value))
             }}
             className="w-full h-2 rounded-lg appearance-none cursor-pointer slider-thumb"
             style={{
               background: `linear-gradient(to right, #c9c9f9 ${value}%, #f5f5f8 ${value}%)`,
             }}
             />
            </div> 
            <div className="flex items-center justify-between">
                <span className='ml-1'>0</span>
                <span className={`${value === 10 ? "opacity-100" : "opacity-0"}`}>1</span>
                <span className={`${value === 20 ? "opacity-100" : "opacity-0"}`}>2</span>
                <span className={`${value === 30 ? "opacity-100" : "opacity-0"}`}>3</span>
                <span className={`${value === 40 ? "opacity-100" : "opacity-0"}`}>4</span>
                <span className={`${value === 50 ? "opacity-100" : "opacity-0"}`}>5</span>
                <span className={`${value === 60 ? "opacity-100" : "opacity-0"}`}>6</span>
                <span className={`${value === 70 ? "opacity-100" : "opacity-0"}`}>7</span>
                <span className={`${value === 80 ? "opacity-100" : "opacity-0"}`}>8</span>
                <span className={`${value === 90 ? "opacity-100" : "opacity-0"}`}>9</span>
                <span>10</span>
            </div>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <h2 className='text-sm font-sans'>Choose Color</h2>
        {
          error && <p className='text-md text-red-500'>error:{error}</p>
        }
        <div>
          <input 
            type="text"
            placeholder='Type Color..'
            value={input} 
            onChange={handleChange}
            className={`px-3 py-2 w-full shadow shadow-cyan-500 ${isTheme ? "text-white" : "text-black"} rounded-md outline-none`}
            style={{ backgroundColor : color || ""}}
            />
        </div>
      </div>
    </div>
  )
}

export default ContainerBox