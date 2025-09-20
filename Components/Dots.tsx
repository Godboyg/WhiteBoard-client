import { RootState } from '@/store'
import React from 'react'
import { useSelector } from 'react-redux'

type props = {
  isTheme: boolean;
}

function Dots({ isTheme }: props) {

  return (
    <div className={`${isTheme ? "bg-[#242329]" : "bg-[#ececf4]"} hover:cursor-pointer flex items-center rounded-lg w-8 sm:w-11 py-2 px-1 sm:p-3 flex-col justify-center gap-[3px]`}>
      <span className={`w-3 sm:w-3.5 h-0.5 ${isTheme ? "bg-white" : "bg-black"}`}></span>
      <span className={`w-3 sm:w-3.5 h-0.5 ${isTheme ? "bg-white" : "bg-black"}`}></span>
      <span className={`w-3 sm:w-3.5 h-0.5 ${isTheme ? "bg-white" : "bg-black"}`}></span>
    </div>
  )
}

export default Dots
