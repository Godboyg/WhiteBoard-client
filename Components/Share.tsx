import React, { useEffect, useRef, useState } from 'react'
import { Socket } from 'socket.io-client';
import { useDispatch, useSelector } from 'react-redux';
// import { toggleSharing } from '@/store/themeSlice';
import { RootState } from '@/store';

type props = {
    isTheme: boolean;
    share: (value : boolean) => void;
    socket: Socket
    isOpen: (value: boolean) => void
}

function Share({ isTheme , share , socket , isOpen}: props) {

    const containerRef = useRef<HTMLDivElement | null>(null) 
    const [copy , setCopy] = useState(false);
    const [open , setOpen] = useState(false)
    const dispatch = useDispatch();

    const sh = useSelector((state: RootState) => state.theme.Share);
    console.log(sh)

    useEffect(() => {

        const handleMouse = (e: Event) => {
            const target = e.target as HTMLDivElement;
            if(containerRef.current && !containerRef.current.contains(target)){
                share(false);
            }
        }

        document.addEventListener("mousedown",handleMouse);

        // dispatch(toggleSharing(false));

    },[])

    function generateRoomId(length = 8) {
       const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
       let roomId = '';
       for (let i = 0; i < length; i++) {
         roomId += chars.charAt(Math.floor(Math.random() * chars.length));
       }
       return roomId;
    }


    const handleStartSession = () => {
        const roomId = generateRoomId();
        history.pushState({}, "" , `/#room/${roomId}`);
        let newData: any = { roomId: roomId , socket: socket.id};
        if(socket.id){
            socket.emit("join-session", newData);
            setOpen(true);
            isOpen(true)
            // dispatch(toggleSharing(true));

        } else {
            history.pushState({} , "" , "/");
            alert("error while joinning the session");
        }
    }

    const copyRoomLink = () => {
        const link = window.location.href;
        navigator.clipboard.writeText(link)
          .then(() => {
            setCopy(true)
            setTimeout(() => {
                setCopy(false)
            }, 500);
           })
          .catch(err => console.error("Failed to copy: ", err));
    }

    const handleStopSession = () => {
        history.pushState({} , "" , "/");
        setOpen(false);
        isOpen(false);
        // dispatch(toggleSharing(false))
    }
     
  return (
    <div className='h-screen hover:cursor-pointer w-full flex fixed top-0 left-0 z-999 items-center justify-center bg-black/50'>
      <div ref={containerRef} className={`h-full sm:h-[80vh] rounded-lg shadow w-full sm:w-[75vw] md:w-[68vw] lg:w-[60vw] xl:w-[45vw] ${isTheme ? "bg-black" : "bg-white"}`}>
        <span className='text-xl absolute top-8 right-10 block sm:hidden' onClick={() => share(false)}><i className="ri-close-fill"></i></span>
        {
            sh ? (
                <>
                <div className="flex hover:cursor-pointer items-center justify-center gap-4 mt-15 sm:mt-10">
                    <div className="w-[85%] flex flex-col gap-4">
                        <h2 className='text-purple-700 font-medium text-xl'>Live collaboration</h2>
                    <div className="flex flex-col gap-3 border-b border-gray-500 h-28">
                        <h3 className='text-md'>Link</h3>
                        <div className="flex items-center justify-between">
                            <p className='w-[50%] sm:w-[70%] overflow-auto sm:overflow-hidden h-14 px-5 rounded-lg bg-[#F5F3FF] flex items-center justify-start'>{window.location.href}</p>
                            <p className={`hover:cursor-pointer ${isTheme ? "text-black" : "text-white"}`}
                            onClick={copyRoomLink}>{copy ? <span className='bg-green-500 rounded-xl px-6 py-4'>Copied</span> : <span className='bg-[#6865db] px-6 py-4 rounded-xl'>Copy Link</span>}</p>
                        </div>
                        <div className="flex flex-col gap-5 mt-5">
                            <p className='font-light text-sm'>🔒 Don't worry, the session is end-to-end encrypted, and fully private. Not even our server can see what you draw.</p>
                            <p className='font-extralight'>Stopping the session will disconnect you from the room, but you'll be able to continue working with the scene, locally. Note that this won't affect other people, and they'll still be able to collaborate on their version.</p>
                        </div>
                        <div className="flex items-center justify-center">
                            <div className={`px-5 py-4 font-semibold hover:cursor-pointer flex items-center justify-center border-1 border-red-500 mt-3 w-44 h-16 rounded-xl text-red-500`}
                             onClick={handleStopSession}>
                              Stop Session
                             </div>
                        </div>
                    </div>
                    </div>
                </div>
                </>
            ) : (
                <>
                <div className=" flex justify-center w-full">
                    <div className="flex flex-col items-center w-[80%] gap-5 mt-15 sm:mt-10">
                    <h2 className='text-purple-700 font-medium text-xl sm:text-[2.3vw] md:text-[1.8vw] lg:text-[2vw] xl:text-[1.4vw] text-center'>Live collaboration</h2>
                    <p className='font-normal mt-2 text-center'>Invite people to collaborate on your drawing.</p>
                    <p className='font-normal text-center'>Don't worry, the session is end-to-end encrypted, and fully private. Not even our server can see what you draw.</p>
                    <div className={`px-5 py-4 font-semibold hover:cursor-pointer flex items-center justify-center bg-[#6865db] mt-3 w-44 h-16 rounded-xl ${isTheme ? "text-black" : "text-white"}`}
                    onClick={handleStartSession}>
                        Start Session
                    </div>
                </div>
                </div>
                </>
            )
        }
      </div>
    </div>
  )
}

export default Share
